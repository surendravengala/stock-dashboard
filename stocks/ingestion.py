# stocks/ingestion.py
# This script fetches real stock data from Yahoo Finance,
# calculates metrics using pandas, and saves to our Django database.
# Run it ONCE before starting the server.
# Run it again anytime to refresh the data.

import os
import sys
import django
import pandas as pd
import numpy as np
import yfinance as yf

# ── Django setup ──────────────────────────────────────────────────
# We're running this as a standalone script, not through manage.py.
# So we manually tell Django where its settings are.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
# ──────────────────────────────────────────────────────────────────

from stocks.models import StockData

# 15 NSE-listed companies
# Format: "TICKER.NS" is how Yahoo Finance identifies NSE stocks
STOCKS = {
    "INFY":       ("Infosys Ltd",               "IT"),
    "TCS":        ("Tata Consultancy Services",  "IT"),
    "WIPRO":      ("Wipro Ltd",                  "IT"),
    "RELIANCE":   ("Reliance Industries",        "Energy"),
    "HDFCBANK":   ("HDFC Bank",                  "Banking"),
    "ICICIBANK":  ("ICICI Bank",                 "Banking"),
    "AXISBANK":   ("Axis Bank",                  "Banking"),
    "SBIN":       ("State Bank of India",        "Banking"),
    "LT":         ("Larsen & Toubro",            "Infrastructure"),
    "BAJFINANCE": ("Bajaj Finance",              "Finance"),
    "HINDUNILVR": ("Hindustan Unilever",         "FMCG"),
    "MARUTI":     ("Maruti Suzuki",              "Automobile"),
    "TATAMOTORS": ("Tata Motors",               "Automobile"),
    "SUNPHARMA":  ("Sun Pharmaceutical",         "Pharma"),
    "ADANIENT":   ("Adani Enterprises",          "Conglomerate"),
}


def calculate_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """
    Adds calculated columns to the raw price DataFrame.

    A DataFrame is like a spreadsheet:
    rows = trading days, columns = Open, High, Low, Close, Volume

    We add 5 new columns:
    1. daily_return  — how much % did the stock move today?
    2. ma_7          — 7-day moving average (smooths out noise)
    3. volatility    — how risky/jumpy is this stock?
    4. week_52_high  — highest close in last 52 weeks
    5. week_52_low   — lowest close in last 52 weeks
    """

    # Daily return formula: (Close - Open) / Open
    # Example: Open=100, Close=106 → daily_return = 0.06 = 6%
    df['daily_return'] = (df['Close'] - df['Open']) / df['Open']

    # 7-day Moving Average
    # rolling(7) = look at last 7 rows. .mean() = average them.
    # First 6 rows will be NaN because there aren't 7 rows yet.
    df['ma_7'] = df['Close'].rolling(window=7).mean()

    # Volatility = annualized standard deviation of daily % changes
    # pct_change()       → daily % change in Close price
    # rolling(30).std()  → standard deviation over last 30 days
    # * sqrt(252)        → annualize (252 trading days per year)
    # Higher value = more risky stock
    df['volatility'] = (
        df['Close'].pct_change()
                   .rolling(window=30)
                   .std() * np.sqrt(252)
    )

    # 52-week High/Low
    # rolling(252) = look back 252 trading days (≈ 1 year)
    # min_periods=1 means we start calculating even with fewer rows
    df['week_52_high'] = df['Close'].rolling(window=252, min_periods=1).max()
    df['week_52_low']  = df['Close'].rolling(window=252, min_periods=1).min()

    return df


def safe_float(value):
    """
    Converts a value to float, returning None if it's NaN or invalid.
    pandas uses NaN (Not a Number) for missing values.
    Django's FloatField expects Python None, not NaN.
    """
    try:
        f = float(value)
        return None if np.isnan(f) else round(f, 6)
    except (TypeError, ValueError):
        return None


def run():
    print("🚀 Starting data ingestion...\n")

    # Clear all existing rows so we don't get duplicates on re-run
    deleted, _ = StockData.objects.all().delete()
    print(f"🗑️  Cleared {deleted} old rows.\n")

    total_saved = 0

    for symbol, (company_name, sector) in STOCKS.items():
        ticker_symbol = f"{symbol}.NS"
        print(f"📥 Fetching {company_name} ({ticker_symbol})...")

        try:
            # Download 1 year of daily OHLCV data
            raw = yf.download(
                ticker_symbol,
                period="1y",
                interval="1d",
                progress=False,   # suppress progress bar
                auto_adjust=True  # adjusts for stock splits
            )

            if raw.empty:
                print(f"   ⚠️  No data returned for {symbol}. Skipping.\n")
                continue

            # yfinance sometimes returns multi-level column headers.
            # Example: ('Close', 'INFY.NS') instead of just 'Close'
            # This flattens them back to single level.
            if isinstance(raw.columns, pd.MultiIndex):
                raw.columns = raw.columns.get_level_values(0)

            # Remove rows where Close is missing
            raw.dropna(subset=['Close'], inplace=True)

            # Add our custom metric columns
            raw = calculate_metrics(raw)

            # Build list of StockData objects for bulk insert
            records = []
            for date_idx, row in raw.iterrows():
                record = StockData(
                    symbol       = symbol,
                    company_name = company_name,
                    sector       = sector,
                    date         = date_idx.date(),  # pandas Timestamp → Python date
                    open         = safe_float(row['Open']),
                    high         = safe_float(row['High']),
                    low          = safe_float(row['Low']),
                    close        = safe_float(row['Close']),
                    volume       = safe_float(row['Volume']),
                    daily_return = safe_float(row['daily_return']),
                    ma_7         = safe_float(row['ma_7']),
                    volatility   = safe_float(row['volatility']),
                    week_52_high = safe_float(row['week_52_high']),
                    week_52_low  = safe_float(row['week_52_low']),
                )
                records.append(record)

            # bulk_create inserts all rows in ONE SQL query — much faster
            # than calling .save() in a loop
            StockData.objects.bulk_create(records, ignore_conflicts=True)
            total_saved += len(records)
            print(f"   ✅ Saved {len(records)} rows.\n")

        except Exception as e:
            print(f"   ❌ Error fetching {symbol}: {e}\n")
            continue

    print(f"🎉 Done! Total rows saved: {total_saved}")


if __name__ == '__main__':
    run()