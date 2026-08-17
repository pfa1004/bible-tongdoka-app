// Vite dynamic raw import for real-time HMR when editing .md files in '성경 서론' folder
const introFiles = import.meta.glob('../../성경 서론/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const NAME_TO_ID: Record<string, string> = {
  '창세기': 'gen',
  '출애굽기': 'exo',
  '레위기': 'lev',
  '민수기': 'num',
  '신명기': 'deu',
  '여호수아기': 'jos',
  '여호수아': 'jos',
  '사사기': 'jdg',
  '룻기': 'rut',
  '사무엘상하': '1sa',
  '사무엘상': '1sa',
  '사무엘하': '2sa',
  '열왕기상하': '1ki',
  '열왕기상': '1ki',
  '열왕기하': '2ki',
  '역대상': '1ch',
  '역대하': '2ch',
  '에스라기': 'ezr',
  '에스라': 'ezr',
  '느헤미야기': 'neh',
  '느헤미야': 'neh',
  '에스더기': 'est',
  '에스더': 'est',
  '욥기': 'job',
  '시편': 'psa',
  '잠언': 'pro',
  '전도서': 'ecc',
  '아가': 'sng',
  '이사야서': 'isa',
  '이사야': 'isa',
  '예레미야서': 'jer',
  '예레미야': 'jer',
  '예레미야애가': 'lam',
  '에스겔서': 'ezk',
  '에스겔': 'ezk',
  '다니엘서': 'dan',
  '다니엘': 'dan',
  '호세아서': 'hos',
  '호세아': 'hos',
  '요엘서': 'jol',
  '요엘': 'jol',
  '아모스서': 'amo',
  '아모스': 'amo',
  '오바댜서': 'oba',
  '오바댜': 'oba',
  '요나서': 'jon',
  '요나': 'jon',
  '미가서': 'mic',
  '미가': 'mic',
  '나훔서': 'nam',
  '나훔': 'nam',
  '하박국서': 'hab',
  '하박국': 'hab',
  '스바냐서': 'zep',
  '스바냐': 'zep',
  '학개서': 'hag',
  '학개': 'hag',
  '스가랴서': 'zec',
  '스가랴': 'zec',
  '말라기서': 'mal',
  '말라기': 'mal',
  '마태복음': 'mat',
  '마가복음': 'mrk',
  '누가복음': 'luk',
  '요한복음': 'jhn',
  '사도행전': 'act',
  '로마서': 'rom',
  '고린도전서': '1co',
  '고린도후서': '2co',
  '갈라디아서': 'gal',
  '에베소서': 'eph',
  '빌립보서': 'php',
  '골로새서': 'col',
  '데살로니가전서': '1th',
  '데살로니가후서': '2th',
  '디모데전서': '1ti',
  '디모데후서': '2ti',
  '디도서': 'tit',
  '빌레몬서': 'phm',
  '히브리서': 'heb',
  '야고보서': 'jas',
  '베드로전서': '1pe',
  '베드로후서': '2pe',
  '요한1서': '1jn',
  '요한2서': '2jn',
  '요한3서': '3jn',
  '유다서': 'jud',
  '요한계시록': 'rev',
};

// Build Map dynamically from loaded markdown files
export const BOOK_DETAILED_INTROS: Record<string, string> = {};

for (const [filePath, content] of Object.entries(introFiles)) {
  const filename = filePath.split('/').pop() || '';
  if (filename.includes('연대순')) continue;
  const prefix = filename.split('_')[0];
  const bookId = NAME_TO_ID[prefix];
  if (bookId) {
    BOOK_DETAILED_INTROS[bookId] = content.trim();
  }
}

// Fallback for Nehemiah if missing
if (!BOOK_DETAILED_INTROS['neh']) {
  BOOK_DETAILED_INTROS['neh'] = `# 느헤미야기 해설 및 개관

## 한눈에 보는 핵심 요약
- **저자 및 집필 배경**: 느헤미야 (B.C. 430경). 페르시아 수산궁의 술 관원이었던 느헤미야가 예루살렘 성벽 파괴 소식을 듣고 3차 포로 귀환을 이끌어 52일 만에 성벽을 완공함
- **주요 내용**: 
  - 방해와 위협 속에서의 예루살렘 성벽 재건 (1~6장)
  - 에스라 학사와 함께한 수문 앞 광장 율법 낭독 및 영적 대부흥 (8~10장)
  - 거주자 배치 및 성벽 봉헌식, 언약 갱신 (11~13장)
- **신학적 메시지**: 기도의 사람 느헤미야의 신앙 지도력, 성벽 재건과 거룩한 백성으로서의 정체성 회복, 말씀 중심의 신앙 부흥

---

## 본문 요약

### 예루살렘 성벽 재건과 느헤미야의 기도
페르시아 아닥사스다 왕의 술 관원이었던 느헤미야는 예루살렘 성벽이 훼파되고 성문들이 불탔다는 소식을 듣고 금식하며 하나님께 부르짖어 기도합니다. 왕의 허락을 받아 예루살렘 총독으로 부임한 느헤미야는 산발랏과 도비야 등 이방 민족들의 집요한 방해와 모함 속에서도 한 손에는 병기를 잡고 한 손으로 일하며 52일 만에 성벽 재건을 기적적으로 완료합니다.

### 율법 낭독과 영적 공동체 회복
성벽 재건 후, 느헤미야는 학사 에스라를 청하여 수문 앞 광장에서 온 백성에게 하나님의 율법책을 읽어 들려줍니다. 백성들은 말씀을 듣고 통곡하며 회개하였고, 초막절을 지키며 하나님 앞에서 거룩한 언약을 갱신합니다. 느헤미야기는 단순한 건축 공사를 넘어 하나님의 백성다운 영적·도덕적 성결을 회복하는 위대한 신앙 개혁의 역사를 보여줍니다.`;
}
