import orderedReducer from 'reducers/orderedReducer';
import { actionTypes } from 'constants';

let action;
let state;

describe('orderedReducer', () => {
  it('is exported', () => {
    expect(orderedReducer).to.exist;
  });
  it('is a function', () => {
    expect(orderedReducer).to.be.a('function');
  });
  it('returns state for undefined actionType', () => {
    expect(orderedReducer({}, {})).to.exist;
  });

  describe('actionTypes', () => {
    describe('DOCUMENT_ADDED', () => {
      it('throws for no collection', () => {
        const collection = 'test1';
        const doc = 'test2';
        const someDoc = { id: doc };
        const payload = {
          ordered: { newIndex: 0, oldIndex: -1 },
          data: someDoc,
        };
        const meta = { collection, doc };
        action = { meta, payload, type: actionTypes.DOCUMENT_ADDED };
        const result = orderedReducer({}, action);
        expect(result).to.have.nested.property(
          `${collection}.0.id`,
          someDoc.id,
        );
      });
    });
    describe('LISTENER_RESPONSE', () => {
      it('returns state if payload is not defined', () => {
        action = { meta: 'test', type: actionTypes.LISTENER_RESPONSE };
        state = {};
        expect(orderedReducer(state, action)).to.equal(state);
      });

      it('returns state if payload does not contain ordered', () => {
        action = {
          meta: 'test',
          type: actionTypes.LISTENER_RESPONSE,
          payload: {},
        };
        state = {};
        expect(orderedReducer(state, action)).to.equal(state);
      });

      it('returns state if meta is not defined', () => {
        action = {
          type: actionTypes.LISTENER_RESPONSE,
          payload: {},
        };
        state = {};
        expect(orderedReducer(state, action)).to.equal(state);
      });

      it('updates state with payload.ordered', () => {
        const orderedData = [{}];
        action = {
          meta: { collection: 'testing' },
          type: actionTypes.LISTENER_RESPONSE,
          payload: { ordered: orderedData },
        };
        state = {};
        expect(orderedReducer(state, action)).to.have.property(
          'testing',
          orderedData,
        );
      });

      it('merges collection already within state', () => {
        const id = 'doc';
        const someField = 'a thing';
        const orderedData = [{ id, someField }];
        action = {
          meta: { collection: 'testing' },
          type: actionTypes.LISTENER_RESPONSE,
          payload: { ordered: orderedData },
        };
        state = { testing: [{ id: 'some', someField: 'original' }] };
        expect(orderedReducer(state, action)).to.have.nested.property(
          'testing.1.someField',
          someField,
        );
      });

      describe('doc', () => {
        it.skip('adds a new doc within state', () => {
          const orderedData = { id: 'doc' };
          action = {
            meta: { collection: 'testing', doc: 'doc' },
            type: actionTypes.LISTENER_RESPONSE,
            payload: { ordered: orderedData },
          };
          state = {};
          expect(orderedReducer(state, action)).to.have.property(
            'testing',
            orderedData,
          );
        });

        it('updates doc already within state', () => {
          const id = 'doc';
          const someField = 'a thing';
          const orderedData = [{ id, someField }];
          action = {
            meta: { collection: 'testing', doc: 'doc' },
            type: actionTypes.LISTENER_RESPONSE,
            payload: { ordered: orderedData, data: orderedData[0] },
          };
          state = { testing: [{ id, someField: 'original' }] };
          expect(orderedReducer(state, action)).to.have.nested.property(
            'testing.0.someField',
            someField,
          );
        });
      });

      it('stores data under storeAs', () => {
        const orderedData = [{}];
        const storeAs = 'other';
        action = {
          meta: { storeAs },
          type: actionTypes.LISTENER_RESPONSE,
          payload: { ordered: orderedData },
        };
        state = {};
        expect(orderedReducer(state, action)).to.have.property(
          storeAs,
          orderedData,
        );
      });
    });

    describe('GET_SUCCESS', () => {
      it('returns state if payload is not defined', () => {
        action = { meta: 'test', type: actionTypes.GET_SUCCESS };
        state = {};
        expect(orderedReducer(state, action)).to.equal(state);
      });

      it('returns state if payload does not contain ordered', () => {
        action = {
          meta: 'test',
          type: actionTypes.GET_SUCCESS,
          payload: {},
        };
        state = {};
        expect(orderedReducer(state, action)).to.equal(state);
      });

      describe('preserve parameter', () => {
        it('array saves keys from state', () => {
          action = {
            meta: 'test',
            type: actionTypes.GET_SUCCESS,
            payload: {},
            preserve: ['some'],
          };
          state = { some: 'value' };
          expect(orderedReducer(state, action)).to.have.property('some');
        });
      });
    });

    describe('CLEAR_DATA', () => {
      it('removes all data from state', () => {
        action = {
          type: actionTypes.CLEAR_DATA,
        };
        state = {};
        expect(orderedReducer(state, action)).to.be.empty;
      });

      describe('preserve parameter', () => {
        it('array saves keys from state', () => {
          action = {
            meta: 'test',
            type: actionTypes.CLEAR_DATA,
            payload: {},
            preserve: { ordered: ['some'] },
          };
          state = { some: 'value' };
          expect(orderedReducer(state, action)).to.have.property('some');
        });

        it('function returns state to save', () => {
          action = {
            meta: 'test',
            type: actionTypes.CLEAR_DATA,
            payload: {},
            preserve: { ordered: currentState => currentState },
          };
          state = { some: 'value' };
          expect(orderedReducer(state, action)).to.have.property('some');
        });
      });
    });
  });
});
