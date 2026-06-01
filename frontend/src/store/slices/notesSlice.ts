import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Note } from '../../types';
import { apiGetNotes, apiSaveNote, apiDeleteNote } from '../../utils/api';
import { markSaved } from './editorSlice';

interface NotesState {
  notes: Note[];
  loading: boolean;
  error: string | null;
}

const initialState: NotesState = { notes: [], loading: false, error: null };

export const fetchNotes = createAsyncThunk('notes/fetchNotes', async () =>
  await apiGetNotes()
);

export const saveNote = createAsyncThunk(
  'notes/saveNote',
  async (note: Note, { dispatch }) => {
    const saved = await apiSaveNote(note);
    dispatch(markSaved());
    return saved;
  }
);

export const deleteNote = createAsyncThunk('notes/deleteNote', async (id: string) => {
  await apiDeleteNote(id);
  return id;
});

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchNotes.pending, state => { state.loading = true; })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false; state.notes = action.payload;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message ?? null;
      })
      .addCase(saveNote.fulfilled, (state, action) => {
        const idx = state.notes.findIndex(n => n.id === action.payload.id);
        if (idx >= 0) state.notes[idx] = action.payload;
        else state.notes.unshift(action.payload);
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.notes = state.notes.filter(n => n.id !== action.payload);
      });
  },
});

export default notesSlice.reducer;
