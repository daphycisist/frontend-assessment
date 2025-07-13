import * as React from 'react';
import { LucideIcon } from 'lucide-react';

type ViewCardProps = {
  Icon: LucideIcon;
  value?: number;
  name: string;
}

export const ViewCard: React.FC<ViewCardProps> = ({ Icon, value, name }: ViewCardProps) => {
  return (
    <article className="stat-card">
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
