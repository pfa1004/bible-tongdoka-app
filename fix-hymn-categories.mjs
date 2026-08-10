/**
 * 새찬송가 공식 분류체계(세밀 버전)에 따라 hymnData.ts의 category를 일괄 수정
 */

import fs from 'fs';

function getOfficialCategory(num) {
  if (num >= 1   && num <= 7)   return '송영';
  if (num >= 8   && num <= 17)  return '경배';
  if (num >= 18  && num <= 41)  return '찬양';
  if (num >= 42  && num <= 48)  return '주일';
  if (num >= 49  && num <= 52)  return '봉헌';
  if (num >= 53  && num <= 57)  return '예배마침';
  if (num >= 58  && num <= 62)  return '아침과저녁';
  if (num >= 63  && num <= 77)  return '창조주';
  if (num >= 78  && num <= 79)  return '섭리';
  if (num >= 80  && num <= 96)  return '예수그리스도';
  if (num >= 97  && num <= 105) return '구주강림';
  if (num >= 106 && num <= 129) return '성탄';
  if (num >= 130 && num <= 133) return '주현';
  if (num >= 134 && num <= 138) return '생애';
  if (num >= 139 && num <= 142) return '종려주일';
  if (num >= 143 && num <= 158) return '고난';
  if (num >= 159 && num <= 173) return '부활';
  if (num >= 174 && num <= 181) return '재림';
  if (num >= 182 && num <= 195) return '성령강림';
  if (num >= 196 && num <= 197) return '은사';
  if (num >= 198 && num <= 206) return '성경';
  if (num >= 207 && num <= 210) return '하나님나라';
  if (num >= 211 && num <= 218) return '헌신과봉사';
  if (num >= 219 && num <= 223) return '성도의교제';
  if (num >= 224 && num <= 226) return '세례(침례)';
  if (num >= 227 && num <= 233) return '성찬';
  if (num >= 234 && num <= 249) return '천국';
  if (num >= 250 && num <= 282) return '회개와용서';
  if (num >= 283 && num <= 285) return '거듭남';
  if (num >= 286 && num <= 289) return '거룩한생활';
  if (num >= 290 && num <= 310) return '은혜와사랑';
  if (num >= 311 && num <= 335) return '소명과충성';
  if (num >= 336 && num <= 345) return '시련과극복';
  if (num >= 346 && num <= 360) return '분투와승리';
  if (num >= 361 && num <= 369) return '기도와간구';
  if (num >= 370 && num <= 403) return '인도와보호';
  if (num >= 404 && num <= 419) return '평안과위로';
  if (num >= 420 && num <= 426) return '성결한생활';
  if (num >= 427 && num <= 429) return '감사의생활';
  if (num >= 430 && num <= 447) return '주와동행';
  if (num >= 448 && num <= 469) return '제자의도리';
  if (num >= 470 && num <= 474) return '신유의권능';
  if (num === 475)               return '화해와평화';
  if (num >= 476 && num <= 478) return '자연과환경';
  if (num >= 479 && num <= 494) return '미래와소망';
  if (num >= 495 && num <= 501) return '전도';
  if (num >= 502 && num <= 512) return '세계선교';
  if (num >= 513 && num <= 518) return '전도와교훈';
  if (num >= 519 && num <= 539) return '부르심과영접';
  if (num >= 540 && num <= 549) return '믿음과확신';
  if (num >= 550 && num <= 554) return '새해(송구영신)';
  if (num >= 555 && num <= 559) return '가정';
  if (num >= 560 && num <= 570) return '어린이';
  if (num >= 571 && num <= 575) return '젊은이';
  if (num >= 576 && num <= 579) return '어버이';
  if (num >= 580 && num <= 584) return '나라사랑';
  if (num >= 585 && num <= 586) return '종교개혁기념일';
  if (num >= 587 && num <= 594) return '감사절';
  if (num >= 595 && num <= 597) return '임직';
  if (num >= 598 && num <= 600) return '헌당';
  if (num >= 601 && num <= 605) return '혼례';
  if (num >= 606 && num <= 610) return '침례';
  if (num >= 611 && num <= 613) return '추모';
  if (num >= 614 && num <= 624) return '경배와찬양';
  if (num >= 625 && num <= 629) return '입례송';
  if (num >= 630 && num <= 632) return '기도송';
  if (num >= 633 && num <= 634) return '헌금응답송';
  if (num >= 635 && num <= 636) return '주기도송';
  if (num === 637)               return '말씀응답송';
  if (num >= 638 && num <= 639) return '축도송';
  if (num >= 640 && num <= 645) return '아멘송';
  return '기타';
}

const filePath = 'src/data/hymnData.ts';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

let updatedCount = 0;
let unchangedCount = 0;
let currentHymnNum = null;

const numLinePattern = /^  (\d+): \{/;
const categoryLinePattern = /^    "category": "([^"]+)"/;

const newLines = lines.map((line) => {
  const numMatch = line.match(numLinePattern);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    currentHymnNum = (num >= 1 && num <= 645) ? num : null;
    return line;
  }

  if (currentHymnNum !== null) {
    const catMatch = line.match(categoryLinePattern);
    if (catMatch) {
      const oldCategory = catMatch[1];
      const newCategory = getOfficialCategory(currentHymnNum);
      currentHymnNum = null;

      if (oldCategory !== newCategory) {
        updatedCount++;
        return line.replace(`"category": "${oldCategory}"`, `"category": "${newCategory}"`);
      } else {
        unchangedCount++;
        return line;
      }
    }
  }

  return line;
});

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');

console.log('✅ 카테고리 수정 완료!');
console.log(`  - 수정된 항목: ${updatedCount}개`);
console.log(`  - 이미 올바른 항목: ${unchangedCount}개`);
console.log(`  - 총 처리: ${updatedCount + unchangedCount}개`);
console.log('');
console.log('📋 주요 검증:');
const checks = [
  1, 7, 8, 17, 18, 41, 42, 48, 49, 52, 53, 57,
  58, 62, 63, 77, 78, 79, 80, 96,
  97, 105, 106, 129, 130, 133, 134, 138, 139, 142,
  143, 158, 159, 173, 174, 181, 182, 195,
  196, 197, 198, 206, 207, 210, 211, 218, 219, 223,
  224, 226, 227, 233, 234, 249, 250, 282, 283, 285,
  286, 289, 290, 310, 311, 335, 336, 345, 346, 360,
  361, 369, 370, 403, 404, 419, 420, 426, 427, 429,
  430, 447, 448, 469, 470, 474, 475, 476, 478, 479, 494,
  495, 501, 502, 504, 512, 513, 518, 519, 539, 540, 549,
  550, 554, 555, 559, 560, 570, 571, 575, 576, 579,
  580, 584, 585, 586, 587, 594, 595, 597, 598, 600,
  601, 605, 606, 610, 611, 613, 614, 624,
  625, 629, 630, 632, 633, 634, 635, 636, 637, 638, 639, 640, 645
];
checks.forEach(n => console.log(`  ${n}장 → ${getOfficialCategory(n)}`));
