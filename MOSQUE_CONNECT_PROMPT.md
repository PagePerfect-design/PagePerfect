# Mosque Connect — Comprehensive Build Prompt

> Copy this entire prompt into a new Claude Code session in a fresh project directory.
> Do NOT build this inside the PagePerfect repo.

---

```
Build a premium mosque community app called "Mosque Connect" (Arabic: مسجدي — Masjidi).

The app notifies people of prayer times, local lessons, and community announcements.
It must be multi-platform (iOS, Android, web). The design must be god-tier — not SaaS,
not Material Design, not generic. It should feel like a digital extension of a mosque:
reverent, warm, precise, and beautiful. Better than an Apple experience.

Everything self-hosted on a Digital Ocean droplet via Coolify.

## TECH STACK

| Layer                | Technology                                           |
|----------------------|------------------------------------------------------|
| Cross-platform       | React Native + Expo SDK 52 (managed workflow, TypeScript) |
| Navigation           | Expo Router (file-based, tab layout)                 |
| Backend / Auth / DB  | PocketBase (self-hosted on Digital Ocean via Coolify) |
| Prayer calculation   | adhan-js (npm: adhan) — offline, no external API     |
| Push notifications   | Expo Notifications + Expo Push Service               |
| Animations           | React Native Reanimated 3 + Moti + Lottie           |
| Haptics              | expo-haptics                                         |
| Sound                | expo-av                                              |
| Location             | expo-location                                        |
| Local storage        | expo-sqlite (offline-first cache)                    |
| Maps                 | react-native-maps                                    |
| App builds           | EAS (Expo Application Services)                      |
| Hosting              | Coolify on Digital Ocean droplet                     |
| Admin panel          | React web app (same Coolify droplet, or Expo Web)    |

### Why these choices:
- **PocketBase over Supabase**: Single binary, self-hosted, runs on a $6 droplet, real-time
  subscriptions, built-in auth, REST + Realtime API. No cloud dependency.
- **adhan-js over Aladhan API**: Offline calculation, no network dependency for prayer times,
  supports all calculation methods (ISNA, MWL, Egyptian, Karachi, Umm Al-Qura, etc.).
  Used by major Muslim apps. More accurate for edge-case locations.
- **Expo managed workflow**: No native code ejection needed. EAS builds iOS/Android binaries
  in the cloud. Faster development, easier updates via OTA.
- **Coolify**: Self-hosted PaaS on your own droplet. You control everything.

---

## DESIGN SYSTEM — "The Digital Mosque"

This is not a utility app. This is a sacred space rendered in pixels.

### Design Philosophy

The visual language draws from three traditions:
1. **Islamic geometric art** — tessellation, 8-fold symmetry, arabesque curves, muqarnas depth
2. **Calligraphic precision** — the discipline of Naskh and Kufi scripts
3. **Architectural serenity** — the proportions of the Sultan Ahmed Mosque, the Alhambra, and
   the Sheikh Zayed Grand Mosque

Every design decision must satisfy these rules:
- **Warm, not clinical.** Ivory parchment backgrounds, not white. Walnut ink, not black.
- **Reverent, not playful.** No cartoon illustrations, no gamification, no confetti.
- **Generous space.** 30-50% more padding than a typical app. Content breathes like a mosque courtyard.
- **Geometric precision.** Layout proportions derived from Islamic geometric construction.
- **Bilingual-native.** Arabic and English are first-class citizens. RTL is not an afterthought.

### Color Palette — "Mosque at Golden Hour"

Drawn from Iznik tilework, Alhambra zellige, and gilded Quranic manuscripts.

```
TOKEN                  HEX        USAGE
───────────────────────────────────────────────────────────────
-- Surfaces (Light Mode) --
ivory                  #FAF7F2    Primary background — warm parchment
cream                  #F3EDE3    Secondary surface — aged manuscript
alabaster              #EDEAE4    Card backgrounds — carved stone
warm-white             #FEFCF9    Elevated surfaces — marble inlay

-- Surfaces (Dark Mode — "Night Prayer") --
void                   #0D0B09    Root background — deep night
obsidian               #161310    Primary surface — polished stone
charcoal               #1E1B17    Card background — carved wood
warm-dark              #262220    Elevated surface — dark mahogany

-- Ink & Text (Light) --
deep-ink               #1A1612    Primary text — walnut ink
warm-ink               #2C2520    Secondary text
soft-ink               #5C534A    Tertiary text
muted-ink              #8A8078    Placeholder text

-- Ink & Text (Dark) --
pearl                  #F0EBE3    Primary text — moonlit marble
soft-pearl             #C4BDB3    Secondary text
dim-pearl              #8A837A    Tertiary text
ghost-pearl            #5C5650    Placeholder text

