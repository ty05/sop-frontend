'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Image as KonvaImage, Transformer, Group } from 'react-konva';
import useImage from 'use-image';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (blob: Blob) => void | Promise<void>;
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
  rotation?: number;
}

export default function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const [image, status] = useImage(imageUrl);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#ff0000');
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawElement | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResizingArrow, setIsResizingArrow] = useState<'start' | 'end' | null>(null);

  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  // 画像をビューポートにフィット
  useEffect(() => {
    console.log('Image status changed:', status);
    console.log('Image object:', image);
    if (image) {
      console.log('Image loaded! Dimensions:', image.width, 'x', image.height);
    }

    if (!image) return;
    const viewportHeight = window.innerHeight * 0.7;
    const viewportWidth = Math.min(window.innerWidth * 0.9, 1280);
    const availableHeight = viewportHeight - 150;
    const availableWidth = viewportWidth - 100;
    const sH = availableHeight / image.height;
    const sW = availableWidth / image.width;
    const fit = Math.min(sH, sW, 1);
    setScale(fit);
    setFitScale(fit);
    setStagePos({ x: 0, y: 0 });
  }, [image, status]);

  // Transformer のアタッチ (exclude arrows)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || selectedId === null) {
      transformerRef.current?.nodes([]);
      return;
    }

    const selectedElement = elements.find(el => el.id === selectedId);
    if (selectedElement?.tool === 'arrow') {
      transformerRef.current?.nodes([]);
      return;
    }

    const node = stage.findOne(`#shape-${selectedId}`);
    if (node && transformerRef.current) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, elements]);

  // キーボード
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

  // ズーム
  const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.3));
  const handleZoomReset = () => {
    setScale(fitScale);
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

  // マウス操作
  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // Pan
    if (spacePressed || e.evt.button === 1) {
      e.evt.preventDefault();
      setIsPanning(true);
      const pointer = stage.getPointerPosition();
      setPanStart({ x: pointer.x - stagePos.x, y: pointer.y - stagePos.y });
      return;
    }

    // Select
    if (tool === 'select') {
      const clickedOnEmpty = e.target === stage || e.target.getType() === 'Image';
      if (clickedOnEmpty) setSelectedId(null);
      return;
    }

    // Text
    if (tool === 'text') {
      const pos = getRelativePointerPosition();
      const txt = prompt('Enter text:');
      if (txt) {
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
            text: txt,
            fontSize: 32,
            rotation: 0,
          },
        ]);
      }
      return;
    }

    // Drawing start
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
      rotation: 0,
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
    if (['arrow','rect','mosaic','spotlight'].includes(tool)) {
      setCurrentElement({
        ...currentElement,
        width: pos.x - currentElement.x,
        height: pos.y - currentElement.y,
      });
    } else if (tool === 'circle') {
      const r = Math.hypot(pos.x - currentElement.x, pos.y - currentElement.y);
      setCurrentElement({ ...currentElement, radius: r });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) { setIsPanning(false); return; }
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentElement) {
      setElements(prev => [...prev, currentElement]);
      setCurrentElement(null);
    }
  };

  // 選択
  const handleShapeClick = (id: number) => {
    if (tool === 'select') setSelectedId(id);
  };

  // ドラッグ
  const handleDragMove = (e: any, id: number) => {
    if (tool !== 'select') return;
    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    setElements(prev => prev.map(el => el.id === id ? { ...el, x: newX, y: newY } : el));
  };
  const handleDragEnd = handleDragMove;

  // 変形
  const handleTransform = (e: any, id: number) => {
    if (tool !== 'select') return;
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    setElements(prev => prev.map(el => {
      if (el.id !== id) return el;
      if (el.tool === 'circle') {
        const base = el.radius || 0;
        const avg = (scaleX + scaleY) / 2;
        return { ...el, x: node.x(), y: node.y(), radius: Math.max(5, base * avg), rotation: node.rotation() };
      } else if (el.tool === 'text') {
        const base = el.fontSize || 32;
        return { ...el, x: node.x(), y: node.y(), fontSize: Math.max(8, base * scaleX), rotation: node.rotation() };
      } else {
        return {
          ...el,
          x: node.x(),
          y: node.y(),
          width: Math.max(5, el.width * scaleX),
          height: Math.max(5, el.height * scaleY),
          rotation: node.rotation(),
        };
      }
    }));
  };
  const handleTransformEnd = (e: any, id: number) => {
    const node = e.target;
    node.scaleX(1);
    node.scaleY(1);
  };

  // 保存
  const handleSave = async () => {
    if (!image) {
      console.error('No image loaded');
      return;
    }
    setIsSaving(true);
    try {
      console.log('Starting save process...');
      console.log('Image dimensions:', image.width, image.height);
      console.log('Number of elements:', elements.length);
      console.log('Spotlights:', spotlights.length);
      console.log('Non-spotlight elements:', nonSpotlight.length);

      // Create off-screen canvas for proper compositing
      const canvas = document.createElement('canvas');
      canvas.width = image.width * 2; // 2x for high DPI
      canvas.height = image.height * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      console.log('Canvas created:', canvas.width, 'x', canvas.height);

      // Scale context for high DPI
      ctx.scale(2, 2);

      // 1. Draw background image
      console.log('Drawing background image...');
      ctx.drawImage(image, 0, 0, image.width, image.height);
      console.log('Background image drawn');

      // 2. Draw spotlight mask if exists
      if (spotlights.length > 0) {
        // Draw dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, image.width, image.height);

        // Cut out spotlight areas
        ctx.globalCompositeOperation = 'destination-out';
        spotlights.forEach(s => {
          ctx.fillStyle = 'black';
          ctx.fillRect(s.x, s.y, s.width, s.height);
        });
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
      }

      // 3. Draw annotations (non-spotlight elements)
      nonSpotlight.forEach(el => {
        ctx.save();

        if (el.rotation) {
          const centerX = el.tool === 'circle' ? el.x : el.x + el.width / 2;
          const centerY = el.tool === 'circle' ? el.y : el.y + el.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate(el.rotation);
          ctx.translate(-centerX, -centerY);
        }

        if (el.tool === 'arrow') {
          const toX = el.x + el.width;
          const toY = el.y + el.height;
          const headlen = 15;
          const angle = Math.atan2(el.height, el.width);

          ctx.strokeStyle = el.color;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Main line
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(toX, toY);
          ctx.stroke();

          // Arrowhead
          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(
            toX - headlen * Math.cos(angle - Math.PI / 6),
            toY - headlen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(toX, toY);
          ctx.lineTo(
            toX - headlen * Math.cos(angle + Math.PI / 6),
            toY - headlen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        } else if (el.tool === 'rect') {
          ctx.strokeStyle = el.color;
          ctx.lineWidth = 4;
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        } else if (el.tool === 'mosaic') {
          ctx.fillStyle = 'rgb(0, 0, 0)';
          ctx.fillRect(el.x, el.y, el.width, el.height);
        } else if (el.tool === 'circle') {
          ctx.strokeStyle = el.color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(el.x, el.y, el.radius || 0, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (el.tool === 'text') {
          ctx.fillStyle = el.color;
          ctx.font = `bold ${el.fontSize || 32}px sans-serif`;
          ctx.fillText(el.text || '', el.x, el.y);
        }

        ctx.restore();
      });

      // Convert canvas to blob
      console.log('Converting canvas to blob...');
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) {
              console.log('Blob created successfully, size:', b.size, 'bytes');
              resolve(b);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png'
        );
      });

      console.log('Calling onSave with blob...');
      await onSave(blob);
      console.log('Save complete');
      // Success - isSaving will be reset by parent component
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save image. Please try again.');
      setIsSaving(false);
    }
  };

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (spacePressed) return 'grab';
    if (tool === 'text') return 'text';
    if (tool !== 'select') return 'crosshair';
    return 'default';
  };

  const spotlights = useMemo(() => elements.filter(e => e.tool === 'spotlight'), [elements]);
  const nonSpotlight = useMemo(() => elements.filter(e => e.tool !== 'spotlight'), [elements]);

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
            <button
              onClick={() => { if (selectedId !== null) { setElements(prev => prev.filter(el => el.id !== selectedId)); setSelectedId(null); } }}
              disabled={selectedId === null}
              className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >Delete</button>
            <button
              onClick={handleSave}
              disabled={!image || status === 'loading'}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {status === 'loading' ? 'Loading...' : 'Save'}
            </button>
            <button onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
          </div>
        </div>

        <div className="border-2 border-gray-300 overflow-auto max-h-[70vh] relative">
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading image...</p>
              </div>
            </div>
          )}
          {status === 'failed' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-50">
              <div className="text-center text-red-600">
                <p className="font-bold">Failed to load image</p>
                <p className="text-sm">Please try again</p>
              </div>
            </div>
          )}
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
            {/* 1) 背景画像 */}
            <Layer>
              {image && <KonvaImage image={image} listening={false} />}
            </Layer>

            {/* 2) Spotlight マスク */}
            {image && spotlights.length > 0 && (
              <Layer listening={false}>
                <Group>
                  <Rect
                    x={0}
                    y={0}
                    width={image.width}
                    height={image.height}
                    fill="rgba(0,0,0,0.7)"
                  />
                  {spotlights.map(s => (
                    <Rect
                      key={`mask-${s.id}`}
                      x={s.x}
                      y={s.y}
                      width={s.width}
                      height={s.height}
                      fill="black"
                      globalCompositeOperation="destination-out"
                    />
                  ))}
                </Group>
              </Layer>
            )}

            {/* 3) 注釈 */}
            <Layer>
              {nonSpotlight.map(el => {
                const common = {
                  id: `shape-${el.id}`,
                  draggable: tool === 'select',
                  rotation: el.rotation || 0,
                  onClick: () => handleShapeClick(el.id),
                  onTap: () => handleShapeClick(el.id),
                  onDragMove: (e: any) => handleDragMove(e, el.id),
                  onDragEnd: (e: any) => handleDragEnd(e, el.id),
                  onTransform: (e: any) => handleTransform(e, el.id),
                  onTransformEnd: (e: any) => handleTransformEnd(e, el.id),
                };

                if (el.tool === 'arrow') {
                  const isSelected = selectedId === el.id;
                  const toX = el.x + el.width;
                  const toY = el.y + el.height;
                  const headlen = 15;
                  const angle = Math.atan2(el.height, el.width);

                  return (
                    <Group
                      key={el.id}
                      id={`shape-${el.id}`}
                      draggable={tool === 'select' && !isResizingArrow}
                      onClick={() => handleShapeClick(el.id)}
                      onTap={() => handleShapeClick(el.id)}
                      onDragMove={(e: any) => {
                        if (tool === 'select' && !isResizingArrow) {
                          const node = e.target;
                          const newX = el.x + node.x();
                          const newY = el.y + node.y();
                          setElements(prev => prev.map(elem => elem.id === el.id ? { ...elem, x: newX, y: newY } : elem));
                          node.position({ x: 0, y: 0 });
                        }
                      }}
                      onDragEnd={(e: any) => {
                        const node = e.target;
                        node.position({ x: 0, y: 0 });
                      }}
                    >
                      {/* Main arrow line */}
                      <Line
                        points={[el.x, el.y, toX, toY]}
                        stroke={el.color}
                        strokeWidth={4}
                        hitStrokeWidth={20}
                        lineCap="round"
                        lineJoin="round"
                      />
                      {/* Arrowhead line 1 */}
                      <Line
                        points={[
                          toX, toY,
                          toX - headlen * Math.cos(angle - Math.PI / 6),
                          toY - headlen * Math.sin(angle - Math.PI / 6)
                        ]}
                        stroke={el.color}
                        strokeWidth={4}
                        lineCap="round"
                        lineJoin="round"
                        listening={false}
                      />
                      {/* Arrowhead line 2 */}
                      <Line
                        points={[
                          toX, toY,
                          toX - headlen * Math.cos(angle + Math.PI / 6),
                          toY - headlen * Math.sin(angle + Math.PI / 6)
                        ]}
                        stroke={el.color}
                        strokeWidth={4}
                        lineCap="round"
                        lineJoin="round"
                        listening={false}
                      />

                      {/* Endpoint handles - only show when selected */}
                      {isSelected && (
                        <>
                          {/* Start point handle */}
                          <Circle
                            x={el.x}
                            y={el.y}
                            radius={6}
                            fill="#FFFFFF"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            draggable={tool === 'select'}
                            onDragStart={() => setIsResizingArrow('start')}
                            onDragEnd={() => setIsResizingArrow(null)}
                            onDragMove={(e: any) => {
                              if (isResizingArrow === 'start') {
                                const newX = e.target.x();
                                const newY = e.target.y();
                                setElements(prev => prev.map(elem =>
                                  elem.id === el.id
                                    ? {
                                        ...elem,
                                        x: newX,
                                        y: newY,
                                        width: toX - newX,
                                        height: toY - newY
                                      }
                                    : elem
                                ));
                              }
                            }}
                          />
                          {/* End point handle */}
                          <Circle
                            x={toX}
                            y={toY}
                            radius={6}
                            fill="#FFFFFF"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            draggable={tool === 'select'}
                            onDragStart={() => setIsResizingArrow('end')}
                            onDragEnd={() => setIsResizingArrow(null)}
                            onDragMove={(e: any) => {
                              if (isResizingArrow === 'end') {
                                const newX = e.target.x();
                                const newY = e.target.y();
                                setElements(prev => prev.map(elem =>
                                  elem.id === el.id
                                    ? {
                                        ...elem,
                                        width: newX - elem.x,
                                        height: newY - elem.y
                                      }
                                    : elem
                                ));
                              }
                            }}
                          />
                        </>
                      )}
                    </Group>
                  );
                } else if (el.tool === 'rect') {
                  return <Rect key={el.id} {...common} x={el.x} y={el.y} width={el.width} height={el.height} stroke={el.color} strokeWidth={4} />;
                } else if (el.tool === 'mosaic') {
                  return <Rect key={el.id} {...common} x={el.x} y={el.y} width={el.width} height={el.height} fill="rgb(0,0,0)" />;
                } else if (el.tool === 'circle') {
                  return <Circle key={el.id} {...common} x={el.x} y={el.y} radius={el.radius || 0} stroke={el.color} strokeWidth={4} />;
                } else if (el.tool === 'text') {
                  return <Text key={el.id} {...common} x={el.x} y={el.y} text={el.text || ''} fontSize={el.fontSize || 32} fill={el.color} fontStyle="bold" />;
                }
                return null;
              })}

              {/* Spotlight 枠 */}
              {spotlights.map(el => {
                const common = {
                  id: `shape-${el.id}`,
                  draggable: tool === 'select',
                  rotation: el.rotation || 0,
                  onClick: () => handleShapeClick(el.id),
                  onTap: () => handleShapeClick(el.id),
                  onDragMove: (e: any) => handleDragMove(e, el.id),
                  onDragEnd: (e: any) => handleDragEnd(e, el.id),
                  onTransform: (e: any) => handleTransform(e, el.id),
                  onTransformEnd: (e: any) => handleTransformEnd(e, el.id),
                };
                return (
                  <Group key={el.id} {...common} x={el.x} y={el.y}>
                    <Rect width={el.width} height={el.height} fill="rgba(0,0,0,0)" />
                    <Rect width={el.width} height={el.height} stroke="yellow" strokeWidth={2} dash={[5,5]} listening={false} />
                  </Group>
                );
              })}

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