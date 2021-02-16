import reducer from 'reducer';
import { actionTypes } from 'constants';

const collection = 'testCollection'
const another = 'anotherCollection'
const path = `${collection}`
const anotherPath = `${another}`
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

  describe('fast populates', () => {
    it('query fields return partial document', () => {
      const doc1 = { key1: 'value1', anotherId: 'anotherDocId1', id: 'testDocId1', path };
      const doc2 = { other: 'test', id: 'anotherDocId1', path:anotherPath };
      
      // Initial seed
      const action1 = {
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: [['key1', '==', 'value1']],
          orderBy: ['value1'],
          fields: ['id', 'key1', 'anotherDocument'],
          populate: [['anotherId', anotherPath, 'anotherDocument']]
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

      expect(pass1.optimistic.testStoreAs.results[0]).to.eql({  id: 'testDocId1', key1: 'value1' });
      expect(pass2.optimistic.testStoreAs.results[0]).to.eql({ anotherDocument:doc2, key1: 'value1', id: 'testDocId1' });
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

  describe('DOCUMENT_ADDED', () => {
    it('Firestore added document removes override', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path }; 
      const doc2 = { key2: 'value2', id: 'testDocId1', path };

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
        type: actionTypes.OPTIMISTIC_ADDED,
        meta: {
          collection,
          doc: doc2.id,
        },
        payload: { data: { [doc2.id]: doc2 } },
      };
      const action3 = {
        type: actionTypes.DOCUMENT_ADDED,
        meta: {
          collection,
          doc: doc2.id,
        },
        payload: { 
          data: {...doc2, key1: 'value1' },
          ordered: { newIndex:0, oldIndex:-1 },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      const pass3 = reducer(pass2, action3);

      expect(pass1.optimistic.testStoreAs.results[0]).to.eql(doc1);
      expect(pass2.optimistic.testStoreAs.results[0]).to.eql({...doc1, ...doc2});
      expect(pass3.optimistic.testStoreAs.results[0]).to.eql({...doc1, ...doc2});

      expect(pass1.optimistic.overrides).to.eql(undefined);
      expect(pass2.optimistic.overrides[collection]).to.eql({[doc2.id]:doc2});
      expect(pass3.optimistic.overrides[collection]).to.eql({});
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
          orderBy: ['value1']
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
        payload: { },
      };
      const action3 = {
        type: actionTypes.DOCUMENT_REMOVED,
        meta: {
          collection,
          doc: doc2.id,
        },
        payload: { 
          data: {},
          ordered: { newIndex:-1, oldIndex:0 },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      const pass3 = reducer(pass2, action3);      

      expect(pass1.optimistic.testStoreAs.results[0]).to.eql(doc1);
      expect(pass2.optimistic.testStoreAs.results[0]).to.eql(undefined);
      expect(pass3.optimistic.testStoreAs.results[0]).to.eql(undefined);

      expect(pass1.optimistic.overrides).to.eql(undefined);
      expect(pass2.optimistic.overrides[collection]).to.eql({[doc2.id]:null});
      expect(pass3.optimistic.overrides[collection]).to.eql({});
    });
  })

  describe('UNSET_LISTENER', () => {
  
    it('handles unset listener', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1' }; // initial doc

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
        meta: {
          collection,
          storeAs: 'testStoreAs',
          where: ['key1', '==', 'value1'],
        },
        payload: { }, // actually query string
        type: actionTypes.UNSET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);
      expect(pass1.optimistic.testStoreAs.results[0]).to.eql(doc1);
      expect(pass1.optimistic.database[collection]).to.eql({[doc1.id]:doc1});

      const pass2 = reducer(pass1, action2);
      expect(pass2.optimistic.testStoreAs).to.eql(undefined);
      expect(pass2.optimistic.database[collection]).to.eql({});
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
      expect(pass1.optimistic.testStoreAs.results).to.eql([]); 
    });
  });
});
