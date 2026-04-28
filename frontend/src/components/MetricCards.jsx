// MetricCards.jsx
// Shows 6 key statistics for the selected stock.
// Props: summary → object from /api/summary/{symbol}/

function MetricCards({ summary }) {
  if (!summary) return null;

  const returnPositive = summary.total_return_1y >= 0;

  const cards = [
    { label: 'Latest Close',   value: `₹${summary.latest_close}`,                           color: '#fff' },
    { label: '52W High',       value: `₹${summary.week_52_high}`,                            color: '#4ade80' },
    { label: '52W Low',        value: `₹${summary.week_52_low}`,                             color: '#f87171' },
    { label: 'Avg Close (1Y)', value: `₹${summary.avg_close}`,                               color: '#fff' },
    { label: 'Volatility',     value: summary.volatility_score ? `${(summary.volatility_score * 100).toFixed(1)}%` : '—', color: '#facc15' },
    { label: '1Y Return',      value: `${returnPositive ? '+' : ''}${summary.total_return_1y}%`, color: returnPositive ? '#4ade80' : '#f87171' },
  ];

  return (
    <div style={styles.grid}>
      {cards.map(card => (
        <div key={card.label} style={styles.card}>
          <div style={styles.label}>{card.label}</div>
          <div style={{ ...styles.value, color: card.color }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
    minWidth: 0,          /* ← add this */
  },
  card: {
    flex: '1',
    minWidth: '130px',
    maxwidth: '200px',
    background: '#13161f',
    border: '1px solid #2a2f4a',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  label: {
    fontSize: '0.72rem',
    color: '#888',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  value: {
    fontSize: '1.1rem',
    fontWeight: '700',
  },
};

export default MetricCards;