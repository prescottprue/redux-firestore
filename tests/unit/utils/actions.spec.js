import { wrapInDispatch } from '../../../src/utils/actions';


describe('actions utils', () => {
  describe('wrapInDispatch', () => {
    it('is exported', () => {
      expect(wrapInDispatch).to.be.a('function');
    });
  });
});
