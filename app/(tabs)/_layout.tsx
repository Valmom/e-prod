import { AntDesign, Ionicons } from "@expo/vector-icons";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Tabs, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const TABBAR_WIDTH = width * 0.9;

type CircleIconProps = {
  children: React.ReactNode;
  focused: boolean;
  color: string;
};

function CircleIcon({ children, focused }: CircleIconProps) {
  return (
    <View
      style={[
        styles.circleIcon,
        {
          backgroundColor: focused ? "#000" : "rgba(22, 24, 177, 0)",
        },
        focused && styles.circleIconFocused,
      ]}
    >
      {children}
    </View>
  );
}

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  const centralButtonColor = "#20348bff";
  const activeTintColor = "#fff";
  const inactiveTintColor = "#ccc";

  const dashboardFocused = segments[0] === "(tabs)" && segments[1] === "dashboard";

  return (
    <>
        <StatusBar
          style={"dark"}
        />
        <ThemeProvider value={DarkTheme}>
          <Tabs
            screenOptions={{
              animation: "fade",
              tabBarShowLabel: false,
              tabBarActiveTintColor: activeTintColor,
              tabBarInactiveTintColor: inactiveTintColor,
              headerShown: false,
              tabBarStyle: {
                position: "absolute",
                bottom: Platform.select({
                  android: insets.bottom,
                  ios: Math.max(insets.bottom, 24),
                }),
                width: TABBAR_WIDTH,
                marginLeft: (width - TABBAR_WIDTH) / 2,
                height: 48,
                borderRadius: 12,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 10,
                paddingTop: Platform.select({
                  android: 8,
                  ios: 5,
                }),          
                marginBottom: Platform.select({
                  android: 10,
                  ios: 0,
                }),      
                paddingBottom: insets.bottom,
                elevation: 10,      
                borderWidth: 0          
              },
            }}
          >
            <Tabs.Screen
              name="alertas"
              options={{
                tabBarIcon: ({ focused, color, size }) => (
                  <CircleIcon focused={focused} color={color}>
                    <AntDesign name="warning" size={size} color="#fff" />
                  </CircleIcon>
                ),
              }}
            />
            <Tabs.Screen
              name="mipi-web"
              options={{
                tabBarIcon: ({ focused, color, size }) => (
                  <CircleIcon focused={focused} color={color}>
                    <AntDesign name="earth" size={size} color="#fff" />
                  </CircleIcon>
                ),
              }}
            />
            <Tabs.Screen
              name="dashboard"
              options={{
                tabBarIcon: () => null,
                tabBarButton: ({ onPress }) => (
                  <TouchableOpacity
                    onPress={onPress}
                    style={[
                      styles.centralButton,
                      {
                        backgroundColor: dashboardFocused
                          ? centralButtonColor
                          : "rgba(0, 0, 0, 0.8)",
                        position: "absolute",
                        top: -24,
                        alignSelf: "center", // centralizado
                        zIndex: 1,
                      },
                    ]}
                  >
                    <AntDesign name="home" size={32} color="#fff" />
                  </TouchableOpacity>
                ),
              }}
            />
            <Tabs.Screen
              name="documentos"
              options={{
                tabBarIcon: ({ focused, color, size }) => (
                  <CircleIcon focused={focused} color={color}>
                    <AntDesign name="filetext1" size={size} color="#fff" />
                  </CircleIcon>
                ),
              }}
            />
            <Tabs.Screen
              name="perfil"
              options={{
                tabBarIcon: ({ focused, color, size }) => (
                  <CircleIcon focused={focused} color={color}>
                    <Ionicons name="person-circle-outline" size={size} color="#fff" />
                  </CircleIcon>
                ),
              }}
            />
            <Tabs.Screen
              name="historico"              
              options={{
                tabBarIcon: ({ focused, color, size }) => (
                  <CircleIcon focused={focused} color={color}>
                    <Ionicons name="person-circle-outline" size={size} color="#fff" />
                  </CircleIcon>
                ),
              }}
            />            
          </Tabs>
        </ThemeProvider>
    </>
  );
}

const styles = StyleSheet.create({
  centralButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 8,
  },
  circleIcon: {
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -5,
    marginBottom: -4,
  },
  circleIconFocused: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
});