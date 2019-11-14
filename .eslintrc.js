module.exports = {
  parser: '@typescript-eslint/parser',
  'extends': [
    'airbnb-base',
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:jsdoc/recommended'
  ],
  root: true,
  plugins: ['@typescript-eslint', 'prettier'],
  settings: {
    'import/resolver': {
      node: {
        moduleDirectory: ['node_modules', '/'],
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    },
    react: {
      version: '16.0'
    }
  },
  env: {
    browser: true,
    node: true
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 0,
    'react/jsx-no-bind': 0,
    'react/sort-comp': 0,
    'no-shadow': 0,
    'no-new': 0,
    'new-cap': 0,
    'max-len': 0,
    'jsdoc/newline-after-description': 0,
    'jsdoc/require-returns-type': 0,
    'jsdoc/require-param-type': 0,
    'prettier/prettier': [
      'error',
      {
        singleQuote: true, // airbnb
        trailingComma: 'all', // airbnb
      }
    ]
  }
};
