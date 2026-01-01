import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ChartType = 'line' | 'bar' | 'bezier';

export const GRAPH_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage
  '#FFEEAD', // Pale Yellow
  '#D4A5A5', // Dusty Rose
  '#9B59B6', // Purple
  '#3498DB', // Blue
  '#E67E22', // Orange
  '#2ECC71', // Green
];

export interface Graph {
  id: string;
  name: string;
  values: number[];
  chartType: ChartType;
  color: string;
  inverted: boolean;
  showGrid: boolean;
}

export type CounterMode = 'all' | 'target';

interface GraphState {
  graphs: Graph[];
  counter: number;
  targetMaxCounter: number;
  counterMode: CounterMode;
  addGraph: (name: string, chartType?: ChartType, color?: string) => void;
  deleteGraph: (graphId: string) => void;
  addValueToGraph: (graphId: string, value: number) => void;
  addValuesToGraph: (graphId: string, values: number[]) => void;
  updateGraphValues: (graphId: string, values: number[]) => void;
  changeChartType: (graphId: string, chartType: ChartType) => void;
  updateGraphColor: (graphId: string, color: string) => void;
  toggleGraphInverted: (graphId: string) => void;
  toggleGraphGrid: (graphId: string) => void;
  incrementCounter: (amount: number) => void;
  resetCounter: () => void;
  setCounterMode: (mode: CounterMode) => void;
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set) => ({
      graphs: [],
      counter: 0,
      targetMaxCounter: 0,
      counterMode: 'all',
      addGraph: (name, chartType = 'line', color = GRAPH_COLORS[0]) =>
        set((state) => ({
          graphs: [
            ...state.graphs,
            {
              id: Math.random().toString(36).substring(2, 9),
              name,
              values: [],
              chartType,
              color,
              inverted: false,
              showGrid: false,
            },
          ],
        })),
      deleteGraph: (graphId) =>
        set((state) => ({
          graphs: state.graphs.filter((g) => g.id !== graphId),
        })),
      addValueToGraph: (graphId, value) =>
        set((state) => ({
          graphs: state.graphs.map((g) =>
            g.id === graphId ? { ...g, values: [...g.values, value] } : g
          ),
        })),
      addValuesToGraph: (graphId, values) =>
        set((state) => ({
          graphs: state.graphs.map((g) =>
            g.id === graphId ? { ...g, values: [...g.values, ...values] } : g
          ),
        })),
      updateGraphValues: (graphId, values) =>
        set((state) => ({
          graphs: state.graphs.map((g) =>
            g.id === graphId ? { ...g, values } : g
          ),
        })),
      changeChartType: (graphId, chartType) =>
        set((state) => ({
          graphs: state.graphs.map((g) =>
            g.id === graphId ? { ...g, chartType } : g
          ),
        })),
      updateGraphColor: (graphId, color) =>
        set((state) => ({
          graphs: state.graphs.map((g) =>
            g.id === graphId ? { ...g, color } : g
          ),
        })),
      toggleGraphInverted: (graphId) =>
        set((state) => ({
          graphs: state.graphs.map((g) =>
            g.id === graphId ? { ...g, inverted: !g.inverted } : g
          ),
        })),
      toggleGraphGrid: (graphId) =>
        set((state) => ({
          graphs: state.graphs.map((g) =>
            g.id === graphId ? { ...g, showGrid: !g.showGrid } : g // Toggle logic, default to true if undefined
          ),
        })),
      incrementCounter: (amount) =>
        set((state) => {
          const newState: Partial<GraphState> = {
            counter: (state.counter || 0) + amount,
          };

          if (state.counterMode === 'target') {
            // In target mode, we always add 3 to the max counter regardless of the button pressed (+1, +2, +3)
            // Wait, the request says "every time user presses +1, +2 or +3 also count +3 to different counter"
            // "so example, user presse +2, +2, +3, +1 you show 8/12"
            // 2+2+3+1 = 8.
            // 4 presses * 3 = 12.
            // Correct. Every press adds 3 to the max counter.
            newState.targetMaxCounter = (state.targetMaxCounter || 0) + 3;
          }

          return newState;
        }),
      resetCounter: () =>
        set(() => ({
          counter: 0,
          targetMaxCounter: 0,
        })),
      setCounterMode: (mode) =>
        set(() => ({
          counterMode: mode,
        })),
    }),
    {
      name: 'graph-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
