import React from 'react';
import { useGameLogic } from '@/contexts/GameLogicContext';
import { Toaster } from './ui/toaster';
import Header from './Header';
import { RevealedParagraph } from './RevealedParagraph';
import { Quiz } from './Quiz';

function Game() {
  const {
    gameMode,
    gameState,
    handleWordModeInput,
    handleAnswer,
    handleHintLetterClick
  } = useGameLogic();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Toaster />

      {gameState.currentStage === 'quiz' && gameMode === 'word' && (
        <>
          <RevealedParagraph charGrid={gameState.charGrid} />
          <Quiz
            clues={gameState.clues}
            mode={gameMode}
            onClueInteraction={handleWordModeInput} 
          />
        </>
      )}

      {gameState.currentStage === 'quiz' && (gameMode === 'consonant' || gameMode === 'shuffle') && (
        <>
          <RevealedParagraph paragraph={gameState.revealedParagraph} />
          <Quiz
            quiz={gameState.quiz}
            onAnswer={handleAnswer}
            onHintLetterClick={handleHintLetterClick}
            mode={gameMode}
            hintLettersMeta={gameState.hintLettersMeta}
            revealedParagraph={gameState.revealedParagraph}
          />
        </>
      )}

    </div>
  );
}

export default Game; 