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
  
  // Constante para limite de fotos
  const MAX_FOTOS = 5;
  
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
  
  // FUNÇÃO PARA TIRAR FOTO - MODIFICADA PARA PERMITIR MÚLTIPLAS FOTOS
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
      
      // Verificar se já atingimos o limite de fotos
      if (anexos.length >= MAX_FOTOS) {
        Alert.alert("Limite atingido", `Você só pode anexar até ${MAX_FOTOS} fotos`);
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
        
        // Adiciona a nova foto ao array existente
        setAnexos(prevAnexos => [...prevAnexos, novoAnexo]);
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
      
      // Adicionar todas as fotos com nomes de campo diferentes
      anexos.forEach((anexo, index) => {
        formDataToSend.append(`file${index}`, {
          uri: anexo.uri,
          name: anexo.name,
          type: anexo.type
        } as any);
      });
      
      const token = await getToken();
      
      // Verificar se o token foi obtido corretamente
      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }
      
      // Enviar para API usando fetch
      const response = await fetch('https://mipi.equatorialenergia.com.br/mipiapi/api/v1/alertas/justificativa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formDataToSend,
      });
      
      // Verificar o status da resposta
      console.log("Status da resposta:", response.status);
      
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
        // Tentar obter mais informações sobre o erro
        let errorMessage = `Erro ${response.status}`;
        try {
          const errorData = await response.text();
          errorMessage += `: ${errorData}`;
          console.error("Resposta do servidor:", errorData);
        } catch (e) {
          console.error("Não foi possível ler a resposta do erro");
        }
        throw new Error(errorMessage);
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
  
  // MODIFICADA PARA REMOVER APENAS UMA FOTO ESPECÍFICA
  const removerAnexo = (index: number) => {
    setAnexos(prevAnexos => {
      const novosAnexos = [...prevAnexos];
      novosAnexos.splice(index, 1);
      return novosAnexos;
    });
    
    // Se não restar nenhuma foto, setamos o erro
    if (anexos.length <= 1) {
      setErroAnexo(true);
    }
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
      
      <View style={styles.historicoContent}>
        <Text style={styles.historicoTime}>
          {item.time}
        </Text>
        
        <Text style={styles.historicoTitle}>
          {item.title}
        </Text>
        
        {item.description && (
          <Text style={styles.historicoDescription}>
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
        <View style={styles.modalFullScreenContainer}>
          
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>
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
                color="#666" 
              />
            </TouchableOpacity>
          </View>
          
          {alertaSelecionado && (
            <View style={styles.alertaInfo}>
              <Text style={styles.alertaTitulo}>
                {alertaSelecionado.classificacao}
              </Text>
              <View style={styles.alertaDetalhes}>
                <Text style={styles.alertaTexto}>
                  <Text style={styles.alertaLabel}>
                    Prefixo:{' '}
                  </Text>
                  {alertaSelecionado.prefixo}
                </Text>
                <Text style={styles.alertaTexto}>
                  <Text style={styles.alertaLabel}>
                    Data:{' '}
                  </Text>
                  {alertaSelecionado.dataOcorrencia}
                </Text>
                <Text style={styles.alertaTexto}>
                  <Text style={styles.alertaLabel}>
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
                <Text style={styles.loadingText}>
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
                  color="#CCC" 
                />
                <Text style={styles.emptyText}>
                  Nenhum histórico encontrado
                </Text>
              </View>
            )}
            
            {!mostrarFormulario && (
              <TouchableOpacity 
                style={styles.botaoJustificativa}
                onPress={() => setMostrarFormulario(true)}
              >
                <Text style={styles.botaoJustificativaTexto}>Adicionar Justificativa</Text>
                <MaterialIcons name="add-comment" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
            
            {mostrarFormulario && (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>
                  Preencha os dados abaixo referentes à Anomalia selecionada
                </Text>
                
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>
                    Classificação
                  </Text>
                  <Text style={styles.classificacao}>
                    {alertaSelecionado?.classificacao || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>
                    Ação Corretiva
                  </Text>
                  <View style={styles.selectContainer}>
                    <TextInput
                      style={styles.selectInput}
                      value={formData.acaoCorretiva}
                      onChangeText={(text) => setFormData({...formData, acaoCorretiva: text})}
                      placeholder="Selecione uma ação corretiva"
                      placeholderTextColor="#6B7280"
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
                  <Text style={styles.sectionTitle}>
                    Justificativa
                  </Text>
                  <TextInput
                    style={styles.textArea}
                    value={formData.justificativa}
                    onChangeText={(text) => setFormData({...formData, justificativa: text})}
                    placeholder="Descreva a justificativa para esta anomalia"
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={4}
                  />
                </View>
                
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>
                    Evidência Fotográfica
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.anexoButton}
                    onPress={abrirModalAnexo}
                    disabled={anexos.length >= MAX_FOTOS}
                  >
                    <MaterialIcons name="camera-alt" size={20} color="#3B82F6" />
                    <Text style={styles.anexoButtonText}>
                      {anexos.length > 0 ? 'Adicionar mais fotos' : 'Tirar foto'}
                    </Text>
                  </TouchableOpacity>
                  
                  {anexos.length > 0 && (
                    <View style={styles.anexosContainer}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {anexos.map((anexo, index) => (
                          <View key={index} style={styles.anexoItem}>
                            <Image 
                              source={{ uri: anexo.uri }} 
                              style={styles.fotoPreview} 
                            />
                            <TouchableOpacity 
                              style={styles.removerFotoButton}
                              onPress={() => removerAnexo(index)}
                            >
                              <MaterialIcons name="close" size={16} color="#FFF" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                      <View style={styles.fotoInfoContainer}>
                        <Text style={styles.fotoInfo}>{anexos.length} de {MAX_FOTOS} fotos anexadas ✓</Text>
                        {anexos.length < MAX_FOTOS && (
                          <TouchableOpacity 
                            style={styles.adicionarMaisButton}
                            onPress={abrirModalAnexo}
                          >
                            <MaterialIcons name="add-a-photo" size={16} color="#3B82F6" />
                            <Text style={styles.adicionarMaisText}>Adicionar mais</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                  
                  {erroAnexo && (
                    <View style={styles.erroContainer}>
                      <MaterialIcons name="error" size={16} color="#EF4444" />
                      <Text style={styles.erroTexto}>
                        É necessário anexar pelo menos uma foto como evidência
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
          <View style={styles.modalAnexoContent}>
            <Text style={styles.modalAnexoTitle}>
              Adicionar evidência
            </Text>
            
            <TouchableOpacity 
              style={styles.modalAnexoOption}
              onPress={tirarFoto}
            >
              <MaterialIcons name="camera-alt" size={24} color="#3B82F6" />
              <Text style={styles.modalAnexoOptionText}>
                📸 Tirar foto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalAnexoOption, styles.modalAnexoCancel]}
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
  alertaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  alertaDetalhes: {
    gap: 6,
  },
  alertaTexto: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  alertaLabel: {
    fontWeight: '500',
    color: '#374151',
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
  historicoTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  historicoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  historicoDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
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
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
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
  classificacao: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    backgroundColor: '#E5E7EB',
    padding: 12,
    borderRadius: 8,
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
  anexoButtonText: {
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 8,
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
  fotoInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  fotoInfo: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  adicionarMaisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
  },
  adicionarMaisText: {
    color: '#3B82F6',
    fontSize: 12,
    marginLeft: 4,
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
  modalAnexoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
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
  modalAnexoOptionText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 16,
  },
  modalAnexoCancel: {
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  modalAnexoCancelText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
});