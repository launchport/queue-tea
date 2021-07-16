module.exports = {
  roots: ['<rootDir>/src'],
  preset: 'ts-jest/presets/js-with-babel',
  testEnvironment: 'node',
  // transform: {
  //   '^.+\\.tsx?$': 'ts-jest',
  //   '^.+\\.jsx?$': 'babel-jest',
  // },
  transform: {
    // '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/?!(nanoevents)/'],
  // moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
}
