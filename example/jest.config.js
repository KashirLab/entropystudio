module.exports = {
  preset: 'jest-expo',
  watchman: false,
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native(-.*)?|@react-native(-community)?|expo(-.*)?|@expo(nent)?/.*|yaml)/)',
  ],
};
