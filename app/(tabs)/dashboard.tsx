import { StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../components/ScreenLayout";

export default function Dashboard() {
  return (
    <ScreenLayout title="Dashboard">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bem-vindo de volta!</Text>
        <Text style={styles.cardText}>Resumo das suas atividades aparecerá aqui.</Text>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
    color: "#111",
  },
  cardText: {
    fontSize: 14,
    color: "#666",
  },
});
