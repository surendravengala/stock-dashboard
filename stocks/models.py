# stocks/models.py
# A model = a database table, defined as a Python class.
# Each attribute = one column in the table.
# Django's ORM translates this class into SQL automatically.

from django.db import models


class StockData(models.Model):
    """
    Stores one row of daily stock price data.
    One row = one company on one trading day.
    """

    symbol       = models.CharField(max_length=20, db_index=True)
    company_name = models.CharField(max_length=100)
    sector       = models.CharField(max_length=100)
    date         = models.DateField(db_index=True)

    # OHLCV — standard financial data
    open   = models.FloatField()
    high   = models.FloatField()
    low    = models.FloatField()
    close  = models.FloatField()
    volume = models.FloatField()

    # Calculated metrics (can be null for first few rows — not enough history yet)
    daily_return = models.FloatField(null=True, blank=True)
    ma_7         = models.FloatField(null=True, blank=True)  # 7-day moving avg
    volatility   = models.FloatField(null=True, blank=True)  # annualized volatility
    week_52_high = models.FloatField(null=True, blank=True)
    week_52_low  = models.FloatField(null=True, blank=True)

    class Meta:
        # Enforces that the same company can't have two rows for the same date
        unique_together = ('symbol', 'date')
        ordering = ['symbol', 'date']

    def __str__(self):
        return f"{self.symbol} | {self.date} | ₹{self.close}"