import { StatusBar } from "expo-status-bar";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import AppNavigator from "./src/navigation/AppNavigator";

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#F6821F",
    background: "#F3F4F6",
    surface: "#FFFFFF",
  },
};

export default function App() {
  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style="dark" />
      <AppNavigator />
    </PaperProvider>
  );
}
