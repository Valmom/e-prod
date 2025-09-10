import ScreenLayout from "@/components/ScreenLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

function getIniciaisNome(nomeCompleto: string | undefined | null): string {
  if (!nomeCompleto || typeof nomeCompleto !== "string") {
    return "U";
  }

  const partesNome = nomeCompleto.trim().split(/\s+/).filter((part) => part.length > 0);

  if (partesNome.length === 0) {
    return "U";
  }

  if (partesNome.length === 1) {
    return partesNome[0].charAt(0).toUpperCase();
  }

  const primeiraInicial = partesNome[0].charAt(0).toUpperCase();
  const ultimaInicial = partesNome[partesNome.length - 1].charAt(0).toUpperCase();

  return `${primeiraInicial}${ultimaInicial}`;
}

export default function Perfil() {
  const { user, logout } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // Calcula iniciais para fallback
  const iniciais = user?.nome ? getIniciaisNome(user.nome) : "U";

  useEffect(() => {
    if (user?.nome) {
      // Usa o nome completo no serviço ui-avatars
      const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.nome
      )}&background=random&size=96`;

      setAvatarUrl(url);
    } else {
      // fallback padrão
      setAvatarUrl("https://ui-avatars.com/api/?name=U&background=cccccc&size=96");
    }
  }, [user?.nome]);

  return (
    <ScreenLayout title="">
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Perfil</Text>
        <View style={styles.profileCard}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              onError={(e) => {
                console.log("Erro ao carregar imagem:", e.nativeEvent.error);
                setAvatarUrl(""); // força cair no fallback
              }}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.placeholderText}>{iniciais}</Text>
            </View>
          )}
          <Text style={styles.name}>{user?.nome || "Usuário"}</Text>
          <Text style={styles.email}>{user?.tipoUsuario || "Tipo não especificado"}</Text>
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
    width: "70%",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: "#cccccc",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
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