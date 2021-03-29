import reducer from 'reducer';
import { actionTypes } from 'constants';

const initialState = {
  data: { testStoreAs: { obsoleteDocId: {} } },
  ordered: {},
};

describe('reducer', () => {
  describe('cross slice behaviour', () => {
    it('keeps composite when SET_LISTENER is passed', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc
      const doc2 = { key1: 'value1', id: 'testDocId2' }; // added doc

      // Initial seed
      const action1 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action2 = {
        type: actionTypes.GET_REQUEST,
        meta: {
          collection: 'testCollection',
          doc: doc2.id,
        },
        payload: {
          args: [],
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      expect(pass1.composite.testStoreAs[doc1.id]).to.eql(doc1);
      expect(pass2.composite.testStoreAs[doc1.id]).to.eql(doc1);
      const pass3 = reducer(pass2, { type: 'some other type' });
      expect(pass3.composite.testStoreAs[doc1.id]).to.eql(doc1);
    });

    it('handles adds', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc
      const doc2 = { key1: 'value1', id: 'testDocId2' }; // added doc

      // Initial seed
      const action1 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
          doc: doc2.id,
        },
        payload: { data: doc2, ordered: { oldIndex: -1, newIndex: 1 } },
        type: actionTypes.DOCUMENT_ADDED,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass2.composite.testStoreAs[doc1.id]).to.eql(doc1);
      expect(pass2.composite.testStoreAs[doc2.id]).to.eql(doc2);
    });
    it('handles updates', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc
      const doc2 = { key1: 'value2', id: 'testDocId1' }; // updated doc

      // Initial seed
      const action1 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
          doc: doc2.id,
        },
        payload: { data: doc2, ordered: { oldIndex: 0, newIndex: 0 } },
        type: actionTypes.DOCUMENT_MODIFIED,
      };

      const pass1 = reducer(initialState, action1);
      expect(pass1.composite.testStoreAs[doc1.id]).to.eql(doc1);

      const pass2 = reducer(pass1, action2);
      expect(pass2.composite.testStoreAs[doc1.id]).to.eql(doc2); // both docs have the same id
    });

    it('handles deletes', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc

      // Initial seed
      const action1 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
          doc: doc1.id,
        },
        payload: { data: undefined, ordered: { oldIndex: 0, newIndex: -1 } },
        type: actionTypes.DOCUMENT_REMOVED,
      };

      const pass1 = reducer(initialState, action1);
      expect(pass1.composite.testStoreAs[doc1.id]).to.eql(doc1);

      const pass2 = reducer(pass1, action2);
      expect(pass2.composite.testStoreAs[doc1.id]).to.eql(undefined);
    });

    it('handles unset listener', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc

      // Initial seed
      const action1 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
        },
        payload: { name: undefined }, // actually query string
        type: actionTypes.UNSET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);
      expect(pass1.composite.testStoreAs[doc1.id]).to.eql(doc1);

      const pass2 = reducer(pass1, action2);
      expect(pass2.composite.testStoreAs).to.eql({});
    });

    it('updates data from composite', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1' };
      const doc2 = { key1: 'value1', id: 'testDocId2' };
      const action1 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const pass1 = reducer(initialState, action1);
      expect(pass1.composite.testStoreAs[doc1.id]).to.eql(doc1);
      expect(pass1.composite.testStoreAs.obsoleteDocId).to.equal(undefined);

      const action2 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 234], // same meta, different where (how an `or` query is implemented in firestore atm)
        },
        payload: { data: { [doc2.id]: doc2 }, ordered: [doc2] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      // In the second pass, we expect to retain the first doc (since it is a different query) and add the second doc
      const pass2 = reducer(pass1, action2);
      expect(pass2.composite.testStoreAs[doc1.id]).to.eql(doc1);
      expect(pass2.composite.testStoreAs[doc2.id]).to.eql(doc2);
    });

    it('composes the query key', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1' };
      const doc2 = { key1: 'value1', id: 'testDocId2' };
      const action1 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
          orderBy: ['id', 'asc'],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      const pass1 = reducer(initialState, action1);

      const query =
        pass1.queries['testCollection?where=abc:===:123&orderBy=id:asc'];

      expect(query.data).to.equal(action1.payload.data);
      expect(query.collection).to.equal(action1.meta.collection);
      expect(query.storeAs).to.equal(action1.meta.storeAs);
      expect(query.where).to.equal(action1.meta.where);
      expect(query.orderBy).to.equal(action1.meta.orderBy);

      const action2 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 234], // same meta, different where (how an `or` query is implemented in firestore atm)
          orderBy: ['id', 'asc'],
          startAfter: 100,
        },
        payload: { data: { [doc2.id]: doc2 }, ordered: [doc2] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      // In the second pass, we expect to retain the first doc (since it is a different query) and add the second doc
      const pass2 = reducer(pass1, action2);

      const query2 =
        pass2.queries[
          'testCollection?where=abc:===:234&orderBy=id:asc&startAfter=100'
        ];

      expect(query2.data).to.equal(action2.payload.data);
      expect(query2.collection).to.equal(action2.meta.collection);
      expect(query2.storeAs).to.equal(action2.meta.storeAs);
      expect(query2.where).to.equal(action2.meta.where);
      expect(query2.orderBy).to.equal(action2.meta.orderBy);
    });

    it('handles a where without a storeAs', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1' };
      const doc2 = { key1: 'value1', id: 'testDocId2' };
      const action1 = {
        meta: {
          collection: 'testCollection',
          where: ['abc', '===', 123],
        },
        payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const pass1 = reducer(
        {
          data: { testCollection: { obsoleteDocId: {} } },
          ordered: {},
        },
        action1,
      );
      expect(pass1.composite.testCollection[doc1.id]).to.eql(doc1);
      expect(pass1.composite.testCollection.obsoleteDocId).to.equal(undefined);

      const action2 = {
        meta: {
          collection: 'testCollection',
          where: ['abc', '===', 234], // same meta, different where (how an `or` query is implemented in firestore atm)
        },
        payload: { data: { [doc2.id]: doc2 }, ordered: [doc2] },
        type: actionTypes.LISTENER_RESPONSE,
      };

      // In the second pass, we expect to retain the first doc (since it is a different query) and add the second doc
      const pass2 = reducer(pass1, action2);
      expect(pass2.composite.testCollection[doc1.id]).to.eql(doc1);
      expect(pass2.composite.testCollection[doc2.id]).to.eql(doc2);
    });

    it('handles a null payload.data', () => {
      const action1 = {
        meta: {
          collection: 'testCollection',
          storeAs: 'testStoreAs',
          where: ['abc', '===', 123],
        },
        payload: { data: null, ordered: [] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const pass1 = reducer(initialState, action1);

      expect(pass1.composite.testStoreAs).to.eql({}); // TODO: should this be null, undefined, or an empty object?
    });
  });
});
