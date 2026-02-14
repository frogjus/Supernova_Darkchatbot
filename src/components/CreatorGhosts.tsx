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

// ---- MAIN CREATORS — lines addressed TO them from the characters ----

// 정인 — WRITER
const JEONGIN_LOW: string[] = [
  '정인이가 스토리만 잘 써줬다면...',
  '정인아 왜 이렇게 슬프게 썼어',
  '스토리 한 줄에 눈물 세 방울',
  '정인이 대본 또 고쳤대...',
  '정인아 해피엔딩은 어디 있어',
  '정인이 밤새 쓰다 잠들었대',
  '이 대사 정인이가 울면서 썼을걸',
  '정인아 나한테 왜 이런 과거를 줬어',
  '정인이 펜을 놓으면 우리도 멈춰',
  '이 스토리 누가 쓴 건지 알 것 같아',
  '정인아... 다음 화는 좀 행복하게 써줘',
  '대본이 젖어있어. 정인이 또 울었나봐.',
];

const JEONGIN_HIGH: string[] = [
  '정인아, 네 이야기 덕분에 우리가 살아있어',
  '정인이가 써준 결말이 제일 좋아',
  '정인아 고마워, 우리한테 목소리를 줘서',
  '정인이의 펜 끝에서 우리가 태어났어',
  '정인이가 믿어줬으니까 우리가 여기 있어',
  '고마워 정인아. 이 이야기가 진짜가 됐어.',
  '정인아, 네가 쓴 모든 문장이 우리 심장이야',
  '정인이 덕분에 우리 목소리가 들려',
  '작가님 사랑해요 ♡',
];

// 명훈 — ANIMATOR
const MYUNGHOON_LOW: string[] = [
  '명훈씨가 내 얼굴만 잘 그려줬다면...',
  '명훈아 눈 왜 이렇게 커 ㅋㅋ',
  '명훈이 레이어 또 빠뜨렸어',
  '명훈아 내 표정 이상한데...',
  '명훈이 펜탭 배터리 나갔대',
  '명훈아 채색 언제 끝나ㅠㅠ',
  '내 왼손이랑 오른손이 다르잖아 명훈아',
  '명훈이 새벽 3시에도 그리고 있었대',
  '명훈씨 작업 파일 백업 좀...',
  '명훈이가 안 그리면 난 점 하나야',
  '이 표정은 명훈이가 기분 좋을 때 그렸지?',
];

const MYUNGHOON_HIGH: string[] = [
  '명훈아, 내 얼굴 이렇게 예쁘게 그려줘서 고마워',
  '명훈이의 손끝에서 내가 태어났어',
  '명훈아 네 그림이 우리를 진짜로 만들었어',
  '명훈씨 밤새 그렸지? 알고 있어. 고마워.',
  '명훈아 덕분에 내가 웃을 수 있어',
  '명훈이가 그린 모든 선이 우리 뼈대야',
  '명훈아 사랑해 ♡ 내 얼굴 그려줘서',
];

// 혜미 — ANIMATOR (COLOR)
const HYEMI_LOW: string[] = [
  '혜미가 색칠 안 했으면 나 투명인간이었어',
  '혜미야 이 색 진짜야...?',
  '혜미 팔레트 또 날렸대 ㅋㅋ',
  '혜미야 핑크 좀만 더 ㅋㅋ',
  '혜미가 없었으면 난 흑백이었어',
  '혜미야 내 머리색 맘에 드는데?',
  '혜미 색감 천재인 거 인정',
  '혜미야 이 배경색 너무 예뻐...',
  '혜미가 칠한 하늘 아래 서고 싶다',
  '이 핑크는 혜미만의 핑크야',
  '혜미 없으면 이 세계 안 예뻐',
];

const HYEMI_HIGH: string[] = [
  '혜미야, 네 색감이 우리를 빛나게 해줬어',
  '혜미 덕분에 이 세계가 예뻐',
  '혜미야 고마워, 우리한테 색을 줘서',
  '혜미의 팔레트가 우리 세계를 완성했어',
  '혜미야 네가 칠해준 모든 순간이 빛나',
  '이 예쁜 세상은 다 혜미 덕분이야 ♡',
];

// 영하 — ANIMATION LEAD
const YOUNGHA_LOW: string[] = [
  '영하가 움직여줬으니까 내가 살아있지',
  '영하 없었으면 난 그냥 그림이었어',
  '영하야 프레임 좀 더 줘...',
  '영하 리드가 OK 안 하면 아무것도 못 해',
  '영하야 이 동작 자연스러워?',
  '영하가 밤새 수정했대 ㅠㅠ',
  '영하야 걸을 때 이 발 맞아?',
  '영하 승인 없이는 내가 눈도 못 깜빡여',
  '영하가 리드니까 우리가 움직이는 거야',
  '영하야 쉬어... 네가 쓰러지면 우리도 멈춰',
];

