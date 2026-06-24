import React from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setActiveTool, setPenSettings, clearStrokes, deleteElement } from '../../store/slices/editorSlice';

const tools = [
  { id: 'pen' as const, label: '✏️', title: 'ペン' },
  { id: 'line' as const , label: '-', title: '直線'},
  { id: 'rectangle' as const, label: '▭', title: '長方形' },
  { id: 'select' as const, label: '↖', title: '選択' },
];

const Toolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeTool, penSettings, selectedId } = useAppSelector(s => s.editor);

  const btn = (active: boolean): React.CSSProperties => ({
    width: 36, height: 36,
    border: active ? '2px solid #3b82f6' : '1px solid #e5e7eb',
    borderRadius: 8,
    backgroundColor: active ? '#eff6ff' : 'white',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16,
  });

  const divider = <div style={{ width: 1, height: 28, backgroundColor: '#e5e7eb', margin: '0 4px' }} />;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 56,
      backgroundColor: 'white', borderBottom: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px',
      zIndex: 1000, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginRight: 4 }}>MemoEditor</span>
      {divider}

      {tools.map(t => (
        <button key={t.id} title={t.title} style={btn(activeTool === t.id)} onClick={() => dispatch(setActiveTool(t.id))}>
          {t.label}
        </button>
      ))}
      {divider}

      {activeTool === 'pen' && <>
        <input type="color" value={penSettings.color}
          onChange={e => dispatch(setPenSettings({ color: e.target.value }))}
          title="色" style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>太さ</span>
          <input type="range" min={1} max={30} value={penSettings.width}
            onChange={e => dispatch(setPenSettings({ width: +e.target.value }))} style={{ width: 60 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>透明度</span>
          <input type="range" min={0.1} max={1} step={0.05} value={penSettings.opacity}
            onChange={e => dispatch(setPenSettings({ opacity: +e.target.value }))} style={{ width: 60 }} />
        </div>
        <button title="全消去" onClick={() => dispatch(clearStrokes())} style={{ ...btn(false), color: '#ef4444' }}>🗑</button>
        {divider}
      </>}

      {selectedId && <>
        <button title="選択削除" onClick={() => dispatch(deleteElement())} style={{ ...btn(false), color: '#ef4444' }}>🗑</button>
        {divider}
      </>}

      <div style={{ flex: 1 }} />
    </div>
  );
};

export default Toolbar;
