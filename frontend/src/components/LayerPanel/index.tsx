import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { updateElement, reorderElement, selectElement, clearSelection } from '../../store/slices/editorSlice';
import { CanvasElement } from '../../types';

const layerLabel = (el: CanvasElement): string => {
  if (el.type === 'sticky') return `📝 ${(el as any).content.slice(0, 12)}`;
  if (el.type === 'text') return `𝗧 ${(el as any).content.slice(0, 12)}`;
  return `⬜ ${(el as any).shapeType}`;
};

const LayerPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { elements, selectedElementIds } = useAppSelector(s => s.editor);
  const [collapsed, setCollapsed] = useState(false);

  if (elements.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, width: 220,
      maxHeight: collapsed ? 36 : 240,
      backgroundColor: 'white', border: '1px solid #e5e7eb',
      borderRadius: '0 8px 0 0', zIndex: 200,
      display: 'flex', flexDirection: 'column',
      boxShadow: '2px -2px 8px rgba(0,0,0,0.06)',
      transition: 'max-height 0.2s', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: '1px solid #e5e7eb',
        cursor: 'pointer', userSelect: 'none',
      }} onClick={() => setCollapsed(!collapsed)}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>レイヤー ({elements.length})</span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{collapsed ? '▲' : '▼'}</span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {[...elements].reverse().map(el => {
          const isSelected = selectedElementIds.includes(el.id);
          return (
            <div key={el.id} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
              backgroundColor: isSelected ? '#eff6ff' : 'transparent',
              cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
            }} onClick={() => isSelected ? dispatch(clearSelection()) : dispatch(selectElement({ id: el.id, multi: false }))}>
              <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: el.locked ? '#9ca3af' : '#1a1a2e' }}>
                {layerLabel(el)}
              </span>
              <button title="表示切替" onClick={e => { e.stopPropagation(); dispatch(updateElement({ id: el.id, updates: { visible: !el.visible } })); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: el.visible ? 1 : 0.3, padding: 2 }}>👁</button>
              <button title="ロック" onClick={e => { e.stopPropagation(); dispatch(updateElement({ id: el.id, updates: { locked: !el.locked } })); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: el.locked ? 1 : 0.3, padding: 2 }}>🔒</button>
              <button title="上へ" onClick={e => { e.stopPropagation(); dispatch(reorderElement({ id: el.id, direction: 'up' })); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, padding: 2 }}>▲</button>
              <button title="下へ" onClick={e => { e.stopPropagation(); dispatch(reorderElement({ id: el.id, direction: 'down' })); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, padding: 2 }}>▼</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayerPanel;
