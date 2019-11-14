import sinon from 'sinon';
import { expect } from 'chai';
import {
  getDotStrPath,
  getSlashStrPath,
  preserveValuesFromState,
  createReducer,
} from '../../../src/utils/reducers';

describe('reducer utils', () => {
  describe('getSlashStrPath', () => {
    it('is exported', () => {
      expect(getSlashStrPath).to.be.a('function');
    });
    it('converts dot path to slash path', () => {
      expect(getSlashStrPath('some.other.thing')).to.equal('some/other/thing');
    });
    it('removes leading .', () => {
      expect(getSlashStrPath('.some.other.thing')).to.equal('some/other/thing');
    });
    it('returns empty string for undefined input', () => {
      expect(getSlashStrPath('')).to.equal('');
    });
  });

  describe('getDotStrPath', () => {
    it('is exported', () => {
      expect(getDotStrPath).to.be.a('function');
    });
    it('converts slash path to dot path', () => {
      expect(getDotStrPath('some/other/thing')).to.equal('some.other.thing');
    });
    it('removes leading /', () => {
      expect(getDotStrPath('/some/other/thing')).to.equal('some.other.thing');
    });
    it('returns empty string for undefined input', () => {
      expect(getDotStrPath('')).to.equal('');
    });
  });

  describe('createReducer', () => {
    it('calls handler mapped to action type', () => {
      const actionHandler = sinon.spy();
      const newReducer = createReducer({}, { test: actionHandler });
      newReducer({}, { type: 'test' });
      expect(actionHandler).to.have.been.calledOnce;
    });

    it('returns state for action types not within handlers', () => {
      const newReducer = createReducer({}, {});
      const state = {};
      expect(newReducer(state, { type: 'testing' })).to.equal(state);
    });
  });

  describe('preserveValuesFromState', () => {
    it('is exported', () => {
      expect(preserveValuesFromState).to.be.a('function');
    });

    describe('passing boolean', () => {
      it('returns original state for true', () => {
        const result = preserveValuesFromState({}, true);
        expect(result).to.be.an('object');
        expect(result).to.be.empty;
      });

      it('extends state with next state if provided', () => {
        const testVal = 'val';
        const result = preserveValuesFromState({}, true, { testVal });
        expect(result).to.have.property('testVal', testVal);
      });
    });

    describe('passing function', () => {
      it('returns original state for true', () => {
        const result = preserveValuesFromState({}, () => ({}));
        expect(result).to.be.an('object');
        expect(result).to.be.empty;
      });
    });

    describe('passing an array of keys', () => {
      it('returns original state for true', () => {
        const result = preserveValuesFromState({ some: 'val' }, ['some']);
        expect(result).to.have.property('some', 'val');
      });
    });

    describe('passing invalid preserve option', () => {
      it('throws', () => {
        expect(() => preserveValuesFromState({ some: 'val' }, 'some')).to.throw(
          'Invalid preserve parameter. It must be a Boolean, an Object or an Array.',
        );
      });
    });
  });
});
