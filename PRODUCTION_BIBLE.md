# SUPERNOVA DARKMODE — Production Bible

> A dark magical girl chatbot. Four broken idols trapped in a villain's dream. The player talks to them, heals them, or loses them.

---

## 1. Philosophy & Intent

**Who is this human?** A K-pop fan — likely young, emotionally literate, bilingual (Korean/English). They care about fictional characters the way you care about real friends. They're on their phone at midnight, headphones in.

**What must they accomplish?** Talk to four idols. Build trust. Raise their bloom (emotional health) from 0→100. Save them from Yuseongshin's dark dream — or lose them.

**What should this feel like?** A broken music box. Pretty on the surface — pink pixel hearts, cute dialogue boxes — but the screen literally decays as bloom drops. The tab title changes to threats. The music goes out of tune. It's girly, princessy, dark but cute — like a dark magical girl game running on a haunted Game Boy.

---

## 2. Architecture Overview

```
React 18 + TypeScript + Vite
Deployed: Vercel (auto from main branch)
Secondary: GitHub Pages (gh-pages branch, manual)
API: Anthropic Claude Haiku 3 (direct browser calls)
Audio: Web Audio API (synthesized, no audio files)
State: useGameState hook → localStorage persistence
Styling: Pure CSS with custom properties (no Tailwind, no CSS-in-JS)
```

### File Structure
```
src/
├── App.tsx              — Root: splash, onboarding, main layout
├── App.css              — Splash screen, onboarding, app shell
├── main.tsx             — Entry point, viewport height fix
├── components/
│   ├── ChatWindow.tsx/css    — 2-column layout, message rendering
│   ├── MessageInput.tsx/css  — Text input + send button
│   ├── CharacterPanel.tsx/css — Character portrait + effects
│   ├── ChannelTabs.tsx/css   — Tab bar for character switching
│   ├── BloomToast.tsx/css    — Bloom change notification
│   ├── BloomTransition.tsx   — Stage change overlay
│   ├── BloomMeter.tsx/css    — Pixel heart display
│   ├── EndingScreen.tsx/css  — Win/lose screen
│   ├── DarkVeins.tsx/css     — Vignette + corruption overlay
│   ├── ScreenGlitch.tsx/css  — Random glitch effects
│   ├── PixelProps.tsx/css    — Floating emoji decorations
│   ├── MuteButton.tsx/css    — Sound toggle
│   ├── CreatorGhosts.tsx/css — Yuseongshin ghost apparitions
│   └── FormattedMessage.tsx  — Markdown/emoji in messages
├── hooks/
│   └── useGameState.ts       — Central state management
├── utils/
│   ├── aiService.ts          — Claude API integration
│   ├── sound.ts              — Web Audio engine
│   ├── bloomDetector.ts      — Detects bloom tokens in messages
│   ├── memoryService.ts      — Conversation memory for AI
│   ├── zalgo.ts              — Text corruption utility
│   └── consoleEasterEggs.ts  — Developer console surprises
├── data/
│   └── characters/           — Character JSON definitions
├── types/
│   └── index.ts              — All TypeScript interfaces
└── styles/
    └── tokens.css            — CSS custom properties (via index.css)
```

---

## 3. Layout Rules (CRITICAL)

### The Golden Rule
**MessageInput lives INSIDE ChatWindow.** It is a flex child of `.chat-panel`. Never use `position: fixed`, `createPortal`, or viewport-relative positioning for the input bar. This was learned the hard way — portalling it out breaks the 2-column layout.

### Desktop (≥768px)
```
┌──────────────────────────────────────────────┐
│  ChannelTabs (full width, horizontal scroll) │
├─────────────────────┬────────────────────────┤
│                     │  .chat-titlebar        │
│  CharacterPanel     │  .messages-container   │
│  (45% width)        │  (flex: 1, scrollable) │
│                     │  .message-input-cont.  │
│                     │  (flex-shrink: 0)      │
├─────────────────────┴────────────────────────┤
```

- `.chat-container.desktop` → `flex-direction: row`
- `.character-panel-container` → `width: 45%; height: 100%`
- `.chat-panel` → `flex: 1; min-width: 0`
- `.messages-container` → `flex: 1; overflow-y: auto; padding-bottom: 64px`

