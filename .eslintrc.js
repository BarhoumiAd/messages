module.exports = {
  extends: ['standard', 'prettier', 'plugin:security/recommended'],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true,
    },
  },
  env: {
    jest: true,
    node: true,
    es6: true,
  },
  rules: {
    'prettier/prettier': 'error',
  },
  plugins: ['standard', 'promise', 'node', 'import', 'security', 'prettier'],
  settings: {
    node: {
      paths: ['src'],
    },
  },
};
