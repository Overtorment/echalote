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
          baseUrl: "./src",
          paths: {
            "mods/*": ["mods/*"],
            "libs/*": ["libs/*"],
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    // Source uses NodeNext-style `.js` specifiers that resolve to `.ts` files.
    "^libs/(.*)\\.js$": "<rootDir>/src/libs/$1.ts",
    "^mods/(.*)\\.js$": "<rootDir>/src/mods/$1.ts",
    "^libs/(.*)$": "<rootDir>/src/libs/$1",
    "^mods/(.*)$": "<rootDir>/src/mods/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@noble|@hazae41)/)",
  ],
  // Meek / fetch keep handles open briefly after suite end.
  forceExit: true,
};
