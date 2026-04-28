# core/urls.py
# Root URL config — Django reads this first.
# All /api/ requests get forwarded to stocks/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('stocks.urls')),
]