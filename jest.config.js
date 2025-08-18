const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^pdf-parse$': '<rootDir>/src/__tests__/__mocks__/pdf-parse.ts',
    '^chromadb$': '<rootDir>/src/__tests__/__mocks__/chromadb.ts',
    '^mammoth$': '<rootDir>/src/__tests__/__mocks__/mammoth.ts',
    '^@xenova/transformers$': '<rootDir>/src/__tests__/__mocks__/@xenova/transformers.ts',
    '^html-to-text$': '<rootDir>/src/__tests__/__mocks__/html-to-text.ts',
    '^uuid$': require.resolve('uuid'),
  },
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
    '!src/**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  moduleDirectories: ['node_modules', '<rootDir>/src/__tests__/__mocks__'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        target: 'es2020',
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@xenova/transformers)/)',
  ],
  testTimeout: 15000,
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
};

module.exports = createJestConfig(customJestConfig); 