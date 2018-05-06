import orderedReducer from 'reducers/orderedReducer';
import { actionTypes } from 'constants';

let action;
let state;

describe('orderedReducer', () => {
  it('is exported', () => {
    expect(orderedReducer).to.exist;
  });
  it('is a function', () => {
    expect(orderedReducer).to.be.a('function');
  });
  it('returns state for undefined actionType', () => {
    expect(orderedReducer({}, {})).to.exist;
  });

  describe('actionTypes', () => {
    describe('DOCUMENT_ADDED', () => {
      it('adds a document when collection is empty', () => {
        const collection = 'test1';
        const doc = 'test2';
        const someDoc = { id: doc };
        const payload = {
          ordered: { newIndex: 0, oldIndex: -1 },
          data: someDoc,
        };
        const meta = { collection, doc };
        action = { meta, payload, type: actionTypes.DOCUMENT_ADDED };
        const result = orderedReducer({}, action);
        expect(result).to.have.nested.property(
          `${collection}.0.id`,
          someDoc.id,
        );
      });
    });

    describe('DOCUMENT_REMOVED', () => {
      it('removes document from collection', () => {
        const collection = 'test1';
        const doc = 'test2';
        const someDoc = { id: doc };
        const someDoc2 = { id: 'test3' };
        const payload = {
          ordered: { newIndex: 0, oldIndex: -1 },
          data: someDoc,
        };
        const meta = { collection, doc };
        action = { meta, payload, type: actionTypes.DOCUMENT_REMOVED };
        const result = orderedReducer(
          { [collection]: [someDoc, someDoc2] },
          action,
        );
        // Confirm first item is
        expect(result).to.have.nested.property(
          `${collection}.0.id`,
          someDoc2.id,
        );
        expect(result[collection]).to.have.length(1);
      });
    });

    describe('LISTENER_RESPONSE', () => {
      it('returns state if payload is not defined', () => {
        action = { meta: 'test', type: actionTypes.LISTENER_RESPONSE };
        state = {};
        expect(orderedReducer(state, action)).to.equal(state);
      });

      it('returns state if payload does not contain ordered', () => {
        action = {
          meta: 'test',
          type: actionTypes.LISTENER_RESPONSE,
          payload: {},
        };
        state = {};
        expect(orderedReducer(state, action)).to.equal(state);
      });

      it('returns state if meta is not defined', () => {
        action = {
          type: actionTypes.LISTENER_RESPONSE,
          payload: {},
        };
        state = {};
        expect(orderedReducer(state, action)).to.equal(state);
      });

      it('updates state with payload.ordered', () => {
        const orderedData = [{}];
        action = {
          meta: { collection: 'testing' },
          type: actionTypes.LISTENER_RESPONSE,
          payload: { ordered: orderedData },
        };
        state = {};
        expect(orderedReducer(state, action)).to.have.property(
          'testing',
          orderedData,
        );
      });

      it('merges collection already within state', () => {
        const id = 'doc';
        const someField = 'a thing';
        const orderedData = [{ id, someField }];
        action = {
          meta: { collection: 'testing' },
          type: actionTypes.LISTENER_RESPONSE,
          payload: { ordered: orderedData },
        };
        state = { testing: [{ id: 'some', someField: 'original' }] };
        expect(orderedReducer(state, action)).to.have.nested.property(
          'testing.1.someField',
          someField,
        );
      });

      describe('doc', () => {
        it('adds a new doc within state', () => {
          const orderedData = { id: 'doc' };
          action = {
            meta: { collection: 'testing', doc: 'doc' },
            type: actionTypes.LISTENER_RESPONSE,
            payload: { ordered: orderedData },
          };
          state = {};
          expect(orderedReducer(state, action)).to.have.property(
            'testing',
            orderedData,
          );
        });

        it('updates doc already within state', () => {
          const id = 'doc';
          const someField = 'a thing';
          const orderedData = [{ id, someField }];
          action = {
            meta: { collection: 'testing', doc: 'doc' },
            type: actionTypes.LISTENER_RESPONSE,
            payload: { ordered: orderedData, data: orderedData[0] },
          };
          state = { testing: [{ id, someField: 'original' }] };
          expect(orderedReducer(state, action)).to.have.nested.property(
            'testing.0.someField',
            someField,
          );
        });
      });

      describe('subcollections', () => {
        it('adds a new doc within state with subcollection', () => {
          const orderedData = { id: 'subDoc' };
          const subcollection = { collection: 'testing2' };
          action = {
            meta: {
              collection: 'testing',
              doc: 'doc',
              subcollections: [subcollection],
            },
            type: actionTypes.LISTENER_RESPONSE,
            payload: { ordered: [orderedData] },
          };
          state = {};
          expect(orderedReducer(state, action)).to.have.nested.property(
            `testing.0.${subcollection.collection}.0.id`,
            orderedData.id,
          );
        });

        it('adds subcollection to existing doc within state', () => {
          const orderedData = { id: 'subDoc', someOther: 'thing' };
          const subcollection = { collection: 'testing2' };
          action = {
            meta: {
              collection: 'testing',
              doc: 'doc',
              subcollections: [subcollection],
            },
            merge: {}, // reset merge settings
            type: actionTypes.LISTENER_RESPONSE,
            payload: { ordered: [orderedData] },
          };
          state = { testing: [{ id: 'doc', another: 'thing' }] };
          const result = orderedReducer(state, action);
          // Adds subcollection to document
          expect(result).to.have.nested.property(
            `testing.0.${subcollection.collection}.0.id`,
            orderedData.id,
          );
          // Preserves original value
          expect(result).to.have.nested.property('testing.0.another', 'thing');
        });

        it('perserves existing collections on doc updates', () => {
          const orderedData = { id: 'doc', someOther: 'thing' };
          const original = [{ id: 'subDoc' }];
          action = {
            meta: {
              collection: 'testing',
              doc: 'doc',
            },
            merge: {}, // reset merge settings
            type: actionTypes.LISTENER_RESPONSE,
            payload: { ordered: [orderedData] },
          };
          state = { testing: [{ id: 'doc', original }] };
          const result = orderedReducer(state, action);
          // Updates parameter in document
          expect(result).to.have.nested.property(
            `testing.0.someOther`,
            orderedData.someOther,
          );
          // Preserves documents in original subcollection
          expect(result).to.have.nested.property(
            'testing.0.original.0.id',
            original[0].id,
          );
        });

        it('updates the reference of subcollection docs on parent doc update', () => {
          const orderedData = { id: 'doc', someOther: 'thing' };
          const original = [{ id: 'subDoc' }];
          action = {
            meta: {
              collection: 'testing',
              doc: 'doc',
            },
            merge: {}, // reset merge settings
            type: actionTypes.LISTENER_RESPONSE,
            payload: { ordered: [orderedData] },
          };
          state = { testing: [{ id: 'doc', original }] };
          const result = orderedReducer(state, action);
          // Updates reference of documents in original subcollection
          expect(result).to.not.have.nested.property(
            'testing.0.original',
            original,
          );
        });
      });

      it('stores data under storeAs', () => {
        const orderedData = [{}];
        const storeAs = 'other';
        action = {
          meta: { storeAs },
          type: actionTypes.LISTENER_RESPONSE,
          payload: { ordered: orderedData },
        };
        state = {};
        expect(orderedReducer(state, action)).to.have.property(
          storeAs,
          orderedData,
        );
      });

      it('updates doc under storeAs', () => {
        action = {
          type: actionTypes.LISTENER_RESPONSE,
          meta: {
            collection: 'testing',
            doc: '123abc',
            storeAs: 'pathName',
          },
          payload: {
            ordered: [
              {
                content: 'new',
              },
            ],
          },
          merge: {},
        };

        state = {
          pathName: [
            {
              id: '123abc',
              content: 'old',
            },
          ],
        };
        expect(orderedReducer(state, action)).to.have.nested.property(
          `pathName.0.content`,
          'new',
        );
      });
    });

    describe('GET_SUCCESS', () => {
      it('returns state if payload is not defined', () => {
        action = { meta: 'test', type: actionTypes.GET_SUCCESS };
        state = {};
        expect(orderedReducer(state, action)).to.equal(state);
      });

      it('returns state if payload does not contain ordered', () => {
        action = {
          meta: 'test',
          type: actionTypes.GET_SUCCESS,
          payload: {},
        };
        state = {};
        expect(orderedReducer(state, action)).to.equal(state);
      });

      describe('preserve parameter', () => {
        it('array saves keys from state', () => {
          action = {
            meta: 'test',
            type: actionTypes.GET_SUCCESS,
            payload: {},
            preserve: ['some'],
          };
          state = { some: 'value' };
          expect(orderedReducer(state, action)).to.have.property('some');
        });
      });
    });

    describe('CLEAR_DATA', () => {
      it('removes all data from state', () => {
        action = {
          type: actionTypes.CLEAR_DATA,
          meta: { collection: 'testing' }, // meta is required to trigger ordered reducer
        };
        state = {};
        expect(orderedReducer(state, action)).to.be.empty;
        expect(orderedReducer(state, action)).to.be.empty;
      });

      it('sets a new reference when clearing', () => {
        action = {
          type: actionTypes.CLEAR_DATA,
          meta: { collection: 'testing' }, // meta is required to trigger ordered reducer
        };
        state = {};
        expect(orderedReducer(state, action)).to.not.equal(state);
      });

      describe('preserve parameter', () => {
        it('array saves keys from state', () => {
          action = {
            meta: { collection: 'testing' }, // meta is required to trigger ordered reducer
            type: actionTypes.CLEAR_DATA,
            payload: {},
            preserve: { ordered: ['some'] },
          };
          state = { some: 'value' };
          expect(orderedReducer(state, action)).to.have.property('some');
        });

        it('function returns state to save', () => {
          action = {
            meta: { collection: 'testing' }, // meta is required to trigger ordered reducer
            type: actionTypes.CLEAR_DATA,
            payload: {},
            preserve: { ordered: currentState => currentState },
          };
          state = { some: 'value' };
          expect(orderedReducer(state, action)).to.have.property('some');
        });
      });
    });
  });
});
