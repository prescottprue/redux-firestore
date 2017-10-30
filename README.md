# redux-firestore

[![NPM version][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![License][license-image]][license-url]
[![Code Style][code-style-image]][code-style-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Build Status][travis-image]][travis-url]

[![Gitter][gitter-image]][gitter-url]
<!-- [![Quality][quality-image]][quality-url] -->
<!-- [![Code Coverage][coverage-image]][coverage-url] -->

> Redux bindings for Firestore. Provides low-level API used in other libraries such as [react-redux-firebase](https://github.com/prescottprue/react-redux-firebase)

**NOTE**: This library is still under construction, use at your own risk. Please view the roadmap below for more information

## Installation

```sh
npm install redux-firestore --save
```

## NOTE

You probably want to be using [react-redux-firebase](https://github.com/prescottprue/react-redux-firebase).

If you are planning on using Firestore with Auth, Realtime DB, Storage or any other Firebase Products you will most likely want to use [react-redux-firebase](https://github.com/prescottprue/react-redux-firebase), which actually depends on this module.

This is a low level library that is meant to be used simple as a building block.

## Use

```javascript
import { createStore, combineReducers, compose } from 'redux'
import { reduxFirestore, firestoreReducer } from 'redux-firestore'
import firebase from 'firebase'
import 'firebase/firestore'

const firebaseConfig = {} // from Firebase Console
const rfConfig = {} // redux-firestore config

// Initialize firebase instance
const firebaseApp = firebase.initializeApp(config)
firebase.firestore(); // Initialize Cloud Firestore through Firebase

// Add reduxReduxFirebase to compose
const createStoreWithFirebase = compose(
  reduxFirestore(firebaseApp, rfConfig), // firebase instance as first argument
)(createStore)

// Add Firebase to reducers
const rootReducer = combineReducers({
  firestore: firestoreReducer
})

// Create store with reducers and initial state
const initialState = {}
const store = createStoreWithFirebase(rootReducer, initialState)
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
#### Types of Query Options

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

##### Where

**Single**
To create a single where call, pass a single argument array to where

```js
{
  collection: 'cities',
  where: ['state', '==', 'CA']
},
```

**Multiple**

Multiple where queries are as simple as passing mutiple argument arrays (each one representing a where call)

```js
{
  collection: 'cities',
  where: [
    ['state', '==', 'CA'],
    ['population', '<', 100000],
    ['name', '>=', 'San Francisco']
  ]
},
```

*Should only be used with collections*

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


## Roadmap

`v0.1.0` - Basic querying

`redux-firestore` will soon be a dependency of `react-redux-firebase`

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
