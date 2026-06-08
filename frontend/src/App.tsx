import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks';
import { EditorCanvas } from './components/Canvas';
import Toolbar from './components/Toolbar';
import ElementPalette from './components/ElementPalette';
import LayerPanel from './components/LayerPanel';
import SaveLoadPanel from './components/SaveLoad';
import { clearSelection } from './store/slices/editorSlice';
import { saveNote } from './store/slices/notesSlice';
import { v4 as uuidv4 } from 'uuid';

const Editor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { canvas, noteId, noteTitle, elements, currentStrokes, isDirty } = useAppSelector(s => s.editor);
  const [showNotesList, setShowNotesList] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: window.innerWidth - 140, h: window.innerHeight - 56 });
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onResize = () => setCanvasSize({ w: window.innerWidth - 140, h: window.innerHeight - 56 });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape') dispatch(clearSelection());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [noteId, noteTitle, elements, currentStrokes]);

  useEffect(() => {
    if (!isDirty) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => handleSave(), 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [isDirty, elements, currentStrokes]);

  const handleSave = useCallback(() => {
    dispatch(saveNote({
      id: noteId || uuidv4(), title: noteTitle, elements, strokes: currentStrokes,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }));
  }, [noteId, noteTitle, elements, currentStrokes, dispatch]);

  const handleNewNote = () => {
    if (isDirty && !window.confirm('現在の変更は保存されていません。新しいメモを作成しますか？')) return;
    dispatch({ type: 'editor/loadNote', payload: { id: uuidv4(), title: '無題のメモ', elements: [], strokes: [] } });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      <Toolbar onNewNote={handleNewNote} onShowNotesList={() => setShowNotesList(true)} />

      <div style={{
        position: 'fixed', top: 56, left: 0, right: 140, bottom: 0,
        overflow: 'hidden',
      }}>

        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
          backgroundSize: `${24 * canvas.scale}px ${24 * canvas.scale}px`,
          backgroundPosition: `${canvas.offsetX % (24 * canvas.scale)}px ${canvas.offsetY % (24 * canvas.scale)}px`,
        }} />

        <EditorCanvas
          width={canvasSize.w}
          height={canvasSize.h}
          onSelectElement={(id, multi) => dispatch({ type: 'editor/selectElement', payload: { id, multi } })}
        />

        <div style={{ position: 'absolute', bottom: 16, right: 16, fontSize: 11, color: '#9ca3af', backgroundColor: 'rgba(255,255,255,0.8)', padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(4px)', border: '1px solid #e5e7eb' }}>
          {Math.round(canvas.scale * 100)}%
        </div>
      </div>

      <ElementPalette />
      <LayerPanel />

      {showNotesList && (
        <SaveLoadPanel onClose={() => setShowNotesList(false)} onSave={() => { handleSave(); setShowNotesList(false); }} />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <Provider store={store}>
    <Editor />
  </Provider>
);

export default App;
