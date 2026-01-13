import ScreenLayout from "@/components/ScreenLayout";
import { useAuth } from "@/hooks/useAuth";
import { eprodapi } from "@/services/api";
import { setAlerta } from "@/store/alertaSlice";
import { getAccessToken, isTokenExpired } from "@/utils/auth";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";
import { useDispatch } from "react-redux";
import { alertStyles } from "../../styles/alert/style";

export interface Alerta {
  id: string;
  status: string;
  classificacao: string;
  prefixo: string;
  prefixoId: string;
  descricao: string;
  acaoCorretivaId: string;
  dataOcorrencia: string;
  icone?: string;
  classificacaoId?: string;
  justificativa?: string;
  acaoCorretiva?: string;
}

// ---- helpers para tema do card ----
const getCardTheme = (status: string) => {
  switch (status) {
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
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const dispatch = useDispatch();


  // ---- busca os alertas na API ----
  const fetchAlertas = async () => {
    try {
      const tokenEprod = await SecureStore.getItemAsync("eprod-token");

      const headers = {
        Authorization: `Bearer ${tokenEprod}`,
        "Content-Type": "application/json",
      };

      setLoading(true);
      const response = await eprodapi.get(`/v1/mobile/alerts?user=${user?.userName}`, { headers });
      console.log(response.data);
      setAlertas(response.data);
    } catch (error) {
      showMessage({
        message: "Erro",
        description: "Não foi possível carregar os alertas",
        type: "danger",
        duration: 3000,
        floating: true,
        position: "top",
      });
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  };

  // ---- refresh da lista ----
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlertas();
    setRefreshing(false);
  };

  // ---- efeito inicial ----
  useEffect(() => {
    async function init() {
      const token = await getAccessToken();
      if (!token || isTokenExpired(token)) {
        router.replace("/login");
        return;
      }
      await fetchAlertas();
    }
    init();
  }, []);

  // ---- render de cada item ----
  const renderItem = ({ item }: { item: Alerta }) => {
    const themeStyle = getCardTheme(item.status);

    return (
      <View
        style={[
          alertStyles.card,
          {
            backgroundColor: themeStyle.backgroundColor,
            borderColor: themeStyle.borderColor,
          },
        ]}
      >
        <View style={alertStyles.cardHeader}>
          <MaterialCommunityIcons
            name={(item.icone as any) || "bell"}
            size={24}
            color={themeStyle.iconColor}
            style={alertStyles.icon}
          />
          <View
            style={[
              alertStyles.badge,
              { backgroundColor: themeStyle.buttonColor },
            ]}
          >
            <Text style={alertStyles.badgeText}>{item.status}</Text>
          </View>
        </View>

        <Text style={[alertStyles.descricao, { color: themeStyle.textColor }]}>
          {item.classificacao}
        </Text>

        <View style={alertStyles.infoContainer}>
          <View style={alertStyles.infoRow}>
            <MaterialIcons name="tag" size={16} color={themeStyle.textColor} />
            <Text style={[alertStyles.infoText, { color: themeStyle.textColor }]}>
              {item.prefixo}
            </Text>
          </View>
          <View style={alertStyles.infoRow}>
            <MaterialIcons
              name="calendar-today"
              size={16}
              color={themeStyle.textColor}
            />
            <Text style={[alertStyles.infoText, { color: themeStyle.textColor }]}>
              {item.dataOcorrencia}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            alertStyles.botao,
            { backgroundColor: themeStyle.buttonColor },
          ]}
          onPress={() => {
            dispatch(setAlerta(item)); // guarda alerta selecionado no Redux
            router.push("/justificativa"); // navega para a tela de destino
          }}
        >
          <Text style={alertStyles.botaoTexto}>Visualizar</Text>
          <MaterialIcons
            name="history"
            size={20}
            color={themeStyle.buttonTextColor}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenLayout title="Alertas">
      {loading ? (
        <View style={alertStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={alertStyles.loadingText}>Carregando alertas...</Text>
        </View>
      ) : (
        <FlatList
          style={alertStyles.flatList}
          data={alertas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={alertStyles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={alertStyles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3B82F6"]}
              tintColor={"#3B82F6"}
            />
          }
          ListEmptyComponent={
            <View style={alertStyles.emptyContainer}>
              <MaterialIcons
                name="warning"
                size={48}
                color={isDark ? "#666" : "#CCC"}
              />
              <Text
                style={[
                  alertStyles.emptyText,
                  isDark && alertStyles.emptyTextDark,
                ]}
              >
                Nenhum alerta encontrado
              </Text>
              <Text
                style={[
                  alertStyles.emptySubText,
                  isDark && alertStyles.emptySubTextDark,
                ]}
              >
                Puxe para atualizar a lista
              </Text>
            </View>
          }
        />
      )}
    </ScreenLayout>
  );
}