import reducer from 'reducer';
import { actionTypes } from 'constants';

const initialState = {
  data: { testStoreAs: { obsoleteDocId: {} } },
  ordered: {},
};

describe('reducer', () => {
  describe('LISTENER_RESPONSE', () => {
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
      expect(pass1.data.testStoreAs[doc1.id]).to.eql(doc1);
      expect(pass1.data.testStoreAs.obsoleteDocId).to.equal(undefined);

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
      expect(pass2.data.testStoreAs[doc1.id]).to.eql(doc1);
      expect(pass2.data.testStoreAs[doc2.id]).to.eql(doc2);
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
      expect(pass1.data.testCollection[doc1.id]).to.eql(doc1);
      expect(pass1.data.testCollection.obsoleteDocId).to.equal(undefined);

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
      expect(pass2.data.testCollection[doc1.id]).to.eql(doc1);
      expect(pass2.data.testCollection[doc2.id]).to.eql(doc2);
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

      expect(pass1.data.testStoreAs).to.eql({}); // TODO: should this be null, undefined, or an empty object?
    });
  });
});
