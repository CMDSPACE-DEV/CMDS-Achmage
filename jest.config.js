/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
  },
  testPathIgnorePatterns: ['<rootDir>/REFERENCES/'],
  modulePathIgnorePatterns: ['<rootDir>/REFERENCES/'],
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
}
