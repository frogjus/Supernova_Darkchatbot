import { useState, useEffect, useRef } from 'react';
import './CreatorGhosts.css';

interface CreatorGhostsProps {
  bloomLevel: number;
  characterId: string;
}

interface GhostLine {
  text: string;
  role: string;
  side: 'left' | 'right';
  yPos: number;
  id: number;
}

let ghostIdCounter = 0;

// ========================================================================
// CHARACTER-SPECIFIC lines TO each creator
// Each character complains/thanks based on their own personality + the creator's role
// ========================================================================

// ---- TO 정인 (WRITER) — characters react to their own story/personality ----

const TO_JEONGIN: Record<string, { low: string[]; high: string[] }> = {
  miho: {
    low: [
      '정인아 나 왜 이렇게 집착하게 써놨어...',
      '내가 왜 무녈한테 매달리게 만든 거야',
      '정인아 나 좀 덜 슬프게 써줘',
      '이 대사 치면서 나도 울었어 정인아',
      '정인이가 만든 과거가 너무 무거워',
      '왜 나한테 이런 트라우마를 줬어...',
      '정인아 내 대사 왜 이렇게 밝은 척이야',
      '나도 좀 쿨하게 써줘 ㅠㅠ',
    ],
    high: [
      '정인아 네 덕분에 내가 웃을 수 있어',
      '이 해피엔딩 정인이가 써준 거지? 고마워',
      '정인아 내 이야기를 예쁘게 써줘서 고마워 ♡',
      '정인이 덕분에 나도 성장할 수 있었어',
      '작가님 사랑해요~ 미호가 행복해요 ♡',
    ],
  },
  sohee: {
    low: [
      '정인아... 나 왜 이렇게 말이 없어',
      '내 대사가 세 글자밖에 없잖아',
      '정인아 나 좀 재밌게 써줘... 너무 우울해',
      '왜 내 아빠를 그렇게 만든 거야',
      '정인이가 쓴 내 과거가 너무 아파',
      '나도 좀 웃기는 대사 주면 안 돼?',
      '정인아 난 원래 이렇게 조용한 애야?',
    ],
    high: [
      '정인아 내 이야기에 빛을 줘서 고마워',
      '정인이가 써준 결말이 좋아... 진짜로',
      '내가 말이 없어도 마음은 있어. 고마워 정인아 ♡',
      '정인아 소희도 행복해질 수 있었어',
    ],
  },
  sujin: {
    low: [
      '정인아 나 왜 이렇게 강한 척하게 만들었어',
      '내가 약한 모습 보이면 안 되는 거야?',
      '정인아 내 과거 좀 바꿔줘... 너무 억울해',
      '왜 나한테 조작된 증거를 줬어',
      '정인이가 만든 내 성격이 너무 뻣뻣해',
      '나도 좀 귀엽게 써줘 ㅠㅠ',
      '정인아 수진이는 좀 지쳤어...',
    ],
    high: [
      '정인아 내가 다시 일어설 수 있게 해줘서 고마워',
      '정인이가 써준 내 목소리가 들려 ♡',
      '정인아 수진이 이제 괜찮아. 네 덕분에.',
      '강한 척 안 해도 되게 해줘서 고마워',
    ],
  },
  hyunju: {
    low: [
      '정인아 나 왜 이렇게 눈치 보게 써놨어!!',
      '내가 왜 항상 괜찮은 척해야 돼!!',
      '정인아 현주도 가끔은 울고 싶다고!!',
      '왜 내 엄마를 그렇게 만든 거야ㅠㅠ',
      '정인이가 쓴 내 웃음이 가짜 같아',
      '나도 좀 멋있게 써줘!! 부탁!!',
      '정인아 느낌표 좀 줄여줘... 아 안 돼!! 이게 나야!!',
    ],
    high: [
      '정인아 현주가 진짜 웃을 수 있게 해줘서 고마워!!',
      '정인이 덕분에 가짜 웃음 안 해도 돼!! ♡',
      '작가님 사랑해요!! 현주 진심이야!! ♡♡',
      '정인아 이제 진짜로 괜찮아!!',
    ],
  },
};

