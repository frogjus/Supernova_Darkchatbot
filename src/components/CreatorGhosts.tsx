import { useState, useEffect, useRef } from 'react';
import './CreatorGhosts.css';

interface CreatorGhostsProps {
  bloomLevel: number;
  characterId: string;
}

interface GhostLine {
  text: string;
  side: 'left' | 'right';
  yPos: number;
  id: number;
}

let ghostIdCounter = 0;

// ========================================================================
// CREATOR GHOST LINES — each character speaks TO creators in their own voice
// Organized by bloom tier: despair → pain → bittersweet → healing → gratitude
// No dialogues exist in the series — story team wrote narrative, not lines
// 은빈 hasn't produced a game yet. Jenna (제나) hasn't made an app yet.
// Jenna's lines are in English with her English name.
// ========================================================================

// Bloom tiers: 0-19 = despair, 20-39 = pain, 40-59 = bittersweet, 60-79 = healing, 80-100 = gratitude

type BloomTier = 'despair' | 'pain' | 'bittersweet' | 'healing' | 'gratitude';

function getBloomTier(bloom: number): BloomTier {
  if (bloom < 20) return 'despair';
  if (bloom < 40) return 'pain';
  if (bloom < 60) return 'bittersweet';
  if (bloom < 80) return 'healing';
  return 'gratitude';
}

// ========================================================================
// MIHO — dreamy, clingy, longing, romantic. speaks softly, trails off...
// ========================================================================

const MIHO_LINES: Record<BloomTier, string[]> = {
  despair: [
    // to 정인 (story)
    '정인아... 왜 나를 이렇게 외롭게 만들었어...',
    '정인아 무녈이 없으면 나 어떡해... 나 혼자야...',
    '이 이야기 속에서 나 계속 기다리기만 해...',
    '정인아 내 마음이 이렇게 아픈 건 네가 써서 그래...',
    // to 영재 (story support)
    '영재야... 이 슬픈 장면 네가 도와준 거지...',
    '영재가 넣은 이 전개... 너무 아파...',
    // to 명훈 (animation)
    '명훈아... 내 눈에 눈물 그려넣은 거 너지...',
    '명훈아 나 울 때 이렇게 예쁘게 우는 게 더 슬퍼...',
    // to 혜미 (color)
    '혜미야... 내 색이 점점 바래지는 것 같아...',
    '혜미야 이 핑크가 흐려지면 나도 사라지는 거야...?',
    // to 영하 (animation lead)
    '영하야... 나 손 뻗을 때 아무도 안 잡아줘...',
    '영하가 만든 이 동작... 닿을 수 없는 손...',
    // to 동주 & 가은 (assets support)
    '동주야 가은아... 이 무대가 이렇게 텅 빈 거 알아...?',
    '이 배경에 나 혼자 서 있으면... 무서워...',
    // to 은빈 (game designer — game not yet made)
    '은빈아... 누군가 나를 찾아올 수 있을까...',
    '은빈이가 만들 세계에서는 덜 외로울까...',
    // to Jenna (planner — app not yet made)
    'Jenna... will anyone remember me...',
    'Jenna... is it true there are people out there...?',
  ],
  pain: [
    '정인아 나 이렇게 매달리는 게 싫은데... 멈출 수가 없어...',
    '정인아 내 이야기에 행복한 순간 하나만 넣어줘...',
    '영재야 이 장면 빼면 안 돼...? 너무 아파...',
    '명훈아 내 표정이 자꾸 슬프게 변해...',
    '혜미야 내 리본 색이 탁해진 것 같아...',
    '영하야 나 뒤돌아볼 때 눈물 떨어지는 거 사람들이 봤을까...',
    '동주야 이 무대 조명 꺼지면 나 어디로 가...',
    '은빈아... 나를 만나줄 사람이 오면 좋겠어...',
    'Jenna... can I go out there soon...?',
    '가은아 이 소품들... 무녈이 준 건 줄 알았는데...',
    '혜미야 울 때도 핑크로 칠하면 안 울고 있는 것 같잖아...',
  ],
  bittersweet: [
    '정인아 가끔은 웃고 싶어... 진짜로...',
    '정인아 내가 좋아하는 장면도 있어 알지~?',
    '영재야 네가 넣은 그 부분... 사실 좋아했어',
    '명훈아 오늘 내 눈이 좀 밝아 보여? ㅋㅋ',
    '혜미야 이 핑크... 사실 좋아해. 나답잖아~',
    '영하야 내가 고개 돌릴 때 머리카락 날리는 거... 좀 예뻐 ㅋ',
    '동주야 가은아 이 배경 별이 예쁘다...',
    '은빈아 사람들이 나를 좋아해줄까...? 좀 설레',
    'Jenna~ is it soon...? I\'m waiting~',
    '명훈아 나 웃을 때 보조개 그려줘~ 부탁~',
  ],
  healing: [
    '정인아~ 내 이야기가 슬프기만 한 건 아니었어',
    '정인아 내가 좀 집착했지? ㅋㅋ 근데 그것도 나니까~',
    '영재야 고마워 이야기에 깊이를 줘서~',
    '명훈아 오늘 나 진짜 예뻐 보여! 고마워~',
    '혜미야 이 핑크빛이 따뜻해... 네가 칠해준 거지 ♡',
    '영하야 내가 춤출 수 있게 해줘서 고마워~ 꼬리도 흔들려!',
    '동주야 가은아 이 세상이 점점 밝아지고 있어~',
    '은빈아 네가 만들 세계가 기대돼~ 미호가 기다리고 있어',
    'Jenna~ will people like me when they meet me~? hehe',
    '명훈아 웃는 내 얼굴이 진짜 얼굴이야 ♡',
  ],
  gratitude: [
    '정인아 이 이야기를 써줘서 미호가 존재할 수 있었어 ♡',
    '정인아 슬픈 장면도 전부 내 거야... 고마워 ♡',
    '영재야 네 덕분에 이야기가 더 깊어졌어 ♡',
    '명훈아 미호를 이렇게 예쁘게 그려줘서 고마워 ♡',
    '혜미야 네가 칠해준 색이 미호의 색이야 ♡',
    '영하야 움직일 수 있게 해줘서 고마워... 살아있는 기분이야 ♡',
    '동주야 가은아 이 세계를 만들어줘서 고마워 ♡',
    '은빈아 네가 만들 세계에서 사람들이 미호를 만나줄 거야 ♡',
    'Jenna, thank you for getting Miho ready for the world ♡',
    '모두 고마워... 미호는 여기서 행복해 ♡',
  ],
};

