# Design Guidelines: 17-Week Weight Loss Challenge iOS App

## Design Philosophy
Apple-minimalist design inspired by Apple Fitness/Health. Focus: **clarity, efficiency, motivation**. No gamification. Native iOS feel with smooth animations and intuitive gestures.

## Core Architecture

### User Model
**Single-user, no auth** (MVP). Settings include: display name, units (lbs/kg), reminders, app lock (passcode), light/dark mode, data export, challenge settings.

### Navigation
**Bottom Tabs** (4): Home | Log | Progress | Settings
- Stack navigation within tabs for drill-downs
- Full-screen modals: Onboarding, Photo Comparison, Weekly Check-In, Export
- Native iOS gestures: swipe back, pull-to-dismiss

---

## Screen Layouts

### Home Dashboard
**Command center** showing daily/weekly status.

**Cards** (vertical scroll):
1. **Today's Checklist**: Nutrition (✓/Pending/Skipped), Workout (✓/Pending), Habits (Water/Steps/Sleep inline toggles)
2. **This Week**: Monday Photo status, Weekly Weigh-In status
3. **Streaks & Compliance**: Current streaks (Nutrition: 5d), Weekly score (85/100, color-coded: green ≥80, yellow 60-79, gray <60)
4. **Quick Actions**: Log Nutrition (primary), Log Workout, Upload Photo, Weekly Check-In

**Visual**: 16px rounded cards, subtle shadow (offset {0,2}, opacity 0.05, radius 8), green checkmarks (iOS green), gray for pending, no red for skipped.

**Safe Areas**: Top: headerHeight + 24px, Bottom: tabBarHeight + 24px

---

### Log Screen
**Quick access hub** for daily/weekly logs.

**Layout**: Header with date picker → Collapsible sections/tabs for Nutrition, Workout, Habits

**Dedicated Screens** (stack nav):
- **Nutrition Log**: Large numeric inputs (Calories, Protein, Carbs, Fat), optional notes, "Mark as Skipped" button (secondary, bottom), prefill yesterday's values (ghosted), Cancel/Save in header
- **Workout Log**: Type selector (Push/Pull/Legs/Plyo-Abs/Rest - segmented control), Duration (optional), Notes, Templates ("Use Push Template" 1-tap), Save button

**Safe Areas**: Same as Home

---

### Weekly Check-In (Modal)
**Full-screen modal**: Photo upload (Monday), weight, measurements.

**Sections**:
1. **Photo**: Large square preview, Upload button → Camera/Library, "Late Upload" orange badge if needed
2. **Weigh-In**: Weight input (large numeric), optional notes
3. **Measurements**: Optional toggles (Waist, Hips, Chest)
4. **Submit**: Bottom primary button "Save Check-In"

**Safe Areas**: Top/Bottom: 24px

---

### Progress Screen
**Tabs**: Charts | Photos | Insights (segmented control)

**Charts Tab**:
- Weight trend (line chart, 17 weeks) with goal pace (dotted line), current vs. expected pace
- Macro trends (weekly averages)
- Compliance score (bar chart/grid)

**Photos Tab**:
- 3-column grid, square thumbnails, week # overlay
- Tap → Full-screen view with swipe
- Compare button → Photo Comparison Modal

**Insights Tab**:
- Positive statements only: "You've logged nutrition 42/50 days"

**Safe Areas**: Same as Home

---

### Photo Comparison Modal
**Full-screen**: Week dropdowns (top) → Side-by-side OR slider overlay view, Close button (top-left X)

---

### Settings Screen
**iOS Settings-style scrollable list**

**Sections**:
1. **Challenge**: Start Date, Goal Weight, Units
2. **Reminders**: Time pickers for Nutrition (8:30 PM), Workout (6 PM), Photo (Mon 10 AM), Weigh-In (Mon 10:15 AM), Habits (9 PM) + Smart Rules toggle
3. **Privacy**: App Lock toggle + Set Passcode
4. **Appearance**: Theme (Auto/Light/Dark)
5. **Data**: Export (JSON/CSV), Seed Demo Data (dev), Generate Summary (PDF/Image)

**Safe Areas**: Same as Home

---

## Design System

### Colors
**Light**: BG #FFF, Card #F9F9F9, Border #E5E5E5, Text #000, Secondary #666, Primary #007AFF, Success #34C759, Warning #FF9500, Neutral #8E8E93

**Dark**: BG #000, Card #1C1C1E, Border #38383A, Text #FFF, Secondary #ABABAB, Primary #0A84FF, Success #30D158, Warning #FF9F0A, Neutral #98989D

### Typography (SF Pro)
- Large Title: 34pt Bold
- Title 1: 28pt Regular
- Title 2: 22pt Regular
- Title 3: 20pt Semibold
- Headline: 17pt Semibold (card titles)
- Body: 17pt Regular
- Callout: 16pt Regular
- Subheadline: 15pt Regular
- Footnote: 13pt Regular

### Spacing
xs:4px, sm:8px, md:12px, lg:16px, xl:24px, 2xl:32px, 3xl:48px

### Components

**Cards**: 16px radius, 16px padding, 12px margins, shadow (offset {0,2}, opacity 0.05, radius 8)

**Buttons**: 
- Primary: Filled (Primary color), white text, 14px height, 16px radius
- Secondary: Border (Primary color), Primary text
- Text: No border, Primary text
- Min height: 44pt, opacity 0.6 on press

**Forms**: 50pt height, 12px radius, light gray border, Primary border on focus, auto-focus first field, large numeric inputs

**Toggles**: iOS native Switch, green on/gray off

**Charts**: Minimal dashed gridlines (light gray), 2px stroke, rounded caps, transparent BG, Footnote axis labels (Secondary color)

**Loading**: iOS ActivityIndicator centered, skeleton screens (gray pulse)

**Empty States**: Centered Feather icon (48px, gray), Headline "No data yet", Body with helpful prompt

**Errors**: Top toast/alert, inline red text for validation

### Animations (React Native Reanimated)
- Card entry: Fade + slide up (300ms ease-out)
- Modal: Slide up (400ms ease-out)
- Toggles: Spring animation
- Charts: Ease-in-out (500ms)
- Disable if system "reduce motion" enabled

### Accessibility
- VoiceOver labels for all interactive elements
- Min contrast: 4.5:1 (WCAG AA)
- Min touch target: 44x44pt
- Keyboard nav support

### Data Integrity (Visual Feedback)
- **1 photo/week**: Show "Edit Photo" if exists
- **1 weigh-in/week**: Disable duplicates, show "Already logged this week"
- **1 log/day**: Edit mode if exists
- Orange text for late entries (not errors)

### Assets
- **Icons**: Feather icons (@expo/vector-icons) - no emojis
- **Nav icons**: home, clipboard, bar-chart-2, settings
- **Photo placeholders**: Light gray rounded square + camera icon
- **No custom illustrations**

---

## Key Rules
✅ **DO**: Use iOS native components, smooth animations, positive language, green for success, gray for neutral  
❌ **DON'T**: Use red/negative colors for skipped items, gamify, clutter UI, use emojis/custom illustrations