# RFC - Firestore Immediate Mode Mutatations

## Problem: We have 3 ways to save a Firestore doc, solo, batching & transactions.

## Solution: Seperate decoding, mutations and persistence method

Isolating mutations into stages allows the mutations to be compositional
and to serialize mutations mid-state to be picked up by other functions.
Doing so fixed multiple design flaws with redux:

1. Actions are synchronous and fully serialzable and can be replayed
2. Async work happens as a side effect _after_ the reducer, not before.
3. Async work that fails will automatically roll back the scynchronous,
   in-memory store.

### Process steps

Step 1. Decoding as a global convertion

```ts
function createConvertorFactory() {
  const types = {
    sprints: 'Sprint',
    tasks: 'Task',
    ...
  };
  return {
    toFirestore({ id, path, ...data }) {
      const collection = path.split('/').pop();
      const decode = getDecoder(types[collection]);
      return decode(data);
    },
    fromFirestore(snapshot, options) {
      const collection = snapshot.ref.parent.id;
      const decode = getDecoder(types[collection]);
      return decode({
        ...snapshot.data(options),
        id: snapshot.id,
        path: snapshot.ref.parent.path,
      });
    },
  };
}
```

Google Firestore library has a [custom marshalling](https://firebase.google.com/docs/reference/js/firebase.firestore.FirestoreDataConverter) API. Here's how it works:

```ts
firestore()
  .collection('someCollection')
  .withConvertor(createConvertorFactory())
  .get();

firestore()
  .collection('someCollection')
  .withConvertor(createConvertorFactory())
  .doc('someId')
  .update({ some: 'changes' });
```

Step 2. Mutations as simple objects

Note that the Firestore.transaction force all reads to happen before writes.
In most cases some data is read (while locking the document) and used for
the writing phase of the transaction. This requires a function that runs
after data is read. Sadly that's not a solvable solution in JS but in clojurescript
it's as simple as qouting the writes in the message.

All the write functions are idempotent so even though they aren't serializable
they can be re-run reliability.

```
interface Read extends FirestoreQuery
interface MutationPath {
  collection: string;
  doc: string;
}
type Mutation = <TaraType extends MutationPath> |
    (reads):<TaraType extends MutationPath>;
```

Step 3. single persistence method

**basic use case**

```ts
firestore.mutation({
  collection: `orgs/${orgId}/task`,
  doc: taskId,
  status: 0,
});
```

**batch use case**

```ts
firestore.mutation(
  [
    { collection: `orgs/${orgId}/task`, doc: taskId, status: 0 },
    { collection: `orgs/${orgId}/task`, doc: task2Id, status: 0 },
  ],
  'batch',
);
```

**transaction use case**

```ts
firestore.mutation(
  {
    read: [
      {
        collection: `orgs/${orgId}/task`,
        doc: taskId,
        where: [
          ['sprint', '==', 'aaa'],
          ['status', '!=', 2],
        ],
        storeAs: 'myTaskQuery',
      },
    ],
    write: [
      ({ myTaskQuery }) =>
        myTaskQuery.map(({ id }) => ({
          collection: `orgs/${orgId}/task`,
          doc: id,
          status: 2,
        })),
    ],
  },
  'transaction',
);
```

**Complex example: Tara complete Sprint and move unfinished tasks**

```js
// global settup of convertors
firestore.defaultConvertor(createConvertorFactory(schemas));

// isolated functions to generate static queries or configure a mutation
const provide = () => ({orgId, teamId})
const queryUncompletedTasks = ({orgId, sprintId}) =>
  ([{collection: `orgs/${orgId}/tasks`,
     where: [['sprint', '==' sprintId]}], ['status', '!=', 2]]
     storeAs: 'uncompleted']);
const queryCompletedTasks = ({orgId, sprintId}) =>
  ([{collection: `orgs/${orgId}/tasks`,
     where: [['sprint', '==' sprintId]}], ['status', '==', 2]]
     storeAs: 'completed']);
const queryTeam = ({orgId, teamId}) =>
  ([{collection: `orgs/${orgId}/teams`,
     doc:teamId,
     storeAs: 'team'}]);
const queryNextSprint = ({orgId, sprintId}) =>
  ([{collection: `orgs/${orgId}/sprints`,
     orderBy: ['initialEndDate'],
     startAt: sprintId,
     limit: 2,
     storeAs: 'sprints'}])

const writeUncompleteToNextSprint = ({uncompleted, team, sprints, now, orgId, teamId}) => {
  const write = [];
  const shouldSendToBacklog = team.strategy === 'backlog'
  const nextSprintId = shouldSendToBacklog ? null : sprints?[1].id ?? uuid()
  if (nextSprintId && !sprints?[1]) {
    write.push({collection: `orgs/${orgId}/sprints`, doc: nextSprintId })
  }

  uncompleted.reduce((writes, task) =>
    writes.concat([{
      collection: task.path,
      doc:task.id,
      sprint: nextSprintId}]),
    write);

  writes.push({
    collection: `orgs/${orgId}/sprints`,
    doc: nextSprintId,
    orderedTaskIds: uncompleted.map(({id}) => arrayUnion(id))})

  write.push({
    collection: `orgs/${orgId}/team`,
    doc: team.id,
    currentSprint: sprintId
  });

  return write;
}

const writeSprintCalculations = ({completed, uncompleted, sprints}) => {
  const current = sprint[0];
  const tasks = completed.concat(uncompleted);
  const computedOnCompletion = {
    totalEffortEstimated: tasks.reduce((sum, {effort}) => sum += effort, 0),
    totalEffortCompleted: completed.reduce((sum, {effort}) => sum += effort, 0)
  }
  return {collection: sprint.path, doc:sprint.id, computedOnCompletion };
}

const writeSprintComplete = ({uncompleted, sprints, now}) => {
  const current = sprint[0];
  return {
    collection: current.path,
    doc: current.id,
    orderedTaskIds: uncompleted.map(({id} => arrayRemove(id))),
    completed: true, updatedAt:now
  };
}

// NOTE: in clojurescript the writes should be qouted to be fully serializable
dispatch({
  type: 'COMPLETE_SPRINT',
  payload: {
    read: [
      provide(),
      queryUncompletedTasks({orgId, sprintId}),
      queryCompletedTasks({orgId, sprintId}),
      queryTeam({orgId, sprintId}),
      queryNextSprint({orgId, sprintId}),
      ],
    write: [
      writeUncompleteToNextSprint,
      writeSprintCalculations,
      writeCompleteSprint
    ],
    method: 'transaction'
  }});

// -------

// After the reducer updates the in-memory cache of the fragment database
// firebase just needs to be triggered with payload contents.
firestore.mutate({read, write}, method);
```

# Thoughts on the internals of the mutate function

```ts
export function mutate(operations, persistenceType = null) {
  // if there's a default convertor than add to each firestore call
  let read,
    write = operations;
  if (operations.read) {
    read = operations.read;
    write = operations.write;
  }

  // first run all optimistic updates synchronously

  // next run the firestore operations:
  // if transaction
  //    then create one
  //         await Promise.all to get all read queries
  //         transalate each query to a map
  //         call each write with the results of the read
  // if batch then create one
  //    then translate each write to a the batch
  //       if item > 500 then create a batch of batches
  // else translate each write to a firestore call

  // when an firestore operation succeeds or fails the optimistic
  //  update will be removed from RRF's cache reducer
}
```
