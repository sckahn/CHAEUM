import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { extractLetters, findPossibleWords, generateQuiz, calculateLetterFrequency, calculateSimilarity, getConsonants, generateConsonantSentence, generateShuffledSentence, generateWordModeClues, generateTargetCoveringHints } from '@/lib/korean-utils';
import useGameToasts from '@/hooks/useGameToasts';
import useParagraphUpdater from '@/hooks/useParagraphUpdater';
import { getTodaysChallenge as getTodaysChallengeData } from '@/lib/quotes';
import koreanDictionary from '@/lib/koreanDictionary';
import { GAME_MODES, getTodayDateString } from '@/lib/utils';

const MAX_INPUT_LENGTH = 50; // 최대 입력 글자 수 정의
const ALLOWED_CHARS_REGEX = /^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9\s!?,.]+$/; // 참고용으로 남겨둘 수 있음 (다른 곳에서 사용하지 않는다면 제거해도 무방)
const ONLY_COMPLETE_HANGUL_SPACE_SPECIAL_REGEX = /^[가-힣\s!?,.]+$/; // 완성형 한글, 공백, 지정 특수문자만
const MIN_INPUT_LENGTH = 10; // 최소 입력 글자 수

// 삭제된 import 대신 상수들을 여기에 직접 정의합니다.
const SECRET_KEY = 'korean-word-quiz-game-secret-key'; // XOR 암복호화용 비밀키
const TUTORIAL_SHOWN_PREFIX = 'koreanWordQuizTutorialShown_'; // 튜토리얼 localStorage 키 접두사

// xorEncryptDecrypt 함수를 여기에 다시 정의합니다.
const xorEncryptDecrypt = (dataBytes, keyString) => {
  const keyBytes = new TextEncoder().encode(keyString);
  return dataBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
};

const STATS_LOCAL_STORAGE_KEY = 'word-game-stats';

const initialStats = {
  totalPlayed: 0,
  winCount: 0,
  currentStreak: 0,
  maxStreak: 0,
  solveTimes: {},
  lastPlayedDate: null,
};

// statsReducer: 새로운 통계 객체를 받아 상태를 업데이트합니다.
const statsReducer = (state, newState) => {
  return newState;
};

