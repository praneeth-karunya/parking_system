# ParkSmart Pro - Parking Management System

Professional full-stack parking management app using:
- HTML/CSS for premium UI
- JavaScript + jQuery for frontend interactivity
- JSON for API data exchange
- Node.js + Express for backend logic
- MongoDB + Mongoose for persistent data
- AI-style recommendation engine for smart slot suggestions

## Features
- Real-time slot availability board
- Slot seeding for quick setup
- Booking creation with dynamic cost calculation
- Booking completion flow with slot release
- AI recommendations by vehicle type, budget, and covered parking preference
- Responsive modern dashboard design

## Setup
1. Install dependencies:
   - `npm install`
2. Create env file:
   - Copy `.env.example` to `.env`
3. Start MongoDB locally
4. Run app:
   - `npm run dev`
5. Open:
   - `http://localhost:5000`

## API Endpoints
- `GET /api/health`
- `GET /api/slots`
- `POST /api/slots/seed`
- `POST /api/slots/ai-recommendations`
- `GET /api/bookings`
- `POST /api/bookings`
- `PATCH /api/bookings/:id/complete`
