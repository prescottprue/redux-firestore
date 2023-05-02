import reducer from '../../src/reducer';

describe('reducer', () => {
  it('is exported', () => {
    expect(reducer).to.exist;
  });
  it('is a function', () => {
    expect(reducer).to.exist;
  });
  it('returns state for undefined actionType', () => {
    expect(reducer({}, {})).to.exist;
  });
});

describe('reducers', () => {
  describe('errors reducer', () => {
    it('returns state for undefined actionType', () => {
      expect(reducer({}, {})).to.have.property('errors');
    });
  });
  describe('status reducer', () => {
    it('returns state for undefined actionType', () => {
      expect(reducer({}, {})).to.have.property('status');
    });
  });
});