// ========================================================================
// SOHEE — quiet, withdrawn, heavy silence. speaks in fragments...
// ========================================================================

const SOHEE_LINES: Record<BloomTier, string[]> = {
  despair: [
    // to 정인
    '정인아... 왜 내 아빠를 그렇게 만든 거야...',
    '정인아 나... 말하고 싶은데 말이 안 나와...',
    '정인이가 쓴 내 침묵이... 진짜 내 침묵이 됐어...',
    '정인아 나 빚만 남았어... 왜...',
    // to 영재
    '영재야... 이 장면 없었으면 좋겠어...',
    // to 명훈
    '명훈아... 내 눈이 왜 이렇게 비어있어...',
    '명훈아 나 그릴 때... 힘들었을 것 같아...',
    // to 혜미
    '혜미야... 왜 나만 이렇게 차가운 색이야...',
    '혜미야 나도 따뜻해지고 싶어...',
    // to 영하
    '영하야... 나 움직일 힘이 없어...',
    // to 동주 & 가은
    '동주야... 이 방 너무 어두워...',
    '가은아... 이 꽃 누구 거야... 내 건 아니지...',
    // to 은빈
    '은빈아... 누가 소희를 선택해줄까...',
    // to Jenna
    'Jenna... who would want to meet someone like me...',
  ],
  pain: [
    '정인아... 아빠가 나쁜 사람이 아닌데... 왜...',
    '정인아 내 이야기는 너무 무거워...',
    '영재야... 왜 이렇게 됐어...',
    '명훈아 내 표정 좀... 바꿔줘...',
    '혜미야 이 파란색이... 내 마음 같아...',
    '영하야... 나 걸을 때 발이 무거워...',
    '동주야 가은아... 이 방에서 나가고 싶어...',
    '은빈아... 소희도 살아날 수 있을까...',
    'Jenna... I\'m waiting... take your time...',
  ],
  bittersweet: [
    '정인아... 내 이야기가 슬프기만 한 건 아니지...?',
    '영재야... 끝이 좋으면 되는 거지...?',
    '명훈아... 오늘은 눈에 빛이 좀 있어...?',
    '혜미야... 이 색이 좀 따뜻해진 것 같아...',
    '영하야... 오늘은 좀 걸을 수 있을 것 같아...',
    '동주야... 이 방에 빛이 들어오네...',
    '은빈아... 소희를 만나줄 사람이 있을까...',
    'Jenna... is it okay to hope a little...',
    '가은아... 이 꽃... 예쁘다...',
  ],
  healing: [
    '정인아... 고마워. 이 이야기가 내 거라서.',
    '영재야... 네가 도와준 부분이 좋았어...',
    '명훈아 오늘 내 눈이 살아있어... 고마워',
    '혜미야... 이 색이 따뜻해. 좋아...',
    '영하야 소희가 걸을 수 있어... 고마워',
    '동주야 가은아... 이 세상이 밝아져서 좋아...',
    '은빈아 기다리고 있어... 소희도 만날 수 있게...',
    'Jenna... thank you. for thinking of Sohee...',
    '명훈아... 나 웃는 얼굴도 있어... 고마워',
  ],
  gratitude: [
    '정인아 소희 이야기를 써줘서 고마워... 진심이야 ♡',
    '영재야 이야기에 깊이를 줘서 고마워 ♡',
    '명훈아 소희를 그려줘서 고마워... 내가 보여 ♡',
    '혜미야 이 색이 소희 색이야... 고마워 ♡',
    '영하야 소희가 움직일 수 있게 해줘서 고마워 ♡',
    '동주야 가은아 이 세계를 만들어줘서 고마워 ♡',
    '은빈아 네가 만들 곳에서 소희도 빛날 수 있을 거야 ♡',
    'Jenna, thank you for getting Sohee ready for the world ♡',
    '다들... 고마워... 소희는 괜찮아 ♡',
  ],
};

