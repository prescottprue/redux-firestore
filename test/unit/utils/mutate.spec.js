/* eslint-disable require-jsdoc */
import { expect } from 'chai';
import mutate from 'utils/mutate';

describe('firestore.mutate()', () => {
  it('writes a single operation', async () => {
    const set = sinon.spy();
    const doc = sinon.spy(() => ({
      set,
      ref: { id: 'id', parent: { path: 'path' } },
    }));
    const collection = sinon.spy(() => ({ doc }));
    const firestore = sinon.spy(() => ({ collection }));

    await mutate(
      { firestore },
      {
        collection: 'orgs/tara-ai/teams',
        doc: 'team-bravo',
        data: {
          name: 'Bravo Team 🎄',
        },
      },
    );

    expect(collection.calledWith('orgs/tara-ai/teams'));
    expect(doc.calledWith('team-bravo'));
    expect(set.calledWith({ name: 'Bravo Team 🎄' }, { merge: true }));
  });

  it('writes operations in batch', async () => {
    const set = sinon.spy(() => {});
    const commit = sinon.spy((val) => Promise.resolve(val));
    const doc = sinon.spy((val) => ({
      doc: val,
      ref: { id: 'id', parent: { path: 'path' } },
    }));
    const collection = sinon.spy(() => ({ doc }));

    const batch = sinon.spy(() => ({ set, commit }));
    const firestore = sinon.spy(() => ({ batch, collection }));

    await mutate({ firestore }, [
      {
        collection: 'orgs/tara-ai/teams',
        doc: 'team-bravo',
        data: {
          name: 'Bravo Team 🎄',
        },
      },
      {
        collection: 'orgs/tara-ai/teams',
        doc: 'team-alpha',
        data: {
          name: 'Alpha Team 🎅',
        },
      },
    ]);

    expect(set.calledTwice);

    expect(
      set.calledWith(
        { doc: 'team-bravo' },
        { name: 'Bravo Team 🎄' },
        { merge: true },
      ),
    );

    expect(
      set.calledWith(
        { doc: 'team-alpha' },
        { name: 'Alpha Team 🎅' },
        { merge: true },
      ),
    );

    expect(commit.calledOnce);
  });

  it('writes operations in multiple batches when there are over 500 writes', async () => {
    const set = sinon.spy(() => ({ set, commit }));
    const commit = sinon.spy((val) => Promise.resolve(val));
    const doc = sinon.spy((val) => ({
      doc: val,
      ref: { id: 'id', parent: { path: 'path' } },
    }));
    const collection = sinon.spy(() => ({ doc }));

    const batch = sinon.spy(() => ({ set, commit }));
    const firestore = sinon.spy(() => ({ batch, collection }));

    const writes = Array.from(Array(501), (_el, index) => ({
      collection: 'orgs/tara-ai/teams',
      doc: `team-${index}`,
      data: {
        name: `Team ${index}`,
      },
    }));

    await mutate({ firestore }, writes);

    expect(batch.calledTwice);
    expect(set.callCount).eq(501);
    expect(commit.calledTwice);
  });

  it('writes in transaction', async () => {
    const firestoreGet = sinon.spy(() =>
      Promise.resolve({
        docs: [
          { ref: { id: 'task-1', parent: { path: 'tasks' } } },
          { ref: { id: 'task-2', parent: { path: 'tasks' } } },
        ],
      }),
    );
    const withConverter = sinon.spy(() => ({ get: firestoreGet }));
    const where = sinon.spy(() => ({ get: firestoreGet, withConverter }));
    const collection = sinon.spy(() => ({ doc, withConverter, where }));
    const set = sinon.spy();
    function* mock() {
      yield Promise.resolve({
        ref: { id: 'sprint-1', parent: { path: 'sprints' } },
        data: () => ({
          sprintSettings: { moveRemainingTasksTo: 'NextSprint' },
        }),
      });
      yield Promise.resolve({
        ref: { id: 'task-id-1', parent: { path: 'tasks' } },
        data: () => ({ id: 'task-id-1' }),
      });
      yield Promise.resolve({
        ref: { id: 'task-id-2', parent: { path: 'tasks' } },
        data: () => ({ id: 'task-id-2' }),
      });
    }
    const mocked = mock();
    const transactionGet = () => mocked.next().value;
    const transaction = { set, get: transactionGet };
    const runTransaction = sinon.spy((cb) => cb(transaction));
    const doc = sinon.spy((val) => ({
      doc: val,
      withConverter,
      ref: { id: 'id', parent: { path: 'path' } },
    }));

    const firestore = sinon.spy(() => ({ collection, runTransaction, doc }));

    await mutate(
      { firestore },
      {
        reads: {
          team: {
            collection: 'orgs/tara-ai/teams',
            doc: 'team-id-123',
            collectionName: 'teams',
          },
          unfinishedTasks: {
            _slowCollectionRead: true,
            collection: 'orgs/tara-ai/tasks',
            collectionName: 'tasks',
            where: ['status', '<', 2],
          },
        },
        writes: [
          ({ unfinishedTasks, team }) =>
            unfinishedTasks.map((task) => ({
              collection: 'orgs/tara-ai/tasks',
              doc: task.id,
              data: {
                nextSprintId:
                  team?.sprintSettings.moveRemainingTasksTo === 'Backlog'
                    ? null
                    : 'next-sprint-id-123',
              },
            })),
        ],
      },
    );

    expect(set.calledTwice);
    expect(
      set.calledWith(
        { doc: 'task-id-1' },
        { nextSprintId: 'next-sprint-id-123' },
        { merge: true },
      ),
    );
    expect(
      set.calledWith(
        { doc: 'task-id-2' },
        { nextSprintId: 'next-sprint-id-123' },
        { merge: true },
      ),
    );
  });

  it('writes transaction with single write', async () => {
    const firestoreGet = sinon.spy(() =>
      Promise.resolve({
        docs: [
          { ref: { id: 'task-1', parent: { path: 'tasks' } } },
          { ref: { id: 'task-2', parent: { path: 'tasks' } } },
        ],
      }),
    );
    const withConverter = sinon.spy(() => ({ get: firestoreGet }));
    const where = sinon.spy(() => ({ get: firestoreGet, withConverter }));
    const collection = sinon.spy(() => ({ doc, withConverter, where }));
    const set = sinon.spy();
    // eslint-disable-next-line
    function* mock() {
      yield Promise.resolve({
        ref: { id: 'sprint-1', parent: { path: 'sprints' } },
        data: () => ({ teamCount: 9 }),
      });
      yield Promise.resolve({
        ref: { id: 'task-id-1', parent: { path: 'sprints' } },
        data: () => ({ id: 'task-id-1' }),
      });
      yield Promise.resolve({
        ref: { id: 'task-id-2', parent: { path: 'sprints' } },
        data: () => ({ id: 'task-id-2' }),
      });
    }
    const mocked = mock();
    const transactionGet = () => mocked.next().value;
    const transaction = { set, get: transactionGet };
    const runTransaction = sinon.spy((cb) => cb(transaction));
    const doc = sinon.spy((val) => ({
      doc: val,
      withConverter,
      ref: { id: 'id', parent: { path: 'path' } },
    }));

    const firestore = sinon.spy(() => ({ collection, runTransaction, doc }));

    await mutate(
      { firestore },
      {
        reads: {
          team: {
            collection: 'orgs/tara-ai/teams',
            doc: 'team-id-123',
            collectionName: 'teams',
          },
        },
        writes: [
          ({ team }) => ({
            collection: 'orgs/tara-ai/team',
            doc: team.id,
            data: { teamCount: team.teamCount + 1 },
          }),
        ],
      },
    );

    expect(set.calledTwice);
    expect(
      set.calledWith(
        { doc: 'task-id-1' },
        { nextSprintId: 'next-sprint-id-123' },
        { merge: true },
      ),
    );
    expect(
      set.calledWith(
        { doc: 'task-id-2' },
        { nextSprintId: 'next-sprint-id-123' },
        { merge: true },
      ),
    );
  });

  it('handles stringified Field Values', async () => {
    const set = sinon.spy();
    const doc = sinon.spy(() => ({
      set,
      ref: { id: 'id', parent: { path: 'path' } },
    }));
    const collection = sinon.spy(() => ({ doc }));
    const firestore = sinon.spy(() => ({ collection }));
    firestore.FieldValue = {
      serverTimestamp: sinon.spy(() => 'time'),
      increment: sinon.spy(() => '++'),
      arrayRemove: sinon.spy(() => '-'),
      arrayUnion: sinon.spy(() => '+'),
    };

    await mutate(
      { firestore },
      {
        collection: 'orgs/tara-ai/teams',
        doc: 'team-bravo',
        data: {
          name: 'Bravo Team 🎄',
          'deeply.nested.map': 'value',
          'deeply.nested.array': ['::arrayUnion', 'add'],
          addArray: ['::arrayUnion', 'val'],
          removeArray: ['::arrayRemove', 'item'],
          updateAt: ['::serverTimestamp'],
          counter: ['::increment', 3],
        },
      },
    );

    expect(collection.calledWith('orgs/tara-ai/teams'));
    expect(doc.calledWith('team-bravo'));
    expect(set.calledWith({ name: 'Bravo Team 🎄' }, { merge: true }));
    expect(firestore.FieldValue.serverTimestamp).to.have.been.calledOnce;
    expect(firestore.FieldValue.increment).to.have.been.calledOnce;
    expect(firestore.FieldValue.arrayRemove).to.have.been.calledOnce;
    expect(firestore.FieldValue.arrayUnion).to.have.been.calledTwice;
  });
});
