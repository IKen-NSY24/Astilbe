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

export interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  [key: string]: any;
}

export interface Note {
  id: string;
  title: string;
  elements: CanvasElement[];
  strokes: StrokeData[];
  createdAt: string;
  updatedAt: string;
}
