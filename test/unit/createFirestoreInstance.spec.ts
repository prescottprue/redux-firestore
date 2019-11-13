import createFirestoreInstance from 'createFirestoreInstance';

describe('createFirestoreInstance', () => {
  describe('exports', () => {
    it('a functions', () => {
      expect(createFirestoreInstance).to.be.a('function');
    });
  });

  describe('firestoreInstance', () => {
    it('sets internal parameter _', () => {
      const instance = createFirestoreInstance({}, {});
      expect(instance).to.have.property('_');
    });

    it('attaches provided config to internal _.config object', () => {
      const testVal = 'test';
      const instance = createFirestoreInstance({}, { testVal });
      expect(instance).to.have.nested.property('_.config.testVal', testVal);
    });

    describe('options - ', () => {
      describe('helpersNamespace -', () => {
        it('places helpers on namespace if passed', () => {
          const instance = createFirestoreInstance(
            {},
            { helpersNamespace: 'test' },
          );
          expect(instance).to.have.property('test');
        });
      });
    });
  });
});
