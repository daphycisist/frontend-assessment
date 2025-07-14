import * as React from 'react';
import { LucideIcon } from 'lucide-react';

type ViewCardProps = {
  Icon: LucideIcon;
  value?: number;
  name: string;
  ariaLabel: string;
}

export const ViewCard: React.FC<ViewCardProps> = ({ Icon, value, name, ariaLabel }: ViewCardProps) => {
  return (
    <article className="stat-card" aria-label={ariaLabel}>
      <div className="stat-icon">
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-value">
          ${value ? value.toLocaleString() : "0"}
        </div>
        <div className="stat-label">{name}</div>
      </div>
    </article>
  );
}
