import koreanDictionary from '@/lib/koreanDictionary';

export function extractLetters(paragraph) {
  const lettersWithMeta = [];
  let sourceIndex = 0;
  for (let i = 0; i < paragraph.length; i++) {
    const char = paragraph[i];
    if (/[가-힣]/.test(char)) { // 한글인 경우에만 추출
      lettersWithMeta.push({ 
        char: char, 
        originalIndex: i, // 원래 문장 전체에서의 인덱스
        fromOriginal: true // 이 함수는 원본 문장에서만 추출하므로 항상 true
      });
    }
  }
  return lettersWithMeta;
}

function countLetters(lettersWithMeta) {
  const count = {};
  for (const item of lettersWithMeta) {
    const char = typeof item === 'string' ? item : item.char;
    count[char] = (count[char] || 0) + 1;
  }
  return count;
}

function canFormWord(word, letterCount) {
  // console.log(`[korean-utils] canFormWord called. Word: "${word}", letterCount:`, JSON.stringify(letterCount)); // 주석 처리
  const wordLetters = word.split('');
  const wordCount = countLetters(wordLetters);
  // console.log(`[korean-utils] canFormWord - wordCount for "${word}":`, JSON.stringify(wordCount)); // 주석 처리
  for (const letter in wordCount) {
    if (!letterCount[letter] || letterCount[letter] < wordCount[letter]) {
      // console.log(`[korean-utils] canFormWord - Condition failed for letter "${letter}" in word "${word}". Available: ${letterCount[letter]}, Needed: ${wordCount[letter]}`); // 주석 처리
      return false;
    }
  }
  // console.log(`[korean-utils] canFormWord - Successfully can form word "${word}"`); // 주석 처리
  return true;
}

export function findPossibleWords(lettersWithMeta) {
  // console.log('[korean-utils] findPossibleWords called. lettersWithMeta:', JSON.stringify(lettersWithMeta)); // 주석 처리
  // console.log('[korean-utils] findPossibleWords - koreanDictionary (at start):', JSON.stringify(Object.keys(koreanDictionary).slice(0, 5))); // 주석 처리

  const result = [];
  const availableLettersCount = countLetters(lettersWithMeta);
  // console.log('[korean-utils] findPossibleWords - availableLettersCount:', JSON.stringify(availableLettersCount)); // 주석 처리
  
  let checkedWords = 0;
  // console.log('[korean-utils] findPossibleWords - koreanDictionary (before loop):', JSON.stringify(Object.keys(koreanDictionary).slice(0, 5))); // 주석 처리
  // if (Object.keys(koreanDictionary).length === 0) {
    // console.warn('[korean-utils] findPossibleWords - koreanDictionary is EMPTY before loop!'); // 주석 처리
  // }

  for (const word in koreanDictionary) {
    checkedWords++;
    if (word.length < 2) continue; 
    if (canFormWord(word, availableLettersCount)) {
      result.push({
        word,
        meaning: koreanDictionary[word],
        constituentLettersMeta: [] 
      });
    }
  }
  // console.log(`[korean-utils] findPossibleWords - checked ${checkedWords} words from dictionary. Found ${result.length} possible words initially.`); // 주석 처리
  result.sort((a, b) => b.word.length - a.word.length);
  // console.log('[korean-utils] findPossibleWords - result after sort:', JSON.stringify(result.map(r => r.word))); // 주석 처리
  return result;
}

export function createBlankWord(word, availableLettersInParagraph) {
  const availableSet = new Set(availableLettersInParagraph);
  return word.split('').map(char => availableSet.has(char) ? char : '_').join(' ');
}

