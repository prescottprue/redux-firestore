import errorsReducer from '../../../src/reducers/errorsReducer';

describe('errorsReducer', () => {
  it('is exported', () => {
    expect(errorsReducer).to.exist;
  });
  it('is a function', () => {
    expect(errorsReducer).to.be.a('function');
  });
  it('returns state for undefined actionType', () => {
    expect(errorsReducer({}, {})).to.exist;
  });
});
