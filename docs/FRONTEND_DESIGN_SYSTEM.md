# Ayurshala Frontend Design System

**Premium SaaS Healthcare Platform**  
**Modern Glassmorphism Design Language**

---

## Design Philosophy

The Ayurshala ERP frontend is designed as a premium healthcare operating system, comparable to:
- Linear (design elegance)
- Vercel Dashboard (modern SaaS)
- Stripe (professional polish)
- Apple (attention to detail)
- Raycast (command interface)

**Core Principles**:
- ✅ Minimalist interface
- ✅ Maximum clarity
- ✅ Premium aesthetics
- ✅ Smooth animations
- ✅ Accessibility-first
- ✅ Responsive everywhere

---

## Color Palette

### Primary - Emerald (Ayurvedic Green)
```
50:   #f0fdf4
100:  #dcfce7
200:  #bbf7d0
300:  #86efac
400:  #4ade80
500:  #22c55e (Main Brand)
600:  #16a34a
700:  #15803d
800:  #166534
900:  #145231
```

### Accent - Gold
```
50:   #fffbeb
100:  #fef3c7
200:  #fde68a
300:  #fcd34d
400:  #fbbf24
500:  #f59e0b (Accent)
600:  #d97706
700:  #b45309
800:  #92400e
900:  #78350f
```

### Secondary - Slate
```
50:   #f8fafc
100:  #f1f5f9
200:  #e2e8f0
300:  #cbd5e1
400:  #94a3b8
500:  #64748b (Neutral)
600:  #475569
700:  #334155
800:  #1e293b
900:  #0f172a
```

### Status Colors
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Amber)
- **Danger**: #ef4444 (Red)
- **Info**: #3b82f6 (Blue)

### Dark Mode
Complete dark equivalents for all colors with proper contrast ratios.

---

## Typography

### Font Family
- **Primary**: Inter (SFProDisplay for Apple)
- **Monospace**: Fira Code

### Font Sizes
```
Display (56px):  3.5rem
Heading (32px):  2rem
Subheading (24px): 1.5rem
Title (18px):    1.125rem
Body (16px):     1rem
Small (14px):    0.875rem
Caption (12px):  0.75rem
```

### Font Weights
- Light: 300
- Regular: 400 (body text)
- Medium: 500 (labels, buttons)
- Semibold: 600 (headings)
- Bold: 700 (emphasis)

### Line Heights
- Tight: 1.2 (headings)
- Snug: 1.375 (subheadings)
- Normal: 1.5 (body)
- Relaxed: 1.625 (large text)
- Loose: 2 (spacing)

---

## Spacing Scale

```
0:    0
1:    0.25rem (4px)
2:    0.5rem (8px)
3:    0.75rem (12px)
4:    1rem (16px)
6:    1.5rem (24px)
8:    2rem (32px)
12:   3rem (48px)
16:   4rem (64px)
20:   5rem (80px)
24:   6rem (96px)
32:   8rem (128px)
```

---

## Border Radius

```
sm:    4px (0.375rem)
md:    8px (0.5rem)
lg:    12px (0.75rem)
xl:    16px (1rem)
2xl:   24px (1.5rem)
full:  9999px (circles)
```

---

## Shadows

### Elevation Levels

```
sm:       0 1px 2px rgba(0,0,0,0.05)
md:       0 4px 6px rgba(0,0,0,0.1)
lg:       0 10px 15px rgba(0,0,0,0.1)
xl:       0 20px 25px rgba(0,0,0,0.1)
2xl:      0 25px 50px rgba(0,0,0,0.25)
glass:    0 8px 32px rgba(31,38,135,0.37)
```

---

## Glassmorphism

### Technique
1. **Backdrop Blur**: 10px - 16px
2. **Background**: rgba with 30-50% opacity
3. **Border**: 1px solid with low opacity light
4. **Layering**: Multiple blur levels for depth

### Implementation

```css
/* Glass Card */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

/* Dark Mode Glass */
.dark .glass-card {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
```

---

## Component Library

### Buttons

**Primary Button**
- Background: Primary 600
- Hover: Primary 700
- Active: Scale 95%
- Disabled: Opacity 50%

