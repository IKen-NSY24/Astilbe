import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  ToolType,
  CanvasElement,
  StrokeData,
  PenSettings,
  Point,
  TextElement,
  ShapeElement,
} from '../../types';

interface EditorState {
  activeTool: ToolType;
  selectedId: string | null;
  elements: CanvasElement[];
  currentStrokes: StrokeData[];
  activeStroke: StrokeData | null;
  penSettings: PenSettings;
}

const initialState: EditorState = {
  activeTool: 'pen',
  selectedId: null,
  elements: [],
  currentStrokes: [],
  activeStroke: null,
  penSettings: { color: '#1a1a2e', width: 3, opacity: 1 },
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setActiveTool(state, action: PayloadAction<ToolType>) {
      state.activeTool = action.payload;
      state.selectedId = null;
    },
    setPenSettings(state, action: PayloadAction<Partial<PenSettings>>) {
      state.penSettings = { ...state.penSettings, ...action.payload };
    },
    startStroke(state, action: PayloadAction<Point>) {
      state.activeStroke = {
        points: [action.payload],
        color: state.activeTool === 'eraser' ? '#ffffff' : state.penSettings.color,
        width: state.activeTool === 'eraser' ? state.penSettings.width * 4 : state.penSettings.width,
        opacity: state.penSettings.opacity,
      };
    },
    continueStroke(state, action: PayloadAction<Point>) {
      if (state.activeStroke) {
        state.activeStroke.points.push(action.payload);
      }
    },
    endStroke(state) {
      if (state.activeStroke && state.activeStroke.points.length > 1) {
        state.currentStrokes.push(state.activeStroke);
      }
      state.activeStroke = null;
    },
    clearStrokes(state) {
      state.currentStrokes = [];
    },
    addElement(state, action: PayloadAction<CanvasElement>) {
      state.elements.push(action.payload);
    },
    updateElement(state, action: PayloadAction<{ id: string; updates: Partial<CanvasElement> }>) {
      const idx = state.elements.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) {
        state.elements[idx] = { ...state.elements[idx], ...action.payload.updates } as CanvasElement;
      }
    },
    deleteElement(state) {
      if (state.selectedId === null) return;
      state.elements = state.elements.filter(e => e.id !== state.selectedId);
      state.selectedId = null;
    },
    selectElement(state, action: PayloadAction<string>) {
      state.selectedId = action.payload;
    },
    clearSelection(state) {
      state.selectedId = null;
    },
    addTextElement(state, action: PayloadAction<{ x: number; y: number }>) {
      const el: TextElement = {
        id: uuidv4(), type: 'text',
        x: action.payload.x, y: action.payload.y,
        width: 200, height: 40, rotation: 0,
        zIndex: state.elements.length, locked: false, visible: true,
        content: 'テキストを入力', fontFamily: 'Noto Sans JP',
        fontSize: 18, fontWeight: 'normal', color: '#1a1a2e', align: 'left',
      };
      state.elements.push(el);
      state.selectedId = el.id;
    },
    addShape(state, action: PayloadAction<{ x: number; y: number; shapeType: string }>) {
      const el: ShapeElement = {
        id: uuidv4(), type: 'shape',
        x: action.payload.x, y: action.payload.y,
        width: 120, height: 80, rotation: 0,
        zIndex: state.elements.length, locked: false, visible: true,
        shapeType: action.payload.shapeType as ShapeElement['shapeType'],
        fillColor: '#dbeafe', strokeColor: '#3b82f6', strokeWidth: 2, opacity: 1,
      };
      state.elements.push(el);
      state.selectedId = el.id;
    },
    addRectangle(state, action: PayloadAction<{ x: number; y: number; width: number; height: number }>) {
      const el: ShapeElement = {
        id: uuidv4(), type: 'shape',
        x: action.payload.x, y: action.payload.y,
        width: action.payload.width, height: action.payload.height, rotation: 0,
        zIndex: state.elements.length, locked: false, visible: true,
        shapeType: 'rectangle',
        // 中身は塗りつぶさず、背後の線・テキスト・他要素が見えるようにする
        fillColor: 'transparent', strokeColor: '#1a1a2e', strokeWidth: 2, opacity: 1,
      };
      state.elements.push(el);
      state.selectedId = el.id;
    },
    loadElements(state, action: PayloadAction<CanvasElement[]>) {
      state.elements = action.payload;
      state.selectedId = null;
    },
  },
});

export const {
  setActiveTool, setPenSettings, startStroke, continueStroke, endStroke,
  clearStrokes, addElement, updateElement, deleteElement,
  selectElement, clearSelection, addTextElement, addShape,
  addRectangle, loadElements,
} = editorSlice.actions;
export default editorSlice.reducer;
