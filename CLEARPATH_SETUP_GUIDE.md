# ClearPath Setup Guide

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

## Backend
```
cd backend
cp .env.example .env
npm install
npm run build
npm run dev
```
API: http://localhost:4000, health: /api/health

## Frontend
```
cd frontend
npm install
npm run dev
```
App: http://localhost:3000

## Environment
Backend .env: MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CORS_ORIGINS.
Frontend: NEXT_PUBLIC_API_URL=http://localhost:4000
