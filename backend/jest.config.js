/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            'ts-jest': {
                tsconfig: 'tsconfig.json',
            },
        }],
    },
    testMatch: [
        "**/?(*.)+(spec|test).[tj]s?(x)"
    ],
    moduleFileExtensions: ["ts", "js", "json", "node"],
    roots: ["<rootDir>/src", "<rootDir>/tests"],
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^@src/(.*)$': '<rootDir>/src/$1',
    },
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "<rootDir>/src/utils/response.ts",
        "<rootDir>/src/errors/app-error.ts",
        "<rootDir>/src/config/"
    ]
};
