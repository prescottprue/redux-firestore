import statusReducer from '../../../src/reducers/statusReducer';
import { actionTypes } from '../../../src/constants';

const state = {};
let collection = 'test'; // eslint-disable-line prefer-const
let action = {};
let payload = {};
let meta = {};
let result = {};

describe('statusReducer', () => {
  beforeEach(() => {
    result = {};
    meta = {};
    action = {};
  });

  it('is exported', () => {
    expect(statusReducer).to.exist;
  });

  it('is a function', () => {
    expect(statusReducer).to.be.a('function');
  });

  it('returns state for undefined actionType', () => {
    expect(statusReducer({}, {})).to.have.keys([
      'requesting',
      'requested',
      'timestamps',
    ]);
  });

  it('returns state slices (requesting, requested, timestampes)', () => {
    expect(statusReducer({}, {})).to.have.keys([
      'requesting',
      'requested',
      'timestamps',
    ]);
  });

  describe('actionTypes', () => {
    describe('LISTENER_RESPONSE', () => {
      it('returns state if payload is not defined', () => {
        action = { meta: { collection }, type: actionTypes.LISTENER_RESPONSE };
        result = statusReducer(state, action);
        expect(result.requesting).to.have.property(collection, false);
      });

      it('returns state if payload does not contain data', () => {
        action = {
          meta: { collection },
          payload: {},
          type: actionTypes.LISTENER_RESPONSE,
        };
        result = statusReducer(state, action);
        expect(result.requesting).to.have.property(collection, false);
      });
    });

    describe('SET_LISTENER', () => {
      it('returns state if payload does not contain data', () => {
        meta = { collection };
        payload = {};
        action = { meta, payload, type: actionTypes.SET_LISTENER };
        expect(statusReducer(state, action).requesting).to.have.property(
          collection,
          true,
        );
        expect(statusReducer(state, action).requested).to.have.property(
          collection,
          false,
        );
        expect(statusReducer(state, action).timestamps).to.have.property(
          collection,
        );
      });
    });

    describe('LISTENER_ERROR', () => {
      it('returns state if payload is not defined', () => {
        meta = { collection };
        action = { meta, type: actionTypes.LISTENER_ERROR };
        result = statusReducer(state, action);
        expect(result.requesting).to.have.property(collection, false);
      });
    });

    describe('UNSET_LISTENER', () => {
      it('sets requesting status to false when unsetting listener', () => {
        action = { meta: 'test', type: actionTypes.UNSET_LISTENER };
        expect(statusReducer(state, action).requesting).to.deep.equal({
          test: false,
        });
      });
    });
  });
});
