import reducer from 'reducer';
import { actionTypes } from 'constants';

const collection = 'testCollection'
const path = `${collection}`
const initialState = {
  data: { testStoreAs: { obsoleteDocId: {} } },
  ordered: {},
};

describe('optimisticReducer', () => {

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
      
      expect(pass1.optimistic.testStoreAs.results[0]).to.eql({ other: 'test', id: 'testDocId1' });
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
      
      expect(pass1.optimistic.testStoreAs.results[0]).to.eql(doc1);
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
          orderBy: ['value1']
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
        payload: { data: { [doc2.id]: doc2 } },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      
      expect(pass1.optimistic.testStoreAs.results[0]).to.eql(doc1);
      expect(pass2.optimistic.testStoreAs.results[0]).to.eql({...doc1, ...doc2});
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
        payload: { data: { [doc2.id]: doc2 } },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      
      expect(pass1.optimistic.testStoreAs.results[0]).to.eql(doc1);
      expect(pass1.optimistic.testStoreAs.results[1]).to.eql(undefined);
      expect(pass2.optimistic.testStoreAs.results[0]).to.eql(doc1);
      expect(pass2.optimistic.testStoreAs.results[1]).to.eql(doc2);
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
        payload: { },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      
      expect(pass1.optimistic.testStoreAs.results[0]).to.eql(doc1);
      expect(pass2.optimistic.testStoreAs.results[0]).to.eql(undefined);
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
        payload: { data: { }, ordered: [] },
        type: actionTypes.LISTENER_RESPONSE,
      };
      const action3 = {
        type: actionTypes.OPTIMISTIC_ADDED,
        meta: {
          collection,
          doc: second.id,
        },
        payload: { data: { [second.id]: second } },
      };

      const pass2 = reducer(reducer(initialState, action1), action2);
      const pass3 = reducer(pass2, action3);
      
      expect(pass2.optimistic.testOne.results[0]).to.eql(first);
      expect(pass2.optimistic.testTwo.results[0]).to.eql(undefined);

      expect(pass3.optimistic.testOne.results[0]).to.eql(undefined);
      expect(pass3.optimistic.testTwo.results[0]).to.eql(second);
    });
  });

  describe('OPTIMISTIC_ADDED', () => {
  //   it('adds document', () => {
  //     const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc
  //     const doc2 = { key1: 'value1', id: 'testDocId2' }; // added doc

  //     // Initial seed
  //     const action1 = {
  //       meta: {
  //         collection: 'testCollection',
  //         storeAs: 'testStoreAs',
  //         where: ['abc', '===', 123],
  //       },
  //       payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
  //       type: actionTypes.LISTENER_RESPONSE,
  //     };
  //     const action2 = {
  //       type: actionTypes.GET_REQUEST,
  //       meta: {
  //         collection: 'testCollection',
  //         doc: doc2.id,
  //       },
  //       payload: {
  //         args: [],
  //       },
  //     };

  //     const pass1 = reducer(initialState, action1);
  //     const pass2 = reducer(pass1, action2);
  //     expect(pass1.composite.testStoreAs[doc1.id]).to.eql(doc1);
  //     expect(pass2.composite.testStoreAs[doc1.id]).to.eql(doc1);
  //     const pass3 = reducer(pass2, { type: 'some other type' });
  //     expect(pass3.composite.testStoreAs[doc1.id]).to.eql(doc1);
  //   });

    it('handles adds', () => {
      // const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc
      // const doc2 = { key1: 'value1', id: 'testDocId2' }; // added doc

      // // Initial seed
      // const action1 = {
      //   meta: {
      //     collection: 'testCollection',
      //     storeAs: 'testStoreAs',
      //     where: ['abc', '===', 123],
      //   },
      //   payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
      //   type: actionTypes.LISTENER_RESPONSE,
      // };

      // const action2 = {
      //   meta: {
      //     collection: 'testCollection',
      //     storeAs: 'testStoreAs',
      //     where: ['abc', '===', 123],
      //     path: `testCollection/${doc2.id}`,
      //     doc: doc2.id,
      //   },
      //   payload: { data: doc2, ordered: { oldIndex: -1, newIndex: 1 } },
      //   type: actionTypes.DOCUMENT_ADDED,
      // };

      // const pass1 = reducer(initialState, action1);
      // const pass2 = reducer(pass1, action2);

      // expect(pass2.composite.testStoreAs[doc1.id]).to.eql(doc1);
      // expect(pass2.composite.testStoreAs[doc2.id]).to.eql(doc2);
    });
    it('handles updates', () => {
      // const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc
      // const doc2 = { key1: 'value2', id: 'testDocId1' }; // updated doc

      // // Initial seed
      // const action1 = {
      //   meta: {
      //     collection: 'testCollection',
      //     storeAs: 'testStoreAs',
      //     where: ['abc', '===', 123],
      //   },
      //   payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
      //   type: actionTypes.LISTENER_RESPONSE,
      // };

      // const action2 = {
      //   meta: {
      //     collection: 'testCollection',
      //     storeAs: 'testStoreAs',
      //     where: ['abc', '===', 123],
      //     path: `testCollection/${doc2.id}`,
      //     doc: doc2.id,
      //   },
      //   payload: { data: doc2, ordered: { oldIndex: 0, newIndex: 0 } },
      //   type: actionTypes.DOCUMENT_MODIFIED,
      // };

      // const pass1 = reducer(initialState, action1);
      // expect(pass1.composite.testStoreAs[doc1.id]).to.eql(doc1);

      // const pass2 = reducer(pass1, action2);
      // expect(pass2.composite.testStoreAs[doc1.id]).to.eql(doc2); // both docs have the same id
    });

    it('handles deletes', () => {
      // const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc

      // // Initial seed
      // const action1 = {
      //   meta: {
      //     collection: 'testCollection',
      //     storeAs: 'testStoreAs',
      //     where: ['abc', '===', 123],
      //   },
      //   payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
      //   type: actionTypes.LISTENER_RESPONSE,
      // };

      // const action2 = {
      //   meta: {
      //     collection: 'testCollection',
      //     storeAs: 'testStoreAs',
      //     where: ['abc', '===', 123],
      //     path: `testCollection/${doc1.id}`,
      //     doc: doc1.id,
      //   },
      //   payload: { data: undefined, ordered: { oldIndex: 0, newIndex: -1 } },
      //   type: actionTypes.DOCUMENT_REMOVED,
      // };

      // const pass1 = reducer(initialState, action1);
      // expect(pass1.composite.testStoreAs[doc1.id]).to.eql(doc1);

      // const pass2 = reducer(pass1, action2);
      // expect(pass2.composite.testStoreAs[doc1.id]).to.eql(undefined);
    });

    it('handles unset listener', () => {
      // const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc

      // // Initial seed
      // const action1 = {
      //   meta: {
      //     collection: 'testCollection',
      //     storeAs: 'testStoreAs',
      //     where: ['abc', '===', 123],
      //   },
      //   payload: { data: { [doc1.id]: doc1 }, ordered: [doc1] },
      //   type: actionTypes.LISTENER_RESPONSE,
      // };

      // const action2 = {
      //   meta: {
      //     collection: 'testCollection',
      //     storeAs: 'testStoreAs',
      //     where: ['abc', '===', 123],
      //   },
      //   payload: { name: undefined }, // actually query string
      //   type: actionTypes.UNSET_LISTENER,
      // };

      // const pass1 = reducer(initialState, action1);
      // expect(pass1.composite.testStoreAs[doc1.id]).to.eql(doc1);

      // const pass2 = reducer(pass1, action2);
      // expect(pass2.composite.testStoreAs).to.eql({});
    });

    it('handles a null payload.data', () => {
      // const action1 = {
      //   meta: {
      //     collection: 'testCollection',
      //     storeAs: 'testStoreAs',
      //     where: ['abc', '===', 123],
      //   },
      //   payload: { data: null, ordered: [] },
      //   type: actionTypes.LISTENER_RESPONSE,
      // };
      // const pass1 = reducer(initialState, action1);

      // expect(pass1.composite.testStoreAs).to.eql({}); // TODO: should this be null, undefined, or an empty object?
    });
  });
});
