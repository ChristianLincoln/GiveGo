# Give Go - Replit Agent Guide

## Overview

Give Go is a full-stack Progressive Web App (PWA) that gamifies charitable giving. The application serves two user types:

1. **Players** - Collect virtual GPS-based coins placed around the real world by walking to their locations
2. **Sponsors** - Purchase and place virtual coins that players can collect, with proceeds going to the British Heart Foundation charity

The core game loop: Sponsors buy coins → Place coins on map → Players walk to collect them → Money goes to charity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with HMR support
- **PWA**: Service worker for offline support, manifest.json for installability

The frontend follows a role-based page structure:
- `/player/*` routes for player-specific features (dashboard, session/collection, history)
- `/sponsor/*` routes for sponsor-specific features (dashboard, purchase, tracking)
- Shared pages for landing, role selection, and settings

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON APIs under `/api/*`
- **Authentication**: Replit OpenID Connect (OIDC) integration with Passport.js
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for validation
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Drizzle Kit (`db:push` command)

Key database tables:
- `users`, `sessions` - Authentication (managed by Replit Auth)
- `user_roles` - Player/sponsor role tracking
- `player_profiles`, `sponsor_profiles` - Role-specific user data
- `coin_inventory` - Sponsor's purchased coins
- `generated_coins` - Coins placed in the world
- `escrow` - Payment holds before charity donation
- `collection_history` - Player coin collection records

### Authentication Flow
- Uses Replit's OIDC provider for user authentication
- Session stored in PostgreSQL `sessions` table
- `isAuthenticated` middleware protects API routes
- User profiles created on first role selection

### Payment Integration
- **Provider**: Stripe (via Replit Stripe connector)
- **Webhook Handling**: Managed webhooks with stripe-replit-sync
- **Flow**: Sponsors purchase coins → Money held in escrow → Released to charity on collection

## Key Features Implemented

### GPS Coin Collection
- Real-time GPS tracking using browser Geolocation API
- Haversine formula for accurate distance calculation
- 10-meter collection radius validation (server-side)
- 30-minute coin expiration with automatic inventory return

### Coin Lifecycle
1. Sponsor purchases coins via Stripe checkout
2. Coins added to sponsor's inventory (webhook handles completion)
3. Player starts session → coins placed randomly 1-2km from player
4. Coins held in escrow until collected or expired
5. Collection: validate distance → release escrow → update stats
6. Expiration: background job returns coins to inventory

### Background Jobs
- Coin expiration job runs every 60 seconds
- Checks for expired placed coins and returns them to sponsor inventory
- Refunds escrow for expired coins

### PWA Features
- `manifest.json` with app icons and metadata
- `service-worker.js` for caching and offline support
- Installable on iOS and Android devices
- Theme color: #dc2644 (heart red - British Heart Foundation branding)

### Interactive Map
- Built with Leaflet and OpenStreetMap tiles
- User location marker with primary color
- Collection radius circle (10m) around user
- Gold coin markers with accent color glow animation
- Popup info with coin value and collection prompt
- Auto-zoom to fit user and all coins in view
- Theme-aware CSS variables for light/dark mode compatibility

## External Dependencies

### Third-Party Services
- **Replit Auth**: OpenID Connect authentication provider
- **Stripe**: Payment processing for coin purchases
- **PostgreSQL**: Primary database (provisioned via Replit)

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Client-side data fetching and caching
- `passport` / `openid-client`: Authentication handling
- `stripe` / `stripe-replit-sync`: Payment processing
- `wouter`: Client-side routing
- `zod` / `drizzle-zod`: Runtime validation
- `express-session` / `connect-pg-simple`: Session management

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Express session encryption key
- `ISSUER_URL`: Replit OIDC issuer (defaults to https://replit.com/oidc)
- `REPL_ID`: Replit environment identifier
- Stripe credentials are fetched dynamically via Replit connectors

## Recent Changes

**Feb 2026 - Map & Theme Updates**
- Changed theme from emerald green to heart red (#dc2644) for British Heart Foundation branding
- Added interactive Leaflet map with OpenStreetMap tiles showing user location and coins
- Implemented theme-aware CSS variables for all map elements (light/dark mode support)
- Added graceful error handling when no coins available for session start
- Created seed script (server/seed.ts) with demo sponsor data for testing
- Enhanced map icons: user location with pulsing ring animation, coins with 3D bounce effect and value display
- Added role-based theming: teal/cyan for sponsors (#06b6d4), red for players (#dc2644)
- Added light/dark mode toggle button in header
- Replaced Stripe checkout with sandboxed mock payment (direct inventory addition for testing)

**Feb 2026 - Initial MVP Complete**
- Full PWA setup with manifest, service worker, and icons
- Replit Auth integration for authentication
- Dual user roles (Player/Sponsor) with role switching
- Player features: dashboard, GPS session, coin collection, history, leaderboard
- Sponsor features: dashboard, Stripe checkout, coin inventory, tracking
- Backend: complete API routes, storage layer, coin expiration job
- Stripe webhook handling for purchase completion