import reducer from '../../../src/reducer';
import { actionTypes } from '../../../src/constants';
// TODO: Re-enable once performance util is added back
// import { benchmark } from 'kelonio';
// import { debug } from 'debug';
// import largeAction from './__stubs__/one_mb_action.json';
// import appState from './__stubs__/app_state.json';

const collection = 'testCollection';
const path = collection;

// --- data

const testDocId0 = {
  dateKey: { seconds: 0, nanoseconds: 0 },
  id: 'testDocId0',
  other: 'first',
  path,
};
const testDocId1 = {
  ...testDocId0,
  dateKey: { seconds: 1, nanoseconds: 1 },
  other: 'second',
  id: 'testDocId1',
};
const testDocId3 = {
  ...testDocId0,
  dateKey: { seconds: 3, nanoseconds: 3 },
  other: 'third',
  id: 'testDocId3',
};
const testDocId4 = {
  ...testDocId0,
  dateKey: { seconds: 4, nanoseconds: 4 },
  other: 'fourth',
  id: 'testDocId4',
};

// -- states

const initialState = {
  data: { testStoreAs: { obsoleteDocId: {} } },
  ordered: {},
};

const primedState = {
  cache: {
    database: {
      [path]: { testDocId0, testDocId1, testDocId3, testDocId4 },
    },
  },
};

// -- queries

const whereKey1IsValue1 = {
  collection,
  storeAs: 'testStoreAs',
  where: [['key1', '==', 'value1']],
  orderBy: ['key1'],
};

const whereOtherIsTest = {
  collection,
  storeAs: 'testStoreAs2',
  where: [['other', '==', 'test']],
  orderBy: ['key1'],
};

const whereDateKeyLessOneNS = {
  collection,
  storeAs: 'testStoreAs2',
  where: [['dateKey', '<', { seconds: 0, nanoseconds: 1 }]],
  orderBy: ['dateKey'],
};

const orderDateLimitTwo = {
  collection,
  storeAs: 'testStoreAs',
  orderBy: ['dateKey', 'desc'],
  limit: 2,
};

// --- payload

const setPayload = (docs, fromCache = true) => ({
  data: docs.reduce((data, doc) => ({ ...data, [doc.id]: doc }), {}),
  ordered: docs,
  fromCache,
});

