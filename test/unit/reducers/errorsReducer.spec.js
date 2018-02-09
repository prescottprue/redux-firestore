import errorsReducer from '../../../src/reducers/errorsReducer';
import { actionTypes } from '../../../src/constants';

let action;
let state;

describe('errorsReducer', () => {
  it('is exported', () => {
    expect(errorsReducer).to.exist;
  });
  it('is a function', () => {
    expect(errorsReducer).to.be.a('function');
  });
  it('returns state for undefined actionType', () => {
    expect(errorsReducer({}, {})).to.exist;
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
          expect(errorsReducer(state, action).allIds).to.have.length(1);
        });

        it('has id if error is passed in payload', () => {
          action = {
            meta: { collection: 'test' },
            type: actionTypes.LISTENER_ERROR,
            payload: { error: 'message' },
          };
          state = { allIds: [], byId: {} };
          expect(errorsReducer(state, action).allIds).to.have.property(
            0,
            'test',
          );
        });
      });
    });
  });

  describe('byId sub-reducer', () => {
    describe('actionTypes', () => {
      describe('LISTENER_ERROR', () => {
        it('sets state', () => {
          action = {
            meta: { collection: 'test' },
            type: actionTypes.LISTENER_ERROR,
          };
          state = { allIds: [], byQuery: {} };
          expect(errorsReducer(state, action).byQuery).to.have.property(
            'test',
            undefined,
          );
        });

        it('has id if error is passed in payload', () => {
          const payload = { error: 'message' };
          action = {
            meta: { collection: 'test' },
            type: actionTypes.LISTENER_ERROR,
            payload,
          };
          state = { allIds: [], byQuery: {} };
          expect(errorsReducer(state, action).byQuery).to.have.property(
            'test',
            payload,
          );
        });

        describe('CLEAR_ERROR', () => {
          it('removes error from state', () => {
            action = {
              meta: { collection: 'test' },
              type: actionTypes.CLEAR_ERROR,
            };
            state = { allIds: ['test'] };
            expect(errorsReducer(state, action).allIds).to.have.length(0);
          });

          it('does not remove other errors from state', () => {
            const collection = 'test';
            action = {
              meta: { collection },
              type: actionTypes.CLEAR_ERROR,
            };
            state = { allIds: [collection, 'other'] };
            expect(errorsReducer(state, action).allIds).to.have.length(1);
          });
        });

        describe('CLEAR_ERRORS', () => {
          it('removes error from state', () => {
            action = {
              type: actionTypes.CLEAR_ERRORS,
            };
            state = { allIds: ['test'] };
            expect(errorsReducer(state, action).allIds).to.have.length(0);
          });

          it('remove multiple errors from state', () => {
            action = {
              type: actionTypes.CLEAR_ERRORS,
            };
            state = { allIds: ['test', 'other'] };
            expect(errorsReducer(state, action).allIds).to.have.length(0);
          });
        });
      });

      describe('ERROR', () => {
        it('sets state', () => {
          action = {
            meta: { collection: 'test' },
            type: actionTypes.ERROR,
          };
          state = { allIds: [], byQuery: {} };
          expect(errorsReducer(state, action).byQuery).to.have.property(
            'test',
            undefined,
          );
        });

        it('has id if error is passed in payload', () => {
          const payload = { error: 'message' };
          action = {
            meta: { collection: 'test' },
            type: actionTypes.ERROR,
            payload,
          };
          state = { allIds: [], byQuery: {} };
          expect(errorsReducer(state, action).byQuery).to.have.property(
            'test',
            payload,
          );
        });

        it('has id if error is passed in payload', () => {
          const payload = { error: 'message' };
          action = {
            meta: { collection: 'test' },
            type: actionTypes.ERROR,
            payload,
          };
          state = { allIds: [], byQuery: {} };
          expect(errorsReducer(state, action).byQuery).to.have.property(
            'test',
            payload,
          );
        });

        it('does not add the listener path if it already exists in state', () => {
          const payload = { error: 'message' };
          action = {
            meta: { collection: 'test' },
            type: actionTypes.ERROR,
            payload,
          };
          state = { allIds: ['test'], byQuery: {} };
          expect(errorsReducer(state, action).byQuery).to.have.property(
            'test',
            payload,
          );
        });
      });

      describe('CLEAR_ERROR', () => {
        it('clears error by setting it to null', () => {
          action = {
            meta: { collection: 'test' },
            type: actionTypes.CLEAR_ERROR,
          };
          state = { allIds: ['test'], byQuery: {} };
          expect(errorsReducer(state, action).byQuery).to.have.property(
            'test',
            null,
          );
        });
      });
    });
  });
});