-- Sacred Blue (from Iznik tilework) --
sacred-blue            #1B4B7A    Primary accent — links, buttons, navigation
sacred-blue-light      #2A6BAA    Hover/active state
sacred-blue-pale       #E8F0F8    Blue tint for backgrounds
sacred-blue-deep       #0E2D4A    Dark variant for headers

-- Divine Gold (from gilded calligraphy) --
divine-gold            #C5952B    Sacred moments — prayer countdowns, badges, achievements
divine-gold-light      #D4AD4A    Highlight state
divine-gold-pale       #FBF5E6    Gold tint for backgrounds

-- Paradise Green (from Jannah symbolism) --
paradise-green         #2D6B4F    Success/positive — prayer completed, goal reached
paradise-green-light   #3D8B6A    Hover state
paradise-green-pale    #E8F5EE    Green tint for backgrounds

-- Moorish Terracotta (from Marrakech clay) --
moorish-terra          #B85C3A    Warmth — notifications, event reminders
moorish-terra-light    #D47A55    Soft variant
moorish-terra-pale     #FBF0EB    Terra tint backgrounds

-- Functional --
error                  #C0392B    Muted red (not harsh)
warning                #D4A017    Amber
```

**Accent rules:**
- Sacred Blue = primary interaction color (trust, authority)
- Divine Gold = reserved for sacred/premium moments ONLY (prayer times, Quran, achievements)
- Paradise Green = positive confirmation (prayer logged, donation complete)
- Moorish Terracotta = warmth and attention (notifications, community events)

### Typography — Bilingual First-Class

```
Arabic Display:    Reem Kufi          — geometric Kufi, strong headers
Arabic Body:       Noto Naskh Arabic  — exceptional readability, full Unicode
English Display:   Playfair Display   — high-contrast serif, pairs with Kufi geometry
English Body:      Source Serif 4     — optical sizes, excellent screen readability
Mono/Labels:       IBM Plex Mono      — technical precision, clean numerals
```

All fonts are open-source (Google Fonts / open-font-license). Load via expo-font.

**Type scale (responsive, bilingual):**
```
Level       English    Arabic     Line Height (En)    Line Height (Ar)
──────────────────────────────────────────────────────────────────────
Hero        40pt       44pt       1.1                 1.3
H1          32pt       36pt       1.15                1.35
H2          24pt       28pt       1.2                 1.4
H3          20pt       23pt       1.25                1.45
Body        16pt       18pt       1.5                 1.7
Caption     13pt       15pt       1.4                 1.6
Label       11pt       13pt       1.3                 1.5
Micro       10pt       12pt       1.3                 1.5
```

Arabic text needs 15-20% more vertical space than Latin at the same point size.

### Spacing Scale (8pt base unit, generous)

```typescript
xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32,
'2xl': 48, '3xl': 64, '4xl': 96, '5xl': 128
```

Component-specific (GENEROUS — this is what makes it premium):
- Card padding: 24pt (not 16)
- Screen horizontal padding: 24pt (not 16)
- Section vertical padding: 48pt
- Button height: 52pt
- Input height: 52pt
- Bottom screen padding: 48pt (thumb reach zone)

### Border Radius

```typescript
none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 9999
```

### Elevation (Muqarnas-Inspired Depth)

Three card depth tiers, like muqarnas vault layering:
- Ground (feeds): alabaster bg, shadow offset 1, opacity 0.06, radius 3
- Elevated (prayer cards, featured): warm-white bg, shadow offset 4, opacity 0.08, radius 12
- Floating (modals, sheets): warm-white bg, shadow offset 16, opacity 0.16, radius 48

### Animation System

```typescript
// Timing
instant: 100ms    // Color changes, opacity
fast: 200ms       // Button feedback, toggles
normal: 300ms     // Card transitions, tabs
gentle: 400ms     // Sheet presentations
slow: 600ms       // Orchestrated animations
dramatic: 1000ms  // Prayer time reveal, splash

