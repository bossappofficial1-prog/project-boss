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
    roots: ["<rootDir>/src", "<rootDir>/tests"]
};
