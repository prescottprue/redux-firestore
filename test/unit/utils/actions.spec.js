import { wrapInDispatch } from '../../../src/utils/actions';

describe('actions utils', () => {
  describe('wrapInDispatch', () => {
    it('is exported', () => {
      expect(wrapInDispatch).to.be.a('function');
    });

    it('calls dispatch', () => {
      const dispatch = sinon.spy();
      wrapInDispatch(dispatch, {
        ref: { test: () => Promise.resolve() },
        types: ['test', 'test'],
        method: 'test',
      });
      expect(dispatch).to.have.been.calledOnce;
    });

    it('handles Object action types', () => {
      const dispatch = sinon.spy();
      wrapInDispatch(dispatch, {
        ref: { test: () => Promise.resolve() },
        types: [{ type: 'test' }, { type: 'test' }],
        method: 'test',
      });
      expect(dispatch).to.have.been.calledOnce;
    });

    it('handles function payload types', () => {
      const dispatch = sinon.spy();
      const opts = {
        ref: { test: () => Promise.resolve() },
        types: [{ type: 'test' }, { type: 'test', payload: () => ({}) }],
        method: 'test',
      };
      wrapInDispatch(dispatch, opts);
      expect(dispatch).to.have.been.calledOnce;
    });

    it('handles rejection', () => {
      const dispatch = sinon.spy();
      const opts = {
        ref: { test: () => Promise.reject() },
        types: [{ type: 'test' }, { type: 'test', payload: () => ({}) }],
        method: 'test',
      };
      wrapInDispatch(dispatch, opts);
      expect(dispatch).to.have.been.calledOnce;
    });
  });
});
