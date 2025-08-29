// screens/Perfil.tsx
import ScreenLayout from "@/components/ScreenLayout";
import { useAuth } from "@/hooks/useAuth"; // Importe o novo hook de autenticação
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Perfil() {
  const { user, logout } = useAuth(); // Use o hook de autenticação do Redux

  return (
    <ScreenLayout title="Perfil">
      <View style={styles.profileCard}>
        <Image
          source={{ uri: "https://i.pravatar.cc/150" }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.nome}</Text>
        <Text style={styles.email}>{user?.tipoUsuario}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
    width: '70%'
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: "#e53935",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});