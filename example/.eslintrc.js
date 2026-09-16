const path = require('node:path');

module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      parserOptions: {
        babelOptions: {
          configFile: path.join(__dirname, 'babel.config.js'),
        },
      },
    },
  ],
};
