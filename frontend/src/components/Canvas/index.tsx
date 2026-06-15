import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Line, Rect, Ellipse, Arrow, Text, Group, Circle } from 'react-konva';
import Konva from 'konva';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  startStroke, continueStroke, endStroke,
  clearSelection, updateElement, setCanvasTransform, addRectangle,
} from '../../store/slices/editorSlice';
import { StrokeData, StickyElement, TextElement, ShapeElement, CanvasState } from '../../types';

const toPoints = (stroke: StrokeData): number[] => stroke.points.flatMap(p => [p.x, p.y]);

const StrokeLine: React.FC<{ stroke: StrokeData }> = ({ stroke }) => (
  <Line
    points={toPoints(stroke)}
    stroke={stroke.color}
    strokeWidth={stroke.width}
    opacity={stroke.opacity}
    lineCap="round"
    lineJoin="round"
    tension={0.4}
  />
);

// ── Element renderers ─────────────────────────────────────────────────────────

const STICKY_COLORS = [
  { bg: '#fef08a', text: '#1a1a2e' }, { bg: '#86efac', text: '#1a1a2e' },
  { bg: '#93c5fd', text: '#1a1a2e' }, { bg: '#f9a8d4', text: '#1a1a2e' },
  { bg: '#fdba74', text: '#1a1a2e' }, { bg: '#c4b5fd', text: '#1a1a2e' },
];

const STICKY_TEXT_INSET = { left: 12, top: 32, right: 12, bottom: 12 };

const StickyNoteShape: React.FC<{
  el: StickyElement; isSelected: boolean; editing: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onEdit: (id: string) => void;
}> = ({ el, isSelected, editing, onSelect, onEdit }) => {
  const dispatch = useAppDispatch();
  return (
    <Group
      x={el.x} y={el.y} rotation={el.rotation} draggable
      onMouseDown={(e) => { e.cancelBubble = true; onSelect(el.id, e.evt.metaKey || e.evt.ctrlKey); }}
      onDblClick={() => onEdit(el.id)}
      onDragEnd={(e) => dispatch(updateElement({ id: el.id, updates: { x: e.target.x(), y: e.target.y() } }))}
    >
      <Rect
        width={el.width} height={el.height} fill={el.bgColor} cornerRadius={4}
        shadowColor="black" shadowOffsetX={4} shadowOffsetY={6}
        shadowBlur={isSelected ? 22 : 16} shadowOpacity={isSelected ? 0.18 : 0.12}
        stroke={isSelected ? '#3b82f6' : undefined} strokeWidth={isSelected ? 2 : 0}
      />
      {isSelected && STICKY_COLORS.map((c, i) => (
        <Circle
          key={c.bg}
          x={el.width - 16 - (STICKY_COLORS.length - 1 - i) * 18} y={18} radius={6}
          fill={c.bg}
          stroke={el.bgColor === c.bg ? '#1a1a2e' : 'rgba(0,0,0,0.25)'}
          strokeWidth={el.bgColor === c.bg ? 2 : 1}
          onMouseDown={(e) => {
            e.cancelBubble = true;
            dispatch(updateElement({ id: el.id, updates: { bgColor: c.bg, textColor: c.text } }));
          }}
        />
      ))}
      {!editing && (
        <Text
          text={el.content}
          x={STICKY_TEXT_INSET.left} y={STICKY_TEXT_INSET.top}
          width={el.width - STICKY_TEXT_INSET.left - STICKY_TEXT_INSET.right}
          height={el.height - STICKY_TEXT_INSET.top - STICKY_TEXT_INSET.bottom}
          fontSize={el.fontSize} fontFamily='"Noto Sans JP", sans-serif'
          fill={el.textColor} lineHeight={1.5} wrap="word"
        />
      )}
    </Group>
  );
};

const TextElementShape: React.FC<{
  el: TextElement; isSelected: boolean; editing: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onEdit: (id: string) => void;
}> = ({ el, isSelected, editing, onSelect, onEdit }) => {
  const dispatch = useAppDispatch();
  return (
    <Group
      x={el.x} y={el.y} rotation={el.rotation} draggable
      onMouseDown={(e) => { e.cancelBubble = true; onSelect(el.id, e.evt.metaKey || e.evt.ctrlKey); }}
      onDblClick={() => onEdit(el.id)}
      onDragEnd={(e) => dispatch(updateElement({ id: el.id, updates: { x: e.target.x(), y: e.target.y() } }))}
    >
      {isSelected && (
        <Rect x={-4} y={-4} width={el.width + 8} height={el.height + 8}
          stroke="#3b82f6" strokeWidth={2} listening={false} />
      )}
      {!editing && (
        <Text
          text={el.content} width={el.width} padding={4}
          fontFamily={el.fontFamily} fontSize={el.fontSize}
          fontStyle={el.fontWeight === 'bold' ? 'bold' : 'normal'}
          fill={el.color} align={el.align} wrap="word"
        />
      )}
    </Group>
  );
};

