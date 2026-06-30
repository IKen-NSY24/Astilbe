import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// 単一ワークスペースの固定ID
const SINGLETON_ID = 'singleton';

// BE は data の中身を解釈しない。FE が送る { elements, strokes } をそのまま透過する。
type CanvasData = Record<string, unknown>;

const EMPTY_DATA: CanvasData = { elements: [], strokes: [] };

export interface CanvasResponse {
  id: string;
  data: CanvasData;
  updatedAt: string | null;
}

@Injectable()
export class CanvasService {
  constructor(private readonly prisma: PrismaService) {}

  // 固定レコードを返す。無ければ空データを返す。
  async getCanvas(): Promise<CanvasResponse> {
    const record = await this.prisma.canvas.findUnique({ where: { id: SINGLETON_ID } });
    if (!record) {
      return { id: SINGLETON_ID, data: EMPTY_DATA, updatedAt: null };
    }
    return {
      id: record.id,
      data: JSON.parse(record.data) as CanvasData,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  // 固定レコードを upsert で上書き保存。updatedAt は @updatedAt で自動更新。
  async saveCanvas(data: CanvasData): Promise<CanvasResponse> {
    const serialized = JSON.stringify(data ?? EMPTY_DATA);
    const record = await this.prisma.canvas.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, data: serialized },
      update: { data: serialized },
    });
    return {
      id: record.id,
      data: JSON.parse(record.data) as CanvasData,
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
