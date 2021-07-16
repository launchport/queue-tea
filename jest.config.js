module.exports = {
  roots: ['<rootDir>/src'],
  preset: 'ts-jest/presets/js-with-babel',
  testEnvironment: 'node',
  transformIgnorePatterns: ['node_modules/?!(nanoevents)/'],
}