const ShapeElementShape: React.FC<{
  el: ShapeElement; isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
}> = ({ el, isSelected, onSelect }) => {
  const dispatch = useAppDispatch();
  const w = el.width, h = el.height;

  let shape: React.ReactNode;
  if (el.shapeType === 'circle') {
    shape = <Ellipse x={w / 2} y={h / 2} radiusX={Math.max(w / 2 - el.strokeWidth, 0)} radiusY={Math.max(h / 2 - el.strokeWidth, 0)}
      fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeWidth} />;
  } else if (el.shapeType === 'arrow') {
    shape = <Arrow points={[0, h / 2, w, h / 2]} fill={el.strokeColor} stroke={el.strokeColor}
      strokeWidth={el.strokeWidth} pointerLength={12} pointerWidth={12} lineCap="round" lineJoin="round" />;
  } else if (el.shapeType === 'line') {
    shape = <Line points={[0, h / 2, w, h / 2]} stroke={el.strokeColor} strokeWidth={el.strokeWidth} lineCap="round" />;
  } else {
    shape = <Rect x={el.strokeWidth / 2} y={el.strokeWidth / 2}
      width={Math.max(w - el.strokeWidth, 0)} height={Math.max(h - el.strokeWidth, 0)}
      fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeWidth} cornerRadius={4} />;
  }

  return (
    <Group
      x={el.x} y={el.y} rotation={el.rotation} opacity={el.opacity} draggable
      onMouseDown={(e) => { e.cancelBubble = true; onSelect(el.id, e.evt.metaKey || e.evt.ctrlKey); }}
      onDragEnd={(e) => dispatch(updateElement({ id: el.id, updates: { x: e.target.x(), y: e.target.y() } }))}
    >
      {shape}
      {isSelected && <Rect x={-2} y={-2} width={w + 4} height={h + 4} stroke="#3b82f6" strokeWidth={2} listening={false} />}
    </Group>
  );
};

// ── Inline text editing overlay (HTML <textarea> placed over the Konva stage) ─
// Konva renders to <canvas>, so text editing needs a real DOM input layered on
// top at the element's on-screen position/size, kept in sync with stage pan/zoom.

interface EditOverlayProps {
  element: StickyElement | TextElement;
  canvas: CanvasState;
  onChange: (content: string) => void;
  onClose: () => void;
}

const EditOverlay: React.FC<EditOverlayProps> = ({ element, canvas, onChange, onClose }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, [element.id]);

  let rect: { x: number; y: number; w: number; h: number };
  let textStyle: React.CSSProperties;
  if (element.type === 'sticky') {
    rect = {
      x: element.x + STICKY_TEXT_INSET.left,
      y: element.y + STICKY_TEXT_INSET.top,
      w: element.width - STICKY_TEXT_INSET.left - STICKY_TEXT_INSET.right,
      h: element.height - STICKY_TEXT_INSET.top - STICKY_TEXT_INSET.bottom,
    };
    textStyle = { fontFamily: '"Noto Sans JP", sans-serif', fontWeight: 'normal', color: element.textColor, textAlign: 'left' };
  } else {
    rect = { x: element.x, y: element.y, w: element.width, h: element.height };
    textStyle = { fontFamily: element.fontFamily, fontWeight: element.fontWeight, color: element.color, textAlign: element.align };
  }

  return (
    <textarea
      ref={ref}
      value={element.content}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onClose}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: canvas.offsetX + rect.x * canvas.scale,
        top: canvas.offsetY + rect.y * canvas.scale,
        width: rect.w * canvas.scale,
        height: rect.h * canvas.scale,
        fontSize: element.fontSize * canvas.scale,
        lineHeight: 1.5,
        margin: 0,
        padding: 0,
        border: 'none',
        outline: '2px solid #3b82f6',
        outlineOffset: 2,
        resize: 'none',
        boxSizing: 'border-box',
        background: 'transparent',
        zIndex: 50,
        ...textStyle,
      }}
    />
  );
};

// ── Stage ─────────────────────────────────────────────────────────────────────