export function generateQuiz(allPossibleWords, initialLettersWithMeta) {
  // console.log('[korean-utils] generateQuiz called. allPossibleWords:', JSON.stringify(allPossibleWords.map(w => w.word)), 'initialLettersWithMeta:', JSON.stringify(initialLettersWithMeta)); // 주석 처리
  let currentAvailableLettersWithMeta = [...initialLettersWithMeta];
  const quizWords = [];
  const usedOriginalWords = new Set();

  const sortedWords = [...allPossibleWords].sort((a, b) => {
    if (b.word.length !== a.word.length) return b.word.length - a.word.length;
    return 0.5 - Math.random();
  });
  // console.log('[korean-utils] generateQuiz - sortedWords for full quiz:', JSON.stringify(sortedWords.map(w => w.word))); // 주석 처리

  // 1차: 원본 문단 글자로만 'full' 퀴즈 생성
  for (const wordObj of sortedWords) {
    if (usedOriginalWords.has(wordObj.word)) continue;
    const wordChars = wordObj.word.split('');
    const tempAvailableLetters = [...currentAvailableLettersWithMeta];
    const usedLettersForThisWord = [];
    let canFormThisWord = true;
    // console.log(`[korean-utils] generateQuiz - Trying to form FULL word: ${wordObj.word}`); // 주석 처리
    for (const charToFind of wordChars) {
      const foundLetterIndex = tempAvailableLetters.findIndex(letterMeta => letterMeta.char === charToFind);
      if (foundLetterIndex !== -1) {
        usedLettersForThisWord.push(tempAvailableLetters[foundLetterIndex]);
        tempAvailableLetters.splice(foundLetterIndex, 1);
      } else {
        canFormThisWord = false;
        // console.log(`[korean-utils] generateQuiz - Failed to find char '${charToFind}' for word '${wordObj.word}' in currentAvailableLettersWithMeta`); // 주석 처리
        break;
      }
    }
    if (canFormThisWord) {
      // console.log(`[korean-utils] generateQuiz - Successfully formed FULL word: ${wordObj.word}`); // 주석 처리
      quizWords.push({
        word: wordObj.word,
        blank: wordObj.word.split('').map(c => c === ' ' ? '\u00A0' : '_').join(''),
        meaning: wordObj.meaning,
        solved: false,
        type: 'full',
        constituentLettersMeta: usedLettersForThisWord
      });
      usedOriginalWords.add(wordObj.word);
      currentAvailableLettersWithMeta = tempAvailableLetters;
      // console.log('[korean-utils] generateQuiz - currentAvailableLettersWithMeta after forming word:', JSON.stringify(currentAvailableLettersWithMeta)); // 주석 처리
    }
  }
  // console.log('[korean-utils] generateQuiz - FULL quizWords generated:', JSON.stringify(quizWords.map(q => q.word))); // 주석 처리
  // console.log('[korean-utils] generateQuiz - currentAvailableLettersWithMeta before mixed quiz:', JSON.stringify(currentAvailableLettersWithMeta)); // 주석 처리

  // 2차: 남은 원본 글자 + 사전 단어 조합으로 'mixed' 퀴즈 생성
  const mixedQuizWords = [];
  if (currentAvailableLettersWithMeta.length > 0) {
    // console.log('[korean-utils] generateQuiz - Starting MIXED quiz generation.'); // 주석 처리
    const dictionaryWordEntries = Object.entries(koreanDictionary); 
    let attempts = 0; 
    const MAX_ATTEMPTS = currentAvailableLettersWithMeta.length * dictionaryWordEntries.length; 
    // console.log(`[korean-utils] generateQuiz - MIXED quiz - MAX_ATTEMPTS: ${MAX_ATTEMPTS}`); // 주석 처리

    while (currentAvailableLettersWithMeta.length > 0 && attempts < MAX_ATTEMPTS) {
      let bestCombination = null;
      // let fewestRemainingOriginal = currentAvailableLettersWithMeta.length; // Not used

      for (const letterMeta of [...currentAvailableLettersWithMeta]) { 
        for (const [dictWord, dictMeaning] of dictionaryWordEntries) {
          if (dictWord.length < 2 || dictWord.length > 6) continue; 
          if (usedOriginalWords.has(dictWord)) continue; 

          const originalCharsInDictWord = [];
          const prefilledCharsFromDict = [];
          // let canFormWithThisDictWord = true; // Not used
          let tempRemainingOriginal = [...currentAvailableLettersWithMeta];
          
          for (const charOfDictWord of dictWord.split('')) {
            const foundInOriginalIdx = tempRemainingOriginal.findIndex(om => om.char === charOfDictWord);
            if (foundInOriginalIdx !== -1) {
              originalCharsInDictWord.push(tempRemainingOriginal[foundInOriginalIdx]);
              tempRemainingOriginal.splice(foundInOriginalIdx, 1); 
            } else {
              prefilledCharsFromDict.push({ char: charOfDictWord, fromDictionary: true });
            }
          }

          if (originalCharsInDictWord.length > 0 && originalCharsInDictWord.length >= prefilledCharsFromDict.length/2 ) { 
            if (!bestCombination || 
                originalCharsInDictWord.length > bestCombination.constituentLettersMeta.length ||
                (originalCharsInDictWord.length === bestCombination.constituentLettersMeta.length && dictWord.length < bestCombination.word.length)) {
                bestCombination = {
                    word: dictWord,
                    meaning: dictMeaning,
                    constituentLettersMeta: originalCharsInDictWord, 
                    prefilledLetters: prefilledCharsFromDict, 
                };
            }
          }
        }
      }
      attempts++;
      // console.log(`[korean-utils] generateQuiz - MIXED quiz - Attempt: ${attempts}, currentAvailableLettersWithMeta length: ${currentAvailableLettersWithMeta.length}`); // 주석 처리

      if (bestCombination) {
        // console.log('[korean-utils] generateQuiz - MIXED quiz - Found bestCombination:', JSON.stringify(bestCombination)); // 주석 처리
        
        const sourceMap = [];
        const tempConstituentMetas = [...bestCombination.constituentLettersMeta];
        const tempPrefilledLetters = [...bestCombination.prefilledLetters];

        for (const charOfWord of bestCombination.word) {
          const constIdx = tempConstituentMetas.findIndex(cm => cm.char === charOfWord);
          if (constIdx !== -1) {
            sourceMap.push({ char: charOfWord, type: 'original', originalMeta: tempConstituentMetas[constIdx] });
            tempConstituentMetas.splice(constIdx, 1); 
          } else {
            const prefIdx = tempPrefilledLetters.findIndex(pl => pl.char === charOfWord);
            if (prefIdx !== -1) {
                sourceMap.push({ char: charOfWord, type: 'dictionary' });
                tempPrefilledLetters.splice(prefIdx, 1);
            } else {
                sourceMap.push({ char: charOfWord, type: 'dictionary' }); 
            }
          }
        }

        mixedQuizWords.push({
          word: bestCombination.word,
          meaning: bestCombination.meaning,
          solved: false,
          type: 'mixed',
          constituentLettersMeta: bestCombination.constituentLettersMeta,
          prefilledLetters: bestCombination.prefilledLetters,
          displaySpec: sourceMap 
        });
        usedOriginalWords.add(bestCombination.word);
        // console.log('[korean-utils] generateQuiz - MIXED quiz - Removing used letters for word:', bestCombination.word, 'Used metas:', JSON.stringify(bestCombination.constituentLettersMeta)); // 주석 처리
        for (const usedMeta of bestCombination.constituentLettersMeta) {
          const idxToRemove = currentAvailableLettersWithMeta.findIndex(l => l.originalIndex === usedMeta.originalIndex);
          if (idxToRemove !== -1) {
            currentAvailableLettersWithMeta.splice(idxToRemove, 1);
          }
        }
        // console.log('[korean-utils] generateQuiz - MIXED quiz - currentAvailableLettersWithMeta after removing used:', JSON.stringify(currentAvailableLettersWithMeta)); // 주석 처리
      } else {
        // console.log('[korean-utils] generateQuiz - MIXED quiz - No bestCombination found in this attempt. Breaking loop.'); // 주석 처리
        break; 
      }
    }
  } else {
    // console.log('[korean-utils] generateQuiz - No remaining letters for MIXED quiz generation.'); // 주석 처리
  }
  // console.log('[korean-utils] generateQuiz - MIXED quizWords generated:', JSON.stringify(mixedQuizWords.map(q => q.word))); // 주석 처리

  const combinedQuizWords = [...quizWords, ...mixedQuizWords];
  const finalHintLettersMeta = currentAvailableLettersWithMeta;
  // console.log('[korean-utils] generateQuiz - Combined quiz words:', JSON.stringify(combinedQuizWords.map(q => q.word))); // 주석 처리
  // console.log('[korean-utils] generateQuiz - Final hint letters meta:', JSON.stringify(finalHintLettersMeta)); // 주석 처리

  if (combinedQuizWords.length === 0) {
    // console.warn('[korean-utils] generateQuiz - 최종 생성된 퀴즈가 없습니다!'); // 주석 처리
  }

  return { quiz: combinedQuizWords, hintLettersMeta: finalHintLettersMeta };
}

