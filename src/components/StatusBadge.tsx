import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle, Send } from 'lucide-react';
import { PeppolSendStatus } from '@/types/hubspot';

interface StatusBadgeProps {
  status: PeppolSendStatus['status'];
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: PeppolSendStatus['status']) => {
    switch (status) {
      case 'delivered':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Afgeleverd',
          className: 'bg-success text-success-foreground border-success/20'
        };
      case 'sent':
        return {
          variant: 'default' as const,
          icon: Send,
          label: 'Verzonden',
          className: 'bg-primary text-primary-foreground border-primary/20'
        };
      case 'pending':
        return {
          variant: 'default' as const,
          icon: Clock,
          label: 'In behandeling',
          className: 'bg-warning text-warning-foreground border-warning/20'
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Mislukt',
          className: 'bg-destructive text-destructive-foreground border-destructive/20'
        };
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          label: 'Geweigerd',
          className: 'bg-destructive text-destructive-foreground border-destructive/20'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: AlertCircle,
          label: 'Onbekend',
          className: 'bg-muted text-muted-foreground border-muted/20'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 border ${config.className} ${className}`}
    >
      <Icon className="h-3 w-3" />
      <span className="text-xs font-medium">{config.label}</span>
    </Badge>
  );
}