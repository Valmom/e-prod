import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}

function Layout() {
  const { user } = useAuth();
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
    if (!isNavigationReady) return;

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
  }, [user, segments, isNavigationReady]);


  return (
    <ThemeProvider value={theme}>
      <Stack
        screenOptions={{
          animation: "fade", // outras opções: 'fade', 'slide_from_bottom', etc.
          headerShown: false, // se você quiser esconder o cabeçalho padrão
        }}
      />
    </ThemeProvider>
  );
}