// Spring configs (Reanimated)
snappy:     { damping: 20, stiffness: 300, mass: 0.8 }   // Button feedback
responsive: { damping: 18, stiffness: 200, mass: 1 }     // Card interactions
gentle:     { damping: 22, stiffness: 120, mass: 1.2 }   // Sheet presentations
bouncy:     { damping: 12, stiffness: 180, mass: 0.9 }   // Celebrations
heavy:      { damping: 28, stiffness: 100, mass: 1.5 }   // Large modals
```

Every interaction must have animation. Nothing happens instantly:
- Button press: scale to 0.97 with snappy spring, back to 1 on release
- Cards: fade-in with spring on mount, staggered 60ms between list items
- Tab switch: underline slides with responsive spring
- Screen transitions: shared element transitions on hero cards
- Pull-to-refresh: custom geometric pattern animation (not default spinner)
- Skeleton loading: girih pattern that shimmers (branded loading, not grey boxes)

### Haptic Feedback Vocabulary

```
Light tap    — toggle, checkbox, minor selection
Medium tap   — button press, card selection, navigation
Heavy tap    — delete confirmation, significant action
Success      — prayer logged, donation complete, goal reached
Warning      — approaching limit, schedule conflict
Error        — validation failure, network error
Selection    — scrolling through prayer times, picker scrolling
```

### Sound Design — Reverent, Not Playful

No synthetic bleeps. Acoustic and natural timbres only: oud, ney (reed flute), riq.

```
Athan notification    — Recorded muezzin call (first phrase), 8-12s
Prayer reminder       — Single oud pluck + natural decay, 2s
Prayer logged         — Soft ney phrase ascending, 1.5s
Page turn             — Paper folio turn + room tone, 0.5s
Community interaction — Soft ceramic tile tap, 0.3s
Error                 — Low oud drone, 0.8s
Tab switch            — Near-silent mechanical click, 0.1s
```

Sounds are OFF by default. User opts in during onboarding.

### Geometric Patterns

Create SVG geometric patterns for:
- Background watermark: 8-fold octagram at 2-4% opacity, tiled
- Section dividers: simplified star-and-rosette strip at 8-12% opacity
- Card accent: positioned top-right or bottom-left at 5-8% opacity
- Loading skeleton: girih strap-work pattern that shimmers
- Empty states: stylized arabesque forms

All SVGs use stroke only (no fill), color set to `currentColor` for theme adaptability.

### Icon Style

Line weight 1.5pt at 24x24. Outlined at rest, filled when active.
Derive shapes from Islamic geometric construction where possible:
- Home = Mosque dome silhouette
- Prayer = Praying figure (geometric, not figurative)
- Community = Overlapping circles (Islamic pattern)
- Compass = Qibla direction (octagram-derived)
- Notification = Minaret silhouette

### RTL Support

- Mirror ALL horizontal layouts for Arabic
- Flip directional icons (arrows, progress), NOT universal icons (home, settings)
- Use I18nManager.forceRTL() when Arabic is active
- Consistent writingDirection on all Text components
- Offer Hindi-Arabic numerals (٠١٢) as option, Western Arabic (012) as default

---

## ARCHITECTURE — Self-Hosted on Digital Ocean

### Infrastructure

```
Digital Ocean Droplet ($12-24/mo)
└── Coolify (self-hosted PaaS)
    ├── PocketBase
    │   ├── REST API + Realtime WebSocket  → mosque-connect.yourdomain.com/api
    │   ├── Admin UI                       → mosque-connect.yourdomain.com/_/
    │   ├── Auth (email/password + OAuth)
    │   └── SQLite (lightweight, fast)
    └── (Optional) Admin Web Panel
        └── React app for mosque administrators

Expo Push Service (free, external)
└── Receives push tokens from app
└── Routes to APNs (iOS) and FCM (Android)

App Distribution
├── iOS  → Apple TestFlight → App Store
├── Android → Google Play Console
└── Web  → Expo Web (PWA) on Coolify
```

### PocketBase Collections

```
COLLECTION: mosques
──────────────────────────
id                  (auto)
name                text, required          — "Masjid Al-Noor"
name_arabic         text                    — "مسجد النور"
address             text, required
city                text, required
state               text
country             text, required
latitude            number, required
longitude           number, required
calculation_method  number, default 2       — ISNA=2, MWL=3, Egyptian=5, UmmAlQura=4
asr_method          text, default "Standard" — "Standard" or "Hanafi"
jumua_time          text                    — "13:15" (manual override for Friday prayer)
isha_angle          number                  — Custom Isha angle if needed
fajr_angle          number                  — Custom Fajr angle if needed
contact_phone       text
contact_email       text
website             text
image               file                    — Mosque photo
timezone            text, required          — "America/New_York"
is_verified         bool, default false
created             auto
updated             auto

API RULES:
  List/View: public (no auth required)
  Create: admin only
  Update/Delete: admin only

COLLECTION: announcements
──────────────────────────
id                  (auto)
mosque              relation → mosques, required
title               text, required
title_arabic        text
body                text, required
body_arabic         text
priority            select ["normal", "important", "urgent"], default "normal"
category            select ["general", "maintenance", "fundraising", "weather", "schedule_change"]
published_at        date, default now()
expires_at          date
pinned              bool, default false
author              relation → users
created             auto
updated             auto

API RULES:
  List/View: public
  Create/Update/Delete: admin OR user in mosque_admins for this mosque

