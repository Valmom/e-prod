import ScreenLayout from "@/components/ScreenLayout";
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { Dimensions, FlatList, Platform, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";


const alertas = [
  {
    id: "1",
    descricao: "Relatório de medição fora do padrão",
    equipe: "Equipe Alfa",
    data: "16/07/2025",
    status: "Não Respondido",
    icone: "warning",
  },
  {
    id: "2",
    descricao: "Falha no envio de dados",
    equipe: "Equipe Beta",
    data: "15/07/2025",
    status: "Aguardando Resposta",
    icone: "sync-problem",
  },
  {
    id: "3",
    descricao: "Relatório de medição fora do padrão",
    equipe: "Equipe Alfa",
    data: "16/07/2025",
    status: "Recusado",
    icone: "error-outline",
  },
  {
    id: "4",
    descricao: "Dispositivo com falha de comunicação",
    equipe: "Equipe Gama",
    data: "14/07/2025",
    status: "Aguardando Resposta",
    icone: "signal-wifi-off",
  },  
];

const screenWidth = Dimensions.get("window").width;
const getCardTheme = (status: string) => {
  switch (status) {
    case "Recusado":
      return {
        backgroundColor: "#FFF5F5",     // vermelho claro
        borderColor: "#FEE2E2",
        textColor: "#B91C1C",           // vermelho escuro
        buttonColor: "#DC2626",         // botão vermelho
        buttonTextColor: "#fff",
        iconColor: "#EF4444",        
      };
    case "Não Respondido":
      return {
        backgroundColor: "#FFFBEB",     // amarelo claro
        borderColor: "#FEF3C7",
        textColor: "#92400E",           // laranja escuro
        buttonColor: "#F59E0B",         // botão laranja
        buttonTextColor: "#fff",
        iconColor: "#F97316",
      };
    case "Aguardando Resposta":
      return {
        backgroundColor: "#EFF6FF",     // azul claro
        borderColor: "#DBEAFE",
        textColor: "#1E40AF",           // azul escuro
        buttonColor: "#3B82F6",         // botão azul
        buttonTextColor: "#fff",
        iconColor: "#2563EB",
      };
    default:
      return {
        backgroundColor: "#F5F5F5",     // cinza claro
        borderColor: "#E5E5E5",
        textColor: "#404040",
        buttonColor: "#737373",         // botão cinza
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

  const renderItem = ({ item }: any) => {
    const theme = getCardTheme(item.status);
    
    return (
      <View style={[
        styles.card, 
        { 
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
          shadowColor: isDark ? '#000' : theme.textColor,
        }
      ]}>
        <View style={styles.cardHeader}>
          <MaterialIcons 
            name={item.icone} 
            size={24} 
            color={theme.iconColor} 
            style={styles.icon}
          />
          <View style={[styles.badge, { backgroundColor: theme.buttonColor }]}>
            <Text style={styles.badgeText}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.descricao, { color: theme.textColor }]}>
          {item.descricao}
        </Text>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <MaterialIcons name="group" size={16} color={theme.textColor} />
            <Text style={[styles.infoText, { color: theme.textColor }]}>
              {item.equipe}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={16} color={theme.textColor} />
            <Text style={[styles.infoText, { color: theme.textColor }]}>
              {item.data}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.botao, { backgroundColor: theme.buttonColor }]}
          onPress={() => router.push({ pathname: "/dashboard", params: { id: item.id } })}
        >
          <Text style={styles.botaoTexto}>Visualizar</Text>
          <MaterialIcons name="chevron-right" size={20} color={theme.buttonTextColor} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenLayout title="Alertas">
      <FlatList
        data={alertas}
        keyExtractor={(item) => item.id}
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
    paddingBottom: Platform.select({
      android: 48,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  descricao: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 22,
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  botao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  separator: {
    height: 12,
  },
});