import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode } from '@nestjs/common';
import { NotesService } from './notes.service';
import { Note } from '../common/types';

@Controller('api/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(): Note[] { return this.notesService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string): Note { return this.notesService.findOne(id); }

  @Post()
  create(@Body() body: Partial<Note>): Note { return this.notesService.create(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Note>): Note {
    return this.notesService.upsert(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void { this.notesService.remove(id); }
}
