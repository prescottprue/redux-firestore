/* eslint-disable no-console */
import reducer from 'reducer';
import { actionTypes } from 'constants';

const collection = 'testCollection';
const another = 'anotherCollection';
const path = `${collection}`;
const anotherPath = `${another}`;
const initialState = {
  data: { testStoreAs: { obsoleteDocId: {} } },
  ordered: {},
};

describe('cacheReducer', () => {
  describe('query fields', () => {
    it('query fields return partial document', () => {
      const doc1 = { key1: 'value1', other: 'test', id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
          fields: ['id', 'other'],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const pass1 = reducer(initialState, action1);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql({
        other: 'test',
        id: 'testDocId1',
      });
    });

    it('empty fields return entire document', () => {
      const doc1 = { key1: 'value1', other: 'test', id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const pass1 = reducer(initialState, action1);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql(doc1);
    });
  });

  describe('fast populates', () => {
    it('populate one-to-one', () => {
      const doc1 = {
        key1: 'value1',
        anotherId: 'anotherDocId1',
        id: 'testDocId1',
        path,
      };
      const doc2 = { other: 'test', id: 'anotherDocId1', path: anotherPath };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
          fields: ['id', 'key1', 'anotherDocument'],
          populates: [['anotherId', anotherPath, 'anotherDocument']],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          collection: another,
          storeAs: 'anotherStoreAs',
        },
        payload: { data: { [doc2.id]: doc2 }, ordered: [doc2] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql({
        id: 'testDocId1',
        key1: 'value1',
      });
      expect(pass2.cache.testStoreAs.docs[0]).to.eql({
        anotherDocument: doc2,
        key1: 'value1',
        id: 'testDocId1',
      });
    });

    it('populate many-to-one', () => {
      const doc1 = {
        key1: 'value1',
        anotherIds: ['anotherDocId2', 'anotherDocId1'],
        id: 'testDocId1',
        path,
      };

      const doc2 = { other: 'test', id: 'anotherDocId1', path: anotherPath };
      const doc3 = { other: 'test', id: 'anotherDocId2', path: anotherPath };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
          fields: ['id', 'key1', 'others'],
          populates: [['anotherIds', anotherPath, 'others']],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          collection: another,
          storeAs: 'anotherStoreAs',
        },
        payload: {
          data: { [doc2.id]: doc2, [doc3.id]: doc3 },
          ordered: [doc2, doc3],
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql({
        id: 'testDocId1',
        key1: 'value1',
      });

      expect(pass2.cache.testStoreAs.docs[0]).to.eql({
        others: [doc3, doc2],
        key1: 'value1',
        id: 'testDocId1',
      });
    });
  });

  describe('LISTENER_RESPONSE', () => {
    it('override a document modification synchronously', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path }; // initial doc
      const doc2 = { key2: 'value2', id: 'testDocId1', path }; // added doc

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        type: actionTypes.OPTIMISTIC_MODIFIED,
        meta: {
          collection,
          doc: doc2.id,
        },
        payload: { data: doc2 },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql(doc1);
      expect(pass2.cache.testStoreAs.docs[0]).to.eql({ ...doc1, ...doc2 });
    });

    it('override a document add synchronously', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path };
      const doc2 = { key1: 'value1', id: 'testDocId2', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        type: actionTypes.OPTIMISTIC_ADDED,
        meta: {
          collection,
          doc: doc2.id,
        },
        payload: { data: doc2 },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql(doc1);
      expect(pass1.cache.testStoreAs.docs[1]).to.eql(undefined);
      expect(pass2.cache.testStoreAs.docs[0]).to.eql(doc1);
      expect(pass2.cache.testStoreAs.docs[1]).to.eql(doc2);
    });

    it('override a document removal synchronously', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        type: actionTypes.OPTIMISTIC_REMOVED,
        meta: {
          collection,
          doc: doc1.id,
        },
        payload: {},
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql(doc1);
      expect(pass2.cache.testStoreAs.docs[0]).to.eql(undefined);
    });

    it('overrides synchronously moves to new query', () => {
      const first = { key1: 'value1', id: 'testDocId1', path };
      const second = { key1: 'value2', id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testOne',
          where: [['key1', '==', 'value1']],
        },
        payload: { data: { [first.id]: first }, ordered: [first] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        meta: {
          collection,
          storeAs: 'testTwo',
          where: [['key1', '==', 'value2']],
        },
        payload: { data: {}, ordered: [] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action3 = {
        type: actionTypes.OPTIMISTIC_ADDED,
        meta: {
          collection,
          doc: second.id,
        },
        payload: { data: second },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      const pass3 = reducer(pass2, action3);

      expect(pass2.cache.testOne.docs[0]).to.eql(first);
      expect(pass2.cache.testTwo.docs[0]).to.eql(undefined);

      // doc moved from testOne to testTwo query
      expect(pass3.cache.testOne.docs[0]).to.eql(undefined);
      expect(pass3.cache.testTwo.docs[0]).to.eql(second);
    });
  });

  describe('DOCUMENT_ADDED', () => {
    it('Firestore added document removes override', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path };
      const doc2 = { key2: 'value2', id: 'testDocId1', path };

      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        type: actionTypes.OPTIMISTIC_ADDED,
        meta: {
          collection,
          doc: doc2.id,
        },
        payload: { data: doc2 },
      };
      const action3 = {
        type: actionTypes.DOCUMENT_ADDED,
        meta: {
          collection,
          doc: doc2.id,
        },
        payload: {
          data: { ...doc2, key1: 'value1' },
          ordered: { newIndex: 0, oldIndex: -1 },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      const pass3 = reducer(pass2, action3);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql(doc1);
      expect(pass2.cache.testStoreAs.docs[0]).to.eql({ ...doc1, ...doc2 });
      expect(pass3.cache.testStoreAs.docs[0]).to.eql({ ...doc1, ...doc2 });

      expect(pass1.cache.databaseOverrides).to.eql({});
      expect(pass2.cache.databaseOverrides[collection]).to.eql({
        [doc2.id]: doc2,
      });
      expect(pass3.cache.databaseOverrides[collection]).to.eql({});
    });
  });

  describe('DOCUMENT_REMOVED', () => {
    it('Firestore removed document removes override', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path };
      const doc2 = { key2: 'value2', id: 'testDocId1', path };

      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        type: actionTypes.OPTIMISTIC_REMOVED,
        meta: {
          collection,
          doc: doc2.id,
        },
        payload: {},
      };
      const action3 = {
        type: actionTypes.DOCUMENT_REMOVED,
        meta: {
          collection,
          doc: doc2.id,
        },
        payload: {
          data: {},
          ordered: { newIndex: -1, oldIndex: 0 },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      const pass3 = reducer(pass2, action3);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql(doc1);
      expect(pass2.cache.testStoreAs.docs[0]).to.eql(undefined);
      expect(pass3.cache.testStoreAs.docs[0]).to.eql(undefined);

      expect(pass1.cache.databaseOverrides).to.eql({});
      expect(pass2.cache.databaseOverrides[collection]).to.eql({
        [doc2.id]: null,
      });
      expect(pass3.cache.databaseOverrides[collection]).to.eql({});
    });
  });

  describe('UNSET_LISTENER', () => {
    it('handles unset listener', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: ['key1', '==', 'value1'],
        },
        payload: {}, // actually query string
        type: actionTypes.UNSET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);
      expect(pass1.cache.testStoreAs.docs[0]).to.eql(doc1);
      expect(pass1.cache.database[collection]).to.eql({ [doc1.id]: doc1 });

      const pass2 = reducer(pass1, action2);

      expect(pass2.cache.testStoreAs).to.eql(undefined);
      expect(pass2.cache.database[collection]).to.eql({});
    });

    it('handles a null payload.data', () => {
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
        },
        payload: { data: null, ordered: [] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const pass1 = reducer(initialState, action1);

      expect(pass1.cache.testStoreAs.docs).to.eql([]);
    });
  });

  describe('MUTATE_START', () => {
    it('Firestore solo update adds override', () => {
      const doc1 = {
        path,
        id: 'testDocId1',
        key1: 'value1',
        array: [1, 2, 3, 4],
        obj: { a: 1, b: { x: 0 }, c: { z: 9 } },
      }; // initial doc

      const updates = {
        path,
        id: 'testDocId1',
        vanilla: 'some-data',
        date: new Date('2021-01-01'),
        // serverTimestamp: ['::serverTimestamp'],
        array: ['::arrayUnion', 5],
        'obj.a': 0,
        'obj.b': { y: 9 },
        'obj.c.z': 10,
      };

      const expected = JSON.parse(
        JSON.stringify({
          ...doc1,
          key1: 'value1',
          array: [1, 2, 3, 4, 5],
          obj: { a: 0, b: { y: 9 }, c: { z: 10 } },
          vanilla: 'some-data',
          date: new Date('2021-01-01'),
          // "serverTimestamp": new Date()}
        }),
      );

      // Initial seed
      const action1 = {
        meta: {
          collection,
          where: ['key1', '==', 'value1'],
          storeAs: 'testStoreAs',
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      // mutate
      const action2 = {
        type: actionTypes.MUTATE_START,
        meta: {
          collection,
          doc: updates.id,
        },
        payload: {
          data: { collection: path, doc: updates.id, data: { ...updates } },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      const pass2Doc = pass2.cache.testStoreAs.docs[0];

      const result = JSON.parse(JSON.stringify(pass2Doc));
      expect(result).to.eql(expected);
    });

    it('Firestore batch update adds override', () => {
      const doc1 = {
        path,
        id: 'testDocId1',
        key1: 'value1',
        number: 11,
        array: [1, 2, 3, 4],
        obj: { a: 1, b: { x: 0 }, c: { z: 9 } },
      }; // initial doc

      const updates = {
        path,
        id: 'testDocId1',
        number: ['::increment', 4],
        date: new Date('2021-01-01'),
        // serverTimestamp: ['::serverTimestamp'],
        array: ['::arrayRemove', 2],
        'obj.a': 0,
        'obj.b': { y: 9 },
        'obj.c.z': 10,
      };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          where: ['key1', '==', 'value1'],
          storeAs: 'testStoreAs',
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      // mutate
      const action2 = {
        type: actionTypes.MUTATE_START,
        meta: {
          collection,
          doc: updates.id,
        },
        payload: {
          data: [{ collection: path, doc: updates.id, data: { ...updates } }],
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      const pass2Doc = pass2.cache.testStoreAs.docs[0];

      const result = JSON.parse(JSON.stringify(pass2Doc));
      expect(result).to.eql(
        JSON.parse(
          JSON.stringify({
            ...doc1,
            key1: 'value1',
            number: 15,
            array: [1, 3, 4],
            obj: { a: 0, b: { y: 9 }, c: { z: 10 } },
            date: new Date('2021-01-01'),
            // "serverTimestamp": new Date()}
          }),
        ),
      );
    });

    it('Firestore transaction update adds override', () => {
      const doc1 = {
        path,
        id: 'testDocId1',
        key1: 'value1',
        number: 11,
        multipled: 3,
        array: [1, 2, 3, 4],
        obj: { a: 1, b: { x: 0 }, c: { z: 9 } },
      }; // initial doc

      const updates = {
        path,
        id: 'testDocId1',
        number: ['::increment', 4],
        date: new Date('2021-01-01'),
        // serverTimestamp: ['::serverTimestamp'],
        array: ['::arrayRemove', 2],
        'obj.a': 0,
        'obj.b': { y: 9 },
        'obj.c.z': 10,
      };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      // mutate
      const action2 = {
        type: actionTypes.MUTATE_START,
        meta: {
          collection,
          doc: updates.id,
        },
        payload: {
          data: {
            reads: {
              fromReducerCache: {
                collection: path,
                doc: doc1.id,
              },
            },
            writes: [
              ({ fromReducerCache }) => ({
                collection: path,
                doc: updates.id,
                data: {
                  multipled: fromReducerCache.multipled * 4,
                  ...updates,
                },
              }),
            ],
          },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      const pass2Doc = pass2.cache.testStoreAs.docs[0];

      const result = JSON.parse(JSON.stringify(pass2Doc));
      expect(result).to.eql(
        JSON.parse(
          JSON.stringify({
            ...doc1,
            key1: 'value1',
            multipled: 12,
            number: 15,
            array: [1, 3, 4],
            obj: { a: 0, b: { y: 9 }, c: { z: 10 } },
            date: new Date('2021-01-01'),
            // "serverTimestamp": new Date()}
          }),
        ),
      );
    });
  });
});