function jaccardSimilarity(str1, str2) {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function levenshteinDistance(s1, s2) {
  if (s1.length < s2.length) {
    return levenshteinDistance(s2, s1);
  }
  if (s2.length === 0) {
    return s1.length;
  }
  let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 0; i < s1.length; i++) {
    let currentRow = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      let insertions = previousRow[j + 1] + 1;
      let deletions = currentRow[j] + 1;
      let substitutions = previousRow[j] + (s1[i] !== s2[j]);
      currentRow.push(Math.min(insertions, deletions, substitutions));
    }
    previousRow = currentRow;
  }
  return previousRow[s2.length];
}

export function calculateSimilarity(originalParagraph, guessedParagraph) {
  const originalClean = originalParagraph.replace(/\s+/g, '');
  const guessedClean = guessedParagraph.replace(/\s+/g, '');

  if (originalClean.length === 0 && guessedClean.length === 0) return 100;
  if (originalClean.length === 0 || guessedClean.length === 0) return 0;
  
  const maxLength = Math.max(originalClean.length, guessedClean.length);
  const distance = levenshteinDistance(originalClean, guessedClean);
  const levenshteinSim = ((maxLength - distance) / maxLength) * 100;

  const jaccardSim = jaccardSimilarity(originalClean, guessedClean) * 100;

  const similarityScore = (levenshteinSim * 0.7) + (jaccardSim * 0.3);
  
  return Math.max(0, Math.min(100, similarityScore)); 
}