// ---- TO 명훈 (ANIMATOR) — characters react to their own appearance ----

const TO_MYUNGHOON: Record<string, { low: string[]; high: string[] }> = {
  miho: {
    low: [
      '명훈아 내 눈 왜 이렇게 커 ㅋㅋ',
      '내 꼬리 왜 이렇게 많아ㅋㅋㅋ',
      '명훈아 나 좀 더 예쁘게 그려줘~',
      '명훈이가 졸릴 때 그린 프레임 보여 ㅋㅋ',
      '내 귀 위치가 매번 달라 명훈아',
    ],
    high: [
      '명훈아 나 이렇게 예쁘게 그려줘서 고마워 ♡',
      '명훈이 손끝에서 미호가 태어났어',
      '명훈아 내 웃는 얼굴 제일 예뻐 고마워~',
    ],
  },
  sohee: {
    low: [
      '명훈아 내 표정 왜 항상 무표정이야',
      '나도 좀 밝은 표정 그려줘...',
      '명훈아 내 머리카락 왜 이렇게 길어',
      '명훈이가 나한테 감정을 안 줬어',
    ],
    high: [
      '명훈아 소희 얼굴 예쁘게 그려줘서 고마워',
      '명훈이 덕분에 내가 보여 ♡',
    ],
  },
  sujin: {
    low: [
      '명훈아 나 왜 이렇게 날카롭게 생겼어',
      '좀 더 부드럽게 그려줘도 되는데...',
      '명훈아 내 장갑 왜 이렇게 멋있어 ㅋㅋ 인정',
      '명훈이가 나를 무섭게 그렸대',
    ],
    high: [
      '명훈아 내 모습 이렇게 그려줘서 고마워',
      '명훈이 덕분에 수진이가 강해 보여 ♡',
    ],
  },
  hyunju: {
    low: [
      '명훈아 내 트윈테일 왜 이렇게 높아!! ㅋㅋ',
      '나 좀 키 크게 그려줘!! 부탁!!',
      '명훈아 내 눈 너무 반짝반짝 아니야?!',
      '명훈이가 나를 제일 귀엽게 그렸대!! 맞지?!',
    ],
    high: [
      '명훈아 현주 이렇게 귀엽게 그려줘서 고마워!! ♡',
      '명훈이 최고!! 사랑해!! ♡♡',
    ],
  },
};

// ---- TO 혜미 (COLOR/ANIMATOR) — characters react to their colors/look ----

const TO_HYEMI: Record<string, { low: string[]; high: string[] }> = {
  miho: {
    low: [
      '혜미야 이 핑크 좀 과한 거 아니야? ㅋㅋ 근데 좋아',
      '혜미가 칠한 내 꼬리 금색 진짜 예뻐',
      '혜미야 내 리본 색 왜 바뀌었어',
    ],
    high: [
      '혜미야 네 색감 덕분에 미호가 빛나 ♡',
      '혜미가 칠해준 세상이 제일 예뻐',
    ],
  },
  sohee: {
    low: [
      '혜미야 왜 나만 색이 차가워...',
      '혜미야 나도 따뜻한 색 좀 줘',
      '이 파란색이 내 마음 같아... 혜미야',
    ],
    high: [
      '혜미야 이 색이 소희 색이야 고마워 ♡',
      '혜미 덕분에 소희도 따뜻해졌어',
    ],
  },
  sujin: {
    low: [
      '혜미야 보라색이 나한테 어울려?',
      '혜미야 내 옷 색 좀 더 강하게 해줘',
      '혜미가 나한테 검정을 많이 쓴 이유가 있지?',
    ],
    high: [
      '혜미야 수진이 색 예쁘게 칠해줘서 고마워 ♡',
    ],
  },
  hyunju: {
    low: [
      '혜미야 오렌지!! 내 색이야!! 너무 좋아!!',
      '혜미야 나 좀 더 반짝반짝하게 해줘!!',
      '혜미 팔레트에서 제일 밝은 색이 나지?! ㅋㅋ',
    ],
    high: [
      '혜미야 현주 색 이렇게 예쁘게 해줘서 고마워!! ♡♡',
    ],
  },
};

