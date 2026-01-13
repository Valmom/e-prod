import ProtectedRoute from '@/components/ProtectedRoute';
import { AntDesign, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
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
          // Cor sólida quando em foco, transparente quando não
          backgroundColor: focused ? "rgba(50, 50, 50, 0.95)" : "transparent",
        },
        focused && styles.circleIconFocused,
      ]}
    >
      {children}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  const centralButtonColor = "#20348bff";
  const activeTintColor = "#fff";
  const inactiveTintColor = "rgba(255, 255, 255, 0.7)";

  const dashboardFocused = segments[0] === "(tabs)" && (segments as string[])[1] === "dashboard";

  return (
    <ProtectedRoute>
      <StatusBar
        style='inverted'
        backgroundColor='#000'
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
              height: 64,
              borderRadius: 22,
              backgroundColor: "transparent",
              borderTopWidth: 0,
              borderTopColor: "transparent",
              elevation: 0,
              shadowColor: "transparent",
              shadowOpacity: 0,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 0,
              paddingTop: Platform.select({
                android: 12,
                ios: 13,
              }),
              marginBottom: Platform.select({
                android: 10,
                ios: 0,
              }),
              paddingBottom: insets.bottom,
              overflow: "visible",
            },
            tabBarBackground: () => (
              <LinearGradient
                colors={['rgba(211, 210, 210, 0.7)', 'rgba(150, 149, 149, 0.9)']}
                start={[0, 0]}
                end={[0, 1]}
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: 'rgba(202, 202, 202, 0.9)',
                    overflow: 'hidden'
                  }
                ]}
              >
                <View style={styles.glassHighlight} />
              </LinearGradient>
            ),
          }}
        >
          <Tabs.Screen
            name="alertas"
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <CircleIcon focused={focused} color={color}>
                  <MaterialCommunityIcons 
                    name="bell"
                    size={32}
                    color={focused ? "#FF6B6B" : "rgba(255, 255, 255, 0.8)"} 
                  />
                </CircleIcon>
              ),
            }}
          />
          <Tabs.Screen
            name="mipi-web"
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <CircleIcon focused={focused} color={color}>
                  <AntDesign
                    name='chrome'
                    size={32} 
                    color={focused ? "#4ECDC4" : "rgba(255, 255, 255, 0.8)"}                     
                  />             
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
                        : "rgba(32, 52, 139, 0.95)",
                      position: "absolute",
                      top: -30,
                      alignSelf: "center",
                      zIndex: 1,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={dashboardFocused 
                      ? ['rgba(32, 52, 139, 0.95)', 'rgba(22, 36, 177, 0.9)'] 
                      : ['#7f8085ff', '#3e3e3fff']
                    }
                    start={[0, 0]}
                    end={[0, 1]}
                    style={styles.centralButtonGradient}
                  >
                    <MaterialIcons 
                      name="dashboard" 
                      size={32} 
                      color="#fff" 
                    />
                  </LinearGradient>
                </TouchableOpacity>
              ),
            }}
          />
          <Tabs.Screen
            name="documentos"
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <CircleIcon focused={focused} color={color}>
                  <MaterialCommunityIcons
                    name="file-document"
                    size={32}
                    color={focused ? "#FFD166" : "rgba(255, 255, 255, 0.8)"}
                  />                  
                </CircleIcon>
              ),
            }}
          />
          <Tabs.Screen
            name="perfil"                        
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <CircleIcon focused={focused} color={color}>
                  <MaterialCommunityIcons 
                    name="account"
                    size={32}
                    color={focused ? "#9D4EDD" : "rgba(255, 255, 255, 0.8)"} 
                  />                  
                </CircleIcon>
              )
            }}
          />
        </Tabs>
      </ThemeProvider>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  centralButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
  centralButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  circleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -2,
    marginBottom: -2,
    backgroundColor: "transparent",
  },
  circleIconFocused: {
    backgroundColor: "rgba(56, 53, 53, 0.95)", // Fundo sólido escuro
    shadowColor: "#000",
    shadowOpacity: 0.15,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: "#e6e6e6ff"
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});