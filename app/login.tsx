// screens/Login.tsx
import { useAuth } from "@/hooks/useAuth"; // Importe o novo hook de autenticação
import { loginUser } from "@/services/authService";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth(); // Use o hook de autenticação do Redux
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) return;
    
    setLoading(true);
    try {
       console.log("Login bem-sucedido:", username, password);
      const userData = await loginUser(username, password);
      await login(userData); // Use a ação de login do Redux
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      console.error("Erro no login:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ImageBackground
      source={require("../assets/background-image.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <Image
              source={require("../assets/eprod-logo.png")}
              style={styles.logoApp}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Seja bem vindo</Text>
            <TextInput
              style={styles.input}
              placeholder="Usuário"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
            />
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Senha"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={toggleShowPassword}
              >
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.button, loading && { backgroundColor: "#aaa" }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Image
          source={require("../assets/equatorial.png")}
          style={styles.logoEmpresa}
          resizeMode="contain"
        />
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const window = Dimensions.get('window');
const isTablet = window.width >= 600;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: isTablet ? window.width * 0.1 : 24,
    paddingVertical: isTablet ? window.height * 0.05 : 48,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    padding: isTablet ? window.width * 0.06 : 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    width: isTablet ? window.width * 0.65 : '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  logoApp: {
    width: isTablet ? window.width * 0.2 : 200,
    height: isTablet ? window.width * 0.1 : 100,
    alignSelf: "center",
    marginBottom: isTablet ? window.height * 0.03 : 16,
  },
  logoEmpresa: {
    width: isTablet ? window.width * 0.4 : 200,
    height: isTablet ? window.width * 0.12 : 60,
    alignSelf: "center",
    marginBottom: isTablet ? window.height * 0.05 : 32,
  },
  subtitle: {
    fontSize: isTablet ? window.width * 0.025 : 16,
    color: "#666",
    textAlign: "center",
    marginBottom: isTablet ? window.height * 0.04 : 32,
  },
  input: {
    backgroundColor: "#FFF",
    padding: isTablet ? window.height * 0.02 : 14,
    borderRadius: 10,
    marginBottom: isTablet ? window.height * 0.02 : 16,
    fontSize: isTablet ? window.width * 0.025 : 16,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginBottom: isTablet ? window.height * 0.02 : 16,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  passwordInput: {
    flex: 1,
    padding: isTablet ? window.height * 0.02 : 14,
    fontSize: isTablet ? window.width * 0.025 : 16,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: "#20348bff",
    padding: isTablet ? window.height * 0.02 : 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: isTablet ? window.height * 0.01 : 8,
  },
  buttonText: {
    color: "#FFF",
    fontSize: isTablet ? window.width * 0.025 : 16,
    fontWeight: "600",
  },
});