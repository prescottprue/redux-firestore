import orderedReducer from '../../../src/reducers/orderedReducer';

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
});
