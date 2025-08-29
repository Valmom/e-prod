import ScreenLayout from "@/components/ScreenLayout";
import { api } from "@/services/api";
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";

const { width, height } = Dimensions.get('window');

// FUNÇÕES DEFINIDAS ANTES DO COMPONENTE
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

const ReturnColor = (description: string): string => {
  switch (description) {
    case 'Aprovado': return '#00b48b';
    case 'Aguardando Resposta': return '#f04324';
    case 'Aguardando Aprovação': return '#0e459c';
    case 'Não Respondido': return '#d63333';
    case 'Recusado': return '#f04324';
    case 'Não Avaliado': return 'orange';
    default: return '#038a25';
  }
};

type HistoricoItem = {
  time: string;
  title: string;
  description: string;
  circleColor: string;
};

export default function Alertas() {
  const theme = useColorScheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [alertas, setAlertas] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [alertaSelecionado, setAlertaSelecionado] = useState<any>(null);
  
  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const response = await api.get('/alertas/table-alerta');
        setAlertas(response.data);
      } catch (error) {
        console.error("Erro ao buscar alertas:", error);
      }
    };
    
    fetchAlertas();
  }, []);

  const carregarHistorico = async (alertaId: string, alerta: any) => {
    setLoadingHistorico(true);
    setAlertaSelecionado(alerta);
    
    try {
      let list: HistoricoItem[] = [];
      const response = await api.get('/alertas/historico-alerta?AlertaId=' + alertaId);
      const json = response.data;

      for (let i = 0; i < json.length; ++i) {
        const status = json[i].status || '';
        const obj: HistoricoItem = {
          time: json[i].dataOcorrencia || '',
          title: json[i].status || '',
          description: json[i].descricaoAlerta || '',
          circleColor: ReturnColor(status)
        };
        list.push(obj);
      }
      
      setHistorico(list);
      setModalVisible(true);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const fecharModal = () => {
    setModalVisible(false);
    setHistorico([]);
    setAlertaSelecionado(null);
  };

  const renderItem = ({ item }: any) => {
    const themeStyle = getCardTheme(item.status);
    
    return (
      <View style={[
        styles.card, 
        { 
          backgroundColor: themeStyle.backgroundColor,
          borderColor: themeStyle.borderColor,
        }
      ]}>
        <View style={styles.cardHeader}>
          <MaterialIcons 
            name={item.icone || "warning"} 
            size={24} 
            color={themeStyle.iconColor} 
            style={styles.icon}
          />
          <View style={[styles.badge, { backgroundColor: themeStyle.buttonColor }]}>
            <Text style={styles.badgeText}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.descricao, { color: themeStyle.textColor }]}>
          {item.classificacao}
        </Text>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <MaterialIcons name="tag" size={16} color={themeStyle.textColor} />
            <Text style={[styles.infoText, { color: themeStyle.textColor }]}>
              {item.prefixo}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={16} color={themeStyle.textColor} />
            <Text style={[styles.infoText, { color: themeStyle.textColor }]}>
              {item.dataOcorrencia}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.botao, { backgroundColor: themeStyle.buttonColor }]}
          onPress={() => carregarHistorico(item.id, item)}
        >
          <Text style={styles.botaoTexto}>Visualizar</Text>
          <MaterialIcons name="history" size={20} color={themeStyle.buttonTextColor} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderHistoricoItem = (item: HistoricoItem, index: number) => (
    <View key={index} style={styles.historicoItem}>
      <View style={styles.historicoTimeline}>
        <View style={[styles.historicoCircle, { backgroundColor: item.circleColor }]} />
        {index < historico.length - 1 && <View style={styles.historicoLine} />}
      </View>
      
      <View style={[
        styles.historicoContent,
        isDark && styles.historicoContentDark
      ]}>
        <Text style={[
          styles.historicoTime,
          isDark && styles.historicoTimeDark
        ]}>
          {item.time}
        </Text>
        
        <Text style={[
          styles.historicoTitle,
          isDark && styles.historicoTitleDark
        ]}>
          {item.title}
        </Text>
        
        {item.description && (
          <Text style={[
            styles.historicoDescription,
            isDark && styles.historicoDescriptionDark
          ]}>
            {item.description}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <ScreenLayout title="Alertas">
      <FlatList
        data={alertas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Modal de Histórico - COBRINDO TODA A TELA INCLUINDO TABBAR */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={fecharModal}
        statusBarTranslucent={true}
      >
        <View style={[
          styles.modalFullScreenContainer,
          isDark && styles.modalFullScreenContainerDark
        ]}>
          
          {/* Cabeçalho do Modal com título centralizado e botão alinhado */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={[
                styles.modalTitle,
                isDark && styles.modalTitleDark
              ]}>
                Histórico do Alerta
              </Text>
            </View>
            <TouchableOpacity 
              onPress={fecharModal} 
              style={styles.closeButton}
            >
              <MaterialIcons 
                name="close" 
                size={32}
                color={isDark ? "#FFF" : "#666"} 
              />
            </TouchableOpacity>
          </View>

          {/* Informações do Alerta */}
          {alertaSelecionado && (
            <View style={[
              styles.alertaInfo,
              isDark && styles.alertaInfoDark
            ]}>
              <Text style={[
                styles.alertaTitulo,
                isDark && styles.alertaTituloDark
              ]}>
                {alertaSelecionado.classificacao}
              </Text>
              <View style={styles.alertaDetalhes}>
                <Text style={[
                  styles.alertaTexto,
                  isDark && styles.alertaTextoDark
                ]}>
                  <Text style={[
                    styles.alertaLabel,
                    isDark && styles.alertaLabelDark
                  ]}>
                    Prefixo:{' '}
                  </Text>
                  {alertaSelecionado.prefixo}
                </Text>
                <Text style={[
                  styles.alertaTexto,
                  isDark && styles.alertaTextoDark
                ]}>
                  <Text style={[
                    styles.alertaLabel,
                    isDark && styles.alertaLabelDark
                  ]}>
                    Data:{' '}
                  </Text>
                  {alertaSelecionado.dataOcorrencia}
                </Text>
                <Text style={[
                  styles.alertaTexto,
                  isDark && styles.alertaTextoDark
                ]}>
                  <Text style={[
                    styles.alertaLabel,
                    isDark && styles.alertaLabelDark
                  ]}>
                    Status:{' '}
                  </Text>
                  {alertaSelecionado.status}
                </Text>
              </View>
            </View>
          )}

          {/* Lista de Histórico */}
          <ScrollView 
            style={styles.historicoScrollView}
            contentContainerStyle={styles.historicoContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {loadingHistorico ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={[
                  styles.loadingText,
                  isDark && styles.loadingTextDark
                ]}>
                  Carregando histórico...
                </Text>
              </View>
            ) : historico.length > 0 ? (
              historico.map((item, index) => renderHistoricoItem(item, index))
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons 
                  name="history" 
                  size={48} 
                  color={isDark ? "#666" : "#CCC"} 
                />
                <Text style={[
                  styles.emptyText,
                  isDark && styles.emptyTextDark
                ]}>
                  Nenhum histórico encontrado
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 20,
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

  // ESTILOS DO MODAL - TELA CHEIA COBRINDO TABBAR
  modalFullScreenContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalFullScreenContainerDark: {
    backgroundColor: '#1F2937',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribui espaço igualmente
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 44, // Compensa a largura do botão para centralizar
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  modalTitleDark: {
    color: '#FFF',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertaInfo: {
    backgroundColor: '#F8F9FA',
    margin: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 16,
  },
  alertaInfoDark: {
    backgroundColor: '#374151',
  },
  alertaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  alertaTituloDark: {
    color: '#FFF',
  },
  alertaDetalhes: {
    gap: 6,
  },
  alertaTexto: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  alertaTextoDark: {
    color: '#D1D5DB',
  },
  alertaLabel: {
    fontWeight: '500',
    color: '#374151',
  },
  alertaLabelDark: {
    color: '#FFF',
  },
  historicoScrollView: {
    flex: 1,
  },
  historicoContentContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  historicoItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  historicoTimeline: {
    alignItems: 'center',
    marginRight: 15,
  },
  historicoCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  historicoLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginTop: 5,
  },
  historicoContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  historicoContentDark: {
    backgroundColor: '#374151',
  },
  historicoTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  historicoTimeDark: {
    color: '#9CA3AF',
  },
  historicoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  historicoTitleDark: {
    color: '#FFF',
  },
  historicoDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  historicoDescriptionDark: {
    color: '#D1D5DB',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  loadingTextDark: {
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 14,
  },
  emptyTextDark: {
    color: '#6B7280',
  },
});