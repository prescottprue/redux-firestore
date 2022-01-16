import { expect } from 'chai';
import { wrapInDispatch } from 'utils/actions';

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
      const testError = new Error('test');
      const opts = {
        ref: { test: () => Promise.reject(testError) },
        types: [{ type: 'test' }, { type: 'test', payload: () => ({}) }],
        method: 'test',
      };
      wrapInDispatch(dispatchSpy, opts).catch(err => {
        expect(err).to.equal(testError);
      });
      expect(dispatchSpy).to.have.been.calledOnce;
    });

    it('handles mutate action types', () => {
      const set = sinon.spy(() => Promise.resolve());
      const doc = sinon.spy(() => ({
        set,
        id: 'id',
        parent: { path: 'path' },
      }));
      const collection = sinon.spy(() => ({ doc }));
      const firestore = sinon.spy(() => ({ collection, doc }));
      wrapInDispatch(dispatchSpy, {
        ref: { firestore },
        types: ['mutate', 'mutate', 'mutate'],
        args: [{ collection: '/collection/path', doc: 'doc', data: { a: 1 } }],
        method: 'mutate',
      });
      expect(doc).to.have.been.calledOnceWith('/collection/path/doc');
      expect(set).to.have.been.calledOnceWith({ a: 1 });
    });
  });
});
