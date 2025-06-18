import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
// Textarea는 더 이상 사용하지 않으므로 주석 처리 또는 삭제 가능
// import { Textarea } from '@/components/ui/textarea'; 
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, HelpCircle, Eye, EyeOff, RefreshCw, ThumbsUp, Lightbulb, Send, Shuffle, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { generateConsonantSentence } from '@/lib/korean-utils';
import { cn } from "@/lib/utils";
import AdModal from '@/components/modals/AdModal';
import HintSelectionModal from '@/components/modals/HintSelectionModal';

const QuizStage = ({
  gameMode,
  resetGame,
  progressValue,
  quiz,
  handleAnswerChange, // Callback to notify useGameLogic of answer changes
  checkSolution,    // Callback to trigger solution check in useGameLogic
  allSolved,
  originalParagraph,
  revealedParagraph, // Comes from useGameLogic, reflects the current state of revealed/guessed characters
  handleSubmitWordAnswer,
  shuffledSentenceProblem,
  liveFeedback, // Array of feedback states per character
  // 광고 및 힌트 관련 props 추가
  isAdModalOpen,
  setIsAdModalOpen,
  isHintSelectionModalOpen,
  setIsHintSelectionModalOpen,
  availableHints,
  startAdForHint,
  onAdCompleted,
  applySelectedHint,
  usedHintsCount
}) => {
  const [wordQuizInputs, setWordQuizInputs] = useState({});
  const [charInputValues, setCharInputValues] = useState({});
  const [manuallyResetChars, setManuallyResetChars] = useState(new Set());
  const [isComposing, setIsComposing] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState(null); // 현재 활성화된 입력 필드 추적

  const inputRefs = useRef({}); // 키는 `char-${originalIndex}` 또는 `word-${index}`
  const debounceTimeoutRef = useRef(null); // 디바운싱 타이머 참조
  const prevLiveFeedbackRef = useRef([]); // 이전 liveFeedback 상태 저장

  const palabrasClaveProblemBlocks = useCallback(() => {
    if (gameMode === 'word' || !originalParagraph) return []; // 단어퀴즈 모드이거나 원본 문장이 없으면 빈 배열 반환
    
    const problemStringSource = gameMode === 'consonant' && originalParagraph
      ? generateConsonantSentence(originalParagraph) 
      : (gameMode === 'shuffle' ? shuffledSentenceProblem : '');

    const originalWords = originalParagraph.split(' ');
    const problemWordsUnsafe = problemStringSource ? problemStringSource.split(' ') : [];
    const problemWords = originalWords.map((_, idx) => problemWordsUnsafe[idx] || '');

    const blocks = [];
    let currentGlobalCharIndex = 0; 

    // 글자섞기 모드에서는 3단어씩 나누기
    if (gameMode === 'shuffle') {
      let wordIndex = 0;
      while (wordIndex < originalWords.length) {
        // 3단어씩 또는 남은 단어들로 블록 생성
        const wordsInBlock = Math.min(3, originalWords.length - wordIndex);
        const blockWords = [];
        let blockStartIndex = currentGlobalCharIndex;
        
        for (let i = 0; i < wordsInBlock; i++) {
          const originalWord = originalWords[wordIndex + i];
          const currentProblemWordText = problemWords[wordIndex + i];
          const originalWordLen = originalWord.length;

          const wordCharsDisplay = []; 
          const problemWordTextChars = currentProblemWordText.split('');
          let problemCharIdx = 0; 

          for (let j = 0; j < originalWordLen; j++) {
            let charToDisplay = '';
            if (originalParagraph[currentGlobalCharIndex + j] !== ' ') {
              charToDisplay = problemWordTextChars[problemCharIdx] || ''; 
              problemCharIdx++;
            } else {
              charToDisplay = ' '; 
            }
            wordCharsDisplay.push({
              char: charToDisplay, 
              originalIndex: currentGlobalCharIndex + j, 
            });
          }
          
          blockWords.push({
            text: currentProblemWordText, 
            chars: wordCharsDisplay,     
            isLongWordBlock: false, 
            originalLength: originalWordLen, 
            startIndexInOriginal: currentGlobalCharIndex, 
            originalWordText: originalWord, 
          });

          currentGlobalCharIndex += originalWordLen + (wordIndex + i < originalWords.length - 1 ? 1 : 0);
        }

        blocks.push({
          words: blockWords,
          id: `block-${blocks.length}`,
          startIndex: blockStartIndex,
          isShuffleBlock: true, // 글자섞기 블록임을 표시
          firstCharHint: originalParagraph[blockStartIndex] // 첫 글자 힌트
        });

        wordIndex += wordsInBlock;
      }
    } else {
      // 기존 로직 (초성 퀴즈용)
      let currentBlockWordObjects = []; 

      originalWords.forEach((originalWord, wordIdx) => {
        const currentProblemWordText = problemWords[wordIdx]; 
        const originalWordLen = originalWord.length;

        if (originalWordLen >= 5 && currentBlockWordObjects.length > 0) {
          blocks.push({
            words: [...currentBlockWordObjects],
            id: `block-${blocks.length}`,
            startIndex: currentBlockWordObjects[0].startIndexInOriginal,
          });
          currentBlockWordObjects = []; 
        }

        const wordCharsDisplay = []; 
        const problemWordTextChars = currentProblemWordText.split('');
        let problemCharIdx = 0; 

        for (let i = 0; i < originalWordLen; i++) {
          let charToDisplay = '';
          if (originalParagraph[currentGlobalCharIndex + i] !== ' ') {
            charToDisplay = problemWordTextChars[problemCharIdx] || ''; 
            problemCharIdx++;
          } else {
            charToDisplay = ' '; 
          }
          wordCharsDisplay.push({
            char: charToDisplay, 
            originalIndex: currentGlobalCharIndex + i, 
          });
        }
        
        currentBlockWordObjects.push({
          text: currentProblemWordText, 
          chars: wordCharsDisplay,     
          isLongWordBlock: originalWordLen >= 5 && currentBlockWordObjects.length === 0, 
          originalLength: originalWordLen, 
          startIndexInOriginal: currentGlobalCharIndex, 
          originalWordText: originalWord, 
        });

        if (originalWordLen >= 5) {
          blocks.push({
            words: [...currentBlockWordObjects],
            id: `block-${blocks.length}`,
            startIndex: currentBlockWordObjects[0].startIndexInOriginal,
          });
          currentBlockWordObjects = []; 
        }
        currentGlobalCharIndex += originalWordLen + (wordIdx < originalWords.length - 1 ? 1 : 0); 
      });

      if (currentBlockWordObjects.length > 0) {
        blocks.push({
          words: [...currentBlockWordObjects],
          id: `block-${blocks.length}`,
          startIndex: currentBlockWordObjects[0].startIndexInOriginal,
        });
      }
    }
    return blocks;
  }, [originalParagraph, gameMode, shuffledSentenceProblem]);

  const problemBlocks = useMemo(palabrasClaveProblemBlocks, [palabrasClaveProblemBlocks]);

  useEffect(() => {
    if (gameMode === 'word') {
      if (quiz && quiz.length > 0) {
        const initialInputs = {};
        quiz.forEach((_, index) => {
          initialInputs[index] = '';
        });
        setWordQuizInputs(initialInputs);
        const firstUnsolvedIndex = quiz.findIndex(q => !q.solved);
        if (firstUnsolvedIndex !== -1 && inputRefs.current[`word-${firstUnsolvedIndex}`]) {
          inputRefs.current[`word-${firstUnsolvedIndex}`].focus();
        }
      }
      setCharInputValues({}); // 단어 퀴즈 모드에서는 charInputValues를 항상 비웁니다.
      setIsComposing(false); // 한글 조합 상태 초기화
    } else if (gameMode === 'consonant' || gameMode === 'shuffle') {
      if (originalParagraph) {
        const newCharInputs = {};
        
        // originalParagraph의 모든 비공백 인덱스에 대해 초기화
        originalParagraph.split('').forEach((char, index) => {
          if (char !== ' ') {
            // revealedParagraph가 있고 해당 인덱스에 값이 있으면 사용, 없으면 빈 문자열
            newCharInputs[index] = (revealedParagraph && revealedParagraph[index]) || '';
          }
        });
        
        setCharInputValues(newCharInputs);
      }
      setWordQuizInputs({}); // 초성/섞기 모드에서는 wordQuizInputs를 비웁니다.
      setIsComposing(false); // 한글 조합 상태 초기화
    }
  }, [gameMode, originalParagraph, quiz]);

  useEffect(() => {
    if (gameMode === 'consonant' || gameMode === 'shuffle') {
      // 피드백 히스토리 업데이트만 유지
      prevLiveFeedbackRef.current = liveFeedback ? [...liveFeedback] : [];
    }
  }, [liveFeedback, gameMode]);

  // 글자섞기 모드에서 첫 글자 힌트를 charInputValues에 미리 설정
  useEffect(() => {
    if (gameMode === 'shuffle' && originalParagraph && problemBlocks.length > 0) {
      const newCharInputs = { ...charInputValues };
      problemBlocks.forEach(block => {
        if (block.isShuffleBlock && block.firstCharHint) {
          newCharInputs[block.startIndex] = block.firstCharHint;
        }
      });
      setCharInputValues(newCharInputs);
    }
  }, [gameMode, originalParagraph, problemBlocks]);

  useEffect(() => {
    if ((gameMode === 'consonant' || gameMode === 'shuffle') && handleAnswerChange && originalParagraph) {
      // 기존 타이머가 있으면 취소
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // 디바운싱을 통해 성능 최적화 (한글 입력을 위해 적절한 시간 설정)
      const timeoutId = setTimeout(() => {
        // charInputValues와 revealedParagraph를 결합하여 최종 답안 구성
        let finalAnswerChars = Array(originalParagraph.length).fill('');
        
        for (let i = 0; i < originalParagraph.length; i++) {
          if (originalParagraph[i] === ' ') {
            finalAnswerChars[i] = ' ';
          } else {
            // 우선순위: charInputValues -> revealedParagraph -> 빈 문자열
            const charInputValue = charInputValues[String(i)];
            const revealedValue = revealedParagraph && revealedParagraph[i];
            
            if (charInputValue !== undefined && charInputValue !== '') {
              finalAnswerChars[i] = charInputValue;
            } else if (revealedValue !== undefined && revealedValue !== '') {
              finalAnswerChars[i] = revealedValue;
            } else {
              finalAnswerChars[i] = '';
            }
          }
        }
        
        const finalAnswerString = finalAnswerChars.join('');
        // activeInputIndex 정보도 함께 전달
        handleAnswerChange(finalAnswerString, activeInputIndex);
        debounceTimeoutRef.current = null; // 타이머 완료 후 참조 제거
      }, 100); // 100ms로 디바운싱 단축 (더 즉각적인 피드백)
      
      debounceTimeoutRef.current = timeoutId;
      
      return () => {
        clearTimeout(timeoutId);
        debounceTimeoutRef.current = null;
      };
    }
  }, [charInputValues, revealedParagraph, gameMode, handleAnswerChange, originalParagraph, activeInputIndex]);

  // 즉시 입력을 처리하는 함수 (엔터 키 등에서 사용)
  const flushInput = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    if ((gameMode === 'consonant' || gameMode === 'shuffle') && handleAnswerChange && originalParagraph) {
      let finalAnswerChars = Array(originalParagraph.length).fill('');
      
      for (let i = 0; i < originalParagraph.length; i++) {
        if (originalParagraph[i] === ' ') {
          finalAnswerChars[i] = ' ';
        } else {
          const charInputValue = charInputValues[String(i)];
          const revealedValue = revealedParagraph && revealedParagraph[i];
          
          if (charInputValue !== undefined && charInputValue !== '') {
            finalAnswerChars[i] = charInputValue;
          } else if (revealedValue !== undefined && revealedValue !== '') {
            finalAnswerChars[i] = revealedValue;
          } else {
            finalAnswerChars[i] = '';
          }
        }
      }
      
      const finalAnswerString = finalAnswerChars.join('');
      handleAnswerChange(finalAnswerString, activeInputIndex);
    }
  }, [gameMode, handleAnswerChange, originalParagraph, charInputValues, revealedParagraph, activeInputIndex]);

  const handleWordQuizInputChange = (index, value) => {
    setWordQuizInputs(prev => ({ ...prev, [index]: value }));
  };

  const handleWordQuizSubmit = (index) => {
    if (handleSubmitWordAnswer && wordQuizInputs[index] !== undefined) {
      handleSubmitWordAnswer(index, wordQuizInputs[index]);
    }
  };

  const handleCharInputChange = (originalIndex, value) => {
    if (gameMode === 'word') return;
    
    // 현재 입력 중인 필드 설정
    setActiveInputIndex(originalIndex);
    
    // 정답으로 처리된 글자는 수정 불가 (더블클릭으로 재설정된 경우 제외)
    if (liveFeedback && liveFeedback[originalIndex] === 'correct' && !manuallyResetChars.has(originalIndex)) {
      return;
    }
    
    // 마지막 글자만 사용
    const finalValue = value.slice(-1);
    
    // 모든 한글 문자 허용 (자음, 모음, 완성형 모두)
    setCharInputValues(prev => {
      const newValues = {
        ...prev,
        [originalIndex]: finalValue,
      };
      
      // 정답인지 확인하고 다음 필드로 이동
      if (finalValue && originalParagraph && originalParagraph[originalIndex] === finalValue) {
        // 정답이면 자동으로 다음 빈 칸으로 포커스 이동
        setTimeout(() => {
          for (let j = originalIndex + 1; j < originalParagraph.length; j++) {
            if (originalParagraph[j] !== ' ' && 
                (!liveFeedback[j] || liveFeedback[j] !== 'correct') &&
                (!newValues[j] || newValues[j] === '')) { // 업데이트된 newValues 사용
              const nextInputRefKey = `char-${j}`;
              if (inputRefs.current[nextInputRefKey]) {
                inputRefs.current[nextInputRefKey].focus();
                setActiveInputIndex(j);
                break;
              }
            }
          }
        }, 50); // 약간의 지연으로 상태 업데이트 완료 대기
      }
      
      return newValues;
    });
  };

  const handleKeyPress = (originalIndex, event) => {
    if (event.key === 'Enter') {
      // 기본 엔터 동작 방지
      event.preventDefault();
      
      // 현재 활성 입력 즉시 클리어 (다른 칸으로 값 전파 방지)
      setActiveInputIndex(null);
      
      // 엔터 키를 누르면 즉시 현재 입력을 처리
      flushInput();
      
      // 약간의 지연 후 다음 칸으로 이동 (상태 업데이트 완료 대기)
      setTimeout(() => {
        // Enter 키로 다음 칸으로 이동 (정답인 칸에서도 가능)
        for (let j = originalIndex + 1; j < originalParagraph.length; j++) {
          if (originalParagraph[j] !== ' ' && 
              (!liveFeedback[j] || liveFeedback[j] !== 'correct')) {
            const nextInputRefKey = `char-${j}`;
            if (inputRefs.current[nextInputRefKey]) {
              inputRefs.current[nextInputRefKey].focus();
              break;
            }
          }
        }
      }, 20); // 20ms로 지연 시간 단축
    }
  };

  const handleCompositionStart = (originalIndex) => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (originalIndex, event) => {
    setIsComposing(false);
    
    // 자동 포커스 이동 제거 - 사용자가 직접 이동하도록 함
  };

  const handleCharDoubleClick = (originalIndex) => {
    // 정답인 글자를 더블클릭하면 다시 수정할 수 있도록 허용
    if (liveFeedback && liveFeedback[originalIndex] === 'correct') {
      setManuallyResetChars(prev => new Set([...prev, originalIndex]));
      // 해당 칸을 비우고 포커스
      setCharInputValues(prev => ({ ...prev, [originalIndex]: '' }));
      if (inputRefs.current[`char-${originalIndex}`]) {
        inputRefs.current[`char-${originalIndex}`].focus();
      }
    }
  };

  // 힌트 적용을 위한 charInputValues 업데이트 callback
  const updateCharInputFromHint = useCallback((index, value) => {
    setCharInputValues(prev => {
      const updated = { ...prev, [index]: value };
      return updated;
    });
    
    // 힌트로 얻은 글자는 수정 불가능하도록 manuallyResetChars에서 제거
    setManuallyResetChars(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, []);

  // 초성퀴즈 전용 플레이스홀더 생성 함수
  const getConsonantPlaceholder = useCallback((char) => {
    if (char === ' ') return ' ';
    if (!/[가-힣]/.test(char)) return char; // 한글이 아닌 문자는 그대로
    
    // 한글 문자의 초성 추출
    const consonantMap = {
      'ㄱ': 'ㄱ', 'ㄲ': 'ㄲ', 'ㄴ': 'ㄴ', 'ㄷ': 'ㄷ', 'ㄸ': 'ㄸ',
      'ㄹ': 'ㄹ', 'ㅁ': 'ㅁ', 'ㅂ': 'ㅂ', 'ㅃ': 'ㅃ', 'ㅅ': 'ㅅ',
      'ㅆ': 'ㅆ', 'ㅇ': 'ㅇ', 'ㅈ': 'ㅈ', 'ㅉ': 'ㅉ', 'ㅊ': 'ㅊ',
      'ㅋ': 'ㅋ', 'ㅌ': 'ㅌ', 'ㅍ': 'ㅍ', 'ㅎ': 'ㅎ'
    };
    
    const code = char.charCodeAt(0) - 0xAC00;
    const choIndex = Math.floor(code / 588);
    const consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    
    return consonants[choIndex] || 'ㅇ';
  }, []);

  const handleSubmit = () => {
    if (gameMode === 'word') {
      console.warn("[QuizStage] handleSubmit called in 'word' mode. Word quiz uses individual submit buttons.");
      return;
    }
    // 초성/섞기 퀴즈의 '정답 확인' 버튼 로직
    if ((gameMode === 'consonant' || gameMode === 'shuffle') && checkSolution) {
      // charInputValues를 기반으로 현재 답변을 구성하여 checkSolution에 전달할 필요가 있는지,
      // 아니면 useGameLogic이 revealedParagraph를 직접 참조하는지에 따라 달라짐.
      // 현재 checkSolution은 인자를 받지 않으므로, useGameLogic에서 revealedParagraph를 사용할 것으로 가정.
      // handleAnswerChange가 이미 revealedParagraph를 업데이트했을 것이므로, checkSolution()만 호출.
      checkSolution(); 
    }
  };
  
  const renderSentenceToComplete = () => { // 단어 퀴즈용 상단 문장 표시 (거의 변경 없음)
    // ... 기존 코드 유지 ...
    // (내부 revealedParagraph 사용 방식은 그대로)
    if (!originalParagraph || originalParagraph.length === 0) return null;

    const displayChars = revealedParagraph && revealedParagraph.length === originalParagraph.length 
      ? revealedParagraph 
      : Array(originalParagraph.length).fill('');

    return (
      <div className="mb-8 p-4 bg-gray-100 rounded-lg shadow">
        <p className="text-sm text-gray-700 mb-2 text-center font-semibold">[ 완성할 문장 ]</p>
        <div className="flex flex-wrap justify-center items-center space-x-1 text-xl sm:text-2xl font-medium">
          {originalParagraph.split('').map((origChar, index) => (
            <span 
              key={`sentence-char-${index}`}
              className={`px-1 py-1 my-1 rounded-md ${
                displayChars[index] && displayChars[index] !== ' ' ? 'bg-green-200 text-green-800' : 
                origChar === ' ' ? 'mx-1' : 'bg-gray-300 text-gray-300'
              }`}
              style={{ minWidth: origChar === ' ' ? '0.5em' : '1em', display: 'inline-block' }}
            >
              {displayChars[index] && displayChars[index] !== ' ' ? displayChars[index] : (origChar === ' ' ? ' ' : '_')}
            </span>
          ))}
        </div>
      </div>
    );
  };


  const renderWordQuiz = () => { // 단어 퀴즈 UI (거의 변경 없음)
    // ... 기존 코드 유지 ...
    if (!quiz || quiz.length === 0) {
      if (gameMode === 'word' && originalParagraph && revealedParagraph && revealedParagraph.join('') === originalParagraph && !quiz.find(q => !q.solved)) {
         return <p className="text-green-500">모든 단어 퀴즈를 풀었습니다!</p>;
      }
      return <p>단어 퀴즈를 불러오는 중이거나, 생성된 퀴즈가 없습니다.</p>;
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">힌트 단어 (총 {quiz.length}개):</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quiz.map((clue, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  className={cn(
                    "flex flex-col justify-between h-full",
                    clue.solved ? "bg-green-50 border-green-200" : "bg-white"
                  )}
                >
                  <CardHeader>
                    <CardTitle className="text-base font-medium text-blue-600">
                      힌트 {index + 1}: {clue.meaning}
                    </CardTitle>
                    <div className="mt-2 text-center text-lg tracking-wider">
                      {clue.clueWordDisplayChars && clue.clueWordDisplayChars.map((dc, charIndex) => (
                        <span
                          key={charIndex}
                          className={cn(
                            "inline-block mx-0.5 px-1",
                            clue.solved
                              ? "text-green-600"
                              : dc.inOriginalParagraph
                                ? "border-b-2 border-black"
                                : "border-b-2 border-gray-400"
                          )}
                          style={{ minWidth: '1em' }}
                        >
                          {clue.solved ? dc.char : '_'}
                        </span>
                      ))}
                      <span className="ml-1 text-xs text-gray-500">({clue.clueWord.length}글자)</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {!clue.solved ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <Input 
                          ref={el => inputRefs.current[`word-${index}`] = el}
                          type="text" 
                          value={wordQuizInputs[index] || ''}
                          onChange={(e) => handleWordQuizInputChange(index, e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleWordQuizSubmit(index)}
                          placeholder={`${clue.clueWord.length}글자 단어 입력`}
                          className="text-base"
                          disabled={clue.solved}
                        />
                        <Button 
                          onClick={() => handleWordQuizSubmit(index)} 
                          disabled={clue.solved || !wordQuizInputs[index]} 
                          size="sm"
                          className="flex items-center justify-center px-3 whitespace-nowrap"
                        >
                          제출
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center mt-1">
                        <p className="text-xl font-bold text-green-600">{clue.userInput || clue.clueWord}</p>
                        <p className="text-sm text-green-500">정답!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderConsonantShuffleQuiz = (modeName, bgColor, textColor, borderColor, ringColor) => {
    if (!originalParagraph) return <p>문제를 불러오는 중입니다...</p>;

    const isAnyCharInputFilled = Object.values(charInputValues).some(val => val && val.trim() !== '');

    // 글자섞기 모드에서 사용된 힌트 글자들을 추적하기 위한 로직
    const usedHintChars = {};
    const totalCharCounts = {};
    if (gameMode === 'shuffle') {
      // 전체 문장에서 각 글자의 총 개수 계산
      originalParagraph.split('').forEach(char => {
        if (char !== ' ') {
          totalCharCounts[char] = (totalCharCounts[char] || 0) + 1;
        }
      });
      
      // 첫 글자 힌트들을 먼저 수집
      const firstCharHints = new Set();
      problemBlocks.forEach(block => {
        if (block.isShuffleBlock && block.firstCharHint) {
          firstCharHints.add(block.startIndex);
          // 첫 글자 힌트도 사용된 것으로 계산
          const hintChar = block.firstCharHint;
          usedHintChars[hintChar] = (usedHintChars[hintChar] || 0) + 1;
        }
      });
      
      // 사용자가 입력한 모든 글자를 세어봅니다 (첫 글자 힌트는 제외)
      Object.entries(charInputValues).forEach(([index, inputChar]) => {
        const indexNum = parseInt(index);
        if (inputChar && inputChar.trim() !== '' && !firstCharHints.has(indexNum)) {
          usedHintChars[inputChar] = (usedHintChars[inputChar] || 0) + 1;
        }
      });
    }

    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className={`text-xl sm:text-2xl text-center ${textColor}`}>{modeName} 퀴즈</CardTitle>
          <p className="text-sm text-gray-600 text-center">
            {modeName === '초성' ? '제시된 초성을 보고 원래 문장을 맞춰보세요.' : '섞인 글자들을 배열하여 원래 문장을 만들어보세요.'}
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            💡 <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> 키를 누르면 다음 칸으로 이동합니다
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 상단 힌트 섹션 - 초성퀴즈는 플레이스홀더가 있으니 숨김 */}
          {gameMode !== 'consonant' && (
            <div className={`p-3 sm:p-4 rounded-lg shadow-inner ${bgColor}`}>
              {gameMode === 'shuffle' ? (
                // 글자섞기 모드: 전체 글자들을 한번에 표시
                <div className="border rounded-md p-3 sm:p-4 bg-white/50 border-purple-300">
                  <div className="text-center mb-3">
                    <span className="text-sm sm:text-base text-gray-600 font-medium">
                      사용할 글자들
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    {/* 전체 문장의 글자들을 모두 수집 */}
                    {(() => {
                      const allChars = [];
                      problemBlocks.forEach(block => {
                        block.words.forEach(wordItem => {
                          wordItem.chars.forEach(charObj => {
                            const isOriginalSpace = originalParagraph[charObj.originalIndex] === ' ';
                            if (!isOriginalSpace) {
                              allChars.push(charObj);
                            }
                          });
                        });
                      });
                      
                      return allChars.map((charObj, charIndex) => {
                        // 글자섞기 모드에서 힌트 글자 색상 결정
                        let hintCharClass = textColor;
                        let remainingCount = 0;
                        
                        const usedCount = usedHintChars[charObj.char] || 0;
                        const totalCount = totalCharCounts[charObj.char] || 0;
                        remainingCount = totalCount - usedCount;
                        
                        if (usedCount > 0) {
                          if (remainingCount <= 0) {
                            // 모두 사용됨 - 완전히 취소선
                            hintCharClass = 'text-gray-400 line-through';
                          } else {
                            // 부분적으로 사용됨 - 연한 회색
                            hintCharClass = 'text-gray-500';
                          }
                        }
                        
                        return (
                          <span 
                            key={`hint-char-${charObj.originalIndex}-${charIndex}`}
                            className={cn(
                              "inline-block text-base sm:text-lg lg:text-xl px-1.5 sm:px-2 py-1 rounded border min-w-[1.8em] sm:min-w-[2em] text-center font-semibold transition-all duration-200 relative",
                              hintCharClass,
                              (usedHintChars[charObj.char] || 0) > 0 ? 
                                'bg-gray-100 border-gray-300' : 'bg-white border-gray-400'
                            )}
                          >
                            {charObj.char || '_'}
                            {/* 글자섞기 모드에서 남은 개수 표시 */}
                            {(usedHintChars[charObj.char] || 0) > 0 && remainingCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center text-[10px] sm:text-xs">
                                {remainingCount}
                              </span>
                            )}
                          </span>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                // 초성 모드: 완전히 단어 단위로 처리
                <div className="border rounded-md p-3 sm:p-4 bg-white/50 border-blue-300">
                  <div className="text-center mb-3">
                    <span className="text-sm sm:text-base text-gray-600 font-medium">
                      초성 힌트
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    lineHeight: 1.5
                  }}>
                    {(() => {
                      const words = originalParagraph.split(' ');
                      const consonantSentence = generateConsonantSentence(originalParagraph);
                      const consonantWords = consonantSentence.split(' ');
                      
                      return words.map((word, wordIndex) => {
                        const consonantWord = consonantWords[wordIndex] || '';
                        
                        return (
                          <div
                            key={`word-${wordIndex}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              padding: '4px 6px'
                            }}
                          >
                            {word.split('').map((char, charIndex) => (
                              <span
                                key={`${wordIndex}-${charIndex}`}
                                style={{
                                  display: 'inline-block',
                                  border: '1px solid #9CA3AF',
                                  borderRadius: '3px',
                                  backgroundColor: 'white',
                                  padding: '3px 5px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#1E40AF',
                                  minWidth: '20px',
                                  textAlign: 'center'
                                }}
                              >
                                {consonantWord[charIndex] || char}
                              </span>
                            ))}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 하단 입력 섹션 */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-3 text-center">
              {modeName === '초성' ? '각 칸에 해당하는 글자를 입력하세요:' : '위의 글자들을 사용하여 문장을 완성하세요:'}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2">
              {originalParagraph.split('').map((origChar, index) => {
                const isOriginalSpace = origChar === ' ';
                if (isOriginalSpace) {
                  return <span key={`space-${index}`} className="w-4 h-8 inline-block"> </span>;
                }

                const feedbackStatus = liveFeedback && liveFeedback[index];
                
                // 글자섞기 모드에서 첫 글자 힌트 체크
                const isFirstCharInBlock = gameMode === 'shuffle' && problemBlocks.some(block => 
                  block.isShuffleBlock && block.startIndex === index
                );
                
                return (
                  <div key={`input-container-${index}`} className="flex flex-col items-center">
                    <Input
                      ref={el => inputRefs.current[`char-${index}`] = el}
                      type="text"
                      value={isFirstCharInBlock ? origChar : (charInputValues[index] || '')}
                      onChange={(e) => !isFirstCharInBlock && handleCharInputChange(index, e.target.value)}
                      onFocus={(e) => {
                        if (!isFirstCharInBlock) {
                          setActiveInputIndex(index);
                          // 포커스를 받을 때 해당 필드가 비어있어야 하는 경우 클리어
                          if (!charInputValues[index] && e.target.value) {
                            e.target.value = '';
                          }
                        }
                      }}
                      onBlur={() => {
                        // 100ms 후에 activeInputIndex 클리어 (디바운싱과 맞춤)
                        setTimeout(() => setActiveInputIndex(null), 100);
                      }}
                      onCompositionStart={(e) => !isFirstCharInBlock && handleCompositionStart(index, e)}
                      onCompositionEnd={(e) => !isFirstCharInBlock && handleCompositionEnd(index, e)}
                      onDoubleClick={() => !isFirstCharInBlock && handleCharDoubleClick(index)}
                      onKeyDown={(e) => !isFirstCharInBlock && handleKeyPress(index, e)}
                      placeholder={gameMode === 'consonant' ? getConsonantPlaceholder(origChar) : ''}
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 p-0 text-center text-base sm:text-lg font-medium border-2 rounded-md transition-all duration-200",
                        isFirstCharInBlock ? 
                          'border-green-500 bg-green-100 text-green-700 cursor-not-allowed' :
                        feedbackStatus === 'correct' && !manuallyResetChars.has(index) ? 
                          'border-green-500 bg-green-50 text-green-700' : 
                        feedbackStatus === 'incorrect' ? 
                          'border-red-500 bg-red-50 text-red-700' :
                          `border-gray-300 focus:border-${borderColor} focus:ring-2 focus:ring-${ringColor}`,
                        gameMode === 'consonant' && !charInputValues[index] ? 'placeholder:text-gray-400 placeholder:text-sm' : ''
                      )}
                      aria-label={`글자 ${index + 1} 입력`}
                      disabled={allSolved}
                      readOnly={isFirstCharInBlock || (liveFeedback && liveFeedback[index] === 'correct' && !manuallyResetChars.has(index))}
                      title={isFirstCharInBlock ? "힌트로 제공된 첫 글자입니다" : ""}
                    />
                    <span className="text-xs text-gray-500 mt-1">
                      {index + 1}
                      {isFirstCharInBlock && <span className="text-green-600 ml-1">💡</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {allSolved && originalParagraph && (
            <div className="p-3 text-center bg-green-50 rounded-lg">
              <p className="text-sm font-semibold text-green-700 mb-1">정답!</p>
              <p className="text-base sm:text-lg text-green-600 font-medium">{originalParagraph}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-3 pt-6">
          <Button 
            onClick={handleSubmit}
            className={`w-full max-w-xs ${allSolved || !isAnyCharInputFilled ? 'bg-gray-400 cursor-not-allowed' : `bg-${borderColor} hover:bg-${textColor}/90`} text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-150`}
            disabled={allSolved || !isAnyCharInputFilled }
          >
            {allSolved ? <CheckCircle className="mr-2 h-5 w-5" /> : (gameMode === 'consonant' ? <Lightbulb className="mr-2 h-5 w-5" /> : <Shuffle className="mr-2 h-5 w-5" />)} 
            {allSolved ? `${modeName} 완료!` : '정답 확인'}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {gameMode === 'word' && renderSentenceToComplete()} 
        {gameMode === 'word' && renderWordQuiz()}
        {gameMode === 'consonant' && renderConsonantShuffleQuiz('초성', 'bg-blue-50', 'text-blue-700', 'blue-600', 'blue-500')}
        {gameMode === 'shuffle' && renderConsonantShuffleQuiz('글자 섞기', 'bg-purple-50', 'text-purple-700', 'purple-600', 'purple-500')}
      </motion.div>

      <div className="mt-6 sm:mt-8 flex flex-col items-center space-y-3">
        <Button 
          onClick={resetGame} 
          variant="outline"
          className="text-sm sm:text-base border-gray-300 hover:bg-gray-100 hover:text-gray-800 transition-colors duration-150 py-2 px-4 sm:py-2.5 sm:px-6 rounded-lg shadow-sm"
        >
          <RefreshCw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> 새 게임 시작 / 설정으로
        </Button>
        
        {/* 광고보고 답보기 버튼 추가 */}
        {!allSolved && (
          <Button 
            onClick={startAdForHint} 
            variant="outline"
            className="text-sm sm:text-base border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 py-2 px-4 sm:py-2.5 sm:px-6 rounded-lg shadow-sm"
            disabled={usedHintsCount >= 3}
          >
            <Eye className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> 
            광고보고 한글자 알아내기 ({usedHintsCount}/3회 사용)
          </Button>
        )}
      </div>

      {!allSolved && progressValue > 0 && gameMode !== 'word' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm shadow-top z-50">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">진행도:</span>
              <span className={`text-sm font-bold ${progressValue === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                {Math.round(progressValue)}%
              </span>
            </div>
            <Progress value={progressValue} className="w-full h-2 sm:h-2.5" />
          </div>
        </div>
      )}
       {/* 단어 퀴즈용 진행도 표시 (개별 단어 점수 기반) */}
      {!allSolved && progressValue > 0 && gameMode === 'word' && quiz && quiz.length > 0 && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm shadow-top z-50">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">단어 진행도:</span>
              <span className={`text-sm font-bold ${progressValue === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                {quiz.filter(q => q.solved).length} / {quiz.length} 개 해결
              </span>
            </div>
            <Progress value={(quiz.filter(q => q.solved).length / quiz.length) * 100} className="w-full h-2 sm:h-2.5" />
          </div>
        </div>
      )}
      
      {/* 광고 모달 */}
      <AdModal 
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onAdCompleted={onAdCompleted}
      />
      
      {/* 힌트 선택 모달 */}
      <HintSelectionModal 
        isOpen={isHintSelectionModalOpen}
        onClose={() => setIsHintSelectionModalOpen(false)}
        hints={availableHints}
        onSelectHint={(hintId) => applySelectedHint(hintId, updateCharInputFromHint)}
        gameMode={gameMode}
        originalParagraph={originalParagraph}
        quiz={quiz}
      />
    </div>
  );
};

export default QuizStage;     