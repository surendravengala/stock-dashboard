# stocks/urls.py
# Maps URL patterns to View classes.
# When Django receives GET /api/companies/,
# it runs CompanyListView.get()

from django.urls import path
from . import views

urlpatterns = [
    path('companies/',          views.CompanyListView.as_view()),
    path('data/<str:symbol>/',  views.StockDataView.as_view()),
    path('summary/<str:symbol>/', views.SummaryView.as_view()),
    path('compare/',            views.CompareView.as_view()),
    path('gainers-losers/',     views.GainersLosersView.as_view()),
    path('predict/<str:symbol>/', views.PredictView.as_view()),
]