'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';

interface Chapter {
  start_sec: number;
  title: string;
}

interface ChapterEditorProps {
  videoId: string;
  duration: number;
}

export default function ChapterEditor({ videoId, duration }: ChapterEditorProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChapters();
  }, [videoId]);

  const loadChapters = async () => {
    try {
      const response = await apiClient.get(`/chapters/${videoId}/chapters`);
      setChapters(response.data);
    } catch (error) {
      console.error('Failed to load chapters:', error);
    }
  };

  const addChapter = () => {
    setChapters([
      ...chapters,
      { start_sec: 0, title: 'New Chapter' }
    ]);
  };

  const updateChapter = <K extends keyof Chapter>(
    index: number,
    field: K,
    value: Chapter[K]
  ) => {
    const updated = [...chapters];
    updated[index][field] = value;
    setChapters(updated);
  };

  const removeChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const saveChapters = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/chapters/${videoId}/chapters`, chapters);
      alert('Chapters saved!');
      loadChapters();
    } catch (error) {
      alert('Failed to save chapters');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Chapters</h4>
        <button
          onClick={addChapter}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          + Add Chapter
        </button>
      </div>

      <div className="space-y-3 mb-4">
        {chapters.map((chapter, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="number"
              value={chapter.start_sec}
              onChange={(e) => updateChapter(index, 'start_sec', parseFloat(e.target.value))}
              min={0}
              max={duration}
              step={0.1}
              className="w-20 px-2 py-1 border rounded text-sm"
            />
            <span className="text-xs text-gray-500">
              ({formatTime(chapter.start_sec)})
            </span>
            <input
              type="text"
              value={chapter.title}
              onChange={(e) => updateChapter(index, 'title', e.target.value)}
              className="flex-1 px-2 py-1 border rounded text-sm"
              placeholder="Chapter title"
            />
            <button
              onClick={() => removeChapter(index)}
              className="text-red-600 text-sm"
            >
              Remove
            </button>
          </div>
        ))}

        {chapters.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No chapters yet. Add your first chapter.
          </p>
        )}
      </div>

      <button
        onClick={saveChapters}
        disabled={loading || chapters.length === 0}
        className="w-full bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Saving...' : 'Save All Chapters'}
      </button>
    </div>
  );
}
