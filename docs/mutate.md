# Saving Data

There are two options to save data to Firestore. Create [Firestore Document References](https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference) or use the redux-firestore `mutate` function. 

The mutate function is recommended. Mutate calls will synchornously show the plausible, optimistic results immedately in the reducer and the UI. Document Reference work as well but changes can take thousands of milliseconds to show up in the reducer and in the UI.

## mutate

The Mutate function the simpler and fastest way to change documents.

## Optimistic Writes

Optimistic Writes. The Mutate function shows updates in the Redux stores BEFORE sending to Firestore. Eventually firestore will complete the request and changes will update Redux.

The problem with Firestore Document References is that they must write to disk (IndexDB) before changes show up in Redux store. This is tens of milliseconds for a single write resulting is a slugish UI. Firestore Transactions are much worse. They must round trip to the server before updating the reducer making those changes at thousands of milliseconds to show up in Redux/UI.

## Internal

What happens when calling `mutate`?

0. dispatch MUTATE_START (Sync)
1. Translate (Sync)
  - reducers/cacheReducer.translateMutationToOverrides
    - grab transaction reads from cache.database
    - call each transaction write
    - store results of writes to cache.databaseOverrides
2. Reprocess (Sync)
  - reducers/cacheReducer.reprocessQuerires
    - for all writes grab the unique collections affected
    - list any queries or populates using an affected collection
    - use the query to filter & match using data from cache.datacase & cache.databaseOverrides
    - for each query update the `[storeAs].ordered` tuple and `[storeAs].docs`
3. Selector Update (End of dispatch phase)
 - After reprocessing queries, the optimistic writes have updated the `cache[storeAs]` and is available to the UI through Redux
4. Document Reference (Sync)
 - utils/mutate.mutate
  - Mutate translates reads, writes, batches and transaction to Firestore Document References.
  - Request are sent to Firestore. 
5a. Write & Batches (Async: ~30ms-500ms)
  - Writes and batches process locally in Firestore's indexDB.
  - Writing to disk takes tens to hundreds of milliseconds
5b. Transactions (Async: >1000ms)
 - Firstore Transaction do not process on the local IndexDB, it sends over the network
 - Transaction process reads/writes on the server
    - Firestore.onSnapshotListner is triggered which dispatches DOCUMENT_MODIFIED
6. Reconcile (Sync)
  - cacheReducer.modify 
    - removes optimistic updates
    - add changed documents to cache.database
    - reprocess queries for that collection

## API

### Creation

To create a new document, specify the document id, collection and data.

```js
store.firestore.mutate({
  collection: 'tasks',
  doc: uuid(),
  data: {
    name: 'Task Title',
  },
});
```
Functionality equivilant to `myDocumentReference.set(myData, {merge:true})`

#### Updates

Update a single document

```js
store.firestore.mutate({
  collection: 'cities',
  doc: 'SF',
  data: {
    name: 'San Francisco',
  },
});
```
Functionality equivilant to `myDocumentReference.set(myData, {merge:true})` unless any property is a nested update, in which case `myDocumentReference.update(myData, {merge:true})` is used.

#### Batching

Pass an array of object to batch.

```js
store.firestore.mutate([{
  collection: 'cities',
  doc: 'SF',
  data: {
    name: 'San Francisco',
  },
  {
    collection: 'cities',
    doc: 'Miami',
    data: {
      name: 'Miami',
    },
  },
}]);
```

Functionality equivilant to `myRefs.map((batch, docRef) => { batch.set(docRef, {merge:true}); return batch;}, firestore.batch()`

Firestore support up to 500 items per batch. Any array > 500 will
be broken into multiple batches using Promise.all then flat mapped to return the results of the batch of batches. 

#### Transactions

Firestore supports ACID compliant transactions. The current caveats of Google's Firestore SDK client are:
1. all reads must happen before any writes
2. fetching single documents by id will be included in the transaction
3. The Node admin SDK supports Query results but the browser client does not support query results. As a work-around it does support multiple documents from the query result in the transaction. 

When sending a transaction to `mutate` the cache reducer will process the transaction synchronously. The cache reducer uses all available data in memory to provide the reads, process the writes and make the plausible outcome of the transaction instantly available before the next line of code is ran. 

