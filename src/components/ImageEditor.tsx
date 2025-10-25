'use client';

import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Circle, Rect, Text, Arrow, Image as KonvaImage, Group, Transformer } from 'react-konva';
import useImage from 'use-image';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

type Tool = 'select' | 'arrow' | 'rect' | 'circle' | 'text' | 'mosaic' | 'spotlight';

interface DrawElement {
  id: number;
  tool: Tool;
  color: string;
  points?: number[];
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  radius?: number;
  // NEW: support proper resizing
  fontSize?: number; // for text
  strokeWidth?: number; // for vector stroke thickness (rect/circle/arrow)
  pointerLength?: number; // for arrow head size
  pointerWidth?: number; // for arrow head size
}

export default function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const [image] = useImage(imageUrl);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#ff0000');
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawElement | null>(null);
  const stageRef = useRef<any>(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [textCanvasPosition, setTextCanvasPosition] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const transformerRef = useRef<any>(null);
  const selectedShapeRef = useRef<any>(null);

  // Attach transformer to selected shape — also when geometry updates
  useEffect(() => {
    console.log('Selected ID changed:', selectedId);
    console.log('Selected shape ref:', selectedShapeRef.current);

    if (selectedId !== null && selectedShapeRef.current) {
      if (transformerRef.current) {
        transformerRef.current.nodes([selectedShapeRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
        console.log('Transformer attached to:', selectedShapeRef.current);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isAddingText) {
        e.preventDefault();
        setSpacePressed(true);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null && !isAddingText) {
        e.preventDefault();
        setElements((prev) => prev.filter((el) => el.id !== selectedId));
        setSelectedId(null);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedId, isAddingText]);

  // Zoom functions - TEMPORARILY DISABLED FOR TESTING
  // const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 3));
  // const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.3));
  // const handleZoomReset = () => {
  //   setScale(1);
  //   setStagePos({ x: 0, y: 0 });
  // };

  const screenToCanvas = (screenX: number, screenY: number) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    return {
      x: (screenX - stage.x()) / scale,
      y: (screenY - stage.y()) / scale,
    };
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    // TEMPORARILY DISABLED FOR TESTING
    // const stage = stageRef.current;
    // const oldScale = stage.scaleX();
    // const pointer = stage.getPointerPosition();
    // const mousePointTo = {
    //   x: (pointer.x - stage.x()) / oldScale,
    //   y: (pointer.y - stage.y()) / oldScale,
    // };
    // const newScale = e.evt.deltaY < 0 ? oldScale * 1.05 : oldScale / 1.05;
    // const clamped = Math.max(0.3, Math.min(3, newScale));
    // setScale(clamped);
    // setStagePos({ x: pointer.x - mousePointTo.x * clamped, y: pointer.y - mousePointTo.y * clamped });
  };

  const handleMouseDown = (e: any) => {
    if (isAddingText) return;
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();

    // SELECT first: allow clicking shapes even while holding Space
    if (tool === 'select') {
      const clickedOnShape = e.target !== stage && e.target.getType() !== 'Image';
      if (clickedOnShape) return; // shape handler will run
      const clickedOnEmpty = e.target === stage || e.target.getType() === 'Image';
      if (clickedOnEmpty) setSelectedId(null);
      return;
    }

    // PAN (Space or middle mouse)
    if (spacePressed || e.evt.button === 1) {
      e.evt.preventDefault();
      setIsPanning(true);
      setPanStart({ x: pointerPos.x - stagePos.x, y: pointerPos.y - stagePos.y });
      return;
    }

    const pos = screenToCanvas(pointerPos.x, pointerPos.y);

    // TEXT: show inline input
    if (tool === 'text') {
      const stageBox = stage.container().getBoundingClientRect();
      const screenX = stageBox.left + pointerPos.x;
      const screenY = stageBox.top + pointerPos.y;
      setTextPosition({ x: screenX, y: screenY });
      setTextCanvasPosition({ x: pos.x, y: pos.y });
      setIsAddingText(true);
      setTextValue('');
      return;
    }

    // START drawing
    setIsDrawing(true);
    const newElement: DrawElement = {
      id: Date.now(),
      tool,
      color,
      points: tool === 'arrow' ? [pos.x, pos.y, pos.x, pos.y] : undefined,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      radius: 0,
      text: undefined,
      fontSize: 32,
      strokeWidth: 4,
      pointerLength: 20,
      pointerWidth: 20,
    };
    setCurrentElement(newElement);
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();

    if (isPanning) {
      setStagePos({ x: pointerPos.x - panStart.x, y: pointerPos.y - panStart.y });
      return;
    }
    if (!isDrawing || !currentElement) return;

    const pos = screenToCanvas(pointerPos.x, pointerPos.y);

    if (tool === 'arrow') {
      setCurrentElement({ ...currentElement, points: [currentElement.x, currentElement.y, pos.x, pos.y] });
    } else if (tool === 'rect' || tool === 'mosaic' || tool === 'spotlight') {
      setCurrentElement({ ...currentElement, width: pos.x - currentElement.x, height: pos.y - currentElement.y });
    } else if (tool === 'circle') {
      const rx = Math.abs(pos.x - currentElement.x);
      const ry = Math.abs(pos.y - currentElement.y);
      const r = Math.max(rx, ry);
      setCurrentElement({ ...currentElement, radius: r, width: r * 2, height: r * 2 });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentElement && (currentElement.width !== 0 || currentElement.height !== 0 || currentElement.points)) {
      setElements((prev) => [...prev, currentElement]);
    }
    setCurrentElement(null);
  };

  const handleSave = async () => {
    const stage = stageRef.current;
    const originalScale = stage.scaleX();
    const originalPos = { x: stage.x(), y: stage.y() };
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    stage.scale({ x: originalScale, y: originalScale });
    stage.position(originalPos);
    const response = await fetch(dataURL);
    const blob = await response.blob();
    onSave(blob);
  };

  const handleUndo = () => {
    setElements((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  };

  const handleFinishText = () => {
    if (textValue.trim() && textCanvasPosition) {
      const textElement: DrawElement = {
        id: Date.now(),
        tool: 'text',
        color,
        x: textCanvasPosition.x,
        y: textCanvasPosition.y,
        width: 200,  // Set default width (was 0)
        height: 40,  // Set default height (was 0)
        text: textValue,
        radius: 0,
        fontSize: 32,
      };
      console.log('Creating text element:', textElement);
      setElements((prev) => [...prev, textElement]);
    }
    setIsAddingText(false);
    setTextPosition(null);
    setTextCanvasPosition(null);
    setTextValue('');
  };

  const handleCancelText = () => {
    setIsAddingText(false);
    setTextPosition(null);
    setTextCanvasPosition(null);
    setTextValue('');
  };

  // --- helpers for transforms ---
  const applyGroupTransformToArrowPoints = (points: number[], node: any, scaleOnly = false) => {
    // points: absolute coords [x1,y1,x2,y2] in layer space.
    const minX = Math.min(points[0], points[2]);
    const minY = Math.min(points[1], points[3]);
    const rel = [points[0] - minX, points[1] - minY, points[2] - minX, points[3] - minY];

    // Use the group's local transform (relative to layer), so it is NOT affected by Stage zoom
    const tr = node.getTransform().copy();
    // If we only want translation (drag end), zero out scale/rotation
    if (scaleOnly === false && node.scaleX() === 1 && node.scaleY() === 1 && node.rotation() === 0) {
      // drag only — tr already has just translation
    }

    const p1 = tr.point({ x: rel[0], y: rel[1] });
    const p2 = tr.point({ x: rel[2], y: rel[3] });

    return [p1.x, p1.y, p2.x, p2.y];
  };

  const handleElementDragEnd = (e: any, elementId: number) => {
    const node = e.target;

    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== elementId) return el;

        if (el.tool === 'arrow' && el.points) {
          // For arrows in Group: apply transform to points
          const newPoints = applyGroupTransformToArrowPoints(el.points, node, false);

          // Reset Group position ONLY for arrows
          node.position({ x: 0, y: 0 });
          node.scale({ x: 1, y: 1 });
          node.rotation(0);

          return { ...el, points: newPoints };
        }

        // For ALL other shapes: just update x, y
        // DO NOT reset their position
        return { ...el, x: node.x(), y: node.y() };
      })
    );

    // CRITICAL: Only redraw, don't reset position again
    e.target.getLayer()?.batchDraw();

    // DO NOT call e.target.position({ x: 0, y: 0 }) here for non-arrows
  };

  const handleElementClick = (elementId: number) => {
    if (tool === 'select') setSelectedId(elementId);
  };

  const handleTransformEnd = (e: any, elementId: number) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Get the node's current position BEFORE any modifications
    const nodeX = node.x();
    const nodeY = node.y();

    // Reset scale to 1
    node.scaleX(1);
    node.scaleY(1);

    const updatedElements = elements.map((el) => {
      if (el.id === elementId) {
        if (el.tool === 'arrow' && el.points) {
          // For arrows: update points based on transform
          const points = el.points;
          const minX = Math.min(points[0], points[2]);
          const minY = Math.min(points[1], points[3]);
          const relativePoints = [
            points[0] - minX,
            points[1] - minY,
            points[2] - minX,
            points[3] - minY,
          ];

          return {
            ...el,
            points: [
              nodeX + relativePoints[0] * scaleX,
              nodeY + relativePoints[1] * scaleY,
              nodeX + relativePoints[2] * scaleX,
              nodeY + relativePoints[3] * scaleY,
            ],
          };
        } else if (el.tool === 'circle') {
          return {
            ...el,
            x: nodeX,
            y: nodeY,
            radius: (el.radius || 0) * scaleX,
            width: (el.radius || 0) * 2 * scaleX,
            height: (el.radius || 0) * 2 * scaleY,
          };
        } else if (el.tool === 'text') {
          // CRITICAL FIX: For text, keep the transformed position
          // DO NOT reset node position to (0,0)
          return {
            ...el,
            x: nodeX,
            y: nodeY,
            width: (el.width || 200) * scaleX,
            height: (el.height || 40) * scaleY,
            fontSize: (el.fontSize || 32) * Math.max(scaleX, scaleY),
          };
        } else {
          // For rect, mosaic, spotlight
          return {
            ...el,
            x: nodeX,
            y: nodeY,
            width: Math.max(5, el.width * scaleX),
            height: Math.max(5, el.height * scaleY),
          };
        }
      }
      return el;
    });

    setElements(updatedElements);

    // CRITICAL: Only reset position for arrows (which use Group offset)
    // DO NOT reset for text, rect, circle
    if (elements.find(el => el.id === elementId)?.tool === 'arrow') {
      node.position({ x: 0, y: 0 });
    }
    // For other shapes, keep the transformed position
  };

  // Dynamic cursor based on state
  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (spacePressed && tool !== 'select') return 'grab';
    if (tool === 'text') return 'text';
    if (tool === 'arrow' || tool === 'rect' || tool === 'circle' || tool === 'mosaic' || tool === 'spotlight') return 'crosshair';
    return 'default';
  };

  const renderElement = (el: DrawElement, isDraggable = false) => {
    const isSelected = selectedId === el.id;
    const canDrag = isDraggable && tool === 'select';
    const commonProps: any = {
      ref: isSelected ? selectedShapeRef : null,
      draggable: canDrag,
      onClick: () => handleElementClick(el.id),
      onTap: () => handleElementClick(el.id),
      onDragEnd: (e: any) => handleElementDragEnd(e, el.id),
      onTransformEnd: (e: any) => handleTransformEnd(e, el.id),
      onMouseEnter: (e: any) => {
        if (canDrag && !isPanning && !spacePressed) {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'move';
        }
      },
      onMouseLeave: (e: any) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = getCursor();
      },
      shadowColor: isSelected ? 'blue' : undefined,
      shadowBlur: isSelected ? 10 : undefined,
    };

    switch (el.tool) {
      case 'arrow': {
        const pts = el.points || [0, 0, 0, 0];
        const minX = Math.min(pts[0], pts[2]);
        const minY = Math.min(pts[1], pts[3]);
        const rel = [pts[0] - minX, pts[1] - minY, pts[2] - minX, pts[3] - minY];
        return (
          <Group
            key={el.id}
            id={el.id.toString()}
            x={minX}
            y={minY}
            draggable={canDrag}
            onClick={(e: any) => {
              console.log('Arrow clicked:', el.id);
              e.cancelBubble = true;
              if (tool === 'select') {
                setSelectedId(el.id);
                selectedShapeRef.current = e.currentTarget;
              }
            }}
            onTap={(e: any) => {
              e.cancelBubble = true;
              if (tool === 'select') {
                setSelectedId(el.id);
                selectedShapeRef.current = e.currentTarget;
              }
            }}
            onDragEnd={(e: any) => handleElementDragEnd(e, el.id)}
            onTransformEnd={(e: any) => handleTransformEnd(e, el.id)}
            onMouseEnter={(e: any) => {
              if (canDrag && !isPanning && !spacePressed) {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'move';
              }
            }}
            onMouseLeave={(e: any) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = getCursor();
            }}
            shadowColor={isSelected ? 'blue' : undefined}
            shadowBlur={isSelected ? 10 : undefined}
            shadowOpacity={isSelected ? 0.6 : undefined}
          >
            <Arrow
              points={rel}
              stroke={el.color}
              fill={el.color}
              pointerLength={el.pointerLength ?? 20}
              pointerWidth={el.pointerWidth ?? 20}
              strokeWidth={el.strokeWidth ?? 4}
              listening={false}
            />
          </Group>
        );
      }
      case 'rect':
        return (
          <Rect
            key={el.id}
            x={el.x}
            y={el.y}
            width={el.width}
            height={el.height}
            stroke={el.color}
            fill="transparent"
            strokeWidth={el.strokeWidth ?? 4}
            {...commonProps}
          />
        );
      case 'mosaic':
        return (
          <Rect
            key={el.id}
            x={el.x}
            y={el.y}
            width={el.width}
            height={el.height}
            fill="rgba(0,0,0,0.7)"
            stroke={isSelected ? 'blue' : undefined}
            {...commonProps}
          />
        );
      case 'spotlight': {
        const stageWidth = stageRef.current?.width() || 800;
        const stageHeight = stageRef.current?.height() || 600;
        return (
          <Group key={el.id} {...commonProps}>
            <Rect x={0} y={0} width={stageWidth} height={stageHeight} fill="rgba(0, 0, 0, 0.6)" listening={false} />
            <Rect x={el.x} y={el.y} width={el.width} height={el.height} fill="rgba(0, 0, 0, 0.6)" globalCompositeOperation="destination-out" listening={false} />
            {isSelected && <Rect x={el.x} y={el.y} width={el.width} height={el.height} stroke="yellow" strokeWidth={3} dash={[5, 5]} listening={false} />}
          </Group>
        );
      }
      case 'circle':
        return (
          <Circle
            key={el.id}
            x={el.x}
            y={el.y}
            radius={el.radius || 0}
            stroke={el.color}
            fill="transparent"
            strokeWidth={el.strokeWidth ?? 4}
            {...commonProps}
          />
        );
      case 'text':
        return (
          <Text
            key={el.id}
            id={el.id.toString()}
            x={el.x}
            y={el.y}
            text={el.text || ''}
            fontSize={el.fontSize ?? 32}
            fill={el.color}
            fontStyle="bold"
            width={el.width || 200}
            height={el.height || 40}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-5xl w-full max-h-screen overflow-auto">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setTool('select')} className={`px-3 py-2 rounded ${tool === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Select</button>
            <button onClick={() => setTool('arrow')} className={`px-3 py-2 rounded ${tool === 'arrow' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Arrow →</button>
            <button onClick={() => setTool('rect')} className={`px-3 py-2 rounded ${tool === 'rect' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Rectangle</button>
            <button onClick={() => setTool('circle')} className={`px-3 py-2 rounded ${tool === 'circle' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Circle</button>
            <button onClick={() => setTool('text')} className={`px-3 py-2 rounded ${tool === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Text</button>
            <button onClick={() => setTool('mosaic')} className={`px-3 py-2 rounded ${tool === 'mosaic' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Mosaic</button>
            <button onClick={() => setTool('spotlight')} className={`px-3 py-2 rounded ${tool === 'spotlight' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} title="Highlight an area by dimming everything else">Spotlight 💡</button>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="ml-4 w-12 h-10" />
          </div>

          <div className="flex gap-2 items-center">
            {/* ZOOM BUTTONS TEMPORARILY DISABLED FOR TESTING */}
            {/* <div className="flex items-center gap-1 border-r pr-2">
              <button onClick={handleZoomOut} className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded" title="Zoom out (or use mouse wheel)">🔍−</button>
              <button onClick={handleZoomReset} className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded text-sm" title="Reset zoom to 100%">{Math.round(scale * 100)}%</button>
              <button onClick={handleZoomIn} className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded" title="Zoom in (or use mouse wheel)">🔍+</button>
            </div> */}

            <button
              onClick={() => {
                if (selectedId !== null) {
                  setElements((prev) => prev.filter((el) => el.id !== selectedId));
                  setSelectedId(null);
                }
              }}
              disabled={selectedId === null}
              className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:bg-gray-300"
              title="Delete selected element (Del)"
            >
              Delete
            </button>
            <button onClick={handleUndo} disabled={elements.length === 0} className="bg-gray-300 px-4 py-2 rounded disabled:opacity-50" title="Undo last action">Undo</button>
            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded" title="Save edited image">Save</button>
            <button onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded" title="Cancel and close editor">Cancel</button>
          </div>
        </div>

        <div className="border-2 border-gray-300 overflow-auto max-h-[70vh] relative">
          <Stage
            ref={stageRef}
            width={image?.width || 800}
            height={image?.height || 600}
            scaleX={scale}
            scaleY={scale}
            x={stagePos.x}
            y={stagePos.y}
            draggable={false}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ cursor: getCursor() }}
          >
            <Layer>
              {image && <KonvaImage image={image} />}
              {elements.map((el) => renderElement(el, true))}
              {currentElement && renderElement(currentElement, false)}
              {tool === 'select' && selectedId !== null && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Prevent shapes from becoming too small
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  enabledAnchors={[
                    'top-left',
                    'top-right',
                    'bottom-left',
                    'bottom-right',
                  ]}
                  rotateEnabled={false}
                  keepRatio={false}
                />
              )}
            </Layer>
          </Stage>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>Tip: Select a tool, then click and drag on the image to draw. Use the color picker to change colors.</p>
          {/* ZOOM TIP TEMPORARILY DISABLED FOR TESTING */}
          {/* <p className="mt-1"><strong>Zoom:</strong> Use mouse wheel or zoom buttons (🔍− / 🔍+) to zoom in/out. Click percentage to reset to 100%.</p> */}
          <p className="mt-1"><strong>Pan:</strong> Hold <kbd className="px-1 bg-gray-2 00 rounded">Space</kbd> and drag, or use middle mouse button to pan around the canvas.</p>
          <p className="mt-1 text-green-700"><strong>Pro Tip:</strong> In Select mode, you can click on shapes even while holding Space - selection always takes priority over panning!</p>
        </div>
      </div>

      {/* Inline Text Input */}
      {isAddingText && textPosition && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={handleFinishText} />
          <div
            className="fixed bg-white border-2 border-blue-500 rounded shadow-lg p-2"
            style={{ left: `${textPosition.x}px`, top: `${textPosition.y}px`, zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleFinishText(); }
                else if (e.key === 'Escape') { e.preventDefault(); handleCancelText(); }
              }}
              autoFocus
              placeholder="Type text here..."
              className="border-none outline-none px-2 py-1 text-lg"
              style={{ fontSize: '32px', fontWeight: 'bold', color: color, minWidth: '250px' }}
            />
            <div className="text-xs text-gray-500 mt-1">Press Enter to add, Esc to cancel, or click outside</div>
          </div>
        </>
      )}
    </div>
  );
}
