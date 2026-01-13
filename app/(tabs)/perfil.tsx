import ScreenLayout from "@/components/ScreenLayout";
import { useAuth } from "@/hooks/useAuth";
import { eprodapi } from "@/services/api";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { showMessage } from "react-native-flash-message";
import { useDispatch } from 'react-redux';
import { logout } from '../../store/auth/authSlice';

// Tipos para os dados
type Prefixo = {
  prefixo: string;
  regional: string;
};

type Fiscal = {
  matricula: string;
  nome: string;
  estado: string;
  regional: string;
};

type InspectorTeams = {
  inspector: string;
  teams: string[];
};

type LeaderInspectors = {
  leader: string;
  inspectors: string[];
};

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
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPrefixos, setSelectedPrefixos] = useState<string[]>([]);
  const [selectedFiscais, setSelectedFiscais] = useState<string[]>([]);
  const [prefixos, setPrefixos] = useState<Prefixo[]>([]);
  const [fiscais, setFiscais] = useState<Fiscal[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();

  const iniciais = user?.nome ? getIniciaisNome(user.nome) : "U";

  // Verificar se o usuário é líder ou fiscal
  const isLider = user?.tipoUsuario?.toUpperCase().includes('LÍDER') || user?.tipoUsuario?.toUpperCase().includes('LIDER');
  const isFiscal = user?.tipoUsuario?.toUpperCase().includes('FISCAL');

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("eprod-token");
      dispatch(logout());
    } catch (error) {
      dispatch(logout());
    }
  };

  // Carrega os dados baseado no tipo de usuário
  const loadUserData = async () => {        
    const tokenEprod = await SecureStore.getItemAsync("eprod-token");
    if (!user || !user.estado || !user.regional) {
      showMessage({ 
        message: "Erro", 
        description: "Dados do usuário incompletos", 
        type: "danger" 
      });

      return;
    }
    
    try {
      setLoading(true);
      
      if (isLider) {
        // Carregar fiscais para líder
        const response = await eprodapi.get(`/v1/inspector/list-inspectors/${user.estado}/${user.regional}`, {
          headers: {
            Authorization: `Bearer ${tokenEprod}`
          }
        });
        
        if (response.status !== 200) {
          throw new Error('Erro ao carregar fiscais');
        }

        setFiscais(response.data);
        
      } else if (isFiscal) {
        const response = await eprodapi.get(`/v1/inspector/list-teams/${user.estado}/${user.regional}`, {
          headers: {
            Authorization: `Bearer ${tokenEprod}`
          }
        });

        if (response.status !== 200) {
          throw new Error('Erro ao carregar equipes');
        }

        setPrefixos(response.data);
      }
    } catch (error) {
      const errorMessage = isLider ? 'fiscais' : 'equipes';
      showMessage({ 
        message: "Erro", 
        description: `Não foi possível carregar ${errorMessage}`, 
        type: "danger" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Salva as associações
  const saveAssociations = async () => {
    const tokenEprod = await SecureStore.getItemAsync("eprod-token");
    if (isLider) {
      // Validação para líder
      if (selectedFiscais.length === 0) {
        showMessage({ 
          message: "Erro", 
          description: "Selecione pelo menos um fiscal", 
          type: "danger" 
        });        

        return;
      }
    } else if (isFiscal) {
      // Validação para fiscal
      if (selectedPrefixos.length === 0) {
        showMessage({ 
          message: "Erro", 
          description: "Selecione pelo menos uma equipe", 
          type: "danger" 
        });

        return;
      }
    }

    setSubmitting(true);
    try {
      if (isLider) {
        // LÓGICA PARA LÍDER: Vincular líder aos fiscais
        const leaderInspectors: LeaderInspectors = {
          leader: user?.userName || '',
          inspectors: selectedFiscais
        };

        const response = await eprodapi.post('/v1/inspector/link-inspectors', leaderInspectors, {
          headers: {
            Authorization: `Bearer ${tokenEprod}`
          }
        });

        if (response.status === 200) {
          showMessage({ 
            message: "Sucesso", 
            description: `${selectedFiscais.length} fiscal(is) vinculado(s) ao líder com sucesso!`, 
            type: "success" 
          });
        } else {
          throw new Error('Erro na vinculação');
        }

      } else if (isFiscal) {
        // LÓGICA PARA FISCAL: Vincular o próprio fiscal às equipes
        const inspectorTeams: InspectorTeams = {
          inspector: user?.userName || '',
          teams: selectedPrefixos
        };

        const response = await eprodapi.post('/v1/inspector/link-teams', inspectorTeams, {
          headers: {
            Authorization: `Bearer ${tokenEprod}`
          }
        });

        if (response.status === 200) {
          showMessage({ 
            message: "Sucesso", 
            description: `${selectedPrefixos.length} equipe(s) vinculada(s) ao fiscal com sucesso!`, 
            type: "success" 
          });
        } else {
          const errorData = response.data;
          throw new Error(errorData.message || 'Erro na vinculação');
        }
      }

      closeModal();
      
    } catch (error: any) {
      showMessage({ 
        message: "Erro", 
        description: `Erro ao realizar vinculação: ${error.message}`, 
        type: "danger" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const togglePrefixoSelection = (prefixo: string) => {
    setSelectedPrefixos(prev => 
      prev.includes(prefixo) 
        ? prev.filter(p => p !== prefixo)
        : [...prev, prefixo]
    );
  };

  const toggleFiscalSelection = (fiscalMatricula: string) => {
    setSelectedFiscais(prev => 
      prev.includes(fiscalMatricula) 
        ? prev.filter(f => f !== fiscalMatricula)
        : [...prev, fiscalMatricula]
    );
  };

  const openModal = () => {
    loadUserData();
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPrefixos([]);
    setSelectedFiscais([]);
    setPrefixos([]);
    setFiscais([]);
  };

  useEffect(() => {
    if (user?.nome) {
      const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.nome
      )}&background=random&size=96`;
      setAvatarUrl(url);
    } else {
      setAvatarUrl("https://ui-avatars.com/api/?name=U&background=cccccc&size=96");
    }
  }, [user?.nome]);

  const isSubmitDisabled = isLider 
    ? selectedFiscais.length === 0
    : selectedPrefixos.length === 0;

  return (
    <ScreenLayout title="Perfil">
      <View style={styles.container}>
        <View style={styles.profileCard}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              onError={(e) => {
                console.log("Erro ao carregar imagem:", e.nativeEvent.error);
                setAvatarUrl("");
              }}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.placeholderText}>{iniciais}</Text>
            </View>
          )}
          <Text style={styles.name}>{user?.nome || "Usuário"}</Text>
          <Text style={styles.email}>{user?.userName || "Matrícula não informada"}</Text>
          <Text style={styles.role}>{user?.tipoUsuario || "Tipo não especificado"}</Text>
          <Text style={styles.regional}>{user?.regional || "Regional não informada"}</Text>
          
          {/* Botão para gerenciar associações */}
          {(isLider || isFiscal) && (
            <TouchableOpacity style={styles.manageButton} onPress={openModal}>
              <Text style={styles.manageButtonText}>
                {isLider ? 'Vincular Fiscais' : 'Vincular Equipes'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de gerenciamento */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isLider ? "Vincular Fiscais ao Líder" : "Vincular Equipes ao Fiscal"}
            </Text>

            {/* Informações do usuário logado */}
            <View style={styles.userInfo}>
              <Text style={styles.userInfoText}>
                {user?.nome}
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>
                  Carregando {isLider ? 'fiscais' : 'equipes'}...
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.scrollView}>
                {/* Lista de Fiscais (apenas para líder) */}
                {isLider && fiscais.map(fiscal => (
                  <TouchableOpacity
                    key={fiscal.matricula}
                    style={[
                      styles.optionItem,
                      selectedFiscais.includes(fiscal.matricula) && styles.optionItemSelected
                    ]}
                    onPress={() => toggleFiscalSelection(fiscal.matricula)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedFiscais.includes(fiscal.matricula) && styles.optionTextSelected
                    ]}>
                      {fiscal.nome}
                    </Text>
                    <View style={[
                      styles.checkbox,
                      selectedFiscais.includes(fiscal.matricula) && styles.checkboxSelected
                    ]}>
                      {selectedFiscais.includes(fiscal.matricula) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Lista de Equipes (apenas para fiscal) */}
                {isFiscal && prefixos.map(prefixo => (
                  <TouchableOpacity
                    key={prefixo.prefixo}
                    style={[
                      styles.optionItem,
                      selectedPrefixos.includes(prefixo.prefixo) && styles.optionItemSelected
                    ]}
                    onPress={() => togglePrefixoSelection(prefixo.prefixo)}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedPrefixos.includes(prefixo.prefixo) && styles.optionTextSelected
                    ]}>
                      {prefixo.prefixo}
                    </Text>
                    <View style={[
                      styles.checkbox,
                      selectedPrefixos.includes(prefixo.prefixo) && styles.checkboxSelected
                    ]}>
                      {selectedPrefixos.includes(prefixo.prefixo) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={closeModal}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.saveButton,
                  isSubmitDisabled && styles.saveButtonDisabled
                ]} 
                onPress={saveAssociations}
                disabled={submitting || isSubmitDisabled}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Vincular</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
    width: '100%'
  },
  profileCard: {
    backgroundColor: "#fff",
    padding: 64,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
    width: "70%",
    alignSelf: "center"  
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
  role: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },
  regional: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },
  manageButton: {
    marginTop: 16,
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  manageButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
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
  // ESTILOS DO MODAL AJUSTADOS
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)', // Fundo totalmente transparente
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    // Sombra para iOS
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    // Sombra para Android
    elevation: 8,
    // Borda
    borderWidth: 1,
    borderColor: '#e0e0e0',
    // Linha decorativa no topo (opcional)
    borderTopWidth: 4,
    borderTopColor: '#2196F3',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center'
  },
  userInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  userInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#2196F3',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});