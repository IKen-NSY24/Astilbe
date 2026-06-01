import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  startStroke, continueStroke, endStroke,
  selectElement, clearSelection, updateElement,
} from '../../store/slices/editorSlice';
import { CanvasElement, StrokeData, StickyElement, TextElement, ShapeElement } from '../../types';

const getCanvasPoint = (canvas: HTMLCanvasElement, e: React.MouseEvent): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const drawStrokes = (ctx: CanvasRenderingContext2D, strokes: StrokeData[]) => {
  strokes.forEach(stroke => {
    if (stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.globalAlpha = stroke.opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const mx = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const my = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, mx, my);
    }
    ctx.lineTo(stroke.points[stroke.points.length - 1].x, stroke.points[stroke.points.length - 1].y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
};

interface DrawingCanvasProps {
  width: number;
  height: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useAppDispatch();
  const { activeTool, currentStrokes, activeStroke } = useAppSelector(s => s.editor);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    drawStrokes(ctx, currentStrokes);
    if (activeStroke) drawStrokes(ctx, [activeStroke]);
  }, [currentStrokes, activeStroke, width, height]);

  const handleStart = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'pen' && activeTool !== 'eraser') return;
    isDrawing.current = true;
    const pt = getCanvasPoint(canvasRef.current!, e);
    dispatch(startStroke(pt));
  }, [activeTool, dispatch]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const pt = getCanvasPoint(canvasRef.current!, e);
    dispatch(continueStroke(pt));
  }, [dispatch]);

  const handleEnd = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    dispatch(endStroke());
  }, [dispatch]);

  const cursor = activeTool === 'pen' ? 'crosshair' : activeTool === 'eraser' ? 'cell' : 'default';

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, cursor }}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    />
  );
};

// ── Element Renderer ──────────────────────────────────────────────────────────

const StickyNote: React.FC<{ el: StickyElement; isSelected: boolean; onSelect: (id: string, multi: boolean) => void }> = ({ el, isSelected, onSelect }) => {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ex: 0, ey: 0 });

  const stickyColors = [
    { bg: '#fef08a', text: '#1a1a2e' }, { bg: '#86efac', text: '#1a1a2e' },
    { bg: '#93c5fd', text: '#1a1a2e' }, { bg: '#f9a8d4', text: '#1a1a2e' },
    { bg: '#fdba74', text: '#1a1a2e' }, { bg: '#c4b5fd', text: '#1a1a2e' },
  ];

  return (
    <div
      style={{
        position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
        backgroundColor: el.bgColor, borderRadius: 4,
        boxShadow: isSelected ? '0 0 0 2px #3b82f6, 4px 6px 20px rgba(0,0,0,0.15)' : '4px 6px 20px rgba(0,0,0,0.1)',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none', zIndex: el.zIndex + 10,
        transform: `rotate(${el.rotation}deg)`,
        transition: dragging ? 'none' : 'box-shadow 0.15s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseDown={(e) => {
        if (editing) return;
        e.stopPropagation();
        onSelect(el.id, e.metaKey || e.ctrlKey);
        setDragging(true);
        dragStart.current = { mx: e.clientX, my: e.clientY, ex: el.x, ey: el.y };
        const onMove = (ev: MouseEvent) => {
          dispatch(updateElement({ id: el.id, updates: { x: dragStart.current.ex + ev.clientX - dragStart.current.mx, y: dragStart.current.ey + ev.clientY - dragStart.current.my } }));
        };
        const onUp = () => { setDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      }}
    >
      <div style={{ padding: '8px 10px 4px', display: 'flex', gap: 4, justifyContent: 'flex-end', opacity: isSelected ? 1 : 0, transition: 'opacity 0.15s' }}>
        {stickyColors.map(c => (
          <div key={c.bg} onClick={(e) => { e.stopPropagation(); dispatch(updateElement({ id: el.id, updates: { bgColor: c.bg, textColor: c.text } })); }}
            style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: c.bg, border: el.bgColor === c.bg ? '2px solid #1a1a2e' : '1px solid rgba(0,0,0,0.2)', cursor: 'pointer' }} />
        ))}
      </div>
      <textarea
        value={el.content}
        onDoubleClick={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        onChange={(e) => dispatch(updateElement({ id: el.id, updates: { content: e.target.value } }))}
        readOnly={!editing}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
          padding: '4px 12px 12px', fontFamily: '"Noto Sans JP", sans-serif', fontSize: el.fontSize,
          color: el.textColor, cursor: editing ? 'text' : 'inherit', lineHeight: 1.5,
        }}
        onMouseDown={(e) => { if (editing) e.stopPropagation(); }}
      />
    </div>
  );
};

