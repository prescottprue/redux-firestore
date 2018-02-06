import { getDotStrPath, pathFromMeta } from '../../../src/utils/reducers';

let subcollections;
let config;

describe('reducer utils', () => {
  describe('getDotStrPath', () => {
    it('is exported', () => {
      expect(getDotStrPath).to.be.a('function');
    });
    it('converts slash path to dot path', () => {});
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
        'Collection is required to construct reducer path.',
      );
    });

    it('returns collection if provided', () => {
      expect(pathFromMeta({ collection: 'test' })).to.equal('test');
    });

    it('returns collection doc combined into dot path if both provided', () => {
      expect(pathFromMeta({ collection: 'first', doc: 'second' })).to.equal(
        'first.second',
      );
    });

    it('uses storeAs as path if provided', () => {
      pathFromMeta({ storeAs: 'testing' });
    });

    describe('supports a subcollection', () => {
      it('with collection', () => {
        subcollections = [{ collection: 'third' }];
        config = { collection: 'first', doc: 'second', subcollections };
        expect(pathFromMeta(config)).to.equal('first.second.third');
      });

      it('with doc', () => {
        subcollections = [{ collection: 'third', doc: 'forth' }];
        config = { collection: 'first', doc: 'second', subcollections };
        expect(pathFromMeta(config)).to.equal('first.second.third.forth');
      });
    });

    it('supports multiple subcollections', () => {
      subcollections = [
        { collection: 'third', doc: 'forth' },
        { collection: 'fifth' },
      ];
      config = { collection: 'first', doc: 'second', subcollections };
      expect(pathFromMeta(config)).to.equal('first.second.third.forth.fifth');
    });
  });
});
