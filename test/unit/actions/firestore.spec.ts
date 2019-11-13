import sinon from 'sinon'
import { expect } from 'chai';
import createFirestoreInstance from '../../../src/createFirestoreInstance';
import { firestoreActions } from '../../../src/actions';
import { setListeners } from '../../../src/actions/firestore';
import { actionTypes, defaultConfig } from '../../../src/constants';

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
let callErrorCallback = false;

describe('firestoreActions', () => {
  beforeEach(() => {
    dispatchSpy = sinon.spy();
    addSpy = sinon.spy(() => Promise.resolve(successRes));
    setSpy = sinon.spy(() => Promise.resolve(successRes));
    getSpy = sinon.spy(() => Promise.resolve(successRes));
    updateSpy = sinon.spy(() => Promise.resolve(successRes));
    deleteSpy = sinon.spy(() => Promise.resolve(successRes));
    onSnapshotSpy = sinon.spy((func, func2) => {
      if (!callErrorCallback) {
        func(sinon.spy());
      } else {
        func2(sinon.spy());
      }
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

  afterEach(() => {
    callErrorCallback = false;
  });

  describe('exports', () => {
    it('add', () => {
      expect(firestoreActions).to.be.respondTo('add');
    });
  });

  describe('actions', () => {
    describe('add', () => {
      it('throws if Firestore is not initialized', () => {
        const dispatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy
        );
        expect(() => instance.add({ collection: 'test' }, {})).to.throw(
          'Firestore must be required and initalized.',
        );
      });

      it('calls dispatch with correct action types', async () => {
        const instance = createFirestoreInstance(
          fakeFirebase,
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        await instance.add({ collection: 'test' }, { some: 'thing' });
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
        const dispatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy
        );
        expect(() => instance.set({ collection: 'test' }, {})).to.throw(
          'Firestore must be required and initalized.',
        );
      });

      it('calls dispatch with correct action types', async () => {
        const dispatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          fakeFirebase,
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        await instance.set({ collection: 'test' }, { some: 'thing' });
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
        const dispatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        expect(() => instance.update({ collection: 'test' }, {})).to.throw(
          'Firestore must be required and initalized.',
        );
      });

      it('calls dispatch with correct action types', async () => {
        const dispatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          fakeFirebase,
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        await instance.update({ collection: 'test' }, { some: 'thing' });
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
        const dispatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          fakeFirebase,
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        const res = await instance.deleteRef({
          collection: 'test',
          doc: 'test',
        });
        expect(dispatchSpy).to.have.been.calledTwice;
        expect(res).to.equal(successRes);
      });

      it('throws if attempting to delete a collection', async () => {
        const dispatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy
        );
        try {
          await instance.deleteRef({ collection: 'test' });
        } catch (err) {
          expect(err.message).to.equal('Only documents can be deleted.');
        }
      });

      it('calls onAttemptCollectionDelete if provided', async () => {
        const dispatchSpy = sinon.spy()
        const funcSpy = sinon.spy(() => Promise.resolve('test'));
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test', onAttemptCollectionDelete: funcSpy },
          dispatchSpy
        );
        const res = await instance.deleteRef({ collection: 'test' });
        expect(funcSpy).to.have.been.calledOnce;
        expect(res).to.equal('test');
      });
    });

    describe('get', () => {
      it('throws if attempting to delete a collection', () => {
        const dispatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy
        );
        expect(() => instance.get({ collection: 'test' }, {})).to.throw(
          'Firestore must be required and initalized.',
        );
      });

      it('throws if attempting to delete a sub-collection', () => {
        const dispatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy
        );
        expect(() =>
          instance.get({
            collection: 'test',
            doc: 'testing',
            subcollections: [{ collection: 'test' }],
          }),
        ).to.throw('Firestore must be required and initalized.');
      });

      it('throws if attempting to delete a nested sub-collection', () => {
        const dispatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy
        );
        expect(() =>
          instance.get({
            collection: 'test',
            doc: 'testing',
            subcollections: [
              { collection: 'test', doc: 'asdf' },
              { collection: 'test2' },
            ],
          }),
        ).to.throw('Firestore must be required and initalized.');
      });

      it('calls dispatch twice', async () => {
        const dispatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          fakeFirebase,
          { helpersNamespace: 'test' },
          dispatchSpy,
        );
        const res = await instance.get({ collection: 'test' });
        expect(res).to.equal(successRes);
        expect(dispatchSpy).to.have.been.calledTwice;
      });
    });

    describe('setListener', () => {
      describe('docChanges', () => {
        after(() => {
          onSnapshotSpy = sinon.spy((func, func2) => {
            if (!callErrorCallback) {
              func(sinon.spy());
            } else {
              func2(sinon.spy());
            }
          });
        });

        it('calls success callback if provided', () => {
          const dispatchSpy = sinon.spy()
          const listenerConfig = {
            collection: 'test',
            doc: '1',
            subcollections: [{ collection: 'test2', doc: 'test3' }],
          };
          const instance = createFirestoreInstance(
            fakeFirebase,
            fakeConfig,
            dispatchSpy,
          );
          const successSpy = sinon.spy();
          instance.setListener(listenerConfig, successSpy);
          expect(successSpy).to.have.been.calledOnce;
        });

        it('calls error callback if provided', () => {
          const dispatchSpy = sinon.spy()
          callErrorCallback = true;
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
          const successSpy = sinon.spy();
          const errorSpy = sinon.spy();
          instance.setListener(listenerConfig, successSpy, errorSpy);
          expect(successSpy).to.have.callCount(0);
          expect(errorSpy).to.have.been.calledOnce;
          callErrorCallback = false;
        });

        describe('as a parameter', () => {
          it('updates single doc in state when docChanges includes single doc change with type: "modified"', () => {
            const dispatchSpy = sinon.spy()
            onSnapshotSpy = sinon.spy(func => {
              func({
                docChanges: [
                  {
                    doc: {
                      id: '123ABC',
                      data: () => ({ some: 'value' }),
                      ref: {
                        path: 'test/1/test2/test3',
                      },
                    },
                    type: 'modified',
                  },
                ],
                size: 2,
                doc: {
                  id: '123ABC',
                },
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
            instance.setListener(listenerConfig);
            expect(onSnapshotSpy).to.be.calledOnce;
            // SET_LISTENER, DOCUMENT_MODIFIED
            expect(dispatchSpy).to.be.calledTwice;
            const {
              args: [{ type: secondType }],
            } = dispatchSpy.getCall(0);
            const {
              args: [{ type: firstType }],
            } = dispatchSpy.getCall(1);
            expect(secondType).to.equal(actionTypes.DOCUMENT_MODIFIED);
            expect(firstType).to.equal(actionTypes.SET_LISTENER);
          });

          it('updates multiple docs in state when docChanges includes multiple doc changes', async () => {
            const docChanges = [
              {
                doc: {
                  id: '123ABC',
                  data: () => ({ some: 'value' }),
                  ref: {
                    path: 'test/1/test2/123ABC',
                  },
                },
                type: 'modified',
              },
              {
                doc: {
                  id: '234ABC',
                  data: () => ({ some: 'value' }),
                  ref: {
                    path: 'test/1/test2/234ABC',
                  },
                },
                type: 'modified',
              },
            ];
            onSnapshotSpy = sinon.spy(func => {
              func({
                docChanges,
                size: 3,
                doc: { id: '123ABC' },
              });
            });
            // subcollection level listener
            listenerConfig = {
              collection: 'test',
              doc: '1',
              subcollections: [{ collection: 'test2' }],
            };
            const instance = createFirestoreInstance(
              fakeFirebase,
              fakeConfig,
              dispatchSpy,
            );
            await instance.setListener(listenerConfig);
            expect(onSnapshotSpy).to.be.calledOnce;
            // SET_LISTENER, DOCUMENT_MODIFIED, DOCUMENT_MODIFIED
            expect(dispatchSpy).to.have.callCount(3);
            const {
              args: [{ type: secondType }],
            } = dispatchSpy.getCall(1);
            const {
              args: [{ type: thirdType }],
            } = dispatchSpy.getCall(0);
            expect(secondType).to.equal(actionTypes.DOCUMENT_MODIFIED);
            expect(thirdType).to.equal(actionTypes.DOCUMENT_MODIFIED);
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
            await instance.setListener(listenerConfig);
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

        describe('as a method', () => {
          it('updates single doc in state when docChanges includes single doc change with type: "modified"', async () => {
            const docChanges = [
              {
                doc: {
                  id: '123ABC',
                  data: () => ({ some: 'value' }),
                  ref: {
                    path: 'test/1/test2/123ABC',
                  },
                },
                type: 'modified',
              },
            ];
            onSnapshotSpy = sinon.spy(func => {
              func({
                docChanges: () => docChanges,
                size: 2,
                doc: {
                  id: '123ABC',
                },
              });
            });
            // Listener on subcollection level
            listenerConfig = {
              collection: 'test',
              doc: '1',
              subcollections: [{ collection: 'test2' }],
            };
            const instance = createFirestoreInstance(
              fakeFirebase,
              fakeConfig,
              dispatchSpy,
            );
            const expectedAction = {
              meta: { ...listenerConfig },
              payload: { name: `test/1/test2` },
              type: actionTypes.SET_LISTENER,
            };
            await instance.setListener(listenerConfig);
            expect(onSnapshotSpy).to.be.calledOnce;
            // SET_LISTENER, LISTENER_RESPONSE
            expect(dispatchSpy).to.be.calledTwice;
            expect(dispatchSpy).to.be.calledWith(expectedAction);
          });

          it('updates multiple docs in state when docChanges includes multiple doc changes', async () => {
            const docChanges = [
              {
                doc: {
                  id: '123ABC',
                  data: () => ({ some: 'value' }),
                  ref: {
                    path: 'test/1/test2/123ABC',
                  },
                },
                type: 'modified',
              },
              {
                doc: {
                  id: '234ABC',
                  data: () => ({ some: 'value' }),
                  ref: {
                    path: 'test/1/test2/234ABC',
                  },
                },
                type: 'modified',
              },
            ];
            onSnapshotSpy = sinon.spy(func => {
              func({
                docChanges: () => docChanges,
                size: 3,
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
            await instance.setListener(listenerConfig);
            expect(onSnapshotSpy).to.be.calledOnce;
            // SET_LISTENER, DOCUMENT_MODIFIED, DOCUMENT_MODIFIED
            expect(dispatchSpy).to.be.calledThrice;
            const {
              args: [{ type: secondType }],
            } = dispatchSpy.getCall(1);
            const {
              args: [{ type: thirdType }],
            } = dispatchSpy.getCall(0);
            expect(secondType).to.equal(actionTypes.DOCUMENT_MODIFIED);
            expect(thirdType).to.equal(actionTypes.DOCUMENT_MODIFIED);
          });

          it('still dispatches LISTENER_RESPONSE action type if whole collection is being updated (i.e. docChanges.length === size)', async () => {
            onSnapshotSpy = sinon.spy(success => {
              success({
                docChanges: () => [
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
            await instance.setListener(listenerConfig);
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
      });
    });

    describe('setListeners', () => {
      it('throws if listeners config is not an array', () => {
        const dipsatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy
        );
        expect(() =>
          (instance.setListeners as any)({ collection: 'test' }),
        ).to.throw(
          'Listeners must be an Array of listener configs (Strings/Objects).',
        );
      });

      it('calls dispatch if listeners provided', () => {
        const dipsatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy
        );
        instance.setListeners([{ collection: 'test' }]),
        expect(dispatchSpy).to.have.been.calledOnce
      });

      it('maps listeners array', () => {
        setListeners(fakeFirebase, dispatchSpy, [
          { collection: 'test' },
          { collection: 'test2' },
        ]);
        expect(onSnapshotSpy).to.be.calledTwice;
      });

      it('supports subcollections', () => {
        const dipsatchSpy = sinon.spy()
        const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy
        );
        instance.setListeners([{
          collection: 'test',
          doc: '1',
          subcollections: [{ collection: 'test2' }],
        }])
        expect(dispatchSpy).to.have.been.calledOnce
      });

      describe('allowMultipleListeners', () => {
        it('works with one listener', async () => {
          const dispatchSpy = sinon.spy()
          const fakeFirebaseWithOneListener = {
            _: {
              listeners: {},
              config: { ...defaultConfig, allowMultipleListeners: false },
            },
            firestore: () => ({
              collection: collectionClass,
            }),
          };
          const instance = createFirestoreInstance(
            fakeFirebaseWithOneListener,
            { helpersNamespace: 'test' },
            dispatchSpy,
          );
          const listeners = [
            {
              collection: 'test',
              doc: '1',
              subcollections: [{ collection: 'test2' }],
            },
          ];
          const forEachMock = sinon.spy(listeners, 'forEach');
          instance.setListeners(listeners);
          expect(forEachMock).to.be.calledOnce;
          // SET_LISTENER, LISTENER_RESPONSE
          expect(dispatchSpy).to.be.calledTwice;
        });

        it('works with two listeners of the same path (only attaches once)', () => {
          const dispatchSpy = sinon.spy()
          const fakeFirebaseWithOneListener = {
            _: {
              listeners: {},
              config: { ...defaultConfig, allowMultipleListeners: false },
            },
            firestore: () => ({
              collection: collectionClass,
            }),
          };
          const instance = createFirestoreInstance(
            fakeFirebaseWithOneListener,
            { helpersNamespace: 'test' },
            dispatchSpy,
          );
          const listeners = [
            {
              collection: 'test',
              doc: '1',
              subcollections: [{ collection: 'test3' }],
            },
            {
              collection: 'test',
              doc: '1',
              subcollections: [{ collection: 'test3' }],
            },
          ];
          const forEachMock = sinon.spy(listeners, 'forEach');
          instance.setListeners(listeners);
          expect(forEachMock).to.be.calledOnce;
          // SET_LISTENER, LISTENER_RESPONSE
          expect(dispatchSpy).to.be.calledTwice;
        });
      });
    });

    describe('unsetListener', () => {
      it('throws if invalid path config is provided', () => {
          const dispatchSpy = sinon.spy()
          const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy
        );
        expect(() => (instance.unsetListener as any)()).to.throw(
          'Invalid Path Definition: Only Strings and Objects are accepted.',
        );
      });

      it('throws if dispatch is not a function', () => {
          const dispatchSpy = sinon.spy()
          const instance = (createFirestoreInstance as any)(
          {},
          { helpersNamespace: 'test' },
        );
        expect(() =>
          instance.unsetListener({ collection: 'test' }),
        ).to.throw('dispatch is not a function');
      });
    });

    describe('unsetListeners', () => {
      it('throws if listeners config is not an array', () => {
          const dispatchSpy = sinon.spy()
          const instance = createFirestoreInstance(
          {},
          { helpersNamespace: 'test' },
          dispatchSpy
        );
        expect(() =>
          (instance.unsetListeners as any)({ collection: 'test' }),
        ).to.throw(
          'Listeners must be an Array of listener configs (Strings/Objects)',
        );
      });

      it('dispatches UNSET_LISTENER action', () => {
          const dispatchSpy = sinon.spy()
          const instance = createFirestoreInstance(
          {},
          {},
          dispatchSpy,
        );
        instance.unsetListeners([{ collection: 'test' }]);
        expect(dispatchSpy).to.have.been.calledWith({
          meta: { collection: 'test' },
          payload: { name: 'test' },
          type: actionTypes.UNSET_LISTENER,
        });
      });

      describe('allowMultipleListeners option enabled', () => {
        it('dispatches UNSET_LISTENER action', () => {
          const dispatchSpy = sinon.spy()
          const fakeFirebaseWithOneListener = {
            _: {
              listeners: {},
              config: { ...defaultConfig, allowMultipleListeners: false },
            },
            firestore: () => ({
              collection: collectionClass,
            }),
          };
          const instance = createFirestoreInstance(
            fakeFirebaseWithOneListener,
            {},
            dispatchSpy,
          );
          instance.unsetListeners([{ collection: 'test' }]);
          expect(dispatchSpy).to.have.callCount(0);
        });

        it('dispatches UNSET_LISTENER action if there is more than one listener', () => {
          const dispatchSpy = sinon.spy()
          const fakeFirebaseWithOneListener = {
            _: {
              listeners: {},
              config: { ...defaultConfig, allowMultipleListeners: false },
            },
            firestore: () => ({
              collection: collectionClass,
            }),
          };
          const instance = createFirestoreInstance(
            fakeFirebaseWithOneListener,
            { helpersNamespace: 'test' },
            dispatchSpy,
          );
          instance.setListeners([
            { collection: 'test' },
            { collection: 'test' },
          ]);
          instance.unsetListeners([{ collection: 'test' }]);
          // UNSET_LISTENER, LISTENER_RESPONSE
          expect(dispatchSpy).to.be.calledTwice;
        });
      });
    });

    describe('runTransaction', () => {
      it('throws if invalid path config is provided', () => {
        const dispatchSpy = sinon.spy()
        const instance = createFirestoreInstance(fakeFirebase, {}, dispatchSpy);
        expect(() => (instance.runTransaction as any)()).to.throw(
          'dispatch is not a function',
        );
      });
    });
  });
});
