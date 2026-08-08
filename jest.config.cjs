/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  moduleFileExtensions: ["ts", "js", "mjs", "json"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "ESNext",
          moduleResolution: "bundler",
          target: "ES2022",
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          allowImportingTsExtensions: true,
          noEmit: true,
          lib: ["DOM", "ESNext"],
        },
      },
    ],
  },
  moduleNameMapper: {
    // Source uses `.ts` specifiers; strip for ts-jest resolution.
    "^(\\.{1,2}/.*)\\.ts$": "$1",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@noble|@hazae41)/)",
  ],
  // Meek / fetch keep handles open briefly after suite end.
  forceExit: true,
};
