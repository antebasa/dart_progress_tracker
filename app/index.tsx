import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useGraphStore, Graph, GRAPH_COLORS } from '../store/useGraphStore';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

// Helper to manipulate colors (hex to rgba)
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { graphs, addGraph, reorderGraph } = useGraphStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newGraphName, setNewGraphName] = useState('');
  const [selectedColor, setSelectedColor] = useState(GRAPH_COLORS[0]);

  const handleAddGraph = () => {
    if (newGraphName.trim()) {
      addGraph(newGraphName, 'line', selectedColor);
      setNewGraphName('');
      setSelectedColor(GRAPH_COLORS[0]);
      setIsModalVisible(false);
    }
  };

  const handleReorder = (graphId: string, direction: 'up' | 'down') => {
    reorderGraph(graphId, direction);
  };

  const renderGraphPreview = (item: Graph) => {
    // Default to first color if undefined (migration support)
    const graphColor = item.color || GRAPH_COLORS[0];
    
    const chartConfig = {
      backgroundGradientFromOpacity: 0,
      backgroundGradientToOpacity: 0,
      color: (opacity = 1) => graphColor, // Use graph color
      strokeWidth: 2,
      labelColor: (opacity = 1) => Colors[colorScheme].text,
    };

    const displayValues = item.values.length > 0 ? item.values.slice(-5) : [0];
    const chartDataValues = item.inverted ? displayValues.map(v => -v) : displayValues;

    const data = {
      labels: [],
      datasets: [
        {
          data: chartDataValues,
        },
      ],
    };

    if (item.chartType === 'bar') {
      return (
        <BarChart
          data={data}
          width={screenWidth - 60}
          height={100}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          withHorizontalLabels={false}
          withVerticalLabels={false}
          fromZero
        />
      );
    }

    return (
      <LineChart
        data={data}
        width={screenWidth - 60}
        height={100}
        chartConfig={chartConfig}
        bezier={item.chartType === 'bezier'}
        withDots={false}
        withInnerLines={false}
        withOuterLines={false}
        withHorizontalLabels={false}
        withVerticalLabels={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={graphs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const graphColor = item.color || GRAPH_COLORS[0];
          // Create a subtle background tint based on the graph color
          const cardBackgroundColor = colorScheme === 'dark' 
            ? hexToRgba(graphColor, 0.15) 
            : hexToRgba(graphColor, 0.1);

          const totalInputs = item.values.length;
          const average = totalInputs > 0 
            ? (item.values.reduce((sum, val) => sum + val, 0) / totalInputs).toFixed(1) 
            : '0.0';
          
          return (
            <View style={[
              styles.cardContainer,
              { backgroundColor: cardBackgroundColor, borderColor: hexToRgba(graphColor, 0.3), borderWidth: 1 }
            ]}>
              <View style={styles.reorderControls}>
                <TouchableOpacity 
                  onPress={() => handleReorder(item.id, 'up')}
                  disabled={index === 0}
                  style={[styles.reorderButton, index === 0 && styles.disabledButton]}
                >
                  <FontAwesome name="chevron-up" size={16} color={Colors[colorScheme].text} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleReorder(item.id, 'down')}
                  disabled={index === graphs.length - 1}
                  style={[styles.reorderButton, index === graphs.length - 1 && styles.disabledButton]}
                >
                  <FontAwesome name="chevron-down" size={16} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cardContent}
                onPress={() => router.push(`/graph/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: Colors[colorScheme].text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.statText, { color: Colors[colorScheme].text }]}>
                    avg: {average}
                  </Text>
                </View>
                
                <View style={styles.chartPreview}>{renderGraphPreview(item)}</View>

                <View style={styles.cardFooter}>
                   <Text style={[styles.statText, { color: Colors[colorScheme].text }]}>
                     n: {totalInputs}
                   </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <TouchableOpacity
        style={styles.fabLeft}
        onPress={() => router.push('/counter')}
      >
        <FontAwesome name="hashtag" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      >
        <FontAwesome name="plus" size={24} color="white" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: Colors[colorScheme].background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
              Add New Graph
            </Text>
            
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].text },
              ]}
              placeholder="Graph Name"
              placeholderTextColor={Colors[colorScheme].tabIconDefault}
              value={newGraphName}
              onChangeText={setNewGraphName}
            />

            <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Select Color</Text>
            <View style={styles.colorPicker}>
              {GRAPH_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.buttonCancel}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddGraph}
                style={styles.buttonAdd}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
  },
  reorderControls: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  reorderButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.3,
  },
  cardContent: {
    flex: 1,
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  chartPreview: {
    alignItems: 'center',
    pointerEvents: 'none', 
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2f95dc',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabLeft: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9B59B6', // Purple distinct from blue add button
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#333', // Dark border to show selection
    transform: [{ scale: 1.1 }],
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  buttonCancel: {
    padding: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  buttonAdd: {
    padding: 10,
    backgroundColor: '#2f95dc',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
