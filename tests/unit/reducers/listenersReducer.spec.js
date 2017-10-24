import listenersReducer from '../../../src/reducers/listenersReducer';

describe('listenersReducer', () => {
  it('is exported', () => {
    expect(listenersReducer).to.exist;
  });
  it('is a function', () => {
    expect(listenersReducer).to.be.a('function');
  });
  it('returns state for undefined actionType', () => {
    expect(listenersReducer({}, {})).to.exist;
  });
});
