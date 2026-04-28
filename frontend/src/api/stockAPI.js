// src/api/stockApi.js
// All API calls live here in one place.
// If the backend URL changes, you change it in ONE place only.
// This is called the "service layer" pattern.

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,  // increase to 15s — Render free tier can be slow to wake up
});

export const getCompanies = () =>
  api.get('/companies/');

export const getStockData = (symbol, days = 30) =>
  api.get(`/data/${symbol}/`, { params: { days } });

export const getSummary = (symbol) =>
  api.get(`/summary/${symbol}/`);

export const getCompare = (symbol1, symbol2, days = 30) =>
  api.get('/compare/', { params: { symbol1, symbol2, days } });

export const getGainersLosers = () =>
  api.get('/gainers-losers/');

export const getPrediction = (symbol, days = 7) =>
  api.get(`/predict/${symbol}/`, { params: { days } });