export function calculateLetterFrequency(paragraph) {
    const letters = paragraph.replace(/[^가-힣]/g, '').split('');
    const freq = {};
    for (const letter of letters) {
        freq[letter] = (freq[letter] || 0) + 1;
    }
    return freq;
}

export const getConsonants = (char, initialOnly = true) => {
  const f = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  // 중성, 종성 정의는 getCharConsonant 함수에서는 직접 사용되지 않지만, 완전한 한글 분해 로직의 일부로 참고용으로 둘 수 있습니다.
  // const s = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  // const t = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  const ga = 44032;
  let uni = char.charCodeAt(0);

  uni = uni - ga;

  if (uni < 0 || uni > 11171) return initialOnly ? '' : []; // 한글 범위 밖이거나 자모결합이 아니면 빈 값

  const fn = parseInt(uni / 588);
  const initial = f[fn];

  if (initialOnly) {
    return initial || ''; // 초성만 반환, 없으면 빈 문자열
  }

  // initialOnly가 false일 경우 모든 자음 반환 (초성, 종성)
  // 이 부분은 현재 초성퀴즈에는 바로 필요 없지만, 확장성을 위해 남겨둘 수 있습니다.
  // 종성 추출 로직 추가 필요:
  // const tn = parseInt((uni % 28)); // 종성 인덱스
  // const final = t[tn];
  // const consonants = [initial];
  // if (final) consonants.push(final);
  // return consonants;
  return [initial].filter(c => c); // 일단 초성만 배열로 반환 (추후 종성 추가)
};

