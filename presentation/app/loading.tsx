export default function Loading() {
  return (
    <main className="loading-shell" aria-label="Loading dashboard">
      <div className="loading-sidebar" />
      <div className="loading-content">
        <div className="loading-line loading-line-short" />
        <div className="loading-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="loading-card" key={index} />
          ))}
        </div>
        <div className="loading-panel" />
      </div>
    </main>
  );
}
