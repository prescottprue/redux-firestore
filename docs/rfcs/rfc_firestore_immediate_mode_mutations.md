# RFC - RRF Firestore Immediate Mode Mutations

## Problem: We have 3 ways to save a Firestore doc: solo, batching & transactions.

## Solution: Seperate decoding, mutations and persistence method

Isolating mutations into stages makes the mutations be compositional and serialable.
Doing so fixed multiple design flaws with redux:

1. Actions finally return to the original deisgn; fully synchronous and serialzable so that they can be replayed if needed.
2. Async work happens as a side effect _after_ the reducer, not before.
3. Async firestore mutations that fail will automatically roll back the synchronous, in-memory data store.

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
      delete data.id;
      delete data.path;
      return decode(data);
    },
    fromFirestore(snapshot, options) {
      const collection = snapshot.ref.parent.id;
      const decode = getDecoder(types[collection]);
      const valid = decode(snapshot.data(options));
      return {
        ...valid,
        id: snapshot.id,
        path: snapshot.ref.parent.path,
      };
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
interface Read extends RRF_FirestoreQuery

interface Write {
  collection: string;
  doc: string;
  data: object; // JSON of the Firestore Document
}

type MutateFnc = (
  reads: Record<string, Read>;
  writes: [(args:object):Write];
  options?: { method: null | 'transaction' | 'batch' };
):Promise<Result>
```

Step 3. single persistence method

**basic use case**

```ts
firestore.mutate({
  collection: `orgs/${orgId}/task`,
  doc: taskId,
  data: { status: 0 },
});
```

**batch use case**

```ts
firestore.mutate(
  [
    { collection: `orgs/${orgId}/task`, doc: taskId, data: { status: 0 } },
    { collection: `orgs/${orgId}/task`, doc: task2Id, data: { status: 0 } },
  ],
  { method: 'batch' },
);
// NOTE: Firestore batch limit is 500. Arrays > 500 would just _.take(500) to make a batch of batches with a Promise.all.
```

**transaction use case**

```ts
// NOTE: Firestore's web client doesn't support queries in transactions
firestore.mutate(
  {
    reads: {
      myTaskQuery: {
        collection: `orgs/${orgId}/tasks`,
        doc: taskId,
        where: [
          ['sprint', '==', 'aaa'],
          ['status', '!=', 2],
        ],
      },
    },
    writes: [
      ({ myTaskQuery }) =>
        myTaskQuery.map(({ id }) => ({
          collection: `orgs/${orgId}/task`,
          doc: id,
          data: {
            status: 2,
          },
        })),
    ],
  },
  { method: 'transaction' },
);
```

**Complex example: Tara complete Sprint and move unfinished tasks**

```js
// global setup of convertors
// --- Type Guard Decoders w/ AJV Validation
firestore.defaultConvertor(createConvertorFactory(schemas));

// static queries will be dependency injected into write functions based of the read[key] below.
const queryUncompletedTasks = {
     collection: `orgs/${orgId}/tasks`,
     where: [['sprint', '==' sprintId]}], ['status', '!=', 2]]
};

const queryCompletedTasks = {
     collection: `orgs/${orgId}/tasks`,
     where: [['sprint', '==' sprintId]}], ['status', '==', 2]]
};

const queryTeam = {
     collection: `orgs/${orgId}/teams`,
     doc:teamId
};

const queryNextSprint = {
     collection: `orgs/${orgId}/sprints`,
     orderBy: ['initialEndDate'],
     startAt: sprintId,
     limit: 2
};

// --- Writes ---

// Writes are just idempotent functions that return a serializable JSON
// of the data to save. The arguments are DI from the read calls.

const writeUncompleteToNextSprint = ({uncompleted, team, sprints, now, orgId, teamId}) => {
  const writes = [];
  const shouldSendToBacklog = team.strategy === 'backlog'
  const nextSprintId = shouldSendToBacklog ? null : sprints?[1].id ?? uuid()
  if (nextSprintId && !sprints?[1]) {
    writes.push({collection: `orgs/${orgId}/sprints`, doc: nextSprintId })
  }

  uncompleted.forEach((task) =>
    writes.concat([{
      collection: `orgs/${orgId}/sprints`,
      doc: task.sprintId,
      data: { orderedTaskIds: arrayRemove(task.id) } }]));

  uncompleted.forEach((task) =>
    writes.concat([{
      collection: task.path,
      doc:task.id,
      data: { sprint: nextSprintId } }]));

  writes.push({
    collection: `orgs/${orgId}/sprints`,
    doc: nextSprintId,
    data: { orderedTaskIds: uncompleted.map(({id}) => arrayUnion(id))} })

  writes.push({
    collection: `orgs/${orgId}/team`,
    doc: team.id,
    data: { currentSprint: sprintId }
  });

  return writes;
}

const writeSprintCalculations = ({completed, uncompleted, sprints}) => {
  const current = sprint[0];
  const tasks = completed.concat(uncompleted);
  const computedOnCompletion = {
    totalEffortEstimated: tasks.reduce((sum, {effort}) => sum += effort, 0),
    totalEffortCompleted: completed.reduce((sum, {effort}) => sum += effort, 0)
  }
  return {
    collection: sprint.path,
    doc:sprint.id,
    data: { computedOnCompletion } };
}

const writeSprintComplete = ({uncompleted, sprints, now}) => {
  const current = sprint[0];
  return {
    collection: current.path,
    doc: current.id,
    data: {
      orderedTaskIds: uncompleted.map(({id} => arrayRemove(id))),
      completed: true,
      updatedAt:now
    }
  };
}

// Without Redux it's just a simple call to the new mutate function.

const reads = {
  orgId,
  teamId,
  now: new Date(),
  uncompleted: queryUncompletedTasks,
  completed: queryCompletedTasks,
  team: queryTeam,
  sprints: queryNextSprint,
};

const = writes: [
  writeUncompleteToNextSprint,
  writeSprintCalculations,
  writeCompleteSprint
];

firestore.mutate({ reads, writes }, { method: 'transaction' });

// -----

// The Write functions here don't really belong in an action message (but neither do thunks).
// This is much cleaner via Clojurescript where idempotent functions can just be qouted
// Other ideas are to put it in a middleware (w/ a string to reference the function)
dispatch({
  type: 'COMPLETE_SPRINT',
  payload: {
    reads: {
      orgId,
      teamId,
      uncompleted: queryUncompletedTasks,
      completed: queryCompletedTasks,
      team: queryTeam,
      sprints: queryNextSprint,
    },
    writes: [
      writeUncompleteToNextSprint,
      writeSprintCalculations,
      writeCompleteSprint
    ],
    method: 'transaction'
  }});

```

# Thoughts on the internals of the mutate function

```ts
export function mutate(operations, { method = null } = {}) {
  // if there's a default convertor than add to each firestore call
  let reads,
    writes = operations;
  if (operations.reads) {
    reads = operations.reads;
    writes = operations.writes;
  }

  // first run all optimistic updates synchronously

  // next run the firestore operations:
  if (method === 'transaction) {
    //    then create a transaction
    //         await Promise.all to get all read queries
    //         transalate each query to a map
    //         call each write with the results of the read
  } else if (method === 'batch') {
    //    then translate each write to a the batch
    //       if item > 500 then create a batch of batches
  } else /* solo writes */ {
    // else translate each write to a firestore call
  }

  // when an firestore operation succeeds or fails the optimistic
  //  update will be removed from RRF's cache reducer
}
```
