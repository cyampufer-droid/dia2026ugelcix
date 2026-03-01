import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

const variantStyles = {
  default: 'bg-card border-border',
  primary: 'bg-primary text-primary-foreground border-primary',
  success: 'bg-success text-success-foreground border-success',
  warning: 'bg-secondary text-secondary-foreground border-secondary',
};

const StatCard = ({ title, value, icon: Icon, description, variant = 'default' }: StatCardProps) => (
  <div className={cn('rounded-xl border p-5 shadow-card transition-all hover:shadow-card-hover animate-fade-in', variantStyles[variant])}>
    <div className="flex items-center justify-between mb-3">
      <span className={cn('text-sm font-medium', variant === 'default' ? 'text-muted-foreground' : 'opacity-80')}>{title}</span>
      <Icon className={cn('h-5 w-5', variant === 'default' ? 'text-muted-foreground' : 'opacity-70')} />
    </div>
    <p className="text-3xl font-bold">{value}</p>
    {description && <p className={cn('text-xs mt-1', variant === 'default' ? 'text-muted-foreground' : 'opacity-70')}>{description}</p>}
  </div>
);

export default StatCard;
