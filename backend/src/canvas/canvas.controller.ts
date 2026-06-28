import { Controller, Get, Put, Body } from '@nestjs/common';
import { CanvasService, CanvasResponse } from './canvas.service';

// PUT のリクエストボディ。data の中身は BE では解釈しない。
interface SaveCanvasDto {
  data: Record<string, unknown>;
}

@Controller('api/canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  @Get()
  get(): Promise<CanvasResponse> {
    return this.canvasService.getCanvas();
  }

  @Put()
  save(@Body() body: SaveCanvasDto): Promise<CanvasResponse> {
    return this.canvasService.saveCanvas(body?.data);
  }
}
