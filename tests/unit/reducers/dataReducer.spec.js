import dataReducer from '../../../src/reducers/dataReducer';

describe('dataReducer', () => {
  it('is exported', () => {
    expect(dataReducer).to.exist;
  });
  it('is a function', () => {
    expect(dataReducer).to.be.a.function;
  });
  it('returns state for undefined actionType', () => {
    expect(dataReducer({}, {})).to.exist;
  });
});
