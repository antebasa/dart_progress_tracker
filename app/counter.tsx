import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, Alert, Switch, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useGraphStore, GRAPH_COLORS } from '../store/useGraphStore';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

// Helper to manipulate colors (hex to rgba)
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function CounterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const {
    counter,
    targetMaxCounter,
    incrementCounter,
    resetCounter,
    graphs,
    addValueToGraph,
    counterMode,
    setCounterMode
  } = useGraphStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [savePercentage, setSavePercentage] = useState(false);

  const handleAddToGraph = (graphId: string, graphName: string) => {
    let valueToSave = counter;
    let message = `Added ${counter} to ${graphName}`;

    if (counterMode === 'target' && savePercentage && targetMaxCounter > 0) {
      valueToSave = Math.ceil((counter / targetMaxCounter) * 100);
      message = `Added ${valueToSave}% (${counter}/${targetMaxCounter}) to ${graphName}`;
    }

    addValueToGraph(graphId, valueToSave);
    setIsModalVisible(false);
    resetCounter();
    Alert.alert('Success', message);
    router.push(`/graph/${graphId}`);
  };

  const renderButtons = () => {
    if (counterMode === 'target') {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
              style={[styles.targetButton, { backgroundColor: '#2ECC71' }]}
              onPress={() => incrementCounter(0)}
          >
            <Text style={styles.buttonText}>+0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.targetButton, { backgroundColor: '#2f95dc' }]}
            onPress={() => incrementCounter(1)}
          >
            <Text style={styles.buttonText}>+1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.targetButton, { backgroundColor: '#4ECDC4' }]}
            onPress={() => incrementCounter(2)}
          >
            <Text style={styles.buttonText}>+2</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.targetButton, { backgroundColor: '#FFD700' }]} // Gold for +3
            onPress={() => incrementCounter(3)}
          >
            <Text style={styles.buttonText}>+3</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Default 'all' mode
    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#2f95dc' }]}
          onPress={() => incrementCounter(1)}
        >
          <Text style={styles.buttonText}>+1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#4ECDC4' }]}
          onPress={() => incrementCounter(3)}
        >
          <Text style={styles.buttonText}>+3</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCounterDisplay = () => {
    if (counterMode === 'target') {
      return (
        <View style={styles.counterRow}>
          <Text style={[styles.counterText, { color: Colors[colorScheme].text }]}>
            {counter || 0}
          </Text>
          <Text style={[styles.counterSeparator, { color: Colors[colorScheme].text }]}>/</Text>
          <Text style={[styles.counterTextSecondary, { color: '#888' }]}>
            {targetMaxCounter || 0}
          </Text>
        </View>
      );
    }

    return (
      <Text style={[styles.counterText, { color: Colors[colorScheme].text }]}>
        {counter || 0}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Counter' }} />

      <View style={styles.header}>
        <View style={styles.modeSwitchContainer}>
          <Text style={[styles.modeLabel, { color: Colors[colorScheme].text }]}>
            {counterMode === 'all' ? 'All Mode' : 'Target Mode'}
          </Text>
          <Switch
            value={counterMode === 'target'}
            onValueChange={(val) => setCounterMode(val ? 'target' : 'all')}
            trackColor={{ false: "#767577", true: "#2f95dc" }}
            thumbColor={Platform.OS === 'android' ? "#f4f3f4" : ""}
          />
        </View>
      </View>

      <View style={styles.content}>
        {renderCounterDisplay()}

        {renderButtons()}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#9B59B6' }]}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.buttonText}>Add to Graph</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: '#FF6B6B' }]}
          onPress={resetCounter}
        >
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: Colors[colorScheme].background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
              Select Graph
            </Text>

            {counterMode === 'target' && (
              <View style={styles.percentageSwitchContainer}>
                <Text style={{ color: Colors[colorScheme].text, fontWeight: '600' }}>Save as Percentage</Text>
                <Switch
                  value={savePercentage}
                  onValueChange={setSavePercentage}
                  trackColor={{ false: "#767577", true: "#2f95dc" }}
                  thumbColor={Platform.OS === 'android' ? "#f4f3f4" : ""}
                />
              </View>
            )}

            {graphs.length === 0 ? (
              <Text style={{ color: Colors[colorScheme].text, textAlign: 'center', marginBottom: 20 }}>
                No graphs available. Create one first.
              </Text>
            ) : (
              <FlatList
                data={graphs}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => {
                   const graphColor = item.color || GRAPH_COLORS[0];
                   return (
                    <TouchableOpacity
                      style={[
                        styles.graphItem,
                        { borderColor: graphColor, backgroundColor: hexToRgba(graphColor, 0.1) }
                      ]}
                      onPress={() => handleAddToGraph(item.id, item.name)}
                    >
                      <Text style={[styles.graphItemText, { color: Colors[colorScheme].text }]}>
                        {item.name}
                      </Text>
                      <FontAwesome name="plus-circle" size={24} color={graphColor} />
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  modeSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modeLabel: {
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Take remaining space
    gap: 30,
    paddingBottom: 50, // Add some bottom padding
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'baseline', // Align by text baseline
    gap: 5,
  },
  counterText: {
    fontSize: 96,
    fontWeight: 'bold',
  },
  counterSeparator: {
    fontSize: 48,
    fontWeight: '300',
    color: '#888',
  },
  counterTextSecondary: {
    fontSize: 48, // Smaller than main counter
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  targetButton: {
    width: 80, // Slightly smaller to fit 3 in a row
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 10,
    width: 220,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resetButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 0,
    width: 220,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  percentageSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  graphItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  graphItemText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCancelButton: {
    padding: 15,
    backgroundColor: '#ccc',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
});
