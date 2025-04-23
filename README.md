
# Bird Identification App

A web application that uses AI to identify birds from images and sounds, built with React, Express, and Google's Gemini AI.

## Features

- Bird identification from uploaded images
- Detailed bird information including:
  - Physical characteristics
  - Habitat and range
  - Migration patterns
  - Seasonal variations
  - Similar species
- Premium subscription features
- Responsive web design
- Real-time AI processing

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS, Shadcn/ui
- Backend: Express.js, Node.js
- AI: Google Gemini AI
- Database: PostgreSQL with Drizzle ORM
- Authentication: Passport.js
- Payments: Stripe

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

- `/client` - React frontend application
- `/server` - Express backend server
- `/shared` - Shared TypeScript types and schemas