COLLECTION: events
──────────────────────────
id                  (auto)
mosque              relation → mosques, required
title               text, required
title_arabic        text
description         text
description_arabic  text
speaker             text
speaker_arabic      text
event_date          date, required
start_time          text, required          — "19:30"
end_time            text                    — "21:00"
location            text                    — Defaults to mosque address
category            select ["lesson", "lecture", "quran_circle", "youth", "sisters",
                           "community", "iftar", "taraweeh", "janazah", "nikah"]
recurring           select ["none", "daily", "weekly", "biweekly", "monthly"]
recurring_until     date
max_attendees       number
image               file
author              relation → users
created             auto
updated             auto

API RULES:
  List/View: public
  Create/Update/Delete: admin OR user in mosque_admins for this mosque

COLLECTION: user_subscriptions
──────────────────────────
id                  (auto)
user                relation → users, required
mosque              relation → mosques, required
notify_prayers      bool, default true
notify_announcements bool, default true
notify_events       bool, default true
prayer_reminder_minutes  number, default 15  — minutes before athan
notify_fajr_only    bool, default false      — only get Fajr notifications
created             auto
updated             auto

UNIQUE: (user, mosque)

API RULES:
  List/View: owner only (user = @request.auth.id)
  Create: authenticated
  Update/Delete: owner only

COLLECTION: push_tokens
──────────────────────────
id                  (auto)
user                relation → users
expo_token          text, required           — "ExponentPushToken[xxxxx]"
device_id           text, required           — Unique device identifier
platform            select ["ios", "android", "web"]
active              bool, default true
created             auto
updated             auto

UNIQUE: (device_id)

API RULES:
  Create: authenticated
  Update/Delete: owner only

COLLECTION: mosque_admins
──────────────────────────
id                  (auto)
mosque              relation → mosques, required
user                relation → users, required
role                select ["admin", "super_admin"], default "admin"
created             auto
updated             auto

UNIQUE: (mosque, user)

API RULES:
  List/View: admin of that mosque or super_admin
  Create/Delete: super_admin only

COLLECTION: prayer_adjustments
──────────────────────────
id                  (auto)
mosque              relation → mosques, required
prayer              select ["fajr", "dhuhr", "asr", "maghrib", "isha"]
adjustment_minutes  number, default 0       — +/- minutes from calculated time
iqama_offset        number, default 0       — Minutes after athan for iqama
notes               text                    — "DST adjustment" etc.
created             auto
updated             auto

API RULES:
  List/View: public
  Create/Update/Delete: admin of that mosque
```

### Prayer Time Calculation (Offline with adhan-js)

```typescript
// prayer-service.ts
import { Coordinates, PrayerTimes, CalculationMethod, CalculationParameters } from 'adhan';

const CALCULATION_METHODS: Record<number, () => CalculationParameters> = {
  1: () => CalculationMethod.MuslimWorldLeague(),
  2: () => CalculationMethod.NorthAmerica(),     // ISNA
  3: () => CalculationMethod.MuslimWorldLeague(),
  4: () => CalculationMethod.UmmAlQura(),
  5: () => CalculationMethod.Egyptian(),
  7: () => CalculationMethod.Karachi(),
};

export function getPrayerTimes(
  latitude: number,
  longitude: number,
  date: Date,
  method: number = 2,
  asrMethod: 'Standard' | 'Hanafi' = 'Standard',
) {
  const coordinates = new Coordinates(latitude, longitude);
  const params = (CALCULATION_METHODS[method] || CALCULATION_METHODS[2])();
  if (asrMethod === 'Hanafi') {
    params.madhab = Madhab.Hanafi;
  }

  const prayerTimes = new PrayerTimes(coordinates, date, params);

  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
    // Current/next prayer
    currentPrayer: prayerTimes.currentPrayer(),
    nextPrayer: prayerTimes.nextPrayer(),
    timeForPrayer: (prayer: string) => prayerTimes.timeForPrayer(prayer),
  };
}
```

No external API dependency. Works completely offline. The adhan library handles
all astronomical calculations including high-latitude adjustments.

### Push Notification Flow

```
1. App registers with Expo Push Service on launch
   → Receives ExponentPushToken[xxxxx]
   → Saves to PocketBase push_tokens collection

2. LOCAL prayer notifications (no server needed):
   → App calculates tomorrow's prayer times via adhan-js
   → Schedules local notifications via expo-notifications scheduleNotificationAsync()
   → Reschedules daily at midnight (background task via expo-task-manager)

3. REMOTE announcements/events (server-triggered):
   → Admin posts announcement via admin panel
   → PocketBase hook (or separate tiny Node.js service on Coolify) triggers
   → Fetches push tokens for users subscribed to that mosque
   → Sends batch to Expo Push API: https://exp.host/--/api/v2/push/send
   → Expo routes to APNs (iOS) / FCM (Android)