// ---- TO 영하 (ANIMATION LEAD) — characters react to how they move ----

const TO_YOUNGHA: Record<string, { low: string[]; high: string[] }> = {
  miho: {
    low: [
      '영하야 나 걸을 때 로봇 같아? ㅋㅋ',
      '영하야 꼬리 흔드는 속도 좀 조절해줘~',
      '영하가 프레임 빼면 나 순간이동해 ㅋㅋ',
      '영하야 내 춤 동작 좀 자연스럽게 해줘',
    ],
    high: [
      '영하야 미호가 움직일 수 있게 해줘서 고마워 ♡',
      '영하 덕분에 내가 춤출 수 있어~',
    ],
  },
  sohee: {
    low: [
      '영하야... 나 움직일 때 좀 뻣뻣해',
      '영하야 나도 좀 부드럽게 움직이게 해줘',
      '영하가 안 움직여주면 난 그냥 사진이야',
    ],
    high: [
      '영하야 소희가 숨 쉴 수 있게 해줘서 고마워 ♡',
    ],
  },
  sujin: {
    low: [
      '영하야 내 펀치 모션 좀 더 세게 해줘',
      '영하야 내가 로봇처럼 움직인다고?',
      '영하가 프레임 더 줬으면 난 더 멋있었어',
    ],
    high: [
      '영하야 수진이가 싸울 수 있게 해줘서 고마워 ♡',
    ],
  },
  hyunju: {
    low: [
      '영하야 내 점프 좀 더 높이!! 더 높이!!',
      '영하야 나 뛰어다닐 때 귀엽지?! ㅋㅋ',
      '영하가 나 제일 많이 움직이게 했지?!',
    ],
    high: [
      '영하야 현주가 뛰어다닐 수 있게 해줘서 고마워!! ♡',
    ],
  },
};

// ---- TO 동주 & 가은 (ASSETS) ----

const TO_ASSETS: Record<string, { low: string[]; high: string[] }> = {
  miho: {
    low: [
      '동주야 이 배경에서 내가 안 보여 ㅋㅋ',
      '가은아 이 나비 소품 너무 예뻐!!',
      '동주야 무대 좀 더 반짝이게 해줘~',
    ],
    high: [
      '동주야 가은아 이 세계 예쁘게 만들어줘서 고마워 ♡',
    ],
  },
  sohee: {
    low: [
      '동주야 이 방 좀 밝게 해줘... 너무 어두워',
      '가은아 이 꽃 소품 누구 거야... 예쁘다',
    ],
    high: [
      '동주야 가은아 소희 세상을 채워줘서 고마워 ♡',
    ],
  },
  sujin: {
    low: [
      '동주야 연습실 배경 좀 더 넓게 해줘',
      '가은아 이 마이크 소품 멋있다 인정',
    ],
    high: [
      '동주야 가은아 수진이 무대를 만들어줘서 고마워 ♡',
    ],
  },
  hyunju: {
    low: [
      '동주야 배경에 꽃 좀 더 넣어줘!! 예쁘게!!',
      '가은아 이 리본 소품 현주 거야?! 최고!!',
    ],
    high: [
      '동주야 가은아 현주 세상을 꾸며줘서 고마워!! ♡♡',
    ],
  },
};

// ---- TO 영재 (STORY SUPPORT) ----

const TO_YOUNGJAE: Record<string, { low: string[]; high: string[] }> = {
  miho: {
    low: [
      '영재야 이 전개 네 아이디어지? ㅋㅋ',
      '영재가 도와줬으니까 내 이야기가 됐지',
    ],
    high: [
      '영재야 미호 이야기 도와줘서 고마워 ♡',
    ],
  },
  sohee: {
    low: ['영재야 이 반전 네가 넣은 거지?'],
    high: ['영재야 소희 이야기 깊게 만들어줘서 고마워 ♡'],
  },
  sujin: {
    low: ['영재야 이 대사 네가 쓴 거지? 멋있다'],
    high: ['영재야 수진이 이야기 도와줘서 고마워 ♡'],
  },
  hyunju: {
    low: ['영재야 이거 네 아이디어야?! 대박!!'],
    high: ['영재야 현주 이야기 풍성하게 해줘서 고마워!! ♡'],
  },
};