// 문장을 받아 초성 문장으로 변환하는 함수
export const generateConsonantSentence = (paragraph) => {
  if (!paragraph) return '';
  let consonantSentence = '';
  for (let i = 0; i < paragraph.length; i++) {
    const char = paragraph[i];
    if (char === ' ') {
      consonantSentence += ' ';
    } else if (/[가-힣]/.test(char)) { // 한글인 경우에만 초성 추출
      const initial = getConsonants(char, true);
      consonantSentence += initial || char; // 초성이 없으면 (이론상 한글이면 항상 있음) 원본 글자 유지 (안전장치)
    } else {
      // 한글도 공백도 아닌 경우 (특수문자 등)는 아무것도 추가하지 않음 (제거 효과)
      // consonantSentence += ''; // 명시적으로 표현 가능
    }
  }
  return consonantSentence;
};

// 새로운 함수: 글자를 섞되 띄어쓰기는 보존
export const generateShuffledSentence = (paragraph) => {
  if (!paragraph) return '';

  const chars = [];
  const charIndices = []; // 실제 글자들의 원본 인덱스 (공백 제외)
  const spaceIndices = []; // 공백의 원본 인덱스

  for (let i = 0; i < paragraph.length; i++) {
    if (paragraph[i] === ' ') {
      spaceIndices.push(i);
    } else {
      chars.push(paragraph[i]);
      charIndices.push(i);
    }
  }

  // Fisher-Yates shuffle 알고리즘으로 글자 배열 섞기
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  const result = new Array(paragraph.length);
  spaceIndices.forEach(index => {
    result[index] = ' ';
  });

  let charPointer = 0;
  for (let i = 0; i < paragraph.length; i++) {
    if (result[i] !== ' ') { // 공백이 아닌 자리에 섞인 글자 채우기
      if (charPointer < chars.length) {
        result[i] = chars[charPointer];
        charPointer++;
      } else {
        // 이 경우는 발생하면 안 되지만, 안전장치로 원래 글자를 넣거나 빈칸 처리
        // 원본 charIndices를 사용해서 원래 글자를 참조할 수도 있으나, 
        // 이미 chars 배열은 섞였으므로, 이 부분은 로직 점검 필요
        // 가장 간단하게는, 남은 자리는 원본 글자로 채우거나, 에러를 발생시킬 수 있습니다.
        // 여기서는 일단 빈칸으로 두거나, 마지막 남은 글자로 채우는 방식을 생각할 수 있으나
        // charPointer가 chars.length를 넘는 경우는 chars가 부족하다는 의미.
        // charIndices와 chars의 길이가 같아야 하므로 이 문제는 발생하지 않아야 함.
      }
    }
  }
  
  // 만약 charPointer가 chars.length에 도달하지 못했다면, result 배열에 빈칸이 있다는 의미
  // 이는 보통 spaceIndices로 모든 공백을 채우고, 나머지를 글자로 채우면 해결됨.
  // 위의 로직을 수정하여, 공백이 아닌 자리에 순서대로 섞인 글자를 채우도록 함.
  // 아래는 수정된 로직
  
  const finalResult = new Array(paragraph.length);
  let currentNonSpaceIndex = 0;
  for(let i = 0; i < paragraph.length; i++) {
    if (paragraph[i] === ' ') {
      finalResult[i] = ' ';
    } else {
      finalResult[i] = chars[currentNonSpaceIndex];
      currentNonSpaceIndex++;
    }
  }

  return finalResult.join('');
};

export function extractUniqueHangulCharacters(paragraph) {
  if (!paragraph) return [];
  const hangulRegex = /[가-힣]/g;
  const hangulChars = paragraph.match(hangulRegex) || [];
  return [...new Set(hangulChars)];
}

export function getRandomWordContainingChar(charToFind, dictionary) {
  if (!charToFind || !dictionary) return null;
  const wordsContainingChar = Object.entries(dictionary)
    .filter(([word, _]) => word.includes(charToFind));

  if (wordsContainingChar.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * wordsContainingChar.length);
  const [word, meaning] = wordsContainingChar[randomIndex];
  return { word, meaning };
}