```

The Expo Push Service is free, handles millions of notifications, and is the
standard for Expo apps. You don't need Firebase directly.

For the server-side push sender, create a small Node.js service on Coolify:

```javascript
// push-service.js — runs on Coolify alongside PocketBase
const express = require('express');
const fetch = require('node-fetch');
const PocketBase = require('pocketbase').default;

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function sendPushNotifications(mosqueId, title, body, data = {}) {
  // Get all active push tokens for users subscribed to this mosque
  const subscriptions = await pb.collection('user_subscriptions').getFullList({
    filter: `mosque = "${mosqueId}" && notify_announcements = true`,
  });

  const userIds = subscriptions.map(s => s.user);

  const tokens = await pb.collection('push_tokens').getFullList({
    filter: userIds.map(id => `user = "${id}"`).join(' || ') + ' && active = true',
  });

  // Batch send to Expo Push API (max 100 per request)
  const messages = tokens.map(t => ({
    to: t.expo_token,
    title,
    body,
    data,
    sound: 'default',
    priority: 'high',
  }));

  const chunks = chunkArray(messages, 100);
  for (const chunk of chunks) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    });
  }
}
```

### Offline-First Architecture

```
App Launch
├── Check SQLite cache for today's prayer times
│   ├── Cache hit → Display immediately
│   └── Cache miss → Calculate via adhan-js, save to SQLite
├── Check SQLite for cached announcements/events
│   ├── Display cached data immediately
│   └── Fetch fresh data from PocketBase in background
│       └── Update SQLite + UI when response arrives
└── Subscribe to PocketBase Realtime for live updates
    └── Auto-reconnects on network recovery

SQLite Tables (local cache):
  prayer_cache      — date, mosque_id, fajr, sunrise, dhuhr, asr, maghrib, isha
  announcements     — mirror of PocketBase, with last_synced timestamp
  events            — mirror of PocketBase, with last_synced timestamp
  user_preferences  — theme, language, notification settings
```

---

## APP SCREENS (Expo Router)

### File Structure

```
app/
├── _layout.tsx              # Root layout — theme provider, fonts, sound manager
├── (tabs)/
│   ├── _layout.tsx          # Tab bar layout (5 tabs, animated indicator)
│   ├── index.tsx            # TAB 1: Home — Prayer times + next prayer countdown
│   ├── prayers.tsx          # TAB 2: Full prayer schedule + Qibla compass
│   ├── community.tsx        # TAB 3: Announcements + Events feed
│   ├── events.tsx           # TAB 4: Calendar view of events/lessons
│   └── profile.tsx          # TAB 5: Settings + mosque subscriptions
├── mosque/
│   └── [id].tsx             # Mosque detail — info, prayer adjustments, events
├── announcement/
│   └── [id].tsx             # Full announcement view
├── event/
│   └── [id].tsx             # Full event detail + "Add to Calendar"
├── onboarding/
│   ├── index.tsx            # Welcome — geometric pattern reveal animation
│   ├── location.tsx         # Location permission + nearby mosques
│   ├── mosques.tsx          # Select your mosque(s)
│   ├── notifications.tsx    # Notification preferences
│   └── complete.tsx         # Bismillah — ready to go
└── auth/
    ├── login.tsx            # Sign in (email/password)
    └── register.tsx         # Sign up
