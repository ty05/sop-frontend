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
import { useTranslations } from 'next-intl';

type Mode = 'edit' | 'browse' | 'run';

export default function DocumentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params.id as string;
  const { activeWorkspace } = useWorkspace();
  const t = useTranslations('step');
  const tDocument = useTranslations('document');
  const tCommon = useTranslations('common');
  const tNotifications = useTranslations('notifications');

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
          const element = window.document.getElementById(`step-${stepId}`);
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

  const handleStatusChange = async (newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    if (!canEdit) {
      alert(tDocument('statusChangePermissionDenied'));
      return;
    }

    try {
      await documentsAPI.update(documentId, { status: newStatus });
      setDocument(prev => prev ? { ...prev, status: newStatus } : null);
      const successMsg = newStatus === 'PUBLISHED'
        ? tDocument('documentPublished')
        : newStatus === 'DRAFT'
        ? tDocument('documentDraft')
        : tDocument('documentArchived');
      alert(successMsg);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to update document status';
      if (errorMsg.includes('permission') || errorMsg.includes('Editor role required')) {
        alert(tDocument('statusChangePermissionDenied'));
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

  const handleAddStep = async (type: 'text' | 'checklist' | 'image' | 'video') => {
    // Check permission
    if (!canEdit) {
      alert(tDocument('editPermissionDenied'));
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
        alert(tDocument('editPermissionDenied'));
      } else {
        alert(errorMsg);
      }
    }
  };

  // Move step up or down
  const handleMoveStep = async (index: number, direction: 'up' | 'down') => {
    // Check permission
    if (!canEdit) {
      alert(tDocument('editPermissionDenied'));
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;

    // Validate bounds
    if (newIndex < 0 || newIndex >= steps.length) {
      return;
    }

    try {
      // Reorder steps locally
      const newSteps = [...steps];
      const [movedStep] = newSteps.splice(index, 1);
      newSteps.splice(newIndex, 0, movedStep);

      // Update local state immediately for better UX
      setSteps(newSteps);

      // Send new order to backend
      const stepIds = newSteps.map(step => step.id);
      await stepsAPI.reorder(documentId, stepIds);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to reorder steps';
      if (errorMsg.includes('permission') || errorMsg.includes('Editor role required')) {
        alert(tDocument('editPermissionDenied'));
      } else {
        alert(errorMsg);
      }
      // Reload document to restore correct order
      loadDocument();
    }
  };

  if (loading) {
    return <div className="p-8">{tCommon('loading')}</div>;
  }

  if (!document) {
    return <div className="p-8">{tCommon('documentNotFound')}</div>;
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
                    <strong>{tDocument('viewOnlyAccess')}:</strong> {tDocument('viewOnlyAccessMessage')}
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
                  document.status === 'PUBLISHED'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : document.status === 'DRAFT'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300'
                }`}
                title={!canEdit ? tDocument('statusChangePermission') : ''}
              >
                <option value="DRAFT">{tDocument('status.draft')}</option>
                <option value="PUBLISHED">{tDocument('status.published')}</option>
                <option value="ARCHIVED">{tDocument('status.archived')}</option>
              </select>
              {document.status === 'PUBLISHED' && (
                <span className="text-xs text-green-600" title="Steps are searchable">
                  🔍
                </span>
              )}
            </div>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPdf}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 justify-center"
              title={tDocument('exportAsPdf')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span className="hidden sm:inline">{tDocument('exportPdf')}</span>
              <span className="sm:hidden">{tDocument('pdf')}</span>
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
                  {tCommon('browse')}
                </button>
                <button
                  onClick={() => setMode('run')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    (mode as Mode) === 'run'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tCommon('run')}
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-600">{document.description}</p>
        </div>

        {/* Status Notice */}
        {document.status === 'DRAFT' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">ℹ️</span>
              <div className="flex-1">
                <p className="text-sm text-yellow-800">
                  <strong>{tNotifications('draftModeTitle')}:</strong> {tNotifications('draftMode')}
                </p>
              </div>
            </div>
          </div>
        )}

        {document.status === 'ARCHIVED' && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-gray-600">📦</span>
              <div className="flex-1">
                <p className="text-sm text-gray-800">
                  <strong>{tNotifications('archivedModeTitle')}:</strong> {tNotifications('archivedMode')}
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
              {t('addText')}
            </button>
            <button
              onClick={() => handleAddStep('checklist')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {t('addChecklist')}
            </button>
            <button
              onClick={() => handleAddStep('image')}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              {t('addImage')}
            </button>
            <button
              onClick={() => handleAddStep('video')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              {t('addVideo')}
            </button>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              id={`step-${step.id}`}
              className="relative"
            >
              <div className="flex gap-2 items-start">
                {/* Reorder buttons in edit mode */}
                {mode === 'edit' && canEdit && (
                  <div className="flex-shrink-0 flex flex-col gap-1 pt-2">
                    <button
                      onClick={() => handleMoveStep(index, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded transition-colors ${
                        index === 0
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Move up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMoveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                      className={`p-1 rounded transition-colors ${
                        index === steps.length - 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Move down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="text-xs text-gray-400 text-center">{index + 1}</div>
                  </div>
                )}
                <div className="flex-1">
                  <StepEditor
                    step={step}
                    onUpdate={loadDocument}
                    readOnly={mode === 'browse'}
                  />
                </div>
              </div>
            </div>
          ))}

          {steps.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
              <p className="text-gray-500">
                {mode === 'edit'
                  ? t('noStepsYet')
                  : t('noSteps')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
