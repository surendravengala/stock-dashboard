// GainersLosers.jsx
// Shows top 5 gainers and top 5 losers for the latest trading day.
// Props: data → { date, top_gainers, top_losers }

function GainersLosers({ data }) {
  if (!data) return null;

  const Row = ({ item, isGainer }) => (
    <div style={styles.row}>
      <div>
        <div style={styles.rowSymbol}>{item.symbol}</div>
        <div style={styles.rowName}>{item.company_name}</div>
      </div>
      <div style={{ ...styles.pct, color: isGainer ? '#4ade80' : '#f87171' }}>
        {isGainer ? '+' : ''}{item.daily_return_pct}%
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Gainers */}
      <div style={styles.panel}>
        <div style={{ ...styles.title, color: '#4ade80' }}>🚀 Top Gainers</div>
        <div style={styles.subtitle}>as of {data.date}</div>
        {data.top_gainers.map(item => (
          <Row key={item.symbol} item={item} isGainer={true} />
        ))}
      </div>

      {/* Losers */}
      <div style={styles.panel}>
        <div style={{ ...styles.title, color: '#f87171' }}>📉 Top Losers</div>
        <div style={styles.subtitle}>as of {data.date}</div>
        {data.top_losers.map(item => (
          <Row key={item.symbol} item={item} isGainer={false} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    width: '100%',      // ← add
    minWidth: 0,        // ← add
    boxSizing: 'border-box',  // ← add
  },
  panel: {
    flex: 1,
    minWidth: '220px',
    maxWidth: '100%',   // ← add
    background: '#13161f',
    border: '1px solid #2a2f4a',
    borderRadius: '12px',
    padding: '16px',
    boxSizing: 'border-box',  // ← add
    overflow: 'hidden', // ← add
  },
  title: {
    fontWeight: '700',
    fontSize: '0.9rem',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.72rem',
    color: '#666',
    marginBottom: '12px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '7px 0',
    borderBottom: '1px solid #1e2230',
  },
  rowSymbol: {
    color: '#fff',
    fontSize: '0.82rem',
    fontWeight: '600',
  },
  rowName: {
    color: '#666',
    fontSize: '0.7rem',
  },
  pct: {
    fontSize: '0.85rem',
    fontWeight: '700',
  },
};

export default GainersLosers;