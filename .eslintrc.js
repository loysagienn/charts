module.exports = {
    // parser: 'babel-eslint',
    extends: [
        'airbnb-base',
    ],
    env: {
        browser: true,
    },
    'plugins': [
        'import'
    ],
    settings: {
    },
    rules: {
        'max-len': ['error', {code: 120, ignoreStrings: true, ignoreTemplateLiterals: true}],
        'indent': ['error', 4],
        'object-curly-spacing': ['error', 'never'],
        'object-curly-newline': 'off',
        'no-use-before-define': 'off',
        'import/extensions': 'off',
        'import/prefer-default-export': 'off',
        'no-param-reassign': 'off',
        'no-console': 'off',
        'no-continue': 'off',
        'no-return-assign': 'off',
        'no-underscore-dangle': 'off',
        'function-paren-newline': 'off',
        'no-plusplus': 'off'
    }
};
