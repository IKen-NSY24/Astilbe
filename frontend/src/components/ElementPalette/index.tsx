import React from 'react';
import { useAppDispatch } from '../../hooks';
import { addSticky, addTextElement, addShape } from '../../store/slices/editorSlice';

const CENTER = { x: 800, y: 500 };

const items = [
  { label: '🗒️', title: '付箋', action: (dispatch: any) => dispatch(addSticky(CENTER)) },
  { label: '𝗧', title: 'テキスト', action: (dispatch: any) => dispatch(addTextElement(CENTER)) },
  { label: '⬜', title: '四角形', action: (dispatch: any) => dispatch(addShape({ ...CENTER, shapeType: 'rectangle' })) },
  { label: '⭕', title: '楕円', action: (dispatch: any) => dispatch(addShape({ ...CENTER, shapeType: 'circle' })) },
  { label: '→', title: '矢印', action: (dispatch: any) => dispatch(addShape({ ...CENTER, shapeType: 'arrow' })) },
  { label: '—', title: '直線', action: (dispatch: any) => dispatch(addShape({ ...CENTER, shapeType: 'line' })) },
];

const ElementPalette: React.FC = () => {
  const dispatch = useAppDispatch();
  return (
    <div style={{
      position: 'fixed', top: 56, right: 0, width: 140, bottom: 0,
      backgroundColor: 'white', borderLeft: '1px solid #e5e7eb',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '16px 8px', gap: 8, zIndex: 100,
    }}>
      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>要素を追加</span>
      {items.map(item => (
        <button key={item.title} title={item.title} onClick={() => item.action(dispatch)}
          style={{
            width: '100%', height: 40, border: '1px solid #e5e7eb', borderRadius: 8,
            backgroundColor: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
        >
          <span style={{ fontSize: 16 }}>{item.label}</span>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{item.title}</span>
        </button>
      ))}
    </div>
  );
};

export default ElementPalette;
