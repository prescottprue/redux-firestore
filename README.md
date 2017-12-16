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

Most likely, you'll want react bindings, for that you will need [react-redux-firebase](https://github.com/prescottprue/react-redux-firebase). You can install the current v2.0.0 version it by running:

```sh
npm install --save react-redux-firebase@next
```

[react-redux-firebase](https://github.com/prescottprue/react-redux-firebase) provides [`withFirestore`](http://docs.react-redux-firebase.com/history/v2.0.0/docs/api/withFirestore.html) and [`firestoreConnect`](http://docs.react-redux-firebase.com/history/v2.0.0/docs/api/withFirestore.html) higher order components, which handle automatically calling `redux-firestore` internally based on component's lifecycle (i.e. mounting/un-mounting)

## Use

```javascript
import { createStore, combineReducers, compose } from 'redux'
import { reduxFirestore, firestoreReducer } from 'redux-firestore'
import firebase from 'firebase'
import 'firebase/firestore'

const firebaseConfig = {} // from Firebase Console

// Initialize firebase instance
const firebaseApp = firebase.initializeApp(config)
// Initialize Cloud Firestore through Firebase
firebase.firestore();

// Add reduxReduxFirebase to compose
const createStoreWithFirebase = compose(
  reduxFirestore(firebaseApp), // firebase instance as first argument
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
ReactDOM.render(
  <Provider store={store}>
    <MyRootComponent />
  </Provider>,
  rootEl
)
```

### Call Firestore

#### Firestore Instance

##### Functional Components

It is common to make react components "stateless" meaning that the component is just a function. This can be useful, but then can limit usage of lifecycle hooks and other features of Component Classes. [`recompose` helps solve this](https://github.com/acdlite/recompose/blob/master/docs/API.md) by providing Higher Order Component functions such as `withContext`, `lifecycle`, and `withHandlers`.

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
      props.store.firestore.update('todos', key, { done }),
    onNewSubmit: props => newTodo =>
      props.store.firestore.add('todos', { ...newTodo, owner: 'Anonymous' }),
  }),
  lifecycle({
    componentWillMount(props) {
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
import { isEqual } from 'lodash'
import { watchEvents, unWatchEvents } from './actions/query'
import { getEventsFromInput, createCallable } from './utils'

class Todos extends Component {
  static contextTypes = {
    store: PropTypes.object.isRequired
  }

  componentWillMount () {
    const { firebase } = this.context.store
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

#### Types of Queries

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

#### setListeners

```js
store.firestore.setListeners([
  { collection: 'cities' },
  { collection: 'users' },
]),
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
// props.store.firestore.get('cities/SF'),
```


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

*Should only be used with collections*

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

*Should only be used with collections*

##### limit

Limit the query to a certain number of results

```js
{
  collection: 'cities',
  limit: 10
},
```

*Should only be used with collections*

##### storeAs

Storing data under a different path within redux is as easy as passing the `storeAs` parameter to your query:

```js
{
  collection: 'cities',
  where: ['state', '==', 'CA'],
  storeAs: 'caliCities' // store data in redux under this path instead of "cities"
},
```

**NOTE:** Not yet supported inside of subcollections (only at the top level)

#### Other Firebase Statics

Other Firebase statics (such as [FieldValue](https://firebase.google.com/docs/reference/js/firebase.firestore.FieldValue)) are available through the firestore instance:

```js
import { connect } from 'react-redux'
import {
  compose,
  withHandlers,
  lifecycle,
  withContext,
  getContext
} from 'recompose'

const withFirestore = compose(
  withContext({ store: PropTypes.object }, () => {}),
  getContext({ store: PropTypes.object }),
)

const enhance = compose(
  withStore,
  withHandlers({
    onDoneClick: props => (key, done = true) => {
      const { firestore } = props.store
      return firestore.update('todos', key, {
        done,
        updatedAt: firestore.FieldValue.serverTimestamp() // use static from firestore instance
      }),
    }
  })
)

export default enhance(SomeComponent)
```

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
