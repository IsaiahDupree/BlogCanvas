module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/?(*.)+(spec|test).ts'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/app/(.*)$': '<rootDir>/src/app/$1',
    },
    collectCoverageFrom: [
        'lib/**/*.ts',
        'src/app/api/**/*.ts',
        '!lib/**/*.d.ts',
        '!src/**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
    ],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                moduleResolution: 'node',
            }
        }]
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
    transformIgnorePatterns: [
        'node_modules/(?!(next)/)'
    ]
};
