import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { TransactionSummary } from '../types/transaction';
import Grid2 from '@mui/material/Unstable_Grid2';
import { Grid } from '@mui/material';

interface HeaderStatsProps {
  summary: TransactionSummary | null;
  filteredCount: number;
  totalCount: number;
  isAnalyzing: boolean;
  highRiskTransactions?: number;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({
  summary,
  filteredCount,
  totalCount,
  isAnalyzing,
  highRiskTransactions = 0,
}) => {
  return (
    <Grid2 container spacing={2} className="dashboard-stats">
      <Grid2 as={Grid} xs={12} md={6} lg={3}>
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              ${summary ? summary.totalAmount.toLocaleString() : '0'}
            </div>
            <div className="stat-label">Total Amount</div>
          </div>
        </div>
      </Grid2>

      <Grid2 as={Grid} xs={12} md={6} lg={3}>
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              ${summary ? summary.totalCredits.toLocaleString() : '0'}
            </div>
            <div className="stat-label">Total Credits</div>
          </div>
        </div>
      </Grid2>

      <Grid2 as={Grid} xs={12} md={6} lg={3}>
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              ${summary ? summary.totalDebits.toLocaleString() : '0'}
            </div>
            <div className="stat-label">Total Debits</div>
          </div>
        </div>
      </Grid2>

      <Grid2 as={Grid} xs={12} md={6} lg={3}>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {filteredCount.toLocaleString()}
              {filteredCount !== totalCount && (
                <span className="stat-total"> of {totalCount.toLocaleString()}</span>
              )}
            </div>
            <div className="stat-label">
              Transactions
              {isAnalyzing && <span> (Analyzing...)</span>}
              {highRiskTransactions > 0 && <span> - Risk: {highRiskTransactions}</span>}
            </div>
          </div>
        </div>
      </Grid2>
    </Grid2>
  );
};
