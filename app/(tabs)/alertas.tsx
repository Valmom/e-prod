import ScreenLayout from "@/components/ScreenLayout";
import { api } from "@/services/api";
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

interface Alerta {
  id: string;
  status: string;
  classificacao: string;
  prefixo: string;
  dataOcorrencia: string;
  icone?: string;
}

interface HistoricoItem {
  time: string;
  title: string;
  description: string;
  circleColor: string;
}

// Opções para ações corretivas
const acoesCorretivas = [
  "Equipe em treinamento",
  "Problema técnico resolvido",
  "Manutenção preventiva",
  "Falso positivo",
  "Outro"
];

export default function Alertas() {
  const theme = useColorScheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [alertaSelecionado, setAlertaSelecionado] = useState<Alerta | null>(null);
  
  // Estado para o formulário de justificativa
  const [formData, setFormData] = useState({
    acaoCorretiva: "",
    justificativa: "",
    anexoEvidencia: false
  });
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  // Estados para o modal de anexos
  const [modalAnexoVisible, setModalAnexoVisible] = useState(false);
  const [anexos, setAnexos] = useState<{uri: string, type: string, name: string}[]>([]);
  const [erroAnexo, setErroAnexo] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const response = await api.get('/alertas/table-alerta');
        setAlertas(response.data);
      } catch (error) {
        console.error("Erro ao buscar alertas:", error);
        Alert.alert("Erro", "Não foi possível carregar os alertas");
      }
    };
    
    fetchAlertas();
  }, []);
  
  useEffect(() => {
    // Solicitar permissão da câmera
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  const carregarHistorico = async (alertaId: string, alerta: Alerta) => {
    setLoadingHistorico(true);
    setAlertaSelecionado(alerta);
    setFormData({
      acaoCorretiva: "",
      justificativa: "",
      anexoEvidencia: false
    });
    setMostrarFormulario(false);
    setAnexos([]);
    setErroAnexo(false);
    
    try {
      const response = await api.get('/alertas/historico-alerta?AlertaId=' + alertaId);
      const json = response.data;
      const list = json.map((item: any) => ({
        time: item.dataOcorrencia || '',
        title: item.status || '',
        description: item.descricaoAlerta || '',
        circleColor: ReturnColor(item.status || '')
      }));
      
      setHistorico(list);
      setModalVisible(true);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      Alert.alert("Erro", "Não foi possível carregar o histórico");
    } finally {
      setLoadingHistorico(false);
    }
  };
  
  const fecharModal = () => {
    setModalVisible(false);
    setHistorico([]);
    setAlertaSelecionado(null);
    setMostrarFormulario(false);
    setAnexos([]);
    setErroAnexo(false);
  };

  // FUNÇÃO PARA TIRAR FOTO
  const tirarFoto = async () => {
    try {
      if (cameraPermission === false) {
        Alert.alert(
          "Permissão necessária",
          "É necessário permitir o acesso à câmera para tirar fotos",
          [
            {
              text: "Cancelar",
              style: "cancel"
            },
            {
              text: "Configurações",
              onPress: () => Linking.openSettings()
            }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const photo = result.assets[0];
        
        const novoAnexo = {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `evidencia_${Date.now()}.jpg`
        };
        
        setAnexos([novoAnexo]);
        setErroAnexo(false);
        setModalAnexoVisible(false);
      }
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      Alert.alert("Erro", "Não foi possível abrir a câmera");
    }
  };

  // FUNÇÃO AUXILIAR PARA PEGAR TOKEN
  const getToken = async (): Promise<string> => {
    try {
      const stored = await SecureStore.getItemAsync("mipi-user-data");
      if (stored) {
        const userData = JSON.parse(stored);
        return userData?.accessToken || '';
      }
      return '';
    } catch (error) {
      console.error("Erro ao pegar token:", error);
      return '';
    }
  };

  // FUNÇÃO CORRIGIDA PARA ENVIAR JUSTIFICATIVA
  const handleEnviarJustificativa = async () => {
    if (!formData.acaoCorretiva || !formData.justificativa) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios");
      return;
    }

    if (anexos.length === 0) {
      setErroAnexo(true);
      return;
    }

    try {
      // Criar FormData
      const formDataToSend = new FormData();
      
      // Dados básicos
      formDataToSend.append('alertaId', alertaSelecionado?.id || '');
      formDataToSend.append('acaoCorretiva', formData.acaoCorretiva);
      formDataToSend.append('justificativa', formData.justificativa);

      // Adicionar a foto
      anexos.forEach((anexo) => {
        formDataToSend.append('files', {
          uri: anexo.uri,
          name: anexo.name,
          type: anexo.type
        } as any);
      });

      const token = await getToken();
      
      // Enviar para API usando fetch
      const response = await fetch('https://mipi.equatorialenergia.com.br/mipiapi/api/v1/alertas/justificativa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert("Sucesso", "Justificativa enviada com sucesso!");
        
        // Resetar estados
        setMostrarFormulario(false);
        setFormData({
          acaoCorretiva: "",
          justificativa: "",
          anexoEvidencia: false
        });
        setAnexos([]);
        setErroAnexo(false);

        // Recarregar histórico
        if (alertaSelecionado) {
          carregarHistorico(alertaSelecionado.id, alertaSelecionado);
        }
      } else {
        const errorData = await response.text();
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }
    } catch (error: any) {
      console.error("Erro ao enviar justificativa:", error);
      Alert.alert("Erro", error.message || "Não foi possível enviar a justificativa");
    }
  };
  
  const toggleAnexoEvidencia = () => {
    setFormData({
      ...formData,
      anexoEvidencia: !formData.anexoEvidencia
    });
  };
  
  // Funções para o modal de anexos
  const abrirModalAnexo = () => {
    setModalAnexoVisible(true);
  };
  
  const fecharModalAnexo = () => {
    setModalAnexoVisible(false);
  };
  
  const removerAnexo = () => {
    setAnexos([]);
    setErroAnexo(false);
  };
  
  const renderItem = ({ item }: { item: Alerta }) => {
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
            name={item.icone as any || "warning"} 
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
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      
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
            
            {!mostrarFormulario && (
              <TouchableOpacity 
                style={[styles.botaoJustificativa, isDark && styles.botaoJustificativaDark]}
                onPress={() => setMostrarFormulario(true)}
              >
                <Text style={styles.botaoJustificativaTexto}>Adicionar Justificativa</Text>
                <MaterialIcons name="add-comment" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
            
            {mostrarFormulario && (
              <View style={[styles.formContainer, isDark && styles.formContainerDark]}>
                <Text style={[styles.formTitle, isDark && styles.formTitleDark]}>
                  Preencha os dados abaixo referentes à Anomalia selecionada
                </Text>
                
                <View style={styles.formSection}>
                  <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                    Classificação
                  </Text>
                  <Text style={[styles.classificacao, isDark && styles.classificacaoDark]}>
                    {alertaSelecionado?.classificacao || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.formSection}>
                  <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                    Ação Corretiva
                  </Text>
                  <View style={styles.selectContainer}>
                    <TextInput
                      style={[styles.selectInput, isDark && styles.selectInputDark]}
                      value={formData.acaoCorretiva}
                      onChangeText={(text) => setFormData({...formData, acaoCorretiva: text})}
                      placeholder="Selecione uma ação corretiva"
                      placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.acoesContainer}>
                    {acoesCorretivas.map((acao, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.acaoPill,
                          formData.acaoCorretiva === acao && styles.acaoPillSelected
                        ]}
                        onPress={() => setFormData({...formData, acaoCorretiva: acao})}
                      >
                        <Text style={[
                          styles.acaoPillText,
                          formData.acaoCorretiva === acao && styles.acaoPillTextSelected
                        ]}>
                          {acao}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                <View style={styles.formSection}>
                  <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                    Justificativa
                  </Text>
                  <TextInput
                    style={[styles.textArea, isDark && styles.textAreaDark]}
                    value={formData.justificativa}
                    onChangeText={(text) => setFormData({...formData, justificativa: text})}
                    placeholder="Descreva a justificativa para esta anomalia"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                    multiline
                    numberOfLines={4}
                  />
                </View>
                
                <View style={styles.formSection}>
                  <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                    Evidência Fotográfica
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.anexoButton, isDark && styles.anexoButtonDark]}
                    onPress={abrirModalAnexo}
                  >
                    <MaterialIcons name="camera-alt" size={20} color={isDark ? "#FFF" : "#3B82F6"} />
                    <Text style={[styles.anexoButtonText, isDark && styles.anexoButtonTextDark]}>
                      {anexos.length > 0 ? 'Alterar foto' : 'Tirar foto'}
                    </Text>
                  </TouchableOpacity>
                  
                  {anexos.length > 0 && (
                    <View style={styles.anexosContainer}>
                      <View style={styles.anexoItem}>
                        <Image 
                          source={{ uri: anexos[0].uri }} 
                          style={styles.fotoPreview} 
                        />
                        <TouchableOpacity 
                          style={styles.removerFotoButton}
                          onPress={removerAnexo}
                        >
                          <MaterialIcons name="close" size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.fotoInfo}>Foto anexada ✓</Text>
                    </View>
                  )}
                  
                  {erroAnexo && (
                    <View style={styles.erroContainer}>
                      <MaterialIcons name="error" size={16} color="#EF4444" />
                      <Text style={styles.erroTexto}>
                        É necessário anexar uma foto como evidência
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.formButtons}>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => setMostrarFormulario(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.submitButton]}
                    onPress={handleEnviarJustificativa}
                  >
                    <Text style={styles.submitButtonText}>Enviar Justificativa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
      
      {/* Modal para tirar foto */}
      <Modal
        visible={modalAnexoVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={fecharModalAnexo}
      >
        <View style={styles.modalAnexoOverlay}>
          <View style={[styles.modalAnexoContent, isDark && styles.modalAnexoContentDark]}>
            <Text style={[styles.modalAnexoTitle, isDark && styles.modalAnexoTitleDark]}>
              Adicionar evidência
            </Text>
            
            <TouchableOpacity 
              style={[styles.modalAnexoOption, isDark && styles.modalAnexoOptionDark]}
              onPress={tirarFoto}
            >
              <MaterialIcons name="camera-alt" size={24} color={isDark ? "#FFF" : "#3B82F6"} />
              <Text style={[styles.modalAnexoOptionText, isDark && styles.modalAnexoOptionTextDark]}>
                📸 Tirar foto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalAnexoOption, styles.modalAnexoCancel, isDark && styles.modalAnexoCancelDark]}
              onPress={fecharModalAnexo}
            >
              <Text style={styles.modalAnexoCancelText}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

// ESTILOS
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
    shadowOffset: { width: 0, height: 2 },
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
  modalFullScreenContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalFullScreenContainerDark: {
    backgroundColor: '#1F2937',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginLeft: 44,
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
  botaoJustificativa: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  botaoJustificativaDark: {
    backgroundColor: '#2563EB',
  },
  botaoJustificativaTexto: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 8,
  },
  formContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  formContainerDark: {
    backgroundColor: '#374151',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  formTitleDark: {
    color: '#F9FAFB',
  },
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sectionTitleDark: {
    color: '#D1D5DB',
  },
  classificacao: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    backgroundColor: '#E5E7EB',
    padding: 12,
    borderRadius: 8,
  },
  classificacaoDark: {
    color: '#F3F4F6',
    backgroundColor: '#4B5563',
  },
  selectContainer: {
    position: 'relative',
  },
  selectInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFF',
  },
  selectInputDark: {
    borderColor: '#4B5563',
    color: '#F3F4F6',
    backgroundColor: '#4B5563',
  },
  acoesContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  acaoPill: {
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  acaoPillSelected: {
    backgroundColor: '#3B82F6',
  },
  acaoPillText: {
    color: '#4B5563',
    fontSize: 12,
  },
  acaoPillTextSelected: {
    color: '#FFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textAreaDark: {
    borderColor: '#4B5563',
    color: '#F3F4F6',
    backgroundColor: '#4B5563',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  formButton: {
    borderRadius: 8,
    padding: 12,
    minWidth: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  anexoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  anexoButtonDark: {
    borderColor: '#2563EB',
  },
  anexoButtonText: {
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 8,
  },
  anexoButtonTextDark: {
    color: '#2563EB',
  },
  anexosContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  anexoItem: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  fotoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removerFotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoInfo: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 5,
    fontWeight: '500',
  },
  erroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 6,
  },
  erroTexto: {
    color: '#B91C1C',
    fontSize: 12,
    marginLeft: 6,
  },
  modalAnexoOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalAnexoContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: width * 0.8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalAnexoContentDark: {
    backgroundColor: '#374151',
  },
  modalAnexoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalAnexoTitleDark: {
    color: '#F9FAFB',
  },
  modalAnexoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  modalAnexoOptionDark: {
    backgroundColor: '#4B5563',
  },
  modalAnexoOptionText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 16,
  },
  modalAnexoOptionTextDark: {
    color: '#F9FAFB',
  },
  modalAnexoCancel: {
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  modalAnexoCancelDark: {
    backgroundColor: '#4B5563',
  },
  modalAnexoCancelText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
});