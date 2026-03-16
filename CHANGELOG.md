# Changelog

All notable changes to EnergyPilot are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

#### Onboarding Flow (`/onboarding`)
- 4-step wizard shown to every new authenticated user before they reach the dashboard
  - **Step 1 — Facility Setup**: facility name, type selector (Residential / Office / Institution / Industrial), main breaker capacity
  - **Step 2 — Connect Hub**: 3-second local network scan animation, manual serial number entry, hub name
  - **Step 3 — Room Configuration**: facility-type-aware room presets
    - Residential: Kitchen, Parlour, Master Bedroom, Bedroom 2/3, Bathroom, Garage, Laundry Room, Home Office, Dining Room
    - Office: Reception, Open Office, Conference Rooms, Manager's Office, Server Room, Board Room, Lobby
    - Institution: Dean's Office, Deputy Dean's Office, Secretary's Office, Faculty Board Room, Lecture Halls, Staff Room, Computer Lab, Library
    - Industrial: Production Floor, Control Room, Storage Bay, Loading Dock, Maintenance Workshop, Quality Control, Generator Room
    - Custom room input with Enter key support
  - **Step 4 — Provisioning**: animated step sequence (Device Found → Wi-Fi Credentials Exchanged → Registering with AWS IoT Core → Calibrating ML baseline) then redirects to dashboard
- Onboarding data persisted to Convex on Step 3 completion (before animation plays)
- `hasCompletedOnboarding` flag set on user record — returning users skip onboarding entirely
- `activeFacilityId` (serial number) stored on user record for multi-device switching

#### Multi-Device Support (Settings → Device Management)
- "Add Device" button re-enters the onboarding flow to register additional hubs
- Facility switcher dropdown appears when user has 2+ registered hubs
- Active facility toggled via `setActiveFacility` mutation (O(1) patch on user record)
- Real hub data displayed in device table when hubs exist; static demo data shown otherwise

#### Convex Backend
- `convex/onboarding.ts` — new file with `completeOnboarding`, `listHubs`, `setActiveFacility`
- `convex/schema.ts` — additive-only changes to existing tables:
  - `users`: added optional `hasCompletedOnboarding`, `activeFacilityId`
  - `devices`: added optional `serialNumber`, `facilityName`, `facilityType`, `facilityRooms`, `breakerCapacity`
  - All existing fields and indexes untouched — no breaking migration

### Fixed
- `StepProvisioning` component: removed cascading `setState` inside `useEffect` by deriving `done` from `currentStep` directly instead of tracking it as separate state

---

## [0.1.0] — Initial Release

### Added
- Landing page with hero, comparison, features, demo, testimonial, pricing, CTA, and footer sections
- Clerk authentication (sign-in / sign-up) with custom dark theme
- Convex backend with `users`, `devices`, `readings` schema and full CRUD
- Dashboard with Overview, Circuits, Predictions, Analytics, and Settings pages
- Redux Toolkit for UI state (sidebar open/close, active view)
- Full mobile responsiveness across all pages (hamburger nav, responsive grids, touch targets)
- Dark-only theme enforced via `next-themes`
