module.exports = {
    preset: "jest-expo",
    setupFiles: ["<rootDir>/jest.setup.js"],
    testPathIgnorePatterns: ["<rootDir>/e2e/", "<rootDir>/__tests__/utils/"],
    collectCoverage: true,
    testTimeout: 10000,
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)"
    ],
    
    collectCoverageFrom: [
        "**/*.{ts,tsx}",
        "!**/coverage/**",
        "!**/node_modules/**",
        "!**/babel.config.js",
        "!**/jest.setup.js",
        "!**/e2e/**",
        "!**/__tests__/utils/**",
        "!index.ts",
         "App.tsx",
        "index.ts",
        "src/**/*.{ts,tsx,js,jsx}"
    ],
    reporters: [
        "default",
        ["jest-junit", {
            outputDirectory: ".",
            outputName: "junit.xml",
            classNameTemplate: "{filepath}",
        }]
    ],
    coverageReporters: ["lcov", "text"]
};
