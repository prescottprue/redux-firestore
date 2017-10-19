import src from '../../src';

describe('module', () => {
  describe('exports', () => {
    describe('enhancer', () => {
      it('reduxFirestore', () => {
        expect(src).to.respondTo('reduxFirestore');
      });
    });

    describe('reducer', () => {
      it('as firestoreReducer', () => {
        expect(src).to.respondTo('firestoreReducer');
      });
    });
  });
});
