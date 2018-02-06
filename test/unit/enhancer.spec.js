import { createStore, compose } from 'redux';
import reduxFirestore, { getFirestore } from '../../src/enhancer';

const reducer = sinon.spy();
const generateCreateStore = () =>
  compose(
    reduxFirestore(
      {},
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

  it('has the right methods', () => {
    expect(store.firestore.setListener).to.be.a('function');
  });
});

describe('getFirestore', () => {
  it('returns firestore instance created by enhancer', () => {
    expect(getFirestore()).to.be.an('object');
  });
});
