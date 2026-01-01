import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, BackHandler, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useGraphStore, GRAPH_COLORS } from '../../../store/useGraphStore';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Helper to manipulate colors (hex to rgba)
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function LandscapeGraphScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { graphs } = useGraphStore();

  const graph = graphs.find((g) => g.id === id);

  useEffect(() => {
    async function lockOrientation() {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
    lockOrientation();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
    });

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      backHandler.remove();
    };
  }, []);

  const handleBack = () => {
    router.back();
  };

  if (!graph) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors[colorScheme].text }}>Graph not found</Text>
        <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
            <FontAwesome name="close" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
      </View>
    );
  }

  const graphColor = graph.color || GRAPH_COLORS[0];
  const showGrid = graph.showGrid !== false;
  const avgWindowSize = graph.avgWindowSize || 1; // Default 1
  const showLastN = graph.showLastN;

  // Use the larger dimension as width for landscape
  const chartWidth = Math.max(width, height) - 40; // minimal padding
  const chartHeight = Math.min(width, height) - 60; // leave space for header/close button

  const chartConfig = {
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => graphColor,
    labelColor: (opacity = 1) => Colors[colorScheme].text,
    strokeWidth: 2,
    decimalPlaces: 1,
    propsForBackgroundLines: {
      strokeWidth: showGrid ? 1 : 0,
      stroke: showGrid ? (colorScheme === 'dark' ? '#333' : '#e3e3e3') : 'transparent',
    }
  };

  const calculateDisplayValues = () => {
    let valuesToProcess = graph.values || [];
    
    // Apply "Show Last N" filter first
    if (showLastN && showLastN > 0 && valuesToProcess.length > showLastN) {
      valuesToProcess = valuesToProcess.slice(valuesToProcess.length - showLastN);
    }

    if (valuesToProcess.length === 0) return [0];
    
    if (avgWindowSize <= 1) {
      return valuesToProcess;
    }

    const aggregatedValues = [];
    for (let i = 0; i < valuesToProcess.length; i += avgWindowSize) {
      const window = valuesToProcess.slice(i, i + avgWindowSize);
      const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
      aggregatedValues.push(avg);
    }
    return aggregatedValues;
  };

  const displayValues = calculateDisplayValues();
  const chartDataValues = graph.inverted ? displayValues.map(v => -v) : displayValues;

  const data = {
    labels: displayValues.length > 0 ? displayValues.map((_, i) => (i + 1).toString()) : ['Start'],
    datasets: [
      {
        data: chartDataValues,
      },
    ],
  };

  // In landscape, we can show more labels potentially, but keeping logic consistent
  // If many data points, maybe show every Nth label?
  // For now, react-native-chart-kit handles layout reasonably well, but let's hide labels if too many
  if (data.labels.length > 20) {
      // Show every 5th label roughly
      data.labels = data.labels.map((l, i) => i % 5 === 0 ? l : '');
  }

  const formatYLabel = (y: string) => {
    if (graph.inverted) {
      return Math.abs(parseFloat(y)).toString();
    }
    return y;
  };

  const renderChart = () => {
    if (graph.chartType === 'bar') {
      return (
        <BarChart
          data={data}
          width={chartWidth}
          height={chartHeight}
          yAxisLabel={graph.inverted ? "" : ""}
          yAxisSuffix=""
          chartConfig={chartConfig}
          verticalLabelRotation={30}
          fromZero
          // @ts-ignore
          formatYLabel={formatYLabel}
        />
      );
    }

    return (
      <LineChart
        data={data}
        width={chartWidth}
        height={chartHeight}
        chartConfig={chartConfig}
        bezier={graph.chartType === 'bezier'}
        style={{ borderRadius: 16 }}
        formatYLabel={formatYLabel}
        withInnerLines={showGrid}
        withOuterLines={showGrid}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleBack}
      >
        <FontAwesome name="close" size={30} color={Colors[colorScheme].text} />
      </TouchableOpacity>

      <View style={styles.chartContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
             <View style={{ paddingHorizontal: 20 }}>
                {renderChart()}
             </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingTop:52
  },
  chartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
  }
});