### Mobile (<768px)
```
┌────────────────────┐
│  ChannelTabs       │
├────────────────────┤
│  CharacterPanel    │
│  (50dvh)           │
├────────────────────┤
│  .chat-titlebar    │
│  .messages-cont.   │
│  .message-input    │
│  (50dvh total)     │
└────────────────────┘
```

- `.chat-container.mobile` → `flex-direction: column; height: 100%`
- `.character-panel-container` → `height: 50dvh; width: 100%`
- `.chat-panel` → `height: 50dvh`
- Uses `dvh` (dynamic viewport height) so chat shrinks when mobile keyboard opens

### Group Chat (SUPERNOVA channel)
- No character panel — chat takes full width
- `.chat-panel.group-chat` → `flex: 1`
- Unlocks when 2+ characters reach bloom ≥ 70

### Do NOT
- Use `position: fixed` on MessageInput
- Use `createPortal` to move MessageInput out of ChatWindow
- Add `margin-bottom` hacks to `.app-main` to compensate for fixed elements
- Change the 50dvh/50dvh mobile split without testing thoroughly
- Use `100vw` on any element inside the chat panel

---

## 4. Component Specifications

### ChatWindow
**Purpose:** Orchestrates the 2-column layout and renders all messages.

| Prop | Type | Description |
|------|------|-------------|
| messages | Message[] | Current channel's message history |
| characters | Character[] | All character data |
| currentChannel | string | Active character/group ID |
| onChoiceSelect | (choice, msgId) => void | Choice button handler |
| onSendMessage | (msg: string) => void | Player sends a message |
| bloomLevel | number | Current character's bloom (0-100) |
| aiLoading | boolean | Show typing indicator |

**Layout:** Detects mobile via `window.innerWidth < 768`. Wraps content in `.chat-container.mobile` or `.chat-container.desktop`.

**Dark effects at low bloom:**
- Phantom messages at bloom ≤ 20 (creepy lines that appear and vanish)
- Zalgo text on character names at low bloom
- Message redaction (████ blocks) at bloom ≤ 25
- `.decayed` class on chat panel at bloom ≤ 40

### MessageInput
**Purpose:** Text input and send button. Lives inside ChatWindow.

| Prop | Type | Description |
|------|------|-------------|
| onSend | (msg: string) => void | Send handler |
| disabled | boolean | Disabled during AI response |
| placeholder | string | Input placeholder text |
| bloomLevel | number | Drives haunted placeholder |

**Haunted placeholder (bloom ≤ 35):** Randomly replaces placeholder with creepy text ("yuseongshin is listening", "don't trust them", etc.) with flicker animation.

**CSS structure:**
```css
.message-input-container {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  padding-bottom: max(var(--space-3), env(safe-area-inset-bottom));
  background: var(--bg-surface);
  border-top: 2px solid var(--border-secondary);
}
```

### CharacterPanel
**Purpose:** Full character portrait with layered visual effects.

| Prop | Type | Description |
|------|------|-------------|
| character | Character | Character data |
| bloomLevel | number | Drives all visual effects |

**Layer stack (bottom to top):**
1. Background glow (radial gradient in character color)
2. Floating sparkles (16 positioned elements)
3. Character image (full height, centered)
4. Scanline overlay (bloom ≤ 35)
5. Info overlay (name + tagline at bottom)
6. Bloom meter (pixel hearts, top-right desktop / top-left mobile)
7. Creator ghosts (Yuseongshin apparitions)

**Bloom-reactive:**
- Image saturation: `0.3 + (bloom / 100) * 0.7` (30% at bloom 0, 100% at bloom 100)
- Image brightness: `0.7 + (bloom / 100) * 0.3`
- Happy artwork swap at bloom ≥ 70
- Scanlines appear at bloom ≤ 35
- Sparkle icons switch from cute (✦★♡) to dark (⚡✟♰) at bloom ≤ 35
- Fourth-wall tagline replacements at bloom < 15

### ChannelTabs
**Purpose:** Horizontal tab bar for switching between characters.

| Prop | Type | Description |
|------|------|-------------|
| characters | Character[] | All characters |
| currentChannel | string | Active tab |
| onSelectChannel | (id: string) => void | Tab click handler |
| characterBloom | Record<string, number> | Bloom per character |

