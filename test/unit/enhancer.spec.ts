import { createStore, compose } from 'redux';
import reduxFirestore, { getFirestore } from 'enhancer';

const reducer = sinon.spy();
const generateCreateStore = () =>
  compose(
    reduxFirestore(
      { firestore: () => ({ collection: () => ({}) }) },
      {
        userProfile: 'users',
      },
    ),
  )(createStore);

const store = generateCreateStore()(reducer);

describe('enhancer', () => {
  it('exports a function', () => {
    expect(reduxFirestore).to.be.a('function');
  });

  it('adds firestore to store', () => {
    expect(store).to.have.property('firestore');
  });

  it('adds extended methods', () => {
    expect(store.firestore.setListener).to.be.a('function');
  });

  it('preserves unmodified internal Firebase methods', () => {
    expect(store.firestore.collection).to.be.a('function');
  });
});

describe('getFirestore', () => {
  it('returns firestore instance created by enhancer', () => {
    expect(getFirestore()).to.be.an('object');
  });
});