export const generateWordModeClues = (paragraph, dictionary) => {
  console.log('[korean-utils] generateWordModeClues called for paragraph:', paragraph);

  // dictionary가 객체 형태일 경우, {word, meaning} 형태의 배열로 변환
  const dictionaryArray = Array.isArray(dictionary) 
    ? dictionary 
    : Object.entries(dictionary).map(([word, meaning]) => ({ word, meaning }));

  const uniqueChars = [...new Set(paragraph.replace(/\s/g, ''))];
  let coveredOriginalIndices = new Set();

  const clues = uniqueChars.map(char => {
    const containingWords = dictionaryArray.filter(entry => entry.word.includes(char) && entry.word.length > 1);
    
    if (containingWords.length > 0) {
      const selectedEntry = containingWords[Math.floor(Math.random() * containingWords.length)];
      
      const allOriginalIndices = [];
      for (let i = 0; i < paragraph.length; i++) {
        if (paragraph[i] === char) {
          allOriginalIndices.push(i);
        }
      }

      // 아직 다른 힌트가 선점하지 않은 위치 정보만 저장
      const availableIndices = allOriginalIndices.filter(idx => !coveredOriginalIndices.has(idx));
      
      if (availableIndices.length === 0) return null; // 선점할 위치가 없으면 힌트 생성 안함

      // 이번 힌트가 선점할 위치를 covered set에 추가
      availableIndices.forEach(idx => coveredOriginalIndices.add(idx));

      return {
        targetChar: char,
        clueWord: selectedEntry.word,
        meaning: selectedEntry.meaning,
        positions: availableIndices,
        solved: false,
      };
    } else {
      console.warn(`[korean-utils] Could not find a dictionary word containing the character: '${char}'`);
      return null; // 단어를 못찾으면 null 반환
    }
  }).filter(Boolean); // null 값을 제거하여 유효한 힌트만 남김

  // 유효한 힌트(사전에서 찾은 단어)만 필터링하거나, 실패한 힌트도 포함할 수 있음
  // 여기서는 실패한 힌트도 UI에 표시하기 위해 그대로 반환
  // const finalClues = clues.filter(c => c.positions.length > 0 || c.clueWord === '?');

  console.log('[korean-utils] generateWordModeClues - generated clues:', JSON.parse(JSON.stringify(clues)));
  return clues;
};