**Tab appearance:**
- 32×32 avatar (scaled 1.6× to show face, 1.15× for Hyunju)
- Character name in pixel font
- Bottom accent bar in character color when active
- Wilted state (bloom ≤ 20): desaturated, 💔 indicator
- Active state: ♥ with heartbeat animation

**Group tab (SUPERNOVA):**
- Unlocks when 2+ characters reach bloom ≥ 70
- Gradient background (pink→purple)
- Flash animation on first unlock

### BloomMeter
**Purpose:** Pixel heart display showing bloom level.

- 5 hearts representing 0-100 bloom
- Each heart = 20 bloom points
- Partially filled hearts for intermediate values
- Hearts crack/empty as bloom drops
- Positioned top-right (desktop) or top-left (mobile)

### Overlay Components

**DarkVeins** (bloom ≤ 40): Two layers — purple vignette from edges + spawning pixel corruption blocks. Intensity scales inversely with bloom.

**ScreenGlitch** (bloom-dependent frequency): Random screen-wide effects — tear, invert, static, shift, flicker. Duration 150-400ms. Lower bloom = more frequent.

**PixelProps**: 10 floating emoji at screen edges. Pool changes with bloom — cute (🦋🌸⭐) above 35, mixed (🥀🔮) at 20-35, broken (💀🕷️⛓️) below 20.

**BloomToast**: Fixed notification showing bloom change (+3 encouragement, -2 coldness, etc.). Appears for 2.5 seconds.

**BloomTransition**: Full-screen overlay for stage transitions (wilted→roots→sprout→budding→blooming). 3-phase animation over ~3.4 seconds.

**EndingScreen**: Full-screen ending when bloom hits 0 (lost) or 100 (saved). Character-specific messages appear line by line.

---

## 5. The Bloom System

### Overview
Each character has an independent bloom value (0-100). Bloom determines:
- Character personality and response style
- Visual decay/healing across all components
- Music mood (dream vs dark)
- Overlay intensity
- Tab appearance
- Ending triggers

### Bloom Stages
| Range | Stage | Description |
|-------|-------|-------------|
| 0-20 | Wilted | Maximum decay, hostile/withdrawn, screen corruption |
| 21-40 | Roots | Dark tints, guarded responses, vignette effects |
| 41-60 | Sprout | Neutral, warming up, minimal effects |
| 61-80 | Budding | Friendly, opening up, bright colors |
| 81-100 | Blooming | Full trust, happy artwork, dream music |

### Bloom Tokens (detected in player messages)
| Token | Example | Effect |
|-------|---------|--------|
| encouragement | "You're doing great" | +bloom |
| patience | "Take your time" | +bloom |
| vulnerability | "I feel scared too" | +bloom |
| curiosity | "Tell me more" | +bloom |
| coldness | "Whatever" | −bloom |
| pressure | "Just get over it" | −bloom |

### Bloom → Visual Effects Map
| Bloom | Effect | Component |
|-------|--------|-----------|
| ≤ 15 | Fourth-wall tagline breaks | CharacterPanel |
| ≤ 20 | Wilted tab state (💔) | ChannelTabs |
| ≤ 20 | Phantom messages | ChatWindow |
| ≤ 20 | Broken pixel props (💀🕷️) | PixelProps |
| ≤ 25 | Message redaction (████) | ChatWindow |
| ≤ 35 | Haunted placeholder text | MessageInput |
| ≤ 35 | Scanline overlay | CharacterPanel |
| ≤ 35 | Dark sparkle icons | CharacterPanel |
| ≤ 40 | Dark vignette + corruption | DarkVeins |
| ≤ 40 | Decayed chat panel tint | ChatWindow |
| ≤ 40 | Browser tab title corruption | App |
| Any | Image saturation scales | CharacterPanel |
| ≥ 70 | Happy artwork swap | CharacterPanel |
| ≥ 70 | Eligible for group chat | ChannelTabs |
| = 0 | "Lost" ending screen | EndingScreen |
| = 100 | "Saved" ending screen | EndingScreen |

---

## 6. Audio System

### Architecture
```
AudioContext → masterGain → destination (speakers)
                         → MediaStreamDestination → HTML <audio> (iOS silent switch bypass)
```

No audio files. Everything is synthesized with Web Audio API oscillators.