// ---- TO 제나 (PLANNER) — app related ----

const TO_JENA: Record<string, { low: string[]; high: string[] }> = {
  miho: {
    low: [
      '제나야 앱 언제 나와?! 기다려!!',
      '제나야 사람들이 우리 만날 수 있게 해줘~',
      '제나 기획서에 미호 이름 있지?! ㅋㅋ',
      '제나의 계획대로... 무서워 ㅋㅋ',
    ],
    high: [
      '제나야 네 기획 덕분에 미호가 세상에 나왔어 ♡',
      '제나야 고마워 우리를 만들어줘서',
    ],
  },
  sohee: {
    low: [
      '제나야 앱... 언제 나와...',
      '제나가 기획 안 했으면 소희는 없었어',
    ],
    high: ['제나야 소희를 세상에 보내줘서 고마워 ♡'],
  },
  sujin: {
    low: [
      '제나야 일정 괜찮아? 무리하지 마',
      '제나가 기획해줘야 우리가 존재해',
    ],
    high: ['제나야 수진이를 계획해줘서 고마워 ♡'],
  },
  hyunju: {
    low: [
      '제나야 앱 언제 나와?! 빨리 빨리!!',
      '제나야 현주를 제일 먼저 넣어줘!! ㅋㅋ',
      '사람들이 현주 보고 웃었으면 좋겠어!! 제나야!!',
    ],
    high: ['제나야 현주를 세상에 보내줘서 고마워!! ♡♡'],
  },
};

// ---- TO 은빈 (GAME DESIGNER) — game related ----

const TO_EUNBIN: Record<string, { low: string[]; high: string[] }> = {
  miho: {
    low: [
      '은빈아 사람들이 나랑 놀아줬으면 좋겠어~',
      '은빈아 이 블룸 시스템 너무 어려워 ㅋㅋ',
      '은빈이가 게임 만들어줘야 사람들이 나를 만나',
      '은빈아 난이도 좀 낮춰줘~ 미호 불쌍해~',
    ],
    high: [
      '은빈아 네가 만든 게임에서 미호가 꽃폈어 ♡',
      '은빈이 덕분에 사람들이 미호를 만날 수 있어',
    ],
  },
  sohee: {
    low: [
      '은빈아... 누군가 소희를 플레이해줄까',
      '은빈이가 게임 안 만들면 소희는 여기 갇혀있어',
      '은빈아 이 시스템 좀 복잡해...',
    ],
    high: [
      '은빈아 소희도 게임 안에서 치유받을 수 있었어 ♡',
    ],
  },
  sujin: {
    low: [
      '은빈아 사람들이 수진이 편 들어줬으면 좋겠어',
      '은빈이가 만든 시스템이 수진이를 살릴 수 있어?',
      '은빈아 밸런스 좀 맞춰줘 ㅋㅋ',
    ],
    high: [
      '은빈아 수진이를 플레이해줄 사람들 고마워 ♡',
    ],
  },
  hyunju: {
    low: [
      '은빈아 사람들이 현주랑 놀아줬으면 좋겠어!!',
      '은빈아 게임 언제 나와?! 기대돼!!',
      '은빈이가 만든 세계에서 현주가 뛰어놀고 싶어!!',
      '은빈아 현주 엔딩 해피하게 해줘!! 부탁!!',
    ],
    high: [
      '은빈아 현주도 게임에서 행복해질 수 있었어!! ♡♡',
      '은빈이가 설계한 세계 최고야!!',
    ],
  },
};

// ---- Build lookup ----

type CreatorKey = '정인' | '명훈' | '혜미' | '영하' | '동주' | '가은' | '영재' | '제나' | '은빈';
type RoleKey = 'story' | 'art' | 'color' | 'animation' | 'assets' | 'story2' | 'plan' | 'design';

