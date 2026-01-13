import React from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { G, Line, Path, Rect, Text as SvgText } from "react-native-svg";

export interface DynamicBucketData {
  META: number;
  UPS_DIA: number;
  DESCRICAO: string;
}

interface DynamicBucketChartProps {
  data: DynamicBucketData[];
}

export default function DynamicBucketChart({ data }: DynamicBucketChartProps) {
  const screenWidth = Dimensions.get("window").width;
  const fixedChartHeight = 320; // Altura fixa de 250 pixels
  const chartInnerHeight = 120; // Aumentado para aproveitar melhor a altura
  const barWidth = 35; // Ligeiramente reduzido
  const spacing = 15; // Reduzido o espaçamento
  const yAxisWidth = 40;
  const rightPadding = 20;
  const topPadding = 20; // Padding superior reduzido

  const maxValue = data.length ? Math.max(...data.map((d) => Math.max(d.UPS_DIA, d.META))) : 10;

  const svgWidth = Math.max(
    data.length * (barWidth + spacing) + spacing + yAxisWidth + rightPadding,
    screenWidth - 20
  );

  const getSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";
    
    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      
      // Ponto de controle - mantém a suavidade mas garante precisão
      const controlPointX1 = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5;
      const controlPointY1 = prevPoint.y;
      
      const controlPointX2 = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5;
      const controlPointY2 = currentPoint.y;
      
      // Usar curva cúbica de Bézier para melhor controle
      path += ` C ${controlPointX1},${controlPointY1} ${controlPointX2},${controlPointY2} ${currentPoint.x},${currentPoint.y}`;
    }
    
    return path;
  };

  if (data.length === 0) {
    return (
      <View style={[styles.card, { height: fixedChartHeight, justifyContent: "center", alignItems: "center" }]}>
        <Text>Sem dados para exibir</Text>
      </View>
    );
  }

  const metaPoints = data.map((item, index) => ({
    x: yAxisWidth + spacing + index * (barWidth + spacing) + barWidth / 2,
    y: topPadding + chartInnerHeight - (item.META / maxValue) * chartInnerHeight,
    value: item.META,
  }));

  const yAxisMarkers: number[] = [];
  for (let i = 0; i <= 5; i++) { // Reduzido para 5 marcadores
    yAxisMarkers.push(i * Math.ceil(maxValue / 5));
  }

  return (
    <View style={[styles.card, { height: fixedChartHeight }]}>
      <Text style={styles.cardTitle}>Performance de UPS</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ height: fixedChartHeight - 80 }} // Altura ajustada
      >
        <Svg height={fixedChartHeight - 40} width={svgWidth}>
          {/* Eixo Y */}
          <Line 
            x1={yAxisWidth} 
            y1={topPadding} 
            x2={yAxisWidth} 
            y2={topPadding + chartInnerHeight} 
            stroke="#e0e0e0" 
            strokeWidth={2} 
          />

          {/* Marcadores eixo Y */}
          {yAxisMarkers.map((value) => {
            const yPosition = topPadding + chartInnerHeight - (value / maxValue) * chartInnerHeight;
            return (
              <G key={`y-marker-${value}`}>
                <Line 
                  x1={yAxisWidth} 
                  y1={yPosition} 
                  x2={svgWidth - rightPadding} 
                  y2={yPosition} 
                  stroke="#f0f0f0" 
                  strokeWidth={1} 
                />
                <SvgText 
                  x={yAxisWidth - 5} 
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

          {/* Barras e labels */}
          {data.map((item, index) => {
            const x = yAxisWidth + spacing + index * (barWidth + spacing);
            const barHeight = (item.UPS_DIA / maxValue) * chartInnerHeight;
            const barY = topPadding + chartInnerHeight - barHeight;
            const barColor = item.UPS_DIA >= item.META ? "#007AFF" : "#F44336";

            const yMeta = topPadding + chartInnerHeight - (item.META / maxValue) * chartInnerHeight;
            const minDistance = 12; // Distância mínima reduzida

            return (
              <G key={`bar-${index}`}>
                {/* Barra UPS_DIA */}
                <Rect 
                  x={x} 
                  y={barY} 
                  width={barWidth} 
                  height={barHeight} 
                  fill={barColor} 
                  rx={6} 
                />

                {/* Label UPS_DIA */}
                <SvgText 
                  x={x + barWidth / 2} 
                  y={barY - 6} 
                  fontSize="11" 
                  fill={barColor} 
                  fontWeight="bold" 
                  textAnchor="middle"
                >
                  {item.UPS_DIA}
                </SvgText>

                {/* Label META condicional */}
                {Math.abs(barY - yMeta) > minDistance && (
                  <SvgText 
                    x={x + barWidth / 2} 
                    y={yMeta - 6} 
                    fontSize="11" 
                    fill="#FFC107" 
                    fontWeight="bold" 
                    textAnchor="middle"
                  >
                    {item.META}
                  </SvgText>
                )}

                {/* Label DESCRICAO eixo X */}
                <G 
                  rotation={-45} 
                  origin={`${x + barWidth / 2},${topPadding + chartInnerHeight + 12}`}
                >
                  <SvgText 
                    x={x + barWidth / 2} 
                    y={topPadding + chartInnerHeight + 12} 
                    fontSize="10" 
                    fill="#333" 
                    fontWeight="600" 
                    textAnchor="end"
                  >
                    {item.DESCRICAO}
                  </SvgText>
                </G>
              </G>
            );
          })}
          
          {/* Linha da Meta */}
          <Path 
            d={getSmoothPath(metaPoints)} 
            fill="none" 
            stroke="#FFC107" 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </Svg>
      </ScrollView>

      {/* Legenda */}
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#007AFF" }]} />
          <Text style={styles.legendText}>Acima da Meta</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#F44336" }]} />
          <Text style={styles.legendText}>Abaixo da Meta</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#FFC107" }]} />
          <Text style={styles.legendText}>Meta</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
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
    fontSize: 15, 
    fontWeight: "700", 
    marginBottom: 8, 
    color: "#111", 
    textAlign: "center" 
  },
  chartLegend: { 
    flexDirection: "row", 
    marginTop: 10, 
    flexWrap: "wrap", 
    justifyContent: "center" 
  },
  legendItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginHorizontal: 6, 
    marginBottom: 4 
  },
  legendColor: { 
    width: 14, 
    height: 14, 
    borderRadius: 3, 
    marginRight: 4, 
    backgroundColor: "#FFC107" 
  },
  legendText: { 
    fontSize: 11, 
    color: "#333" 
  },
});