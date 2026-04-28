// StockChart.jsx
// Renders the main price chart using Recharts.
// Shows: Close price line, 7-day MA line, ML prediction (dashed).
// Props:
//   data       → array of daily stock rows
//   prediction → array of {date, predicted_close}

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function StockChart({ data, prediction }) {
  if (!data || data.length === 0) return null;

  // Merge historical data and predictions into one array
  // Historical rows have close + ma_7. Prediction rows have predicted_close.
  const chartData = [
    ...data.map(d => ({
      date:            d.date,
      close:           d.close,
      ma_7:            d.ma_7,
      predicted_close: null,   // no prediction for historical rows
    })),
    ...(prediction || []).map(p => ({
      date:            p.date,
      close:           null,   // no real price for future rows
      ma_7:            null,
      predicted_close: p.predicted_close,
    })),
  ];

  // Format date label: "2024-04-15" → "Apr 15"
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // Format price in tooltip
  const formatPrice = (value) => value ? `₹${value.toFixed(2)}` : '';

  return (
    <div style={styles.chartBox}>
<div style={{ width: '100%', minWidth: 0 }}>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>

          <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" />

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
            tickFormatter={v => `₹${v}`}
            width={70}
          />

          <Tooltip
            contentStyle={{ background: '#1c2030', border: '1px solid #2a2f4a', borderRadius: '8px' }}
            labelStyle={{ color: '#aaa', fontSize: '12px' }}
            formatter={formatPrice}
            labelFormatter={formatDate}
          />

          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#aaa' }}
          />

          {/* Closing price — main blue line */}
          <Line
            type="monotone"
            dataKey="close"
            name="Close Price"
            stroke="#7c83fd"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />

          {/* 7-day moving average — yellow dashed */}
          <Line
            type="monotone"
            dataKey="ma_7"
            name="7-Day MA"
            stroke="#facc15"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            connectNulls={false}
          />

          {/* ML prediction — green dashed */}
          <Line
            type="monotone"
            dataKey="predicted_close"
            name="Prediction (7D)"
            stroke="#4ade80"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={{ r: 3, fill: '#4ade80' }}
            connectNulls={false}
          />

        </LineChart>
      </ResponsiveContainer>
      </div>

    </div>
  );
}

const styles = {
  chartBox: {
    background: '#13161f',
    border: '1px solid #2a2f4a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
};

export default StockChart;