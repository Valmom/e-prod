import React from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

export interface TeamTimeData {
  base: string;
  empresa: string;
  equipe: string;
  processo: string;
  regional: string;
  tempo: string;
  ultimaConexao: string;
}

interface HorizontalBarChartProps {
  data: TeamTimeData[];
}

export default function TeamsWithoutCommunication({ data }: HorizontalBarChartProps) {
  const screenWidth = Dimensions.get("window").width;
  const fixedChartHeight = 300; // Altura fixa de 250 pixels
  const barHeight = 25; // Reduzido para caber melhor na altura fixa
  const spacing = 12; // Reduzido o espaçamento
  const leftPadding = 150; // Espaço para os labels das equipes
  const rightPadding = 80; // Espaço para os valores de tempo
  const topPadding = 30; // Reduzido o padding superior

  // Converter tempo no formato "hh:mm" para minutos
  const convertTimeToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Ordenar dados do maior para o menor tempo
  const sortedData = [...data].sort((a, b) => 
    convertTimeToMinutes(b.tempo) - convertTimeToMinutes(a.tempo)
  );

  // Calcular valores em minutos
  const timeValues = sortedData.map(item => convertTimeToMinutes(item.tempo));
  const maxTime = Math.max(...timeValues, 60); // Mínimo de 60 minutos para boa visualização

  const chartWidth = screenWidth - 40;
  const svgHeight = Math.max(
    sortedData.length * (barHeight + spacing) + topPadding + 20,
    fixedChartHeight
  );

  if (data.length === 0) {
    return (
      <View style={[styles.card, { height: fixedChartHeight, justifyContent: "center", alignItems: "center" }]}>
        <Text>Sem dados para exibir</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { height: fixedChartHeight }]}>
      <Text style={styles.cardTitle}>Equipes sem comunicação</Text>
      <ScrollView 
        horizontal={false} 
        showsVerticalScrollIndicator={true}
        style={{ height: fixedChartHeight - 80 }} // Ajuste para caber título e legenda
      >
        <Svg width={chartWidth} height={svgHeight}>
          {/* Eixo X */}
          <Line 
            x1={leftPadding} 
            y1={topPadding - 10} 
            x2={chartWidth - rightPadding} 
            y2={topPadding - 10} 
            stroke="#e0e0e0" 
            strokeWidth={2} 
          />

          {/* Marcadores do eixo X */}
          {[0, 30, 60, 90, 120].map((value) => {
            const xPosition = leftPadding + (value / maxTime) * (chartWidth - leftPadding - rightPadding);
            return (
              <G key={`x-marker-${value}`}>
                <Line 
                  x1={xPosition} 
                  y1={topPadding - 15} 
                  x2={xPosition} 
                  y2={svgHeight - 20} 
                  stroke="#f0f0f0" 
                  strokeWidth={1} 
                  strokeDasharray="2,2"
                />
                <SvgText 
                  x={xPosition} 
                  y={topPadding - 15} 
                  fontSize="10" 
                  fill="#666" 
                  textAnchor="middle"
                >
                  {value}
                </SvgText>
              </G>
            );
          })}

          {/* Barras horizontais */}
          {sortedData.map((item, index) => {
            const minutes = convertTimeToMinutes(item.tempo);
            const barWidth = (minutes / maxTime) * (chartWidth - leftPadding - rightPadding);
            const yPosition = topPadding + index * (barHeight + spacing);
            const barColor = minutes > 30 ? "#F44336" : "#007AFF";

            return (
              <G key={`bar-${index}`}>
                {/* Barra horizontal */}
                <Rect 
                  x={leftPadding} 
                  y={yPosition} 
                  width={barWidth} 
                  height={barHeight} 
                  fill={barColor} 
                  rx={4} 
                />

                {/* Label da equipe (lado esquerdo) */}
                <SvgText 
                  x={leftPadding - 10} 
                  y={yPosition + barHeight / 2 + 4} 
                  fontSize="11" // Fonte ligeiramente menor
                  fill="#333" 
                  fontWeight="600" 
                  textAnchor="end"
                >
                  {item.equipe}
                </SvgText>

                {/* Valor do tempo (lado direito da barra) */}
                <SvgText 
                  x={leftPadding + barWidth + 8} // Espaço reduzido
                  y={yPosition + barHeight / 2 + 4} 
                  fontSize="11" // Fonte ligeiramente menor
                  fill={barColor} 
                  fontWeight="bold" 
                  textAnchor="start"
                >
                  {item.tempo}
                </SvgText>

                {/* Linha de guia para cada barra */}
                <Line 
                  x1={leftPadding} 
                  y1={yPosition + barHeight} 
                  x2={chartWidth - rightPadding} 
                  y2={yPosition + barHeight} 
                  stroke="#f0f0f0" 
                  strokeWidth={0.5} 
                />
              </G>
            );
          })}
        </Svg>
      </ScrollView>

      {/* Legenda */}
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#007AFF" }]} />
          <Text style={styles.legendText}>≤ 30 minutos</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#F44336" }]} />
          <Text style={styles.legendText}>＞ 30 minutos</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16, // Padding reduzido
    marginHorizontal: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: { 
    fontSize: 15, // Fonte ligeiramente menor
    fontWeight: "700", 
    marginBottom: 12, // Margem reduzida
    color: "#111", 
    textAlign: "center" 
  },
  chartLegend: { 
    flexDirection: "row", 
    marginTop: 12, // Margem reduzida
    justifyContent: "center",
    alignItems: "center",
  },
  legendItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginHorizontal: 10, // Margem reduzida
  },
  legendColor: { 
    width: 14, // Tamanho reduzido
    height: 14, // Tamanho reduzido
    borderRadius: 3, 
    marginRight: 5, // Margem reduzida
  },
  legendText: { 
    fontSize: 11, // Fonte reduzida
    color: "#333" 
  },
});