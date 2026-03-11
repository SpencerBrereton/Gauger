export default {
  expo: {
    name: "Gauger",
    slug: "gauger",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    platforms: ["android", "web"],
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1a1a2e",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#1a1a2e",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      package: "com.gauger.app",
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    extra: {
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ||
        "https://gauger-backend.onrender.com/api/v1",
      eas: {
        projectId: "9d8dc046-d518-4317-9986-e1b1854a8599",
      },
    },
    plugins: ["expo-secure-store", "@react-native-community/datetimepicker"],
    owner: "spencerbrereton",
  },
};
