import { expect } from 'chai';
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
    const originalState = {}
    expect((listenersReducer as any)(originalState, {})).to.equal(originalState);
  });

  it('exports both byId and allIds state', () => {
    const originalState = {}
    const result = (listenersReducer as any)(originalState, {});
    expect(result).to.have.property('byId');
    expect(result).to.have.property('allIds');
  });

  describe('allIds sub-reducer', () => {
    describe('actionTypes', () => {
      describe('SET_LISTENER', () => {
        it.skip('returns state if payload is not defined', () => {
          action = {
            meta: { collection: 'test' },
            type: actionTypes.SET_LISTENER,
          };
          state = { allIds: [], byId: {} };
          expect(listenersReducer(state, action).allIds).to.be.have.length(1);
        });

        it('returns state if payload is not defined', () => {
          action = {
            meta: { collection: 'test' },
            type: actionTypes.SET_LISTENER,
            payload: { name: 'data' },
          };
          state = { allIds: [], byId: {} };
          expect(listenersReducer(state, action).allIds).to.be.have.length(1);
        });
      });

      describe('UNSET_LISTENER', () => {
        it.skip('returns state if payload is not defined', () => {
          action = {
            type: actionTypes.UNSET_LISTENER,
          };
          state = { allIds: [], byId: {} };
          expect(listenersReducer(state, action).allIds).to.be.have.length(1);
        });

        it('returns state if payload is not defined', () => {
          action = {
            type: actionTypes.UNSET_LISTENER,
            payload: { name: 'test' },
          };
          state = { allIds: ['test'], byId: {} };
          expect(listenersReducer(state, action).allIds).to.be.have.length(0);
        });
      });
    });
  });
});
