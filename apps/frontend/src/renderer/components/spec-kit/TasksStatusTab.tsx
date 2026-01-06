/**
 * TasksStatusTab Component
 *
 * Wrapper component that loads spec-filtered tasks and renders
 * them in the KanbanBoard (organized by status: Backlog, In Progress, Done).
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, AlertCircle } from 'lucide-react';
import type { Spec } from '../../../shared/types/speckit';
import type { Task } from '../../../shared/types';
import { KanbanBoard } from '../KanbanBoard';

interface TasksStatusTabProps {
  spec: Spec;
  projectId: string;
}

export function TasksStatusTab({ spec, projectId }: TasksStatusTabProps) {
  const { t } = useTranslation(['settings', 'common']);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
    setSelectedTask(task);
    // TODO: Could open task detail modal or navigate to task detail view
    console.log('[TasksStatusTab] Task clicked:', task.id);
  };

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

  return (
    <div className="h-full overflow-auto">
      <KanbanBoard
        tasks={tasks}
        onTaskClick={handleTaskClick}
        onRefresh={loadFilteredTasks}
        isRefreshing={isLoading}
      />
    </div>
  );
}
