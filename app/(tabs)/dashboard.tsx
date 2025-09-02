import React, { useEffect, useState } from "react";
import { Dimensions, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { G, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";

// Definindo tipos para os dados
interface CardData {
  title: string;
  value: string;
  legend: string;
  color: string;
}

interface BarData {
  valor: number;
  atribuido: number;
  label: string;
}

export default function Dashboard() {
  const [dailyData, setDailyData] = useState<number[]>([]);
  const [dailyLabels, setDailyLabels] = useState<string[]>([]);
  const [accumulatedData, setAccumulatedData] = useState<number[]>([]);
  const [accumulatedLabels, setAccumulatedLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDailyData([60, 20, 12, 6, 2]);
    setDailyLabels([
      "0 a 1 Hora",
      "1 a 2 Horas",
      "2 a 4 Horas",
      "4 a 24 Horas",
      "Acima de 24 Horas",
    ]);

    setAccumulatedData([55, 25, 10, 7, 3]);
    setAccumulatedLabels([
      "0 a 1 Hora",
      "1 a 2 Horas",
      "2 a 4 Horas",
      "4 a 24 Horas",
      "Acima de 24 Horas",
    ]);

    setLoading(false);
  }, []);

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.min(screenWidth - 20, 400);
  const barWidth = 60;
  const spacing = (chartWidth - dailyData.length * barWidth) / (dailyData.length + 1);
  const chartHeight = 200;

  // Dados para os cards coloridos
  const topCardsData: CardData[] = [
    {
      title: "Total de alertas gerados",
      value: "210",
      legend: "12% em relação ao mês anterior",
      color: "#007AFF"
    },
    {
      title: "% de atendimento dentro do prazo",
      value: "80%",
      legend: "5% acima da meta",
      color: "#4CAF50"
    },
    {
      title: "Alertas em aberto",
      value: "20",
      legend: "3 a menos que ontem",
      color: "#FFC107"
    },
    {
      title: "Tempo médio de resposta",
      value: "2,2h",
      legend: "0,5h mais rápido que semana passada",
      color: "#F44336"
    }
  ];

  // Primeiro gráfico vertical
  const renderVerticalChart = () => {
    const maxValue = 70;
    const currentValue = 32;
    const metaValue = 42;
    const atribuidoValue = 55;
    const chartInnerHeight = 150;

    // Gerar marcadores do eixo Y de 0 a 70
    const yAxisMarkers = [];
    for (let i = 0; i <= 7; i++) {
      yAxisMarkers.push(i * 10); // 0, 10, 20, 30, 40, 50, 60, 70
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Performance de UPS: Relatório MA-SLZ-F030M</Text>
        <Text style={styles.cardText}>Indicadores de rendimento</Text>

        <View style={{ alignItems: "center", marginTop: 10 }}>
          <Svg height={220} width={chartWidth}>
            {/* Eixo Y */}
            <Line
              x1={40}
              y1={20}
              x2={40}
              y2={20 + chartInnerHeight}
              stroke="#e0e0e0"
              strokeWidth={2}
            />

            {/* Marcadores do eixo Y */}
            {yAxisMarkers.map((value) => {
              const yPosition = 20 + chartInnerHeight - (value / maxValue) * chartInnerHeight;
              return (
                <G key={`y-marker-${value}`}>
                  {/* Linha de grade */}
                  <Line
                    x1={40}
                    y1={yPosition}
                    x2={chartWidth - 20}
                    y2={yPosition}
                    stroke="#f0f0f0"
                    strokeWidth={1}
                  />
                  {/* Texto do marcador */}
                  <SvgText
                    x={35}
                    y={yPosition + 4}
                    fontSize="10"
                    fill="#666"
                    textAnchor="end"
                  >
                    {value}
                  </SvgText>
                </G>
              );
            })}

            {/* Barra atual */}
            <Rect
              x={chartWidth / 2 - 40}
              y={20 + chartInnerHeight - (currentValue / maxValue) * chartInnerHeight}
              width={80}
              height={(currentValue / maxValue) * chartInnerHeight}
              fill="#F44336"
              rx={6}
            />
            <SvgText
              x={chartWidth / 2}
              y={20 + chartInnerHeight - (currentValue / maxValue) * chartInnerHeight - 15}
              fontSize="16"
              fill="#F44336"
              fontWeight="bold"
              textAnchor="middle"
            >
              {currentValue}
            </SvgText>

            {/* Linha Meta */}
            <Line
              x1={50}
              y1={20 + chartInnerHeight - (metaValue / maxValue) * chartInnerHeight}
              x2={chartWidth - 20}
              y2={20 + chartInnerHeight - (metaValue / maxValue) * chartInnerHeight}
              stroke="#FFC107"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <SvgText
              x={chartWidth - 15}
              y={20 + chartInnerHeight - (metaValue / maxValue) * chartInnerHeight - 5}
              fontSize="14"
              fill="#FFC107"
              fontWeight="bold"
              textAnchor="end"
            >
              {metaValue}
            </SvgText>

            {/* Linha Atribuído */}
            <Line
              x1={50}
              y1={20 + chartInnerHeight - (atribuidoValue / maxValue) * chartInnerHeight}
              x2={chartWidth - 20}
              y2={20 + chartInnerHeight - (atribuidoValue / maxValue) * chartInnerHeight}
              stroke="#4CAF50"
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            <SvgText
              x={chartWidth - 15}
              y={20 + chartInnerHeight - (atribuidoValue / maxValue) * chartInnerHeight - 5}
              fontSize="14"
              fill="#4CAF50"
              fontWeight="bold"
              textAnchor="end"
            >
              {atribuidoValue}
            </SvgText>
          </Svg>
        </View>

        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#F44336" }]} />
            <Text style={styles.legendText}>Executado: {currentValue}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#FFC107" }]} />
            <Text style={styles.legendText}>Meta: {metaValue}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendText}>Atribuído</Text>
          </View>
        </View>
      </View>
    );
  };

  // Segundo gráfico com múltiplas barras
  const renderMultiBarChart = () => {
    const maxValue = 70;
    const metaValue = 42;
    const chartInnerHeight = 150;

    const barData: BarData[] = [
      { valor: 32, atribuido: 55, label: "A" },
      { valor: 22, atribuido: 10, label: "B" },
      { valor: 34, atribuido: 11, label: "C" },
      { valor: 48, atribuido: 20, label: "D" },
      { valor: 12, atribuido: 45, label: "E" },
      { valor: 7, atribuido: 50, label: "F" },
      { valor: 50, atribuido: 22, label: "G" },
      { valor: 39, atribuido: 57, label: "H" }
    ];

    const chartInnerWidth = chartWidth - 80;
    const barSpacing = chartInnerWidth / barData.length;
    const barWidth = Math.min(barSpacing * 0.7, 35);

    const atribuidoPoints = barData.map((data, index) => ({
      x: 50 + index * barSpacing + barSpacing / 2,
      y: 20 + chartInnerHeight - (data.atribuido / maxValue) * chartInnerHeight
    }));

    // Gerar marcadores do eixo Y de 0 a 70
    const yAxisMarkers = [];
    for (let i = 0; i <= 7; i++) {
      yAxisMarkers.push(i * 10); // 0, 10, 20, 30, 40, 50, 60, 70
    }

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Performance de UPS: Comparativo por Equipe</Text>
        <Text style={styles.cardText}>Múltiplos indicadores de rendimento</Text>

        <View style={{ alignItems: "center", marginTop: 10 }}>
          <Svg height={240} width={chartWidth}>
            {/* Eixo Y */}
            <Line x1={40} y1={20} x2={40} y2={20 + chartInnerHeight} stroke="#e0e0e0" strokeWidth={2} />

            {/* Marcadores do eixo Y */}
            {yAxisMarkers.map((value) => {
              const yPosition = 20 + chartInnerHeight - (value / maxValue) * chartInnerHeight;
              return (
                <G key={`y-marker-${value}`}>
                  {/* Linha de grade */}
                  <Line
                    x1={40}
                    y1={yPosition}
                    x2={chartWidth - 20}
                    y2={yPosition}
                    stroke="#f0f0f0"
                    strokeWidth="1"
                  />
                  {/* Texto do marcador */}
                  <SvgText
                    x={35}
                    y={yPosition + 4}
                    fontSize="10"
                    fill="#666"
                    textAnchor="end"
                  >
                    {value}
                  </SvgText>
                </G>
              );
            })}

            {/* Barras coloridas */}
            {barData.map((data, index) => {
              const x = 50 + index * barSpacing + barSpacing / 2 - barWidth / 2;
              const barHeight = (data.valor / maxValue) * chartInnerHeight;
              const barY = 20 + chartInnerHeight - barHeight;
              const barColor = data.valor >= metaValue ? "#007AFF" : "#F44336";

              return (
                <G key={`bar-${index}`}>
                  <Rect x={x} y={barY} width={barWidth} height={barHeight} fill={barColor} rx={4} />
                  <SvgText x={x + barWidth / 2} y={barY - 10} fontSize="12" fill={barColor} fontWeight="bold" textAnchor="middle">
                    {data.valor}
                  </SvgText>
                  <SvgText x={x + barWidth / 2} y={20 + chartInnerHeight + 20} fontSize="11" fill="#333" fontWeight="600" textAnchor="middle">
                    {data.label}
                  </SvgText>
                </G>
              );
            })}

            {/* Linha Meta */}
            <Line
              x1={50}
              y1={20 + chartInnerHeight - (metaValue / maxValue) * chartInnerHeight}
              x2={chartWidth - 20}
              y2={20 + chartInnerHeight - (metaValue / maxValue) * chartInnerHeight}
              stroke="#FFC107"
              strokeWidth={3}
            />
            <SvgText
              x={chartWidth - 15}
              y={20 + chartInnerHeight - (metaValue / maxValue) * chartInnerHeight - 5}
              fontSize="14"
              fill="#FFC107"
              fontWeight="bold"
              textAnchor="end"
            >
              {metaValue}
            </SvgText>

            {/* Linha contínua Atribuído */}
            <Polyline
              points={atribuidoPoints.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#4CAF50"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {atribuidoPoints.map((point, index) => (
              <G key={`point-${index}`}>
                <Rect x={point.x - 4} y={point.y - 4} width={8} height={8} fill="#4CAF50" rx={4} />
                <SvgText x={point.x} y={point.y - 10} fontSize="11" fill="#4CAF50" fontWeight="600" textAnchor="middle">
                  {barData[index].atribuido}
                </SvgText>
              </G>
            ))}
          </Svg>
        </View>

        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#007AFF" }]} />
            <Text style={styles.legendText}>Acima da Meta (≥{metaValue})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#F44336" }]} />
            <Text style={styles.legendText}>Abaixo da Meta</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#FFC107" }]} />
            <Text style={styles.legendText}>Meta: {metaValue}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendText}>Atribuído</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderChart = (data: number[], labels: string[], title: string) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>Em Percentual %</Text>
      <View style={{ alignItems: "center" }}>
        <Svg height={chartHeight + 60} width={chartWidth}>
          {data.map((value, index) => {
            const barHeight = (value / 100) * chartHeight;
            const x = spacing + index * (barWidth + spacing);

            return (
              <G key={index}>
                <Rect
                  x={x}
                  y={chartHeight - barHeight}
                  width={barWidth}
                  height={barHeight}
                  fill="#007AFF"
                  rx={6}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight - barHeight - 5}
                  fontSize="12"
                  fill="#333"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {value}%
                </SvgText>
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  fontSize="10"
                  fill="#333"
                  textAnchor="middle"
                >
                  {labels[index]}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </View>
  );

  const renderInfoCard = (title: string, legend: string) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={[styles.cardText, { marginBottom: 0 }]}>Nenhum dado encontrado</Text>
      </View>
      <Text style={[styles.cardLegend]}>{legend}</Text>
    </View>
  );

  // Função para renderizar os cards coloridos com coluna do meio ligeiramente menor
  const renderTopCards = () => {
    return (
      <View style={styles.topCardsContainer}>
        {/* Primeira linha */}
        <View style={styles.topCardsRow}>
          <View style={[styles.topCard, { backgroundColor: "#007AFF", marginRight: 8 }]}>
            <Text style={styles.topCardTitle}>Total de alertas gerados</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={styles.topCardValue}>210</Text>
            </View>
            <Text style={styles.topCardLegend}>12% em relação ao mês anterior</Text>
          </View>
          
          <View style={[styles.topCard, { backgroundColor: "#4CAF50", marginLeft: 4 }]}>
            <Text style={styles.topCardTitle}>% de atendimento dentro do prazo</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={styles.topCardValue}>80%</Text>
            </View>
            <Text style={styles.topCardLegend}>5% acima da meta</Text>
          </View>
        </View>

        {/* Segunda linha */}
        <View style={styles.topCardsRow}>
          <View style={[styles.topCard, { backgroundColor: "#FFC107", marginRight: 8 }]}>
            <Text style={styles.topCardTitle}>Alertas em aberto</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={styles.topCardValue}>20</Text>
            </View>
            <Text style={styles.topCardLegend}>3 a menos que ontem</Text>
          </View>
          
          <View style={[styles.topCard, { backgroundColor: "#F44336", marginLeft: 4 }]}>
            <Text style={styles.topCardTitle}>Tempo médio de resposta</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={styles.topCardValue}>2,2h</Text>
            </View>
            <Text style={styles.topCardLegend}>0,5h mais rápido que semana passada</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top 4 cards com coluna do meio ligeiramente menor */}
        {renderTopCards()}

        {renderVerticalChart()}
        {renderMultiBarChart()}
        {renderChart(dailyData, dailyLabels, "% intervalo de tempo de resposta para os alertas - Diário")}
        {renderChart(accumulatedData, accumulatedLabels, "% intervalo de tempo de resposta para os alertas - Acumulado")}
        {renderInfoCard("Principais responsáveis por atrasos - Tempo de resposta em horas", "")}
        {renderInfoCard("Principais responsáveis por atrasos - Quantidade de atrasos", "")}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    alignItems: "center",
    marginTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: '#2c3e50',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.select({
      android: 80,
      ios: 100,
    }),
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111",
    textAlign: "center",
  },
  cardText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  cardLegend: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  // Container para os cards coloridos
  topCardsContainer: {
    marginHorizontal: 10,
    marginBottom: 20,
  },
  topCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  // Cards com tamanhos iguais mas margens diferentes
  topCard: {
    flex: 1,
    height: 150,
    borderRadius: 12,
    padding: 12,
    justifyContent: "space-between",
  },
  topCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  topCardValue: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#fff",
  },
  topCardLegend: {
    fontSize: 11,
    textAlign: "center",
    color: "#fff",
  },
  chartLegend: {
    flexDirection: "row",
    marginTop: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginBottom: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 4,
    backgroundColor: "#FFC107",
  },
  legendText: {
    fontSize: 12,
    color: "#333",
  },
});