module.exports = {
	root: true,
	parser: 'babel-eslint',
	'extends': [
		'airbnb',
		'google',
		'prettier'
	],
	plugins: [
		'babel',
		'prettier'
	],
	env: {
		browser: true,
		es6: true,
		node: true
	},
	rules: {
		'prettier/prettier': ['error', {
      'singleQuote': true,
      'trailingComma': 'all'
    }],
		'no-console': 'error',
		'no-confusing-arrow': 0,
		'no-case-declarations': 0,
		'arrow-parens': [2, 'as-needed'],
		'prefer-default-export': 0
	}
}