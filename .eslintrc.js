module.exports = {
  root: true,
  parser: 'babel-eslint',
  extends: ['airbnb-base', 'google', 'prettier', 'plugin:jsdoc/recommended'],
  plugins: ['babel', 'prettier', 'jsdoc'],
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  settings: {
    'import/resolver': {
      node: {
        moduleDirectory: ['node_modules', '/'],
      },
    },
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
      },
    ],
    'no-console': 'error',
    'valid-jsdoc': 0, // from google
    'no-confusing-arrow': 0,
    'no-case-declarations': 0,
    'no-param-reassign': [2, { props: false }],
    'arrow-parens': 0, // handled by Prettier
    'prefer-default-export': 0,
    'jsdoc/newline-after-description': 0,
    'jsdoc/no-undefined-types': [1, { definedTypes: ['firebase'] }],
  },
};
