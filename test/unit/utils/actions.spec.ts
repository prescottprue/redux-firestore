import { expect } from 'chai';
import sinon from 'sinon';
import { wrapInDispatch } from '../../../src/utils/actions';

let dispatchSpy;
describe('actions utils', () => {
  beforeEach(() => {
    dispatchSpy = sinon.spy();
  });

  describe('wrapInDispatch', () => {
    it('is exported', () => {
      expect(wrapInDispatch).to.be.a('function');
    });

    it('calls dispatch', () => {
      wrapInDispatch(dispatchSpy, {
        ref: { test: () => Promise.resolve() },
        types: ['test', 'test'],
        method: 'test',
      });
      expect(dispatchSpy).to.have.been.calledOnce;
    });

    it('handles Object action types', () => {
      wrapInDispatch(dispatchSpy, {
        ref: { test: () => Promise.resolve() },
        types: [{ type: 'test' }, { type: 'test' }],
        method: 'test',
      });
      expect(dispatchSpy).to.have.been.calledOnce;
    });

    it('handles function payload types', () => {
      const opts = {
        ref: { test: () => Promise.resolve() },
        types: [{ type: 'test' }, { type: 'test', payload: () => ({}) }],
        method: 'test',
      };
      wrapInDispatch(dispatchSpy, opts);
      expect(dispatchSpy).to.have.been.calledOnce;
    });

    it('dispatches success with preserve parameter', async () => {
      const preserve = { some: 'thing' };
      const opts = {
        ref: { test: () => Promise.resolve() },
        meta: 'meta',
        types: [
          { type: 'test' },
          { type: 'test2', preserve, payload: () => 'some' },
        ],
        method: 'test',
      };
      await wrapInDispatch(dispatchSpy, opts);
      expect(dispatchSpy).to.have.nested.property(
        'firstCall.args.0.type',
        'test',
      );
      expect(dispatchSpy).to.have.nested.property(
        'secondCall.args.0.preserve.some',
        preserve.some,
      );
    });

    it('handles rejection', () => {
      const opts = {
        ref: { test: () => Promise.reject(new Error('test')) },
        types: [{ type: 'test' }, { type: 'test', payload: () => ({}) }],
        method: 'test',
      };
      wrapInDispatch(dispatchSpy, opts);
      expect(dispatchSpy).to.have.been.calledOnce;
    });
  });
});
