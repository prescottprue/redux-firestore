import createFirestoreInstance from '../../../src/createFirestoreInstance';
import { firestoreActions } from '../../../src/actions';
import { setListeners } from '../../../src/actions/firestore';
import { actionTypes } from '../../../src/constants';

let dispatchSpy;
let fakeFirebase;
let listenerConfig;
let collectionClass;
let onSnapshotSpy;

const fakeConfig = {
  helpersNamespace: 'test',
};

describe('firestoreActions', () => {
  beforeEach(() => {
    dispatchSpy = sinon.spy();
    onSnapshotSpy = sinon.spy();
    listenerConfig = {};
    collectionClass = () => ({
      doc: () => ({ collection: collectionClass, onSnapshot: onSnapshotSpy }),
      onSnapshot: onSnapshotSpy,
    });
    fakeFirebase = {
      _: { listeners: {} },
      firestore: () => ({
        collection: collectionClass,
      }),
    };
  });

  describe('exports', () => {
    it('add', () => {
      expect(firestoreActions).to.be.respondTo('add');
    });
  });

  describe('actions', () => {
    describe('add', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        try {
          instance.test.add({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal(
            'Firestore must be required and initalized.',
          );
        }
      });
    });

    describe('set', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        try {
          instance.test.set({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal(
            'Firestore must be required and initalized.',
          );
        }
      });
    });

    describe('update', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        try {
          instance.test.update({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal(
            'Firestore must be required and initalized.',
          );
        }
      });
    });

    describe('deleteRef', () => {
      it('throws if attempting to delete a collection', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        try {
          instance.test.deleteRef({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal('Only docs can be deleted');
        }
      });
    });

    describe('setListener', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        try {
          instance.test.setListener({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal(
            'Firestore must be required and initalized.',
          );
        }
      });

      it('throws if Collection and/or doc are not provided', async () => {
        const instance = createFirestoreInstance(
          fakeFirebase,
          fakeConfig,
          dispatchSpy,
        );
        try {
          await instance.test.setListener({});
        } catch (err) {
          expect(err.message).to.equal(
            'Collection and/or Doc are required parameters within query definition object',
          );
        }
      });

      it('supports subcollections', async () => {
        listenerConfig = {
          collection: 'test',
          doc: '1',
          subcollections: [{ collection: 'test2', doc: 'test3' }],
        };
        const instance = createFirestoreInstance(
          fakeFirebase,
          fakeConfig,
          dispatchSpy,
        );
        const expectedAction = {
          meta: { ...listenerConfig },
          payload: { name: 'test/1/test2/test3' },
          type: '@@reduxFirestore/SET_LISTENER',
        };
        await instance.test.setListener(listenerConfig);
        expect(onSnapshotSpy).to.be.calledOnce;
        expect(dispatchSpy).to.be.calledWith(expectedAction);
      });

      it('supports subcollections of subcollections', async () => {
        listenerConfig = {
          collection: 'test',
          doc: '1',
          subcollections: [
            { collection: 'test2', doc: 'test3' },
            { collection: 'test4' },
          ],
        };
        const instance = createFirestoreInstance(
          fakeFirebase,
          fakeConfig,
          dispatchSpy,
        );
        const expectedAction = {
          meta: { ...listenerConfig },
          payload: { name: 'test/1/test2/test3/test4' },
          type: '@@reduxFirestore/SET_LISTENER',
        };
        await instance.test.setListener(listenerConfig);
        expect(onSnapshotSpy).to.be.calledOnce;
        expect(dispatchSpy).to.be.calledWith(expectedAction);
      });
    });

    describe('setListeners', () => {
      it('throws if listeners config is not an array', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        try {
          instance.test.setListeners({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal(
            'Listeners must be an Array of listener configs (Strings/Objects)',
          );
        }
      });

      it('calls dispatch if listeners provided', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        try {
          instance.test.setListeners({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal(
            'Listeners must be an Array of listener configs (Strings/Objects)',
          );
        }
      });

      it('maps listeners array', () => {
        setListeners(fakeFirebase, dispatchSpy, [
          { collection: 'test' },
          { collection: 'test2' },
        ]);
        expect(onSnapshotSpy).to.be.calledTwice;
      });

      it('supports subcollections', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        try {
          instance.test.setListeners({
            collection: 'test',
            doc: '1',
            subcollections: [{ collection: 'test2' }],
          });
        } catch (err) {
          expect(err.message).to.equal(
            'Listeners must be an Array of listener configs (Strings/Objects)',
          );
        }
      });
    });

    describe('unsetListener', () => {
      it('throws if invalid path config is provided', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        try {
          instance.test.unsetListener();
        } catch (err) {
          expect(err.message).to.equal(
            'Invalid Path Definition: Only Strings and Objects are accepted.',
          );
        }
      });
      it('throws if dispatch is not a function', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        try {
          instance.test.unsetListener({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal('dispatch is not a function');
        }
      });
    });

    describe('unsetListeners', () => {
      it('throws if listeners config is not an array', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        try {
          instance.test.unsetListeners({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal(
            'Listeners must be an Array of listener configs (Strings/Objects)',
          );
        }
      });

      it('dispatches UNSET_LISTENER action', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        instance.test.unsetListeners([{ collection: 'test' }]);
        expect(dispatchSpy).to.have.been.calledWith({
          meta: { collection: 'test' },
          payload: { name: 'test' },
          type: actionTypes.UNSET_LISTENER,
        });
      });
    });
  });
});
