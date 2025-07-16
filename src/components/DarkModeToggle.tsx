import React from 'react';

export const DarkModeToggle: React.FC = () => {
  const [dark, setDark] = React.useState(() => {
    const stored = localStorage.getItem('prefers-dark');
    if (stored !== null) return stored === '1';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  React.useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('prefers-dark', dark ? '1' : '0');
  }, [dark]);

  const handleToggle = () => setDark((d) => !d);

  return (
    <button
      aria-label="Toggle dark mode"
      aria-pressed={dark}
      onClick={handleToggle}
      className="dark-toggle"
      style={{ fontSize: '1.2rem' }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
};
