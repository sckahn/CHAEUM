import React from 'react';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

// 이 컴포넌트는 QuizStage.jsx의 복잡한 로직 중
// 자음/섞기 퀴즈의 입력 필드를 렌더링하는 부분만 단순화하여 가져온 것입니다.
export function ConsonantQuiz({ quiz, onAnswer, hintLettersMeta, revealedParagraph, mode }) {
  const handleInputChange = (e, index) => {
    // 입력 처리 로직 (간소화)
    // 실제 정답 확인 등은 useGameLogic에서 처리됩니다.
    // 여기서는 onAnswer 콜백을 통해 입력값을 상위로 전달하는 역할만 합니다.
    const newRevealedParagraph = [...revealedParagraph];
    newRevealedParagraph[index] = e.target.value;
    onAnswer(newRevealedParagraph.join(''));
  };

  if (!revealedParagraph) return <p>퀴즈를 불러오는 중입니다...</p>;

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 p-4 bg-gray-50 rounded-lg">
      {revealedParagraph.map((char, index) => {
        // 원본 문장의 공백은 그대로 렌더링
        if (quiz.originalParagraph && quiz.originalParagraph[index] === ' ') {
          return <span key={`space-${index}`} className="w-4 h-8 inline-block"></span>;
        }

        return (
          <Input
            key={`char-input-${index}`}
            type="text"
            maxLength="1"
            value={char || ''}
            onChange={(e) => handleInputChange(e, index)}
            className="w-10 h-10 p-0 text-center text-lg font-medium border-2 rounded-md"
            aria-label={`글자 ${index + 1} 입력`}
          />
        );
      })}
    </div>
  );
} 