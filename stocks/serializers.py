# stocks/serializers.py
# Serializers convert Django model instances → Python dicts → JSON.
# Think of them as the "shape" of what your API sends back.
# This is the DRF equivalent of Django forms — but for output (and input).

from rest_framework import serializers
from .models import StockData


class StockDataSerializer(serializers.ModelSerializer):
    """
    Serializes a full StockData row.
    Used by the /api/data/{symbol}/ endpoint.

    ModelSerializer automatically creates fields
    matching the model — we just specify which ones to include.
    """
    class Meta:
        model  = StockData
        fields = [
            'date', 'symbol', 'open', 'high', 'low', 'close',
            'volume', 'daily_return', 'ma_7', 'volatility',
            'week_52_high', 'week_52_low'
        ]


class CompanySerializer(serializers.Serializer):
    """
    Simple serializer for the companies list.
    Not a ModelSerializer because we're using .values()
    which returns plain dicts, not model instances.
    """
    symbol       = serializers.CharField()
    company_name = serializers.CharField()
    sector       = serializers.CharField()


class SummarySerializer(serializers.Serializer):
    """
    Serializes summary statistics for one company.
    All fields built manually (not from model directly).
    """
    symbol           = serializers.CharField()
    company_name     = serializers.CharField()
    week_52_high     = serializers.FloatField()
    week_52_low      = serializers.FloatField()
    avg_close        = serializers.FloatField()
    latest_close     = serializers.FloatField()
    volatility_score = serializers.FloatField(allow_null=True)
    total_return_1y  = serializers.FloatField(allow_null=True)