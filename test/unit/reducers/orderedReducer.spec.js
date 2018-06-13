import { keyBy, get } from 'lodash';
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

  it('returns state for undefined action type', () => {
    expect(orderedReducer({}, {})).to.exist;
  });

  it('returns state for actionType not matching reducer', () => {
    state = {};
    expect(
      orderedReducer(state, { type: 'testing', meta: { collection: 'test' } }),
    ).to.equal(state);
  });

  describe('actionTypes', () => {
    describe('DOCUMENT_ADDED', () => {
      it('adds a document when collection is empty', () => {
        const collection = 'test1';
        const doc = 'test2';
        const someDoc = { some: 'value' };
        const payload = {
          ordered: { newIndex: 0, oldIndex: -1 },
          data: someDoc,
        };
        const meta = { collection, doc };
        action = { meta, payload, type: actionTypes.DOCUMENT_ADDED };
        const result = orderedReducer({}, action);
        // Id is set
        expect(result).to.have.nested.property(`${collection}.0.id`, doc);
        // Value is set
        expect(result).to.have.nested.property(
          `${collection}.0.some`,
          someDoc.some,
        );
      });

      it('adds a subcollection document when collection is empty', () => {
        const collection = 'test1';
        const doc = 'test2';
        const subcollection = 'test3';
        const subdoc = 'test4';
        const fakeDoc = { some: 'value' };
        const payload = {
          ordered: { newIndex: 0, oldIndex: -1 },
          data: fakeDoc,
        };
        const meta = {
          collection,
          doc,
          subcollections: [{ collection: subcollection }],
          path: `${collection}/${doc}/${subcollection}/${subdoc}`,
        };
        action = {
          meta,
          payload,
          type: actionTypes.DOCUMENT_ADDED,
        };
        const result = orderedReducer({}, action);
        // Id is set
        expect(result).to.have.nested.property(
          `${collection}.0.${subcollection}.0.id`,
          subdoc,
        );
        // Value is set
        expect(result).to.have.nested.property(
          `${collection}.0.${subcollection}.0.some`,
          fakeDoc.some,
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

    describe('DELETE_SUCCESS', () => {
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
        action = { meta, payload, type: actionTypes.DELETE_SUCCESS };
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

      it('removes a subcollection from a document', () => {
        const collection = 'test1';
        const doc = 'test2';
        const someDoc = {
          id: doc,
          subtest: [{ id: 'sub1' }, { id: 'nextId' }],
        };
        const someDoc2 = { id: 'test3' };
        const payload = {
          ordered: { newIndex: 0, oldIndex: -1 },
          data: someDoc,
        };
        const subDocSetting = { collection: 'subtest' };
        const meta = {
          collection,
          doc,
          subcollections: [subDocSetting],
        };
        action = { meta, payload, type: actionTypes.DELETE_SUCCESS };
        const result = orderedReducer(
          { [collection]: [someDoc, someDoc2] },
          action,
        );
        // Confirm first item is still original doc
        expect(result).to.have.nested.property(
          `${collection}.0.id`,
          someDoc.id,
        );
        // Confirm other item at top level is preserved
        expect(result[collection]).to.have.length(2);
        // Removes property in original data
        expect(result).to.not.have.nested.property(
          `${collection}.0.subtest`,
          [],
        );
      });

      it('returns original document if subcollection does not exist', () => {
        const collection = 'test1';
        const doc = 'test2';
        const someDoc = {
          id: doc,
        };
        const payload = {
          ordered: {},
          data: someDoc,
        };
        const meta = {
          collection,
          doc,
          subcollections: [{ collection: 'subtest', doc: 'test' }],
        };
        action = { meta, payload, type: actionTypes.DELETE_SUCCESS };
        const result = orderedReducer({ [collection]: [someDoc] }, action);
        // Confirm first item is still original doc
        expect(result).to.have.nested.property(`${collection}.0`, someDoc);
      });

      it('removes document from a subcollection', () => {
        const collection = 'test1';
        const doc = 'test2';
        const someDoc = {
          id: doc,
          subtest: [{ id: 'sub1' }, { id: 'nextId' }],
        };
        const someDoc2 = { id: 'test3' };
        const subDocSetting = { collection: 'subtest', doc: 'sub1' };
        const payload = {
          ordered: { newIndex: 0, oldIndex: -1 },
          data: someDoc,
        };
        const meta = {
          collection,
          doc,
          subcollections: [subDocSetting],
        };
        action = { meta, payload, type: actionTypes.DELETE_SUCCESS };
        const result = orderedReducer(
          { [collection]: [someDoc, someDoc2] },
          action,
        );
        // Confirm first item is still original doc
        expect(result).to.have.nested.property(
          `${collection}.0.id`,
          someDoc.id,
        );
        // Confirm other item at top level is preserved
        expect(result[collection]).to.have.length(2);
        // Removes property in original data
        expect(result).to.not.have.nested.property(
          `${collection}.0.subtest.0.id`,
          subDocSetting.doc,
        );
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

      it('removes data for empty listener responses', () => {
        const orderedData = [];
        action = {
          meta: { collection: 'testing' },
          type: actionTypes.LISTENER_RESPONSE,
          payload: { ordered: orderedData },
        };
        state = { testing: [{ id: 'test' }] };
        const result = orderedReducer(state, action);
        // Preserves state parameter
        expect(result).to.have.property('testing');
        // Value is an empty array
        expect(result.testing).to.be.an('array');
        expect(result.testing).to.be.empty;
      });

      it('removes data for empty listener responses when using storeAs', () => {
        const orderedData = [];
        action = {
          meta: { collection: 'testing', storeAs: 'another' },
          type: actionTypes.LISTENER_RESPONSE,
          payload: { ordered: orderedData },
        };
        state = { another: [{ id: 'test' }] };
        const result = orderedReducer(state, action);
        // Preserves state parameter
        expect(result).to.have.property('another');
        // Value is an empty array
        expect(result.another).to.be.an('array');
        expect(result.another).to.be.empty;
      });

      it('merges collection already within state', () => {
        const id = 'doc';
        const someField = 'a thing';
        const orderedData = [
          { id, someField },
          { id: 'some', newField: 'testing' },
        ];
        action = {
          meta: { collection: 'testing' },
          type: actionTypes.LISTENER_RESPONSE,
          payload: { ordered: orderedData, data: keyBy(orderedData, 'id') },
        };
        state = { testing: [{ id, original: 'original' }] };
        expect(orderedReducer(state, action)).to.have.nested.property(
          'testing.0.someField',
          someField,
        );
        expect(orderedReducer(state, action)).to.have.nested.property(
          'testing.0.original',
          'original',
        );
        expect(orderedReducer(state, action)).to.have.nested.property(
          'testing.0.id',
          id,
        );
        expect(orderedReducer(state, action)).to.have.nested.property(
          'testing.1.id',
          'some',
        );
      });

      it('merges collection already within state with response', () => {
        const id = 'doc';
        const id2 = 'some';
        const someField = 'a thing';
        const orderedData = [
          { id, someField },
          { id: id2, originalField: 'asdf' },
        ];
        action = {
          meta: { collection: 'testing' },
          type: actionTypes.LISTENER_RESPONSE,
          payload: { ordered: orderedData, data: keyBy(orderedData, 'id') },
        };
        state = { testing: [{ id, original: 'original' }] };
        const [firstItem, secondItem, thirdItem] = get(
          orderedReducer(state, action),
          'testing',
          [],
        );
        expect(firstItem).to.have.property('id', id);
        // new parameter is added to document
        expect(firstItem).to.have.property('someField', someField);
        expect(firstItem).to.have.property('original', 'original');
        // existing parameter on document object is preserved
        // existing doc in new array position
        expect(secondItem).to.have.property('id', id2);
        expect(secondItem).to.have.property('originalField', 'asdf');
        // confirm extra/duplicate data is not written
        expect(thirdItem).to.not.exist;
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

      it('removes data from subcollection if payload is empty', () => {
        const original = [{ id: 'subDoc' }];
        action = {
          meta: {
            collection: 'testing',
            doc: 'doc',
            subcollections: [{ collection: 'original' }],
          },
          merge: {}, // reset merge settings
          type: actionTypes.LISTENER_RESPONSE,
          payload: { ordered: [] },
        };
        state = { testing: [{ id: 'doc', original }] };
        const result = orderedReducer(state, action);
        // Removes subcollection
        expect(result).to.not.have.nested.property('testing.0.original');
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
                id: '123abc',
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
