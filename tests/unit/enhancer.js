import { createStore, compose } from 'redux';
import reduxFirestore from '../../src/enhancer';

const reducer = sinon.spy();
const generateCreateStore = () =>
  compose(reduxFirestore(
    {},
    {
      userProfile: 'users',
    },
  ))(createStore);

const store = generateCreateStore()(reducer);

describe('enhancer', () => {
  it('exports a function', () => {
    expect(reduxFirestore).to.be.a('function');
  });
  it('adds firestore to store', () => {
    expect(store).to.have.property('firestore');
  });
});
