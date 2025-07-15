import { DashboardNav } from "../components/DashboardNav"
import { LoadingTransaction } from "./LoadingTransaction";

export const PageLoader: React.FC = () => {
  return (
    <div className="dashboard">
      <DashboardNav />

      <section className="dashboard-wrapper">
        <div className="dashboard-header">
          <div className="dashboard-stats">
            {
              [...Array(4).keys()].map((count) => (
                <article 
                key={count}
                className="stat-card">
                  <div className="stat-icon pulse">
                  </div>
                  <div className="stat-content">
                    <div className="loading-text pulse">
                    </div>
                    <div className="loading-text small pulse"></div>
                  </div>
                </article>
              ))
            }
          </div>
        </div>

        <LoadingTransaction />
        
      </section>
    </div>
  );
}