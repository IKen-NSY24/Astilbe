import { Injectable, NotFoundException } from '@nestjs/common';
import { Note } from '../common/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotesService {
  private notes = new Map<string, Note>();

  findAll(): Note[] {
    return Array.from(this.notes.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  findOne(id: string): Note {
    const note = this.notes.get(id);
    if (!note) throw new NotFoundException(`Note ${id} not found`);
    return note;
  }

  upsert(id: string, data: Partial<Note>): Note {
    const existing = this.notes.get(id);
    const note: Note = {
      id,
      title: data.title ?? existing?.title ?? '無題',
      elements: data.elements ?? existing?.elements ?? [],
      strokes: data.strokes ?? existing?.strokes ?? [],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.notes.set(id, note);
    return note;
  }

  create(data: Partial<Note>): Note {
    const id = data.id || uuidv4();
    return this.upsert(id, data);
  }

  remove(id: string): void {
    if (!this.notes.has(id)) throw new NotFoundException(`Note ${id} not found`);
    this.notes.delete(id);
  }
}
