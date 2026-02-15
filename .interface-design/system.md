# SUPERNOVA DARKMODE — Design System

## Intent
A character chatbot where broken K-pop idols heal through conversation.
Feels like: a magical girl's phone at 2am. Pink dreamcore × 16-bit pixel art.
The UI is PINK and warm — the darkness lives in the characters, not the interface.

## Color Palette

### Backgrounds (Pink World)
- `--bg-blush`: #FFF0F5 (lavender blush, app background)
- `--bg-surface`: #FFE4EE (soft pink, panels/message area)
- `--bg-raised`: #FFD6E8 (raised elements, buttons)
- `--bg-deep`: #FFCCE0 (deeper pink, hover states)
- `--bg-overlay`: rgba(255, 240, 245, 0.92)

### Reserved Dark (for character art effects only)
- `--bg-void`: #2A0A1F
- `--bg-night`: #1A0514

### Pinks (Primary)
- `--pink-hot`: #FF69B4 (primary accent, borders, buttons)
- `--pink-soft`: #FFB6C1 (secondary borders, highlights)
- `--pink-pale`: #FFD1DC (subtle accents, inset shadows)
- `--pink-deep`: #FF1493 (pressed states, emphasis)
- `--pink-glow`: rgba(255, 105, 180, 0.25)

### Purples (Secondary)
- `--purple-deep`: #6A1B9A (active borders, emphasis)
- `--purple-mid`: #9C27B0 (player message accents)
- `--purple-light`: #CE93D8 (player bubble borders)
- `--purple-pale`: #E8D5F0 (inset shadows)

### Text (Dark berry on pink)
- `--text-primary`: #4A0028 (main text)
- `--text-secondary`: #880044 (secondary text)
- `--text-muted`: #B85C8A (timestamps, hints)
- `--text-soft`: #D4849F (placeholders)
- `--text-on-dark`: #FFE4F0 (text on dark surfaces)

### Character Colors
- Miho: #FF6B9D (hot pink-coral)
- Sohee: #4CAF50 (green)
- Sujin: #9C27B0 (purple)
- Hyunju: #FF8A65 (warm orange)

### Bloom Heart Colors
- Empty heart: --bg-raised (soft pink outline)
- Cracked heart: half-filled with --pink-soft
- Filled heart: --pink-hot (solid)

## Typography
- **Pixel font**: 'Press Start 2P', cursive — ONLY for titles, labels, UI chrome (14px+)
- **Body font**: 'VT323', monospace — ALL readable text, messages, descriptions (20px+)

### Scale
- Pixel: 8px (xs), 10px (sm), 12px (base), 14px (lg)
- Body: 20px (sm), 24px (base), 28px (lg), 32px (xl)

## Depth & Borders
All borders are **pixel borders** — hard 2px solid lines. No border-radius. No soft shadows.

### Raised Pixel Panel (buttons, tabs, dialog chrome)
```css
border: 2px solid var(--border-primary);
box-shadow:
  inset -2px -2px 0 var(--pink-pale),
  inset 2px 2px 0 white;
```

### Sunken Pixel Panel (inputs, content areas)
```css
border: 2px solid var(--pink-soft);
box-shadow:
  inset -2px -2px 0 white,
  inset 2px 2px 0 var(--pink-pale);
```

## Components

### Pixel Dialog Window
The core UI element. Used for chat panel, loading screen.
- Title bar: gradient from pink-hot to purple-mid
- Left: 3 colored heart dots (♥♥♥)
- Center: filename.exe in pixel font
- Right: [—][□][×] pixel buttons
- Content area: sunken panel with messages

### Bloom Meter (Pixel Hearts)
- 5 hearts per character
- Each heart = 20 bloom points
- States: empty (pale outline), cracked (half-filled), filled (solid pink)
- Positioned top-right of character panel

### Character Display
- Character takes 50%+ of viewport
- Positioned center, bottom-anchored
- No background — blends with --bg-blush
- Subtle float animation
- Bloom-dependent: saturation filter (grayscale at wilted → full color at bloom)
- Floating pixel sparkles (more at higher bloom)
- Corner pixel brackets

### Chat Messages
- Pixel dialog boxes with 2px borders
- Character messages: white bg, pink border, raised shadow
- Player messages: --bg-raised bg, purple border
- VT323 font at 24px for readability

### Channel Tabs
- Pixel button style per character
- Active: white bg, character color border, pink glow
- Inactive: raised pink panel
- Pixel avatar + uppercase name + ♥ indicator

## Animations
- All transitions use `steps()` for pixel feel
- Float: subtle 3px up/down, requestAnimationFrame
- Message appear: 3-step pixel fade (0 → 0.5 → 1)
- Heart pulse: scale 1 → 1.1 → 1 in steps(2)
- Sparkle float: fade + rise, staggered delays
- Shine: diagonal sweep across character, 5s loop

## Dark Decay System (Bloom-Reactive)
The pink exterior is the mask. At low bloom, the UI cracks to reveal the darkness underneath.
As bloom rises, ALL decay effects fade — the interface heals alongside the character.

### Dark Vignette + Pixel Corruption
- Dark purple gradient vignette consuming screen edges (void swallowing the pink)
- Vignette spread and opacity scale with bloom (30% spread at wilted, gone by bloom 40)
- Pixel corruption blocks flash near edges like data rot in a retro cartridge
- Blocks spawn at intervals (300ms at wilted, 800ms near threshold), max 10 on screen
- Colors: deep void (#1A0514), purple (#6A1B9A), occasional hot pink error pixel (#FF1493)
- Vignette breathes slowly (6s pulse cycle)

### Bleeding Hearts (Bloom Meter)
- At wilted: hearts drip dark purple, pixel drip animation
- At roots: hearts have visible cracks
- At sprout+: hearts begin to heal, drips stop
- At blooming: hearts pulse with warm glow

### Titlebar Glitch
- At low bloom, title text occasionally flickers to distress text
- "miho_chat.exe" → "help_me.exe" / "dont_leave.exe" for single frames
- CSS animation with content swap, rare interval

### Scanline Interference
- VHS tracking lines over character panel at low bloom
- Subtle horizontal lines that scroll slowly
- Opacity tied to bloom level (gone above 60)

### Broken Props
- At wilted: floating decorations are broken versions
- Torn butterfly wing, snapped key, cracked star
- Swap to healed versions as bloom rises

## Layout
### Mobile (< 768px)
- Character: top 50vh
- Chat panel: bottom 50vh
- Tabs: top, horizontal scroll
- Input: bottom of chat panel

### Desktop (>= 768px)
- Character: left 45%
- Chat panel: right 55%, pixel-bordered
- Tabs: above everything
- Input: bottom of chat panel
