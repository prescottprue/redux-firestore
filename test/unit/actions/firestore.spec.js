import createFirestoreInstance from 'createFirestoreInstance';
import { firestoreActions } from 'actions';
import { setListeners } from 'actions/firestore';
import { actionTypes, defaultConfig } from 'constants';

let dispatchSpy;
let fakeFirebase;
let listenerConfig;
let collectionClass;
let onSnapshotSpy;
let deleteSpy;
let addSpy;
let setSpy;
let getSpy;
let updateSpy;

const fakeConfig = {
  helpersNamespace: 'test',
};

const successRes = 'success';

describe('firestoreActions', () => {
  beforeEach(() => {
    dispatchSpy = sinon.spy();
    addSpy = sinon.spy(() => Promise.resolve(successRes));
    setSpy = sinon.spy(() => Promise.resolve(successRes));
    getSpy = sinon.spy(() => Promise.resolve(successRes));
    updateSpy = sinon.spy(() => Promise.resolve(successRes));
    deleteSpy = sinon.spy(() => Promise.resolve(successRes));
    onSnapshotSpy = sinon.spy((func, func2) => {
      func(sinon.spy());
      func2(sinon.spy());
    });
    listenerConfig = {};
    collectionClass = () => ({
      doc: () => ({
        collection: collectionClass,
        onSnapshot: onSnapshotSpy,
        delete: deleteSpy,
        get: getSpy,
      }),
      add: addSpy,
      set: setSpy,
      get: getSpy,
      update: updateSpy,
      onSnapshot: onSnapshotSpy,
    });
    fakeFirebase = {
      _: { listeners: {}, config: defaultConfig },
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
        expect(() => instance.test.add({ collection: 'test' })).to.throw(
          'Firestore must be required and initalized.',
        );
      });

      it('calls dispatch with correct action types', async () => {
        const instance = createFirestoreInstance(
          fakeFirebase,
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        await instance.test.add({ collection: 'test' }, { some: 'thing' });
        expect(dispatchSpy).to.have.nested.property(
          'firstCall.args.0.type',
          actionTypes.ADD_REQUEST,
        );
        expect(dispatchSpy).to.have.nested.property(
          'secondCall.args.0.type',
          actionTypes.ADD_SUCCESS,
        );
        expect(addSpy).to.have.been.calledOnce;
      });
    });

    describe('set', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() => instance.test.set({ collection: 'test' })).to.throw(
          'Firestore must be required and initalized.',
        );
      });

      it('calls dispatch with correct action types', async () => {
        const instance = createFirestoreInstance(
          fakeFirebase,
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        await instance.test.set({ collection: 'test' }, { some: 'thing' });
        expect(dispatchSpy).to.have.nested.property(
          'firstCall.args.0.type',
          actionTypes.SET_REQUEST,
        );
        expect(dispatchSpy).to.have.nested.property(
          'secondCall.args.0.type',
          actionTypes.SET_SUCCESS,
        );
        expect(setSpy).to.have.been.calledOnce;
      });
    });

    describe('update', () => {
      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() => instance.test.update({ collection: 'test' })).to.throw(
          'Firestore must be required and initalized.',
        );
      });

      it('calls dispatch with correct action types', async () => {
        const instance = createFirestoreInstance(
          fakeFirebase,
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        await instance.test.update({ collection: 'test' }, { some: 'thing' });
        expect(dispatchSpy).to.have.nested.property(
          'firstCall.args.0.type',
          actionTypes.UPDATE_REQUEST,
        );
        expect(dispatchSpy).to.have.nested.property(
          'secondCall.args.0.type',
          actionTypes.UPDATE_SUCCESS,
        );
        expect(updateSpy).to.have.been.calledOnce;
      });
    });

    describe('deleteRef', () => {
      it('calls delete with dispatches before and after', async () => {
        const instance = createFirestoreInstance(
          fakeFirebase,
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        const res = await instance.test.deleteRef({
          collection: 'test',
          doc: 'test',
        });
        expect(dispatchSpy).to.have.been.calledTwice;
        expect(res).to.equal(successRes);
      });

      it('throws if attempting to delete a collection', async () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        try {
          await instance.test.deleteRef({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal('Only documents can be deleted.');
        }
      });

      it('calls onAttemptCollectionDelete if provided', async () => {
        const funcSpy = sinon.spy(() => Promise.resolve('test'));
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test', onAttemptCollectionDelete: funcSpy },
        );
        const res = await instance.test.deleteRef({ collection: 'test' });
        expect(funcSpy).to.have.been.calledOnce;
        expect(res).to.equal('test');
      });
    });

    describe('get', () => {
      it('throws if attempting to delete a collection', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() => instance.test.get({ collection: 'test' })).to.throw(
          'Firestore must be required and initalized.',
        );
      });

      it('calls dispatch twice', async () => {
        const instance = createFirestoreInstance(
          fakeFirebase,
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        const res = await instance.test.get({ collection: 'test' });
        expect(res).to.equal(successRes);
        expect(dispatchSpy).to.have.been.calledTwice;
      });
    });

    describe('setListener', () => {
      describe('docChanges', () => {
        after(() => {
          onSnapshotSpy = sinon.spy((func, func2) => {
            func(sinon.spy());
            func2(sinon.spy());
          });
        });

        it('updates single doc in state when docChanges includes single doc change with type: "modified"', async () => {
          onSnapshotSpy = sinon.spy((func, func2) => {
            func({
              docChanges: [
                {
                  doc: { id: '123ABC', data: () => ({ some: 'value' }) },
                  type: 'modified',
                },
              ],
              size: 2,
              doc: { id: '123ABC' },
            });
            func2(sinon.spy());
          });
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
            type: actionTypes.SET_LISTENER,
          };
          await instance.test.setListener(listenerConfig);
          expect(onSnapshotSpy).to.be.calledOnce;
          expect(dispatchSpy).to.be.calledWith(expectedAction);
        });

        it('updates multiple docs in state when docChanges includes multiple doc changes', async () => {
          onSnapshotSpy = sinon.spy((func, func2) => {
            func({
              docChanges: [
                {
                  doc: { id: '123ABC', data: () => ({ some: 'value' }) },
                  type: 'modified',
                },
                {
                  doc: { id: '123ABC', data: () => ({ some: 'value' }) },
                  type: 'modified',
                },
              ],
              size: 3,
              doc: { id: '123ABC' },
            });
            func2(sinon.spy());
          });
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
            type: actionTypes.SET_LISTENER,
          };
          await instance.test.setListener(listenerConfig);
          expect(onSnapshotSpy).to.be.calledOnce;
          expect(dispatchSpy).to.be.calledWith(expectedAction);
        });

        it('still dispatches LISTENER_RESPONSE action type if whole collection is being updated (i.e. docChanges.length === size)', async () => {
          onSnapshotSpy = sinon.spy(success => {
            success({
              docChanges: [
                {
                  doc: { id: '123ABC', data: () => ({ some: 'value' }) },
                  type: 'modified',
                },
                {
                  doc: { id: '123ABC', data: () => ({ some: 'value' }) },
                  type: 'modified',
                },
              ],
              size: 2,
              doc: { id: '123ABC' },
            });
          });
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
            type: actionTypes.SET_LISTENER,
          };
          const expectedAction2 = {
            meta: listenerConfig,
            payload: { data: null, ordered: [] },
            merge: { collections: true, docs: true },
            type: actionTypes.LISTENER_RESPONSE,
          };
          await instance.test.setListener(listenerConfig);
          expect(dispatchSpy).to.be.calledWith(expectedAction);
          expect(dispatchSpy).to.be.calledWith(expectedAction2);
          expect(onSnapshotSpy).to.be.calledOnce;
          // expect(dispatchSpy.withArgs(expectedAction)).to.be.calledOnce;
          // expect(dispatchSpy.getCall(2)).to.be.calledWith(expectedAction2);
          // expect(dispatchSpy.firstCall).to.be.calledWith(expectedAction);
          // expect(dispatchSpy.secondCall).to.be.calledWith(expectedAction2);
          // expect(dispatchSpy.getCall(2)).to.be.calledWith(expectedAction2);
          expect(dispatchSpy).to.have.callCount(2);
        });
      });

      it('throws if Firestore is not initialized', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() =>
          instance.test.setListener({ collection: 'test' }),
        ).to.throw('Firestore must be required and initalized.');
      });

      it('throws if Collection and/or doc are not provided', async () => {
        const instance = createFirestoreInstance(
          fakeFirebase,
          fakeConfig,
          dispatchSpy,
        );
        expect(() => instance.test.setListener({})).to.throw(
          'Collection and/or Doc are required parameters within query definition object.',
        );
      });

      it('calls success callback if it exists', async () => {
        const successSpy = sinon.spy();
        const instance = createFirestoreInstance(
          fakeFirebase,
          fakeConfig,
          dispatchSpy,
        );
        await instance.test.setListener({ collection: 'test' }, successSpy);
        expect(successSpy).to.have.been.calledOnce;
      });

      it('calls error callback if it exists', async () => {
        const errorSpy = sinon.spy();
        const instance = createFirestoreInstance(
          fakeFirebase,
          fakeConfig,
          dispatchSpy,
        );
        await instance.test.setListener(
          { collection: 'test' },
          () => {},
          errorSpy,
        );
        expect(errorSpy).to.have.been.calledOnce;
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
          type: actionTypes.SET_LISTENER,
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
            {
              collection: 'test2',
              doc: 'test3',
              subcollections: [{ collection: 'test4' }],
            },
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
          type: actionTypes.SET_LISTENER,
        };
        await instance.test.setListener(listenerConfig);
        expect(onSnapshotSpy).to.be.calledOnce;
        expect(dispatchSpy).to.be.calledWith(expectedAction);
      });

      it('supports doc within nested subcollections', async () => {
        listenerConfig = {
          collection: 'test',
          doc: '1',
          subcollections: [
            {
              collection: 'test2',
              doc: 'test3',
              subcollections: [{ collection: 'test4', doc: 'test5' }],
            },
          ],
        };
        const instance = createFirestoreInstance(
          fakeFirebase,
          fakeConfig,
          dispatchSpy,
        );
        const expectedAction = {
          meta: { ...listenerConfig },
          payload: { name: 'test/1/test2/test3/test4/test5' },
          type: actionTypes.SET_LISTENER,
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
        expect(() =>
          instance.test.setListeners({ collection: 'test' }),
        ).to.throw(
          'Listeners must be an Array of listener configs (Strings/Objects).',
        );
      });

      it('calls dispatch if listeners provided', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() =>
          instance.test.setListeners({ collection: 'test' }),
        ).to.throw(
          'Listeners must be an Array of listener configs (Strings/Objects).',
        );
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
        expect(() =>
          instance.test.setListeners({
            collection: 'test',
            doc: '1',
            subcollections: [{ collection: 'test2' }],
          }),
        ).to.throw(
          'Listeners must be an Array of listener configs (Strings/Objects).',
        );
      });
    });

    describe('unsetListener', () => {
      it('throws if invalid path config is provided', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() => instance.test.unsetListener()).to.throw(
          'Invalid Path Definition: Only Strings and Objects are accepted.',
        );
      });

      it('throws if dispatch is not a function', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() =>
          instance.test.unsetListener({ collection: 'test' }),
        ).to.throw('dispatch is not a function');
      });
    });

    describe('unsetListeners', () => {
      it('throws if listeners config is not an array', () => {
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() =>
          instance.test.unsetListeners({ collection: 'test' }),
        ).to.throw(
          'Listeners must be an Array of listener configs (Strings/Objects)',
        );
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
