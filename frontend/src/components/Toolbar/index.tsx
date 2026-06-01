import React from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setActiveTool, setPenSettings, clearStrokes, setNoteTitle, deleteSelectedElements } from '../../store/slices/editorSlice';

interface ToolbarProps {
  onNewNote: () => void;
  onShowNotesList: () => void;
}

const tools = [
  { id: 'pen' as const, label: '✏️', title: 'ペン' },
  { id: 'eraser' as const, label: '⬜', title: '消しゴム' },
  { id: 'select' as const, label: '↖', title: '選択' },
  { id: 'hand' as const, label: '✋', title: '移動' },
];

const Toolbar: React.FC<ToolbarProps> = ({ onNewNote, onShowNotesList }) => {
  const dispatch = useAppDispatch();
  const { activeTool, penSettings, noteTitle, isDirty, selectedElementIds } = useAppSelector(s => s.editor);

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
      <input
        value={noteTitle}
        onChange={e => dispatch(setNoteTitle(e.target.value))}
        style={{ border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: '#1a1a2e', background: 'transparent', width: 200, borderBottom: '1px solid transparent' }}
        onFocus={e => (e.target.style.borderBottomColor = '#3b82f6')}
        onBlur={e => (e.target.style.borderBottomColor = 'transparent')}
      />
      {isDirty && <span style={{ fontSize: 11, color: '#9ca3af' }}>未保存</span>}
      {divider}

      {tools.map(t => (
        <button key={t.id} title={t.title} style={btn(activeTool === t.id)} onClick={() => dispatch(setActiveTool(t.id))}>
          {t.label}
        </button>
      ))}
      {divider}

      {(activeTool === 'pen' || activeTool === 'eraser') && <>
        {activeTool === 'pen' && (
          <input type="color" value={penSettings.color}
            onChange={e => dispatch(setPenSettings({ color: e.target.value }))}
            title="色" style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>太さ</span>
          <input type="range" min={1} max={30} value={penSettings.width}
            onChange={e => dispatch(setPenSettings({ width: +e.target.value }))} style={{ width: 60 }} />
        </div>
        {activeTool === 'pen' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>透明度</span>
            <input type="range" min={0.1} max={1} step={0.05} value={penSettings.opacity}
              onChange={e => dispatch(setPenSettings({ opacity: +e.target.value }))} style={{ width: 60 }} />
          </div>
        )}
        <button title="全消去" onClick={() => dispatch(clearStrokes())} style={{ ...btn(false), color: '#ef4444' }}>🗑</button>
        {divider}
      </>}

      {selectedElementIds.length > 0 && <>
        <button title="選択削除" onClick={() => dispatch(deleteSelectedElements())} style={{ ...btn(false), color: '#ef4444' }}>🗑</button>
        {divider}
      </>}

      <div style={{ flex: 1 }} />
      <button onClick={onNewNote} style={{ ...btn(false), width: 'auto', padding: '0 12px', fontSize: 13, color: '#374151' }}>＋ 新規</button>
      <button onClick={onShowNotesList} title="メモ一覧" style={{ ...btn(false), fontSize: 18 }}>📂</button>
    </div>
  );
};

export default Toolbar;
