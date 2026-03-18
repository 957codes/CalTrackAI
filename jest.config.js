/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  transformIgnorePatterns: ["node_modules/(?!react-native|@react-native|@sentry)"],
  setupFiles: ["<rootDir>/src/__tests__/setup.ts"],
};
