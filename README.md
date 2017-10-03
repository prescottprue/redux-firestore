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

> Redux bindings for Firestore

**NOTE**: This library is still under construction, use at your own risk

## Installation

```sh
npm install redux-firestore
```

## Use

```javascript
import { createStore, combineReducers, compose } from 'redux'
import { reduxFirestore, firestoreReducer } from 'react-redux-firebase'
import firebase from 'firebase'

const firebaseConfig = {
  apiKey: '<your-api-key>',
  authDomain: '<your-auth-domain>',
  databaseURL: '<your-database-url>',
  storageBucket: '<your-storage-bucket>'
}
const rrfConfig = { userProfile: 'users' } // react-redux-firebase config

// initialize firebase instance
const firebaseApp = firebase.initializeApp(config) // <- new to v2.*.*

// Add reduxReduxFirebase to compose
const createStoreWithFirebase = compose(
  reduxFirestore(firebaseApp, rrfConfig), // firebase instance as first argument
)(createStore)

// Add Firebase to reducers
const rootReducer = combineReducers({
  firestore: firestoreReducer
})

// Create store with reducers and initial state
const initialState = {}
const store = createStoreWithFirebase(rootReducer, initialState)
```

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
