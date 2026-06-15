import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  ToolType,
  CanvasElement,
  StrokeData,
  PenSettings,
  CanvasState,
  Point,
  StickyElement,
  TextElement,
  ShapeElement,
} from '../../types';

interface EditorState {
  activeTool: ToolType;
  selectedElementIds: string[];
  elements: CanvasElement[];
  currentStrokes: StrokeData[];
  activeStroke: StrokeData | null;
  penSettings: PenSettings;
  canvas: CanvasState;
  noteId: string | null;
  noteTitle: string;
  isDirty: boolean;
}

const initialState: EditorState = {
  activeTool: 'pen',
  selectedElementIds: [],
  elements: [],
  currentStrokes: [],
  activeStroke: null,
  penSettings: { color: '#1a1a2e', width: 3, opacity: 1 },
  canvas: { scale: 1, offsetX: 0, offsetY: 0 },
  noteId: uuidv4(),
  noteTitle: '無題のメモ',
  isDirty: false,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setActiveTool(state, action: PayloadAction<ToolType>) {
      state.activeTool = action.payload;
      state.selectedElementIds = [];
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
        state.isDirty = true;
      }
      state.activeStroke = null;
    },
    clearStrokes(state) {
      state.currentStrokes = [];
      state.isDirty = true;
    },
    addElement(state, action: PayloadAction<CanvasElement>) {
      state.elements.push(action.payload);
      state.isDirty = true;
    },
    updateElement(state, action: PayloadAction<{ id: string; updates: Partial<CanvasElement> }>) {
      const idx = state.elements.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) {
        state.elements[idx] = { ...state.elements[idx], ...action.payload.updates } as CanvasElement;
        state.isDirty = true;
      }
    },
    deleteSelectedElements(state) {
      state.elements = state.elements.filter(e => !state.selectedElementIds.includes(e.id));
      state.selectedElementIds = [];
      state.isDirty = true;
    },
    selectElement(state, action: PayloadAction<{ id: string; multi: boolean }>) {
      if (action.payload.multi) {
        if (state.selectedElementIds.includes(action.payload.id)) {
          state.selectedElementIds = state.selectedElementIds.filter(id => id !== action.payload.id);
        } else {
          state.selectedElementIds.push(action.payload.id);
        }
      } else {
        state.selectedElementIds = [action.payload.id];
      }
    },
    clearSelection(state) {
      state.selectedElementIds = [];
    },
    addSticky(state, action: PayloadAction<{ x: number; y: number }>) {
      const el: StickyElement = {
        id: uuidv4(), type: 'sticky',
        x: action.payload.x, y: action.payload.y,
        width: 200, height: 160, rotation: 0,
        zIndex: state.elements.length, locked: false, visible: true,
        content: 'メモを入力...', bgColor: '#fef08a', textColor: '#1a1a2e', fontSize: 14,
      };
      state.elements.push(el);
      state.selectedElementIds = [el.id];
      state.isDirty = true;
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
      state.selectedElementIds = [el.id];
      state.isDirty = true;
    },
    addShape(state, action: PayloadAction<{ x: number; y: number; shapeType: string }>) {
      const el: ShapeElement = {
        id: uuidv4(), type: 'shape',
        x: action.payload.x, y: action.payload.y,
        width: 120, height: 80, rotation: 0,
        zIndex: state.elements.length, locked: false, visible: true,
        shapeType: action.payload.shapeType as any,
        fillColor: '#dbeafe', strokeColor: '#3b82f6', strokeWidth: 2, opacity: 1,
      };
      state.elements.push(el);
      state.selectedElementIds = [el.id];
      state.isDirty = true;
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
      state.selectedElementIds = [el.id];
      state.isDirty = true;
    },
    setCanvasTransform(state, action: PayloadAction<Partial<CanvasState>>) {
      state.canvas = { ...state.canvas, ...action.payload };
    },
    setNoteTitle(state, action: PayloadAction<string>) {
      state.noteTitle = action.payload;
      state.isDirty = true;
    },
    markSaved(state) {
      state.isDirty = false;
    },
    loadNote(state, action: PayloadAction<{ id: string; title: string; elements: CanvasElement[]; strokes: StrokeData[] }>) {
      state.noteId = action.payload.id;
      state.noteTitle = action.payload.title;
      state.elements = action.payload.elements;
      state.currentStrokes = action.payload.strokes;
      state.isDirty = false;
      state.selectedElementIds = [];
    },
    reorderElement(state, action: PayloadAction<{ id: string; direction: 'up' | 'down' | 'top' | 'bottom' }>) {
      const idx = state.elements.findIndex(e => e.id === action.payload.id);
      if (idx === -1) return;
      const { direction } = action.payload;
      const el = state.elements[idx];
      if (direction === 'up' && idx < state.elements.length - 1) {
        state.elements[idx] = state.elements[idx + 1]; state.elements[idx + 1] = el;
      } else if (direction === 'down' && idx > 0) {
        state.elements[idx] = state.elements[idx - 1]; state.elements[idx - 1] = el;
      } else if (direction === 'top') {
        state.elements.splice(idx, 1); state.elements.push(el);
      } else if (direction === 'bottom') {
        state.elements.splice(idx, 1); state.elements.unshift(el);
      }
    },
  },
});

export const {
  setActiveTool, setPenSettings, startStroke, continueStroke, endStroke,
  clearStrokes, addElement, updateElement, deleteSelectedElements,
  selectElement, clearSelection, addSticky, addTextElement, addShape,
  addRectangle, setCanvasTransform, setNoteTitle, markSaved, loadNote,
  reorderElement,
} = editorSlice.actions;
export default editorSlice.reducer;