interface EditorCanvasProps {
  width: number;
  height: number;
  onSelectElement: (id: string, multi: boolean) => void;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ width, height, onSelectElement }) => {
  const dispatch = useAppDispatch();
  const { activeTool, currentStrokes, activeStroke, elements, selectedElementIds, canvas } = useAppSelector(s => s.editor);
  const stageRef = useRef<Konva.Stage>(null);
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const isDrawingRect = useRef(false);
  const rectStart = useRef({ x: 0, y: 0 });
  const [draftRect, setDraftRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.container().style.cursor =
      activeTool === 'pen' ? 'crosshair' :
      activeTool === 'rectangle' ? 'crosshair' :
      activeTool === 'eraser' ? 'cell' :
      activeTool === 'hand' ? 'grab' : 'default';
  }, [activeTool]);

  useEffect(() => {
    if (editingId && !elements.some(el => el.id === editingId)) setEditingId(null);
  }, [elements, editingId]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage || e.target !== stage) return;
    setEditingId(null);
    if (activeTool === 'pen' || activeTool === 'eraser') {
      const pos = stage.getRelativePointerPosition();
      if (!pos) return;
      isDrawing.current = true;
      dispatch(startStroke(pos));
    } else if (activeTool === 'rectangle') {
      const pos = stage.getRelativePointerPosition();
      if (!pos) return;
      isDrawingRect.current = true;
      rectStart.current = { x: pos.x, y: pos.y };
      setDraftRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    } else if (activeTool === 'hand') {
      isPanning.current = true;
      panStart.current = { mx: e.evt.clientX, my: e.evt.clientY, ox: canvas.offsetX, oy: canvas.offsetY };
    } else {
      dispatch(clearSelection());
    }
  }, [activeTool, canvas.offsetX, canvas.offsetY, dispatch]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    if (isDrawing.current) {
      const pos = stage.getRelativePointerPosition();
      if (pos) dispatch(continueStroke(pos));
    } else if (isDrawingRect.current) {
      const pos = stage.getRelativePointerPosition();
      if (!pos) return;
      const s = rectStart.current;
      // どの方向にドラッグしても始点・終点から左上/右下を求める
      setDraftRect({
        x: Math.min(s.x, pos.x),
        y: Math.min(s.y, pos.y),
        width: Math.abs(pos.x - s.x),
        height: Math.abs(pos.y - s.y),
      });
    } else if (isPanning.current) {
      dispatch(setCanvasTransform({
        offsetX: panStart.current.ox + e.evt.clientX - panStart.current.mx,
        offsetY: panStart.current.oy + e.evt.clientY - panStart.current.my,
      }));
    }
  }, [dispatch]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing.current) {
      isDrawing.current = false;
      dispatch(endStroke());
    }
    if (isDrawingRect.current) {
      isDrawingRect.current = false;
      // 極端に小さい矩形（クリックのみ等）は無視する
      if (draftRect && draftRect.width > 3 && draftRect.height > 3) {
        dispatch(addRectangle(draftRect));
      }
      setDraftRect(null);
    }
    isPanning.current = false;
  }, [dispatch, draftRect]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    if (e.evt.ctrlKey || e.evt.metaKey) {
      e.evt.preventDefault();
      const delta = e.evt.deltaY > 0 ? 0.9 : 1.1;
      dispatch(setCanvasTransform({ scale: Math.max(0.25, Math.min(3, canvas.scale * delta)) }));
    }
  }, [canvas.scale, dispatch]);

  const editingElement = editingId
    ? (elements.find(el => el.id === editingId) as StickyElement | TextElement | undefined)
    : undefined;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        x={canvas.offsetX}
        y={canvas.offsetY}
        scaleX={canvas.scale}
        scaleY={canvas.scale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <Layer listening={false}>
          {currentStrokes.map((stroke, i) => <StrokeLine key={i} stroke={stroke} />)}
          {activeStroke && <StrokeLine stroke={activeStroke} />}
        </Layer>
        <Layer>
          {elements.filter(el => el.visible).map(el => {
            const isSelected = selectedElementIds.includes(el.id);
            const editing = editingId === el.id;
            if (el.type === 'sticky') return (
              <StickyNoteShape key={el.id} el={el} isSelected={isSelected} editing={editing}
                onSelect={onSelectElement} onEdit={setEditingId} />
            );
            if (el.type === 'shape') return (
              <ShapeElementShape key={el.id} el={el} isSelected={isSelected} onSelect={onSelectElement} />
            );
            if (el.type === 'text') return (
              <TextElementShape key={el.id} el={el} isSelected={isSelected} editing={editing}
                onSelect={onSelectElement} onEdit={setEditingId} />
            );
            return null;
          })}
        </Layer>
        {draftRect && (
          <Layer listening={false}>
            <Rect
              x={draftRect.x} y={draftRect.y}
              width={draftRect.width} height={draftRect.height}
              stroke="#1a1a2e" strokeWidth={2} dash={[6, 4]}
            />
          </Layer>
        )}
      </Stage>
      {editingElement && (
        <EditOverlay
          element={editingElement}
          canvas={canvas}
          onChange={(content) => dispatch(updateElement({ id: editingElement.id, updates: { content } }))}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
};

export { EditorCanvas };
