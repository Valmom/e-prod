import ScreenLayout from "@/components/ScreenLayout";
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, FlatList, Platform, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { api } from "../../services/api";

type AlertaAPI = {
  id?: string | null;
  tipoAlerta?: string | null;
  prefixoId?: string | null;
  prefixo?: string | null;
  dataOcorrencia: string;
  status: string;
  statusCor?: string | null;
  classificacaoId?: string | null;
  classificacao?: string | null;
};

const screenWidth = Dimensions.get("window").width;

const getCardTheme = (statusCor?: string | null) => {
  switch (statusCor) {
    case "Recusado":
      return {
        backgroundColor: "#FFF5F5",
        borderColor: "#FEE2E2",
        textColor: "#B91C1C",
        buttonColor: "#DC2626",
        buttonTextColor: "#fff",
        iconColor: "#EF4444",
      };
    case "Não Respondido":
      return {
        backgroundColor: "#FFFBEB",
        borderColor: "#FEF3C7",
        textColor: "#92400E",
        buttonColor: "#F59E0B",
        buttonTextColor: "#fff",
        iconColor: "#F97316",
      };
    case "Aguardando Resposta":
      return {
        backgroundColor: "#EFF6FF",
        borderColor: "#DBEAFE",
        textColor: "#1E40AF",
        buttonColor: "#3B82F6",
        buttonTextColor: "#fff",
        iconColor: "#2563EB",
      };
    default:
      return {
        backgroundColor: "#F5F5F5",
        borderColor: "#E5E5E5",
        textColor: "#404040",
        buttonColor: "#737373",
        buttonTextColor: "#fff",
        iconColor: "#525252",
      };
  }
};

export default function Alertas() {
  const theme = useColorScheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();

  const [alert, setAlert] = useState<AlertaAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlertas = async () => {
    setError(null);
    setLoading(true);

    try {
      

      const response = await api.get('/api/v1/alertas/table-alerta');
      if (!response.status.toString().startsWith("2")) {
        const text = await response.statusText;
        console.error("❌ Resposta não OK:", text);
        throw new Error(`Status ${response.status}`);
      }
      setAlert(response.data as AlertaAPI[]);
    } catch (err: any) {
      console.error("❌ Erro ao buscar alertas:", err.message || err);
      setError("Não foi possível carregar os alertas. Verifique URL, headers ou conexão.");
      setAlert([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, []);

  const renderItem = ({ item }: { item: AlertaAPI }) => {
    const themeCard = getCardTheme(item.statusCor ?? "");
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: themeCard.backgroundColor,
            borderColor: themeCard.borderColor,
            shadowColor: isDark ? "#000" : themeCard.textColor,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <MaterialIcons name="warning" size={24} color={themeCard.iconColor} style={styles.icon} />
          <View style={[styles.badge, { backgroundColor: themeCard.buttonColor }]}>
            <Text style={styles.badgeText}>{item.status ?? "Sem status"}</Text>
          </View>
        </View>

        <Text style={[styles.descricao, { color: themeCard.textColor }]}>
          {(item.tipoAlerta ?? "Sem tipo") + " - " + (item.prefixo ?? "Sem prefixo")}
        </Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={16} color={themeCard.textColor} />
            <Text style={[styles.infoText, { color: themeCard.textColor }]}>
              {new Date(item.dataOcorrencia).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="label" size={16} color={themeCard.textColor} />
            <Text style={[styles.infoText, { color: themeCard.textColor }]}>
              {item.classificacao ?? "Sem classificação"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.botao, { backgroundColor: themeCard.buttonColor }]}
          onPress={() => router.push({ pathname: "/dashboard", params: { id: item.id ?? "" } })}
        >
          <Text style={styles.botaoTexto}>Visualizar</Text>
          <MaterialIcons name="chevron-right" size={20} color={themeCard.buttonTextColor} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenLayout title="Alertas">
      {loading && <Text style={{ textAlign: "center", marginVertical: 16 }}>Carregando alertas...</Text>}
      {error && <Text style={{ textAlign: "center", marginVertical: 16, color: "red" }}>{error}</Text>}

      <FlatList
        data={alert}
        keyExtractor={(item) => item.id ?? Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: screenWidth > 768 ? 10 : 16,
    paddingTop: 10,
    width: screenWidth - 40,
    minHeight: "100%",
    paddingBottom: Platform.select({
      android: 80,
      ios: 100,
    }),
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  badge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
  },
  descricao: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    lineHeight: 22,
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  botao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
  },
  botaoTexto: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  separator: {
    height: 12,
  },
});
