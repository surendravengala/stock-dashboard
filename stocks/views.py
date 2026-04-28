# stocks/views.py
# Views = the actual logic behind each API endpoint.
# Each class handles one URL.
# APIView gives us get(), post(), etc. methods.
# We only need GET requests — we're reading data, not writing.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Max, Min, Avg
from datetime import date, timedelta
import numpy as np

from .models import StockData
from .serializers import StockDataSerializer, SummarySerializer


class CompanyListView(APIView):
    """
    GET /api/companies/
    Returns list of all unique companies in the database.
    """

    def get(self, request):
        # .values() returns a list of dicts instead of model instances
        # distinct() ensures we don't get 250 rows of "INFY"
        companies = (
            StockData.objects
            .values('symbol', 'company_name', 'sector')
            .distinct()
            .order_by('symbol')
        )
        # companies is already a list of dicts — return directly
        return Response(list(companies))


class StockDataView(APIView):
    """
    GET /api/data/<symbol>/
    Returns last N days of price data for one company.
    Query param: ?days=30 (default), ?days=90, ?days=365
    """

    def get(self, request, symbol):
        # .upper() normalizes "infy" → "INFY"
        symbol = symbol.upper()

        # Read ?days= from URL, default to 30
        # max(7, min(365, ...)) clamps it between 7 and 365
        try:
            days = int(request.query_params.get('days', 30))
            days = max(7, min(365, days))
        except ValueError:
            days = 30

        since = date.today() - timedelta(days=days)

        queryset = (
            StockData.objects
            .filter(symbol=symbol, date__gte=since)
            .order_by('date')
        )

        if not queryset.exists():
            return Response(
                {'error': f"No data found for symbol '{symbol}'"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = StockDataSerializer(queryset, many=True)
        return Response(serializer.data)


class SummaryView(APIView):
    """
    GET /api/summary/<symbol>/
    Returns 52-week high/low, average close, volatility, 1-year return.
    """

    def get(self, request, symbol):
        symbol = symbol.upper()

        # Django aggregation functions — like SQL MAX(), MIN(), AVG()
        # This runs ONE query instead of loading all rows into Python
        stats = (
            StockData.objects
            .filter(symbol=symbol)
            .aggregate(
                week_52_high     = Max('week_52_high'),
                week_52_low      = Min('week_52_low'),
                avg_close        = Avg('close'),
                volatility_score = Avg('volatility'),
            )
        )

        if stats['avg_close'] is None:
            return Response(
                {'error': f"Symbol '{symbol}' not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get company name from any row
        company = (
            StockData.objects
            .filter(symbol=symbol)
            .values('company_name')
            .first()
        )

        # Latest and oldest close for 1-year total return
        latest = (
            StockData.objects
            .filter(symbol=symbol)
            .order_by('-date')
            .values('close')
            .first()
        )
        oldest = (
            StockData.objects
            .filter(symbol=symbol)
            .order_by('date')
            .values('close')
            .first()
        )

        total_return = None
        if latest and oldest and oldest['close']:
            total_return = round(
                (latest['close'] - oldest['close']) / oldest['close'] * 100, 2
            )

        data = {
            'symbol':           symbol,
            'company_name':     company['company_name'] if company else symbol,
            'week_52_high':     round(stats['week_52_high'] or 0, 2),
            'week_52_low':      round(stats['week_52_low'] or 0, 2),
            'avg_close':        round(stats['avg_close'] or 0, 2),
            'latest_close':     round(latest['close'], 2) if latest else 0,
            'volatility_score': round(stats['volatility_score'], 4) if stats['volatility_score'] else None,
            'total_return_1y':  total_return,
        }

        serializer = SummarySerializer(data)
        return Response(serializer.data)


class CompareView(APIView):
    """
    GET /api/compare/?symbol1=INFY&symbol2=TCS&days=30
    Returns normalized performance of two stocks for fair comparison.

    Why normalize? INFY trades at ₹1500, TCS at ₹3800.
    You can't compare raw prices. Normalization sets both to 100
    on day 1 — then you see % growth from the same starting point.
    """

    def get(self, request):
        symbol1 = request.query_params.get('symbol1', '').upper()
        symbol2 = request.query_params.get('symbol2', '').upper()

        if not symbol1 or not symbol2:
            return Response(
                {'error': 'Both symbol1 and symbol2 are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            days = int(request.query_params.get('days', 30))
            days = max(7, min(365, days))
        except ValueError:
            days = 30

        since = date.today() - timedelta(days=days)
        result = {}

        for symbol in [symbol1, symbol2]:
            records = (
                StockData.objects
                .filter(symbol=symbol, date__gte=since)
                .order_by('date')
                .values('date', 'close')
            )

            if not records.exists():
                return Response(
                    {'error': f"Symbol '{symbol}' not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            closes = [r['close'] for r in records]
            dates  = [str(r['date']) for r in records]
            base   = closes[0] if closes[0] else 1

            result[symbol] = {
                'dates':      dates,
                'normalized': [round((c / base) * 100, 2) for c in closes],
                'raw_close':  closes,
            }

        return Response(result)


class GainersLosersView(APIView):
    """
    GET /api/gainers-losers/
    Returns top 5 gainers and top 5 losers for the most recent trading day.
    """

    def get(self, request):
        # Get the most recent date in the database
        latest_date = StockData.objects.aggregate(Max('date'))['date__max']

        if not latest_date:
            return Response({'error': 'No data available'}, status=status.HTTP_404_NOT_FOUND)

        records = (
            StockData.objects
            .filter(date=latest_date)
            .order_by('-daily_return')   # descending: highest return first
        )

        def fmt(r):
            return {
                'symbol':           r.symbol,
                'company_name':     r.company_name,
                'close':            r.close,
                'daily_return_pct': round(r.daily_return * 100, 2) if r.daily_return else 0,
            }

        all_records = list(records)
        return Response({
            'date':        str(latest_date),
            'top_gainers': [fmt(r) for r in all_records[:5]],
            'top_losers':  [fmt(r) for r in reversed(all_records[-5:])],
        })


class PredictView(APIView):
    """
    GET /api/predict/<symbol>/?days=7
    Returns a simple Linear Regression price prediction.

    Linear Regression draws the best-fit straight line through
    historical prices and extends it forward.
    Not for real trading — for demonstrating ML integration.
    """

    def get(self, request, symbol):
        from sklearn.linear_model import LinearRegression

        symbol = symbol.upper()

        try:
            days_ahead = int(request.query_params.get('days', 7))
            days_ahead = max(1, min(30, days_ahead))
        except ValueError:
            days_ahead = 7

        records = (
            StockData.objects
            .filter(symbol=symbol)
            .order_by('date')
            .values('date', 'close')
        )

        closes = [r['close'] for r in records]

        if len(closes) < 30:
            return Response({'error': 'Not enough data to predict'})

        # X = day numbers [0, 1, 2, ..., N]
        # y = closing prices
        X = np.arange(len(closes)).reshape(-1, 1)
        y = np.array(closes)

        model = LinearRegression()
        model.fit(X, y)

        # Predict next N days
        future_X = np.arange(len(closes), len(closes) + days_ahead).reshape(-1, 1)
        predictions = model.predict(future_X)

        # Generate future weekday dates
        last_date = list(records)[-1]['date']
        future_dates = []
        d = last_date
        while len(future_dates) < days_ahead:
            d += timedelta(days=1)
            if d.weekday() < 5:   # 0–4 = Mon–Fri only
                future_dates.append(str(d))

        return Response({
            'symbol':      symbol,
            'predictions': [
                {'date': dt, 'predicted_close': round(float(p), 2)}
                for dt, p in zip(future_dates, predictions)
            ],
            'model':       'Linear Regression',
            'disclaimer':  'Simplified model for demonstration only.',
        })