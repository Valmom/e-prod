import { api } from '@/services/api';
import { useLocalSearchParams } from 'expo-router'; // Importe o hook do Expo Router
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Timeline from 'react-native-timeline-flatlist';

export default function Historico() { // Renomeei para seguir o padrão de exportação default
  const { id } = useLocalSearchParams(); // Use o hook para obter o ID
  const [historic, setHistoric] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadHistoric() {
    if (!id) return; // Verifica se o ID existe
    
    try {
      let list = [];
      const response = await api.get('/alertas/historico-alerta?AlertaId=' + id);
      const json = response.data;
      
      for (let i = 0; i < json.length; ++i) {
        const obj = {
          time: json[i].dataOcorrencia,
          title: json[i].status,
          description: json[i].descricaoAlerta,
          lineColor: '#009688',
          circleColor: ReturnColor(json[i].status)
        };
        list.push(obj);
      }
      
      setHistoric(list);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }    
  }
  
  useEffect(() => {
    loadHistoric();
  }, [id]);

  const Loading = ({ load }: { load: boolean }) => {
    if (!load) return null;
    
    return (
      <View style={HistoricStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#009688" />
      </View>
    );
  };

  return (
    <SafeAreaView style={{paddingBottom: 100}}>
      <View style={{paddingBottom: 30, marginLeft: 20}}>
        <Text style={{fontSize: 16}}>Histórico de Justificativas de Anomalias</Text>
      </View>
      <View style={HistoricStyles.exampleContainer}>
        <Timeline
          data={historic}
          isUsingFlatlist={true}
          circleSize={20}
          descriptionStyle={{color:'gray', top: -12}}
          titleStyle={{top: -10}}
          timeStyle={{textAlign: 'center', backgroundColor:'#ff9797', color:'white', padding:5, borderRadius:13, marginRight: 10}}
          timeContainerStyle={{minWidth:52}}
          columnFormat='two-column'
          innerCircle={'dot'}
          detailContainerStyle={{marginBottom: 20, padding: 10, backgroundColor: "#BBDAFF", borderRadius: 10,}}
        />
      </View>
      <Loading load={isLoading} />
    </SafeAreaView>
  );
}

function ReturnColor(description: string) {
  switch (description) {
    case 'Aprovado': return '#00b48b';
    case 'Aguardando Resposta': return '#f04324';
    case 'Aguardando Aprovação': return '#0e459c';
    case 'Não Respondido': return '#d63333';
    case 'Recusado': return '#f04324';
    case 'Não Avaliado': return 'orange';
    default: return '#038a25';
  }
}

const HistoricStyles = StyleSheet.create({
  exampleContainer: {
    height: '100%',
    paddingHorizontal: 10,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1,
  }
});