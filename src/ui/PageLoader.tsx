
export const PageLoader: React.FC = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>FinTech Dashboard</h1>

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

      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading transactions...</p>
      </div>
    </div>
  );
}