```

### Tab 1: Home (Prayer Times) — THE HERO SCREEN

This is the most important screen. It must feel like opening the door to a mosque.

```
┌──────────────────────────────────────┐
│                                      │
│   ⌂ Masjid Al-Noor                  │
│   13 Rajab 1447 AH                  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  │        الـمـغـرب              │    │
│  │        MAGHRIB                │    │
│  │                              │    │
│  │     ◷  6 : 4 2  PM          │    │
│  │                              │    │
│  │   ━━━━━━━━━━━━━━━━━━━━━━━   │    │
│  │   Iqama in 23 minutes        │    │
│  │                              │    │
│  │  [geometric pattern at 3%]   │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌─────┬─────┬─────┬─────┬─────┐    │
│  │Fajr │Dhuhr│ Asr │Magh │Isha │    │
│  │5:42 │12:15│3:45 │●6:42│8:05 │    │
│  │ ✓   │ ✓   │ ✓   │ NOW │     │    │
│  └─────┴─────┴─────┴─────┴─────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 📢 Urgent: Jumu'ah moved     │    │
│  │    to 1:30 PM this week      │    │
│  └──────────────────────────────┘    │
│                                      │
│  Upcoming                            │
│  ┌──────────────────────────────┐    │
│  │ 📖 Tafsir Circle             │    │
│  │    Sheikh Ahmad · Tonight 8PM│    │
│  └──────────────────────────────┘    │
│                                      │
└──────────────────────────────────────┘
```

**Key interactions:**
- Prayer time card animates between prayers (outgoing fades down, incoming rises with spring)
- Countdown uses divine-gold color with monospace numerals
- Subtle octagram watermark behind the time at 3% opacity
- Progress arc showing elapsed time within current prayer window
- Past prayers show a checkmark in paradise-green
- Current prayer highlighted with divine-gold dot
- Tapping any prayer time expands to show iqama time + adjustment details

### Tab 2: Prayers — Full Schedule + Qibla

```
┌──────────────────────────────────────┐
│  Today's Schedule                    │
│  Tuesday, 25 February 2026          │
│                                      │
│  Fajr          5:42 AM    ✓         │
│  Sunrise       7:05 AM              │
│  Dhuhr        12:15 PM    ✓         │
│  Asr           3:45 PM    ✓         │
│  Maghrib       6:42 PM    ● NOW     │
│  Isha          8:05 PM              │
│                                      │
│  ─── Iqama Times ───                 │
│  Fajr   +20min  |  Dhuhr  +10min   │
│  Asr    +10min  |  Magh   +5min    │
│  Isha   +15min  |  Jumu'ah 1:15PM  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │       QIBLA COMPASS          │    │
│  │                              │    │
│  │          ▲ 119° SE           │    │
│  │        ╱     ╲               │    │
│  │      ╱  🕋    ╲             │    │
│  │        ╲     ╱               │    │
│  │          ▼                   │    │
│  │                              │    │
│  │   Distance: 11,234 km       │    │
│  └──────────────────────────────┘    │
│                                      │
│  ─── Monthly View ───                │
│  [Calendar with prayer time         │
│   variations shown as gradient      │
│   bands across the month]           │
│                                      │
└──────────────────────────────────────┘
```

**Qibla compass:**
- Uses device magnetometer (expo-sensors)
- Smooth Reanimated rotation
- Haptic tick when aligned with Qibla direction
- Accuracy indicator ring

### Tab 3: Community — Announcements Feed

```
┌──────────────────────────────────────┐
│  Community                           │
│                                      │
│  ┌── URGENT ────────────────────┐    │
│  │ Parking Lot Closure           │    │
│  │ East lot closed for repair    │    │
│  │ through Friday. Use west...   │    │
│  │ 2 hours ago · Masjid Al-Noor │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ Winter Coat Drive             │    │
│  │ Drop off gently used coats   │    │
│  │ at the masjid entrance...    │    │
│  │ Yesterday · Masjid Ar-Rahman │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ Quran Memorization Program    │    │
│  │ New semester starting March   │    │
│  │ 1st. Registration open...    │    │
│  │ 2 days ago · Masjid Al-Noor  │    │
│  └──────────────────────────────┘    │
│                                      │
│  [Real-time — new posts appear      │
│   with fade-in animation at top]    │
│                                      │
└──────────────────────────────────────┘
```

**Key interactions:**
- Real-time via PocketBase Realtime subscription
- Urgent announcements: moorish-terra left border + pinned to top
- Cards enter with staggered fade-in (60ms between items)
- Pull-to-refresh with geometric pattern animation
- Tap to expand full announcement with shared element transition

### Tab 4: Events — Calendar + List

```
┌──────────────────────────────────────┐
│  Events & Lessons                    │
│  [List] [Calendar]                   │
│                                      │
│  ─── This Week ───                   │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ TUE  📖 Tafsir Circle        │    │
│  │ 25   Sheikh Ahmad             │    │
│  │      8:00 PM — 9:30 PM       │    │
│  │      Masjid Al-Noor          │    │
│  │      [lesson] [weekly]       │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ THU  👥 Youth Night           │    │
│  │ 27   Ages 13-18              │    │
│  │      7:00 PM — 9:00 PM       │    │
│  │      Masjid Ar-Rahman        │    │
│  │      [youth] [biweekly]      │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ SAT  👩 Sisters' Halaqah      │    │
│  │ 01   Ustadha Fatima           │    │
│  │      10:00 AM — 11:30 AM     │    │
│  │      Masjid Al-Noor          │    │
│  │      [sisters] [weekly]      │    │
│  └──────────────────────────────┘    │
│                                      │
│  Category: [All] [Lessons]          │
│  [Youth] [Sisters] [Community]       │
│                                      │
└──────────────────────────────────────┘
```

**Key interactions:**
- List/calendar toggle with layout animation
- Category filter chips with haptic tick on selection
- "Add to Calendar" button on detail view (expo-calendar)
- Recurring events show series indicator
- Event cards use paradise-green accent for lessons, moorish-terra for community

### Tab 5: Profile + Settings

```
┌──────────────────────────────────────┐
│  Settings                            │
│                                      │
│  ─── My Mosques ───                  │
│  ┌──────────────────────────────┐    │
│  │ ✓ Masjid Al-Noor             │    │
│  │   🔔 Prayers · Announcements │    │
│  │   ⏰ Remind 15 min before    │    │
│  └──────────────────────────────┘    │
│  ┌──────────────────────────────┐    │
│  │ ✓ Masjid Ar-Rahman           │    │
│  │   🔔 Events only             │    │
│  └──────────────────────────────┘    │
│  [+ Add Mosque]                      │
│                                      │
│  ─── Prayer Settings ───             │
│  Calculation: ISNA              ▸    │
│  Asr method:  Standard          ▸    │
│  Reminder:    15 min before     ▸    │
│  Fajr alarm:  Always ring       ▸    │
│                                      │
│  ─── Appearance ───                  │
│  Theme:       Auto              ▸    │
│  Language:    English           ▸    │
│  Numerals:    Western (123)     ▸    │
│  Time format: 12-hour           ▸    │
│                                      │
│  ─── Sounds ───                      │
│  App sounds:  Off               ▸    │
│  Athan voice: Mishary Alafasy   ▸    │
│                                      │
│  ─── About ───                       │
│  Version 1.0.0                       │
│  Built for the community             │
│                                      │
└──────────────────────────────────────┘
```

### Onboarding Flow (First Launch)

4 screens, each with a full-screen geometric pattern animation:

1. **Welcome** — Bismillah calligraphy animation (Lottie). App name reveals letter by letter.
2. **Location** — Request permission. Show map with nearby mosques as pins.
3. **Select Mosques** — Cards for each nearby mosque. Tap to subscribe. Multi-select.
4. **Notifications** — Request permission. Configure prayer reminder timing. Preview notification.

Each screen transitions with a shared geometric pattern that evolves
(4-fold → 6-fold → 8-fold → 12-fold as complexity grows).

---

## ADMIN PANEL

Simple web interface for mosque administrators (can be Expo Web or separate React app,
served from the same Coolify droplet).

### Admin Features:
- Login with PocketBase auth (checks mosque_admins collection)
- Dashboard: subscriber count, recent announcements, upcoming events
- Create/edit announcements (title, body, priority, expiry, bilingual)
- Create/edit events (full form with category, recurring, speaker)
- Manage prayer time adjustments (iqama offsets per prayer)
- View subscriber list (aggregate, not individual data)
- Mosque profile management (photo, contact, website)

### Admin Design:
Same design system as the mobile app but adapted for desktop:
- Sidebar navigation
- Same color palette, typography, spacing
- Forms use the same input styling
- Cards use the same elevation system

---

## MVP WEEK PLAN

### Day 1: Foundation
- [ ] Create Expo project with TypeScript
- [ ] Set up Expo Router with tab layout
- [ ] Install and configure all packages (adhan, reanimated, moti, etc.)
- [ ] Set up PocketBase collections on Coolify (use existing droplet)
- [ ] Implement design tokens (colors, typography, spacing, elevation)
- [ ] Create theme provider with light/dark mode
- [ ] Load all fonts (Arabic + English)
- [ ] Build base components: Button, Card, Input, Text (bilingual)

### Day 2: Prayer Times (Core Feature)
- [ ] Implement adhan-js prayer calculation service
- [ ] Build prayer time cache with expo-sqlite
- [ ] Create the Hero prayer card (animated, countdown, progress arc)
- [ ] Build the 5-prayer row with current/past/future states
- [ ] Implement Qibla compass with magnetometer
- [ ] Schedule local prayer notifications
- [ ] Background task for daily notification rescheduling

### Day 3: Community Feed
- [ ] PocketBase client setup (auth, CRUD, realtime)
- [ ] Build announcement card component
- [ ] Implement real-time feed with PocketBase Realtime subscription
- [ ] Priority handling (urgent pinned, normal chronological)
- [ ] Pull-to-refresh with custom animation
- [ ] Offline cache for announcements (expo-sqlite)

### Day 4: Events + Calendar
- [ ] Build event card component with category badges
- [ ] Calendar view (react-native-calendars, themed to design system)
- [ ] List view with date grouping
- [ ] Category filter chips
- [ ] Event detail screen with "Add to Calendar"
- [ ] Offline cache for events

### Day 5: Notifications + Settings
- [ ] Expo Push Token registration flow
- [ ] Push notification handler (foreground + background)
- [ ] Build settings screen with all preference controls
- [ ] Mosque subscription management (add/remove, per-mosque notification prefs)
- [ ] Server-side push sender service (Node.js on Coolify)
- [ ] Wire PocketBase hooks → push service for new announcements

### Day 6: Onboarding + Admin
- [ ] 4-screen onboarding flow with animations
- [ ] Location permission + nearby mosque discovery
- [ ] Auth screens (login/register)
- [ ] Admin web panel (React, deployed on Coolify)
- [ ] Admin: announcement CRUD forms
- [ ] Admin: event CRUD forms
- [ ] Admin: prayer adjustment management

### Day 7: Polish + Ship
- [ ] Animation polish pass (all transitions, micro-interactions)
- [ ] Dark mode verification
- [ ] RTL layout testing
- [ ] Offline mode testing
- [ ] Error states and empty states with geometric patterns
- [ ] EAS build for iOS (TestFlight) and Android (internal track)
- [ ] Deploy admin panel on Coolify

---

## PACKAGES TO INSTALL

```bash
# Create project
npx create-expo-app@latest mosque-connect --template tabs

