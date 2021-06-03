# Query

Query is a JSON representation of the Firestore Query API. 


## Syntax

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
{
  collection: 'cities',
  doc: 'SF',
  subcollections: [{ collection: 'zipcodes' }],
  storeAs: 'SF-zipcodes' // make sure to include this
},
```

##### Collection Group

```js
{ collectionGroup: 'landmarks' },
// does not support string equivalent
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

Firestore doesn't allow you to create `or` style queries. Instead, you should pass in multiple queries and compose your data.

```javascript
['sally', 'john', 'peter'].map(friendId => ({
  collection: 'users',
  where: [
    ['id', '==', friendId],
    ['isOnline', '==', true]
  ]
  storeAs: 'onlineFriends'
}));
```

Since the results must be composed, a query like this is unable to be properly ordered. The results should be pulled from `data`.

_Can only be used with collections_

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

_Can only be used with collections_

##### limit

Limit the query to a certain number of results

```js
{
  collection: 'cities',
  limit: 10
},
```

_Can only be used with collections_

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

_Can only be used with collections. Types can be a string, number, Date object, or an array of these types, but not a Firestore Document Snapshot_

##### startAfter

> Creates a new query where the results start after the provided document (exclusive)...

[From Firebase's `startAfter` docs](https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference#startAfter)

```js
{
  collection: 'cities',
  orderBy: [['state', 'asc'],['population','desc']]
  startAfter: ["CA", 1000000]
},
```

**Note:** for the above to return valid results, there must be at least one document with `state = "CA"` _and_ `population = 1000000` (i.e. the values idenify "the provided document").

_Can only be used with collections. Types can be a string, number, Date object, or an array of these types, but not a Firestore Document Snapshot_

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

_Can only be used with collections. Types can be a string, number, Date object, or an array of these types, but not a Firestore Document Snapshot_

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

_Can only be used with collections. Types can be a string, number, Date object, or an array of these types, but not a Firestore Document Snapshot_

##### storeAs

Storing data under a different path within redux is as easy as passing the `storeAs` parameter to your query:

```js
{
  collection: 'cities',
  where: ['state', '==', 'CA'],
  storeAs: 'caliCities' // store data in redux under this path instead of "cities"
},
```

**Note:** Usage of `"/"` and `"."` within `storeAs` can cause unexpected behavior when attempting to retrieve from redux state


## Types

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

## Population

Population, made popular in [react-redux-firebase](http://react-redux-firebase.com/docs/recipes/populate.html), also works with firestore.

#### Automatic Listeners

```js
import { connect } from 'react-redux';
import { firestoreConnect, populate } from 'react-redux-firebase';
import {
  compose,
  withHandlers,
  lifecycle,
  withContext,
  getContext,
} from 'recompose';

const populates = [{ child: 'createdBy', root: 'users' }];
const collection = 'projects';

const withPopulatedProjects = compose(
  firestoreConnect((props) => [
    {
      collection,
      populates,
    },
  ]),
  connect((state, props) => ({
    projects: populate(state.firestore, collection, populates),
  })),
);
```

#### Manually using setListeners

```js
import { withFirestore, populate } from 'react-redux-firebase';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';

const collection = 'projects';
const populates = [{ child: 'createdBy', root: 'users' }];

const enhance = compose(
  withFirestore,
  lifecycle({
    componentDidMount() {
      this.props.firestore.setListener({ collection, populates });
    },
  }),
  connect(({ firestore }) => ({
    // state.firestore
    todos: firestore.ordered.todos,
  })),
);
```

#### Manually using get

```js
import { withFirestore, populate } from 'react-redux-firebase';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';

const collection = 'projects';
const populates = [{ child: 'createdBy', root: 'users' }];

const enhance = compose(
  withFirestore,
  lifecycle({
    componentDidMount() {
      this.props.store.firestore.get({ collection, populates });
    },
  }),
  connect(({ firestore }) => ({
    // state.firestore
    todos: firestore.ordered.todos,
  })),
);
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