### Music Layers
| Layer | Waveform | Role | Volume |
|-------|----------|------|--------|
| Melody | Triangle | Music box notes | 0.09-0.11 |
| Ghost Echo | Sine | Delayed melody repeat | 0.04 |
| Sparkle | Sine (high) | Twinkling accents | 0.05-0.07 |
| Bass | Sine (low) | Low foundation | 0.07-0.08 |
| Drone | Sine | Ambient pad | 0.05-0.06 |

### Bloom → Music
- **Dream mode (bloom > 50):** Major scale, 188 BPM, bright sparkles
- **Dark mode (bloom ≤ 50):** Minor/diminished scale, 136 BPM, detuned "broken music box"
- Crossfade between modes as bloom changes

### Sound Effects
- `playMessageSend()` — Player sends message
- `playMessageReceive()` — Character responds
- `playBloomUp()` / `playBloomDown()` — Bloom changes
- `playTabSwitch()` — Channel tab click
- `playGlitch()` — Screen glitch effect

### iOS Notes
- AudioContext must be created/resumed on user gesture (touchend/click)
- MediaStreamDestination trick routes audio through HTML5 `<audio>` element to bypass silent switch
- `initAudio()` must be called from a user interaction handler
- `startAmbient()` should be delayed ~100ms after `initAudio()` for iOS

---

## 7. AI Integration

### API Setup
```
Model: claude-3-haiku-20240307
Endpoint: https://api.anthropic.com/v1/messages
Header: anthropic-dangerous-direct-browser-access: true
Key: VITE_ANTHROPIC_API_KEY (env var)
Max tokens: 300
```

### Dual Mode
1. **Direct:** Uses API key from `import.meta.env.VITE_ANTHROPIC_API_KEY`
2. **Proxy fallback:** Falls back to `/api/chat` if direct fails
3. **Fallback responses:** Character-specific one-liners if both fail

### Prompt Strategy
The system prompt builds from character data + current bloom stage:
- Character identity, personality, speaking style
- Current bloom stage personality adjustments
- Language: Default Korean (반말, ㅋㅋ, ~), matches player's language
- Villain context (Yuseongshin lore)
- Conversation memory
- Time awareness (late night = different tone)

### Key Rules in System Prompt
- Hook the player (cryptic hints, questions, unfinished stories)
- Be unpredictable (moods, action text, follow-ups)
- Create mystery (leak lore slowly)
- Make it personal (reference earlier conversation)
- Short responses (1-3 sentences, like real texting)

---

## 8. Theming & Design Tokens

### Color Palette
```css
/* Backgrounds */
--bg-blush:    #FFF0F5    /* Main app background */
--bg-surface:  #FFF8FA    /* Card/panel surfaces */
--bg-raised:   #FFECF2    /* Elevated elements */
--bg-deep:     #1a0a2e    /* Dark overlays */

/* Pinks */
--pink-hot:    #FF69B4    /* Primary accent */
--pink-soft:   #FFB6C1    /* Secondary accent */
--pink-pale:   #FFE4F0    /* Subtle backgrounds */
--pink-deep:   #FF1493    /* Strong emphasis */

/* Purples (dark mode / decay) */
--purple-deep: #6A1B9A    /* Darkest purple */
--purple-mid:  #9C27B0    /* Medium purple */
--purple-light:#CE93D8    /* Light purple */
--purple-pale: #F3E5F5    /* Subtle purple tint */
```

### Character Theme Classes
Applied to `.app` as `.theme-{characterId}`:
```css
.theme-miho    → Hot pink world (#FF69B4 accents)
.theme-sohee   → Cool blue-grey world (#78909C accents)
.theme-sujin   → Deep purple world (#9C27B0 accents)
.theme-hyunju  → Warm peach world (#FF8A65 accents)
```

### Typography
```css
--font-display: 'Pixelify Sans'     /* UI chrome, titles, labels */
--font-body:    'Galmuri11', 'DotGothic16'  /* Messages, dialog text */
--font-pixel:   'DotGothic16'       /* Tiny pixel text (system messages) */
```

### Pixel Art Rules
- All borders: 2px solid
- Box shadows use `inset` for raised/sunken pixel effect
- Animations use `steps()` timing function for retro feel
- Image rendering: `pixelated` (via CSS `image-rendering`)
- No border-radius anywhere — everything is sharp rectangles

---

## 9. State Management

