'use client';

import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Image as KonvaImage, Transformer, Group } from 'react-konva';
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
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  radius?: number;
  fontSize?: number;
  // For arrow - store as x,y,width,height box
  // Arrow draws from (0,0) to (width, height) within the box
}

export default function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const [image] = useImage(imageUrl);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#ff0000');
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawElement | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  // Fit image to viewport when it loads
  useEffect(() => {
    if (image) {
      // Calculate available viewport space
      // Container has max-h-[70vh] (70% of viewport height)
      const viewportHeight = window.innerHeight * 0.7;
      const viewportWidth = Math.min(window.innerWidth * 0.9, 1280); // max-w-5xl ≈ 1280px

      // Account for padding, borders, and header (approximately 150px total)
      const availableHeight = viewportHeight - 150;
      const availableWidth = viewportWidth - 100;

      // Calculate scale to fit both dimensions
      const scaleToFitHeight = availableHeight / image.height;
      const scaleToFitWidth = availableWidth / image.width;

      // Use smaller scale to ensure entire image fits, but don't scale up beyond 1
      const fitScale = Math.min(scaleToFitHeight, scaleToFitWidth, 1);

      setScale(fitScale);
      setStagePos({ x: 0, y: 0 });
    }
  }, [image]);

  // Attach transformer
  useEffect(() => {
    if (selectedId !== null) {
      const stage = stageRef.current;
      if (!stage) return;

      const selectedNode = stage.findOne(`#shape-${selectedId}`);
      if (selectedNode && transformerRef.current) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, elements]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
        e.preventDefault();
        setElements(prev => prev.filter(el => el.id !== selectedId));
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
  }, [selectedId]);

  // Zoom
  const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.3));
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
    const clamped = Math.max(0.3, Math.min(3, newScale));
    setScale(clamped);
    setStagePos({
      x: pointer.x - mousePointTo.x * clamped,
      y: pointer.y - mousePointTo.y * clamped,
    });
  };

  const getRelativePointerPosition = () => {
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point(pointer);
  };

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();

    // Pan
    if (spacePressed || e.evt.button === 1) {
      e.evt.preventDefault();
      setIsPanning(true);
      const pointer = stage.getPointerPosition();
      setPanStart({ x: pointer.x - stagePos.x, y: pointer.y - stagePos.y });
      return;
    }

    // Select mode
    if (tool === 'select') {
      const clickedOnEmpty = e.target === stage || e.target.getType() === 'Image';
      if (clickedOnEmpty) {
        setSelectedId(null);
      }
      return;
    }

    // Text tool
    if (tool === 'text') {
      const pos = getRelativePointerPosition();
      const text = prompt('Enter text:');
      if (text) {
        setElements(prev => [
          ...prev,
          {
            id: Date.now(),
            tool: 'text',
            color,
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            text,
            fontSize: 32,
          },
        ]);
      }
      return;
    }

    // Drawing
    setIsDrawing(true);
    const pos = getRelativePointerPosition();

    setCurrentElement({
      id: Date.now(),
      tool,
      color,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      radius: 0,
    });
  };

  const handleMouseMove = (e: any) => {
    if (isPanning) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      setStagePos({
        x: pointer.x - panStart.x,
        y: pointer.y - panStart.y,
      });
      return;
    }

    if (!isDrawing || !currentElement) return;

    const pos = getRelativePointerPosition();

    if (tool === 'arrow' || tool === 'rect' || tool === 'mosaic' || tool === 'spotlight') {
      setCurrentElement({
        ...currentElement,
        width: pos.x - currentElement.x,
        height: pos.y - currentElement.y,
      });
    } else if (tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(pos.x - currentElement.x, 2) + Math.pow(pos.y - currentElement.y, 2)
      );
      setCurrentElement({
        ...currentElement,
        radius,
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
    if (currentElement) {
      setElements(prev => [...prev, currentElement]);
      setCurrentElement(null);
    }
  };

  const handleShapeClick = (id: number) => {
    if (tool === 'select') {
      setSelectedId(id);
    }
  };

  const handleDragEnd = (e: any, id: number) => {
    if (tool !== 'select') return;
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    
    setElements(prev =>
      prev.map(el =>
        el.id === id ? { ...el, x: newX, y: newY } : el
      )
    );
  };

  const handleTransformEnd = (e: any, id: number) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale
    node.scaleX(1);
    node.scaleY(1);

    setElements(prev =>
      prev.map(el => {
        if (el.id !== id) return el;

        if (el.tool === 'arrow' || el.tool === 'rect' || el.tool === 'mosaic' || el.tool === 'spotlight') {
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, el.width * scaleX),
            height: Math.max(5, el.height * scaleY),
          };
        } else if (el.tool === 'circle') {
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            radius: Math.max(5, (el.radius || 0) * scaleX),
          };
        } else if (el.tool === 'text') {
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            fontSize: Math.max(8, (el.fontSize || 32) * scaleX),
          };
        }
        return el;
      })
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const stage = stageRef.current;
      const originalScale = { x: stage.scaleX(), y: stage.scaleY() };
      const originalPos = { x: stage.x(), y: stage.y() };
      
      stage.scale({ x: 1, y: 1 });
      stage.position({ x: 0, y: 0 });
      
      const dataURL = stage.toDataURL({ pixelRatio: 2 });
      
      stage.scale(originalScale);
      stage.position(originalPos);
      
      const response = await fetch(dataURL);
      const blob = await response.blob();
      
      await onSave(blob);
      
      // Success - parent handles closing
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save image. Please try again.');
      setIsSaving(false); // CRITICAL: Reset on error
    }
  };

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (spacePressed) return 'grab';
    if (tool === 'text') return 'text';
    if (tool !== 'select') return 'crosshair';
    return 'default';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-5xl w-full max-h-screen overflow-auto">
        <div className="flex justify-between mb-4 gap-2">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setTool('select')} className={`px-3 py-2 rounded ${tool === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Select</button>
            <button onClick={() => setTool('arrow')} className={`px-3 py-2 rounded ${tool === 'arrow' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Arrow</button>
            <button onClick={() => setTool('rect')} className={`px-3 py-2 rounded ${tool === 'rect' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Rect</button>
            <button onClick={() => setTool('circle')} className={`px-3 py-2 rounded ${tool === 'circle' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Circle</button>
            <button onClick={() => setTool('text')} className={`px-3 py-2 rounded ${tool === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Text</button>
            <button onClick={() => setTool('mosaic')} className={`px-3 py-2 rounded ${tool === 'mosaic' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Mosaic</button>
            <button onClick={() => setTool('spotlight')} className={`px-3 py-2 rounded ${tool === 'spotlight' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Spotlight</button>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10" />
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={handleZoomOut} className="bg-gray-200 px-3 py-2 rounded">−</button>
            <button onClick={handleZoomReset} className="bg-gray-200 px-3 py-2 rounded text-sm">{Math.round(scale * 100)}%</button>
            <button onClick={handleZoomIn} className="bg-gray-200 px-3 py-2 rounded">+</button>
            <button onClick={() => { if (selectedId) { setElements(prev => prev.filter(el => el.id !== selectedId)); setSelectedId(null); } }} disabled={!selectedId} className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50">Delete</button>
            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
            <button onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
          </div>
        </div>

        <div className="border-2 border-gray-300 overflow-auto max-h-[70vh]">
          <Stage
            ref={stageRef}
            width={image?.width || 800}
            height={image?.height || 600}
            scaleX={scale}
            scaleY={scale}
            x={stagePos.x}
            y={stagePos.y}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ cursor: getCursor() }}
          >
            <Layer>
              {image && <KonvaImage image={image} />}

              {elements.map(el => {
                const shapeProps = {
                  id: `shape-${el.id}`,
                  key: el.id,
                  draggable: tool === 'select',
                  onClick: () => handleShapeClick(el.id),
                  onTap: () => handleShapeClick(el.id),
                  onDragEnd: (e: any) => handleDragEnd(e, el.id),
                  onTransformEnd: (e: any) => handleTransformEnd(e, el.id),
                };

                if (el.tool === 'arrow') {
                  // Draw arrow as a line with arrowhead in a Group
                  const arrowHeadSize = 15;
                  
                  return (
                    <Group {...shapeProps} x={el.x} y={el.y}>
                      {/* Arrow line */}
                      <Line
                        points={[0, 0, el.width, el.height]}
                        stroke={el.color}
                        strokeWidth={4}
                        lineCap="round"
                        lineJoin="round"
                      />
                      {/* Arrow head */}
                      <Line
                        points={[
                          el.width,
                          el.height,
                          el.width - arrowHeadSize * Math.cos(Math.atan2(el.height, el.width) - Math.PI / 6),
                          el.height - arrowHeadSize * Math.sin(Math.atan2(el.height, el.width) - Math.PI / 6),
                          el.width,
                          el.height,
                          el.width - arrowHeadSize * Math.cos(Math.atan2(el.height, el.width) + Math.PI / 6),
                          el.height - arrowHeadSize * Math.sin(Math.atan2(el.height, el.width) + Math.PI / 6),
                        ]}
                        stroke={el.color}
                        strokeWidth={4}
                        fill={el.color}
                        closed
                        lineCap="round"
                        lineJoin="round"
                      />
                    </Group>
                  );
                } else if (el.tool === 'rect') {
                  return <Rect {...shapeProps} x={el.x} y={el.y} width={el.width} height={el.height} stroke={el.color} strokeWidth={4} />;
                } else if (el.tool === 'mosaic') {
                  return <Rect {...shapeProps} x={el.x} y={el.y} width={el.width} height={el.height} fill="rgba(0,0,0,0.7)" />;
                } else if (el.tool === 'spotlight') {
                  return (
                    <Group {...shapeProps} x={el.x} y={el.y}>
                      <Rect x={0} y={0} width={el.width} height={el.height} stroke="yellow" strokeWidth={2} dash={[5, 5]} />
                    </Group>
                  );
                } else if (el.tool === 'circle') {
                  return <Circle {...shapeProps} x={el.x} y={el.y} radius={el.radius} stroke={el.color} strokeWidth={4} />;
                } else if (el.tool === 'text') {
                  return <Text {...shapeProps} x={el.x} y={el.y} text={el.text} fontSize={el.fontSize} fill={el.color} fontStyle="bold" />;
                }
                return null;
              })}

              {currentElement && (() => {
                if (currentElement.tool === 'arrow') {
                  const arrowHeadSize = 15;
                  return (
                    <Group key="current" x={currentElement.x} y={currentElement.y}>
                      <Line
                        points={[0, 0, currentElement.width, currentElement.height]}
                        stroke={currentElement.color}
                        strokeWidth={4}
                        lineCap="round"
                        lineJoin="round"
                      />
                      <Line
                        points={[
                          currentElement.width,
                          currentElement.height,
                          currentElement.width - arrowHeadSize * Math.cos(Math.atan2(currentElement.height, currentElement.width) - Math.PI / 6),
                          currentElement.height - arrowHeadSize * Math.sin(Math.atan2(currentElement.height, currentElement.width) - Math.PI / 6),
                          currentElement.width,
                          currentElement.height,
                          currentElement.width - arrowHeadSize * Math.cos(Math.atan2(currentElement.height, currentElement.width) + Math.PI / 6),
                          currentElement.height - arrowHeadSize * Math.sin(Math.atan2(currentElement.height, currentElement.width) + Math.PI / 6),
                        ]}
                        stroke={currentElement.color}
                        strokeWidth={4}
                        fill={currentElement.color}
                        closed
                        lineCap="round"
                        lineJoin="round"
                      />
                    </Group>
                  );
                } else if (currentElement.tool === 'rect') {
                  return <Rect key="current" x={currentElement.x} y={currentElement.y} width={currentElement.width} height={currentElement.height} stroke={currentElement.color} strokeWidth={4} />;
                } else if (currentElement.tool === 'mosaic') {
                  return <Rect key="current" x={currentElement.x} y={currentElement.y} width={currentElement.width} height={currentElement.height} fill="rgba(0,0,0,0.7)" />;
                } else if (currentElement.tool === 'spotlight') {
                  return <Rect key="current" x={currentElement.x} y={currentElement.y} width={currentElement.width} height={currentElement.height} stroke="yellow" strokeWidth={2} dash={[5, 5]} />;
                } else if (currentElement.tool === 'circle') {
                  return <Circle key="current" x={currentElement.x} y={currentElement.y} radius={currentElement.radius} stroke={currentElement.color} strokeWidth={4} />;
                }
                return null;
              })()}

              <Transformer ref={transformerRef} />
            </Layer>
          </Stage>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>Hold <kbd className="px-1 bg-gray-200 rounded">Space</kbd> or middle mouse button to pan. Use mouse wheel to zoom.</p>
        </div>
      </div>
       {isSaving && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-8 max-w-md text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Saving Image...</h3>
              <p className="text-gray-600">Please wait while we process and save your edited image.</p>
              <p className="text-sm text-gray-500 mt-4">This may take a few seconds.</p>
            </div>
          </div>
        )}
    </div>
  );
}
