/**
 * PlanTab Component
 *
 * Displays the implementation plan (HOW to build) organized by 8 phases.
 * Shows phase status and subtasks for each phase.
 */

import { CheckCircle2, Clock, Circle, Loader2, AlertCircle } from 'lucide-react';
import type { Spec } from '../../../shared/types/speckit';
import { SPECKIT_PHASES } from '../../../shared/types/speckit';

interface PlanTabProps {
  spec: Spec;
}

interface PhaseStatus {
  status: 'pending' | 'in_progress' | 'completed';
  subtaskCount: number;
  completedSubtasks: number;
}

/**
 * Get status display for a phase
 */
function getPhaseStatusDisplay(status: PhaseStatus['status']) {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        label: 'Completed'
      };
    case 'in_progress':
      return {
        icon: Clock,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        label: 'In Progress'
      };
    case 'pending':
    default:
      return {
        icon: Circle,
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/5',
        borderColor: 'border-gray-700',
        label: 'Pending'
      };
  }
}

/**
 * Calculate phase status based on spec data
 * In a real implementation, this would come from the implementation_plan.json
 */
function calculatePhaseStatuses(spec: Spec): Record<number, PhaseStatus> {
  const statuses: Record<number, PhaseStatus> = {};

  // Initialize all phases as pending
  SPECKIT_PHASES.forEach(phase => {
    statuses[phase.id] = {
      status: 'pending',
      subtaskCount: 0,
      completedSubtasks: 0
    };
  });

  // Mark phases based on completedPhases count
  for (let i = 0; i < spec.completedPhases; i++) {
    if (statuses[i]) {
      statuses[i].status = 'completed';
    }
  }

  // Mark current phase as in_progress if there are more phases to go
  if (spec.currentPhase >= 0 && spec.currentPhase < 8 && spec.completedPhases < 8) {
    if (statuses[spec.currentPhase]) {
      statuses[spec.currentPhase].status = 'in_progress';
    }
  }

  return statuses;
}

export function PlanTab({ spec }: PlanTabProps) {
  const phaseStatuses = calculatePhaseStatuses(spec);

  return (
    <div className="p-6 max-w-4xl">
      {/* Overview */}
      <div className="mb-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">Implementation Plan</h2>
        <p className="text-gray-400 text-sm">
          The 8-phase methodology guides the development from setup to polish.
          Each phase represents a distinct stage of the implementation process.
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-400">{spec.completedPhases} completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-400">{spec.status === 'in_progress' ? 1 : 0} in progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-gray-400">{8 - spec.completedPhases - (spec.status === 'in_progress' ? 1 : 0)} pending</span>
          </div>
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="space-y-4">
        {SPECKIT_PHASES.map((phase, index) => {
          const phaseStatus = phaseStatuses[phase.id] || { status: 'pending', subtaskCount: 0, completedSubtasks: 0 };
          const statusDisplay = getPhaseStatusDisplay(phaseStatus.status);
          const StatusIcon = statusDisplay.icon;
          const isLast = index === SPECKIT_PHASES.length - 1;

          return (
            <div key={phase.id} className="flex gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${statusDisplay.bgColor} border ${statusDisplay.borderColor}
                `}>
                  <StatusIcon className={`w-5 h-5 ${statusDisplay.color}`} />
                </div>
                {!isLast && (
                  <div className={`
                    w-0.5 flex-1 min-h-[40px] mt-2
                    ${phaseStatus.status === 'completed' ? 'bg-green-500/30' : 'bg-gray-700'}
                  `} />
                )}
              </div>

              {/* Phase content */}
              <div className={`
                flex-1 pb-4 ${!isLast ? 'border-b border-gray-800' : ''}
              `}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-100 flex items-center gap-2">
                      <span className="text-gray-500 text-sm">Phase {phase.id}</span>
                      <span>{phase.name}</span>
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">{phase.description}</p>
                  </div>
                  <span className={`
                    px-2 py-0.5 rounded text-xs font-medium
                    ${statusDisplay.bgColor} ${statusDisplay.color}
                  `}>
                    {statusDisplay.label}
                  </span>
                </div>

                {/* Subtasks placeholder - would be populated from implementation_plan.json */}
                {phaseStatus.status === 'in_progress' && (
                  <div className="mt-3 p-3 rounded bg-gray-800/50 border border-gray-700">
                    <p className="text-sm text-gray-500">
                      Subtasks for this phase will be displayed here when the implementation plan is loaded.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state if no plan exists */}
      {spec.completedPhases === 0 && spec.status === 'draft' && (
        <div className="mt-6 p-6 rounded-lg border border-dashed border-gray-700 text-center">
          <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">No implementation plan yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Start a task to generate an implementation plan for this spec
          </p>
        </div>
      )}
    </div>
  );
}
