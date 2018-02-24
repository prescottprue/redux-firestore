import orderedReducer from '../../../src/reducers/orderedReducer';
import { actionTypes } from '../../../src/constants';

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
            payload: { ordered: orderedData },
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
