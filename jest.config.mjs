/** @type {import('jest').Config} */
const config = {
    projects: [
        {
            displayName: 'api',
            testEnvironment: 'node',
            testMatch: ['**/__tests__/api/**/*.test.ts', '**/__tests__/agents/**/*.test.ts', '**/__tests__/pipeline/**/*.test.ts', '**/__tests__/integration/**/*.test.ts', '**/src/lib/**/__tests__/**/*.test.ts'],
            setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1'
            },
            transform: {
                '^.+\\.(t|j)sx?$': ['ts-jest', {
                    useESM: false,
                    tsconfig: {
                        module: 'commonjs',
                        esModuleInterop: true,
                        allowJs: true
                    }
                }]
            },
            moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json']
        },
        {
            displayName: 'components',
            testEnvironment: 'jsdom',
            testMatch: ['**/__tests__/components/**/*.test.tsx', '**/__tests__/components/**/*.test.ts'],
            setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.setup.component.js'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
                '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
            },
            transform: {
                '^.+\\.(t|j)sx?$': ['ts-jest', {
                    useESM: false,
                    tsconfig: {
                        jsx: 'react-jsx',
                        module: 'commonjs',
                        esModuleInterop: true,
                        allowJs: true
                    }
                }]
            },
            moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json']
        }
    ],
    testPathIgnorePatterns: ['/node_modules/', '/.next/'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts'
    ]
};

export default config;
