import React, { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { G, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";
import ScreenLayout from "../../components/ScreenLayout";

export default function Dashboard() {
  const [dailyData, setDailyData] = useState<number[]>([]);
  const [dailyLabels, setDailyLabels] = useState<string[]>([]);
  const [accumulatedData, setAccumulatedData] = useState<number[]>([]);
  const [accumulatedLabels, setAccumulatedLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDailyData([60, 20, 12, 6, 2]);
    setDailyLabels(["0 a 1 Hora","1 a 2 Horas","2 a 4 Horas","4 a 24 Horas","Acima de 24 Horas"]);
    setAccumulatedData([55, 25, 10, 7, 3]);
    setAccumulatedLabels(["0 a 1 Hora","1 a 2 Horas","2 a 4 Horas","4 a 24 Horas","Acima de 24 Horas"]);
    setLoading(false);
  }, []);

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.min(screenWidth - 20, 400);
  const barWidth = 60;
  const spacing = (chartWidth - dailyData.length * barWidth) / (dailyData.length + 1);
  const chartHeight = 200;
  const cardPadding = 20;
  const svgWidth = chartWidth - cardPadding * 2;

  const renderVerticalChart = () => {
    const maxValue = 70;
    const currentValue = 32;
    const metaValue = 42;
    const atribuidoValue = 55;
    const chartInnerHeight = 150;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Performance de UPS: Relatório MA-SLZ-F030M</Text>
        <Text style={styles.cardText}>Indicadores de rendimento</Text>
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <Svg height={220} width={svgWidth}>
            <Line x1={40} y1={20} x2={40} y2={20 + chartInnerHeight} stroke="#e0e0e0" strokeWidth={2} />
            {[0, 10, 20, 30, 40, 50, 60, 70].map((value) => {
              const y = 20 + chartInnerHeight - (value / maxValue) * chartInnerHeight;
              return (
                <G key={value}>
                  <Line x1={35} y1={y} x2={45} y2={y} stroke="#666" strokeWidth={1} />
                  <SvgText x={30} y={y + 4} fontSize="12" fill="#666" fontWeight="600" textAnchor="end">{value}</SvgText>
                </G>
              );
            })}
            <Line x1={50} y1={20 + chartInnerHeight - (metaValue / maxValue) * chartInnerHeight} x2={svgWidth - 20} y2={20 + chartInnerHeight - (metaValue / maxValue) * chartInnerHeight} stroke="#FFC107" strokeWidth={2} strokeDasharray="4,4"/>
            <SvgText x={svgWidth - 15} y={20 + chartInnerHeight - (metaValue / maxValue) * chartInnerHeight - 5} fontSize="14" fill="#FFC107" fontWeight="bold" textAnchor="end">Meta: 42</SvgText>
            <Line x1={50} y1={20 + chartInnerHeight - (atribuidoValue / maxValue) * chartInnerHeight} x2={svgWidth - 20} y2={20 + chartInnerHeight - (atribuidoValue / maxValue) * chartInnerHeight} stroke="#4CAF50" strokeWidth={2} strokeDasharray="4,4"/>
            <SvgText x={svgWidth - 15} y={20 + chartInnerHeight - (atribuidoValue / maxValue) * chartInnerHeight - 5} fontSize="14" fill="#4CAF50" fontWeight="bold" textAnchor="end">Atribuído: 55</SvgText>
            <Rect x={svgWidth / 2 - 40} y={20 + chartInnerHeight - (currentValue / maxValue) * chartInnerHeight} width={80} height={(currentValue / maxValue) * chartInnerHeight} fill="#F44336" rx={6} />
            <SvgText x={svgWidth / 2} y={20 + chartInnerHeight - (currentValue / maxValue) * chartInnerHeight - 15} fontSize="16" fill="#F44336" fontWeight="bold" textAnchor="middle">{currentValue}</SvgText>
            <SvgText x={15} y={20 + chartInnerHeight / 2} fontSize="14" fill="#333" fontWeight="bold" textAnchor="middle" transform={`rotate(-90, 15, ${20 + chartInnerHeight / 2})`}>UPS</SvgText>
          </Svg>
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: "#F44336" }]} /><Text style={styles.legendText}>Executado: 32 UPS</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: "#FFC107" }]} /><Text style={styles.legendText}>Meta: 42 UPS</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: "#4CAF50" }]} /><Text style={styles.legendText}>Atribuído: 55 UPS</Text></View>
        </View>
      </View>
    );
  };

  const renderMultiBarChart = () => {
    const maxValue = 70;
    const metaValue = 42;
    const chartInnerHeight = 150;
    const chartInnerWidth = svgWidth - 60;
    const barData = [
      { valor: 32, atribuido: 55, label: "A" },
      { valor: 22, atribuido: 10, label: "B" },
      { valor: 34, atribuido: 11, label: "C" },
      { valor: 48, atribuido: 20, label: "D" },
      { valor: 12, atribuido: 45, label: "E" },
      { valor: 7, atribuido: 50, label: "F" },
      { valor: 50, atribuido: 22, label: "G" },
      { valor: 39, atribuido: 57, label: "H" }
    ];
    const barSpacing = chartInnerWidth / barData.length;
    const barWidth = Math.min(barSpacing * 0.7, 35);
    const atribuidoPoints = barData.map((data, index) => {
      const x = 50 + index * barSpacing + barSpacing / 2;
      const y = 20 + chartInnerHeight - (data.atribuido / maxValue) * chartInnerHeight;
      return { x, y };
    });

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Performance de UPS: Comparativo por Equipe</Text>
        <Text style={styles.cardText}>Múltiplos indicadores de rendimento</Text>
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <Svg height={240} width={svgWidth}>
            <Line x1={40} y1={20} x2={40} y2={20 + chartInnerHeight} stroke="#e0e0e0" strokeWidth={2} />
            {[0, 10, 20, 30, 40, 50, 60, 70].map((value) => {
              const y = 20 + chartInnerHeight - (value / maxValue) * chartInnerHeight;
              return (
                <G key={value}>
                  <Line x1={35} y1={y} x2={45} y2={y} stroke="#666" strokeWidth={1} />
                  <SvgText x={30} y={y + 4} fontSize="12" fill="#666" fontWeight="600" textAnchor="end">{value}</SvgText>
                </G>
              );
            })}
            <Line x1={50} y1={20 + chartInnerHeight - (metaValue / maxValue) * chartInnerHeight} x2={svgWidth - 20} y2={20 + chartInnerHeight - (metaValue / maxValue) * chartInnerHeight} stroke="#FFC107" strokeWidth={3}/>
            <SvgText x={svgWidth - 15} y={20 + chartInnerHeight - (metaValue / maxValue) * chartInnerHeight - 5} fontSize="14" fill="#FFC107" fontWeight="bold" textAnchor="end">Meta: 42</SvgText>
            <Polyline points={atribuidoPoints.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#4CAF50" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
            {atribuidoPoints.map((point, index) => (
              <G key={`point-${index}`}>
                <Rect x={point.x - 4} y={point.y - 4} width={8} height={8} fill="#4CAF50" rx={4}/>
                <SvgText x={point.x} y={point.y - 10} fontSize="11" fill="#4CAF50" fontWeight="600" textAnchor="middle">{barData[index].atribuido}</SvgText>
              </G>
            ))}
            {barData.map((data, index) => {
              const x = 50 + index * barSpacing + barSpacing / 2 - barWidth / 2;
              const barHeight = (data.valor / maxValue) * chartInnerHeight;
              const barY = 20 + chartInnerHeight - barHeight;
              const barColor = data.valor >= metaValue ? "#007AFF" : "#F44336";
              const textColor = barColor;
              return (
                <G key={`bar-${index}`}>
                  <Rect x={x} y={barY} width={barWidth} height={barHeight} fill={barColor} rx={4}/>
                  <SvgText x={x + barWidth / 2} y={barY - 10} fontSize="12" fill={textColor} fontWeight="bold" textAnchor="middle">{data.valor}</SvgText>
                  <SvgText x={x + barWidth / 2} y={20 + chartInnerHeight + 20} fontSize="11" fill="#333" fontWeight="600" textAnchor="middle">{data.label}</SvgText>
                </G>
              );
            })}
            <SvgText x={15} y={20 + chartInnerHeight / 2} fontSize="14" fill="#333" fontWeight="bold" textAnchor="middle" transform={`rotate(-90, 15, ${20 + chartInnerHeight / 2})`}>UPS</SvgText>
          </Svg>
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: "#007AFF" }]} /><Text style={styles.legendText}>Acima da Meta (≥42)</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: "#F44336" }]} /><Text style={styles.legendText}>Abaixo da Meta</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: "#FFC107" }]} /><Text style={styles.legendText}>Meta: 42 UPS</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: "#4CAF50" }]} /><Text style={styles.legendText}>Atribuído</Text></View>
        </View>
        <View style={styles.barLabels}>
          <Text style={styles.barLabelText}>A: Equipe 1 | B: Equipe 2 | C: Equipe 3 | D: Equipe 4</Text>
          <Text style={styles.barLabelText}>E: Equipe 5 | F: Equipe 6 | G: Equipe 7 | H: Equipe 8</Text>
        </View>
      </View>
    );
  };

  const renderChart = (data: number[], labels: string[], title: string) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>Em Percentual %</Text>
      <View style={{ alignItems: "center" }}>
        <Svg height={chartHeight + 60} width={svgWidth}>
          {data.map((value, index) => {
            const barHeight = (value / 100) * chartHeight;
            const x = spacing + index * (barWidth + spacing);
            return (
              <G key={index}>
                <Rect x={x} y={chartHeight - barHeight} width={barWidth} height={barHeight} fill="#007AFF" rx={6}/>
                <SvgText x={x + barWidth / 2} y={chartHeight - barHeight - 5} fontSize="12" fill="#333" fontWeight="bold" textAnchor="middle">{value}%</SvgText>
                <SvgText x={x + barWidth / 2} y={chartHeight + 20} fontSize="10" fill="#333" textAnchor="middle">{labels[index]}</SvgText>
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

  if (loading) return null;

  return (
    <ScreenLayout title="">
      <View style={{ alignItems: "center", marginTop: 10, marginBottom: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Dashboard</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.topCardsContainer}>
          <View style={[styles.topCard, { backgroundColor: "#007AFF", marginRight: 5, height: 170, padding: 16 }]}>
            <Text style={styles.topCardTitle}>Total de alertas gerados</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={[styles.cardText, { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 0 }]}>210</Text>
            </View>
            <Text style={[styles.cardLegend, { color: "#fff" }]}>12% em relação ao mês anterior</Text>
          </View>
          <View style={[styles.topCard, { backgroundColor: "#4CAF50", marginRight: 5, height: 170, padding: 16 }]}>
            <Text style={styles.topCardTitle}>% de atendimento dentro do prazo</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={[styles.cardText, { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 0 }]}>80%</Text>
            </View>
            <Text style={[styles.cardLegend, { color: "#fff" }]}>5% acima da meta</Text>
          </View>
          <View style={[styles.topCard, { backgroundColor: "#FFC107", marginRight: 5, height: 170, padding: 16 }]}>
            <Text style={styles.topCardTitle}>Alertas em aberto</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={[styles.cardText, { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 0 }]}>20</Text>
            </View>
            <Text style={[styles.cardLegend, { color: "#fff" }]}>3 a menos que ontem</Text>
          </View>
          <View style={[styles.topCard, { backgroundColor: "#F44336", height: 170, padding: 16 }]}>
            <Text style={styles.topCardTitle}>Tempo médio de resposta</Text>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={[styles.cardText, { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 0 }]}>2,2h</Text>
            </View>
            <Text style={[styles.cardLegend, { color: "#fff" }]}>0,5h mais rápido que semana passada</Text>
          </View>
        </View>
        {renderVerticalChart()}
        {renderMultiBarChart()}
        {renderChart(dailyData, dailyLabels, "% intervalo de tempo de resposta para os alertas - Diário")}
        {renderChart(accumulatedData, accumulatedLabels, "% intervalo de tempo de resposta para os alertas - Acumulado")}
        {renderInfoCard("Principais responsáveis por atrasos - Tempo de resposta em horas", "")}
        {renderInfoCard("Principais responsáveis por atrasos - Quantidade de atrasos", "")}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginHorizontal: 10, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 3, alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6, color: "#111", textAlign: "center" },
  cardText: { fontSize: 14, color: "#666", textAlign: "center" },
  cardLegend: { fontSize: 11, marginTop: 4, textAlign: "center" },
  topCardsContainer: { flexDirection: "row", marginHorizontal: 10, marginBottom: 20 },
  topCard: { flex: 1, borderRadius: 16, justifyContent: "flex-start" },
  topCardTitle: { fontSize: 12, fontWeight: "700", color: "#fff", textAlign: "left" },
  chartLegend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 16, gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", marginRight: 12 },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 10, color: "#666" },
  barLabels: { marginTop: 12, alignItems: "center" },
  barLabelText: { fontSize: 10, color: "#666", textAlign: "center", marginBottom: 4 },
});
