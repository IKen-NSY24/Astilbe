export type ToolType = 'pen' | 'eraser' | 'select' | 'hand';

export interface Point {
  x: number;
  y: number;
}

export interface StrokeData {
  points: Point[];
  color: string;
  width: number;
  opacity: number;
}

export interface PenSettings {
  color: string;
  width: number;
  opacity: number;
}

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface BaseElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
}

export interface StickyElement extends BaseElement {
  type: 'sticky';
  content: string;
  bgColor: string;
  textColor: string;
  fontSize: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

export type ShapeType = 'rectangle' | 'circle' | 'arrow' | 'line';

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

export type CanvasElement = StickyElement | TextElement | ShapeElement;

export interface Note {
  id: string;
  title: string;
  elements: CanvasElement[];
  strokes: StrokeData[];
  createdAt: string;
  updatedAt: string;
}
