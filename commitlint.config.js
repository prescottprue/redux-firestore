module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      issuePrefixes: ['#'],
      referenceActions: ['closes', 'fixes'],
    },
  },
};
