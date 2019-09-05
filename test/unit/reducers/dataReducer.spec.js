import dataReducer from 'reducers/dataReducer';
import { actionTypes } from 'constants';

const state = {};
let collection = 'test'; // eslint-disable-line prefer-const
const doc = 'thing';
let action = {};
let payload = {};
let meta = {};
let result;

describe('dataReducer', () => {
  beforeEach(() => {
    result = undefined;
  });

  it('is exported', () => {
    expect(dataReducer).to.exist;
  });
  it('is a function', () => {
    expect(dataReducer).to.be.a('function');
  });

  it('returns state for undefined actionType', () => {
    expect(dataReducer({}, {})).to.be.empty;
  });

  describe('actionTypes', () => {
    describe('DOCUMENT_ADDED', () => {
      it('throws for no collection', () => {
        const someDoc = {};
        payload = { data: { abc: someDoc } };
        meta = {};
        action = { meta, payload, type: actionTypes.DOCUMENT_ADDED };
        expect(() => dataReducer({}, action)).to.throw(
          'Collection is required to build query name',
        );
      });
    });

    describe('LISTENER_RESPONSE', () => {
      it('returns state if payload is not defined', () => {
        action = { meta: 'test', type: actionTypes.LISTENER_RESPONSE };
        expect(dataReducer(state, action)).to.equal(state);
      });

      it('returns state if payload does not contain data', () => {
        payload = {};
        action = { meta: {}, payload, type: actionTypes.LISTENER_RESPONSE };
        expect(dataReducer(state, action)).to.equal(state);
      });

      it('updates collection', () => {
        payload = { data: { abc: { field: 'test' } } };
        meta = { collection };
        action = { meta, payload, type: actionTypes.LISTENER_RESPONSE };
        expect(dataReducer(state, action).test.abc.field).to.equal('test');
      });

      it('throws for no collection', () => {
        payload = { data: { abc: {} } };
        meta = {};
        action = { meta, payload, type: actionTypes.LISTENER_RESPONSE };
        expect(() => dataReducer(state, action)).to.throw(
          'Collection is required to build query name',
        );
      });

      it('replaces existing state with new state', () => {
        const data = { [doc]: { newData: { field: 'test' } } };
        payload = { data };
        meta = {
          collection,
          doc,
        };
        const existingState = {
          [collection]: { [doc]: { originalData: { some: { val: 'test' } } } },
        };
        action = {
          meta,
          payload,
          type: actionTypes.LISTENER_RESPONSE,
        };
        result = dataReducer(existingState, action);

        // Contains new data
        expect(result).to.have.nested.property(
          `${collection}.${doc}.newData.field`,
          data[doc].newData.field,
        );

        // Does not have original data
        expect(result).to.not.have.nested.property(
          `${collection}.${doc}.originalData.some.val`,
          existingState[collection][doc].originalData.some.val,
        );
      });

      describe('with subcollections parameter', () => {
        it('updates empty state', () => {
          const data = { abc: { field: 'test' } };
          payload = { data };
          const subcollection = { collection: 'another' };
          meta = {
            collection,
            doc: 'someDoc',
            subcollections: [subcollection],
          };
          action = { meta, payload, type: actionTypes.LISTENER_RESPONSE };
          result = dataReducer(state, action);
          expect(
            result[`test/someDoc/${subcollection.collection}`],
          ).to.have.property('abc', data.abc);
        });

        it('updates state when data already exists', () => {
          const data = { testing: { field: 'test' } };
          payload = { data };
          const subcollection = { collection: 'another', doc: 'testing' };
          meta = {
            collection,
            doc: 'someDoc',
            subcollections: [subcollection],
          };
          const subcollectionPath = `${collection}/someDoc/${
            subcollection.collection
          }`;
          const existingState = {
            [subcollectionPath]: { original: 'data' },
          };
          action = { meta, payload, type: actionTypes.LISTENER_RESPONSE };
          result = dataReducer(existingState, action);
          expect(result[subcollectionPath]).to.have.nested.property(
            `${subcollection.doc}.field`,
            data.testing.field,
          );
        });

        it('updates deep subcollection doc when state data already exists', () => {
          const subcollection1 = { collection: 'subcol1', doc: 'subdoc1' };
          const subcollection2 = { collection: 'subcol2', doc: 'subdoc2' };
          const data = {
            [subcollection2.doc]: { field: 'test' },
          };
          payload = { data };
          meta = {
            collection,
            doc,
            subcollections: [subcollection1, subcollection2],
          };
          const subPath = `${collection}/${doc}/${subcollection1.collection}/${
            subcollection1.doc
          }/${subcollection2.collection}`;
          const existingState = {
            [subPath]: {
              [subcollection2.doc]: { original: 'data' },
            },
          };
          action = { meta, payload, type: actionTypes.LISTENER_RESPONSE };
          result = dataReducer(existingState, action);
          expect(result[subPath]).to.have.nested.property(
            `${subcollection2.doc}.field`,
            data.subdoc2.field,
          );
        });
      });
    });

    describe('GET_SUCCESS', () => {
      it('returns state if payload is not defined', () => {
        action = { meta: 'test', type: actionTypes.GET_SUCCESS };
        expect(dataReducer(state, action)).to.equal(state);
      });

      it('returns state if payload does not contain data', () => {
        payload = {};
        action = { meta: {}, payload, type: actionTypes.GET_SUCCESS };
        expect(dataReducer(state, action)).to.equal(state);
      });

      it('updates collection', () => {
        payload = { data: { abc: { field: 'test' } } };
        meta = { collection };
        action = { meta, payload, type: actionTypes.GET_SUCCESS };
        expect(dataReducer(state, action).test.abc.field).to.equal('test');
      });

      it('throws for no collection', () => {
        payload = { data: { abc: {} } };
        meta = {};
        action = { meta, payload, type: actionTypes.GET_SUCCESS };
        expect(() => dataReducer(state, action)).to.throw(
          'Collection is required to build query name',
        );
      });

      // TODO: Make this test complete
      it.skip('merges with existing data', () => {
        const data = { test: { field: 'test', another: 'test' } };
        payload = { data };
        meta = { collection, doc: 'someDoc' };
        const existingState = { test: { someDoc: { another: 'test' } } };
        action = { meta, payload, type: actionTypes.GET_SUCCESS };
        expect(dataReducer(existingState, action)).to.have.nested.property(
          'test',
          {},
        );
      });

      describe('with subcollections parameter', () => {
        it('updates empty state', () => {
          const data = { abc: { field: 'test' } };
          payload = { data };
          meta = {
            collection,
            doc: 'someDoc',
            subcollections: [{ collection: 'another' }],
          };
          action = { meta, payload, type: actionTypes.GET_SUCCESS };
          expect(dataReducer(state, action)).to.have.nested.property(
            'test/someDoc/another',
            data,
          );
        });

        it('updates state when data already exists', () => {
          const data = { testing: { field: 'test' } };
          payload = { data };
          const subcollection = { collection: 'another', doc: 'testing' };
          meta = {
            collection,
            doc: 'someDoc',
            subcollections: [subcollection],
          };
          const existingState = {
            test: { someDoc: { another: { testing: {} } } },
          };
          action = { meta, payload, type: actionTypes.GET_SUCCESS };
          result = dataReducer(existingState, action);
          expect(
            result[`test/someDoc/${subcollection.collection}`],
          ).to.have.nested.property(
            `${subcollection.doc}.field`,
            data.testing.field,
          );
        });
      });
    });

    describe('CLEAR_DATA', () => {
      it('clears data from state', () => {
        meta = {};
        action = { meta, type: actionTypes.CLEAR_DATA };
        expect(dataReducer({ data: { some: {} } }, action)).to.be.empty;
      });

      it('preserves keys provided in preserve parameter', () => {
        meta = {};
        const data = { some: 'test' };
        action = {
          meta,
          type: actionTypes.CLEAR_DATA,
          preserve: { data: ['some'] },
        };
        expect(dataReducer(data, action)).to.have.property('some', data.some);
      });
    });

    describe('DELETE_SUCCESS', () => {
      it('clears data from state', () => {
        meta = { collection, doc };
        action = { meta, type: actionTypes.DELETE_SUCCESS };
        result = dataReducer(
          { [collection]: { [doc]: { thing: 'asdf' } } },
          action,
        );
        expect(result).to.have.nested.property(`${collection}.${doc}`, null);
      });

      it('preserves keys provided in preserve parameter', () => {
        meta = { collection };
        const data = { [collection]: 'asdf' };
        action = {
          meta,
          type: actionTypes.DELETE_SUCCESS,
          preserve: { data: [collection] },
        };
        expect(dataReducer(data, action)).to.have.property(
          collection,
          data[collection],
        );
      });

      it('sets doc to null', () => {
        meta = { collection, doc };
        const data = { [collection]: { [doc]: { other: 'asdf' } } };
        action = {
          meta,
          type: actionTypes.DELETE_SUCCESS,
        };
        expect(dataReducer(data, action)).to.have.nested.property(
          `${collection}.${doc}`,
          null,
        );
      });
    });

    describe('LISTENER_ERROR', () => {
      it('sets state to null for collection', () => {
        const data = { testing: { field: 'test' } };
        action = {
          meta: { collection },
          payload: { data },
          type: actionTypes.LISTENER_ERROR,
        };
        result = dataReducer(state, action);
        expect(result).to.have.property(collection);
        expect(result[collection]).to.be.null;
      });

      it('preserves existing state (to not run over existing data)', () => {
        const data = { testing: { field: 'test' } };
        action = {
          meta: { collection },
          payload: { data },
          type: actionTypes.LISTENER_ERROR,
        };
        result = dataReducer({ [collection]: {} }, action);
        expect(result).to.have.property(collection);
        expect(result[collection]).to.be.an('object');
      });

      it('throws if meta does not contain collection', () => {
        payload = {};
        action = { meta: {}, payload, type: actionTypes.LISTENER_ERROR };
        expect(() => dataReducer(state, action)).to.throw(
          'Collection is required to build query name',
        );
      });

      describe('preserve parameter', () => {
        it('list of keys preserve state', () => {
          const data = { testing: { field: 'test' } };
          action = {
            meta: { collection },
            payload: { data },
            preserve: { data: [collection] },
            type: actionTypes.LISTENER_ERROR,
          };
          result = dataReducer({ [collection]: {} }, action);
          expect(result).to.have.property(collection);
          expect(result[collection]).to.be.an('object');
        });

        it('list of keys preserve state', () => {
          const data = { testing: { field: 'test' } };
          action = {
            meta: { collection },
            payload: { data },
            preserve: { data: currentState => currentState },
            type: actionTypes.LISTENER_ERROR,
          };
          result = dataReducer({ [collection]: {} }, action);
          expect(result).to.have.property(collection);
          expect(result[collection]).to.be.an('object');
        });
      });
    });
  });
});
