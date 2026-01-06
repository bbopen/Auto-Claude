import { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { TaskCard } from './TaskCard';
import { SPECKIT_PHASES, type SpecKitPhase } from '../../shared/types/speckit';
import { cn } from '../lib/utils';
import type { Task } from '../../shared/types';
import {
  CheckCircle2,
  Circle,
  Layers,
  Database,
  Cog,
  Server,
  Layout,
  Route,
  Link,
  Sparkles
} from 'lucide-react';

interface KanbanPhaseViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

interface PhaseColumnProps {
  phase: SpecKitPhase;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

/**
 * Get the icon for a spec-kit phase
 */
function getPhaseIcon(phaseId: number): React.ReactNode {
  const iconClass = "h-4 w-4";
  switch (phaseId) {
    case 0:
      return <Cog className={iconClass} />;
    case 1:
      return <Database className={iconClass} />;
    case 2:
      return <Layers className={iconClass} />;
    case 3:
      return <Server className={iconClass} />;
    case 4:
      return <Layout className={iconClass} />;
    case 5:
      return <Route className={iconClass} />;
    case 6:
      return <Link className={iconClass} />;
    case 7:
      return <Sparkles className={iconClass} />;
    default:
      return <Circle className={iconClass} />;
  }
}

/**
 * Get phase color classes based on phase ID
 */
function getPhaseColorClasses(phaseId: number): { border: string; badge: string; progress: string } {
  switch (phaseId) {
    case 0:
      return {
        border: 'border-t-slate-500',
        badge: 'bg-slate-500/10 text-slate-400',
        progress: 'bg-slate-500'
      };
    case 1:
      return {
        border: 'border-t-cyan-500',
        badge: 'bg-cyan-500/10 text-cyan-400',
        progress: 'bg-cyan-500'
      };
    case 2:
      return {
        border: 'border-t-purple-500',
        badge: 'bg-purple-500/10 text-purple-400',
        progress: 'bg-purple-500'
      };
    case 3:
      return {
        border: 'border-t-blue-500',
        badge: 'bg-blue-500/10 text-blue-400',
        progress: 'bg-blue-500'
      };
    case 4:
      return {
        border: 'border-t-pink-500',
        badge: 'bg-pink-500/10 text-pink-400',
        progress: 'bg-pink-500'
      };
    case 5:
      return {
        border: 'border-t-amber-500',
        badge: 'bg-amber-500/10 text-amber-400',
        progress: 'bg-amber-500'
      };
    case 6:
      return {
        border: 'border-t-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-400',
        progress: 'bg-emerald-500'
      };
    case 7:
      return {
        border: 'border-t-yellow-500',
        badge: 'bg-yellow-500/10 text-yellow-400',
        progress: 'bg-yellow-500'
      };
    default:
      return {
        border: 'border-t-muted-foreground',
        badge: 'bg-muted text-muted-foreground',
        progress: 'bg-muted-foreground'
      };
  }
}

/**
 * Extract phase number from task metadata or title
 * Falls back to 0 if not found
 */
function getTaskPhase(task: Task): number {
  // Check if phase is stored in metadata
  if (task.metadata && 'phase' in task.metadata) {
    const phase = (task.metadata as Record<string, unknown>).phase;
    if (typeof phase === 'number') {
      return phase;
    }
  }

  // Try to extract from title pattern like "Phase 3:" or "[3]"
  const titleMatch = task.title.match(/(?:Phase\s*|^\[)(\d+)(?:\]|:)/i);
  if (titleMatch) {
    return parseInt(titleMatch[1], 10);
  }

  // Default to phase 0 (Setup)
  return 0;
}

/**
 * Check if a task is considered complete
 */
function isTaskComplete(task: Task): boolean {
  return task.status === 'done';
}

/**
 * Phase column component
 */
const PhaseColumn = memo(function PhaseColumn({ phase, tasks, onTaskClick }: PhaseColumnProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const colorClasses = getPhaseColorClasses(phase.id);

  const completedTasks = tasks.filter(isTaskComplete).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div
      className={cn(
        'flex min-w-72 max-w-80 flex-col rounded-xl border border-white/5 bg-linear-to-b from-secondary/30 to-transparent backdrop-blur-sm',
        colorClasses.border,
        'border-t-2'
      )}
    >
      {/* Column header */}
      <div className="flex flex-col gap-2 p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('p-1.5 rounded-md', colorClasses.badge)}>
              {getPhaseIcon(phase.id)}
            </span>
            <div className="flex flex-col">
              <h3 className="font-semibold text-sm text-foreground">
                {t(`phases.phase${phase.id}.name`, phase.name)}
              </h3>
              <span className="text-xs text-muted-foreground">
                {t(`phases.phase${phase.id}.description`, phase.description)}
              </span>
            </div>
          </div>
          <span className="column-count-badge">
            {totalTasks}
          </span>
        </div>

        {/* Progress indicator */}
        {totalTasks > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {t('phases.progress')}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle2 className="h-3 w-3" />
                {completedTasks}/{totalTasks}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-1.5"
              indicatorClassName={colorClasses.progress}
            />
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full px-3 pb-3 pt-2">
          <div className="space-y-3 min-h-[120px]">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Circle className="h-6 w-6 text-muted-foreground/50" />
                <span className="mt-2 text-sm font-medium text-muted-foreground/70">
                  {t('phases.noTasks')}
                </span>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});

/**
 * KanbanPhaseView - Display tasks organized by spec-kit phases
 *
 * Shows 8 columns representing the spec-kit development phases:
 * - Phase 0: Setup
 * - Phase 1: Data Models
 * - Phase 2: Core Services
 * - Phase 3: API Layer
 * - Phase 4: UI Components
 * - Phase 5: Pages & Routes
 * - Phase 6: Integration
 * - Phase 7: Polish
 */
export function KanbanPhaseView({ tasks, onTaskClick }: KanbanPhaseViewProps) {
  const { t } = useTranslation('tasks');

  // Group tasks by phase
  const tasksByPhase = useMemo(() => {
    const grouped = new Map<number, Task[]>();

    // Initialize all phases with empty arrays
    SPECKIT_PHASES.forEach(phase => {
      grouped.set(phase.id, []);
    });

    // Group tasks into phases
    tasks.forEach(task => {
      // Skip archived tasks
      if (task.metadata?.archivedAt) return;

      const phaseId = getTaskPhase(task);
      const phaseTasks = grouped.get(phaseId) || [];
      phaseTasks.push(task);
      grouped.set(phaseId, phaseTasks);
    });

    // Sort tasks within each phase by status (in-progress first, then by date)
    grouped.forEach((phaseTasks, phaseId) => {
      phaseTasks.sort((a, b) => {
        // In-progress tasks first
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;

        // Done tasks last
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (b.status === 'done' && a.status !== 'done') return -1;

        // Then by updated date (newest first)
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });
      grouped.set(phaseId, phaseTasks);
    });

    return grouped;
  }, [tasks]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const allTasks = tasks.filter(t => !t.metadata?.archivedAt);
    const completedTasks = allTasks.filter(isTaskComplete);
    return {
      completed: completedTasks.length,
      total: allTasks.length,
      percent: allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0
    };
  }, [tasks]);

  return (
    <div className="flex h-full flex-col">
      {/* Header with overall progress */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t('phases.title')}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {t('phases.overallProgress', {
                completed: overallProgress.completed,
                total: overallProgress.total,
                percent: overallProgress.percent
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Phase columns - horizontal scrollable */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        <ScrollArea className="h-full w-full">
          <div className="flex gap-4 pb-4">
            {SPECKIT_PHASES.map(phase => (
              <PhaseColumn
                key={phase.id}
                phase={phase}
                tasks={tasksByPhase.get(phase.id) || []}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
