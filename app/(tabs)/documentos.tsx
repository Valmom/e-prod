import ScreenLayout from "@/components/ScreenLayout";
import { useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { GlobalStyle } from "../../styles/styles";

const documentos = [
  { id: "1", titulo: "Norma Técnica 01", descricao: "Regras de segurança" },
  { id: "2", titulo: "Procedimento Padrão", descricao: "Passos obrigatórios de inspeção" },
];

export default function Doumentos() {
  const theme = useColorScheme();
  const isDark = theme === "dark";
  const router = useRouter();

  const renderItem = ({ item }: any) => (
    <View style={GlobalStyle.card}>
      <Text style={GlobalStyle.descricao}>{item.titulo}</Text>
      <Text style={GlobalStyle.info}>{item.descricao}</Text>
      <TouchableOpacity
        style={GlobalStyle.botao}
        onPress={() => router.push({ pathname: "/dashboard", params: { id: item.id } })}
      >
        <Text style={GlobalStyle.botaoTexto}>Abrir</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <ScreenLayout title="Documentos">
      <FlatList
        style={{ width: '100%' }}
        data={documentos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </ScreenLayout>
  );
}