# Navigation (already included with tabs template)
npx expo install expo-router expo-linking expo-constants

# Core functionality
npm install adhan                          # Offline prayer time calculation
npx expo install expo-notifications        # Push + local notifications
npx expo install expo-location             # GPS for nearby mosques + Qibla
npx expo install expo-sensors              # Magnetometer for Qibla compass
npx expo install expo-sqlite               # Offline-first local database
npx expo install expo-calendar             # "Add to Calendar" for events
npx expo install expo-task-manager         # Background tasks (daily reschedule)
npx expo install expo-haptics              # Tactile feedback
npx expo install expo-av                   # Sound playback
npx expo install expo-font                 # Custom font loading
npx expo install expo-device               # Device info for push tokens
npx expo install expo-secure-store         # Secure token storage

# Animation & gesture
npx expo install react-native-reanimated   # UI-thread animations
npx expo install react-native-gesture-handler  # Gesture system
npm install moti                           # Declarative animation wrapper
npm install lottie-react-native            # Complex illustrative animations

# UI
npm install react-native-calendars         # Calendar component
npx expo install react-native-maps         # Maps for mosque discovery
npm install react-native-svg               # SVG geometric patterns
npx expo install react-native-safe-area-context  # Safe area handling

# Backend
npm install pocketbase                     # PocketBase JS SDK

