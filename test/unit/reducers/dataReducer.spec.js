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
        meta = { collection, doc };
        action = { meta, payload, type: actionTypes.DOCUMENT_ADDED };
        result = dataReducer({}, action);
        expect(result).to.have.nested.property(
          `${collection}.${doc}.abc`,
          someDoc,
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
          'Collection or Collection Group is required to construct reducer path.',
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
        expect(result).to.have.nested.property(
          `${collection}.${doc}.newData.field`,
          data[doc].newData.field,
        );
        expect(result).to.not.have.nested.property(
          `${collection}.${doc}.originalData.some.val`,
          existingState[collection][doc].originalData.some.val,
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
          action = { meta, payload, type: actionTypes.LISTENER_RESPONSE };
          expect(dataReducer(state, action)).to.have.nested.property(
            'test.someDoc.another',
            data,
          );
        });

        it('updates state when data already exists', () => {
          const data = { testing: { field: 'test' } };
          payload = { data };
          meta = {
            collection,
            doc: 'someDoc',
            subcollections: [{ collection: 'another', doc: 'testing' }],
          };
          const existingState = {
            test: { someDoc: { another: { testing: {} } } },
          };
          action = { meta, payload, type: actionTypes.LISTENER_RESPONSE };
          expect(dataReducer(existingState, action)).to.have.nested.property(
            'test.someDoc.another.testing.field',
            data.testing.field,
          );
        });

        describe('containing multiple subcollections', () => {
          it('updates state when data already exists', () => {
            const data = {
              subdoc2: { field: 'test' },
            };
            payload = { data };
            meta = {
              collection,
              doc: 'someDoc',
              subcollections: [
                { collection: 'subcol1', doc: 'subdoc1' },
                { collection: 'subcol2', doc: 'subdoc2' },
              ],
            };
            const existingState = {
              test: {
                someDoc: { subcol1: { subdoc1: { subcol2: { subdoc2: {} } } } },
              },
            };
            action = { meta, payload, type: actionTypes.LISTENER_RESPONSE };
            expect(dataReducer(existingState, action)).to.have.nested.property(
              'test.someDoc.subcol1.subdoc1.subcol2.subdoc2.field',
              data.subdoc2.field,
            );
          });
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
          'Collection or Collection Group is required to construct reducer path.',
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
            'test.someDoc.another',
            data,
          );
        });

        it('updates state when data already exists', () => {
          const data = { testing: { field: 'test' } };
          payload = { data };
          meta = {
            collection,
            doc: 'someDoc',
            subcollections: [{ collection: 'another', doc: 'testing' }],
          };
          const existingState = {
            test: { someDoc: { another: { testing: {} } } },
          };
          action = { meta, payload, type: actionTypes.GET_SUCCESS };
          expect(dataReducer(existingState, action)).to.have.nested.property(
            'test.someDoc.another.testing.field',
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
        expect(
          dataReducer({ [collection]: { [doc]: { thing: 'asdf' } } }, action),
        ).to.have.nested.property(`${collection}.${doc}`, null);
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
          'Collection or Collection Group is required to construct reducer path.',
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
            preserve: { data: (currentState) => currentState },
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
