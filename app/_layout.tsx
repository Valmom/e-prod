import { usePushNotificationListeners } from '@/utils/notifications';
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import FlashMessage from "react-native-flash-message";
import { Provider } from "react-redux";
import { AuthLoader } from "../components/AuthLoader";
import { store } from "../store";
import { useAppSelector } from "../store/hooks";

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
  const user = useAppSelector((state) => state.auth.user); // vindo do Redux
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  usePushNotificationListeners();

  useEffect(() => {
    if (!isNavigationReady || isLoading) return;

    if (segments[0] === "splash") return;

    const inAuthGroup = segments[0] === "login";
    if (!user && !inAuthGroup) {
      router.replace("/login");
    }
    
    if (user && inAuthGroup) {
      router.replace("/(tabs)/dashboard");
    }
  }, [user, segments, isNavigationReady, isLoading]);

  return (
    <ThemeProvider value={theme}>
      <Stack
        screenOptions={{
          animation: "fade",
          headerShown: false,
        }}
      />
      <FlashMessage 
        position="top"
        duration={3000}
        floating={true}
        style={{ marginTop: 40, zIndex: 9999999, elevation: 9999999 }}
      />      
    </ThemeProvider>
  );
}