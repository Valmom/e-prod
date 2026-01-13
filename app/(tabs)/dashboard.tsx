import { useAuth } from "@/hooks/useAuth";
import { eprodapi } from "@/services/api";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { showMessage } from "react-native-flash-message";
import ScreenLayout from "../../components/ScreenLayout";
import DynamicBucketChart, { DynamicBucketData } from "../../components/charts/DynamicBucketChart";
import TeamsWithoutCommunication, { TeamTimeData } from "../../components/charts/TeamsWithoutCommunication";

interface KPIData {
  atraso: string;
  ociosidade: string;
  ups: number;
}

export default function Dashboard() {
  const [kpisDelayIdlenessUPS, setKpisDelayIdlenessUPS] = useState<KPIData[] | undefined>([]);
  const [dynamicBucket, setDynamicBucket] = useState<DynamicBucketData[]>([]);
  const [teamsWithoutCommunication, setTeamsWithoutCommunication] = useState<TeamTimeData[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { user } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    // Se for fiscal, não precisa dos filtros de estado/regional/base
    if (user?.tipoUsuario === 'Fiscal EQT' && !user?.userName) return;

    // Se não for fiscal, precisa dos filtros normais
    if (user?.tipoUsuario !== 'Fiscal EQT' && (!user?.estado && !user?.regional && !user?.base)) return;

    try {
      setHasError(false);
      const tokenEprod = await SecureStore.getItemAsync("eprod-token");

      // Configuração base dos headers
      const headers = {
        Authorization: `Bearer ${tokenEprod}`,
        "Content-Type": "application/json",
      };

      const filter = {
        startDate: null,
        endDate: null,
        filters: [
          {
            state: user?.estado,
            regional: user?.regional,
            base: user?.base,
            process: null,
            team: user?.prefixo,
            inspector: null,
            shift: null,
            supplier: null,
          },
        ],
      };

      // Se for fiscal, faz requisição com parâmetro de usuário
      if (user?.tipoUsuario === 'Fiscal EQT') {
        const [
          kpiResponse,
          dynamicBucketResponse, 
          teamsWithoutCommunicationResponse
        ] = await Promise.all([
          eprodapi.get(`/v1/mobile/kpis-delay-idleness-ups?user=${user.userName}`, { headers }),
          eprodapi.get(`/v1/mobile/dynamic-bucket?user=${user.userName}`, { headers }),
          eprodapi.get(`/v1/mobile/time-without-communication?user=${user.userName}`, { headers })        
        ]);
        
        setKpisDelayIdlenessUPS(kpiResponse.data || []);
        setDynamicBucket(dynamicBucketResponse.data || []);
        setTeamsWithoutCommunication(teamsWithoutCommunicationResponse.data || []);

      } else {
        const [
          kpiResponse,
          dynamicBucketResponse, 
          teamsWithoutCommunicationResponse
        ] = await Promise.all([
          eprodapi.post("/v1/daily-operation/kpis-delay-idleness-ups", filter, { headers }),
          eprodapi.post("/v1/daily-operation/dynamic-bucket", filter, { headers }),
          eprodapi.post("/v1/daily-operation/time-without-communication", filter, { headers })        
        ]);

        setKpisDelayIdlenessUPS(kpiResponse.data || []);
        setDynamicBucket(dynamicBucketResponse.data || []);
        setTeamsWithoutCommunication(teamsWithoutCommunicationResponse.data || []);
      }
      
      if (refreshing) {
        showMessage({
          message: "Sucesso",
          description: "Dados atualizados",
          type: "success",
          duration: 3000,
          floating: true,
          position: "top",
        });
      }
    } catch (error) {
      setHasError(true);
      console.error('Dashboard error:', error);
      showMessage({
        message: "Erro",
        description: "Erro ao carregar dados do dashboard",
        type: "danger",
        duration: 3000,
        floating: true,
        position: "top",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    user?.estado, 
    user?.regional, 
    user?.base, 
    user?.prefixo, 
    user?.tipoUsuario,
    user?.userName,
    refreshing
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Verifica se há dados para exibir
  const hasData = 
    (kpisDelayIdlenessUPS && kpisDelayIdlenessUPS.length > 0) ||
    (dynamicBucket && dynamicBucket.length > 0) ||
    (teamsWithoutCommunication && teamsWithoutCommunication.length > 0);

  const KpiCards = () => {
    if (!kpisDelayIdlenessUPS || kpisDelayIdlenessUPS.length === 0) {
      return null;
    }

    const kpiData = kpisDelayIdlenessUPS[0]; // Pegando o primeiro item do array

    return (
      <View style={styles.kpiContainer}>
        {/* KPI Atraso */}
        <View style={[styles.kpiCard, styles.delayCard]}>
          <Text style={styles.kpiTitle}>Média de Atraso</Text>
          <Text style={styles.kpiValue}>{kpiData.atraso}</Text>
        </View>

        {/* KPI Ociosidade */}
        <View style={[styles.kpiCard, styles.idlenessCard]}>
          <Text style={styles.kpiTitle}>Média de Ociosidade</Text>
          <Text style={styles.kpiValue}>{kpiData.ociosidade}</Text>
        </View>

        {/* KPI UPS */}
        <View style={[styles.kpiCard, styles.upsCard]}>
          <Text style={styles.kpiTitle}>Média de UPS</Text>
          <Text style={styles.kpiValue}>{kpiData.ups}</Text>
        </View>
      </View>
    );
  };

  // Componente de estado vazio
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>📊</Text>
      </View>
      <Text style={styles.emptyTitle}>
        {hasError ? "Erro ao carregar dados" : "Nenhum dado disponível"}
      </Text>
      <Text style={styles.emptyDescription}>
        {hasError 
          ? "Ocorreu um erro ao buscar as informações do dashboard. Verifique sua conexão e tente novamente."
          : user?.tipoUsuario === 'FISCAL' 
            ? "Não há equipes atribuídas ao seu usuário fiscal no momento."
            : "Não há dados disponíveis para exibir no momento. Os dados podem estar sendo processados ou não existem para o período selecionado."
        }
      </Text>
      <View style={styles.emptyButton} onTouchEnd={onRefresh}>
        <Text style={styles.emptyButtonText}>
          {hasError ? "Tentar Novamente" : "Recarregar Dados"}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenLayout title="Dashboard">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingBottom: Platform.select({ android: 80, ios: 100 }), 
          marginTop: 20,
          flexGrow: 1 
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]}
            tintColor="#007AFF"
            title="Atualizando dados..."
            titleColor="#666"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {user?.tipoUsuario === 'FISCAL' 
                ? "Carregando equipes do fiscal..." 
                : "Carregando dados..."
              }
            </Text>
          </View>
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <View>
            {/* Adicionando os KPIs acima dos gráficos */}
            <KpiCards />
            <DynamicBucketChart data={dynamicBucket} />
            <TeamsWithoutCommunication data={teamsWithoutCommunication} />
          </View>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 100,
  },
  delayCard: {
    backgroundColor: '#FF6B6B', // Vermelho para atraso
  },
  idlenessCard: {
    backgroundColor: '#4ECDC4', // Verde-água para ociosidade
  },
  upsCard: {
    backgroundColor: '#45B7D1', // Azul para UPS
  },
  kpiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
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
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});