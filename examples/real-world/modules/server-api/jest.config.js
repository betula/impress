module.exports = {
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json"
    }
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup-after-each.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  testMatch: [ "**/*.test.ts" ],
  moduleNameMapper: {
    "~/(.*)$": "<rootDir>/$1"
  },
  testPathIgnorePatterns: [
    "<rootDir>/release/",
    "<rootDir>/node_modules/"
  ],
  moduleFileExtensions: ["js", "ts"],
  testEnvironment: "node",
  verbose: true
};