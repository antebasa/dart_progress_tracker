import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { ChartType, GRAPH_COLORS, useGraphStore } from '../../store/useGraphStore';

const screenWidth = Dimensions.get('window').width;

// Helper to manipulate colors (hex to rgba)
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function GraphDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { 
    graphs, 
    addValueToGraph, 
    addValuesToGraph, 
    updateGraphValues, 
    changeChartType, 
    deleteGraph, 
    updateGraphColor,
    toggleGraphInverted,
    toggleGraphGrid,
    updateGraphAvgWindowSize
  } = useGraphStore();
  
  const graph = graphs.find((g) => g.id === id);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newValue, setNewValue] = useState('');
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editValues, setEditValues] = useState('');

  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [tempAvgWindowSize, setTempAvgWindowSize] = useState('');

  if (!graph) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors[colorScheme].text }}>Graph not found</Text>
      </View>
    );
  }

  const graphColor = graph.color || GRAPH_COLORS[0];
  const showGrid = graph.showGrid !== false; // Default true
  const avgWindowSize = graph.avgWindowSize || 1; // Default 1 (no averaging)

  const handleOpenSettings = () => {
    setTempAvgWindowSize(avgWindowSize.toString());
    setIsSettingsModalVisible(true);
  }

  const handleSaveSettings = () => {
    const size = parseInt(tempAvgWindowSize);
    if (!isNaN(size) && size > 0) {
      updateGraphAvgWindowSize(graph.id, size);
    }
    setIsSettingsModalVisible(false);
  }

  const handleAddValue = () => {
    const values = newValue.trim().split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
    
    if (values.length > 0) {
      if (values.length === 1) {
        addValueToGraph(graph.id, values[0]);
      } else {
        addValuesToGraph(graph.id, values);
      }
      setNewValue('');
      setIsModalVisible(false);
    }
  };

  const openEditModal = () => {
    setEditValues(graph.values.join(' '));
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = () => {
     const values = editValues.trim().split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
     updateGraphValues(graph.id, values);
     setIsEditModalVisible(false);
  };

  const handleDelete = () => {
    setIsSettingsModalVisible(false);
    
    Alert.alert(
      "Delete Graph",
      "Are you sure you want to delete this graph? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteGraph(graph.id);
            router.back();
          }
        }
      ]
    );
  };

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
    if (!graph.values || graph.values.length === 0) return [0];
    
    if (avgWindowSize <= 1) {
      return graph.values;
    }

    const aggregatedValues = [];
    for (let i = 0; i < graph.values.length; i += avgWindowSize) {
      const window = graph.values.slice(i, i + avgWindowSize);
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

  if (data.labels.length > 10) {
    data.labels = []; 
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
          width={screenWidth - 20}
          height={300}
          yAxisLabel={graph.inverted ? "" : ""}
          yAxisSuffix=""
          chartConfig={chartConfig}
          verticalLabelRotation={30}
          fromZero
          formatYLabel={formatYLabel}
        />
      );
    }

    return (
      <LineChart
        data={data}
        width={screenWidth - 20}
        height={300}
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen 
        options={{ 
          title: graph.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleOpenSettings} style={{ padding: 10 }}>
              <FontAwesome name="cog" size={24} color={Colors[colorScheme].text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={[
        styles.chartContainer, 
        { 
          backgroundColor: colorScheme === 'dark' ? hexToRgba(graphColor, 0.1) : hexToRgba(graphColor, 0.05),
          borderColor: hexToRgba(graphColor, 0.2),
          borderWidth: 1
        }
      ]}>
        <TouchableOpacity onPress={() => router.push(`/graph/landscape/${graph.id}`)}>
          {renderChart()}
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>Chart Type</Text>
        <View style={styles.typeButtons}>
          {(['line', 'bar', 'bezier'] as ChartType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                graph.chartType === type && styles.typeButtonActive,
              ]}
              onPress={() => changeChartType(graph.id, type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  graph.chartType === type && styles.typeButtonTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: graphColor }]}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add Value(s)</Text>
        </TouchableOpacity>

        <View style={styles.valuesListHeader}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text, marginTop: 0 }]}>History</Text>
          <TouchableOpacity onPress={openEditModal}>
             <FontAwesome name="edit" size={20} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>
        <View style={styles.valuesList}>
          <Text style={{ color: Colors[colorScheme].text }}>
             {graph.values.join(', ')}
          </Text>
        </View>
      </View>

      {/* Add Value Modal */}
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
              Add Value(s)
            </Text>
            <Text style={[styles.helperText, { color: Colors[colorScheme].text }]}>
              Enter a single number or multiple separated by spaces (e.g., "5 10 20")
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].text },
              ]}
              placeholder="0.0 or 5 10 20"
              placeholderTextColor={Colors[colorScheme].tabIconDefault}
              keyboardType="numeric"
              value={newValue}
              onChangeText={setNewValue}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.buttonCancel}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddValue}
                style={[styles.buttonAdd, { backgroundColor: graphColor }]}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Values Modal */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
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
              Edit History
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].text },
              ]}
              placeholder="10 20 30..."
              placeholderTextColor={Colors[colorScheme].tabIconDefault}
              keyboardType="numeric"
              multiline
              value={editValues}
              onChangeText={setEditValues}
            />
            <View style={styles.modalButtons}>
               <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.buttonCancel}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={[styles.buttonAdd, { backgroundColor: graphColor }]}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Settings Modal (Color, Invert, Delete) */}
      <Modal visible={isSettingsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: Colors[colorScheme].background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
              Graph Settings
            </Text>

            {/* Color Picker */}
            <Text style={[styles.label, { color: Colors[colorScheme].text }]}>Graph Color</Text>
            <View style={styles.colorPicker}>
              {GRAPH_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    graphColor === color && styles.selectedColorOption,
                  ]}
                  onPress={() => updateGraphColor(graph.id, color)}
                />
              ))}
            </View>

            {/* Invert Switch */}
            <View style={styles.switchContainer}>
               <Text style={[styles.label, { color: Colors[colorScheme].text, marginBottom: 0 }]}>
                 Invert Graph (Lower is better)
               </Text>
               <Switch 
                 value={!!graph.inverted} 
                 onValueChange={() => toggleGraphInverted(graph.id)}
                 trackColor={{ false: "#767577", true: graphColor }}
               />
            </View>

            {/* Grid Switch */}
            <View style={styles.switchContainer}>
               <Text style={[styles.label, { color: Colors[colorScheme].text, marginBottom: 0 }]}>
                 Show Grid Lines
               </Text>
               <Switch 
                 value={showGrid} 
                 onValueChange={() => toggleGraphGrid(graph.id)}
                 trackColor={{ false: "#767577", true: graphColor }}
               />
            </View>

            {/* Avg Window Size Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.label, { color: Colors[colorScheme].text }]}>
                Average Window Size (1 = no averaging)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].text, marginBottom: 0 },
                ]}
                placeholder="1"
                placeholderTextColor={Colors[colorScheme].tabIconDefault}
                keyboardType="numeric"
                value={tempAvgWindowSize}
                onChangeText={setTempAvgWindowSize}
              />
            </View>

            {/* Delete Button */}
            <TouchableOpacity 
              onPress={handleDelete}
              style={[styles.actionButton, { backgroundColor: '#FF6B6B', marginTop: 20 }]}
            >
               <Text style={styles.buttonText}>Delete Graph</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveSettings}
              style={[styles.actionButton, { backgroundColor: '#ccc', marginTop: 10 }]}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 16,
  },
  controls: {
    padding: 20,
    paddingBottom: 50,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  typeButtons: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  typeButtonText: {
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  addButton: {
    // backgroundColor: '#2f95dc', // Overridden by inline style
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  valuesListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  valuesList: {
    // marginTop: 10,
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
  helperText: {
    fontSize: 12,
    marginBottom: 10,
    opacity: 0.7,
  },
  label: {
    marginBottom: 10,
    fontWeight: '600',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
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
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  }
});
