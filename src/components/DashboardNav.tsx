
export const DashboardNav: React.FC = () => {

  return (
    <header className="dashboard-nav" role="header" aria-label="Dashboard navigation" data-testid="dashboard-nav">
      <h1 className="hide" role="text" aria-describedby="FinTech Dashboard">FinTech Dashboard</h1>
      <h1 className="hide-mobile" role="text" aria-describedby="FinTech Dashboard">FinT-D</h1>
      <div className="dashboard-nav-user-info">
      <p>Hello Admin</p>
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyWoBiUx4vdA4ApwQhFJrYiE6B5Unrj6xv3A&s" alt="" />
      </div>
    </header>
  );
}