**Secondary Button**
- Background: Gray 100 (Light) / Slate 800 (Dark)
- Hover: Gray 200 / Slate 700

**Ghost Button**
- Background: Transparent
- Text: Gray 600 (Light) / Gray 400 (Dark)
- Hover: Gray 100 / Slate 800

**Outline Button**
- Border: Gray 300 / Slate 600
- Hover: Gray 50 / Slate 900

**Destructive Button**
- Background: Red 600
- Hover: Red 700
- Confirmation: Double-check pattern

### Forms

**Input Fields**
- Padding: 10px 16px
- Border Radius: 8px
- Border: 1px solid Gray 300 / Slate 600
- Focus: Ring 2px primary, border transparent
- Error State: Red border, red text below

**Form Sections**
- Use cards with subtle separators
- Group related fields
- Progressive disclosure for complex forms
- Inline validation

**Stepper Forms**
- Multi-step long forms
- Progress indicator at top
- Back/Next/Save buttons
- Validation per step

### Cards

**Glass Card**
- Rounded: 12px
- Shadow: md (normal) to lg (hover)
- Border: 1px solid light
- Hover: Scale 102%, shadow increase
- Background: White with opacity / Dark with opacity

### Tables

**Features**
- Sticky headers
- Resizable columns (drag to resize)
- Column visibility toggle
- Search & filters
- Sort ascending/descending
- Row selection (checkboxes)
- Pagination
- Export button
- Loading skeleton rows

### Modals

**Glass Modal**
- Backdrop: Black with 50% opacity
- Blur: 16px
- Max Width: 28rem
- Border Radius: 12px
- Keyboard: Esc closes
- Accessible: Trap focus

### Drawers

**Use for**:
- Quick view
- Quick edit
- Notifications
- AI Chat
- Patient summary
- Side navigation (mobile)

---

## Animations

### Using Framer Motion

```
Fast:   150ms cubic-bezier(0.4, 0, 0.2, 1)
Base:   200ms cubic-bezier(0.4, 0, 0.2, 1)
Slow:   300ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Page Transitions
- Fade in/out
- Slide from right (200ms)
- Respect reduced motion settings

### Component Animations
- Button hover: Scale 105%, shadow increase
- Card hover: Scale 102%, shadow increase
- Modal: Scale in from 95%
- Sidebar toggle: Width animation (300ms)
- Loading spinner: Smooth rotation

### No Animations When
- `prefers-reduced-motion: reduce`
- Mobile devices (optional)
- Low battery mode (optional)

---

## Dashboard Components

### Stat Cards
- Icon + value + trend
- Compact layout
- Hover effect (shadow increase)
- 4 per row (responsive)

### Charts
- Recharts library
- Responsive containers
- Animated appearance
- Tooltip on hover
- Legend below

### Recent Activity
- Simple list
- Avatar + name + action
- Timestamp
- Status badge

---

## Layout

### Desktop (1440px+)
```
┌─ Sidebar (256px fixed) ─┬─ Top Bar (h-16) ──────┐
│                         │                       │
│                         │   Content Area        │
│   Navigation            │   (flex, responsive)  │
│   (scrollable)          │   (p-8)               │
│                         │                       │
│                         ├─ Settings ────────────┤
└─ Bottom Actions ────────┴───────────────────────┘
```

### Tablet (768px - 1440px)
```
┌─ Collapsed Sidebar ─┬─ Top Bar ──────────┐
│ (icon only, w-20)   │ (full width)       │
├─────────────────────┤                    │
│                     │ Content Area       │
│ Navigation          │ (p-6)              │
│ (scroll)            │                    │
│                     │ Drawer menu        │
└─────────────────────┴────────────────────┘
```

### Mobile (< 768px)
```
┌─ Mobile Header ─────────────────┐
│ Menu + Logo + Actions           │
├─────────────────────────────────┤
│                                 │
│ Content Area                    │
│ (p-4, full width)               │
│                                 │
├─────────────────────────────────┤
│ Bottom Navigation (sticky)       │
│ Dashboard | Patients | Menu     │
└─────────────────────────────────┘
```

---

## Responsive Breakpoints

```
320px   (Mobile small)
375px   (Mobile)
425px   (Mobile large)
768px   (Tablet)
1024px  (Tablet landscape)
1440px  (Desktop)
1920px  (Desktop wide)
2560px  (4K)
```

---

## Accessibility Standards

### WCAG AA Compliance

- **Color Contrast**: 4.5:1 minimum for text
- **Focus Indicators**: Visible at all times
- **Keyboard Navigation**: All controls accessible via Tab
- **Screen Readers**: Semantic HTML, ARIA labels
- **Motion**: Respect `prefers-reduced-motion`
- **Text**: Readable without color alone
- **Forms**: Labels, error messages, hints

### Implementation

```tsx
// Semantic HTML
<button aria-label="Close modal" onClick={onClose}>
  <X />
