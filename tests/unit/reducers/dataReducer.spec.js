import dataReducer from '../../../src/reducers/dataReducer';
import { actionTypes } from '../../../src/constants';

const state = {};
const collection = 'test';

let action = {};
let payload = {};
let meta = {};

describe('dataReducer', () => {
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
        expect(() => dataReducer(state, action))
          .to.throw('Collection is required to construct reducer path.');
      });

      describe('with subcollections parameter', () => {
        it('updates empty state', () => {
          const data = { abc: { field: 'test' } };
          payload = { data };
          meta = { collection, doc: 'someDoc', subcollections: [{ collection: 'another' }] };
          action = { meta, payload, type: actionTypes.LISTENER_RESPONSE };
          expect(dataReducer(state, action))
            .to.have.nested.property('test.someDoc.another', data);
        });

        it('updates state when data already exists', () => {
          const data = { testing: { field: 'test' } };
          payload = { data };
          meta = { collection, doc: 'someDoc', subcollections: [{ collection: 'another', doc: 'testing' }] };
          const existingState = { test: { someDoc: { another: { testing: {} } } } };
          action = { meta, payload, type: actionTypes.LISTENER_RESPONSE };
          expect(dataReducer(existingState, action))
            .to.have.nested.property('test.someDoc.another.testing.field', data.testing.field);
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
        expect(() => dataReducer(state, action))
          .to.throw('Collection is required to construct reducer path.');
      });

      // TODO: Make this test complete
      it.skip('merges with existing data', () => {
        const data = { test: { field: 'test', another: 'test' } };
        payload = { data };
        meta = { collection, doc: 'someDoc' };
        const existingState = { test: { someDoc: { another: 'test' } } };
        action = { meta, payload, type: actionTypes.GET_SUCCESS };
        expect(dataReducer(existingState, action))
          .to.have.nested.property('test', {});
      });

      describe('with subcollections parameter', () => {
        it('updates empty state', () => {
          const data = { abc: { field: 'test' } };
          payload = { data };
          meta = { collection, doc: 'someDoc', subcollections: [{ collection: 'another' }] };
          action = { meta, payload, type: actionTypes.GET_SUCCESS };
          expect(dataReducer(state, action))
            .to.have.nested.property('test.someDoc.another', data);
        });

        it('updates state when data already exists', () => {
          const data = { testing: { field: 'test' } };
          payload = { data };
          meta = { collection, doc: 'someDoc', subcollections: [{ collection: 'another', doc: 'testing' }] };
          const existingState = { test: { someDoc: { another: { testing: {} } } } };
          action = { meta, payload, type: actionTypes.GET_SUCCESS };
          expect(dataReducer(existingState, action))
            .to.have.nested.property('test.someDoc.another.testing.field', data.testing.field);
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
        action = { meta, type: actionTypes.CLEAR_DATA, preserve: ['some'] };
        expect(dataReducer(data, action)).to.have.property('some', data.some);
      });
    });
  });
});
