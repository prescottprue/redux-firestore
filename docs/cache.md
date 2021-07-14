## Cache Reducer

The purpose of the cache reducer to fix a fundamental flaw in Redux. The defacto async processes in Redux is Thunks and Sagas. Both have the issue of doing async before updating the reducer. The Cache Reducer (along with the [`mutate`](./mutate.md) function) does it's work 100% synchonously then queues up the database changes to be eventually consistent. The result is that the UI immediatly reflects changes and eventually the data will process and update Redux.

## Structure

Cache Reducer Structure
```ts
store: {
  firestore: {
    cache: {
      database: {
        [collection_path]: {
          [docId1]: { id:docId1, path:collection_path, ...doc1 },
          ...
          }
      },
      databaseOverrides: {
        // overrides mirrors database but is deleted as soon 
        // as Firestore resolves a write request
      },
      ...queries,
    }
  }
}
```

Query
```ts
[storeAs]: {
  ordered: [
    [collection_path, docId1], 
    [collection_path, docId2], 
    ...rest],
  docs: [{ ...doc1 }, { ...doc2 }, ...rest],
  via: 'memory' | 'cache' | 'server',
  ...firestoreQuery
}
```


## Reprocessing

## Atomize

## Transducer

## Action Handlers

