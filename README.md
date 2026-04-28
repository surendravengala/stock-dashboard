# Stock Intelligence Dashboard

A production-grade full-stack analytics platform that ingests NSE market data, computes financial metrics, exposes a REST API, and delivers interactive visual insights via a React dashboard.

---

## Problem Statement

Raw stock data lacks structure, context, and actionable insights. Users need:
- Clean historical datasets
- Key performance indicators (returns, volatility, trends)
- Fair comparison across stocks
- Lightweight predictive signals

This system consolidates data ingestion, processing, API delivery, and visualization into a cohesive pipeline.

---

##  System Architecture


Yahoo Finance (yfinance)
↓
Ingestion Pipeline (pandas, numpy)
↓
Database (SQLite  via Django ORM)
↓
Django REST API (DRF)
↓
React Frontend (Axios + Recharts)


---

##  Key Features

- **Automated Data Ingestion**
  - 1-year OHLCV data for multiple NSE stocks
  - Cleaned and normalized using pandas

- **Financial Analytics**
  - Daily returns
  - 7-day moving average
  - Annualized volatility
  - 52-week high/low

- **Interactive Visualization**
  - Price + moving average charts
  - ML prediction overlay
  - Dynamic time filters (30D / 90D / 1Y)

- **Comparative Analysis**
  - Normalized performance comparison across stocks
  - Eliminates price bias for fair evaluation

- **Market Insights**
  - Top gainers and losers
  - Summary metrics per stock

- **Machine Learning Integration**
  - Linear Regression-based short-term prediction
  - Future trend projection (7 days)

---

## Core Logic & Design Decisions

### Data Ingestion Pipeline
- Uses `yfinance` to fetch NSE data
- Processes with pandas:
  - Cleans missing values
  - Computes derived metrics
- Bulk inserts into DB using Django ORM for efficiency

---

###  Financial Metrics Computation
- **Daily Return** → `(Close - Open) / Open`
- **Moving Average** → rolling window smoothing
- **Volatility** → rolling std × √252 (annualized)
- **52-week range** → rolling min/max

---

### API Design
- RESTful endpoints using Django REST Framework
- Separation of concerns:
  - Models → data structure
  - Serializers → data representation
  - Views → business logic
- Optimized queries using aggregation (`Max`, `Min`, `Avg`)

---

### Frontend State Management
- Centralized state in `App.jsx`
- Data fetched via service layer (`axios`)
- Parallel API calls using `Promise.all` for performance
- Component-based architecture:
  - Sidebar → selection
  - Chart → visualization
  - Cards → metrics

---

### Stock Comparison Logic
- Normalization:
  - Base value = 100 on day 1
  - Tracks % growth instead of absolute price
- Enables fair comparison between differently priced stocks

---

### ML Prediction Strategy
- Linear Regression model trained on historical closing prices
- Predicts future values using time-indexed features
- Lightweight, fast, and sufficient for demonstration

---

## Tech Stack

### Backend
- Python
- Django
- Django REST Framework
- Pandas, NumPy
- Scikit-learn
- yFinance

### Frontend
- React (Vite)
- Axios
- Recharts

### Deployment
- Vercel (Frontend)
- Render (Backend)

---

##  Project Structure


stock-dashboard/
│
├── core/ # Django configuration
├── stocks/ # Backend app
│ ├── models.py
│ ├── views.py
│ ├── serializers.py
│ └── ingestion.py
│
├── frontend/ # React app
│ ├── src/
│ │ ├── components/
│ │ ├── api/
│ │ └── App.jsx
│
├── requirements.txt
└── README.md


---

## API Design

| Endpoint | Description |
|--------|------------|
| `/api/companies/` | List available companies |
| `/api/data/{symbol}/?days=30` | Historical stock data |
| `/api/summary/{symbol}/` | Key financial metrics |
| `/api/compare/?symbol1=A&symbol2=B` | Normalized comparison |
| `/api/gainers-losers/` | Top market movers |
| `/api/predict/{symbol}/?days=7` | ML-based prediction |

---

## Setup Instructions

### Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python stocks/ingestion.py
python manage.py runserver
Frontend
cd frontend
npm install
npm run dev

**Environment Variables:**
Frontend
VITE_API_URL=https://stock-dashboard-m5yw.onrender.com/api

**Deployment**:
Backend (Render)
Django app served via Gunicorn
Runs ingestion and API layer
Connected to managed database
Frontend (Vercel)
Built using Vite
Static deployment
Communicates with backend via env variable

**Challenges & Engineering Solutions**:
CORS Restrictions
Resolved using django-cors-headers
Case Sensitivity (Linux vs Windows)
Fixed import/file naming mismatches
Cold Start Latency (Render Free Tier)
Increased Axios timeout
Handled loading states gracefully
Data Consistency
Used unique_together constraints
Bulk operations for reliability


**Future Improvements**
Advanced ML models (LSTM, ARIMA)
Real-time updates via WebSockets
User authentication & portfolios
PostgreSQL production database
Caching layer (Redis)


**Author**:

**Name**: Vengala Surendra Kumar Reddy
**GitHub**: https://github.com/surendravengala
**live link**:https://stock-dashboard-surendravengalas-projects.vercel.app/