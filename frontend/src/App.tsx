import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch } from './hooks';
import { EditorCanvas } from './components/Canvas';
import Toolbar from './components/Toolbar';
import ElementPalette from './components/ElementPalette';
import { clearSelection, selectElement, deleteElement } from './store/slices/editorSlice';

const Editor: React.FC = () => {
  const dispatch = useAppDispatch();
  const [canvasSize, setCanvasSize] = useState({ w: window.innerWidth - 140, h: window.innerHeight - 56 });

  useEffect(() => {
    const onResize = () => setCanvasSize({ w: window.innerWidth - 140, h: window.innerHeight - 56 });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(clearSelection());
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // テキスト編集中（textarea/input にフォーカス）は誤削除しないようスキップし、
        // 入力中の文字削除として通常通り振る舞わせる
        const ae = document.activeElement;
        if (ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT')) return;
        dispatch(deleteElement());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      <Toolbar />

      <div style={{
        position: 'fixed', top: 56, left: 0, right: 140, bottom: 0,
        overflow: 'hidden',
      }}>

        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
          backgroundSize: `24px 24px`,
        }} />

        <EditorCanvas
          width={canvasSize.w}
          height={canvasSize.h}
          onSelectElement={(id) => dispatch(selectElement(id))}
        />
      </div>

      <ElementPalette />
    </div>
  );
};

const App: React.FC = () => (
  <Provider store={store}>
    <Editor />
  </Provider>
);

export default App;
