import listenersReducer from '../../../src/reducers/listenersReducer';
import { actionTypes } from '../../../src/constants';

let state;
let action;

describe('listenersReducer', () => {
  it('is exported', () => {
    expect(listenersReducer).to.exist;
  });
  it('is a function', () => {
    expect(listenersReducer).to.be.a('function');
  });
  it('returns state for undefined actionType', () => {
    expect(listenersReducer({}, {})).to.exist;
  });
  it('exports both byId and allIds state', () => {
    const result = listenersReducer({}, {});
    expect(result).to.have.property('byId');
    expect(result).to.have.property('allIds');
  });
  describe('allIds sub-reducer', () => {
    describe('actionTypes', () => {
      describe('LISTENER_ERROR', () => {
        it('returns state if payload is not defined', () => {
          action = {
            meta: { collection: 'test' },
            type: actionTypes.LISTENER_ERROR,
          };
          state = { allIds: [], byId: {} };
          expect(listenersReducer(state, action)).to.be.an('object');
        });

        it('returns state if payload is not defined', () => {
          action = {
            meta: { collection: 'test' },
            type: actionTypes.LISTENER_ERROR,
            payload: { some: 'data' },
          };
          state = { allIds: [], byId: {} };
          expect(listenersReducer(state, action)).to.be.an('object');
        });
      });
    });
  });
});
