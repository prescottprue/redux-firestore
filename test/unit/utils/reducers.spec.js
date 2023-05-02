import {
  getDotStrPath,
  pathFromMeta,
  getSlashStrPath,
  preserveValuesFromState,
  updateItemInArray,
  createReducer,
} from '../../../src/utils/reducers';

let subcollections;
let config;

describe('reducer utils', () => {
  describe('getSlashStrPath', () => {
    it('is exported', () => {
      expect(getSlashStrPath).to.be.a('function');
    });
    it('converts dot path to slash path', () => {
      expect(getSlashStrPath('some.other.thing')).to.equal('some/other/thing');
    });
    it('removes leading .', () => {
      expect(getSlashStrPath('.some.other.thing')).to.equal('some/other/thing');
    });
    it('returns empty string for undefined input', () => {
      expect(getSlashStrPath()).to.equal('');
    });
  });

  describe('getDotStrPath', () => {
    it('is exported', () => {
      expect(getDotStrPath).to.be.a('function');
    });
    it('converts slash path to dot path', () => {
      expect(getDotStrPath('some/other/thing')).to.equal('some.other.thing');
    });
    it('removes leading /', () => {
      expect(getDotStrPath('/some/other/thing')).to.equal('some.other.thing');
    });
    it('returns empty string for undefined input', () => {
      expect(getDotStrPath()).to.equal('');
    });
  });

  describe('pathFromMeta', () => {
    it('is exported', () => {
      expect(pathFromMeta).to.be.a('function');
    });

    it('throws for no meta data passed (first argument)', () => {
      expect(() => pathFromMeta()).to.throw(
        'Action meta is required to build path for reducers.',
      );
    });

    it('returns undefined if provided nothing', () => {
      expect(() => pathFromMeta({})).to.throw(
        'Collection or Collection Group is required to construct reducer path.',
      );
    });

    it('returns collection if provided', () => {
      expect(pathFromMeta({ collection: 'test' })).to.have.property(0, 'test');
    });

    it('returns collection group if provided', () => {
      expect(pathFromMeta({ collectionGroup: 'test' })).to.have.property(
        0,
        'test',
      );
    });

    it('returns collection doc combined into dot path if both provided', () => {
      const result = pathFromMeta({ collection: 'first', doc: 'second' });
      expect(result).to.have.property(0, 'first');
      expect(result).to.have.property(1, 'second');
    });

    it('uses storeAs as path if provided', () => {
      pathFromMeta({ storeAs: 'testing' });
    });

    it('uses path as path if provided', () => {
      expect(pathFromMeta({ path: 'testing' })).to.have.property(0, 'testing');
    });

    describe('updateItemInArray', () => {
      it('is exported', () => {
        expect(updateItemInArray).to.be.a('function');
      });

      it('returns an array when no arguments are passed', () => {
        expect(updateItemInArray([], '123', () => ({}))).to.be.an('array');
      });

      it('preserves items which do not have matching ids', () => {
        const testId = '123ABC';
        const result = updateItemInArray(
          [{ id: 'other' }, { id: testId }],
          testId,
          () => 'test',
        );
        expect(result[0]).to.have.property('id', 'other');
      });

      it('updates item with matching id', () => {
        const testId = '123ABC';
        const result = updateItemInArray(
          [{ id: testId }],
          testId,
          () => 'test',
        );
        expect(result).to.have.property(0, 'test');
      });
    });

    describe('supports a subcollection', () => {
      it('with collection', () => {
        subcollections = [{ collection: 'third' }];
        config = { collection: 'first', doc: 'second', subcollections };
        const result = pathFromMeta(config);
        expect(result).to.have.property(0, 'first');
        expect(result).to.have.property(1, 'second');
        expect(result).to.have.property(2, 'third');
      });

      it('with doc', () => {
        subcollections = [{ collection: 'third', doc: 'forth' }];
        config = { collection: 'first', doc: 'second', subcollections };
        const result = pathFromMeta(config);
        expect(result).to.have.property(0, 'first');
        expect(result).to.have.property(1, 'second');
        expect(result).to.have.property(2, 'third');
        expect(result).to.have.property(3, 'forth');
      });
    });

    it('supports multiple subcollections', () => {
      subcollections = [
        { collection: 'third', doc: 'forth' },
        { collection: 'fifth' },
      ];
      config = { collection: 'first', doc: 'second', subcollections };
      const result = pathFromMeta(config);
      expect(result).to.have.property(0, 'first');
      expect(result).to.have.property(1, 'second');
      expect(result).to.have.property(2, 'third');
      expect(result).to.have.property(4, 'fifth');
    });
  });

  describe('createReducer', () => {
    it('calls handler mapped to action type', () => {
      const actionHandler = sinon.spy();
      const newReducer = createReducer({}, { test: actionHandler });
      newReducer({}, { type: 'test' });
      expect(actionHandler).to.have.been.calledOnce;
    });

    it('returns state for action types not within handlers', () => {
      const newReducer = createReducer({}, {});
      const state = {};
      expect(newReducer(state, { type: 'testing' })).to.equal(state);
    });
  });

  describe('preserveValuesFromState', () => {
    it('is exported', () => {
      expect(preserveValuesFromState).to.be.a('function');
    });

    describe('passing boolean', () => {
      it('returns original state for true', () => {
        const result = preserveValuesFromState({}, true);
        expect(result).to.be.an('object');
        expect(result).to.be.empty;
      });

      it('extends state with next state if provided', () => {
        const testVal = 'val';
        const result = preserveValuesFromState({}, true, { testVal });
        expect(result).to.have.property('testVal', testVal);
      });
    });

    describe('passing function', () => {
      it('returns original state for true', () => {
        const result = preserveValuesFromState({}, () => ({}));
        expect(result).to.be.an('object');
        expect(result).to.be.empty;
      });
    });

    describe('passing an array of keys', () => {
      it('returns original state for true', () => {
        const result = preserveValuesFromState({ some: 'val' }, ['some']);
        expect(result).to.have.property('some', 'val');
      });
    });

    describe('passing invalid preserve option', () => {
      it('throws', () => {
        expect(() => preserveValuesFromState({ some: 'val' }, 'some')).to.throw(
          'Invalid preserve parameter. It must be an Object or an Array.',
        );
      });
    });
  });
});
