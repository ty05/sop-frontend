'use client';

import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Circle, Rect, Text, Arrow, Image as KonvaImage, Group, Transformer } from 'react-konva';
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
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const transformerRef = useRef<any>(null);
  const selectedShapeRef = useRef<any>(null);

  // Attach transformer to selected shape
  useEffect(() => {
    if (selectedId !== null && selectedShapeRef.current) {
      // Attach transformer to the selected shape
      if (transformerRef.current) {
        transformerRef.current.nodes([selectedShapeRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Track space bar for panning
      if (e.code === 'Space' && !isAddingText) {
        e.preventDefault();
        setSpacePressed(true);
      }

      // Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null && !isAddingText) {
        e.preventDefault();
        setElements(elements.filter((el) => el.id !== selectedId));
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
  }, [selectedId, elements, isAddingText]);

  // Zoom functions
  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 3)); // Max 300%
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.3)); // Min 30%
  };

  const handleZoomReset = () => {
    setScale(1);
    setStagePos({ x: 0, y: 0 });
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * 1.05 : oldScale / 1.05;
    const clampedScale = Math.max(0.3, Math.min(3, newScale));

    setScale(clampedScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    setStagePos(newPos);
  };

  const handleMouseDown = (e: any) => {
    // Don't interfere with text input
    if (isAddingText) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();

    // Handle panning (Space + drag or middle mouse button)
    if (spacePressed || e.evt.button === 1) {
      e.evt.preventDefault();
      setIsPanning(true);
      setPanStart({ x: pointerPos.x - stagePos.x, y: pointerPos.y - stagePos.y });
      return;
    }

    if (tool === 'select') {
      // Deselect when clicking on empty space or the background image
      const clickedOnEmpty = e.target === e.target.getStage() || e.target.getType() === 'Image';
      if (clickedOnEmpty) {
        setSelectedId(null);
      }
      return;
    }

    // Convert screen coordinates to canvas coordinates (accounting for zoom and pan)
    const pos = {
      x: (pointerPos.x - stage.x()) / scale,
      y: (pointerPos.y - stage.y()) / scale,
    };

    // Text tool: show inline text input at click position
    if (tool === 'text') {
      // Get stage position relative to viewport (use screen coordinates)
      const stageBox = stage.container().getBoundingClientRect();
      const screenX = stageBox.left + pointerPos.x;
      const screenY = stageBox.top + pointerPos.y;

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
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();

    // Handle panning
    if (isPanning) {
      setStagePos({
        x: pointerPos.x - panStart.x,
        y: pointerPos.y - panStart.y,
      });
      return;
    }

    if (!isDrawing || !currentElement) return;

    // Convert screen coordinates to canvas coordinates (accounting for zoom and pan)
    const pos = {
      x: (pointerPos.x - stage.x()) / scale,
      y: (pointerPos.y - stage.y()) / scale,
    };

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
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;

    setIsDrawing(false);
    if (currentElement && (currentElement.width !== 0 || currentElement.height !== 0 || currentElement.points)) {
      setElements([...elements, currentElement]);
    }
    setCurrentElement(null);
  };

  const handleSave = async () => {
    const stage = stageRef.current;

    // Temporarily reset scale and position to export at original size
    const originalScale = stage.scaleX();
    const originalPos = { x: stage.x(), y: stage.y() };

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });

    const dataURL = stage.toDataURL({ pixelRatio: 2 });

    // Restore zoom and position
    stage.scale({ x: originalScale, y: originalScale });
    stage.position(originalPos);

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
        // Get the new absolute position (not delta)
        const newX = e.target.x();
        const newY = e.target.y();

        // For arrows, calculate the actual delta from the Group's original position
        if (el.tool === 'arrow' && el.points) {
          const minX = Math.min(el.points[0], el.points[2]);
          const minY = Math.min(el.points[1], el.points[3]);
          const deltaX = newX - minX;
          const deltaY = newY - minY;

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
        // For other elements, use the new position directly
        return {
          ...el,
          x: newX,
          y: newY,
        };
      }
      return el;
    });

    setElements(updatedElements);

    // Reset the shape position to 0,0 (since we updated the element data)
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

  const handleTransformEnd = (e: any, elementId: number) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and apply it to the dimensions
    node.scaleX(1);
    node.scaleY(1);

    const updatedElements = elements.map((el) => {
      if (el.id === elementId) {
        if (el.tool === 'arrow' && el.points) {
          // For arrows in Group, get the Group's new position and scale
          const newX = node.x();
          const newY = node.y();
          const points = el.points;
          const minX = Math.min(points[0], points[2]);
          const minY = Math.min(points[1], points[3]);
          const deltaX = newX - minX;
          const deltaY = newY - minY;
          const relativePoints = [
            points[0] - minX,
            points[1] - minY,
            points[2] - minX,
            points[3] - minY,
          ];

          // Apply scale to relative points, then add back the new position
          return {
            ...el,
            points: [
              newX + relativePoints[0] * scaleX,
              newY + relativePoints[1] * scaleY,
              newX + relativePoints[2] * scaleX,
              newY + relativePoints[3] * scaleY,
            ],
          };
        } else if (el.tool === 'circle') {
          // For circles, update radius and position
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            radius: Math.max(el.radius || 0, 5) * scaleX,
            width: (el.radius || 0) * 2 * scaleX,
            height: (el.radius || 0) * 2 * scaleY,
          };
        } else if (el.tool === 'text') {
          // For text, update position (fontSize can be adjusted separately if needed)
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            width: el.width * scaleX,
            height: el.height * scaleY,
          };
        } else {
          // For rect, mosaic, spotlight
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, el.width * scaleX),
            height: Math.max(5, el.height * scaleY),
          };
        }
      }
      return el;
    });

    setElements(updatedElements);

    // Reset position to (0,0) since we updated the element data
    node.position({ x: 0, y: 0 });
  };

  const renderElement = (el: DrawElement, isDraggable = false) => {
    const isSelected = selectedId === el.id;
    const canDrag = isDraggable && tool === 'select';
    const commonProps = {
      ref: isSelected ? selectedShapeRef : null,
      draggable: canDrag,
      onClick: () => handleElementClick(el.id),
      onTap: () => handleElementClick(el.id),
      onDragEnd: (e: any) => handleElementDragEnd(e, el.id),
      onTransformEnd: (e: any) => handleTransformEnd(e, el.id),
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
      shadowColor: isSelected ? 'blue' : undefined,
      shadowBlur: isSelected ? 10 : undefined,
    };
    switch (el.tool) {
      case 'arrow':
        // Wrap arrow in a Group for proper dragging
        // Calculate bounding box for positioning
        const points = el.points || [0, 0, 0, 0];
        const minX = Math.min(points[0], points[2]);
        const minY = Math.min(points[1], points[3]);
        const relativePoints = [
          points[0] - minX,
          points[1] - minY,
          points[2] - minX,
          points[3] - minY,
        ];

        return (
          <Group
            key={el.id}
            x={minX}
            y={minY}
            {...commonProps}
          >
            <Arrow
              points={relativePoints}
              stroke={el.color}
              fill={el.color}
              pointerLength={20}
              pointerWidth={20}
              strokeWidth={isSelected ? 6 : 4}
              listening={false}
            />
          </Group>
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
            strokeWidth={isSelected ? 6 : 4}
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
            strokeWidth={isSelected ? 6 : 4}
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
            fontSize={32}
            fill={el.color}
            fontWeight="bold"
            stroke={isSelected ? 'blue' : undefined}
            strokeWidth={isSelected ? 2 : 0}
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

          <div className="flex gap-2 items-center">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 border-r pr-2">
              <button
                onClick={handleZoomOut}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded"
                title="Zoom out (or use mouse wheel)"
              >
                🔍−
              </button>
              <button
                onClick={handleZoomReset}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded text-sm"
                title="Reset zoom to 100%"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded"
                title="Zoom in (or use mouse wheel)"
              >
                🔍+
              </button>
            </div>

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
            style={{
              cursor: isPanning ? 'grabbing' : spacePressed ? 'grab' : tool === 'select' ? 'default' : 'crosshair'
            }}
          >
            <Layer>
              {image && <KonvaImage image={image} />}
              {elements.map((el) => renderElement(el, true))}
              {currentElement && renderElement(currentElement, false)}
              {tool === 'select' && selectedId !== null && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Limit resize to minimum size
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              )}
            </Layer>
          </Stage>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>Tip: Select a tool, then click and drag on the image to draw. Use the color picker to change colors.</p>
          <p className="mt-1">
            <strong>Zoom:</strong> Use mouse wheel or zoom buttons (🔍− / 🔍+) to zoom in/out. Click percentage to reset to 100%.
          </p>
          <p className="mt-1">
            <strong>Pan:</strong> Hold <kbd className="px-1 bg-gray-200 rounded">Space</kbd> and drag, or use middle mouse button to pan around the canvas.
          </p>
          {tool === 'select' && (
            <div className="mt-2">
              <p className="font-semibold">Select tool:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Click any element to select it (shows blue highlight and resize handles)</li>
                <li>Drag elements to move them around the canvas</li>
                <li>Drag the corner/edge handles to resize elements</li>
                <li>Press Delete or Backspace to remove selected element</li>
                <li>Click on empty space to deselect</li>
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
                fontSize: '32px',
                fontWeight: 'bold',
                color: color,
                minWidth: '250px',
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