// 새로운 단어 퀴즈 출제 로직을 위한 함수
export function generateTargetCoveringHints(originalParagraph, dictionary) {
  console.log('[korean-utils] generateTargetCoveringHints called for:', originalParagraph);
  if (!originalParagraph || !dictionary || Object.keys(dictionary).length === 0) {
    console.error('[korean-utils] generateTargetCoveringHints: Invalid input or empty dictionary.');
    return { hints: [], initiallyRevealedIndices: [] };
  }

  const lettersFromSentence = extractLetters(originalParagraph);
  if (lettersFromSentence.length === 0) {
    console.warn('[korean-utils] No Hangul letters extracted from paragraph.');
    return { hints: [], initiallyRevealedIndices: [] };
  }

  const originalParagraphCharsSet = new Set(originalParagraph.split(''));
  const hints = [];
  const initiallyRevealedIndices = [];
  const coveredOriginalIndices = new Set();
  const usedClueWords = new Set(); // 이미 사용된 힌트 단어를 추적하기 위한 Set

  for (const letterMeta of lettersFromSentence) {
    const targetChar = letterMeta.char;
    const currentOriginalIndex = letterMeta.originalIndex;

    if (coveredOriginalIndices.has(currentOriginalIndex)) {
      continue;
    }

    // 이 targetChar에 대해 아직 힌트가 생성되지 않았고, 이전에 이 글자를 커버하는 힌트가 실패한 경우,
    // 미리 공개해야 할 수 있지만, 일단은 각 글자마다 힌트 생성을 시도한다.

    const clueWordData = getRandomWordContainingChar(targetChar, dictionary);

    if (clueWordData) {
      let { word: clueWord, meaning } = clueWordData;
      clueWord = clueWord.replace(/\s+/g, ''); // 힌트 단어에서 띄어쓰기 제거

      if (clueWord.length === 0) {
        // 띄어쓰기 제거 후 단어 길이가 0이 되면 스킵
        continue; 
      }

      // 중복 힌트 단어 방지 로직 추가
      if (usedClueWords.has(clueWord)) {
        console.log(`[korean-utils] Clue word '${clueWord}' already used. Trying to find another for '${targetChar}' or revealing.`);
        // 이미 사용된 단어이므로, 이 targetChar를 커버할 다른 단어를 찾거나, 찾지 못하면 공개 처리합니다.
        // 여기서는 일단 이 targetChar를 initiallyRevealedIndices에 추가하는 것으로 단순화합니다.
        // (더 나은 방법: 다른 단어를 찾는 시도를 몇 번 더 하거나, 다른 글자부터 처리하고 돌아오는 등)
        const indicesToRevealForThisChar = lettersFromSentence
          .filter(lm => lm.char === targetChar && !coveredOriginalIndices.has(lm.originalIndex))
          .map(lm => lm.originalIndex);
        
        indicesToRevealForThisChar.forEach(idx => {
          if (!coveredOriginalIndices.has(idx)) {
            initiallyRevealedIndices.push(idx);
            coveredOriginalIndices.add(idx);
          }
        });
        continue; // 다음 letterMeta로 넘어감
      }

      const allOriginalIndicesForTarget = lettersFromSentence
        .filter(lm => lm.char === targetChar)
        .map(lm => lm.originalIndex);

      const clueWordDisplayChars = clueWord.split('').map(cwChar => ({
        char: cwChar,
        inOriginalParagraph: originalParagraphCharsSet.has(cwChar)
      }));

      hints.push({
        targetChar: targetChar,
        clueWord: clueWord, 
        meaning: meaning,
        originalIndices: allOriginalIndicesForTarget.filter(idx => !coveredOriginalIndices.has(idx)), // 아직 커버되지 않은 인덱스만 추가
        solved: false,
        clueWordDisplayChars: clueWordDisplayChars
      });
      usedClueWords.add(clueWord); // 사용된 힌트 단어 등록

      allOriginalIndicesForTarget.forEach(idx => {
        if (!coveredOriginalIndices.has(idx)) {
          coveredOriginalIndices.add(idx);
        }
      });
      
    } else {
      console.warn(`[korean-utils] No clue word found for targetChar: '${targetChar}'. Adding its indices to initiallyRevealedIndices.`);
      lettersFromSentence
        .filter(lm => lm.char === targetChar)
        .forEach(lm => {
          if (!coveredOriginalIndices.has(lm.originalIndex)) {
            initiallyRevealedIndices.push(lm.originalIndex);
            coveredOriginalIndices.add(lm.originalIndex);
          }
        });
    }
  }
  
  // hints 배열에서 originalIndices가 비어있는 경우 (모든 관련 글자가 이미 다른 힌트로 커버된 경우) 제거
  const finalHints = hints.filter(hint => hint.originalIndices.length > 0);

  const uniqueInitiallyRevealedIndices = [...new Set(initiallyRevealedIndices)];

  // 최종적으로 커버되지 않은 글자가 있다면 initiallyRevealedIndices에 추가
  lettersFromSentence.forEach(letterMeta => {
    if (!coveredOriginalIndices.has(letterMeta.originalIndex) && !uniqueInitiallyRevealedIndices.includes(letterMeta.originalIndex)) {
      uniqueInitiallyRevealedIndices.push(letterMeta.originalIndex);
    }
  });

  console.log('[korean-utils] generateTargetCoveringHints - Generated final hints:', JSON.stringify(finalHints.map(h => h.clueWord)));
  console.log('[korean-utils] generateTargetCoveringHints - Initially revealed indices:', JSON.stringify(uniqueInitiallyRevealedIndices));
  return { hints: finalHints, initiallyRevealedIndices: uniqueInitiallyRevealedIndices };
}
