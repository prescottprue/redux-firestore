module.exports = {
  extends: '../.eslintrc.js',
  env: {
    mocha: true,
  },
  globals: {
    sinon: true,
    expect: true,
    Firebase: true,
    firebase: true,
    fbConfig: true,
    uid: true,
  },
  rules: {
    'no-unused-expressions': [0],
    'new-cap': 0,
  },
  settings: {
    'import/resolver': {
      node: {
        moduleDirectory: ['../node_modules', '../src'],
      },
    },
  },
};
