import {
  attachListener,
  getQueryConfigs,
  firestoreRef,
} from '../../../src/utils/query';

let dispatch;
let meta;
let result;

describe('query utils', () => {
  describe('attachListener', () => {
    it('is exported', () => {
      expect(attachListener).to.be.a('function');
    });

    describe('converts slash path to dot path', () => {
      beforeEach(() => {
        dispatch = sinon.spy();
      });

      it('for collection', () => {
        meta = { collection: 'test' };
        attachListener({ _: { listeners: {} } }, dispatch, meta);
        expect(dispatch).to.be.calledWith({
          meta,
          payload: { name: 'test' },
          type: '@@reduxFirestore/SET_LISTENER',
        });
      });

      it('for collection and document', () => {
        meta = { collection: 'test', doc: 'doc' };
        attachListener({ _: { listeners: {} } }, dispatch, meta);
        expect(dispatch).to.be.calledWith({
          meta,
          payload: { name: `${meta.collection}/${meta.doc}` },
          type: '@@reduxFirestore/SET_LISTENER',
        });
      });

      it('for collection, document, and subcollections', () => {
        meta = { collection: 'test', doc: 'doc', subcollections: [{ collection: 'test' }] };
        attachListener({ _: { listeners: {} } }, dispatch, meta);
        expect(dispatch).to.be.calledWith({
          meta,
          payload: { name: `${meta.collection}/${meta.doc}/${meta.subcollections[0].collection}` },
          type: '@@reduxFirestore/SET_LISTENER',
        });
      });
    });

    it('throws if meta is not included', () => {
      expect(() => attachListener({}, dispatch))
        .to.Throw('Meta data is required to attach listener.');
    });

    it('throws if _ variable is not defined on Firebase', () => {
      expect(() => attachListener({}, dispatch, { collection: 'test' }))
        .to.Throw('Internal Firebase object required to attach listener. Confirm that reduxFirestore enhancer was added when you were creating your store');
    });
  });

  describe('getQueryConfigs', () => {
    it('is exported', () => {
      expect(getQueryConfigs).to.be.a('function');
    });

    it('it throws for invalid input', () => {
      expect(() => getQueryConfigs(1))
        .to.Throw('Querie(s) must be an Array or a string');
    });

    describe('array', () => {
      it('with collection in string', () => {
        expect(getQueryConfigs(['test']))
          .to.have.nested.property('0.collection', 'test');
      });

      it('with collection in an object', () => {
        expect(getQueryConfigs([{ collection: 'test' }]))
          .to.have.nested.property('0.collection', 'test');
      });

      it('with collection and doc in an object', () => {
        meta = [{ collection: 'test', doc: 'other' }];
        result = getQueryConfigs(meta);
        expect(result)
          .to.have.nested.property('0.collection', meta[0].collection);
        expect(result).to.have.nested.property('0.doc', meta[0].doc);
      });

      it('throws invalid object', () => {
        meta = [{ test: 'test' }];
        expect(() => getQueryConfigs(meta))
          .to.Throw('Collection and/or Doc are required parameters within query definition object');
      });
    });

    describe('string', () => {
      it('with collection', () => {
        expect(getQueryConfigs('test'))
          .to.have.property('collection', 'test');
      });
    });

    describe('object', () => {
      it('with collection', () => {
        expect(getQueryConfigs({ collection: 'test' }))
          .to.have.nested.property('0.collection', 'test');
      });

      it('with doc', () => {
        meta = { collection: 'test', doc: 'other' };
        result = getQueryConfigs(meta);
        expect(result).to.have.nested.property('0.collection', meta.collection);
        expect(result).to.have.nested.property('0.doc', meta.doc);
      });

      it('with subcollections', () => {
        meta = { collection: 'test', doc: 'other', subcollections: [{ collection: 'thing' }] };
        result = getQueryConfigs(meta);
        expect(result).to.have.nested.property('0.collection', meta.collection);
        expect(result).to.have.nested.property('0.doc', meta.doc);
        expect(result).to.have.nested.property('0.subcollections.0.collection', meta.subcollections[0].collection);
      });
    });
  });

  describe('firestoreRef', () => {
    beforeEach(() => {
      dispatch = sinon.spy();
    });

    describe('doc', () => {
      it('creates ref', () => {
        meta = { collection: 'test', doc: 'other' };
        const docSpy = sinon.spy(() => ({ }));
        const fakeFirebase = { firestore: () => ({ collection: () => ({ doc: docSpy }) }) };
        result = firestoreRef(fakeFirebase, dispatch, meta);
        expect(result).to.be.an('object');
        expect(docSpy).to.be.calledWith(meta.doc);
      });
    });

    describe('subcollections', () => {
      it.skip('creates ref with collection', () => {
        meta = { collection: 'test', doc: 'other', subcollections: [{ collection: 'thing' }] };
        const docSpy = sinon.spy(() => ({ }));
        const fakeFirebase = {
          firestore: () => ({
            collection: () => ({
              doc: () => ({
                collection: () => ({ doc: docSpy }),
              }),
            }),
          }),
        };
        result = firestoreRef(fakeFirebase, dispatch, meta);
        expect(result).to.be.an('object');
        expect(docSpy).to.be.calledOnce(meta.subcollections[0].collection);
      });

      it.skip('creates ref with doc', () => {
        meta = { collection: 'test', doc: 'other', subcollections: [{ collection: 'thing', doc: 'again' }] };
        const docSpy = sinon.spy(() => ({ }));
        const fakeFirebase = {
          firestore: () => ({
            collection: () => ({
              doc: () => ({
                collection: () => ({ doc: docSpy }),
              }),
            }),
          }),
        };
        result = firestoreRef(fakeFirebase, dispatch, meta);
        expect(result).to.be.an('object');
        expect(docSpy).to.be.calledWith(meta.subcollections[0].collection.doc);
      });
    });
  });
});
