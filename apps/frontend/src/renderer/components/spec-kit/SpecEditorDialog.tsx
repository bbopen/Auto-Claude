/**
 * SpecEditorDialog Component
 *
 * Modal dialog for creating and editing spec.md files.
 * Follows the pattern from ConstitutionSection for consistent UX.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { Spec } from '../../../shared/types/speckit';
import { createSpec, updateSpec } from '../../stores/spec-kit-store';

interface SpecEditorDialogProps {
  projectId: string;
  mode: 'create' | 'edit';
  spec?: Spec; // Only for edit mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FeedbackState {
  state: 'success' | 'error';
  message: string;
}

export function SpecEditorDialog({
  projectId,
  mode,
  spec,
  open,
  onOpenChange,
  onSuccess
}: SpecEditorDialogProps) {
  const { t } = useTranslation(['settings', 'common']);

  // Form state
  const [specId, setSpecId] = useState('');
  const [specName, setSpecName] = useState('');
  const [specContent, setSpecContent] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && spec) {
        setSpecId(spec.id);
        setSpecName(spec.name);
        setSpecContent(spec.specContent || '');
      } else {
        // Generate next spec ID
        setSpecId('');
        setSpecName('');
        setSpecContent(getDefaultSpecTemplate());
      }
      setFeedback(null);
    }
  }, [open, mode, spec]);

  // Validation
  const isValidId = /^\d{3}-[a-z][a-z0-9-]*$/.test(specId);
  const canSave = mode === 'edit'
    ? specContent.trim().length > 0
    : isValidId && specName.trim().length > 0 && specContent.trim().length > 0;

  // Auto-generate ID from name
  const handleNameChange = (name: string) => {
    setSpecName(name);

    // Only auto-generate ID in create mode if user hasn't manually edited it
    if (mode === 'create') {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      if (slug) {
        // Keep existing number prefix if present, otherwise default to 001
        const currentNum = specId.match(/^(\d{3})/)?.[1] || '001';
        setSpecId(`${currentNum}-${slug}`);
      }
    }
  };

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      let result;

      if (mode === 'create') {
        result = await createSpec(projectId, {
          id: specId,
          name: specName,
          specContent
        });
      } else {
        result = await updateSpec(projectId, spec!.id, {
          specContent
        });
      }

      if (result.success) {
        setFeedback({
          state: 'success',
          message: mode === 'create'
            ? t('settings:projectSections.specKit.editor.created')
            : t('settings:projectSections.specKit.editor.updated')
        });

        // Close after a short delay to show success feedback
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
        }, 500);
      } else {
        setFeedback({
          state: 'error',
          message: result.error || t('common:error.unknown')
        });
      }
    } catch (err) {
      setFeedback({
        state: 'error',
        message: err instanceof Error ? err.message : t('common:error.unknown')
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gray-800 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">
            {mode === 'create'
              ? t('settings:projectSections.specKit.editor.createTitle')
              : t('settings:projectSections.specKit.editor.editTitle')
            }
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 text-gray-400 hover:text-gray-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Spec ID (create mode only) */}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t('settings:projectSections.specKit.editor.specIdLabel')}
              </label>
              <input
                type="text"
                value={specId}
                onChange={(e) => setSpecId(e.target.value)}
                placeholder={t('settings:projectSections.specKit.editor.specIdPlaceholder')}
                className={`
                  w-full px-3 py-2 bg-gray-900 border rounded-lg text-sm
                  ${!specId || isValidId
                    ? 'border-gray-600 focus:border-blue-500'
                    : 'border-red-500'
                  }
                  focus:outline-none
                `}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('settings:projectSections.specKit.editor.specIdHint')}
              </p>
              {specId && !isValidId && (
                <p className="text-xs text-red-400 mt-1">
                  {t('settings:projectSections.specKit.editor.invalidId')}
                </p>
              )}
            </div>
          )}

          {/* Spec Name (create mode only) */}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t('settings:projectSections.specKit.editor.specNameLabel')}
              </label>
              <input
                type="text"
                value={specName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t('settings:projectSections.specKit.editor.specNamePlaceholder')}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Spec Content */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('settings:projectSections.specKit.editor.specContentLabel')}
            </label>
            <textarea
              value={specContent}
              onChange={(e) => setSpecContent(e.target.value)}
              placeholder={t('settings:projectSections.specKit.editor.specContentPlaceholder')}
              className="w-full h-80 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm font-mono focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                ${feedback.state === 'success'
                  ? 'bg-green-900/30 text-green-400'
                  : 'bg-red-900/30 text-red-400'
                }
              `}
            >
              {feedback.state === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {feedback.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white"
          >
            {t('common:buttons.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              ${canSave && !isSaving
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common:buttons.saving')}
              </>
            ) : (
              t('common:buttons.save')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Get default spec.md template for new specs
 */
function getDefaultSpecTemplate(): string {
  return `# Feature Name

## Overview
Brief description of what this feature does and why it's needed.

## Requirements
- Requirement 1
- Requirement 2
- Requirement 3

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Considerations
Notes on implementation approach, constraints, or dependencies.

## Out of Scope
What this feature explicitly does NOT include.
`;
}
