import { attachListener } from '../../../src/utils/query';

let dispatch;

describe('query utils', () => {
  describe('attachListener', () => {
    beforeEach(() => {
      dispatch = sinon.spy();
    });
    it('is exported', () => {
      expect(attachListener).to.be.a('function');
    });
    it('converts slash path to dot path', () => {
      attachListener({ _: { listeners: {} } }, dispatch, { collection: 'test' });
      expect(dispatch).to.be.calledOnce;
    });

    it('throws if meta is not included', () => {
      expect(() => attachListener({}, dispatch))
        .to.Throw('Meta data is required to attach listener.');
    });

    it('throws if _ variable is not defined on Firebase', () => {
      expect(() => attachListener({}, dispatch, { collection: 'test' }))
        .to.Throw('Internal Firebase object required to attach listener. Confirm that reduxFirestore enhancer was added when you were creating your store');
    });
  });
});