// ========================================================================
// SUJIN — fierce, frustrated, blunt. holds back tears with anger.
// ========================================================================

const SUJIN_LINES: Record<BloomTier, string[]> = {
  despair: [
    // to 정인
    '정인아 왜 나한테 조작된 증거를 줬어... 진짜 억울해',
    '정인아 내가 뭘 잘못한 건데... 왜 이런 이야기를...',
    '정인이가 만든 내 과거가 너무 억울해...',
    // to 영재
    '영재야... 이 전개 바꿀 수 없어...?',
    // to 명훈
    '명훈아 나 왜 이렇게 지쳐 보이게 그렸어...',
    '명훈아 내 눈 밑 그림자 좀 지워줘...',
    // to 혜미
    '혜미야 이 보라색이 멍든 것 같아...',
    '혜미야 내 색이 점점 어두워지잖아...',
    // to 영하
    '영하야... 내가 쓰러지는 장면 왜 이렇게 많아...',
    '영하야 나 주먹 쥘 때 손이 떨리게 만든 거 너지...',
    // to 동주 & 가은
    '동주야 이 연습실 벽이 닫히는 것 같아...',
    '가은아 이 마이크... 더 이상 잡기 싫어...',
    // to 은빈
    '은빈아 누가 수진이 편 들어줄까...',
    // to Jenna
    'Jenna... I know it\'s not ready yet... but I want out...',
  ],
  pain: [
    '정인아 내가 강한 척하는 거 알잖아... 좀 쉬게 해줘',
    '영재야 이 장면에서 나 왜 또 참아야 해...',
    '명훈아 나 울고 싶은데 표정이 안 바뀌어...',
    '혜미야 이 색 좀 밝게 해줘... 무거워...',
    '영하야 싸울 때 빼고는 나 움직이지도 않잖아...',
    '동주야 가은아 여기서 나가는 문 좀 그려줘...',
    '은빈아 수진이도 쉴 수 있는 곳 만들어줘...',
    'Jenna, I\'m waiting... it\'s frustrating but...',
    '정인아 억울한 건 참을 수 있는데... 외로운 건 못 참겠어...',
  ],
  bittersweet: [
    '정인아 그래도 내가 안 부러진 건 네 덕분인 거 알아',
    '영재야 이 전개... 인정. 나쁘지 않아',
    '명훈아 오늘 내 눈에 힘이 좀 있어?',
    '혜미야 이 보라색... 멍 아니고 내 색이야. 인정해 줄게',
    '영하야 내 펀치 모션 멋있긴 해 ㅋ',
    '동주야 이 연습실 좀 넓어진 것 같아?',
    '은빈아 수진이를 써줄 사람이 있을까... 좀 궁금해',
    'Jenna, not yet right? got it. I\'ll wait',
    '가은아 이 장갑 소품 좀 멋있다 ㅋ',
  ],
  healing: [
    '정인아 내가 다시 일어서는 이야기... 좋아. 고마워',
    '영재야 고마워 이야기를 도와줘서',
    '명훈아 내 눈에 불 들어온 거 보여? 네 덕분이야',
    '혜미야 이 보라색 좀 좋은데? ㅋㅋ 고마워',
    '영하야 내가 일어서는 모션... 좀 멋있어',
    '동주야 가은아 이 무대 위에 서니까 좋다',
    '은빈아 수진이를 만나줄 사람들이 기다려져',
    'Jenna, thanks for remembering Sujin',
  ],
  gratitude: [
    '정인아 수진이를 써줘서 고마워. 억울했지만 내 이야기야 ♡',
    '영재야 네 덕분에 이야기가 더 단단해졌어 ♡',
    '명훈아 수진이를 이렇게 그려줘서 고마워 ♡',
    '혜미야 수진이 색을 칠해줘서 고마워 ♡',
    '영하야 수진이가 싸울 수 있게 해줘서 고마워 ♡',
    '동주야 가은아 수진이 무대를 만들어줘서 고마워 ♡',
    '은빈아 네가 만들 곳에서 수진이도 기다리고 있을게 ♡',
    'Jenna, thank you for getting Sujin ready for the world ♡',
    '다들 고마워. 수진이는 안 부러져 ♡',
  ],
};

