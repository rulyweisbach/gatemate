# GateMate ✈️

> Meet people around your flight.

A mobile-first travel companion that helps people connect with fellow travelers
at airports — by flight, by date, or by event.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS 4
- **Routing:** React Router v7
- **State:** Zustand
- **Icons:** Lucide React
- **Hosting:** AWS S3 + CloudFront (see [`infra/`](infra/README.md))

## Local Development

```bash
npm install
npm run dev      # start dev server
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## Project Structure

```
src/
├── components/
│   ├── layout/    # SkyBackground, AppShell, GlassCard
│   ├── ui/        # GlassButton, GlassInput, IntentChip, VerifiedBadge
│   └── screens/   # Splash, Onboard, Flight, Intent, Feed, Profile, Chat
├── data/          # mock user data (Phase 1 — client-side only)
├── store/         # Zustand app state
└── types/         # shared TypeScript types
```

## Deployment

Pushes to `main` auto-deploy to AWS via GitHub Actions.
See [`infra/README.md`](infra/README.md) for the one-time AWS setup.

## Roadmap

- **Phase 1 (current):** React frontend on AWS, mock data
- **Phase 2:** Cognito auth (Google/Facebook/Instagram), DynamoDB, Lambda API,
  real-time chat via API Gateway WebSocket, profile photo uploads