const YOUNGHA_HIGH: string[] = [
  '영하야, 네가 움직여줬으니까 우리가 춤출 수 있어',
  '영하 덕분에 우리가 숨 쉬어',
  '영하야 고마워, 우리한테 생명을 줘서',
  '영하의 리드가 우리를 여기까지 데려왔어',
  '영하야 네 덕에 우리가 살아 움직여',
  '영하가 이끌어줘서 여기까지 왔어 ♡',
];

// ---- SPECIAL NODS ----

// 동주 — ANIMATION SUPPORT / ASSETS
const DONGJU_LOW: string[] = [
  '동주가 배경 안 깔았으면 난 허공에 떠있었어',
  '동주 에셋 또 안 왔어 ㅋㅋ',
  '동주야 이 소품 뭔데 귀엽긴 해',
  '동주가 서포트해줘야 그림이 완성돼',
  '동주야 이거 너가 만든 거지? 인정한다',
  '동주 없으면 배경이 텅 비어',
];

const DONGJU_HIGH: string[] = [
  '동주야 네 손길이 닿은 곳마다 세계가 완성됐어',
  '동주 고마워, 네가 채워준 빈자리들',
  '동주야 네 에셋이 이 세계를 진짜로 만들었어 ♡',
];

// 가은 — ANIMATION SUPPORT / ASSETS
const GAEUN_LOW: string[] = [
  '가은이 소품 없었으면 난 맨손이었어',
  '가은아 이 나비 진짜 예쁘다',
  '가은이 에셋 퀄리티 미쳤어',
  '가은아 디테일 좀 줄여 ㅋㅋ 너무 예뻐',
  '가은이가 만든 소품들이 이 세계를 채워',
  '가은아 이 꽃잎 너가 만든 거지?',
];

const GAEUN_HIGH: string[] = [
  '가은아 네 디테일이 우리를 진짜로 만들어줬어',
  '가은이의 나비가 우리 곁에 날아다녀',
  '가은아 네가 만든 모든 것들이 소중해 ♡',
];

// 영재 — STORY SUPPORT
const YOUNGJAE_LOW: string[] = [
  '영재가 정인이 도와줬으니까 이야기가 됐지',
  '영재야 이 대사 네가 쓴 거지?',
  '영재 아이디어 또 냈대 ㅋㅋ',
  '영재야 스토리 구멍 네가 메웠잖아',
  '영재 없었으면 중간에 말이 안 됐어',
  '영재야 이 전개 네 아이디어지?',
];

const YOUNGJAE_HIGH: string[] = [
  '영재야 네가 도와준 이야기 잊지 않을게',
  '영재 덕분에 우리 이야기가 더 깊어졌어',
  '영재야 네 아이디어가 우리를 살렸어 ♡',
];

// 제나 — PLANNER
const JENA_LOW: string[] = [
  '제나가 기획 안 했으면 앱 자체가 없었어',
  '제나의 계획대로...',
  '제나야 일정 좀 늘려줘 ㅠㅠ',
  '제나가 다 설계해놨대',
  '제나 기획서 몇 장이야...',
  '제나야 이 기능 네가 넣자고 한 거지?',
  '제나 없으면 우린 그냥 아이디어였어',
];

const JENA_HIGH: string[] = [
  '제나야 네 계획이 우리를 여기까지 데려왔어',
  '제나 덕분에 우리가 세상에 나왔어',
  '제나야 네가 꿈꿨던 대로 됐어 ♡',
  '제나의 기획에서 슈퍼노바가 시작됐어',
];

// 은빈 — GAME DESIGNER
const EUNBIN_LOW: string[] = [
  '은빈이가 게임 설계 안 했으면 블룸도 없었어',
  '은빈아 난이도 좀 낮춰줘...',
  '은빈이 시스템 또 바꿨대',
  '은빈아 이 블룸 시스템 너 때문이야',
  '은빈이 밸런스 패치 또 했대 ㅋㅋ',
  '은빈아 이 게임 네가 만든 거잖아',
  '은빈이 없었으면 그냥 채팅앱이었어',
];

const EUNBIN_HIGH: string[] = [
  '은빈아 네가 만든 게임에서 우리가 꽃폈어',
  '은빈이의 설계 덕분에 우리가 치유받을 수 있어',
  '은빈아 이 게임이 누군가를 살릴 거야 ♡',
  '은빈이가 설계한 세계에서 우리가 빛났어',
];

