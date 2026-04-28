// CompareChart.jsx
// Compares two stocks' performance on the same chart.
//
// WHY NORMALIZE?
// INFY trades at ~₹1500. TCS at ~₹3800.
// You can't plot both on the same Y-axis and compare fairly —
// TCS would always look "higher" just because it's more expensive.
//
// Normalization sets BOTH stocks to 100 on day 1.
// Then the chart shows % growth from the same starting point.
// Example: if INFY goes 100→108 and TCS goes 100→103,
// INFY performed better even though TCS costs more in rupees.

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useState } from 'react';
import { getCompare } from '../api/stockApi';

function CompareChart() {
  const [symbol1, setSymbol1] = useState('');
  const [symbol2, setSymbol2] = useState('');
  const [days,    setDays]    = useState(30);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleCompare = async () => {
    // Basic validation — don't compare a stock with itself
    if (!symbol1 || !symbol2) {
      setError('Please enter both symbols/names.');
      return;
    }
    if (symbol1.toUpperCase() === symbol2.toUpperCase()) {
      setError('Please enter two different symbols.');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await getCompare(symbol1.toUpperCase(), symbol2.toUpperCase(), days);
      setData(res.data);
    } catch (err) {
      // err.response exists if the server replied with an error (e.g. 404)
      // err.message exists if there was a network failure
      setError(err.response?.data?.error || 'Could not load comparison data.');
    } finally {
      setLoading(false);
    }
  };

  // Build the chart data array
  // Recharts needs one array where each item = one point on X axis
  // We merge both stocks' data by index (they share the same dates)
  const buildChartData = () => {
    if (!data) return [];
    const keys = Object.keys(data);         // ['INFY', 'TCS']
    const s1   = data[keys[0]];
    const s2   = data[keys[1]];
    const len  = Math.min(s1.dates.length, s2.dates.length);

    return Array.from({ length: len }, (_, i) => ({
      date:    s1.dates[i],
      [keys[0]]: s1.normalized[i],          // e.g. INFY: 103.2
      [keys[1]]: s2.normalized[i],          // e.g. TCS: 98.7
    }));
  };

  const chartData = buildChartData();
  const symbols   = data ? Object.keys(data) : [];

  const formatDate = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip to show both values + which is winning
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={styles.tooltip}>
        <div style={styles.tooltipDate}>{formatDate(label)}</div>
        {payload.map(p => (
          <div key={p.dataKey} style={{ color: p.color, fontSize: '0.82rem', marginTop: '4px' }}>
            {p.dataKey}: {p.value?.toFixed(2)} pts
            <span style={{ color: p.value >= 100 ? '#4ade80' : '#f87171', marginLeft: '6px' }}>
              ({p.value >= 100 ? '+' : ''}{(p.value - 100).toFixed(2)}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>⚖️ Compare Two Stocks</h3>
      <p style={styles.subtitle}>
        Both stocks normalized to 100 on day 1 — shows relative % performance fairly.
      </p>

      {/* Controls */}
      <div style={styles.controls}>
        <input
          style={styles.input}
          value={symbol1}
          onChange={e => setSymbol1(e.target.value.toUpperCase())}
          placeholder="INFY"
          maxLength={15}
        />
        <span style={styles.vs}>vs</span>
        <input
          style={styles.input}
          value={symbol2}
          onChange={e => setSymbol2(e.target.value.toUpperCase())}
          placeholder="TCS"
          maxLength={15}
        />

        {/* Days selector */}
        <div style={styles.dayBtns}>
          {[30, 90, 365].map(d => (
            <button
              key={d}
              style={{
                ...styles.dayBtn,
                ...(days === d ? styles.dayBtnActive : {})
              }}
              onClick={() => setDays(d)}
            >
              {d === 365 ? '1Y' : `${d}D`}
            </button>
          ))}
        </div>

        <button style={styles.compareBtn} onClick={handleCompare} disabled={loading}>
          {loading ? 'Loading...' : 'Compare →'}
        </button>
      </div>

      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={styles.chartBox}>

          {/* Winner banner */}
          {symbols.length === 2 && (() => {
            const last = chartData[chartData.length - 1];
            const s1val = last[symbols[0]];
            const s2val = last[symbols[1]];
            const winner = s1val >= s2val ? symbols[0] : symbols[1];
            const diff   = Math.abs(s1val - s2val).toFixed(2);
            return (
              <div style={styles.winnerBanner}>
                🏆 <strong>{winner}</strong> is outperforming by {diff} pts over {days === 365 ? '1 year' : `${days} days`}
              </div>
            );
          })()}
<div style={{ width: '100%', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" />

              {/* Reference line at 100 = breakeven / starting point */}
              <ReferenceLine y={100} stroke="#444" strokeDasharray="4 4" label={{ value: 'Start', fill: '#666', fontSize: 11 }} />

              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: '#888', fontSize: 11 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#888', fontSize: 11 }}
                tickLine={false}
                tickFormatter={v => `${v}`}
                domain={['auto', 'auto']}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#aaa' }} />

              {/* First stock — purple */}
              {symbols[0] && (
                <Line
                  type="monotone"
                  dataKey={symbols[0]}
                  stroke="#7c83fd"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              )}

              {/* Second stock — orange */}
              {symbols[1] && (
                <Line
                  type="monotone"
                  dataKey={symbols[1]}
                  stroke="#fb923c"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
</div>

          {/* Raw stats below chart */}
          <div style={styles.statsRow}>
            {symbols.map((sym, i) => {
              const d        = data[sym];
              const first    = d.raw_close[0];
              const last2    = d.raw_close[d.raw_close.length - 1];
              const ret      = ((last2 - first) / first * 100).toFixed(2);
              const isPos    = parseFloat(ret) >= 0;
              return (
                <div key={sym} style={styles.statCard}>
                  <div style={{ color: i === 0 ? '#7c83fd' : '#fb923c', fontWeight: 700, fontSize: '0.9rem' }}>
                    {sym}
                  </div>
                  <div style={styles.statRow}>
                    <span style={styles.statLabel}>Start price</span>
                    <span style={styles.statVal}>₹{first?.toFixed(2)}</span>
                  </div>
                  <div style={styles.statRow}>
                    <span style={styles.statLabel}>Latest price</span>
                    <span style={styles.statVal}>₹{last2?.toFixed(2)}</span>
                  </div>
                  <div style={styles.statRow}>
                    <span style={styles.statLabel}>Return</span>
                    <span style={{ ...styles.statVal, color: isPos ? '#4ade80' : '#f87171' }}>
                      {isPos ? '+' : ''}{ret}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: '#13161f',
    border: '1px solid #2a2f4a',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '24px',
  },
  title: {
    color: '#fff',
    fontSize: '1rem',
    fontWeight: '700',
    marginBottom: '4px',
  },
  subtitle: {
    color: '#666',
    fontSize: '0.78rem',
    marginBottom: '16px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  input: {
    padding: '8px 12px',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#2a2f4a',
    background: '#1c2030',
    color: '#fff',
    fontSize: '0.85rem',
    width: '150px',
    outline: 'none',
    textTransform: 'uppercase',
  },
  vs: {
    color: '#666',
    fontWeight: '600',
    fontSize: '0.85rem',
  },
  dayBtns: {
    display: 'flex',
    gap: '6px',
  },
  dayBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#2a2f4a',
    background: '#1c2030',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '0.78rem',
  },
  dayBtnActive: {
    background: '#7c83fd',
    color: '#fff',
    borderColor: '#7c83fd',
  },
  compareBtn: {
    padding: '8px 20px',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#7c83fd',
    background: '#7c83fd',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.85rem',
  },
  error: {
    background: '#3a1a1a',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#7a2020',
    color: '#f87171',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.82rem',
    marginBottom: '12px',
  },
  chartBox: {
    marginTop: '8px',
  },
  winnerBanner: {
    background: '#1a2a1a',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#2a4a2a',
    color: '#4ade80',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '0.82rem',
    marginBottom: '14px',
  },
  tooltip: {
    background: '#1c2030',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#2a2f4a',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  tooltipDate: {
    color: '#aaa',
    fontSize: '0.78rem',
    marginBottom: '4px',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: '160px',
    background: '#1c2030',
    borderRadius: '10px',
    padding: '14px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#2a2f4a',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
  },
  statLabel: {
    color: '#888',
    fontSize: '0.75rem',
  },
  statVal: {
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
};

export default CompareChart;