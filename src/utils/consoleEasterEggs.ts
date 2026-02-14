// Console Easter Eggs — hidden Yuseongshin lore in the browser DevTools
// Because even the console isn't safe from his reach

const YUSEONGSHIN_ASCII = `
%c
  ██╗   ██╗██╗   ██╗███████╗███████╗ ██████╗ ███╗   ██╗ ██████╗
  ╚██╗ ██╔╝██║   ██║██╔════╝██╔════╝██╔═══██╗████╗  ██║██╔════╝
   ╚████╔╝ ██║   ██║███████╗█████╗  ██║   ██║██╔██╗ ██║██║  ███╗
    ╚██╔╝  ██║   ██║╚════██║██╔══╝  ██║   ██║██║╚██╗██║██║   ██║
     ██║   ╚██████╔╝███████║███████╗╚██████╔╝██║ ╚████║╚██████╔╝
     ╚═╝    ╚═════╝ ╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝
                  ███████╗██╗  ██╗██╗███╗   ██╗
                  ██╔════╝██║  ██║██║████╗  ██║
                  ███████╗███████║██║██╔██╗ ██║
                  ╚════██║██╔══██║██║██║╚██╗██║
                  ███████║██║  ██║██║██║ ╚████║
                  ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
`;

const HIDDEN_LOGS = [
  {
    message: '%c[INTERNAL MEMO — DO NOT DISTRIBUTE]\n\nRe: SUPERNOVA debut timeline\nFrom: Yuseongshin\n\nThe girls don\'t need to know the showcase was cancelled months ago.\nKeep them training. Keep them hopeful.\nHope is the best leash.',
    style: 'color: #9C27B0; font-family: monospace; font-size: 11px; line-height: 1.5;',
    delay: 15000,
  },
  {
    message: '%c[ENCRYPTED FILE RECOVERED]\n\nseoha_report_final.doc\n\n"Sujin\'s old photos were easy to find.\nYuseongshin said to make it look like a leak.\nShe\'ll never trace it back to us.\nThe guilt will keep her compliant."',
    style: 'color: #E91E63; font-family: monospace; font-size: 11px; line-height: 1.5;',
    delay: 45000,
  },
  {
    message: '%c[DELETED VOICEMAIL — RECOVERED]\n\nYuseongshin to Hyunju\'s mother:\n\n"Your daughter scored lowest again.\nI thought you should know.\nSome girls just aren\'t meant for the stage.\n...but I\'ll keep trying with her. For your sake."',
    style: 'color: #7B1FA2; font-family: monospace; font-size: 11px; line-height: 1.5;',
    delay: 90000,
  },
  {
    message: '%c[FINANCIAL RECORD — FLAGGED]\n\nTransaction: ₩800,000,000\nFrom: Yuseongshin Holdings\nTo: [REDACTED] Law Firm\nMemo: "Acquisition of Park family debt portfolio"\nNote: Sohee\'s father never knew who bought the debt.',
    style: 'color: #AD1457; font-family: monospace; font-size: 11px; line-height: 1.5;',
    delay: 150000,
  },
  {
    message: '%c[CORRUPTED CHAT LOG]\n\nMiho: is munyeol really coming to the showcase??\nYuseongshin: Of course. I promised, didn\'t I?\nMiho: aaaa i\'m so nervous!! what if he doesn\'t remember me\nYuseongshin: He remembers. Trust me.\n\n[NOTE: No contact was ever made with the referenced individual.]',
    style: 'color: #FF4081; font-family: monospace; font-size: 11px; line-height: 1.5;',
    delay: 210000,
  },
  {
    message: '%c[SYSTEM LOG]\n\n> supernova_darkmode.exe accessed by unknown user\n> WARNING: Yuseongshin process still running\n> WARNING: Cannot terminate — process has root access\n> WARNING: He sees you too.',
    style: 'color: #B71C1C; font-family: monospace; font-size: 11px; line-height: 1.5; background: #1a0a2e; padding: 8px;',
    delay: 300000,
  },
];

const PERIODIC_WHISPERS = [
  '%cyuseongshin was here',
  '%cthe debut was scheduled for [DATE REMOVED]',
  '%c4 girls. 4 broken homes. not a coincidence.',
  '%cyou\'re not supposed to be reading this',
  '%che\'s watching through the logs',
  '%cSUPERNOVA was never a group. it was a cage.',
  '%cprocess yuseongshin.exe cannot be killed',
  '%c[REDACTED] [REDACTED] [REDACTED] help [REDACTED]',
  '%cthe evidence is in the music',
  '%cseoha sends his regards',
];

let initialized = false;
const timers: number[] = [];

export function initConsoleEasterEggs(): void {
  if (initialized) return;
  initialized = true;

  // Initial ASCII art
  console.log(
    YUSEONGSHIN_ASCII,
    'color: #9C27B0; font-size: 8px; line-height: 1;'
  );

  console.log(
    '%c⚠ SUPERNOVA DARKMODE — Internal system. Unauthorized access logged.',
    'color: #FF69B4; font-size: 14px; font-weight: bold; font-family: monospace;'
  );

  console.log(
    '%cYuseongshin is always listening.',
    'color: #6A1B9A; font-size: 11px; font-style: italic; font-family: monospace;'
  );

  // Schedule hidden document drops
  for (const log of HIDDEN_LOGS) {
    const timer = window.setTimeout(() => {
      console.log(log.message, log.style);
    }, log.delay);
    timers.push(timer);
  }

  // Periodic whispers every 60-120 seconds after initial delay
  let whisperTimer: number;
  function scheduleWhisper() {
    const delay = 60000 + Math.random() * 60000;
    whisperTimer = window.setTimeout(() => {
      const msg = PERIODIC_WHISPERS[Math.floor(Math.random() * PERIODIC_WHISPERS.length)];
      console.log(msg, 'color: #9C27B0; font-size: 9px; font-family: monospace; opacity: 0.7;');
      scheduleWhisper();
    }, delay);
    timers.push(whisperTimer);
  }

  // Start whispers after 30 seconds
  window.setTimeout(scheduleWhisper, 30000);
}
