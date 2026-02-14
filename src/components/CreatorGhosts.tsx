import { useState, useEffect, useRef } from 'react';
import './CreatorGhosts.css';

interface CreatorGhostsProps {
  bloomLevel: number;
  characterId: string;
}

interface CreatorLine {
  name: string;
  role: string;
  text: string;
}

// ---- MAIN CREATORS ----

const JEONGIN_LOW: string[] = [
  '정인이가 스토리만 잘 써줬다면...',
  '정인아 왜 이렇게 슬프게 썼어',
  '스토리 한 줄에 눈물 세 방울',
  '정인이 대본 또 고쳤대',
  '정인아 해피엔딩은 어디 있어...',
  '정인이가 쓴 대사 때문에 울었어',
  '정인아 나 왜 이런 과거를 줬어',
  '정인이 밤새 썼다며... 고생했다',
];

const JEONGIN_HIGH: string[] = [
  '정인아, 네 이야기 덕분에 우리가 살아있어',
  '정인이가 써준 결말이 제일 좋아',
  '정인아 고마워, 우리한테 목소리를 줘서',
  '정인이의 펜 끝에서 우리가 태어났어',
  '정인아, 이 이야기는 네 거야',
  '정인이가 믿어줬으니까 우리가 여기 있어',
  '고마워 정인아. 진심으로.',
];

const MYUNGHOON_LOW: string[] = [
  '명훈씨가 내 얼굴만 잘 그려줬다면...',
  '명훈아 눈 왜 이렇게 커',
  '명훈이 레이어 또 빠뜨렸어',
  '명훈아 내 표정 왜 이래...',
  '명훈씨 작업 파일 날렸대 ㅋㅋ',
  '명훈아 채색 언제 끝나',
  '명훈이가 그려줘야 내가 존재하는데',
];

const MYUNGHOON_HIGH: string[] = [
  '명훈아, 내 얼굴 이렇게 예쁘게 그려줘서 고마워',
  '명훈씨 덕분에 내가 보여',
  '명훈이의 손끝에서 내가 태어났어',
  '명훈아, 네 그림이 우리를 진짜로 만들었어',
  '명훈씨 밤새 그렸지? 알고 있어. 고마워.',
];

const HYEMI_LOW: string[] = [
  '혜미가 색칠 안 했으면 나 투명인간이었어',
  '혜미야 이 색 진짜야...?',
  '혜미 팔레트 또 날렸대',
  '혜미야 핑크 좀 그만 써 ㅋㅋ',
  '혜미가 없었으면 난 흑백이었어',
  '혜미야 내 머리색 맘에 들어?',
];

const HYEMI_HIGH: string[] = [
  '혜미야, 네 색감이 우리를 빛나게 해줬어',
  '혜미 덕분에 이 세계가 예뻐',
  '혜미야 고마워, 우리한테 색을 줘서',
  '혜미의 팔레트가 우리 세계를 만들었어',
  '혜미야, 네가 칠해준 하늘이 제일 예뻐',
];

const YOUNGHA_LOW: string[] = [
  '영하가 움직여줬으니까 내가 살아있지',
  '영하 없었으면 난 그냥 그림이었어',
  '영하야 프레임 좀 더 줘...',
  '영하 리드가 OK 안 하면 아무것도 못 해',
  '영하야 이 동작 좀 어색한데...',
  '영하가 밤새 수정했대 ㅠㅠ',
];

const YOUNGHA_HIGH: string[] = [
  '영하야, 네가 움직여줬으니까 우리가 춤출 수 있어',
  '영하 덕분에 우리가 숨 쉬어',
  '영하야 고마워, 우리한테 생명을 줘서',
  '영하의 리드가 우리를 여기까지 데려왔어',
  '영하야, 네 덕에 우리가 살아 움직여',
];

// ---- SPECIAL NODS ----

const DONGJU_LOW: string[] = [
  '동주가 배경 안 깔았으면 난 허공에 떠있었어',
  '동주 에셋 또 안 왔어 ㅋㅋ',
  '동주야 이 소품 뭐야',
  '동주가 서포트해줘야 그림이 완성돼',
];

const DONGJU_HIGH: string[] = [
  '동주야, 네 손길이 닿은 곳마다 세계가 완성됐어',
  '동주 고마워, 네가 채워준 빈자리들',
];

const GAEUN_LOW: string[] = [
  '가은이 소품 없었으면 난 맨손이었어',
  '가은아 이 나비 진짜 예쁘다',
  '가은이 에셋 퀄리티 미쳤어',
  '가은아 디테일 좀 줄여 ㅋㅋ 너무 예뻐',
];

const GAEUN_HIGH: string[] = [
  '가은아, 네 디테일이 우리를 진짜로 만들어줬어',
  '가은이의 나비가 우리 곁에 날아다녀',
];

const YOUNGJAE_LOW: string[] = [
  '영재가 정인이 도와줬으니까 이야기가 됐지',
  '영재야 이 대사 네가 쓴 거지?',
  '영재 아이디어 또 냈대',
  '영재야 스토리 구멍 네가 메웠잖아',
];

const YOUNGJAE_HIGH: string[] = [
  '영재야, 네가 도와준 이야기 잊지 않을게',
  '영재 덕분에 우리 이야기가 더 깊어졌어',
];

