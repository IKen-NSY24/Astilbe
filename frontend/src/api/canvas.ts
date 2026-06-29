import { CanvasElement, StrokeData } from '../types';

// バックエンドの API ベース URL。開発時は NestJS が 3001 で待ち受けている。
const API_BASE = 'http://localhost:3001/api';

// PUT /api/canvas に送る data の中身。契約 doc（docs/json-contract.md）に準拠。
export interface CanvasData {
  elements: CanvasElement[];
  strokes: StrokeData[];
}

// キャンバス内容を保存（上書き）する。BE は body.data をそのまま透過保存する。
export async function saveCanvas(data: CanvasData): Promise<void> {
  const res = await fetch(`${API_BASE}/canvas`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    throw new Error(`保存に失敗しました (HTTP ${res.status})`);
  }
}
