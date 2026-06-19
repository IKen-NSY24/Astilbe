import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Line, Rect, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  startStroke, continueStroke, endStroke,
  clearSelection, updateElement, addRectangle,
} from '../../store/slices/editorSlice';
import { StrokeData, TextElement, ShapeElement } from '../../types';

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

const TextElementShape: React.FC<{
  el: TextElement; isSelected: boolean; editing: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
}> = ({ el, isSelected, editing, onSelect, onEdit }) => {
  const dispatch = useAppDispatch();
  return (
    <Group
      x={el.x} y={el.y} rotation={el.rotation} draggable
      onMouseDown={(e) => { e.cancelBubble = true; onSelect(el.id); }}
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
  onSelect: (id: string) => void;
}> = ({ el, isSelected, onSelect }) => {
  const dispatch = useAppDispatch();
  const w = el.width, h = el.height;

  let shape: React.ReactNode;
  if (el.shapeType === 'line') {
    shape = <Line points={[0, h / 2, w, h / 2]} stroke={el.strokeColor} strokeWidth={el.strokeWidth} lineCap="round" />;
  } else {
    shape = <Rect x={el.strokeWidth / 2} y={el.strokeWidth / 2}
      width={Math.max(w - el.strokeWidth, 0)} height={Math.max(h - el.strokeWidth, 0)}
      fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeWidth} cornerRadius={4} />;
  }

  return (
    <Group
      x={el.x} y={el.y} rotation={el.rotation} opacity={el.opacity} draggable
      onMouseDown={(e) => { e.cancelBubble = true; onSelect(el.id); }}
      onDragEnd={(e) => dispatch(updateElement({ id: el.id, updates: { x: e.target.x(), y: e.target.y() } }))}
    >
      {shape}
      {isSelected && <Rect x={-2} y={-2} width={w + 4} height={h + 4} stroke="#3b82f6" strokeWidth={2} listening={false} />}
    </Group>
  );
};

// ── Inline text editing overlay (HTML <textarea> placed over the Konva stage) ─
// Konva renders to <canvas>, so text editing needs a real DOM input layered on
// top at the element's on-screen position/size.

interface EditOverlayProps {
  element: TextElement;
  onChange: (content: string) => void;
  onClose: () => void;
}

const EditOverlay: React.FC<EditOverlayProps> = ({ element, onChange, onClose }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, [element.id]);

  return (
    <textarea
      ref={ref}
      value={element.content}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onClose}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
        fontWeight: element.fontWeight,
        color: element.color,
        textAlign: element.align,
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
      }}
    />
  );
};

// ── Stage ─────────────────────────────────────────────────────────────────────

interface EditorCanvasProps {
  width: number;
  height: number;
  onSelectElement: (id: string) => void;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ width, height, onSelectElement }) => {
  const dispatch = useAppDispatch();
  const { activeTool, currentStrokes, activeStroke, elements, selectedId } = useAppSelector(s => s.editor);
  const stageRef = useRef<Konva.Stage>(null);
  const isDrawing = useRef(false);
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
      activeTool === 'eraser' ? 'cell' : 'default';
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
    } else {
      dispatch(clearSelection());
    }
  }, [activeTool, dispatch]);

  const handleMouseMove = useCallback(() => {
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
  }, [dispatch, draftRect]);

  const editingElement = editingId
    ? (elements.find(el => el.id === editingId && el.type === 'text') as TextElement | undefined)
    : undefined;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Layer listening={false}>
          {currentStrokes.map((stroke, i) => <StrokeLine key={i} stroke={stroke} />)}
          {activeStroke && <StrokeLine stroke={activeStroke} />}
        </Layer>
        <Layer>
          {elements.filter(el => el.visible).map(el => {
            const isSelected = selectedId === el.id;
            const editing = editingId === el.id;
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
          onChange={(content) => dispatch(updateElement({ id: editingElement.id, updates: { content } }))}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
};

export { EditorCanvas };
