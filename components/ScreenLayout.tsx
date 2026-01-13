import { ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenLayoutProps {
  title: string;
  children: ReactNode;
  scroll?: boolean;
}

export default function ScreenLayout({ title, children, scroll = false }: ScreenLayoutProps) {
  const isWebView = title === "";
  const insets = useSafeAreaInsets();

  const content = isWebView ? (
    <View style={{ flex: 1 }}>{children}</View>
  ) : (
    <View style={styles.inner}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, {paddingBottom: Platform.OS === "android" ? -48 : -34,}]}>
      {scroll ? <ScrollView>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginBottom: Platform.select({
      android: 44,
      ios: 0,
    }),    
    backgroundColor: "#FFFFFF",
  },
  inner: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 16,
    paddingBottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    color: "#FFF"
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    color: "#444",
  },
});