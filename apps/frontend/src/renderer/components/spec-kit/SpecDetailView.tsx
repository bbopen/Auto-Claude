/**
 * SpecDetailView Component
 *
 * Displays detailed view of a spec with tabbed interface:
 * - Spec tab: Rendered spec.md (WHAT to build)
 * - Plan tab: Implementation phases (HOW to build)
 * - Tasks-Status tab: KanbanBoard scoped to this spec
 * - Tasks-Phase tab: KanbanPhaseView scoped to this spec
 */

import { useTranslation } from 'react-i18next';
import { FileText, ListChecks, LayoutGrid, Layers } from 'lucide-react';
import type { Spec } from '../../../shared/types/speckit';
import { useSpecKitStore, type SpecDetailTab } from '../../stores/spec-kit-store';
import { SpecTab } from './SpecTab';
import { PlanTab } from './PlanTab';
import { TasksStatusTab } from './TasksStatusTab';
import { TasksPhaseTab } from './TasksPhaseTab';

interface SpecDetailViewProps {
  spec: Spec;
  projectId: string;
}

interface TabConfig {
  id: SpecDetailTab;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: 'spec', labelKey: 'settings:projectSections.specKit.tabs.spec', icon: FileText },
  { id: 'plan', labelKey: 'settings:projectSections.specKit.tabs.plan', icon: ListChecks },
  { id: 'tasks-status', labelKey: 'settings:projectSections.specKit.tabs.tasksStatus', icon: LayoutGrid },
  { id: 'tasks-phase', labelKey: 'settings:projectSections.specKit.tabs.tasksPhase', icon: Layers }
];

export function SpecDetailView({ spec, projectId }: SpecDetailViewProps) {
  const { t } = useTranslation(['settings', 'common']);
  const { activeTab, setActiveTab } = useSpecKitStore();

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 bg-gray-800/50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                border-b-2 -mb-[2px]
                ${isActive
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'spec' && (
          <SpecTab spec={spec} />
        )}
        {activeTab === 'plan' && (
          <PlanTab spec={spec} />
        )}
        {activeTab === 'tasks-status' && (
          <TasksStatusTab spec={spec} projectId={projectId} />
        )}
        {activeTab === 'tasks-phase' && (
          <TasksPhaseTab spec={spec} projectId={projectId} />
        )}
      </div>
    </div>
  );
}