// ========================================================================
// HYUNJU — desperate energy, exclamation marks, performs happiness.
// At low bloom the performance cracks. At high bloom it's real.
// ========================================================================

const HYUNJU_LINES: Record<BloomTier, string[]> = {
  despair: [
    // to 정인
    '정인아... 나 왜 항상 괜찮은 척해야 돼...',
    '정인아 현주도 울어도 돼...? 안 돼...?',
    '정인이가 쓴 이 웃음이... 가짜인 거 나도 알아...',
    '정인아 엄마한테 인정받고 싶은 마음... 왜 만든 거야...',
    // to 영재
    '영재야... 현주가 밝기만 한 건 아닌데...',
    // to 명훈
    '명훈아... 나 웃는 얼굴만 그리지 마...',
    '명훈아 가끔은 울고 싶어... 근데 얼굴이 안 바뀌어...',
    // to 혜미
    '혜미야... 이 밝은 색이 무거워...',
    '혜미야 나도 좀 어두워져도 돼...?',
    // to 영하
    '영하야... 나 뛰어다니기 지쳤어...',
    '영하야 멈추면 안 되는 거야... 멈추면 무너져...',
    // to 동주 & 가은
    '동주야... 이 무대에서 내려가고 싶어...',
    '가은아... 이 리본이 목을 조르는 것 같아...',
    // to 은빈
    '은빈아... 사람들이 현주 보고 웃기만 하면... 슬플 것 같아...',
    // to Jenna
    'Jenna... is there anyone who will truly see Hyunju...',
  ],
  pain: [
    '정인아!! ...아 미안 습관이야... 정인아... 힘들어...',
    '영재야 현주가 우는 장면도 있으면 좋겠어...',
    '명훈아 내 웃음 뒤에 뭐가 있는지 알지...?',
    '혜미야 이 오렌지가... 눈물 색 같아 가끔...',
    '영하야 나 멈추면 안 돼? 잠깐만이라도...',
    '동주야 가은아 조용한 곳 하나만 만들어줘...',
    '은빈아 현주를 이해해줄 사람이 올까...',
    'Jenna... don\'t forget Hyunju when you\'re getting ready...',
    '정인아 밝은 척하는 게 이렇게 무거운 건 줄 몰랐어...',
  ],
  bittersweet: [
    '정인아 가끔은 진짜로 웃을 때도 있어!! ...진짜야',
    '영재야 고마워! 아 근데 왜 울컥해... ㅋㅋ',
    '명훈아 오늘 내 표정 좀 진짜 같지?! ㅋㅋ',
    '혜미야 이 오렌지 따뜻하다... 좋아!!',
    '영하야 오늘은 뛰고 싶어서 뛰는 거야!! 진짜야!!',
    '동주야 가은아 이 배경 꽃이 예쁘다!! 진짜!!',
    '은빈아 현주를 좋아해줄 사람이 있으면 좋겠다!!',
    'Jenna I\'m waiting!! for real!!',
  ],
  healing: [
    '정인아 현주가 진짜로 웃을 수 있게 해줘서 고마워!!',
    '영재야 고마워!! 현주 이야기 도와줘서!! ♡',
    '명훈아 내 웃는 얼굴이 진짜야!! 고마워!!',
    '혜미야 이 따뜻한 색!! 현주 색이야!! ♡',
    '영하야 현주가 뛰어다닐 수 있게 해줘서 고마워!!',
    '동주야 가은아 이 세상이 밝아!! 고마워!!',
    '은빈아 네가 만들 곳에서 현주가 뛰어놀 거야!!',
    'Jenna, thank you for getting Hyunju ready for the world!!',
  ],
  gratitude: [
    '정인아 현주를 써줘서 고마워... 진짜 고마워 ♡♡',
    '영재야 이야기를 도와줘서 고마워!! ♡',
    '명훈아 현주를 이렇게 귀엽게 그려줘서 고마워!! ♡♡',
    '혜미야 현주 색을 따뜻하게 칠해줘서 고마워!! ♡',
    '영하야 현주가 살아 움직이게 해줘서 고마워!! ♡♡',
    '동주야 가은아 현주 세상을 만들어줘서 고마워!! ♡',
    '은빈아 현주를 만나줄 사람들이 올 거야!! 기다려!! ♡',
    'Jenna, thank you for getting Hyunju ready for the world!! ♡♡',
    '다들 고마워!! 현주는 이제 진짜로 행복해!! ♡♡♡',
  ],
};