describe('cacheReducer', () => {
  describe('optimistic reads', () => {
    it('SET_LISTENER returns undefined if nothing in memory', () => {
      // Request to set listener
      const action1 = {
        meta: whereKey1IsValue1,
        payload: { name: 'testStoreAs' },
        type: actionTypes.SET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);

      expect(pass1.cache.testStoreAs.ordered).to.eql(undefined);
    });

    it('SET_LISTENER returns data if in memory', () => {
      const doc1 = { key1: 'value1', other: 'test', id: 'testDocId1', path };

      // Initial seed
      const action1 = {
        meta: whereKey1IsValue1,
        payload: setPayload([doc1]),
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: whereOtherIsTest,
        payload: { name: 'testStoreAs2' },
        type: actionTypes.SET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass2.cache.testStoreAs2.ordered).to.eql([
        ['testCollection', 'testDocId1'],
      ]);
    });

    it('SET_LISTENER returns smaller filtered date', () => {
      // Initial seed
      const action1 = {
        meta: whereDateKeyLessOneNS,
        payload: setPayload([testDocId0, testDocId1]),
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: whereDateKeyLessOneNS,
        payload: { name: 'testStoreAs2' },
        type: actionTypes.SET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass2.cache.testStoreAs2.ordered.length).to.eql(1);
      expect(pass2.cache.testStoreAs2.ordered[0][1]).to.eql('testDocId0');
    });

    it('SET_LISTENER returns greater filtered date', () => {
      // Initial seed
      const action1 = {
        meta: whereDateKeyLessOneNS,
        payload: setPayload([testDocId0, testDocId1]),
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          ...whereDateKeyLessOneNS,
          where: [['dateKey', '>', { seconds: 0, nanoseconds: 1 }]],
        },
        payload: { name: 'testStoreAs2' },
        type: actionTypes.SET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass2.cache.testStoreAs2.ordered.length).to.eql(1);
      expect(pass2.cache.testStoreAs2.ordered[0][1]).to.eql('testDocId1');
    });

    it('SET_LISTENER returns smaller or equal filtered date', () => {
      // Initial seed
      const action1 = {
        meta: whereDateKeyLessOneNS,
        payload: setPayload([testDocId0, testDocId1, testDocId3]),
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          ...whereDateKeyLessOneNS,
          where: [['dateKey', '<=', { seconds: 1, nanoseconds: 1 }]],
        },
        payload: { name: 'testStoreAs2' },
        type: actionTypes.SET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass2.cache.testStoreAs2.ordered.length).to.eql(2);
      expect(pass2.cache.testStoreAs2.ordered[0][1]).to.eql('testDocId0');
      expect(pass2.cache.testStoreAs2.ordered[1][1]).to.eql('testDocId1');
    });

    it('SET_LISTENER returns greater or equal filtered date', () => {
      // Initial seed
      const action1 = {
        meta: whereDateKeyLessOneNS,
        payload: setPayload([testDocId0, testDocId1, testDocId3]),
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          ...whereDateKeyLessOneNS,
          where: [['dateKey', '>=', { seconds: 1, nanoseconds: 1 }]],
        },
        payload: { name: 'testStoreAs2' },
        type: actionTypes.SET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass2.cache.testStoreAs2.ordered.length).to.eql(2);
      expect(pass2.cache.testStoreAs2.ordered[0][1]).to.eql('testDocId1');
      expect(pass2.cache.testStoreAs2.ordered[1][1]).to.eql('testDocId3');
    });

    it('SET_LISTENER returns exact filtered date', () => {
      // Initial seed
      const action1 = {
        meta: whereDateKeyLessOneNS,
        payload: setPayload([testDocId0, testDocId1, testDocId3]),
        type: actionTypes.LISTENER_RESPONSE,
      };

      const action2 = {
        meta: {
          ...whereDateKeyLessOneNS,
          where: [['dateKey', '==', { seconds: 1, nanoseconds: 1 }]],
        },
        payload: { name: 'testStoreAs2' },
        type: actionTypes.SET_LISTENER,
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass2.cache.testStoreAs2.ordered.length).to.eql(1);
      expect(pass2.cache.testStoreAs2.ordered[0][1]).to.eql('testDocId1');
    });

    it('SET_LISTENER pagination with startAt', () => {
      const stateDesc = {
        meta: {
          ...orderDateLimitTwo,
          startAt: { seconds: 2, nanoseconds: 2 },
        },
        payload: { name: 'testStoreAs' },
        type: actionTypes.SET_LISTENER,
      };
      const stateAsc = JSON.parse(JSON.stringify(stateDesc));
      stateAsc.meta.orderBy = ['dateKey'];

      const passA = reducer(primedState, stateDesc);
      expect(passA.cache.testStoreAs).to.eql({
        ordered: [
          ['testCollection', 'testDocId1'],
          ['testCollection', 'testDocId0'],
        ],
        collection: 'testCollection',
        storeAs: 'testStoreAs',
        orderBy: ['dateKey', 'desc'],
        startAt: { seconds: 2, nanoseconds: 2 },
        limit: 2,
        via: 'memory',
      });

      const passB = reducer(primedState, stateAsc);
      expect(passB.cache.testStoreAs).to.eql({
        ordered: [
          ['testCollection', 'testDocId3'],
          ['testCollection', 'testDocId4'],
        ],
        collection: 'testCollection',
        storeAs: 'testStoreAs',
        orderBy: ['dateKey'],
        limit: 2,
        startAt: { seconds: 2, nanoseconds: 2 },
        via: 'memory',
      });
    });

    it('SET_LISTENER pagination with startAfter', () => {
      const stateDesc = {
        meta: {
          ...orderDateLimitTwo,
          startAfter: { seconds: 2, nanoseconds: 2 },
        },
        payload: { name: 'testStoreAs' },
        type: actionTypes.SET_LISTENER,
      };
      const stateAsc = JSON.parse(JSON.stringify(stateDesc));
      stateAsc.meta.orderBy = ['dateKey', 'asc'];

      const passA = reducer(primedState, stateDesc);
      expect(passA.cache.testStoreAs).to.eql({
        ordered: [
          ['testCollection', 'testDocId1'],
          ['testCollection', 'testDocId0'],
        ],
        collection: 'testCollection',
        storeAs: 'testStoreAs',
        orderBy: ['dateKey', 'desc'],
        limit: 2,
        startAfter: { seconds: 2, nanoseconds: 2 },
        via: 'memory',
      });

      const passB = reducer(primedState, stateAsc);
      expect(passB.cache.testStoreAs).to.eql({
        ordered: [
          ['testCollection', 'testDocId3'],
          ['testCollection', 'testDocId4'],
        ],
        collection: 'testCollection',
        storeAs: 'testStoreAs',
        orderBy: ['dateKey', 'asc'],
        limit: 2,
        startAfter: { seconds: 2, nanoseconds: 2 },
        via: 'memory',
      });
    });

    it('SET_LISTENER pagination with endAt', () => {
      const stateDesc = {
        meta: { ...orderDateLimitTwo, endAt: { seconds: 2, nanoseconds: 2 } },
        payload: { name: 'testStoreAs' },
        type: actionTypes.SET_LISTENER,
      };
      const stateAsc = JSON.parse(JSON.stringify(stateDesc));
      stateAsc.meta.orderBy = ['dateKey', 'asc'];

      const passA = reducer(primedState, stateDesc);
      expect(passA.cache.testStoreAs).to.eql({
        ordered: [
          ['testCollection', 'testDocId4'],
          ['testCollection', 'testDocId3'],
        ],
        collection: 'testCollection',
        storeAs: 'testStoreAs',
        orderBy: ['dateKey', 'desc'],
        limit: 2,
        endAt: { seconds: 2, nanoseconds: 2 },
        via: 'memory',
      });

      const passB = reducer(primedState, stateAsc);
      expect(passB.cache.testStoreAs).to.eql({
        ordered: [
          ['testCollection', 'testDocId0'],
          ['testCollection', 'testDocId1'],
        ],
        collection: 'testCollection',
        storeAs: 'testStoreAs',
        orderBy: ['dateKey', 'asc'],
        limit: 2,
        endAt: { seconds: 2, nanoseconds: 2 },
        via: 'memory',
      });
    });

    it('SET_LISTENER pagination with endBefore', () => {
      const stateDesc = {
        meta: {
          ...orderDateLimitTwo,
          endBefore: { seconds: 2, nanoseconds: 2 },
        },
        payload: { name: 'testStoreAs' },
        type: actionTypes.SET_LISTENER,
      };
      const stateAsc = JSON.parse(JSON.stringify(stateDesc));
      stateAsc.meta.orderBy = ['dateKey'];

      const passA = reducer(primedState, stateDesc);
      expect(passA.cache.testStoreAs).to.eql({
        ordered: [
          ['testCollection', 'testDocId4'],
          ['testCollection', 'testDocId3'],
        ],
        collection: 'testCollection',
        storeAs: 'testStoreAs',
        orderBy: ['dateKey', 'desc'],
        limit: 2,
        endBefore: { seconds: 2, nanoseconds: 2 },
        via: 'memory',
      });

      const passB = reducer(primedState, stateAsc);
      expect(passB.cache.testStoreAs).to.eql({
        ordered: [
          ['testCollection', 'testDocId0'],
          ['testCollection', 'testDocId1'],
        ],
        collection: 'testCollection',
        storeAs: 'testStoreAs',
        orderBy: ['dateKey'],
        limit: 2,
        endBefore: { seconds: 2, nanoseconds: 2 },
        via: 'memory',
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

      expect(pass1.cache.testStoreAs.ordered[0][1]).to.eql(doc1.id);
      expect(pass2.cache.testStoreAs.ordered[0][1]).to.eql(doc1.id);
      expect(pass2.cache.database[collection][doc1.id]).to.eql(doc1);
      expect(pass2.cache.databaseOverrides[collection][doc1.id]).to.eql(doc2);
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

      expect(pass1.cache.testStoreAs.ordered[0][1]).to.eql(doc1.id);
      expect(pass1.cache.testStoreAs.ordered[1]).to.eql(undefined);
      expect(pass2.cache.database[collection][doc1.id]).to.eql(doc1);
      expect(pass2.cache.databaseOverrides[collection][doc2.id]).to.eql(doc2);

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
        payload: setPayload([doc1]),
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

      expect(pass1.cache.testStoreAs.ordered[0][1]).to.eql(doc1.id);
      expect(pass2.cache.testStoreAs.ordered[0][1]).to.eql(doc2.id);
      expect(pass3.cache.testStoreAs.ordered[0][1]).to.eql(doc1.id);

      // overrides must be cleared
      expect(pass2.cache.databaseOverrides).to.eql({
        testCollection: {
          testDocId1: {
            id: 'testDocId1',
            key1: 'value1',
            key2: 'other',
            path: 'testCollection',
          },
        },
      });
      expect(pass3.cache.databaseOverrides).to.eql({});
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

      expect(pass2.cache.testOne.ordered[0][1]).to.eql(first.id);
      expect(pass2.cache.testTwo.ordered[0]).to.eql(undefined);

      // doc moved from testOne to testTwo query
      expect(pass3.cache.testOne.ordered[0]).to.eql(undefined);
      expect(pass3.cache.testTwo.ordered[0][1]).to.eql(second.id);
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

      expect(pass2.cache.testOne).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'testOne',
        where: [['key1', '<=', 1]],
        via: 'cache',
      });

      expect(pass2.cache.testTwo).to.eql({
        ordered: [],
        collection: 'testCollection',
        storeAs: 'testTwo',
        where: [['key1', '>=', 2]],
        via: 'cache',
      });

      // doc moved from testOne to testTwo query
      expect(pass3.cache.testOne).to.eql({
        ordered: [],
        collection: 'testCollection',
        storeAs: 'testOne',
        where: [['key1', '<=', 1]],
        via: 'optimistic',
      });
      expect(pass3.cache.testTwo).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'testTwo',
        where: [['key1', '>=', 2]],
        via: 'optimistic',
      });
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

      expect(pass2.cache.testOne).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'testOne',
        where: [['key1', '<', 2]],
        via: 'cache',
      });
      expect(pass2.cache.testTwo).to.eql({
        ordered: [],
        collection: 'testCollection',
        storeAs: 'testTwo',
        where: [['key1', '>', 1]],
        via: 'cache',
      });

      // doc moved from testOne to testTwo query
      expect(pass3.cache.testOne).to.eql({
        ordered: [],
        collection: 'testCollection',
        storeAs: 'testOne',
        where: [['key1', '<', 2]],
        via: 'optimistic',
      });
      expect(pass3.cache.testTwo).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'testTwo',
        where: [['key1', '>', 1]],
        via: 'optimistic',
      });
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

      expect(pass2.cache.testOne).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'testOne',
        where: [['key1', '!=', 2]],
        via: 'cache',
      });
      expect(pass2.cache.testTwo).to.eql({
        ordered: [],
        collection: 'testCollection',
        storeAs: 'testTwo',
        where: [['key1', '>', 1]],
        via: 'cache',
      });

      // doc moved from testOne to testTwo query
      expect(pass3.cache.testOne).to.eql({
        ordered: [],
        collection: 'testCollection',
        storeAs: 'testOne',
        where: [['key1', '!=', 2]],
        via: 'optimistic',
      });
      expect(pass3.cache.testTwo).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'testTwo',
        where: [['key1', '>', 1]],
        via: 'optimistic',
      });
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

      expect(pass2.cache.notTwo).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'notTwo',
        where: [['key1', 'not-in', [2]]],
        via: 'cache',
      });
      expect(pass2.cache.isIdMatch).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'isIdMatch',
        where: [['__name__', '==', 'testDocId1']],
        via: 'cache',
      });

      // doc moved from testOne to testTwo query
      expect(pass3.cache.notTwo).to.eql({
        ordered: [],
        collection: 'testCollection',
        storeAs: 'notTwo',
        where: [['key1', 'not-in', [2]]],
        via: 'optimistic',
      });
      expect(pass3.cache.isIdMatch).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'isIdMatch',
        where: [['__name__', '==', 'testDocId1']],
        via: 'cache',
      });
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

      expect(pass2.cache.testOne).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'testOne',
        where: [['key1.val', 'array-contains', 1]],
        via: 'cache',
      });
      expect(pass2.cache.testTwo).to.eql({
        ordered: [],
        collection: 'testCollection',
        storeAs: 'testTwo',
        where: [['key1.val', 'array-contains-any', [2]]],
        via: 'cache',
      });

      // doc moved from testOne to testTwo query
      expect(pass3.cache.testOne).to.eql({
        ordered: [],
        collection: 'testCollection',
        storeAs: 'testOne',
        where: [['key1.val', 'array-contains', 1]],
        via: 'optimistic',
      });
      expect(pass3.cache.testTwo).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'testTwo',
        where: [['key1.val', 'array-contains-any', [2]]],
        via: 'optimistic',
      });
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

      expect(pass1.cache.testStoreAs.ordered[0][1]).to.eql(doc1.id);
      expect(pass2.cache.testStoreAs.ordered[0][1]).to.eql(doc2.id);
      expect(pass2.cache.testStoreAs.ordered[1][1]).to.eql(doc1.id);
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

      expect(pass1.cache.testStoreAs.ordered[0][1]).to.eql(doc1.id);
      expect(pass2.cache.testStoreAs.ordered[0][1]).to.eql(doc2.id);
      expect(pass3.cache.testStoreAs.ordered[0][1]).to.eql(doc2.id);

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
      expect(pass1.cache.testStoreAs.ordered[0][1]).to.eql(doc1.id);
      expect(pass2.cache.testStoreAs.ordered[0][1]).to.eql(doc1a.id);

      expect(pass3.cache.testStoreAs.ordered).to.eql([
        [path, doc1a.id],
        [path, doc2.id],
      ]);
      expect(pass4.cache.testStoreAs.ordered).to.eql([
        [path, doc1a.id],
        [path, doc2.id],
      ]);

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

      expect(pass1.cache.lessThanTwo.ordered[0][1]).to.eql(doc2.id);
      expect(pass1.cache.lessThanTwo.ordered[1][1]).to.eql(doc1.id);

      expect(pass2.cache.lessThanTwo.ordered[0][1]).to.eql(doc1.id);
      expect(pass2.cache.lessThanTwo.ordered[1]).to.eql(undefined);

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

      expect(pass1.cache.testStoreAs.ordered[0][1]).to.eql(doc2.id);
      expect(pass1.cache.testStoreAs.ordered[1][1]).to.eql(doc1.id);
      expect(pass2.cache.testStoreAs.ordered[0][1]).to.eql(doc1.id);
      expect(pass2.cache.testStoreAs.ordered[1]).to.eql(undefined);

      // Removing from query !== deleting. Other queries could have the result
      expect(pass1.cache.database.testCollection.testDocId2).to.eql(doc2);
    });
  });

  describe('UNSET_LISTENER', () => {
    it('unset removes query but maintains in database cache', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path }; // initial doc

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
      expect(pass1.cache.testStoreAs.ordered[0][1]).to.eql(doc1.id);
      expect(pass1.cache.database[collection]).to.eql({ [doc1.id]: doc1 });

      const pass2 = reducer(pass1, action2);
      expect(pass2.cache.testStoreAs).to.eql(undefined);
      expect(pass2.cache.database[collection]).to.eql({ [doc1.id]: doc1 });
    });

    it('unset preserves query and maintains in database cache (preserve mode)', () => {
      const doc1 = { key1: 'value1', id: 'testDocId1', path }; // initial doc

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
      expect(pass1.cache.testStoreAs.ordered[0][1]).to.eql(doc1.id);
      expect(pass1.cache.database[collection]).to.eql({ [doc1.id]: doc1 });

      const pass2 = reducer(pass1, action2);
      expect(pass2.cache.testStoreAs.ordered[0][1]).to.eql(doc1.id);
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

      expect(pass1.cache.testStoreAs.ordered).to.eql([]);
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

      // Initial seed
      const action1 = {
        meta: {
          collection,
          where: ['key1', '==', 'value1'],
          storeAs: 'testStoreAs',
        },
        payload: setPayload([doc1]),
        type: actionTypes.LISTENER_RESPONSE,
      };
      // mutate
      const action2 = {
        type: actionTypes.MUTATE_START,
        meta: {
          collection,
          doc: updates.id,
          timestamp: '999',
        },
        payload: {
          data: { ...updates },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass2.cache.testStoreAs).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        where: ['key1', '==', 'value1'],
        storeAs: 'testStoreAs',
        via: 'cache',
      });
      expect(pass2.cache.database).to.eql({
        testCollection: {
          testDocId1: {
            path: 'testCollection',
            id: 'testDocId1',
            key1: 'value1',
            array: [1, 2, 3, 4],
            obj: { a: 1, b: { x: 0 }, c: { z: 9 } },
          },
        },
      });
      expect(pass2.cache.databaseOverrides).to.eql({
        testCollection: {
          testDocId1: {
            path: 'testCollection',
            id: 'testDocId1',
            vanilla: 'some-data',
            date: '2021-01-01T00:00:00.000Z',
            array: [1, 2, 3, 4, 5],
            obj: { a: 0, b: { y: 9 }, c: { z: 10 } },
          },
        },
      });
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
          timestamp: '999',
        },
        payload: {
          data: [{ ...updates }],
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass2.cache.testStoreAs).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        where: ['key1', '==', 'value1'],
        storeAs: 'testStoreAs',
        via: 'cache',
      });
      expect(pass2.cache.database).to.eql({
        testCollection: {
          testDocId1: {
            path: 'testCollection',
            id: 'testDocId1',
            key1: 'value1',
            number: 11,
            array: [1, 2, 3, 4],
            obj: { a: 1, b: { x: 0 }, c: { z: 9 } },
          },
        },
      });

      expect(pass2.cache.databaseOverrides).to.eql({
        testCollection: {
          testDocId1: {
            path: 'testCollection',
            id: 'testDocId1',
            number: 15,
            date: '2021-01-01T00:00:00.000Z',
            array: [1, 3, 4],
            obj: { a: 0, b: { y: 9 }, c: { z: 10 } },
          },
        },
      });
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
          timestamp: '999',
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
                path,
                id: updates.id,
                multipled: fromReducerCache.multipled * 4,
                ...updates,
              }),
            ],
          },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass2.cache.testStoreAs).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'testStoreAs',
        via: 'cache',
      });

      expect(pass2.cache.database).to.eql({
        testCollection: {
          testDocId1: {
            path: 'testCollection',
            id: 'testDocId1',
            key1: 'value1',
            number: 11,
            multipled: 3,
            array: [1, 2, 3, 4],
            obj: { a: 1, b: { x: 0 }, c: { z: 9 } },
          },
        },
      });

      expect(pass2.cache.databaseOverrides).to.eql({
        testCollection: {
          testDocId1: {
            path: 'testCollection',
            id: 'testDocId1',
            multipled: 12,
            number: 15,
            date: '2021-01-01T00:00:00.000Z',
            array: [1, 3, 4],
            obj: { a: 0, b: { y: 9 }, c: { z: 10 } },
          },
        },
      });
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
          timestamp: '999',
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
          timestamp: '999',
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
              path,
              id: updates.id,
              multipled: fromReducerCache.multipled * 4,
              ...updates,
            }),
          },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);

      expect(pass2.cache.testStoreAs).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        storeAs: 'testStoreAs',
        timestamp: '999',
        via: 'cache',
      });

      expect(pass2.cache.database).to.eql({
        testCollection: {
          testDocId1: {
            path: 'testCollection',
            id: 'testDocId1',
            key1: 'value1',
            number: 11,
            multipled: 3,
            array: [1, 2, 3, 4],
            obj: { a: 1, b: { x: 0 }, c: { z: 9 } },
          },
        },
      });

      expect(pass2.cache.databaseOverrides).to.eql({
        testCollection: {
          testDocId1: {
            path: 'testCollection',
            id: 'testDocId1',
            multipled: 12,
            number: 15,
            date: '2021-01-01T00:00:00.000Z',
            array: [1, 3, 4],
            obj: { a: 0, b: { y: 9 }, c: { z: 10 } },
          },
        },
      });
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
          timestamp: '999',
        },
        payload: {
          data: {
            reads: {
              firestore_doesnt_support_transaction_queries: {
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
    // TODO: Unskip once failure is understood
    it.skip('Remove overrides on Firestore failures', () => {
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
          timestamp: '999',
        },
        payload: {
          data: {
            collection: path,
            doc: updates.id,
            data: { vanilla: 'some-data' },
          },
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
          data: {
            collection: path,
            doc: updates.id,
            data: { vanilla: 'some-data' },
          },
        },
      };

      const pass1 = reducer(initialState, action1);
      const pass2 = reducer(pass1, action2);
      const pass3 = reducer(pass2, action3);

      // database should never changes. It's a perfect mirror of firestore.
      expect(pass1.cache.database.testCollection.testDocId1).to.eql(doc1);
      expect(pass2.cache.database.testCollection.testDocId1).to.eql(doc1);
      expect(pass3.cache.database.testCollection.testDocId1).to.eql(doc1);

      expect(pass2.cache.testStoreAs).to.eql({
        ordered: [['testCollection', 'testDocId1']],
        collection: 'testCollection',
        where: ['key1', '==', 'value1'],
        storeAs: 'testStoreAs',
        via: 'cache',
      });

      expect(pass2.cache.database).to.eql({
        testCollection: {
          testDocId1: {
            path: 'testCollection',
            id: 'testDocId1',
            key1: 'value1',
          },
        },
      });

      expect(pass2.cache.databaseOverrides).to.eql({
        testCollection: {
          testDocId1: {
            path: 'testCollection',
            id: 'testDocId1',
            vanilla: 'some-data',
          },
        },
      });

      // overrides were deleted
      expect(pass3.cache.database).to.eql({
        testCollection: {
          testDocId1: {
            path: 'testCollection',
            id: 'testDocId1',
            key1: 'value1',
          },
        },
      });

      expect(pass3.cache.databaseOverrides).to.eql({});

      expect(pass3.cache.mutations).to.eql({
        999: {
          testCollection: {
            testDocId1: {
              path: 'testCollection',
              id: 'testDocId1',
              vanilla: 'some-data',
            },
          },
        },
      });
    });
  });
  // TODO: Re-enable once performance util is included (dropping when in prod)
  // describe('Speed test (on 2015 Dual-core 1.5Ghz i5 w/ 8GB 1600 DDR3)', () => {
  //   let namespaces;
  //   before(() => {
  //     namespaces = debug.disable();
  //   });
  //   after(() => {
  //     if (namespaces) debug.enable(namespaces);
  //   });

  //   it('<36ms processing large action and large state', async () => {
  //     // eslint-disable-next-line no-invalid-this
  //     this.timeout(5_000);

  //     const manyActions = new Array(1).fill(null).map(() => largeAction);

  //     await benchmark.record(
  //       () => manyActions.forEach((action) => reducer(appState, action)),
  //       {
  //         iterations: 90,
  //         meanUnder: 36,
  //         standardDeviationUnder: 10,
  //       },
  //     );
  //   }, 5_000);

  //   it('<18ms to process stores 2,000 docs', async () => {
  //     const generate = (limit) =>
  //       new Array(limit).fill(null).map(() => ({
  //         path,
  //         id: `testDocId${Math.random()}`,
  //         key1: 'value1',
  //         number: 11,
  //         multipled: 3,
  //         dateKey: { seconds: 1, nanoseconds: 1 },
  //         array: [1, 2, 3, 4],
  //         obj: { a: 1, b: { x: 0 }, c: { z: 9 } },
  //       }));

  //     const action = {
  //       meta: whereKey1IsValue1,
  //       payload: setPayload(generate(2_000)),
  //       type: actionTypes.LISTENER_RESPONSE,
  //     };

  //     await benchmark.record(() => reducer(appState, action), {
  //       iterations: 50,
  //       meanUnder: 18,
  //     });
  //   }, 5_000);

  //   it('<24ms to process 100 mutates', async () => {
  //     const actions = {
  //       type: actionTypes.MUTATE_START,
  //       payload: {
  //         meta: { collection: testDocId0.path, doc: testDocId0.id },
  //         data: [
  //           {
  //             path: testDocId0.path,
  //             id: testDocId0.id,
  //             dateKey: { seconds: 99, nanoseconds: 99 },
  //           },
  //         ],
  //       },
  //     };

  //     const manyActions = new Array(100).fill(null).map(() => actions);

  //     await benchmark.record(
  //       () => manyActions.forEach((action) => reducer(appState, action)),
  //       {
  //         iterations: 125,
  //         meanUnder: 24,
  //       },
  //     );
  //   }, 5_000);

  //   it('<4ms to process 1MB action', async () => {
  //     await benchmark.record(() => reducer(primedState, largeAction), {
  //       iterations: 1_000,
  //       meanUnder: 4,
  //     });
  //   }, 5_000);
  // });
});
