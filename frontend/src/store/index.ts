import { configureStore } from '@reduxjs/toolkit';
import editorReducer from './slices/editorSlice';
import notesReducer from './slices/notesSlice';

export const store = configureStore({
  reducer: {
    editor: editorReducer,
    notes: notesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
