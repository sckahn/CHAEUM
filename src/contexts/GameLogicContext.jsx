import React, { createContext, useContext } from 'react';
import { useGameLogic as useGameLogicHook } from '../hooks/useGameLogic';

const GameLogicContext = createContext(null);

export const GameLogicProvider = ({ children }) => {
  const gameLogic = useGameLogicHook();
  return (
    <GameLogicContext.Provider value={gameLogic}>
      {children}
    </GameLogicContext.Provider>
  );
};

export const useGameLogic = () => {
  const context = useContext(GameLogicContext);
  if (!context) {
    throw new Error('useGameLogic must be used within a GameLogicProvider');
  }
  return context;
}; 