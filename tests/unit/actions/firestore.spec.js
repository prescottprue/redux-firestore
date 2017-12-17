import createFirestoreInstance from '../../../src/createFirestoreInstance';
import { firestoreActions } from '../../../src/actions';

describe('firestoreActions', () => {
  describe('exports', () => {
    it('add', () => {
      expect(firestoreActions).to.be.respondTo('add');
    });
  });

  describe('actions', () => {
    describe('add', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance({}, { helpersNamespace: 'test' });
        try {
          instance.test.add({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal('Firestore must be required and initalized.');
        }
      });
    });

    describe('set', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance({}, { helpersNamespace: 'test' });
        try {
          instance.test.set({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal('Firestore must be required and initalized.');
        }
      });
    });

    describe('update', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance({}, { helpersNamespace: 'test' });
        try {
          instance.test.update({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal('Firestore must be required and initalized.');
        }
      });
    });

    describe('deleteRef', () => {
      it('throws if attempting to delete a collection', () => {
        const instance = createFirestoreInstance({}, { helpersNamespace: 'test' });
        try {
          instance.test.deleteRef({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal('Only docs can be deleted');
        }
      });
    });

    describe('setListener', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance({}, { helpersNamespace: 'test' });
        try {
          instance.test.setListener({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal('Firestore must be required and initalized.');
        }
      });
    });

    describe('setListeners', () => {
      it('throws if listeners config is not an array', () => {
        const instance = createFirestoreInstance({}, { helpersNamespace: 'test' });
        try {
          instance.test.setListeners({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal('Listeners must be an Array of listener configs (Strings/Objects)');
        }
      });
    });

    describe('unsetListener', () => {
      it('throws if invalid path config is provided', () => {
        const instance = createFirestoreInstance({}, { helpersNamespace: 'test' });
        try {
          instance.test.unsetListener();
        } catch (err) {
          expect(err.message).to.equal('Invalid Path Definition: Only Strings and Objects are accepted.');
        }
      });
      it('throws if dispatch is not a function', () => {
        const instance = createFirestoreInstance({}, { helpersNamespace: 'test' });
        try {
          instance.test.unsetListener({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal('dispatch is not a function');
        }
      });
    });

    describe('unsetListeners', () => {
      it('throws if listeners config is not an array', () => {
        const instance = createFirestoreInstance({}, { helpersNamespace: 'test' });
        try {
          instance.test.unsetListeners({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal('Listeners must be an Array of listener configs (Strings/Objects)');
        }
      });
    });
  });
});