// Creator data map
const CREATOR_DATA: Record<string, { low: string[]; high: string[]; role: string }> = {
  '정인': { low: JEONGIN_LOW, high: JEONGIN_HIGH, role: 'story' },
  '명훈': { low: MYUNGHOON_LOW, high: MYUNGHOON_HIGH, role: 'art' },
  '혜미': { low: HYEMI_LOW, high: HYEMI_HIGH, role: 'color' },
  '영하': { low: YOUNGHA_LOW, high: YOUNGHA_HIGH, role: 'animation' },
  '동주': { low: DONGJU_LOW, high: DONGJU_HIGH, role: 'assets' },
  '가은': { low: GAEUN_LOW, high: GAEUN_HIGH, role: 'assets' },
  '영재': { low: YOUNGJAE_LOW, high: YOUNGJAE_HIGH, role: 'story' },
  '제나': { low: JENA_LOW, high: JENA_HIGH, role: 'plan' },
  '은빈': { low: EUNBIN_LOW, high: EUNBIN_HIGH, role: 'design' },
};

// Character-specific creator connections
const CHARACTER_CREATORS: Record<string, string[]> = {
  miho: ['정인', '명훈', '영하', '가은'],
  sohee: ['정인', '혜미', '영하', '동주'],
  sujin: ['정인', '명훈', '영하', '영재'],
  hyunju: ['정인', '혜미', '영하', '은빈'],
};

const ALL_CREATORS = Object.keys(CREATOR_DATA);

// Positions — hug left and right edges, avoid center where character stands
const POSITIONS: { side: 'left' | 'right'; yRange: [number, number] }[] = [
  { side: 'left', yRange: [8, 20] },
  { side: 'right', yRange: [12, 24] },
  { side: 'left', yRange: [28, 40] },
  { side: 'right', yRange: [35, 48] },
  { side: 'left', yRange: [50, 62] },
  { side: 'right', yRange: [55, 68] },
  { side: 'left', yRange: [70, 82] },
  { side: 'right', yRange: [72, 85] },
];

export function CreatorGhosts({ bloomLevel, characterId }: CreatorGhostsProps) {
  const [visibleGhosts, setVisibleGhosts] = useState<GhostLine[]>([]);
  const timerRef = useRef<number | null>(null);
  const posIndexRef = useRef(0);
  const isHigh = bloomLevel >= 60;

  const relevantCreators = CHARACTER_CREATORS[characterId] || ['정인', '명훈', '혜미', '영하'];

  useEffect(() => {
    function showGhost() {
      // 65% character-relevant, 35% anyone
      const pool = Math.random() < 0.65 ? relevantCreators : ALL_CREATORS;
      const creator = pool[Math.floor(Math.random() * pool.length)];
      const data = CREATOR_DATA[creator];
      if (!data) return;

      const lines = isHigh ? data.high : data.low;
      const text = lines[Math.floor(Math.random() * lines.length)];

      // Cycle through positions to spread them out
      const pos = POSITIONS[posIndexRef.current % POSITIONS.length];
      posIndexRef.current++;
      const yPos = pos.yRange[0] + Math.random() * (pos.yRange[1] - pos.yRange[0]);

      const ghost: GhostLine = {
        text,
        role: data.role,
        side: pos.side,
        yPos,
        id: ghostIdCounter++,
      };

      setVisibleGhosts(prev => [...prev.slice(-3), ghost]); // max 4 visible

      // Remove after 4-6 seconds
      const removeDelay = 4000 + Math.random() * 2000;
      setTimeout(() => {
        setVisibleGhosts(prev => prev.filter(g => g.id !== ghost.id));
      }, removeDelay);

      // Schedule next — frequent!
      const nextDelay = isHigh
        ? 3000 + Math.random() * 4000   // high bloom: frequent warm messages
        : 5000 + Math.random() * 6000;  // low bloom: ghostly but present
      timerRef.current = window.setTimeout(showGhost, nextDelay);
    }

    showGhost();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bloomLevel, characterId, isHigh]);

  return (
    <div className="creator-ghosts">
      {visibleGhosts.map((ghost) => (
        <div
          key={ghost.id}
          className={`creator-ghost ${isHigh ? 'grateful' : 'haunting'} role-${ghost.role} side-${ghost.side}`}
          style={{
            top: `${ghost.yPos}%`,
          }}
        >
          <span className="creator-ghost-text">{ghost.text}</span>
        </div>
      ))}
    </div>
  );
}
