import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { Provider } from "react-redux";
import { AuthLoader } from "../components/AuthLoader"; // Importe o AuthLoader
import { store } from "../store";
import { useAppSelector } from "../store/hooks"; // Importe o hook

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthLoader>
        <Layout />
      </AuthLoader>
    </Provider>
  );
}

function Layout() {
  const user = useAppSelector((state) => state.auth.user); // Use o Redux
  const isLoading = useAppSelector((state) => state.auth.isLoading); // Use o Redux
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [splashShown, setSplashShown] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsNavigationReady(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isNavigationReady || isLoading) return; // Verifique também o isLoading

    if (!splashShown && segments[0] !== "splash") {
      router.replace("/splash");
      setSplashShown(true);
      return;
    }
    
    if (segments[0] === "splash") return;
    const inAuthGroup = segments[0] === "login";
    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/dashboard");
    }
  }, [user, segments, isNavigationReady, isLoading, splashShown]);

  return (
    <ThemeProvider value={theme}>
      <Stack
        screenOptions={{
          animation: "fade",
          headerShown: false,
        }}
      />
    </ThemeProvider>
  );
}