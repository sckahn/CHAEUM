import React from 'react';
import PropTypes from 'prop-types';

const statusClasses = {
  correct: 'text-gray-800 dark:text-gray-200',
  incorrect: 'text-red-500',
  empty: 'text-gray-400 dark:text-gray-500',
};

export function RevealedParagraph({ charGrid, paragraph }) {
  // 단어 모드(charGrid 사용)와 이전 모드(paragraph 사용) 호환
  const displayGrid = charGrid || (Array.isArray(paragraph) ? paragraph : paragraph?.split('')).map(char => ({
    value: char,
    type: char === ' ' ? 'space' : 'char',
    status: 'correct' // paragraph가 넘어올 경우엔 항상 정답 상태로 간주
  }));

  if (!displayGrid) return null;

  return (
    <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner">
      <p className="whitespace-pre-wrap text-2xl md:text-3xl leading-relaxed tracking-wider text-center font-serif">
        {displayGrid.map((cell, index) => {
          if (cell.type === 'space') {
            return <span key={index}> </span>;
          }
          const charClass = statusClasses[cell.status] || statusClasses.empty;
          const displayChar = cell.value || '＿';
          
          return (
            <span key={index} className={`transition-colors duration-300 ${charClass}`}>
              {displayChar}
            </span>
          );
        })}
      </p>
    </div>
  );
}

RevealedParagraph.propTypes = {
  charGrid: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    value: PropTypes.string,
    status: PropTypes.string,
    isRevealed: PropTypes.bool,
  })),
  paragraph: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
}; 