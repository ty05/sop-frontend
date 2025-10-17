'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { documentsAPI, stepsAPI, exportAPI } from '@/lib/api';
import { Document, Step } from '@/types';
import StepEditor from '@/components/StepEditor';
import ModeSwitcher from '@/components/ModeSwitcher';
import RunMode from '@/components/RunMode';
import SearchBar from '@/components/SearchBar';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { useWorkspace } from '@/contexts/WorkspaceContext';

type Mode = 'edit' | 'browse' | 'run';

export default function DocumentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params.id as string;
  const { activeWorkspace } = useWorkspace();

  const [document, setDocument] = useState<Document | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [mode, setMode] = useState<Mode>('browse');
  const [loading, setLoading] = useState(true);

  // Check if user has edit permission (owner or editor)
  const canEdit = activeWorkspace?.role === 'owner' || activeWorkspace?.role === 'editor';
  const isViewer = activeWorkspace?.role === 'viewer';

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  // Handle deep linking to specific steps
  useEffect(() => {
    if (!loading && steps.length > 0) {
      const stepId = searchParams.get('step');
      if (stepId) {
        // Wait a bit for the DOM to render
        setTimeout(() => {
          const element = document.getElementById(`step-${stepId}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [loading, steps, searchParams]);

  const loadDocument = async () => {
    try {
      const [docResponse, stepsResponse] = await Promise.all([
        documentsAPI.get(documentId),
        stepsAPI.list(documentId)
      ]);
      setDocument(docResponse.data);
      setSteps(stepsResponse.data);
    } catch (error) {
      console.error('Failed to load document', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'draft' | 'published' | 'archived') => {
    if (!canEdit) {
      alert('You do not have permission to change document status. Only owners and editors can make changes.');
      return;
    }

    try {
      await documentsAPI.update(documentId, { status: newStatus });
      setDocument(prev => prev ? { ...prev, status: newStatus } : null);
      alert(`Document ${newStatus === 'published' ? 'published' : newStatus === 'draft' ? 'set to draft' : 'archived'} successfully! ${newStatus === 'published' ? 'Steps are now searchable.' : ''}`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to update document status';
      if (errorMsg.includes('permission') || errorMsg.includes('Editor role required')) {
        alert('You do not have permission to change document status. Only owners and editors can make changes.');
      } else {
        alert(errorMsg);
      }
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await exportAPI.exportPdf(documentId);

      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document?.title || 'document'}.pdf`;

      // Trigger download
      window.document.body.appendChild(link);
      link.click();

      // Cleanup
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error.response?.status === 503) {
        alert('PDF export is currently unavailable. Please contact support.');
      } else {
        alert('Failed to export PDF');
      }
      console.error('PDF export error:', error);
    }
  };

  const handleAddStep = async (type: 'text' | 'checklist' | 'image') => {
    // Check permission
    if (!canEdit) {
      alert('You do not have permission to edit this document. Only owners and editors can make changes.');
      return;
    }

    try {
      const stepData = {
        type,
        order: steps.length,
        title: `New ${type} step`,
        body: type === 'text' ? 'Enter your text here...' : undefined,
        checklist_items: type === 'checklist' ? [{ text: 'Item 1', required: false }] : undefined,
      };

      const response = await stepsAPI.create(documentId, stepData);
      setSteps([...steps, response.data]);
    } catch (error: any) {
      // Show better error message based on response
      const errorMsg = error.response?.data?.detail || 'Failed to create step';
      if (errorMsg.includes('permission') || errorMsg.includes('Editor role required')) {
        alert('You do not have permission to edit this document. Only owners and editors can make changes.');
      } else {
        alert(errorMsg);
      }
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!document) {
    return <div className="p-8">Document not found</div>;
  }

  // Run mode - full screen
  if (mode === 'run') {
    return <RunMode steps={steps} documentId={documentId} onExit={() => setMode('browse')} />;
  }

  // Edit/Browse mode
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header - Sticky */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <SearchBar workspaceId={document.workspace_id} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold mb-4">{document.title}</h1>

          {/* Viewer Notice */}
          {isViewer && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-blue-600">👁️</span>
                <div className="flex-1">
                  <p className="text-sm text-blue-800">
                    <strong>View-Only Access:</strong> You have viewer permissions for this document.
                    You can read and run procedures, but cannot make changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Controls - Stack on mobile, horizontal on desktop */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
            {/* Status Badge/Selector */}
            <div className="flex items-center gap-2">
              <select
                value={document.status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                disabled={!canEdit}
                className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${
                  canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                } ${
                  document.status === 'published'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : document.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300'
                }`}
                title={!canEdit ? 'Only owners and editors can change status' : ''}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              {document.status === 'published' && (
                <span className="text-xs text-green-600" title="Steps are searchable">
                  🔍
                </span>
              )}
            </div>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPdf}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 justify-center"
              title="Export as PDF"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {/* Mode Switcher - Full width on mobile, hide edit mode for viewers */}
            {canEdit ? (
              <ModeSwitcher currentMode={mode} onChange={setMode} />
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('browse')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'browse'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => setMode('run')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'run'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Run
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-600">{document.description}</p>
        </div>

        {/* Status Notice */}
        {document.status === 'draft' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">ℹ️</span>
              <div className="flex-1">
                <p className="text-sm text-yellow-800">
                  <strong>Draft Mode:</strong> This document is not published. Steps won't appear in search results.
                  Change status to "Published" above to make it searchable.
                </p>
              </div>
            </div>
          </div>
        )}

        {document.status === 'archived' && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-gray-600">📦</span>
              <div className="flex-1">
                <p className="text-sm text-gray-800">
                  <strong>Archived:</strong> This document is archived and won't appear in search results.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Section */}
        <div className="mb-6">
          <QRCodeGenerator documentId={documentId} />
        </div>

        {/* Add buttons (Edit mode only, editors and owners only) */}
        {mode === 'edit' && canEdit && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => handleAddStep('text')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Text
            </button>
            <button
              onClick={() => handleAddStep('checklist')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              + Checklist
            </button>
            <button
              onClick={() => handleAddStep('image')}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              + Image
            </button>
            <button
              onClick={() => handleAddStep('video')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              + Video
            </button>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id} id={`step-${step.id}`}>
              <StepEditor
                step={step}
                onUpdate={loadDocument}
                readOnly={mode === 'browse'}
              />
            </div>
          ))}

          {steps.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
              <p className="text-gray-500">
                {mode === 'edit'
                  ? 'No steps yet. Add your first step above!'
                  : 'No steps in this document'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
