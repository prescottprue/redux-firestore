# redux-firestore

> Redux bindings for Firestore. Provides low-level API used in other libraries such as [react-redux-firebase](https://github.com/prescottprue/react-redux-firebase)

[![NPM version][npm-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![License][license-image]][license-url]
[![Code Style][code-style-image]][code-style-url]
[![Build Status][build-image]][build-status-url]
[![Code Coverage][coverage-image]][coverage-url]
[![semantic-release][semantic-release-image]][semantic-release-url]

[![Gitter][gitter-image]][gitter-url]

<!-- [![Quality][quality-image]][quality-url] -->

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

# Overview

- [Getting Started](./docs/getting-started.md)
  - [Components](./docs/getting-started.md#components)
  - [Functional Components](./docs/getting-started.md#functional-components)
  - [Class Components](./docs/getting-started.md#class-components)
- API
  - [Mutate](./docs/saving.md)
    - [Optimistic Writes](./docs/saving.md#optimistic-writes)
    - [Creation](./docs/saving.md#creation)
    - [Updates](./docs/saving.md#updates)
    - [Batches](./docs/saving.md#batching)
    - [Transactions](./docs/saving.md#transactions)
    - [Atomic Updates](./docs/saving.md#atomic-updates)
    - [Not Supported](./docs/saving.md#not-supported)
  - [Query](./docs/query.md)
    - [Syntax](./docs/query.md#syntax)
    - [Types](./docs/query.md#types)
    - [Population](./docs/query.md#population)
    - [Config Options](./docs/query.md#config-options)
  - [Cache Reducer](./docs/cache.md)
   - [Structure](./docs/cache.md#structure)

## API Quick Start

#### Load data

Construct a Firestore query, attach listeners for updates and get the data from the selector.

```js
const MyController = () => {
  // 1. construct query
  const taskQuery = {
    collection: `workspace/MySpace/tasks`,
    where:[
      ['status', '<', 1],
      ['deleted', '==', false]
    ],
    orderBy: ['createdAt', 'desc'],
    storeAs: 'tasksStarted',
  }
  
  // 2. load & attached listeners for document changes
  useFirestoreConnect([taskQuery]);

  // 3. Get results
  const tasks = useSelector(state => 
    state.firestore.cache['tasksStarted'].docs
  );
  
  // 4. Display when the data returns
  return (<ol>
    {tasks && tasks.map(({id, title}) => (
      <li key={id}>title</li>
    ))}
  </ol>);
};
```

#### Saving Data

Use redux-firestore's mutate function to queue changes to Firestore
and see the optimitic results instantly in the UI.

```js
const MyController = (task) => {
  const changeTitle = useCallback(({id, path, title}) => {
    dispatch(
      createMutate({
        doc: id, 
        collection: path, 
        title
      }))
      .catch((error) => { alert(error) });
  })
  
  return (<TaskView onSave={changeTitle} />);
};
```

## Roadmap

- Automatic support for documents that have a parameter and a subcollection with the same name (currently requires `storeAs`)
- Support for Passing a Ref to `setListener` in place of `queryConfig` object or string

Post an issue with a feature suggestion if you have any ideas!

[npm-image]: https://img.shields.io/npm/v/redux-firestore.svg?style=flat-square
[npm-url]: https://npmjs.org/package/redux-firestore
[npm-downloads-image]: https://img.shields.io/npm/dm/redux-firestore.svg?style=flat-square
[quality-image]: http://npm.packagequality.com/shield/redux-firestore.svg?style=flat-square
[quality-url]: https://packagequality.com/#?package=redux-firestore
[build-image]: https://img.shields.io/github/workflow/status/prescottprue/redux-firestore/NPM%20Package%20Publish?style=flat-square
[build-status-url]: https://travis-ci.org/prescottprue/redux-firestore
[climate-image]: https://img.shields.io/codeclimate/github/prescottprue/redux-firestore.svg?style=flat-square
[climate-url]: https://codeclimate.com/github/prescottprue/redux-firestore
[coverage-image]: https://img.shields.io/codecov/c/github/prescottprue/redux-firestore.svg?style=flat-square
[coverage-url]: https://codecov.io/gh/prescottprue/redux-firestore
[license-image]: https://img.shields.io/npm/l/redux-firestore.svg?style=flat-square
[license-url]: https://github.com/prescottprue/redux-firestore/blob/main/LICENSE
[code-style-image]: https://img.shields.io/badge/code%20style-airbnb-blue.svg?style=flat-square
[code-style-url]: https://github.com/airbnb/javascript
[gitter-image]: https://img.shields.io/gitter/room/redux-firestore/gitter.svg?style=flat-square
[gitter-url]: https://gitter.im/redux-firestore/Lobby
[semantic-release-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square
[semantic-release-url]: https://github.com/semantic-release/semantic-release
