module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
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
    'arrow-parens': [2, 'always'],
    'prefer-default-export': 0,
    'jsdoc/newline-after-description': 0,
    'jsdoc/empty-tags': 0, // still add docs functions marked private
    'jsdoc/no-undefined-types': [
      1,
      {
        definedTypes: ['firebase', 'Mutation_v1', 'Mutation_v2', 'firstore'],
      },
    ],
    // TODO: Remove once all default params are updated
    'default-param-last': 0,
  },
};
