import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node', 
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/tests/**/*_test.ts'],
  forceExit: true
};

export default config;