</button>

// Focus visible
.focus:ring-2 .focus:ring-offset-2

// Skip to content
<a href="#main" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// ARIA live regions
<div aria-live="polite" aria-atomic="true">
  Notification message
</div>
```

---

## Performance

### Techniques

1. **Lazy Loading**: Images, heavy components
2. **Code Splitting**: Dynamic imports per route
3. **Image Optimization**: WebP, responsive images
4. **CSS Optimization**: Tailwind purging
5. **Animations**: GPU-accelerated (transform, opacity)
6. **Bundle Analysis**: Monitor size

### Targets

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: < 500KB (gzipped)

---

## Component Checklist

Every module must include:

- [ ] Dashboard (overview + KPIs)
- [ ] List Page (table + filters + search)
- [ ] Detail Page (full record view)
- [ ] Create Page (form with validation)
- [ ] Edit Page (form with prefilled data)
- [ ] Delete Confirmation (modal)
- [ ] Loading States (skeleton UI)
- [ ] Empty States (illustration + CTA)
- [ ] Error States (friendly message + retry)
- [ ] Responsive Design (all breakpoints)
- [ ] Dark Mode Support
- [ ] Keyboard Navigation
- [ ] Screen Reader Support

---

## File Structure

```
components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   ├── Badge.tsx
│   └── Skeleton.tsx
├── layout/
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   └── MobileNav.tsx
├── modules/
│   ├── Patients/
│   ├── Appointments/
│   └── ...
└── AIAssistant.tsx

lib/
├── design-tokens.ts
└── hooks/
    ├── useTheme.ts
    ├── useMediaQuery.ts
    └── ...

app/
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── patients/
│   ├── appointments/
│   └── ...
└── ...
```

---

## Do's and Don'ts

### ✅ DO

- Use design tokens (colors, spacing, typography)
- Respect theme system (light/dark)
- Animate with purpose (not excessive)
- Test responsive at all breakpoints
- Use semantic HTML
- Implement keyboard navigation
- Provide loading states
- Group related controls
- Use whitespace effectively
- Animate transitions smoothly

### ❌ DON'T

- Hardcode colors (use tokens)
- Forget dark mode
- Use excessive animations
- Ignore accessibility
- Break responsive layout
- Overuse transparency
- Use poor color contrast
- Forget loading states
- Make long forms without steps
- Use auto-playing videos/audio

---

## Theme System

### Light Mode (Default)

```
Background: #ffffff
Text: #111827
Border: #e5e7eb
Hover: #f3f4f6
Shadow: rgba(0,0,0,0.1)
```

### Dark Mode

```
Background: #0f172a
Text: #f9fafb
Border: #1e293b
Hover: #1f2937
Shadow: rgba(0,0,0,0.5)
```

### Switching (no page refresh)

```tsx
const { theme, setTheme } = useTheme()
setTheme(theme === 'dark' ? 'light' : 'dark')
```

---

## Success Metrics

- ✅ Consistent design language across all modules
- ✅ Premium SaaS appearance (not admin panel)
- ✅ Glassmorphism with proper transparency
- ✅ Light & Dark themes fully supported
- ✅ Perfect responsive design
- ✅ WCAG AA accessibility compliance
- ✅ Smooth animations (60fps)
- ✅ Fast load times (< 2s)
- ✅ AI chat seamlessly integrated
- ✅ Zero design inconsistencies

---

**Status**: ACTIVE (Phase 16)  
**Last Updated**: 2026-06-27  
**Version**: 1.0 (Foundation)
