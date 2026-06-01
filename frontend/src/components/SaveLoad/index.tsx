import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchNotes, deleteNote } from '../../store/slices/notesSlice';
import { Note } from '../../types';

interface SaveLoadPanelProps {
  onClose: () => void;
  onSave: () => void;
}

const SaveLoadPanel: React.FC<SaveLoadPanelProps> = ({ onClose, onSave }) => {
  const dispatch = useAppDispatch();
  const { notes, loading } = useAppSelector(s => s.notes);
  const { noteId, isDirty } = useAppSelector(s => s.editor);

  useEffect(() => { dispatch(fetchNotes()); }, [dispatch]);

  const handleLoad = (note: Note) => {
    dispatch({ type: 'editor/loadNote', payload: note });
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('このメモを削除しますか？')) dispatch(deleteNote(id));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
      onClick={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: 12, width: 500, maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>メモ一覧</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>×</button>
        </div>

        {isDirty && (
          <div style={{ padding: '12px 20px', backgroundColor: '#fef9c3', borderBottom: '1px solid #fde68a', fontSize: 13, color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>現在のメモに未保存の変更があります</span>
            <button onClick={onSave} style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>保存</button>
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>読み込み中...</div>}
          {!loading && notes.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>保存されたメモはありません</div>
          )}
          {notes.map(note => (
            <div key={note.id} onClick={() => handleLoad(note)}
              style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: note.id === noteId ? '#eff6ff' : 'white' }}
              onMouseEnter={e => { if (note.id !== noteId) (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = note.id === noteId ? '#eff6ff' : 'white'; }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{note.title || '無題のメモ'}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                  {note.elements.length}個の要素 · {note.strokes.length}本のストローク
                  {note.updatedAt && ` · ${new Date(note.updatedAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                </div>
              </div>
              <button onClick={e => handleDelete(note.id, e)}
                style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#ef4444', opacity: 0.6, padding: 4 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}>
                🗑
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SaveLoadPanel;
