module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.jest.test.js'],
  setupFiles: ['<rootDir>/tests/setup.cjs'],
  restoreMocks: true,
  // Node 22 carrega este modulo ESM, mas o runtime CommonJS do Jest precisa transpila-lo.
  transformIgnorePatterns: ['/node_modules/(?!content-disposition/)'],
  transform: { '^.+\\.js$': ['babel-jest', { plugins: ['@babel/plugin-transform-modules-commonjs'] }] },
  collectCoverageFrom: ['dist/**/*.js', '!dist/server.js', '!dist/database/**', '!dist/config/**'],
  coverageDirectory: 'coverage',
};
