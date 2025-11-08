import { ReactNode, memo } from 'react';
import {
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Zap,
  Target,
  Heart
} from '@/components/ui/Icons';
import { clsx } from 'clsx';

interface CalloutProps {
  type?: 'info' | 'success' | 'warning' | 'error' | 'tip' | 'note' | 'idea' | 'important';
  children: ReactNode;
  className?: string;
}

const calloutConfig = {
  info: {
    icon: Info,
    color: 'blue',
    label: 'Info'
  },
  success: {
    icon: CheckCircle,
    color: 'green',
    label: 'Success'
  },
  warning: {
    icon: AlertTriangle,
    color: 'yellow',
    label: 'Warning'
  },
  error: {
    icon: XCircle,
    color: 'red',
    label: 'Error'
  },
  tip: {
    icon: Lightbulb,
    color: 'purple',
    label: 'Tip'
  },
  note: {
    icon: Target,
    color: 'gray',
    label: 'Note'
  },
  idea: {
    icon: Zap,
    color: 'yellow',
    label: 'Idea'
  },
  important: {
    icon: Heart,
    color: 'red',
    label: 'Important'
  }
} as const;

const CalloutInternal: React.FC<CalloutProps> = ({
  type = 'info',
  children,
  className = ''
}) => {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'notion-callout',
        `notion-callout-${config.color}`,
        className
      )}
      role="alert"
      aria-label={config.label}
    >
      <div className="notion-callout-icon">
        <Icon size={20} />
      </div>
      <div className="notion-callout-content">
        {children}
      </div>
    </div>
  );
};

// Use memo optimization to prevent unnecessary re-renders
export const Callout = memo(CalloutInternal);