### useGameState Hook
Central hook managing all game state. Persists to localStorage (debounced 500ms).

**State shape:**
```typescript
{
  currentChannel: string;           // Active character ID
  messages: Record<string, Message[]>; // Per-channel message history
  characterBloom: Record<string, number>; // 0-100 per character
  conversationCount: Record<string, number>;
  bloomTokensEarned: Record<string, string[]>;
}
```

**Key behaviors:**
- Channel switching restores that channel's message history
- Bloom detection runs on every player message
- AI responses queued and processed one at a time
- 30% chance of unprompted message when switching channels
- Greeting injection on first visit to a character
- Memory updates sent to AI for context continuity

---

## 10. Deployment

### Vercel (Primary)
- Auto-deploys from `main` branch
- Env var: `VITE_ANTHROPIC_API_KEY` must be set in Vercel dashboard
- Force deploy: `vercel --prod --force` (bypasses build cache)
- Domain: configured in Vercel project settings

### GitHub Pages (Secondary)
- Manual deploy via `npm run deploy` (gh-pages package)
- Uses base path from vite.config.ts
- Cache: clear `node_modules/.cache/gh-pages` if stale

### Environment Variables
```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...  # Anthropic API key
```
- Must be set in BOTH `.env.local` (local dev) and Vercel dashboard (production)
- Vite exposes as `import.meta.env.VITE_ANTHROPIC_API_KEY`

### Service Worker / Caching
- Workbox via `vite-plugin-pwa` with `skipWaiting: true`, `clientsClaim: true`
- Mobile Safari aggressively caches — index.html has cache-clearing script
- After deploy issues, may need `vercel --prod --force` to bust Vercel build cache

---

## 11. Characters

### Miho (미호)
- **Color:** Hot pink (#FF69B4)
- **Role:** The bright leader who hides her cracks
- **Avatar zoom:** 1.6× (default)

### Sohee (소희)
- **Color:** Cool blue-grey (#78909C)
- **Role:** The quiet observer with deep feelings
- **Avatar zoom:** 1.6× (default)

### Sujin (수진)
- **Color:** Deep purple (#9C27B0)
- **Role:** The fierce one protecting everyone
- **Avatar zoom:** 1.6× (default)

### Hyunju (현주)
- **Color:** Warm peach (#FF8A65)
- **Role:** The youngest, still hopeful
- **Avatar zoom:** 1.15× (tighter composition)

---

## 12. Known Issues & Lessons Learned

### Layout
- **NEVER portal or fix-position the input bar.** It breaks the 2-column layout. MessageInput must be a flex child inside ChatWindow.
- **50dvh mobile split is intentional.** Character gets top half, chat gets bottom half. Don't change this ratio without testing on real devices.
- **padding-bottom: 64px on messages-container** prevents last message from hiding behind input bar.

### API
- **Always test API key with curl before debugging code.** Invalid keys return 401 but the app silently falls back to generic responses.
- **Vercel env vars require redeploy to take effect.** Use `vercel --prod --force`.

### Audio
- **No `debugAudio()` function exists.** Don't add calls to it — it was removed and references to it cause silent runtime errors.
- **iOS audio requires user gesture.** `initAudio()` → wait 100ms → `startAmbient()`.
- **MediaStreamDestination is the iOS silent switch bypass.** Don't remove it.

### Caching
- **Mobile Safari caches aggressively.** The cache-clearing script in index.html helps.
- **After any deploy, test in incognito/private browsing** to verify new code loads.

### General
- **Don't add margin/padding hacks to fix layout issues.** Find the root cause.
- **Don't change working components while fixing others.** Scope changes tightly.
- **Test on both mobile and desktop after every change.** The 2-column layout is fragile.
- **Read the file before editing it.** Always.

---

## 13. Quick Reference: z-index Stacking

```
Base layer:     App background
z-index auto:   CharacterPanel, ChatWindow
z-index 1:      PixelProps overlay
z-index 2:      DarkVeins overlay
z-index 10:     ScreenGlitch overlay
z-index 50:     BloomToast
z-index 100:    BloomTransition overlay
z-index 200:    EndingScreen overlay
z-index 999:    MuteButton
```

---

*Last updated: 2026-02-15*
*This document is the source of truth for SUPERNOVA DARKMODE's architecture and design decisions.*