Without the `mutate` function, a Firestore transaction must be set over the network, locks the affected documents then send the results back to the client. After all thats done the listeners will trigger and the changes will show up in the reducers. If that seems like a long delay, it is. Expect transactions at a minimum take multiple seconds to show the results in the UI. With mutate and the cache reducer, transaction process synchornously taking milliseconds, not seconds. Most use cases will be 10x to 100x faster with mutate than with Firestore document reference transaction. 

```js
store.firestore
  .mutate({
    reads: {
      sanFrancisco: { collection: 'cities', doc: 'SF' },
      // .. multiple documents can be read & DI into the write functions
    },
    writes: [
      { 
        collection: 'task', 
        doc: uuid(), 
        data: { name:'New task' }
      },
      ({ sanFrancisco }) => ({
        collection: 'cities',
        doc: 'SF',
        data: {
          population: sanFrancisco.population + 1,
        },
      }),
    ],
  })
  .then((result) => {
    // TRANSACTION_SUCCESS action dispatched
    console.log('Transaction success!');
  })
  .catch((err) => {
    // TRANSACTION_FAILURE action dispatched
    console.log('Transaction failure:', err);
  });
```

## Atomic Updates

Firestore support some atomic operations, usually as a FieldValue function. Unforntunatiy getting the value of a FieldValue relays on an internal API that can't be relyably used with the cache reducer. Also using class instances in Redux action message is an anti-pattern. For those reasons atomic operations are slightly different in the `mutate` function. 

#### ArrayUnion

```ts
firestore.mutate({
  collection: 'path/to/collection',
  doc: 'document-id',
  data: {
    someArray: ['::arrayUnion', 5],
    otherArray: ['::arrayUnion', [5, 6]],
  },
});
```

#### ArrayRemove

```ts
firestore.mutate({
  collection: 'path/to/collection',
  doc: 'document-id',
  data: {
    someArray: ['::arrayRemove', 5],
    otherArray: ['::arrayRemove', [5, 6]],
  },
});
```

#### Array Insert At

Firestore does not support insertion at a specific point in the array.

#### Deeply Nested Update

```ts
firestore.mutate({
  collection: 'path/to/collection',
  doc: 'document-id',
  data: {
    'someRoot.someChild.otherProp': 'myValue'
  },
});
```

#### Increment

```ts
firestore.mutate({
  collection: 'path/to/collection',
  doc: 'document-id',
  data: {
    someProperty: ['::increment', 999]
  },
});
```

#### Server Timestamp

```ts
firestore.mutate({
  collection: 'path/to/collection',
  doc: 'document-id',
  data: {
    someProperty: ['::serverTimestamp']
  },
});
```

#### Date

```ts
firestore.mutate({
  collection: 'path/to/collection',
  doc: 'document-id',
  data: {
    someProperty: firestore.Timestamp.now(),
    someProperty: new Date()
  },
});
```
--- 

## Advanced Transaction

Below is an example of an advanced mutate transaction that includes reading multiple documents, providing a local variable, static writes, creating new documents and write functions that use data read from Firestore to save new changes. 

```js
firestore.mutate({
  reads: {
    myLockedDocument: {
      collection: 'full/path/to/the/collection',
      doc: 'firestore-document-id',
    },
    otherDocument: {
      collection: 'full/path/to/the/collection2',
      doc: 'firestore-document-id2',
    },
    myState: {
      collection: 'full/path/to/the/collection2',
      doc: 'firestore-document-id3',
    },
    uid: uid,
  },
  writes: [
    {
    collection: 'tasks',
    doc: uuid(),
    data: {
      name: "new task",
    },
    ({ myLockedDocument, otherDocument, myState, uid }) => {
    return {
      collection: 'full/path/to/the/collection',
      doc: 'firestore-document-id',
      data: {
        someString: myLockedDocument.someString + ' new',
        someOther: otherDocument.someOther,
        }
      }
    };
  },
  ({ otherDocument }) => {
    return {
      collection: 'full/path/to/the/collection2',
      doc: 'firestore-document-id2',
      data: {
        otherString: otherDocument.someString + ' other'
        }
      }
    };
  }]
});
```

## Not supported

#### Delete

Delete operations are not supported in mutate yet.

#### Transaction Queries

Transactions in Google's Firestore SDK client does not support queries (Node's Firestore admin does). 

The future plans include running a query outside of the transaction then fetching each document inside the transaction will be supported in a future version. 