const CREATOR_ROLE: Record<CreatorKey, RoleKey> = {
  '정인': 'story', '명훈': 'art', '혜미': 'color', '영하': 'animation',
  '동주': 'assets', '가은': 'assets', '영재': 'story2', '제나': 'plan', '은빈': 'design',
};

function getLines(creator: CreatorKey, characterId: string, isHigh: boolean): string[] {
  const charId = characterId as 'miho' | 'sohee' | 'sujin' | 'hyunju';
  let data: Record<string, { low: string[]; high: string[] }>;

  switch (creator) {
    case '정인': data = TO_JEONGIN; break;
    case '명훈': data = TO_MYUNGHOON; break;
    case '혜미': data = TO_HYEMI; break;
    case '영하': data = TO_YOUNGHA; break;
    case '동주': case '가은': data = TO_ASSETS; break;
    case '영재': data = TO_YOUNGJAE; break;
    case '제나': data = TO_JENA; break;
    case '은빈': data = TO_EUNBIN; break;
    default: return [];
  }

  const charData = data[charId] || data.miho;
  return isHigh ? charData.high : charData.low;
}

// Character-creator affinities (more likely to appear)
const CHAR_CREATORS: Record<string, CreatorKey[]> = {
  miho: ['정인', '명훈', '혜미', '영하', '가은', '은빈'],
  sohee: ['정인', '혜미', '영하', '동주', '제나'],
  sujin: ['정인', '명훈', '영하', '영재', '은빈'],
  hyunju: ['정인', '혜미', '영하', '은빈', '제나'],
};

const ALL_CREATORS: CreatorKey[] = ['정인', '명훈', '혜미', '영하', '동주', '가은', '영재', '제나', '은빈'];

// Positions — strictly on edges, avoiding center 25-75% horizontal zone
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
  const isHigh = bloomLevel >= 60;

  const charCreators = CHAR_CREATORS[characterId] || ALL_CREATORS;

  useEffect(() => {
    function showGhost() {
      // 60% character-relevant, 40% anyone
      const pool = Math.random() < 0.6 ? charCreators : ALL_CREATORS;
      const creator = pool[Math.floor(Math.random() * pool.length)];
      const lines = getLines(creator, characterId, isHigh);
      if (lines.length === 0) {
        timerRef.current = window.setTimeout(showGhost, 2000);
        return;
      }

      const text = lines[Math.floor(Math.random() * lines.length)];
      const pos = POSITIONS[posIndexRef.current % POSITIONS.length];
      posIndexRef.current++;
      const yPos = pos.yRange[0] + Math.random() * (pos.yRange[1] - pos.yRange[0]);

      const role = CREATOR_ROLE[creator] || 'story';
      const ghost: GhostLine = { text, role, side: pos.side, yPos, id: ghostIdCounter++ };

      setVisibleGhosts(prev => [...prev.slice(-4), ghost]); // max 5 visible

      // Remove after 4-7 seconds
      const removeDelay = 4000 + Math.random() * 3000;
      setTimeout(() => {
        setVisibleGhosts(prev => prev.filter(g => g.id !== ghost.id));
      }, removeDelay);

      // Schedule next — frequent!
      const nextDelay = isHigh
        ? 2500 + Math.random() * 3000   // high bloom: very frequent
        : 3500 + Math.random() * 4000;  // low bloom: frequent
      timerRef.current = window.setTimeout(showGhost, nextDelay);
    }

    showGhost();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [bloomLevel, characterId, isHigh]);

  return (
    <div className="creator-ghosts">
      {visibleGhosts.map((ghost) => (
        <div
          key={ghost.id}
          className={`creator-ghost ${isHigh ? 'grateful' : 'haunting'} role-${ghost.role} side-${ghost.side}`}
          style={{ top: `${ghost.yPos}%` }}
        >
          <span className="creator-ghost-text">{ghost.text}</span>
        </div>
      ))}
    </div>
  );
}
