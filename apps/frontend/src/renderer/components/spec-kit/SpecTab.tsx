/**
 * SpecTab Component
 *
 * Displays the spec.md content (WHAT to build) with markdown rendering.
 * Shows metadata and progress information.
 */

import { FileText, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { Spec } from '../../../shared/types/speckit';
import { SPECKIT_PHASES, getPhaseName } from '../../../shared/types/speckit';

interface SpecTabProps {
  spec: Spec;
}

/**
 * Simple markdown renderer for spec content
 * TODO: Replace with a proper markdown renderer (react-markdown)
 */
function renderMarkdown(content: string): React.ReactNode {
  // Split into lines and process
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-lg font-semibold text-gray-200 mt-6 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-xl font-semibold text-gray-100 mt-6 mb-3 border-b border-gray-700 pb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={index} className="text-2xl font-bold text-gray-50 mb-4">
          {line.slice(2)}
        </h1>
      );
    }
    // Bullet points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={index} className="text-gray-300 ml-4 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <li key={index} className="text-gray-300 ml-4 list-decimal">
          {line.replace(/^\d+\.\s/, '')}
        </li>
      );
    }
    // Code blocks (simple)
    else if (line.startsWith('```')) {
      // Skip code block markers for now
    }
    // Regular paragraphs
    else if (line.trim()) {
      elements.push(
        <p key={index} className="text-gray-300 mb-2">
          {line}
        </p>
      );
    }
    // Empty lines
    else {
      elements.push(<div key={index} className="h-2" />);
    }
  });

  return elements;
}

export function SpecTab({ spec }: SpecTabProps) {
  const progressPercent = spec.totalPhases > 0
    ? Math.round((spec.completedPhases / spec.totalPhases) * 100)
    : 0;

  return (
    <div className="p-6 max-w-4xl">
      {/* Metadata Header */}
      <div className="mb-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-100">{spec.name}</h1>
            <p className="text-sm text-gray-500 font-mono">{spec.id}</p>
          </div>
          <div className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${spec.status === 'completed'
              ? 'bg-green-500/10 text-green-400'
              : spec.status === 'in_progress'
              ? 'bg-blue-500/10 text-blue-400'
              : 'bg-gray-500/10 text-gray-400'
            }
          `}>
            {spec.status === 'completed' ? 'Completed' : spec.status === 'in_progress' ? 'In Progress' : 'Draft'}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-gray-300">{progressPercent}% ({spec.completedPhases}/{spec.totalPhases} phases)</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                spec.status === 'completed'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Current Phase */}
          {spec.status === 'in_progress' && spec.currentPhase > 0 && (
            <p className="mt-2 text-sm text-gray-400">
              Current: <span className="text-gray-300">{getPhaseName(spec.currentPhase)}</span>
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="mt-4 pt-4 border-t border-gray-700 flex gap-6 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Created: {new Date(spec.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <RefreshCw className="w-4 h-4" />
            <span>Updated: {new Date(spec.updatedAt).toLocaleDateString()}</span>
          </div>
          {spec.taskCount > 0 && (
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Tasks: {spec.completedTaskCount}/{spec.taskCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Spec Content */}
      {spec.specContent ? (
        <div className="prose prose-invert max-w-none">
          {renderMarkdown(spec.specContent)}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No spec content available</p>
          <p className="text-sm text-gray-500 mt-1">Create a spec.md file to define what to build</p>
        </div>
      )}
    </div>
  );
}