export const useGameLogic = () => {
  const [paragraph, setParagraph] = useState('');
  const [originalParagraph, setOriginalParagraph] = useState('');
  const [extractedLetters, setExtractedLetters] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [hintLetters, setHintLetters] = useState([]);
  const [hintLettersMeta, setHintLettersMeta] = useState([]);
  const [currentStage, setCurrentStage] = useState('input'); // 'input', 'quiz', 'guess'
  const [userAnswers, setUserAnswers] = useState({});
  const [showHint, setShowHint] = useState({}); // { word: boolean }
  const [shareLink, setShareLink] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [gameMode, setGameMode] = useState('consonant'); // 'word', 'consonant', 'shuffle'
  const [consonantQuizParagraph, setConsonantQuizParagraph] = useState(''); // 초성퀴즈용으로 변환된 문단
  const [shuffledSentenceProblem, setShuffledSentenceProblem] = useState(''); // 글자 뒤섞기 문제 상태
  const [liveFeedback, setLiveFeedback] = useState([]); // 초성 및 섞기 모드 공통 실시간 피드백 (글자별 정/오답/일치 없음 등)
  const [consonantProgress, setConsonantProgress] = useState(0); // 초성퀴즈 실시간 진행도
  const [shuffleFeedback, setShuffleFeedback] = useState(null); // 글자 섞기 퀴즈 피드백용
  const [shuffleRealtimeFeedbackChars, setShuffleRealtimeFeedbackChars] = useState([]); // 글자 섞기 실시간 피드백
  const [gameStats, dispatchStats] = useReducer(statsReducer, initialStats, (initial) => {
    if (typeof window === 'undefined') {
      return initial;
    }
    try {
      const savedStats = window.localStorage.getItem(STATS_LOCAL_STORAGE_KEY);
      return savedStats ? JSON.parse(savedStats) : initial;
    } catch (error) {
      console.error('Error reading stats from localStorage', error);
      return initial;
    }
  });
  const [todaysChallengeStartTime, setTodaysChallengeStartTime] = useState(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [todaysChallengeInfo, setTodaysChallengeInfo] = useState(null); // 오늘의 문제 정보 저장 상태 추가
  const [currentTutorialMode, setCurrentTutorialMode] = useState(null); // 현재 활성화된 튜토리얼 모드 ('word', 'consonant', 'shuffle', or null)
  const [lastStartedModeForTutorial, setLastStartedModeForTutorial] = useState(null); // {mode: string, type: 'url' | 'today'}
  const [gameStarted, setGameStarted] = useState(false); // 게임 시작 여부 (URL 로딩 시에도 true)
  const [isTodaysChallenge, setIsTodaysChallenge] = useState(false); // 오늘의 도전 여부
  const [todaysProblemParagraph, setTodaysProblemParagraph] = useState(''); // 오늘의 문제 원본 문장 (통계용)
  const [attempts, setAttempts] = useState(0); // 시도 횟수 (필요시 사용)
  const [allSolved, setAllSolved] = useState(false);
  // 광고 및 힌트 관련 상태 추가
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isHintSelectionModalOpen, setIsHintSelectionModalOpen] = useState(false);
  const [availableHints, setAvailableHints] = useState([]);
  const [usedHintsCount, setUsedHintsCount] = useState(0);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);

  const { notifyError, notifySuccess, notifyInfo, notifyGameStart, notifyQuizComplete, notifyTryAgain, toast } = useGameToasts();
  const { revealedParagraph: wordModeRevealedParagraph, updateRevealedParagraph: updateWordModeRevealedParagraph } = useParagraphUpdater(originalParagraph, quiz, hintLettersMeta);
  const [revealedParagraph, setRevealedParagraph] = useState([]); // 모든 모드에서 사용자의 입력/정답 상태를 배열로 관리

  // 초성 퀴즈용 revealedParagraph (정답을 맞출 때까지 초성 문제 보여주기)
  // 이 부분은 초성퀴즈 정답 로직과 연동되어야 함. 지금은 consonantQuizParagraph를 그대로 사용.
  const consonantModeRevealedParagraph = consonantQuizParagraph; 

  // 최종적으로 App.jsx 등으로 전달될 revealedParagraph
  // 이 정의는 다른 useCallback 함수들보다 위에 있어야 함.
  // const revealedParagraph = useMemo(() => { // useState로 직접 관리하므로 useMemo 제거
  //   if (gameMode === 'word') return wordModeRevealedParagraph;
  //   if (gameMode === 'consonant') return consonantModeRevealedParagraph;
  //   if (gameMode === 'shuffle') return shuffledSentenceProblem;
  //   return '';
  // }, [gameMode, wordModeRevealedParagraph, consonantModeRevealedParagraph, shuffledSentenceProblem]);

  // 단어 게임용 상태 추가
  const [charGrid, setCharGrid] = useState([]);
  const [clues, setClues] = useState([]);

  const validateParagraph = useCallback((paragraph, isFromTodaysChallenge = false) => {
    if (!paragraph || paragraph.trim().length === 0) {
      notifyError("문장 필요", "문장이 입력되지 않았습니다.");
      return false;
    }
    
    // 구두점 제거하여 정리된 문장 생성
    const cleanedParagraph = paragraph.replace(/[.!?,]/g, '').trim();
    
    // "오늘의 문제"가 아닌 경우에만 글자 수 제한 검사
    if (!isFromTodaysChallenge) {
      if (cleanedParagraph.length > MAX_INPUT_LENGTH) {
        notifyError("입력 길이 초과", `문장은 최대 ${MAX_INPUT_LENGTH}자까지 입력 가능합니다.`);
        return false;
      }

      if (cleanedParagraph.trim().length < MIN_INPUT_LENGTH) {
        notifyError("입력 길이 부족", `문장은 최소 ${MIN_INPUT_LENGTH}자 이상 입력해야 합니다.`);
        return false;
      }
    }

    // 완성형 한글과 공백만 허용 (구두점은 이미 제거됨)
    if (!/^[가-힣\s]*$/.test(cleanedParagraph)) {
      notifyError("허용되지 않는 문자", "문장에는 완성된 한글과 공백만 사용할 수 있습니다. (숫자, 단독 자음/모음, 특수문자 불가)");
      return false;
    }
    
    // 자음이나 모음만 있는지 추가 검사 (구두점 제거 후)
    const consonantsOnly = /^[ㄱ-ㅎ\s]*$/;  // 자음만 있는 패턴
    const vowelsOnly = /^[ㅏ-ㅣ\s]*$/;      // 모음만 있는 패턴
    
    if (consonantsOnly.test(cleanedParagraph) || vowelsOnly.test(cleanedParagraph)) {
      notifyError("불완전한 글자", "자음이나 모음만으로는 문제를 출제할 수 없습니다. 완성된 한글 글자를 사용해주세요.");
      return false;
    }
    
    // 완성형 한글이 실제로 포함되어 있는지 확인
    const hasCompleteHangul = /[가-힣]/.test(cleanedParagraph);
    if (!hasCompleteHangul) {
      notifyError("완성된 한글 필요", "문제에는 최소 하나 이상의 완성된 한글 글자가 포함되어야 합니다.");
      return false;
    }
    
    return cleanedParagraph;
  }, [notifyError]);

  const generateProblemFromParagraph = useCallback((paragraph, isTodays = false, mode = gameMode) => {
    if (mode === 'word') {
      // "단어 퀴즈" 모드: originalParagraph를 기반으로 힌트들을 생성
      const clues = generateWordModeClues(paragraph, koreanDictionary);
      if (clues && clues.length > 0) {
        return {
          quiz: clues, // 힌트 배열 자체가 퀴즈 데이터
          // hintLettersMeta는 단어 퀴즈 모드에서 이 방식으로는 필요 없을 수 있음 (추후 UI에 따라 결정)
          // 여기서는 originalParagraph 자체가 정답이므로, problemData에 포함시킬 필요는 없음.
          // 필요한 경우 { quiz: clues, originalParagraph: paragraph } 형태로 반환 가능
        };
      } else {
      return null;
    }
    } else if (mode === 'consonant') {
      // "초성 퀴즈" 모드: (기존 로직 유지 또는 필요시 수정)
      // 초성 퀴즈는 별도의 퀴즈 데이터 구조가 필요하지 않고, 
      // originalParagraph와 generateConsonantSentence로 처리 가능.
      // 따라서, 여기서는 paragraph 자체를 "문제 데이터"로 간주할 수 있음.
      // 혹은, QuizStage에서 사용할 수 있도록 특정 객체 형태로 감싸줄 수 있음.
      return { originalParagraph: paragraph }; // 혹은 { type: 'consonant', problem: paragraph } 등
    } else if (mode === 'shuffle') {
      // "단어 섞기" 모드: (기존 로직 유지 또는 필요시 수정)
      return { originalParagraph: paragraph }; // 혹은 { type: 'shuffle', problem: paragraph } 등
    }
    // 예전 로직:
    // const letters = extractLetters(paragraph);
    // const possibleWords = findPossibleWords(letters);
    // if (possibleWords.length === 0 && mode !== 'consonant' && mode !== 'shuffle') { // 초성/섞기는 단어 못찾아도 진행
    //   console.warn("No possible words found for:", paragraph);
    //   // return null; // 이전에는 여기서 null 반환했으나, gameMode에 따라 다르게 처리해야 함
    // }
    // const { quiz, hintLettersMeta } = generateQuiz(possibleWords, letters);
    // return { quiz, hintLettersMeta, originalParagraph: paragraph };
    return null; // 기본적으로 다른 모드에서 특정 problemData를 생성하지 않으면 null 반환
  }, [gameMode]); // koreanDictionary는 이제 직접 사용되므로 의존성 배열에서 제거 가능, generateWordModeClues가 내부적으로 사용

  // 초성퀴즈 문제 생성 로직 (간단한 버전: 전체 문장을 초성으로 변환)
  const generateConsonantProblemFromParagraph = useCallback((paragraph, isTodays = false) => {
    const cleanedParagraph = validateParagraph(paragraph, isTodays);
    if (!cleanedParagraph) return null;
    const consonantSentence = generateConsonantSentence(cleanedParagraph); // korean-utils.js의 함수 사용
    if (!consonantSentence) {
        notifyError("오류", "초성 문장 생성에 실패했습니다.");
        return null;
    }
    return {
      originalParagraphData: cleanedParagraph,
      consonantQuizData: consonantSentence // 초성으로 변환된 문장 자체를 퀴즈 데이터로 사용
    };
  }, [notifyError, validateParagraph]);
  
  // 글자 뒤섞기 문제 생성 로직
  const generateShuffleProblemFromParagraph = useCallback((paragraph, isTodays = false) => {
    const cleanedParagraph = validateParagraph(paragraph, isTodays);
    if (!cleanedParagraph) return null;
    const shuffled = generateShuffledSentence(cleanedParagraph);
    if (!shuffled) { // 만약 generateShuffledSentence가 실패할 경우 (예: 빈 문자열 반환)
        notifyError("오류", "글자 뒤섞기 문제 생성에 실패했습니다."); return null;
    }
    return { originalParagraphData: cleanedParagraph, shuffledProblemData: shuffled };
}, [notifyError, validateParagraph]);

  const createShareLink = useCallback(async (paragraph, mode) => {
    const cleanedParagraph = validateParagraph(paragraph);
    if (!cleanedParagraph) return null;
    try {
      const problemToShare = { originalParagraph: cleanedParagraph, gameMode: mode };
      const serializedData = JSON.stringify(problemToShare);
      let uint8Array = new TextEncoder().encode(serializedData);

      uint8Array = xorEncryptDecrypt(uint8Array, SECRET_KEY);

      // FileReader를 사용하여 base64 인코딩
      const base64EncodedData = await new Promise((resolve, reject) => {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const dataUrl = reader.result;
              resolve(dataUrl.substring(dataUrl.indexOf(',') + 1));
            } catch (error) {
              reject(new Error('Failed to process data URL'));
            }
          };
          reader.onerror = () => reject(new Error('FileReader failed'));
          reader.readAsDataURL(new Blob([uint8Array]));
        } catch (error) {
          reject(error);
        }
      });

      const currentUrl = window.location.origin + window.location.pathname;
      return `${currentUrl}?problem=${encodeURIComponent(base64EncodedData)}`;
    } catch (error) {
      console.error(`Error generating ${mode} share link:`, error);
      let quizTypeName = '퀴즈';
      if (mode === 'word') quizTypeName = '단어퀴즈';
      else if (mode === 'consonant') quizTypeName = '초성퀴즈';
      else if (mode === 'shuffle') quizTypeName = '글자섞기퀴즈';
      notifyError("링크 생성 오류", `${quizTypeName} 링크를 만드는 중 오류가 발생했습니다.`);
      return null;
    }
  }, [notifyError, validateParagraph]);

  // 단어퀴즈용 공유 링크 생성 핸들러
  const handleGenerateShareLink = useCallback(async () => {
    const link = await createShareLink(originalParagraph, 'word');
    if (link) {
      setShareLink(link);
      setIsShareModalOpen(true);
      notifyInfo("단어퀴즈 공유 링크 생성 완료!", "링크를 복사하여 친구에게 문제를 공유해보세요.");
    }
  }, [originalParagraph, createShareLink, notifyInfo]);

  // 초성퀴즈용 공유 링크 생성 핸들러
  const handleGenerateConsonantShareLink = useCallback(async () => {
    const link = await createShareLink(originalParagraph, 'consonant');
    if (link) {
      setShareLink(link);
      setIsShareModalOpen(true);
      notifyInfo("초성퀴즈 공유 링크 생성 완료!", "링크를 복사하여 친구에게 문제를 공유해보세요.");
    }
  }, [originalParagraph, createShareLink, notifyInfo]);

  // 글자 뒤섞기 퀴즈 공유 링크 생성 핸들러
  const handleGenerateShuffleShareLink = useCallback(async () => {
    const link = await createShareLink(originalParagraph, 'shuffle');
    if (link) {
        setShareLink(link);
        setIsShareModalOpen(true);
        notifyInfo("글자섞기퀴즈 공유 링크 생성 완료!", "링크를 복사하여 친구에게 문제를 공유해보세요.");
    }
}, [originalParagraph, createShareLink, notifyInfo]);

  // 순서 조정: updateStatsOnGameEnd가 가장 먼저 (외부 의존성 없음, getTodayDateString은 외부 함수)
  const updateStatsOnGameEnd = useCallback((isWin) => {
    const todayStr = getTodayDateString();
    let newStats = { ...gameStats };
    if (newStats.lastPlayedDate !== todayStr) {
      newStats.totalPlayed = (newStats.totalPlayed || 0) + 1;
      newStats.lastPlayedDate = todayStr;
    }
    if (isWin && todaysChallengeInfo) {
      if (newStats.lastWinDate !== todayStr) {
        newStats.totalWins = (newStats.totalWins || 0) + 1;
        const solveTimeInSeconds = todaysChallengeStartTime ? Math.round((Date.now() - todaysChallengeStartTime) / 1000) : 0;
        newStats.solveTimes[todayStr] = {
          time: solveTimeInSeconds,
          mode: todaysChallengeInfo.mode,
          modeDisplay: todaysChallengeInfo.modeDisplayName,
          sentence: todaysChallengeInfo.sentence,
        };
        let distributionKey = 6; 
        if (solveTimeInSeconds <= 30) distributionKey = 1;
        else if (solveTimeInSeconds <= 60) distributionKey = 2;
        else if (solveTimeInSeconds <= 120) distributionKey = 3;
        else if (solveTimeInSeconds <= 180) distributionKey = 4;
        else if (solveTimeInSeconds <= 300) distributionKey = 5;
        newStats.winDistribution[distributionKey] = (newStats.winDistribution[distributionKey] || 0) + 1;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        if (newStats.lastWinDate === yesterdayStr) {
          newStats.currentStreak = (newStats.currentStreak || 0) + 1;
        } else {
          newStats.currentStreak = 1; 
        }
        newStats.maxStreak = Math.max(newStats.maxStreak || 0, newStats.currentStreak);
        newStats.lastWinDate = todayStr; 
      } 
    } else if (!isWin && todaysChallengeInfo) { 
      newStats.currentStreak = 0;
    }
    dispatchStats(newStats);
  }, [gameStats, todaysChallengeStartTime, todaysChallengeInfo, dispatchStats]);

  // 게임 성공 처리 함수
  const handleGameSuccess = useCallback(() => {
    setAllSolved(true);
    setCurrentStage('result');
    
    // 오늘의 도전인 경우 통계 업데이트
    if (todaysChallengeInfo) {
      updateStatsOnGameEnd(true);
      notifyQuizComplete();
    } else {
      notifySuccess("축하합니다!", "문제를 모두 해결했습니다!");
    }
  }, [todaysChallengeInfo, updateStatsOnGameEnd, notifyQuizComplete, notifySuccess]);

  // 순서 조정: checkSolution이 updateStatsOnGameEnd 다음에 (updateStatsOnGameEnd에 의존)
  const checkSolution = useCallback(() => {
    // 게임이 시작되지 않았거나 퀴즈 상태가 아니면 종료
    if (!gameStarted || currentStage !== 'quiz') {
      return;
    }

    const normalizeString = (str) => {
      return str
        .replace(/\s+/g, '')
        .replace(/[!?.,]/g, '')
        .toLowerCase()
        .trim();
    };

    const originalClean = normalizeString(originalParagraph);
    const finalUserClean = normalizeString(Array.isArray(revealedParagraph) ? revealedParagraph.join('') : revealedParagraph);

    if (originalClean === finalUserClean) {
      handleGameSuccess();
    } else {
      notifyTryAgain();
    }
  }, [gameStarted, currentStage, originalParagraph, revealedParagraph, handleGameSuccess, notifyTryAgain]);
  
  // 순서 조정: handleSubmitWordAnswer가 checkSolution 다음에 (checkSolution에 의존)
  const handleSubmitWordAnswer = useCallback((clueIndex, submittedAnswer) => {
    if (gameMode !== 'word' || !quiz || !quiz[clueIndex]) {
      notifyError("오류", "단어 제출에 문제가 발생했습니다.");
      return;
    }
    const currentClue = quiz[clueIndex];
    if (currentClue.solved) {
      notifyInfo("이미 맞힌 단어", `'${currentClue.clueWord}'는 이미 해결했습니다.`);
      return;
    }

    // 특수문자 제거 및 정규화 함수
    const normalizeString = (str) => {
      if (typeof str !== 'string') return '';
      return str.trim().toLowerCase().replace(/[^가-힣a-zA-Z0-9]/g, '');
    };

    const normalizedSubmittedAnswer = normalizeString(submittedAnswer);
    const normalizedClueWord = normalizeString(currentClue.clueWord);

    const isCorrect = normalizedSubmittedAnswer === normalizedClueWord;
    let allHintsSolvedAfterThis = false;
    if (isCorrect) {
      const newQuiz = quiz.map((q, idx) => 
        idx === clueIndex ? { ...q, solved: true, userInput: submittedAnswer } : q
      );
      setQuiz(newQuiz);
      const newRevealed = [...revealedParagraph]; 
      currentClue.originalIndices.forEach(idx => {
        if (idx < newRevealed.length && idx < originalParagraph.length) {
          newRevealed[idx] = originalParagraph[idx];
        }
      });
      setRevealedParagraph(newRevealed);

      setAttempts(prev => prev + 1);
      notifySuccess("정답!", `'${currentClue.clueWord}'를 맞혔습니다! (대상 글자: '${currentClue.targetChar}')`);
      
      allHintsSolvedAfterThis = newQuiz.every((clue) => clue.solved);
      if (allHintsSolvedAfterThis) {
        const finalSentenceForCheck = newRevealed.join('');
        checkSolution();
      }
    } else {
      setAttempts(prev => prev + 1);
      notifyError("오답", "다시 시도해보세요.");
    }
  }, [gameMode, quiz, originalParagraph, revealedParagraph, notifyError, notifySuccess, notifyInfo, setAttempts, setRevealedParagraph, setQuiz, checkSolution]);

  // 순서 조정: startWordGame이 checkSolution 다음에 (checkSolution에 의존)
  const startWordGame = useCallback((paragraphToLoad, isTodays = false) => {
    
    const cleanedParagraph = validateParagraph(paragraphToLoad, isTodays);
    if (!cleanedParagraph) return;

    const clues = generateWordModeClues(cleanedParagraph, koreanDictionary);
    
    if (!clues || clues.length === 0) {
      notifyError("오류", "문장에서 힌트를 생성할 수 없습니다. 다른 문장을 시도해보세요.");
      return;
    }

    // 힌트가 있는 글자들의 원본 인덱스를 Set으로 관리
    const hintedIndices = new Set(clues.flatMap(c => c.positions));

    // charGrid 초기화: 힌트가 없는 글자는 정답으로 처리하고, 있는 글자는 빈칸으로 둠
    const charGrid = cleanedParagraph.split('').map((char, index) => {
      if (char === ' ') return { type: 'space' };

      // 힌트가 없는 글자이거나, 여러 힌트에 중복으로 포함될 수 있는 글자 처리
      if (!hintedIndices.has(index)) {
        return { type: 'char', value: char, status: 'correct', isRevealed: true, clueIndexes: [] };
      }

      // 힌트가 있는 글자
      return { type: 'char', value: '', status: 'empty', originalChar: char, clueIndexes: [] };
    });
    
    // 각 힌트가 어느 charGrid 셀에 해당하는지 역참조 정보(clueIndexes) 추가
    clues.forEach((clue, clueIndex) => {
      clue.positions.forEach(pos => {
        if (charGrid[pos] && charGrid[pos].type === 'char') {
           charGrid[pos].clueIndexes.push(clueIndex);
        }
      });
    });

    // 상태 업데이트
    setGameMode('word');
    setQuiz(clues);
    setRevealedParagraph(charGrid.map(cell => cell.value));
    setCurrentStage('quiz');
    setGameStarted(true);
    setUsedHintsCount(0);
  }, [validateParagraph, koreanDictionary, notifyError, setGameMode, setQuiz, setRevealedParagraph, setCurrentStage, setGameStarted, setUsedHintsCount]);

  // 순서 조정: startConsonantGame, startShuffleGame이 startWordGame과 유사한 레벨로, loadProblemFromUrl/startTodaysChallenge 보다 먼저 오도록 함.
  const startConsonantGame = useCallback((paragraphToLoad, isTodays = false) => {
    if (!paragraphToLoad || !paragraphToLoad.trim()) {
      notifyError("오류", "문장이 입력되지 않았습니다.");
      return;
    }

    // 정규화된 단락으로 유효성 검사
    const normalizedParagraph = paragraphToLoad.replace(/\s+/g, ' ').trim();
    
    const cleanedParagraph = validateParagraph(normalizedParagraph, isTodays);
    if (!cleanedParagraph) return;

    // 초성 버전의 문장 생성
    const consonantVersion = generateConsonantSentence(cleanedParagraph);
    if (!consonantVersion) {
      notifyError("오류", "초성 변환에 실패했습니다.");
      return;
    }

    setOriginalParagraph(cleanedParagraph);
    setGameMode('consonant');
    setConsonantQuizParagraph(consonantVersion);
    
    // revealedParagraph를 초기값으로 설정 (빈 배열 또는 빈 문자열들)
    const initialRevealedArray = cleanedParagraph.split('').map(() => '');
    setRevealedParagraph(initialRevealedArray);
    
    setCurrentStage('quiz');
    setGameStarted(true);
    setUsedHintsCount(0);
  }, [validateParagraph, notifyError]);

  const startShuffleGame = useCallback((paragraphToLoad, isTodays = false) => {
    const cleanedParagraph = validateParagraph(paragraphToLoad, isTodays);
    if (!cleanedParagraph) return;

    const shuffledProblem = generateShuffledSentence(cleanedParagraph);
    if (!shuffledProblem) {
      notifyError("오류", "글자 섞기 문제 생성에 실패했습니다.");
      return;
    }

    setOriginalParagraph(cleanedParagraph);
    setGameMode('shuffle');
    setShuffledSentenceProblem(shuffledProblem);
    
    // revealedParagraph를 초기값으로 설정
    const initialRevealedArray = cleanedParagraph.split('').map(() => '');
    setRevealedParagraph(initialRevealedArray);
    
    // liveFeedback 초기화 - 첫 글자 힌트들은 미리 correct로 설정
    const initialFeedback = Array(cleanedParagraph.length).fill('neutral');
    const words = cleanedParagraph.split(' ');
    let charIndex = 0;
    
    // 3단어씩 블록을 만들어 각 블록의 첫 글자를 correct로 설정
    for (let wordIndex = 0; wordIndex < words.length; wordIndex += 3) {
      // 현재 블록의 첫 글자 위치를 correct로 설정
      if (charIndex < cleanedParagraph.length && cleanedParagraph[charIndex] !== ' ') {
        initialFeedback[charIndex] = 'correct';
        initialRevealedArray[charIndex] = cleanedParagraph[charIndex];
      }
      
      // 다음 블록의 시작 위치로 이동
      for (let w = wordIndex; w < Math.min(wordIndex + 3, words.length); w++) {
        charIndex += words[w].length;
        if (w < words.length - 1) charIndex++; // 띄어쓰기
      }
    }
    
    setLiveFeedback(initialFeedback);
    setRevealedParagraph(initialRevealedArray);
    
    setCurrentStage('quiz');
    setGameStarted(true);
    setUsedHintsCount(0);
  }, [validateParagraph, notifyError]);

  // URL에서 문제 로드하는 useEffect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const problemParam = urlParams.get('problem');

    if (problemParam && !gameStarted) {
      try {
        // base64 디코딩
        const binaryString = atob(decodeURIComponent(problemParam));
        const uint8Array = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }

        // XOR 복호화
        const decryptedArray = xorEncryptDecrypt(uint8Array, SECRET_KEY);
        const decryptedString = new TextDecoder().decode(decryptedArray);
        
        // JSON 파싱
        const problemData = JSON.parse(decryptedString);
        const { originalParagraph: paragraph, gameMode: mode } = problemData;
        
        if (paragraph && mode) {
          setGameMode(mode);
          setGameStarted(true);
          setCurrentStage('input');
          
          if (mode === 'word') {
            startWordGame(paragraph, false);
          } else if (mode === 'consonant') {
            startConsonantGame(paragraph, false);
          } else if (mode === 'shuffle') {
            startShuffleGame(paragraph, false);
          }
          
          // URL에서 문제 파라미터 제거
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('problem');
          newUrl.searchParams.delete('mode');
          window.history.replaceState({}, '', newUrl.toString());
        }
      } catch (error) {
        console.error('Link parsing error:', error);
        notifyError("오류", "링크에서 문제를 불러오는데 실패했습니다.");
      }
    }
  }, [gameStarted, startWordGame, startConsonantGame, startShuffleGame, setGameMode, notifyError]);

  // 오늘의 도전 시작 함수
  const startTodaysChallenge = useCallback(() => {
    const { sentence, mode, modeDisplayName, source, type } = getTodaysChallengeData();
    const todayStr = getTodayDateString();
    setTodaysChallengeInfo({ sentence, mode, modeDisplayName, source, type });
    if (gameStats.lastPlayedDate === todayStr && gameStats.solveTimes && gameStats.solveTimes[todayStr] && gameStats.solveTimes[todayStr].time !== undefined) {
      notifyInfo(`오늘의 도전 (${modeDisplayName})은 이미 해결하셨습니다!`, "내일 다시 도전해주세요!");
      setIsStatsModalOpen(true);
      return;
    }
    if (!sentence || sentence.trim().length === 0) {
      notifyError("오늘의 문제 오류", "오늘의 문제를 불러오는 데 실패했습니다.");
      setCurrentStage('input');
      setTodaysChallengeInfo(null);
      return;
    }
    notifyInfo(`오늘의 도전: ${modeDisplayName}!`);
    setTodaysChallengeStartTime(Date.now());
    if (mode === 'word') {
      startWordGame(sentence, true);
    } else if (mode === 'consonant') {
      startConsonantGame(sentence, true);
    } else if (mode === 'shuffle') {
      startShuffleGame(sentence, true);
    } else {
      notifyError("알 수 없는 모드", "오늘의 문제 모드가 잘못되었습니다.");
      setCurrentStage('input');
      setTodaysChallengeInfo(null);
      return;
    }
    setLastStartedModeForTutorial({ mode: mode, type: 'today' });
  }, [
    startWordGame, startConsonantGame, startShuffleGame, 
    notifyError, notifyInfo, setCurrentStage, gameStats, /* getTodayDateString은 외부 함수 */ 
    setIsStatsModalOpen, setTodaysChallengeInfo, setTodaysChallengeStartTime
  ]);

  // resetGame, handleAnswerChange, toggleHint 등은 주요 게임 시작/제출 로직보다는 뒤에 와도 괜찮지만, return 문보다는 앞에 와야 함.
  const resetGame = useCallback(() => {
    setOriginalParagraph('');
    setExtractedLetters([]);
    setQuiz([]);
    setHintLetters([]);
    setHintLettersMeta([]);
    setCurrentStage('input');
    setUserAnswers({});
    setShowHint({});
    setGameMode('word');
    setConsonantQuizParagraph('');
    setShuffledSentenceProblem('');
    setLiveFeedback([]);
    setConsonantProgress(0);
    setShuffleFeedback(null);
    setShuffleRealtimeFeedbackChars([]);
    setTodaysChallengeStartTime(null);
    setTodaysChallengeInfo(null);
    setCurrentTutorialMode(null);
    setLastStartedModeForTutorial(null);
    setGameStarted(false);
    setIsTodaysChallenge(false);
    setTodaysProblemParagraph('');
    setAttempts(0);
    setAllSolved(false);
    setRevealedParagraph([]);
    setUsedHintsCount(0);
  }, []);
  
  const handleAnswerChange = useCallback((fullAnswerString, activeInputIndex = null) => {
    if (gameMode === 'word') {
      return; 
    }

    if (!originalParagraph || originalParagraph.length === 0) {
      setLiveFeedback([]);
      return;
    }

    // 전체 길이에 맞춰 배열 생성 (길이가 짧으면 빈 문자열로 패딩)
    const paddedAnswerChars = Array(originalParagraph.length).fill('');
    const inputChars = fullAnswerString.split('');
    
    // 입력된 문자들을 순서대로 배치
    for (let i = 0; i < Math.min(inputChars.length, originalParagraph.length); i++) {
      paddedAnswerChars[i] = inputChars[i] || '';
    }
    
    // setRevealedParagraph 업데이트
    setRevealedParagraph(paddedAnswerChars);

    // 기존 liveFeedback을 기반으로 새 피드백 계산 (힌트로 설정된 'correct' 유지)
    const feedback = liveFeedback && liveFeedback.length === originalParagraph.length 
      ? [...liveFeedback] 
      : Array(originalParagraph.length).fill('neutral');

    // 각 글자별로 피드백 설정
    for (let i = 0; i < paddedAnswerChars.length; i++) {
      // 힌트로 이미 'correct'인 글자는 사용자가 다시 입력하지 않는 한 유지
      if (feedback[i] === 'correct' && !paddedAnswerChars[i]) {
        continue;
      }

      const originalChar = originalParagraph[i];
      const inputChar = paddedAnswerChars[i];
      
      if (originalChar === ' ') {
        // 공백 처리
        if (inputChar === ' ' || inputChar === '') {
          feedback[i] = 'neutral';
        } else {
          feedback[i] = 'incorrect'; // 공백 자리에 다른 글자 입력시 즉시 빨간색
        }
      } else {
        // 일반 글자 처리
        if (!inputChar || inputChar.trim() === '') {
          feedback[i] = 'neutral'; // 빈 칸은 중립
        } else if (inputChar === originalChar) {
          feedback[i] = 'correct'; // 정답은 즉시 녹색 (포커스 여부 무관)
        } else {
          feedback[i] = 'incorrect'; // 틀렸으면 즉시 빨간색 (포커스 여부 무관)
        }
      }
    }
    
    setLiveFeedback(feedback);
  }, [gameMode, originalParagraph, liveFeedback, setRevealedParagraph, setLiveFeedback]);

  // 튜토리얼 관련 함수들
  const markTutorialAsShown = useCallback((mode) => {
    if (mode) {
      localStorage.setItem(`${TUTORIAL_SHOWN_PREFIX}${mode}`, 'true');
    }
    setCurrentTutorialMode(null);
  }, [setCurrentTutorialMode]); // setCurrentTutorialMode 의존성 추가

  const closeTutorial = useCallback(() => {
    setCurrentTutorialMode(null);
  }, [setCurrentTutorialMode]); // setCurrentTutorialMode 의존성 추가

  // 광고 시청 시작 함수
  const startAdForHint = useCallback(() => {
    if (allSolved) {
      notifyInfo("게임 완료", "이미 모든 문제를 해결했습니다!");
      return;
    }
    
    if (usedHintsCount >= 3) {
      notifyInfo("사용 제한", "광고를 통한 힌트는 최대 3회까지만 사용할 수 있습니다!");
      return;
    }
    
    setIsAdModalOpen(true);
  }, [allSolved, usedHintsCount, notifyInfo]);

  // 광고 완료 후 힌트 선택 모달 열기
  const onAdCompleted = useCallback(() => {
    setIsAdModalOpen(false);
    
    // 각 모드별로 사용 가능한 힌트 생성
    let hints = [];
    
    if (gameMode === 'word') {
      // 단어 퀴즈: 아직 해결되지 않은 단어들
      hints = quiz
        .map((clue, index) => ({ ...clue, originalIndex: index }))
        .filter(clue => !clue.solved)
        .map(clue => ({
          id: `word-${clue.originalIndex}`,
          type: 'word',
          index: clue.originalIndex,
          displayText: `"${clue.meaning}" (${clue.clueWord.length}글자)`,
          answer: clue.clueWord
        }));
    } else if (gameMode === 'consonant' || gameMode === 'shuffle') {
      // 초성/글자섞기: 아직 맞히지 않은 글자들
      hints = [];
      for (let i = 0; i < originalParagraph.length; i++) {
        const char = originalParagraph[i];
        if (char !== ' ' && (!liveFeedback || liveFeedback[i] !== 'correct')) {
          hints.push({
            id: `char-${i}`,
            type: 'character',
            index: i,
            displayText: `${i + 1}번째 글자`,
            answer: char
          });
        }
      }
    }
    
    if (hints.length === 0) {
      notifyInfo("힌트 없음", "더 이상 볼 수 있는 힌트가 없습니다!");
      return;
    }
    
    setAvailableHints(hints);
    setIsHintSelectionModalOpen(true);
  }, [gameMode, quiz, originalParagraph, liveFeedback, notifyInfo]);

  // 선택한 힌트 적용
  const applySelectedHint = useCallback((hintId, updateCharInputCallback) => {
    const selectedHint = availableHints.find(hint => hint.id === hintId);
    if (!selectedHint) return;
    
    setIsHintSelectionModalOpen(false);
    setUsedHintsCount(prev => prev + 1);
    
    if (selectedHint.type === 'word') {
      // 단어 퀴즈: 해당 단어를 자동으로 해결
      handleSubmitWordAnswer(selectedHint.index, selectedHint.answer);
      notifySuccess("힌트 적용!", `"${selectedHint.answer}" 단어가 공개되었습니다!`);
    } else if (selectedHint.type === 'character') {
      // 초성/글자섞기: 해당 글자를 공개
      const newRevealedParagraph = [...revealedParagraph];
      newRevealedParagraph[selectedHint.index] = selectedHint.answer;
      setRevealedParagraph(newRevealedParagraph);
      
      // liveFeedback도 직접 업데이트하여 즉시 녹색으로 표시
      const newLiveFeedback = [...liveFeedback];
      newLiveFeedback[selectedHint.index] = 'correct';
      setLiveFeedback(newLiveFeedback);
      
      // QuizStage의 charInputValues 업데이트
      if (updateCharInputCallback) {
        updateCharInputCallback(selectedHint.index, selectedHint.answer);
      }
      
      notifySuccess("힌트 적용!", `${selectedHint.index + 1}번째 글자 "${selectedHint.answer}"가 공개되었습니다!`);
    }
  }, [availableHints, handleSubmitWordAnswer, revealedParagraph, liveFeedback, notifySuccess, setRevealedParagraph, setLiveFeedback]);

  // useEffect 훅들 (상태 변화에 따른 부수 효과 처리)
  useEffect(() => {
    if (currentStage === 'quiz' && lastStartedModeForTutorial) {
      const { mode } = lastStartedModeForTutorial;
      const tutorialKey = `${TUTORIAL_SHOWN_PREFIX}${mode}`;
      const alreadyShown = localStorage.getItem(tutorialKey);
      if (!alreadyShown) {
        setCurrentTutorialMode(mode);
      }
      setLastStartedModeForTutorial(null);
    }
  }, [currentStage, lastStartedModeForTutorial, setCurrentTutorialMode]);

  useEffect(() => {
    // 이전에 단어 퀴즈 모드에서 wordModeRevealedParagraph를 업데이트하던 로직.
    // 현재는 setRevealedParagraph를 직접 사용하므로, 이 useEffect는 다른 역할이 없다면 제거 가능.
    // if (gameMode === 'word') {
    //   updateWordModeRevealedParagraph(quiz, hintLettersMeta); 
    // }
  }, [gameMode, quiz, hintLettersMeta /*, updateWordModeRevealedParagraph */]);

  // 초성/섞기 모드에서 모든 글자가 정답이 되었을 때 자동 완료 처리
  useEffect(() => {
    if ((gameMode === 'consonant' || gameMode === 'shuffle') && 
        gameStarted && 
        currentStage === 'quiz' &&
        originalParagraph && 
        liveFeedback && 
        liveFeedback.length === originalParagraph.length) {
      
      // 모든 비공백 글자가 'correct'인지 확인
      let allNonSpaceCorrect = true;
      for (let i = 0; i < originalParagraph.length; i++) {
        if (originalParagraph[i] !== ' ') {
          if (liveFeedback[i] !== 'correct') {
            allNonSpaceCorrect = false;
            break;
          }
        }
      }
      
      if (allNonSpaceCorrect) {
        const finalSentence = revealedParagraph.join('');
        checkSolution();
      }
    }
  }, [gameMode, gameStarted, currentStage, originalParagraph, liveFeedback, revealedParagraph, checkSolution]);

  useEffect(() => {
    if (allSolved && currentStage === 'quiz' && gameStarted) {
      // 게임이 이미 checkSolution에 의해 처리되었을 것이므로 특별한 처리 불필요
    }
  }, [allSolved, currentStage, gameStarted]);
  
  const loadStats = useCallback(() => {
    if (typeof window !== 'undefined') {
      const savedStatsData = localStorage.getItem(STATS_LOCAL_STORAGE_KEY);
      if (savedStatsData) {
        try {
          const parsedStats = JSON.parse(savedStatsData);
          dispatchStats(parsedStats);
        } catch (e) {
          console.error("[useGameLogic] Failed to parse stats from localStorage:", e);
          dispatchStats(initialStats); // 파싱 실패 시 초기 통계로 리셋
        }
      }
    }
  }, [dispatchStats]);

  const saveStats = useCallback((newStatsToSave) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STATS_LOCAL_STORAGE_KEY, JSON.stringify(newStatsToSave));
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    saveStats(gameStats);
  }, [gameStats, saveStats]);

  // 진행도 계산 (모든 모드 통합)
  const progressValue = useMemo(() => {
    if (allSolved) return 100;
    if (gameMode === 'word') {
      if (!quiz || quiz.length === 0) return 0;
      const solvedCount = quiz.filter(q => q.solved).length;
      return (solvedCount / quiz.length) * 100;
    }
    if (gameMode === 'consonant' || gameMode === 'shuffle') {
      // 초성/섞기 모드는 revealedParagraph와 originalParagraph 비교로 진행도 계산
      if (revealedParagraph.length > 0 && originalParagraph) {
        const similarity = calculateSimilarity(revealedParagraph.join(''), originalParagraph);
        return Math.min(similarity, 100); // calculateSimilarity는 0-100 반환
      }
      return 0;
    }
    return 0;
  }, [allSolved, gameMode, quiz, revealedParagraph, originalParagraph]); // revealedParagraph, originalParagraph 의존성 추가

  const startPractice = useCallback(async (paragraph, mode) => {
    const cleanedParagraph = validateParagraph(paragraph);
    if (cleanedParagraph) {
      setOriginalParagraph(cleanedParagraph);
      setGameMode(mode);

      // 각 모드에 맞는 게임 시작 함수를 호출합니다.
      switch (mode) {
        case GAME_MODES.WORD:
          startWordGame(cleanedParagraph);
          break;
        case GAME_MODES.CONSONANT:
          startConsonantGame(cleanedParagraph);
          break;
        case GAME_MODES.SHUFFLE:
          startShuffleGame(cleanedParagraph);
          break;
        default:
          notifyError('알 수 없는 게임 모드입니다.');
          return;
      }
      
      setCurrentStage('quiz');

      // 비동기적으로 공유 링크 생성
      try {
        const link = await createShareLink(cleanedParagraph, mode);
        if (link) {
          setShareLink(link);
          setIsShareModalOpen(true);
          notifyGameStart("퀴즈 생성 완료! 친구에게 공유해보세요!");
        } else {
          notifyGameStart();
        }
      } catch (error) {
        console.error('Error creating share link:', error);
        notifyGameStart();
      }
    }
  }, [
    validateParagraph, 
    startWordGame, 
    startConsonantGame, 
    startShuffleGame, 
    createShareLink, 
    notifyError, 
    notifyGameStart, 
    setOriginalParagraph, 
    setGameMode, 
    setCurrentStage, 
    setShareLink, 
    setIsShareModalOpen
  ]);

  // !!! 여기가 문제의 return 문입니다. 이 위에 모든 필요한 함수 정의가 와야 합니다. !!!
  return {
    gameMode,
    gameState: {
      currentStage,
      paragraph: originalParagraph,
      quiz,
      revealedParagraph,
      hintLettersMeta,
      charGrid,
      clues,
    },
    originalParagraph,
    setOriginalParagraph,
    revealedParagraph,
    setRevealedParagraph,
    currentStage,
    setCurrentStage,
    isAdModalOpen,
    setIsAdModalOpen,
    isGameFinished: allSolved,
    setIsGameFinished,
    gameStats: gameStats,
    isShareModalOpen, 
    setIsShareModalOpen, 
    startTodaysChallenge,
    stats: gameStats,               
    isStatsModalOpen,    
    setIsStatsModalOpen, 
    notifyError,
    notifySuccess,
    notifyInfo,
    notifyGameStart,
    notifyQuizComplete,
    notifyTryAgain,
    todaysChallengeInfo,
    currentTutorialMode, 
    markTutorialAsShown, 
    closeTutorial,       
    toast,           
    handleSubmitWordAnswer,
    validateParagraph,
    shuffledSentenceProblem,
    liveFeedback,
    isHintSelectionModalOpen,
    setIsHintSelectionModalOpen,
    availableHints,
    setAvailableHints,
    usedHintsCount,
    setUsedHintsCount,
    startAdForHint,
    onAdCompleted,
    applySelectedHint,
    startPractice,
    // 공유 버튼을 위한 핸들러 추가
    handleGenerateShareLink,
    handleGenerateConsonantShareLink,
    handleGenerateShuffleShareLink
  };
};

export default useGameLogic;