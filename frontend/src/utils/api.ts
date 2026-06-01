import axios from 'axios';
import { Note } from '../types';

const API_BASE = 'http://localhost:3001/api';
const LS_KEY = 'memo-editor-notes';

const getLocalNotes = (): Note[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
};

const saveLocalNotes = (notes: Note[]) =>
  localStorage.setItem(LS_KEY, JSON.stringify(notes));

export const apiGetNotes = async (): Promise<Note[]> => {
  try {
    const res = await axios.get<Note[]>(`${API_BASE}/notes`);
    return res.data;
  } catch {
    return getLocalNotes();
  }
};

export const apiSaveNote = async (note: Note): Promise<Note> => {
  try {
    const res = await axios.put<Note>(`${API_BASE}/notes/${note.id}`, note);
    return res.data;
  } catch {
    const notes = getLocalNotes();
    const idx = notes.findIndex(n => n.id === note.id);
    if (idx >= 0) notes[idx] = note; else notes.unshift(note);
    saveLocalNotes(notes);
    return note;
  }
};

export const apiDeleteNote = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE}/notes/${id}`);
  } catch {
    saveLocalNotes(getLocalNotes().filter(n => n.id !== id));
  }
};
