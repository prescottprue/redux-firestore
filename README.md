# redux-firestore

[![NPM version][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![License][license-image]][license-url]
[![Code Style][code-style-image]][code-style-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Build Status][travis-image]][travis-url]
[![Code Coverage][coverage-image]][coverage-url]

[![Gitter][gitter-image]][gitter-url]
<!-- [![Quality][quality-image]][quality-url] -->

> Redux bindings for Firestore. Provides low-level API used in other libraries such as [react-redux-firebase](https://github.com/prescottprue/react-redux-firebase)

## Installation

```sh
npm install redux-firestore --save
```

This assumes you are using [npm](https://www.npmjs.com/) as your package manager.

If you're not, you can access the library on [unpkg](https://unpkg.com/redux-firestore@latest/dist/redux-firestore.min.js), download it, or point your package manager to it. Theres more on this in the [Builds section below](#builds)

## Complementary Package

Most likely, you'll want react bindings, for that you will need [react-redux-firebase](https://github.com/prescottprue/react-redux-firebase). You can install the current version it by running:

```sh
npm install --save react-redux-firebase
```

[react-redux-firebase](https://github.com/prescottprue/react-redux-firebase) provides [`withFirestore`](http://react-redux-firebase.com/docs/api/withFirestore.html) and [`firestoreConnect`](http://react-redux-firebase.com/docs/api/firestoreConnect.html) higher order components, which handle automatically calling `redux-firestore` internally based on component's lifecycle (i.e. mounting/un-mounting)

## Use

```javascript
import { createStore, combineReducers, compose } from 'redux'
import { reduxFirestore, firestoreReducer } from 'redux-firestore'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import 'firebase/firestore'

const firebaseConfig = {} // from Firebase Console
const rfConfig = {} // optional redux-firestore Config Options

// Initialize firebase instance
firebase.initializeApp(firebaseConfig)
// Initialize Cloud Firestore through Firebase
firebase.firestore();

// Add reduxFirestore store enhancer to store creator
const createStoreWithFirebase = compose(
  reduxFirestore(firebase, rfConfig), // firebase instance as first argument, rfConfig as optional second
)(createStore)

// Add Firebase to reducers
const rootReducer = combineReducers({
  firestore: firestoreReducer
})

// Create store with reducers and initial state
const initialState = {}
const store = createStoreWithFirebase(rootReducer, initialState)
```

Then pass store to your component's context using [react-redux's `Provider`](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store):

```js
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

render(
  <Provider store={store}>
    <MyRootComponent />
  </Provider>,
  rootEl
)
```

### Call Firestore

#### Firestore Instance

##### Functional Components

It is common to make react components "functional" meaning that the component is just a function instead of being a `class` which `extends React.Component`. This can be useful, but can limit usage of lifecycle hooks and other features of Component Classes. [`recompose` helps solve this](https://github.com/acdlite/recompose/blob/master/docs/API.md) by providing Higher Order Component functions such as `withContext`, `lifecycle`, and `withHandlers`.

```js
import { connect } from 'react-redux'
import {
  compose,
  withHandlers,
  lifecycle,
  withContext,
  getContext
} from 'recompose'

const withStore = compose(
  withContext({ store: PropTypes.object }, () => {}),
  getContext({ store: PropTypes.object }),
)

const enhance = compose(
  withStore,
  withHandlers({
    loadData: props => () => props.store.firestore.get('todos'),
    onDoneClick: props => (key, done = false) =>
      props.store.firestore.update(`todos/${key}`, { done }),
    onNewSubmit: props => newTodo =>
      props.store.firestore.add('todos', { ...newTodo, owner: 'Anonymous' }),
  }),
  lifecycle({
    componentDidMount(props) {
      props.loadData()
    }
  }),
  connect(({ firebase }) => ({ // state.firebase
    todos: firebase.ordered.todos,
  }))
)

export default enhance(SomeComponent)
```

For more information [on using recompose visit the docs](https://github.com/acdlite/recompose/blob/master/docs/API.md)

##### Component Class

```js
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { watchEvents, unWatchEvents } from './actions/query'
import { getEventsFromInput, createCallable } from './utils'

class Todos extends Component {
  static contextTypes = {
    store: PropTypes.object.isRequired
  }

  componentDidMount () {
    const { firestore } = this.context.store
    firestore.get('todos')
  }

  render () {
    return (
      <div>
        {
          todos.map(todo => (
            <div key={todo.id}>
              {JSON.stringify(todo)}
            </div>
          ))
        }
      </div>
    )
  }
}

export default connect((state) => ({
  todos: state.firestore.ordered.todos
}))(Todos)
```
### API
The `store.firestore` instance created by the `reduxFirestore` enhancer extends [Firebase's JS API for Firestore](https://firebase.google.com/docs/reference/js/firebase.firestore). This means all of the methods regularly available through `firebase.firestore()` and the statics available from `firebase.firestore` are available. Certain methods (such as `get`, `set`, and `onSnapshot`) have a different API since they have been extended with action dispatching. The methods which have dispatch actions are listed below:

#### Actions

##### get
```js
store.firestore.get({ collection: 'cities' }),
// store.firestore.get({ collection: 'cities', doc: 'SF' }), // doc
```

##### set
```js
store.firestore.set({ collection: 'cities', doc: 'SF' }, { name: 'San Francisco' }),
```

##### add
```js
store.firestore.add({ collection: 'cities' }, { name: 'Some Place' }),
```

##### update
```js
const itemUpdates =  {
  some: 'value',
  updatedAt: store.firestore.FieldValue.serverTimestamp()
}

store.firestore.update({ collection: 'cities', doc: 'SF' }, itemUpdates),
```

##### delete
```js
store.firestore.delete({ collection: 'cities', doc: 'SF' }),
```

##### runTransaction
```js
store.firestore.runTransaction(t => {
  return t.get(cityRef)
      .then(doc => {
        // Add one person to the city population
        const newPopulation = doc.data().population + 1;
        t.update(cityRef, { population: newPopulation });
      });
})
.then(result => {
  // TRANSACTION_SUCCESS action dispatched
  console.log('Transaction success!');
}).catch(err => {
  // TRANSACTION_FAILURE action dispatched
  console.log('Transaction failure:', err);
});
```

#### Types of Queries
Each of these functions take a queryOptions object with options as described in the [Query Options section of this README](#query-options). Some simple query options examples are used here for better comprehension.
##### get
```js
props.store.firestore.get({ collection: 'cities' }),
// store.firestore.get({ collection: 'cities', doc: 'SF' }), // doc
```

##### onSnapshot/setListener

```js
store.firestore.onSnapshot({ collection: 'cities' }),
// store.firestore.setListener({ collection: 'cities' }), // alias
// store.firestore.setListener({ collection: 'cities', doc: 'SF' }), // doc
```

##### setListeners

```js
store.firestore.setListeners([
  { collection: 'cities' },
  { collection: 'users' },
]),
```

##### unsetListener / unsetListeners
After setting a listener/multiple listeners, you can unset them with the following two functions. In order to unset a specific listener, you must pass the same queryOptions object given to onSnapshot/setListener(s).
```js
store.firestore.unsetListener({ collection: 'cities' }),
// of for any number of listeners at once :
store.firestore.unsetListeners([query1Options, query2Options]),
// here query1Options as in { collection: 'cities' } for example
```

#### Query Options

##### Collection
```js
{ collection: 'cities' },
// or string equivalent
// store.firestore.get('cities'),
```

##### Document

```js
{ collection: 'cities', doc: 'SF' },
// or string equivalent
// props.store.firestore.get('cities/SF'),
```

##### Sub Collections

```js
{ collection: 'cities', doc: 'SF', subcollections: [{ collection: 'zipcodes' }] },
// or string equivalent
// props.store.firestore.get('cities/SF'/zipcodes),
```

**Note:** When nesting sub-collections, [`storeAs`](#storeas) should be used for more optimal state updates.

##### Where

To create a single `where` call, pass a single argument array to the `where` parameter:

```js
{
  collection: 'cities',
  where: ['state', '==', 'CA']
},
```

Multiple `where` queries are as simple as passing multiple argument arrays (each one representing a `where` call):

```js
{
  collection: 'cities',
  where: [
    ['state', '==', 'CA'],
    ['population', '<', 100000]
  ]
},
```

Firestore doesn't alow you to create `or` style queries.  Instead, you should pass in multiple queries and compose your data.

``` javascript
['sally', 'john', 'peter'].map(friendId => ({
  collection: 'users',
  where: [
    ['id', '==', friendId],
    ['isOnline', '==', true]
  ]
  storeAs: 'onlineFriends'
}));
```

Since the results must be composed, a query like this is unable to be properly ordered.  The results should be pulled from `data`. 

*Can only be used with collections*

##### orderBy

To create a single `orderBy` call, pass a single argument array to `orderBy`

```js
{
  collection: 'cities',
  orderBy: ['state'],
  // orderBy: 'state' // string notation can also be used
},
```

Multiple `orderBy`s are as simple as passing multiple argument arrays (each one representing a `orderBy` call)

```js
{
  collection: 'cities',
  orderBy: [
    ['state'],
    ['population', 'desc']
  ]
},
```

*Can only be used with collections*

##### limit

Limit the query to a certain number of results

```js
{
  collection: 'cities',
  limit: 10
},
```

*Can only be used with collections*

##### startAt

> Creates a new query where the results start at the provided document (inclusive)

[From Firebase's `startAt` docs](https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference#startAt)

```js
{
  collection: 'cities',
  orderBy: 'population',
  startAt: 1000000
},
```

*Can only be used with collections*

##### startAfter

> Creates a new query where the results start after the provided document (exclusive)...

[From Firebase's `startAfter` docs](https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference#startAfter)

```js
{
  collection: 'cities',
  orderBy: 'population',
  startAfter: 1000000
},
```

*Can only be used with collections*

##### endAt

> Creates a new query where the results end at the provided document (inclusive)...

[From Firebase's `endAt` docs](https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference#endAt)


```js
{
  collection: 'cities',
  orderBy: 'population',
  endAt: 1000000
},
```

*Can only be used with collections*

##### endBefore

> Creates a new query where the results end before the provided document (exclusive) ...

[From Firebase's `endBefore` docs](https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference#endBefore)


```js
{
  collection: 'cities',
  orderBy: 'population',
  endBefore: 1000000
},
```

*Can only be used with collections*

##### storeAs

Storing data under a different path within redux is as easy as passing the `storeAs` parameter to your query:

```js
{
  collection: 'cities',
  where: ['state', '==', 'CA'],
  storeAs: 'caliCities' // store data in redux under this path instead of "cities"
},
```

**NOTE:** Usage of `"/"` and `"."` within `storeAs` can cause unexpected behavior when attempting to retrieve from redux state


#### Other Firebase Statics

Other Firebase statics (such as [FieldValue](https://firebase.google.com/docs/reference/js/firebase.firestore.FieldValue)) are available through the firestore instance:

```js
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  compose,
  withHandlers,
  withContext,
  getContext
} from 'recompose'

const withStore = compose(
  withContext({ store: PropTypes.object }, () => {}),
  getContext({ store: PropTypes.object }),
)

const enhance = compose(
  withStore,
  withHandlers({
    onDoneClick: props => (key, done = true) => {
      const { firestore } = props.store
      return firestore.update(`todos/${key}`, {
        done,
        updatedAt: firestore.FieldValue.serverTimestamp() // use static from firestore instance
      }),
    }
  })
)

export default enhance(SomeComponent)
```

### Population
Population, made popular in [react-redux-firebase](http://react-redux-firebase.com/docs/recipes/populate.html), also works with firestore.


#### Automatic Listeners
```js
import { connect } from 'react-redux'
import { firestoreConnect, populate } from 'react-redux-firebase'
import {
  compose,
  withHandlers,
  lifecycle,
  withContext,
  getContext
} from 'recompose'

const populates = [{ child: 'createdBy', root: 'users' }]
const collection = 'projects'

const withPopulatedProjects = compose(
  firestoreConnect((props) => [
    {
      collection,
      populates
    }
  ]),
  connect((state, props) => ({
    projects: populate(state.firestore, collection, populates)
  }))
)
```

#### Manually using setListeners
```js
import { withFirestore, populate } from 'react-redux-firebase'
import { connect } from 'react-redux'
import { compose, lifecycle } from 'recompose'

const collection = 'projects'
const populates = [{ child: 'createdBy', root: 'users' }]

const enhance = compose(
  withFirestore,
  lifecycle({
    componentDidMount() {
      this.props.firestore.setListener({ collection, populates })
    }
  }),
  connect(({ firestore }) => ({ // state.firestore
    todos: firestore.ordered.todos,
  }))
)
```

#### Manually using get
```js
import { withFirestore, populate } from 'react-redux-firebase'
import { connect } from 'react-redux'
import { compose, lifecycle } from 'recompose'

const collection = 'projects'
const populates = [{ child: 'createdBy', root: 'users' }]

const enhance = compose(
  withFirestore,
  lifecycle({
    componentDidMount() {
      this.props.store.firestore.get({ collection, populates })
    }
  }),
  connect(({ firestore }) => ({ // state.firestore
    todos: firestore.ordered.todos,
  }))
)
```

## Config Options
Optional configuration options for redux-firestore, provided to reduxFirestore enhancer as optional second argument. Combine any of them together in an object.

#### logListenerError
Default: `true`

Whether or not to use `console.error` to log listener error objects. Errors from listeners are helpful to developers on multiple occasions including when index needs to be added.

#### enhancerNamespace
Default: `'firestore'`

Namespace under which enhancer places internal instance on redux store (i.e. `store.firestore`).

#### allowMultipleListeners
Default: `false`

Whether or not to allow multiple listeners to be attached for the same query. If a function is passed the arguments it receives are `listenerToAttach`, `currentListeners`, and the function should return a boolean.

#### preserveOnDelete
Default: `null`

Values to preserve from state when DELETE_SUCCESS action is dispatched. Note that this will not prevent the LISTENER_RESPONSE action from removing items from state.ordered if you have a listener attached.

#### preserveOnListenerError
Default: `null`

Values to preserve from state when LISTENER_ERROR action is dispatched.

#### onAttemptCollectionDelete
Default: `null`

Arguments:`(queryOption, dispatch, firebase)`

Function run when attempting to delete a collection. If not provided (default) delete promise will be rejected with "Only documents can be deleted" unless. This is due to the fact that Collections can not be deleted from a client, it should instead be handled within a cloud function (which can be called by providing a promise to `onAttemptCollectionDelete` that calls the cloud function).

#### mergeOrdered
Default: `true`

Whether or not to merge data within `orderedReducer`.

#### mergeOrderedDocUpdate
Default: `true`

Whether or not to merge data from document listener updates within `orderedReducer`.


#### mergeOrderedCollectionUpdates
Default: `true`

Whether or not to merge data from collection listener updates within `orderedReducer`.

<!-- #### Middleware

`redux-firestore`'s enhancer offers a new middleware setup that was not offered in `react-redux-firebase` (but will eventually make it `redux-firebase`)
**Note**: This syntax is just a sample and is not currently released

##### Setup
```js
```


##### Usage

```js
import { FIREBASE_CALL } from 'redux-firestore'

dispatch({
  type: FIREBASE_CALL,
  collection: 'users', // only used when namespace is firestore
  method:  'get' // get method
})
```

Some of the goals behind this approach include:

1. Not needing to pass around a Firebase instance (with `react-redux-firebase` this meant using `firebaseConnect` HOC or `getFirebase`)
2. Follows [patterns outlined in the redux docs for data fetching](http://redux.js.org/docs/advanced/ExampleRedditAPI.html)
3. Easier to expand/change internal API as Firebase/Firestore API grows & changes -->

## Builds

Most commonly people consume Redux Firestore as a [CommonJS module](http://webpack.github.io/docs/commonjs.html). This module is what you get when you import redux in a Webpack, Browserify, or a Node environment.

If you don't use a module bundler, it's also fine. The redux-firestore npm package includes precompiled production and development [UMD builds](https://github.com/umdjs/umd) in the [dist folder](https://unpkg.com/redux-firestore@latest/dist/). They can be used directly without a bundler and are thus compatible with many popular JavaScript module loaders and environments. For example, you can drop a UMD build as a `<script>` tag on the page. The UMD builds make Redux Firestore available as a `window.ReduxFirestore` global variable.

It can be imported like so:

```html
<script src="../node_modules/redux-firestore/dist/redux-firestore.min.js"></script>
<!-- or through cdn: <script src="https://unpkg.com/redux-firestore@latest/dist/redux-firestore.min.js"></script> -->
<script>console.log('redux firestore:', window.ReduxFirestore)</script>
```

Note: In an effort to keep things simple, the wording from this explanation was modeled after [the installation section of the Redux Docs](https://redux.js.org/#installation).

## Applications Using This
* [fireadmin.io](http://fireadmin.io) - Firebase Instance Management Tool (source [available here](https://github.com/prescottprue/fireadmin))

## FAQ
1. How do I update a document within a subcollection?

    Provide `subcollections` config the same way you do while querying:

    ```js
    props.firestore.update(
      {
        collection: 'cities',
        doc: 'SF',
        subcollections: [{ collection: 'counties', doc: 'San Mateo' }],
      },
      { some: 'changes' }
    );
    ```

1. How do I get auth state in redux?

    You will most likely want to use [`react-redux-firebase`](https://github.com/prescottprue/react-redux-firebase) or another redux/firebase connector. For more information please visit the [complementary package section](#complementary-package).

1. Are there Higher Order Components for use with React?

    [`react-redux-firebase`](https://github.com/prescottprue/react-redux-firebase) contains `firebaseConnect`, `firestoreConnect`, `withFirebase` and `withFirestore` HOCs. For more information please visit the [complementary package section](#complementary-package).

## Roadmap

* Automatic support for documents that have a parameter and a subcollection with the same name (currently requires `storeAs`)
* Support for Passing a Ref to `setListener` in place of `queryConfig` object or string

Post an issue with a feature suggestion if you have any ideas!

[npm-image]: https://img.shields.io/npm/v/redux-firestore.svg?style=flat-square
[npm-url]: https://npmjs.org/package/redux-firestore
[npm-downloads-image]: https://img.shields.io/npm/dm/redux-firestore.svg?style=flat-square
[quality-image]: http://npm.packagequality.com/shield/redux-firestore.svg?style=flat-square
[quality-url]: https://packagequality.com/#?package=redux-firestore
[travis-image]: https://img.shields.io/travis/prescottprue/redux-firestore/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/prescottprue/redux-firestore
[daviddm-image]: https://img.shields.io/david/prescottprue/redux-firestore.svg?style=flat-square
[daviddm-url]: https://david-dm.org/prescottprue/redux-firestore
[climate-image]: https://img.shields.io/codeclimate/github/prescottprue/redux-firestore.svg?style=flat-square
[climate-url]: https://codeclimate.com/github/prescottprue/redux-firestore
[coverage-image]: https://img.shields.io/codecov/c/github/prescottprue/redux-firestore.svg?style=flat-square
[coverage-url]: https://codecov.io/gh/prescottprue/redux-firestore
[license-image]: https://img.shields.io/npm/l/redux-firestore.svg?style=flat-square
[license-url]: https://github.com/prescottprue/redux-firestore/blob/master/LICENSE
[code-style-image]: https://img.shields.io/badge/code%20style-airbnb-blue.svg?style=flat-square
[code-style-url]: https://github.com/airbnb/javascript
[gitter-image]: https://img.shields.io/gitter/room/redux-firestore/gitter.svg?style=flat-square
[gitter-url]: https://gitter.im/redux-firestore/Lobby
