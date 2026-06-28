import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CanvasModule } from './canvas/canvas.module';

@Module({ imports: [PrismaModule, CanvasModule] })
export class AppModule {}
