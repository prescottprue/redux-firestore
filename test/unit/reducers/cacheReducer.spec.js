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
  describe('optimistic reads', () => {
    it('SET_LISTENER returns undefined if nothing in memory', () => {
      // Request to set listener
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['key1'],
          fields: ['id', 'other'],
        },
        payload: { name: 'testStoreAs' },
        type: actionTypes.SET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);

      expect(pass1.cache.testStoreAs.docs).to.eql(undefined);
    });

    it('SET_LISTENER returns data if in memory', () => {
      const doc1 = { key1: 'value1', other: 'test', id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['key1'],
          fields: ['id', 'other'],
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          collection,
          storeAs: 'testStoreAs2',
          where: [['other', '==', 'test']],
          orderBy: ['key1'],
          fields: ['id', 'other'],
        },
        payload: { name: 'testStoreAs2' },
        type: actionTypes.SET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass2.cache.testStoreAs2.docs[0]).to.eql({
        other: 'test',
        id: 'testDocId1',
        path,
      });
    });
  });

  describe('query fields', () => {
    it('query fields return partial document', () => {
      const doc1 = { key1: 'value1', other: 'test', id: 'testDocId1', path };
      const doc2 = { key1: 'value1', other: 'limit', id: 'testDocId2', path };
      const doc3 = { key1: 'value1', other: 'third', id: 'testDocId3', path };
      const doc4 = { key1: 'value1', other: 'fourth', id: 'testDocId4', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['key1'],
          fields: ['id', 'other'],
          limit: 2,
        },
        payload: {
          data: { [doc1.id]: doc1, [doc2.id]: doc2, [doc3.id]: doc3 },
          ordered: [doc1, doc2, doc3],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        type: actionTypes.OPTIMISTIC_ADDED,
        meta: {
          collection,
          doc: doc4.id,
        },
        payload: { data: doc4 },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql({
        other: 'test',
        id: 'testDocId1',
        path,
      });
      expect(pass1.cache.testStoreAs.docs[1]).to.eql({
        other: 'limit',
        id: 'testDocId2',
        path,
      });
      expect(pass2.cache.testStoreAs.docs[1]).to.eql({
        other: 'limit',
        id: 'testDocId2',
        path,
      });

      expect(pass2.cache.testStoreAs.docs[2]).to.eql(undefined);
    });

    it('empty fields return entire document', () => {
      const doc1 = { key1: 'value1', other: 'test', id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '!=', 'value2']],
          orderBy: ['key1'],
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
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
          where: [['key1', 'in', ['value1']]],
          orderBy: ['value1'],
          fields: ['id', 'key1', 'anotherDocument'],
          populates: [['anotherId', anotherPath, 'anotherDocument']],
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          collection: another,
          storeAs: 'anotherStoreAs',
        },
        payload: {
          data: { [doc2.id]: doc2 },
          ordered: [doc2],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql({
        id: 'testDocId1',
        key1: 'value1',
        path,
      });
      expect(pass2.cache.testStoreAs.docs[0]).to.eql({
        anotherDocument: doc2,
        key1: 'value1',
        id: 'testDocId1',
        path,
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
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
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
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql({
        id: 'testDocId1',
        key1: 'value1',
        path,
      });

      expect(pass2.cache.testStoreAs.docs[0]).to.eql({
        others: [doc3, doc2],
        key1: 'value1',
        id: 'testDocId1',
        path,
      });
    });

    it('populate nested', () => {
      const doc1 = {
        key1: 'value1',
        sub: { anotherIds: ['anotherDocId2', 'anotherDocId1'] },
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
          populates: [['sub.anotherIds', anotherPath, 'others']],
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
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
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql({
        id: 'testDocId1',
        key1: 'value1',
        path,
      });

      expect(pass2.cache.testStoreAs.docs[0]).to.eql({
        others: [doc3, doc2],
        key1: 'value1',
        id: 'testDocId1',
        path,
      });
    });
  });

  describe('LISTENER_RESPONSE', () => {
    it('override a document modification synchronously', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path }; // initial doc
      const doc2 = { key2: null, id: 'testDocId1', path }; // added doc

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
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
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
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

      expect(pass1.cache.testStoreAs.ordered[1]).to.eql(undefined);
      expect(pass2.cache.testStoreAs.ordered[1]).to.eql([doc2.path, doc2.id]);
    });

    it('remove a document override synchronously', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path };
      const doc2 = { ...doc1, key2: 'other' };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
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
        type: actionTypes.OPTIMISTIC_REMOVED,
        meta: {
          collection,
          doc: doc1.id,
        },
        payload: {},
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      const pass3 = reducer(pass2, action3);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql(doc1);
      expect(pass2.cache.testStoreAs.docs[0]).to.eql(doc2);
      expect(pass3.cache.testStoreAs.docs[0]).to.eql(doc1);
    });

    it('overrides synchronously moves to new query', () => {
      const first = { key1: 'value1', id: 'testDocId1', path };
      const second = { key1: 'value2', id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testOne',
          where: [['key1', 'in', ['value1']]],
        },
        payload: {
          data: { [first.id]: first },
          ordered: [first],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        meta: {
          collection,
          storeAs: 'testTwo',
          where: [['key1', '==', 'value2']],
        },
        payload: { data: {}, ordered: [], fromCache: true },
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

  describe('optimistic writes', () => {
    it('less than or equal', () => {
      const first = { key1: 1, id: 'testDocId1', path };
      const second = { key1: 2, id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testOne',
          where: [['key1', '<=', 1]],
        },
        payload: {
          data: { [first.id]: first },
          ordered: [first],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        meta: {
          collection,
          storeAs: 'testTwo',
          where: [['key1', '>=', 2]],
        },
        payload: { data: {}, ordered: [], fromCache: true },
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

    it('less than', () => {
      const first = { key1: 1, id: 'testDocId1', path };
      const second = { key1: 2, id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testOne',
          where: [['key1', '<', 2]],
        },
        payload: {
          data: { [first.id]: first },
          ordered: [first],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        meta: {
          collection,
          storeAs: 'testTwo',
          where: [['key1', '>', 1]],
        },
        payload: { data: {}, ordered: [], fromCache: true },
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

    it('not compares', () => {
      const first = { key1: 1, id: 'testDocId1', path };
      const second = { key1: 2, id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testOne',
          where: [['key1', '!=', 2]],
        },
        payload: {
          data: { [first.id]: first },
          ordered: [first],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        meta: {
          collection,
          storeAs: 'testTwo',
          where: [['key1', '>', 1]],
        },
        payload: { data: {}, ordered: [], fromCache: true },
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

    it('not in and __name__', () => {
      const first = { key1: 1, id: 'testDocId1', path };
      const second = { key1: 2, id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'notTwo',
          where: [['key1', 'not-in', [2]]],
        },
        payload: {
          data: { [first.id]: first },
          ordered: [first],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        meta: {
          collection,
          storeAs: 'isIdMatch',
          where: [['__name__', '==', 'testDocId1']],
        },
        payload: {
          data: { [first.id]: first },
          ordered: [first],
          fromCache: true,
        },
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

      // doc moved from testOne to testTwo query
      expect(pass3.cache.notTwo.docs[0]).to.eql(undefined);
      expect(pass3.cache.isIdMatch.docs[0]).to.eql(second);
    });

    it('nested compare ', () => {
      const first = { key1: { val: [1] }, id: 'testDocId1', path };
      const second = { key1: { val: [2] }, id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testOne',
          where: [['key1.val', 'array-contains', 1]],
        },
        payload: {
          data: { [first.id]: first },
          ordered: [first],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        meta: {
          collection,
          storeAs: 'testTwo',
          where: [['key1.val', 'array-contains-any', [2]]],
        },
        payload: { data: {}, ordered: [], fromCache: true },
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
    it('Firestore adds new document without overrides', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path };
      const doc2 = { key2: 'value1', id: 'testDocId2', path };

      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['key1'],
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        type: actionTypes.DOCUMENT_ADDED,
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['key1'],
          doc: doc2.id,
        },
        payload: {
          data: doc2,
          ordered: { newIndex: 0, oldIndex: -1 },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql(doc1);
      expect(pass2.cache.testStoreAs.docs[0]).to.eql(doc2);
      expect(pass2.cache.testStoreAs.docs[1]).to.eql(doc1);
    });

    it('Firestore added document removes override', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path };
      const change = { key2: 'value2', id: 'testDocId1', path };
      const doc2 = { ...doc1, ...change };

      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['key1'],
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        type: actionTypes.OPTIMISTIC_ADDED,
        meta: {
          collection,
          doc: change.id,
        },
        payload: { data: change },
      };

      const action3 = {
        type: actionTypes.DOCUMENT_ADDED,
        meta: {
          collection,
          doc: doc2.id,
        },
        payload: {
          data: doc2,
          ordered: { newIndex: 0, oldIndex: -1 },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      const pass3 = reducer(pass2, action3);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql(doc1);
      expect(pass2.cache.testStoreAs.docs[0]).to.eql(doc2);
      expect(pass3.cache.testStoreAs.docs[0]).to.eql(doc2);

      expect(pass1.cache.databaseOverrides).to.eql({});
      expect(pass2.cache.databaseOverrides[collection]).to.eql({
        [change.id]: change,
      });
      expect(pass3.cache.databaseOverrides).to.eql({});
    });

    it('Firestore added document multiple overrides', () => {
      const doc1 = {
        key1: 'value1',
        new: 'val',
        arr: [1, 2],
        obj: { a: 1 },
        id: 'testDocId1',
        path,
      };
      const change1 = {
        key2: 'value2',
        new: null,
        arr: [2, 1],
        obj: { a: 2 },
        id: 'testDocId1',
        path,
      };
      const doc1a = { ...doc1, ...change1 };
      const doc2 = { key1: 'value1', id: 'testDocId2', path };

      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['key1'],
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        type: actionTypes.OPTIMISTIC_ADDED,
        meta: {
          collection,
          doc: change1.id,
        },
        payload: { data: change1 },
      };

      const action3 = {
        type: actionTypes.OPTIMISTIC_ADDED,
        meta: {
          collection,
          doc: doc2.id,
        },
        payload: { data: doc2 },
      };

      const action4 = {
        type: actionTypes.DOCUMENT_ADDED,
        meta: {
          collection,
          doc: doc1a.id,
        },
        payload: {
          data: doc1a,
          ordered: { newIndex: 0, oldIndex: -1 },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      const pass3 = reducer(pass2, action3);
      const pass4 = reducer(pass3, action4);

      // docs
      expect(pass1.cache.testStoreAs.docs[0]).to.eql(doc1);
      expect(pass2.cache.testStoreAs.docs[0]).to.eql(doc1a);

      expect(pass3.cache.testStoreAs.docs).to.eql([doc1a, doc2]);
      expect(pass4.cache.testStoreAs.docs).to.eql([doc1a, doc2]);

      // overrides
      expect(pass1.cache.databaseOverrides).to.eql({});
      expect(pass2.cache.databaseOverrides[collection]).to.eql({
        [change1.id]: change1,
      });
      expect(pass3.cache.databaseOverrides[collection]).to.eql({
        [change1.id]: change1,
        [doc2.id]: doc2,
      });
      expect(pass4.cache.databaseOverrides[collection]).to.eql({
        [doc2.id]: doc2,
      });
    });
  });

  describe('DOCUMENT_REMOVED', () => {
    it('Firestore removed document removes override', () => {
      const doc1 = { key1: 1, id: 'testDocId1', path };
      const doc2 = { key2: 0, id: 'testDocId2', path };

      const action1 = {
        meta: {
          collection,
          storeAs: 'lessThanTwo',
          where: [['key1', '<', 2]],
          orderBy: ['key1'],
        },
        payload: {
          data: { [doc1.id]: doc1, [doc2.id]: doc2 },
          ordered: [doc2, doc1],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        type: actionTypes.DOCUMENT_REMOVED,
        meta: {
          collection,
          storeAs: 'lessThanTwo',
          where: [['key1', '<', 2]],
          orderBy: ['key1'],
          doc: doc2.id,
        },
        payload: {
          data: { key2: 2, id: 'testDocId2', path },
          ordered: { newIndex: -1, oldIndex: 0 },
          fromCache: true,
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass1.cache.lessThanTwo.docs[0]).to.eql(doc2);
      expect(pass1.cache.lessThanTwo.docs[1]).to.eql(doc1);

      expect(pass2.cache.lessThanTwo.docs[0]).to.eql(doc1);
      expect(pass2.cache.lessThanTwo.docs[1]).to.eql(undefined);

      // Removing from query !== deleting. Other queries could have the result
      expect(pass1.cache.database.testCollection.testDocId2).to.eql(doc2);
    });

    it('Firestore deletes document', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path };
      const doc2 = { key2: 'value2', id: 'testDocId2', path };

      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
        },
        payload: {
          data: { [doc1.id]: doc1, [doc2.id]: doc2 },
          ordered: [doc2, doc1],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        type: actionTypes.DELETE_SUCCESS,
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
          doc: doc2.id,
        },
        payload: {
          data: {},
          ordered: { newIndex: -1, oldIndex: 0 },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass1.cache.testStoreAs.docs[0]).to.eql(doc2);
      expect(pass1.cache.testStoreAs.docs[1]).to.eql(doc1);
      expect(pass2.cache.testStoreAs.docs[0]).to.eql(doc1);
      expect(pass2.cache.testStoreAs.docs[1]).to.eql(undefined);

      // Removing from query !== deleting. Other queries could have the result
      expect(pass1.cache.database.testCollection.testDocId2).to.eql(doc2);
    });
  });

  describe('UNSET_LISTENER', () => {
    it('unset removes query but maintains in database cache', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: ['key1', '==', 'value1'],
        },
        payload: {},
        type: actionTypes.UNSET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);
      expect(pass1.cache.testStoreAs.docs).to.eql([doc1]);
      expect(pass1.cache.database[collection]).to.eql({ [doc1.id]: doc1 });

      const pass2 = reducer(pass1, action2);
      expect(pass2.cache.testStoreAs).to.eql(undefined);
      expect(pass2.cache.database[collection]).to.eql({ [doc1.id]: doc1 });
    });

    it('unset preserves query and maintains in database cache (preserve mode)', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: ['key1', '==', 'value1'],
        },
        payload: { preserveCache: true },
        type: actionTypes.UNSET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);
      expect(pass1.cache.testStoreAs.docs).to.eql([doc1]);
      expect(pass1.cache.database[collection]).to.eql({ [doc1.id]: doc1 });

      const pass2 = reducer(pass1, action2);
      expect(pass2.cache.testStoreAs.docs).to.eql([doc1]);
      expect(pass2.cache.database[collection]).to.eql({ [doc1.id]: doc1 });
    });

    it('handles a null payload.data', () => {
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
        },
        payload: { data: null, ordered: [], fromCache: true },
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
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
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
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
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
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
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

    it('Firestore transaction update single write adds override', () => {
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
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
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
            writes: ({ fromReducerCache }) => ({
              collection: path,
              doc: updates.id,
              data: {
                multipled: fromReducerCache.multipled * 4,
                ...updates,
              },
            }),
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

    it('Firestore does not support queries inside a transaction', () => {
      const doc1 = {
        path,
        id: 'testDocId1',
      }; // initial doc

      const updates = {
        path,
        id: 'testDocId1',
      };

      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
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
              firestore_doesnt_support_transction_queries: {
                collection: path,
              },
            },
            writes: [() => new Error('This should never be called.')],
          },
        },
      };

      const pass1 = reducer(initialState, action1);

      try {
        reducer(pass1, action2);
      } catch (err) {
        expect(err).to.be.a('Error');
      }
    });
  });

  describe('MUTATE_FAILURE', () => {
    it('Remove overrides on Firestore failures.', () => {
      const doc1 = {
        path,
        id: 'testDocId1',
        key1: 'value1',
      }; // initial doc

      const updates = {
        path,
        id: 'testDocId1',
        vanilla: 'some-data',
      };

      const expected2 = JSON.parse(
        JSON.stringify({
          ...doc1,
          key1: 'value1',
          ...updates,
        }),
      );

      const expected3 = JSON.parse(
        JSON.stringify({
          ...doc1,
          key1: 'value1',
        }),
      );

      // Initial seed
      const action1 = {
        meta: {
          collection,
          where: ['key1', '==', 'value1'],
          storeAs: 'testStoreAs',
        },
        payload: {
          data: { [doc1.id]: doc1 },
          ordered: [doc1],
          fromCache: true,
        },
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
          data: { collection: path, doc: updates.id, vanilla: 'some-data' },
        },
      };

      // mutate
      const action3 = {
        type: actionTypes.ADD_FAILURE,
        meta: {
          collection,
          doc: updates.id,
        },
        payload: {
          data: { collection: path, doc: updates.id, vanilla: 'some-data' },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      const pass3 = reducer(pass2, action3);

      const pass2Doc = pass2.cache.testStoreAs.docs[0];
      const pass3Doc = pass3.cache.testStoreAs.docs[0];

      const result2 = JSON.parse(JSON.stringify(pass2Doc));
      const result3 = JSON.parse(JSON.stringify(pass3Doc));

      // database should never changes. It's a perfect mirror of firestore.
      expect(pass1.cache.database.testCollection.testDocId1).to.eql(doc1);
      expect(pass2.cache.database.testCollection.testDocId1).to.eql(doc1);
      expect(pass3.cache.database.testCollection.testDocId1).to.eql(doc1);

      // query has new override data
      expect(result2).to.eql(expected2);

      // query is back to a perfect mirror of firestore
      expect(result3).to.eql(expected3);
    });
  });
});
