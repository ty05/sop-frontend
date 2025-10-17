'use client';

import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Circle, Rect, Text, Arrow, Image as KonvaImage, Group } from 'react-konva';
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null && !isAddingText) {
        e.preventDefault();
        setElements(elements.filter((el) => el.id !== selectedId));
        setSelectedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, isAddingText]);

  const handleMouseDown = (e: any) => {
    // Don't interfere with text input
    if (isAddingText) return;

    if (tool === 'select') {
      // Deselect when clicking on empty space
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedId(null);
      }
      return;
    }

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    // Text tool: show inline text input at click position
    if (tool === 'text') {
      // Get stage position relative to viewport
      const stageBox = stage.container().getBoundingClientRect();
      const screenX = stageBox.left + pos.x;
      const screenY = stageBox.top + pos.y;

      setTextPosition({ x: screenX, y: screenY });
      setTextCanvasPosition({ x: pos.x, y: pos.y });
      setIsAddingText(true);
      setTextValue('');
      return;
    }

    // Other tools: start drawing
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
      text: undefined,
      radius: 0,
    };

    setCurrentElement(newElement);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !currentElement) return;

    const pos = e.target.getStage().getPointerPosition();

    if (tool === 'arrow') {
      setCurrentElement({
        ...currentElement,
        points: [currentElement.x, currentElement.y, pos.x, pos.y]
      });
    } else if (tool === 'rect' || tool === 'mosaic' || tool === 'spotlight') {
      setCurrentElement({
        ...currentElement,
        width: pos.x - currentElement.x,
        height: pos.y - currentElement.y
      });
    } else if (tool === 'circle') {
      const radiusX = Math.abs(pos.x - currentElement.x);
      const radiusY = Math.abs(pos.y - currentElement.y);
      const radius = Math.max(radiusX, radiusY);
      setCurrentElement({
        ...currentElement,
        radius: radius,
        width: radius * 2,
        height: radius * 2
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    if (currentElement && (currentElement.width !== 0 || currentElement.height !== 0 || currentElement.points)) {
      setElements([...elements, currentElement]);
    }
    setCurrentElement(null);
  };

  const handleSave = async () => {
    const stage = stageRef.current;
    const dataURL = stage.toDataURL({ pixelRatio: 2 });

    // Convert to Blob
    const response = await fetch(dataURL);
    const blob = await response.blob();

    onSave(blob);
  };

  const handleUndo = () => {
    if (elements.length > 0) {
      setElements(elements.slice(0, -1));
    }
  };

  const handleFinishText = () => {
    if (textValue.trim() && textCanvasPosition) {
      const textElement: DrawElement = {
        id: Date.now(),
        tool: 'text',
        color,
        x: textCanvasPosition.x,
        y: textCanvasPosition.y,
        width: 100,
        height: 30,
        text: textValue,
        radius: 0,
      };
      setElements([...elements, textElement]);
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

  const handleElementDragEnd = (e: any, elementId: number) => {
    const updatedElements = elements.map((el) => {
      if (el.id === elementId) {
        // For arrows, we need to update the points by the delta
        // because arrows are positioned at (0,0) and points are absolute
        if (el.tool === 'arrow' && el.points) {
          const deltaX = e.target.x();
          const deltaY = e.target.y();
          return {
            ...el,
            points: [
              el.points[0] + deltaX,
              el.points[1] + deltaY,
              el.points[2] + deltaX,
              el.points[3] + deltaY,
            ],
          };
        }
        // For other elements (rect, circle, text, etc.), use absolute position
        // e.target.x() and e.target.y() give the final dragged position
        return {
          ...el,
          x: e.target.x(),
          y: e.target.y(),
        };
      }
      return el;
    });

    setElements(updatedElements);

    // Reset the shape position (since we updated the element data)
    e.target.position({ x: 0, y: 0 });

    // Force redraw
    const layer = e.target.getLayer();
    if (layer) {
      layer.batchDraw();
    }
  };

  const handleElementClick = (elementId: number) => {
    if (tool === 'select') {
      setSelectedId(elementId);
    }
  };

  const renderElement = (el: DrawElement, isDraggable = false) => {
    const isSelected = selectedId === el.id;
    const canDrag = isDraggable && tool === 'select';
    const commonProps = {
      draggable: canDrag,
      onClick: () => handleElementClick(el.id),
      onTap: () => handleElementClick(el.id),
      onDragEnd: (e: any) => handleElementDragEnd(e, el.id),
      onMouseEnter: (e: any) => {
        if (canDrag) {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'move';
          }
        }
      },
      onMouseLeave: (e: any) => {
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = tool === 'select' ? 'default' : 'crosshair';
        }
      },
      // Visual feedback for selection
      strokeWidth: isSelected ? 4 : el.tool === 'arrow' ? 3 : 2,
      shadowColor: isSelected ? 'blue' : undefined,
      shadowBlur: isSelected ? 10 : undefined,
    };
    switch (el.tool) {
      case 'arrow':
        return (
          <Arrow
            key={el.id}
            points={el.points || []}
            stroke={el.color}
            fill={el.color}
            pointerLength={10}
            pointerWidth={10}
            {...commonProps}
          />
        );
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
      case 'spotlight':
        const stageWidth = stageRef.current?.width() || 800;
        const stageHeight = stageRef.current?.height() || 600;

        return (
          <Group
            key={el.id}
            {...commonProps}
          >
            {/* Dark overlay covering entire canvas */}
            <Rect
              x={0}
              y={0}
              width={stageWidth}
              height={stageHeight}
              fill="rgba(0, 0, 0, 0.6)"
              listening={false}
            />
            {/* Bright rectangle to "cut out" spotlight area */}
            <Rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              fill="rgba(0, 0, 0, 0.6)"
              globalCompositeOperation="destination-out"
              listening={false}
            />
            {/* Border to show spotlight bounds when selected */}
            {isSelected && (
              <Rect
                x={el.x}
                y={el.y}
                width={el.width}
                height={el.height}
                stroke="yellow"
                strokeWidth={3}
                dash={[5, 5]}
                listening={false}
              />
            )}
          </Group>
        );
      case 'circle':
        return (
          <Circle
            key={el.id}
            x={el.x}
            y={el.y}
            radius={el.radius || 0}
            stroke={el.color}
            fill="transparent"
            {...commonProps}
          />
        );
      case 'text':
        return (
          <Text
            key={el.id}
            x={el.x}
            y={el.y}
            text={el.text || ''}
            fontSize={24}
            fill={el.color}
            fontWeight="bold"
            stroke={isSelected ? 'blue' : undefined}
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
            <button
              onClick={() => setTool('select')}
              className={`px-3 py-2 rounded ${tool === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Select
            </button>
            <button
              onClick={() => setTool('arrow')}
              className={`px-3 py-2 rounded ${tool === 'arrow' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Arrow →
            </button>
            <button
              onClick={() => setTool('rect')}
              className={`px-3 py-2 rounded ${tool === 'rect' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Rectangle
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`px-3 py-2 rounded ${tool === 'circle' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Circle
            </button>
            <button
              onClick={() => setTool('text')}
              className={`px-3 py-2 rounded ${tool === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Text
            </button>
            <button
              onClick={() => setTool('mosaic')}
              className={`px-3 py-2 rounded ${tool === 'mosaic' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Mosaic
            </button>
            <button
              onClick={() => setTool('spotlight')}
              className={`px-3 py-2 rounded ${tool === 'spotlight' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              title="Highlight an area by dimming everything else"
            >
              Spotlight 💡
            </button>

            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="ml-4 w-12 h-10"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (selectedId) {
                  setElements(elements.filter((el) => el.id !== selectedId));
                  setSelectedId(null);
                }
              }}
              disabled={selectedId === null}
              className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:bg-gray-300"
              title="Delete selected element (Del)"
            >
              Delete
            </button>
            <button
              onClick={handleUndo}
              disabled={elements.length === 0}
              className="bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
              title="Undo last action"
            >
              Undo
            </button>
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded"
              title="Save edited image"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-300 px-4 py-2 rounded"
              title="Cancel and close editor"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="border-2 border-gray-300 overflow-auto max-h-[70vh]">
          <Stage
            ref={stageRef}
            width={image?.width || 800}
            height={image?.height || 600}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
          >
            <Layer>
              {image && <KonvaImage image={image} />}
              {elements.map((el) => renderElement(el, true))}
              {currentElement && renderElement(currentElement, false)}
            </Layer>
          </Stage>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>Tip: Select a tool, then click and drag on the image to draw. Use the color picker to change colors.</p>
          {tool === 'select' && (
            <div className="mt-2">
              <p className="font-semibold">Select tool:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Click any element to select it (shows blue highlight)</li>
                <li>Drag selected element to move it</li>
                <li>Press Delete or Backspace to remove selected element</li>
              </ul>
            </div>
          )}
          {tool === 'text' && (
            <div className="mt-2">
              <p className="font-semibold">Text tool:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Click where you want to add text</li>
                <li>Type your text in the input box</li>
                <li>Press Enter to confirm, Esc to cancel</li>
              </ul>
            </div>
          )}
          {tool === 'spotlight' && (
            <div className="mt-2">
              <p className="font-semibold">Spotlight tool:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Click and drag to highlight an important area</li>
                <li>Everything outside the rectangle will be dimmed</li>
                <li>Perfect for drawing attention to specific parts</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Inline Text Input */}
      {isAddingText && textPosition && (
        <>
          {/* Overlay to detect clicks outside */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={handleFinishText}
          />
          <div
            className="fixed bg-white border-2 border-blue-500 rounded shadow-lg p-2"
            style={{
              left: `${textPosition.x}px`,
              top: `${textPosition.y}px`,
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFinishText();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelText();
                }
              }}
              autoFocus
              placeholder="Type text here..."
              className="border-none outline-none px-2 py-1 text-lg"
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: color,
                minWidth: '200px',
              }}
            />
            <div className="text-xs text-gray-500 mt-1">
              Press Enter to add, Esc to cancel, or click outside
            </div>
          </div>
        </>
      )}
    </div>
  );
}
