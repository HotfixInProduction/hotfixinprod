module.exports = {
    preset: "jest-expo",
    testPathIgnorePatterns: ["<rootDir>/e2e/"],
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
        "!index.ts"
    ],
    reporters: [
        "default",
        ["jest-junit", {
            outputDirectory: ".",
            outputName: "junit.xml",
            classNameTemplate: "{filepath}",
        }]
    ]
};
