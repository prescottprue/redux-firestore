import createFirestoreInstance from '../../../src/createFirestoreInstance';
import { firestoreActions } from '../../../src/actions';

describe('firestoreActions', () => {
  describe('exports', () => {
    it('add', () => {
      expect(firestoreActions).to.be.respondTo('add');
    });
  });

  describe('actions', () => {
    it('add', () => {
      const instance = createFirestoreInstance({}, { helpersNamespace: 'test' });
      try {
        instance.test.add({ collection: 'test' });
      } catch (err) {
        expect(err.message).to.equal('Firestore must be required and initalized.');
      }
    });
  });
});
