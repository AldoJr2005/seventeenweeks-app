# 17 WEEKS

## Overview

A native iOS mobile app built with Expo (React Native) for tracking a 17-week weight loss challenge. The app provides daily logging for nutrition, workouts, and habits, along with weekly progress photos and weigh-ins. It features an Apple-style minimalist design with streak tracking, compliance scoring, and progress visualization.

The app supports multiple user accounts with local PIN protection, designed to be private and motivational without gamification noise.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo (React Native) with TypeScript
- **Navigation**: React Navigation with bottom tabs (Home, Log, Progress, Settings) and native stack navigators for each tab
- **State Management**: TanStack React Query for server state, React Context for auth state
- **UI Components**: Custom themed components (Card, Button, ThemedText, ThemedView) following Apple design guidelines
- **Styling**: StyleSheet with theme constants, supporting light/dark mode
- **Animations**: React Native Reanimated for smooth, native-feel animations
- **Keyboard Handling**: react-native-keyboard-controller for proper keyboard avoidance

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Storage Interface**: Abstracted storage layer for database operations

### Data Model
Core entities stored in PostgreSQL:
- **challenges**: 17-week challenge configuration (start date, weights, goals, reminder times)
- **dayLogs**: Daily nutrition tracking (calories, macros, notes) - legacy, for PDF export compatibility
- **foodEntries**: MyFitnessPal-style meal-based food logging (Breakfast/Lunch/Dinner/Snacks) with per-serving nutrition data, barcode support
- **workoutLogs**: Daily workout entries (type: Push/Pull/Legs/Plyo-Abs/Rest)
- **weeklyPhotos**: Monday progress photos
- **weeklyCheckIns**: Weekly weigh-ins and body measurements
- **habitLogs**: Daily habits (water, steps, sleep)
- **userProfiles**: User settings and password hash
- **appSettings**: App-wide configuration

### Authentication & Security
- Multi-account support with local PIN protection
- Password hashing via expo-crypto (SHA-256)
- Session management with expo-secure-store (native) or sessionStorage (web)
- Auto-lock functionality with configurable timeout
- Email/phone recovery contact info for PIN reset (stored in userProfiles)
- No external auth providers (local-only for MVP)

### Theme Support
- Light/dark/system theme toggle stored persistently
- ThemeContext provides effectiveTheme throughout the app
- Signature Easter egg at bottom of Login and Settings screens (white in dark mode, black in light mode)

### Key Design Decisions

**Challenge Structure**: Weeks start on Monday, aligned with the 17-week program structure. Users cannot log data before their challenge start date.

**Photo Storage**: Weekly photos are now stored permanently in `FileSystem.documentDirectory/weeklyPhotos/{challengeId}/week-{weekNumber}.{ext}`. The photo-storage utility (`client/lib/photo-storage.ts`) handles:
- Permanent storage with compression (resize to 1200px height, 70% JPEG quality)
- Photo status checking (available/missing/none) for both local files and remote URLs
- Automatic detection of missing photos with re-upload UI prompts
- Base64 conversion for PDF export with proper MIME type detection
- Support for legacy remote URLs (http/https) that don't require FileSystem checks

**Offline Considerations**: React Query caching provides some offline capability. Full offline-first sync not implemented in MVP.

**PDF Export**: Client-side PDF generation using expo-print for challenge summaries and sharing.

**Nutrition Tracking**: MyFitnessPal-style meal-based logging with:
- Swipeable dashboard cards (Calories/Macros) with progress rings
- Meal categories: Breakfast, Lunch, Dinner, Snacks
- Per-serving nutrition data with serving size calculations
- Barcode scanning via expo-camera with OpenFoodFacts API integration
- Manual food entry with brand and nutrition info
- Daily totals calculated from food entries

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, provisioned via Replit
- **Drizzle ORM**: Type-safe database operations with schema defined in `shared/schema.ts`

### Expo SDK Modules
- expo-image-picker: Photo capture for weekly progress photos
- expo-secure-store: Secure credential storage on device
- expo-crypto: Password hashing
- expo-haptics: Tactile feedback
- expo-print/expo-sharing: PDF generation and sharing
- expo-blur/expo-glass-effect: iOS-style visual effects
- expo-camera: Barcode scanning for food entry lookup

### Client Libraries
- @tanstack/react-query: Server state management and caching
- react-native-reanimated: Performant animations
- react-native-gesture-handler: Touch gesture handling
- react-native-safe-area-context: Safe area insets

### Development
- drizzle-kit: Database migrations (`npm run db:push`)
- tsx: TypeScript execution for server
- esbuild: Server bundling for production