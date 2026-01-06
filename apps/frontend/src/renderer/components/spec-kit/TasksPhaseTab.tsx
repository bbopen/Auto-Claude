/**
 * TasksPhaseTab Component
 *
 * Wrapper component that loads spec-filtered tasks and renders
 * them in the KanbanPhaseView (organized by 8 implementation phases).
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, AlertCircle, Layers } from 'lucide-react';
import type { Spec } from '../../../shared/types/speckit';
import type { Task } from '../../../shared/types';
import { KanbanPhaseView } from '../KanbanPhaseView';

interface TasksPhaseTabProps {
  spec: Spec;
  projectId: string;
}

export function TasksPhaseTab({ spec, projectId }: TasksPhaseTabProps) {
  const { t } = useTranslation(['settings', 'common']);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFilteredTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.getTasks(projectId, spec.id);
      if (result.success && result.data) {
        setTasks(result.data);
      } else {
        setError(result.error || t('common:error.failedToLoad'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:error.unknown'));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, spec.id, t]);

  useEffect(() => {
    loadFilteredTasks();
  }, [loadFilteredTasks]);

  const handleTaskClick = (task: Task) => {
    // TODO: Could open task detail modal or navigate to task detail view
    console.log('[TasksPhaseTab] Task clicked:', task.id);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mb-4" />
        <p className="text-gray-400">{t('common:loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadFilteredTasks}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common:actions.retry')}
        </button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Layers className="w-12 h-12 text-gray-500 mb-4" />
        <p className="text-gray-400 mb-2">{t('settings:projectSections.specKit.noTasks')}</p>
        <p className="text-sm text-gray-500 text-center max-w-md">
          {t('settings:projectSections.specKit.noTasksDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <KanbanPhaseView
        tasks={tasks}
        onTaskClick={handleTaskClick}
      />
    </div>
  );
}