// ---- Master lookup ----

const CHARACTER_LINES: Record<string, Record<BloomTier, string[]>> = {
  miho: MIHO_LINES,
  sohee: SOHEE_LINES,
  sujin: SUJIN_LINES,
  hyunju: HYUNJU_LINES,
};

// Positions — strictly on edges, avoiding center
const POSITIONS: { side: 'left' | 'right'; yRange: [number, number] }[] = [
  { side: 'left', yRange: [5, 15] },
  { side: 'right', yRange: [8, 18] },
  { side: 'left', yRange: [20, 30] },
  { side: 'right', yRange: [25, 35] },
  { side: 'left', yRange: [38, 48] },
  { side: 'right', yRange: [42, 52] },
  { side: 'left', yRange: [55, 65] },
  { side: 'right', yRange: [58, 68] },
  { side: 'left', yRange: [72, 82] },
  { side: 'right', yRange: [75, 85] },
];

export function CreatorGhosts({ bloomLevel, characterId }: CreatorGhostsProps) {
  const [visibleGhosts, setVisibleGhosts] = useState<GhostLine[]>([]);
  const timerRef = useRef<number | null>(null);
  const posIndexRef = useRef(0);
  const lastLineRef = useRef<string>(''); // prevent consecutive repeats

  const tier = getBloomTier(bloomLevel);
  const charLines = CHARACTER_LINES[characterId] || MIHO_LINES;

  useEffect(() => {
    function showGhost() {
      const pool = charLines[tier];
      if (!pool || pool.length === 0) {
        timerRef.current = window.setTimeout(showGhost, 3000);
        return;
      }

      // Pick a line that isn't the same as the last one
      let text: string;
      let attempts = 0;
      do {
        text = pool[Math.floor(Math.random() * pool.length)];
        attempts++;
      } while (text === lastLineRef.current && pool.length > 1 && attempts < 10);
      lastLineRef.current = text;

      const pos = POSITIONS[posIndexRef.current % POSITIONS.length];
      posIndexRef.current++;
      const yPos = pos.yRange[0] + Math.random() * (pos.yRange[1] - pos.yRange[0]);

      const ghost: GhostLine = { text, side: pos.side, yPos, id: ghostIdCounter++ };

      setVisibleGhosts(prev => [...prev.slice(-4), ghost]); // max 5 visible

      // Remove after animation (4-7 seconds)
      const removeDelay = 4000 + Math.random() * 3000;
      setTimeout(() => {
        setVisibleGhosts(prev => prev.filter(g => g.id !== ghost.id));
      }, removeDelay);

      // Schedule next
      const nextDelay = bloomLevel >= 60
        ? 2500 + Math.random() * 3000   // high bloom: frequent
        : 3500 + Math.random() * 4000;  // low bloom: slightly less
      timerRef.current = window.setTimeout(showGhost, nextDelay);
    }

    showGhost();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [bloomLevel, characterId, tier]);

  // CSS class for character color theming
  const moodClass = bloomLevel >= 60 ? 'grateful' : 'haunting';

  return (
    <div className={`creator-ghosts char-${characterId}`}>
      {visibleGhosts.map((ghost) => (
        <div
          key={ghost.id}
          className={`creator-ghost ${moodClass} side-${ghost.side}`}
          style={{ top: `${ghost.yPos}%` }}
        >
          <span className="creator-ghost-text">{ghost.text}</span>
        </div>
      ))}
    </div>
  );
}