# Utilities
npm install date-fns                       # Date formatting
npm install date-fns-hijri                 # Hijri calendar dates
```

---

## POCKETBASE DEPLOYMENT ON COOLIFY

1. In Coolify, create a new service → Docker
2. Use the PocketBase Docker image: `ghcr.io/muchobien/pocketbase:latest`
3. Mount a volume for data persistence: `/pb_data`
4. Set environment variables as needed
5. Configure reverse proxy for your subdomain
6. Access admin UI at `yourdomain/_/` to create collections

If you already have PocketBase running for PagePerfect, you can either:
- **Share the instance** (add new collections alongside existing ones) — simpler
- **Run a separate instance** on a different port — better isolation

Recommendation: **Separate instance** for clean separation of concerns.

---

## KEY IMPLEMENTATION NOTES

1. **Prayer times are calculated locally** — the app works with zero network.
   adhan-js handles all astronomical math including high-latitude adjustments.

2. **PocketBase Realtime** replaces the need for WebSocket infrastructure.
   Subscribe to collection changes with `pb.collection('announcements').subscribe('*', callback)`.

3. **Expo Push Service is free** and handles the complexity of APNs + FCM routing.
   You just send to `https://exp.host/--/api/v2/push/send` with the Expo token.

4. **The design is the product.** Spend real time on spacing, animation curves, and
   color application. The difference between good and god-tier is in the details:
   - 60ms stagger between list items (not 0)
   - spring animations with damping 18 (not linear 300ms)
   - 24pt card padding (not 16pt)
   - warm ivory #FAF7F2 (not white #FFFFFF)
   - walnut ink #1A1612 (not black #000000)

5. **Bilingual from day one.** Every text component should accept both Arabic and English.
   Do not bolt on RTL later — it will be painful.

6. **Sounds are opt-in.** Default to silent. Respect the user's context (they may be at work).

Start with the project scaffolding, design tokens, theme provider, and the Prayer Times
home screen. That single screen, done perfectly, proves the concept.
```

---

## How to Use This Prompt

1. Create a new directory: `mkdir ~/MosqueConnect && cd ~/MosqueConnect`
2. Open a new Claude Code session in that directory
3. Paste the entire prompt above (everything between the ``` blocks)
4. Claude will scaffold the project, set up PocketBase, and start building

The prompt is designed to be comprehensive enough that you can iterate on it
over the week without losing context on the design system or architecture.
