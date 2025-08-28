import ScreenLayout from "@/components/ScreenLayout";
import { useAuth } from "@/context/AuthContext";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Perfil() {
  const { user, logout } = useAuth();

  return (
    <ScreenLayout title="">
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Perfil</Text>
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
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 24,
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
    width: '70%',
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
