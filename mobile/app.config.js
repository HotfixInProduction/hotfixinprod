module.exports = {
  expo: {
    name: "campushotfix",
    slug: "campushotfix",
    owner: 'hotfixinprod',
    scheme: "campushotfix",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      bundleIdentifier: "com.concordia.hotfixinprod",
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Allow location access so we can show your position on the map.",
      },
      config: { googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.concordia.hotfixinprod",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
      usesCleartextTraffic: true,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY
        }
      },
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "com.concordia.hotfixinprod",
              path: "/oauth2redirect"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "@config-plugins/detox",
      "expo-font",
      "expo-asset",
      "expo-web-browser"
    ],
    extra: {
      googleApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
      androidClientId: process.env.GOOGLE_OAUTH_CLIENT_ID_ANDROID,
      iosClientId: process.env.GOOGLE_OAUTH_CLIENT_ID_IOS,
      eas: {
        // EAS project ID for this app.
        // See README.md ("EAS Project configuration") for details about this ID and how to update it.
        projectId: "20dcdc57-e4a6-4d53-b09f-0ba6e3587b7a"
      }
    }
  }
};