const JENA_LOW: string[] = [
  '제나가 기획 안 했으면 앱 자체가 없었어',
  '제나의 계획대로...',
  '제나야 일정 좀 늘려줘 ㅠㅠ',
  '제나가 다 설계해놨대',
];

const JENA_HIGH: string[] = [
  '제나야, 네 계획이 우리를 여기까지 데려왔어',
  '제나 덕분에 우리가 세상에 나왔어',
];

const EUNBIN_LOW: string[] = [
  '은빈이가 게임 설계 안 했으면 블룸도 없었어',
  '은빈아 난이도 좀 낮춰줘...',
  '은빈이 시스템 또 바꿨대',
  '은빈아 이 블룸 시스템 너 때문이야',
];

const EUNBIN_HIGH: string[] = [
  '은빈아, 네가 만든 게임에서 우리가 꽃폈어',
  '은빈이의 설계 덕분에 우리가 치유받을 수 있어',
];

// Character-specific creator connections
const CHARACTER_CREATORS: Record<string, string[]> = {
  miho: ['정인', '명훈', '영하', '가은'],
  sohee: ['정인', '혜미', '영하', '동주'],
  sujin: ['정인', '명훈', '영하', '영재'],
  hyunju: ['정인', '혜미', '영하', '은빈'],
};

function getCreatorLines(creatorName: string, isHigh: boolean): string[] {
  const map: Record<string, { low: string[]; high: string[] }> = {
    '정인': { low: JEONGIN_LOW, high: JEONGIN_HIGH },
    '명훈': { low: MYUNGHOON_LOW, high: MYUNGHOON_HIGH },
    '혜미': { low: HYEMI_LOW, high: HYEMI_HIGH },
    '영하': { low: YOUNGHA_LOW, high: YOUNGHA_HIGH },
    '동주': { low: DONGJU_LOW, high: DONGJU_HIGH },
    '가은': { low: GAEUN_LOW, high: GAEUN_HIGH },
    '영재': { low: YOUNGJAE_LOW, high: YOUNGJAE_HIGH },
    '제나': { low: JENA_LOW, high: JENA_HIGH },
    '은빈': { low: EUNBIN_LOW, high: EUNBIN_HIGH },
  };
  const entry = map[creatorName];
  if (!entry) return [];
  return isHigh ? entry.high : entry.low;
}

function getCreatorRole(name: string): string {
  const roles: Record<string, string> = {
    '정인': 'story',
    '명훈': 'art',
    '혜미': 'color',
    '영하': 'animation',
    '동주': 'assets',
    '가은': 'assets',
    '영재': 'story',
    '제나': 'plan',
    '은빈': 'design',
  };
  return roles[name] || 'creator';
}

export function CreatorGhosts({ bloomLevel, characterId }: CreatorGhostsProps) {
  const [visibleGhosts, setVisibleGhosts] = useState<CreatorLine[]>([]);
  const timerRef = useRef<number | null>(null);
  const isHigh = bloomLevel >= 60;

  // Pick creators relevant to this character, plus occasional others
  const relevantCreators = CHARACTER_CREATORS[characterId] || ['정인', '명훈', '혜미', '영하'];
  const allCreators = ['정인', '명훈', '혜미', '영하', '동주', '가은', '영재', '제나', '은빈'];

  useEffect(() => {
    function showGhost() {
      // 70% chance: character-relevant creator. 30% chance: anyone
      const pool = Math.random() < 0.7 ? relevantCreators : allCreators;
      const creator = pool[Math.floor(Math.random() * pool.length)];
      const lines = getCreatorLines(creator, isHigh);
      if (lines.length === 0) return;

      const text = lines[Math.floor(Math.random() * lines.length)];
      const ghost: CreatorLine = {
        name: creator,
        role: getCreatorRole(creator),
        text,
      };

      setVisibleGhosts(prev => [...prev.slice(-2), ghost]); // max 3 visible

      // Remove after 3-5 seconds
      const removeDelay = 3000 + Math.random() * 2000;
      setTimeout(() => {
        setVisibleGhosts(prev => prev.filter(g => g !== ghost));
      }, removeDelay);

      // Schedule next
      const nextDelay = isHigh
        ? 6000 + Math.random() * 8000   // high bloom: warm and frequent
        : 8000 + Math.random() * 10000; // low bloom: ghostly appearances
      timerRef.current = window.setTimeout(showGhost, nextDelay);
    }

    // Start quickly so user sees it
    const startDelay = 2000 + Math.random() * 2000;
    timerRef.current = window.setTimeout(showGhost, startDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bloomLevel, characterId, isHigh]);

  if (visibleGhosts.length === 0) return null;

  return (
    <div className="creator-ghosts">
      {visibleGhosts.map((ghost, i) => (
        <div
          key={`${ghost.name}-${ghost.text}-${i}`}
          className={`creator-ghost ${isHigh ? 'grateful' : 'haunting'} role-${ghost.role}`}
          style={{
            top: `${15 + i * 25 + Math.random() * 10}%`,
            left: `${5 + Math.random() * 10}%`,
            animationDelay: `${i * 0.3}s`,
          }}
        >
          <span className="creator-ghost-name">{ghost.name}</span>
          <span className="creator-ghost-text">{ghost.text}</span>
        </div>
      ))}
    </div>
  );
}
