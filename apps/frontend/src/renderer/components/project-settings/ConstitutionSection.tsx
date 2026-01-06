import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, RefreshCw, FileUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

export interface ConstitutionSectionProps {
  projectId: string;
}

type LoadingState = 'idle' | 'loading' | 'saving' | 'initializing';
type FeedbackState = 'none' | 'success' | 'error';

/**
 * Constitution Section Component
 * Allows editing of the project constitution (AI behavioral guidelines)
 * stored in .specify/memory/constitution.md
 */
export function ConstitutionSection({
  projectId,
}: ConstitutionSectionProps) {
  const { t } = useTranslation(['settings', 'common']);

  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [exists, setExists] = useState<boolean | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [feedback, setFeedback] = useState<{ state: FeedbackState; message: string }>({
    state: 'none',
    message: ''
  });

  const hasChanges = content !== originalContent;

  // Clear feedback after delay
  const showFeedback = useCallback((state: FeedbackState, message: string) => {
    setFeedback({ state, message });
    if (state !== 'none') {
      setTimeout(() => setFeedback({ state: 'none', message: '' }), 3000);
    }
  }, []);

  // Check if constitution exists and load it
  const loadConstitution = useCallback(async () => {
    if (!projectId) return;

    setLoadingState('loading');
    try {
      const existsResult = await window.electronAPI.constitutionExists(projectId);
      if (!existsResult.success) {
        showFeedback('error', existsResult.error || t('constitution.errorCheckingExists'));
        setLoadingState('idle');
        return;
      }

      setExists(existsResult.data ?? false);

      if (existsResult.data) {
        const contentResult = await window.electronAPI.getConstitution(projectId);
        if (contentResult.success && contentResult.data) {
          setContent(contentResult.data);
          setOriginalContent(contentResult.data);
        } else {
          showFeedback('error', contentResult.error || t('constitution.errorLoading'));
        }
      }
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : t('constitution.errorLoading'));
    }
    setLoadingState('idle');
  }, [projectId, t, showFeedback]);

  // Load constitution when component mounts
  useEffect(() => {
    if (projectId) {
      loadConstitution();
    }
  }, [projectId, loadConstitution]);

  // Save constitution
  const handleSave = async () => {
    if (!projectId || loadingState !== 'idle') return;

    setLoadingState('saving');
    try {
      const result = await window.electronAPI.saveConstitution(projectId, content);
      if (result.success) {
        setOriginalContent(content);
        showFeedback('success', t('constitution.saved'));
      } else {
        showFeedback('error', result.error || t('constitution.errorSaving'));
      }
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : t('constitution.errorSaving'));
    }
    setLoadingState('idle');
  };

  // Initialize default constitution
  const handleInitialize = async () => {
    if (!projectId || loadingState !== 'idle') return;

    setLoadingState('initializing');
    try {
      const result = await window.electronAPI.initConstitution(projectId);
      if (result.success && result.data) {
        setContent(result.data);
        setOriginalContent(result.data);
        setExists(true);
        showFeedback('success', t('constitution.initialized'));
      } else {
        showFeedback('error', result.error || t('constitution.errorInitializing'));
      }
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : t('constitution.errorInitializing'));
    }
    setLoadingState('idle');
  };

  // Reload constitution (discard changes)
  const handleReload = async () => {
    if (!projectId || loadingState !== 'idle') return;
    await loadConstitution();
    showFeedback('success', t('constitution.reloaded'));
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="space-y-1">
        <Label className="font-normal text-foreground">
          {t('constitution.label')}
        </Label>
        <p className="text-xs text-muted-foreground">
          {t('constitution.description')}
        </p>
      </div>

      {/* Loading state */}
      {loadingState === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common:status.loading')}
        </div>
      )}

      {/* Content area */}
      {loadingState !== 'loading' && (
        <>
          {exists === false ? (
            // No constitution exists - show initialize button
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('constitution.notExists')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleInitialize}
                disabled={loadingState !== 'idle'}
                className="gap-2"
              >
                {loadingState === 'initializing' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="h-4 w-4" />
                )}
                {t('constitution.initializeDefault')}
              </Button>
            </div>
          ) : (
            // Constitution exists - show editor
            <>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('constitution.placeholder')}
                className="min-h-[300px] font-mono text-sm resize-y"
                disabled={loadingState !== 'idle'}
              />

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={!hasChanges || loadingState !== 'idle'}
                    className="gap-2"
                  >
                    {loadingState === 'saving' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {t('common:actions.save')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReload}
                    disabled={loadingState !== 'idle'}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t('constitution.reload')}
                  </Button>
                </div>

                {/* Feedback */}
                {feedback.state !== 'none' && (
                  <div className={`flex items-center gap-1.5 text-sm ${
                    feedback.state === 'success' ? 'text-success' : 'text-destructive'
                  }`}>
                    {feedback.state === 'success' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    {feedback.message}
                  </div>
                )}
              </div>

              {/* Unsaved changes indicator */}
              {hasChanges && (
                <p className="text-xs text-warning">
                  {t('constitution.unsavedChanges')}
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
