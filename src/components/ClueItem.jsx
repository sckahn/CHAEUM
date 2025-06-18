import React from 'react';
import PropTypes from 'prop-types';
import { Lightbulb } from 'lucide-react';

export function ClueItem({ clue, meaning, targetChar, isSolved }) {
  const targetCharClass = isSolved
    ? 'line-through text-gray-500'
    : 'font-bold text-blue-600 dark:text-blue-400';

  return (
    <div className="flex items-center p-3 bg-white dark:bg-gray-700 rounded-lg shadow transition-colors duration-300">
      <div className="flex-shrink-0 mr-4">
        <Lightbulb className="w-6 h-6 text-yellow-500" />
      </div>
      <div className="flex-grow">
        <p className="text-sm text-gray-500 dark:text-gray-400">힌트단어: {clue}</p>
        <p className="text-md text-gray-800 dark:text-gray-200">{meaning}</p>
      </div>
      <div className="ml-4 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
        <span className={`text-lg transition-all duration-300 ${targetCharClass}`}>
          {targetChar}
        </span>
      </div>
    </div>
  );
}

ClueItem.propTypes = {
  clue: PropTypes.string.isRequired,
  meaning: PropTypes.string.isRequired,
  targetChar: PropTypes.string.isRequired,
  isSolved: PropTypes.bool.isRequired,
}; 