const ShapeEl: React.FC<{ el: ShapeElement; isSelected: boolean; onSelect: (id: string, multi: boolean) => void }> = ({ el, isSelected, onSelect }) => {
  const dispatch = useAppDispatch();
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ex: 0, ey: 0 });
  const renderShape = () => {
    const w = el.width, h = el.height;
    if (el.shapeType === 'circle') return <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - el.strokeWidth} ry={h / 2 - el.strokeWidth} fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeWidth} />;
    if (el.shapeType === 'arrow') return <path d={`M 0 ${h / 2} L ${w * 0.65} ${h / 2} M ${w * 0.5} ${h * 0.2} L ${w} ${h / 2} L ${w * 0.5} ${h * 0.8}`} fill="none" stroke={el.strokeColor} strokeWidth={el.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />;
    if (el.shapeType === 'line') return <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke={el.strokeColor} strokeWidth={el.strokeWidth} strokeLinecap="round" />;
    return <rect x={el.strokeWidth / 2} y={el.strokeWidth / 2} width={w - el.strokeWidth} height={h - el.strokeWidth} fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeWidth} rx={4} />;
  };
  return (
    <div style={{
      position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
      opacity: el.opacity, cursor: dragging ? 'grabbing' : 'grab', zIndex: el.zIndex + 10,
      outline: isSelected ? '2px solid #3b82f6' : 'none', outlineOffset: 2,
    }}
      onMouseDown={(e) => {
        e.stopPropagation(); onSelect(el.id, e.metaKey || e.ctrlKey); setDragging(true);
        dragStart.current = { mx: e.clientX, my: e.clientY, ex: el.x, ey: el.y };
        const onMove = (ev: MouseEvent) => dispatch(updateElement({ id: el.id, updates: { x: dragStart.current.ex + ev.clientX - dragStart.current.mx, y: dragStart.current.ey + ev.clientY - dragStart.current.my } }));
        const onUp = () => { setDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
      }}>
      <svg width={el.width} height={el.height} style={{ display: 'block' }}>{renderShape()}</svg>
    </div>
  );
};

const TextEl: React.FC<{ el: TextElement; isSelected: boolean; onSelect: (id: string, multi: boolean) => void }> = ({ el, isSelected, onSelect }) => {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ex: 0, ey: 0 });
  return (
    <div style={{
      position: 'absolute', left: el.x, top: el.y, minWidth: el.width, minHeight: el.height,
      outline: isSelected ? '2px solid #3b82f6' : '2px solid transparent', outlineOffset: 2,
      cursor: dragging ? 'grabbing' : 'grab', zIndex: el.zIndex + 10, padding: 4,
    }}
      onMouseDown={(e) => {
        if (editing) return; e.stopPropagation(); onSelect(el.id, e.metaKey || e.ctrlKey); setDragging(true);
        dragStart.current = { mx: e.clientX, my: e.clientY, ex: el.x, ey: el.y };
        const onMove = (ev: MouseEvent) => dispatch(updateElement({ id: el.id, updates: { x: dragStart.current.ex + ev.clientX - dragStart.current.mx, y: dragStart.current.ey + ev.clientY - dragStart.current.my } }));
        const onUp = () => { setDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
      }}
      onDoubleClick={() => setEditing(true)}>
      {editing ? (
        <textarea autoFocus value={el.content} onChange={(e) => dispatch(updateElement({ id: el.id, updates: { content: e.target.value } }))}
          onBlur={() => setEditing(false)} onMouseDown={(e) => e.stopPropagation()}
          style={{ background: 'transparent', border: 'none', outline: 'none', resize: 'none', width: '100%', minHeight: 40, fontFamily: el.fontFamily, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, textAlign: el.align }} />
      ) : (
        <div style={{ fontFamily: el.fontFamily, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, textAlign: el.align, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{el.content}</div>
      )}
    </div>
  );
};

const ElementsLayer: React.FC<{ onSelectElement: (id: string, multi: boolean) => void }> = ({ onSelectElement }) => {
  const { elements, selectedElementIds } = useAppSelector(s => s.editor);
  return (
    <>
      {elements.filter(el => el.visible).map(el => {
        const isSelected = selectedElementIds.includes(el.id);
        if (el.type === 'sticky') return <StickyNote key={el.id} el={el as StickyElement} isSelected={isSelected} onSelect={onSelectElement} />;
        if (el.type === 'shape') return <ShapeEl key={el.id} el={el as ShapeElement} isSelected={isSelected} onSelect={onSelectElement} />;
        if (el.type === 'text') return <TextEl key={el.id} el={el as TextElement} isSelected={isSelected} onSelect={onSelectElement} />;
        return null;
      })}
    </>
  );
};

export { DrawingCanvas, ElementsLayer };
