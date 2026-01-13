import ScreenLayout from "@/components/ScreenLayout";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function MipiWeb() {
  return (
    <ScreenLayout title="">
      <WebView
        source={{ uri: 'https://eprod.equatorialenergia.com.br/entrar' }}
        style={styles.webView}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1
  }
});
