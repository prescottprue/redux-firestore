import sinon from 'sinon'
import { expect } from 'chai';
import createFirestoreInstance from '../../src/createFirestoreInstance';

describe('createFirestoreInstance', () => {
  describe('exports', () => {
    it('a functions', () => {
      expect(createFirestoreInstance).to.be.a('function');
    });
  });

  describe('firestoreInstance', () => {
    it('sets internal parameter _', () => {
      const dispatchSpy = sinon.spy()
      const instance = createFirestoreInstance({}, {}, dispatchSpy);
      expect(instance).to.have.property('_');
    });

    it('attaches provided config to internal _.config object', () => {
      const testVal = 'test';
      const dispatchSpy = sinon.spy()
      const instance = createFirestoreInstance({}, {}, dispatchSpy);
      expect(instance).to.have.nested.property('_.config.testVal', testVal);
    });

    describe('options - ', () => {
      describe('helpersNamespace -', () => {
        it('places helpers on namespace if passed', () => {
          const dispatchSpy = sinon.spy()
          const instance = createFirestoreInstance({}, {}, dispatchSpy);
          expect(instance).to.have.property('test');
        });
      });
    });
  });
});
