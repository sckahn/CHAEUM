import React from 'react';
import { useGameLogic } from './contexts/GameLogicContext';
import { ThemeProvider } from './components/theme-provider';
import Header from './components/Header';
import Footer from './components/Footer';
import { Toaster } from './components/ui/toaster';
import StatsModal from './components/StatsModal';
import ShareLinkDialog from './components/ShareLinkDialog';
import AdBanner from './components/AdBanner';
import { ADSENSE_CONFIG } from './config';
import InputStage from './components/game-stages/InputStage';
import Game from './components/Game';

function App() {
  const {
    gameState,
    originalParagraph,
    setOriginalParagraph,
    startTodaysChallenge,
    startPractice,
    isShareModalOpen,
    setIsShareModalOpen,
    shareLink,
    isStatsModalOpen,
    setIsStatsModalOpen,
    gameStats,
    // 필요하다면 다른 상태나 함수 추가
  } = useGameLogic();

  // AdSense 배너 렌더링을 위한 래퍼 컴포넌트
  const AdSenseBannerWrapper = ({ slot, className = "" }) => {
    if (!ADSENSE_CONFIG.ENABLED) return null;
    
    return (
      <div className={`w-full flex justify-center py-2 ${className}`}>
        <AdBanner slot={slot} />
      </div>
    );
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Header onOpenStatsModal={() => setIsStatsModalOpen(true)} />
        <Toaster />

        <main className="flex-grow container mx-auto px-4 py-8 w-full">
          {gameState.currentStage === 'input' ? (
            <InputStage
              originalParagraph={originalParagraph}
              setOriginalParagraph={setOriginalParagraph}
              onStartPractice={startPractice}
              onStartTodaysChallenge={startTodaysChallenge}
            />
          ) : (
            <Game />
          )}
        </main>
        
        <Footer />
        <ShareLinkDialog 
          open={isShareModalOpen} 
          onOpenChange={setIsShareModalOpen} 
          shareLink={shareLink} 
        />
        <StatsModal 
          isOpen={isStatsModalOpen} 
          onClose={() => setIsStatsModalOpen(false)} 
          stats={gameStats}
          // onCopyResults={handleCopyChallengeResults} // 필요 시 다시 구현
        />
      </div>
    </ThemeProvider>
  );
}

export default App;

