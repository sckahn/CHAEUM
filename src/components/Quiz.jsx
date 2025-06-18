import React from 'react';
import PropTypes from 'prop-types';
import { ClueItem } from './ClueItem'; // 단어 모드용
import { ConsonantQuiz } from './ConsonantQuiz'; // 자음/섞기 모드용 (새로 생성된 파일)

export function Quiz({ 
  mode, 
  quiz, 
  onAnswer, 
  onHintLetterClick, 
  hintLettersMeta, 
  revealedParagraph,
  // --- 단어 모드용 props ---
  clues,
  onClueInteraction,
}) {
  if (mode === 'word') { // 조건부 렌더링 명확하게 수정
    return (
      <div className="space-y-3">
        {clues.map((clue, index) => (
          <ClueItem
            key={index}
            clue={clue.clueWord}
            meaning={clue.meaning}
            targetChar={clue.targetChar}
            isSolved={clue.solved}
          />
        ))}
      </div>
    );
  }

  // 자음/섞기 모드
  if (mode === 'consonant' || mode === 'shuffle') {
    return (
      <ConsonantQuiz 
        quiz={quiz} // originalParagraph 포함 객체
        onAnswer={onAnswer}
        hintLettersMeta={hintLettersMeta}
        revealedParagraph={revealedParagraph}
        mode={mode}
      />
    );
  }

  return null; // 해당하는 모드가 없을 경우
}

Quiz.propTypes = {
  mode: PropTypes.string,
  quiz: PropTypes.any, // 다양한 형태의 퀴즈 데이터 수용
  onAnswer: PropTypes.func,
  onHintLetterClick: PropTypes.func,
  hintLettersMeta: PropTypes.array,
  revealedParagraph: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
  ]),
  clues: PropTypes.arrayOf(PropTypes.object),
  onClueInteraction: PropTypes.func,
}; 