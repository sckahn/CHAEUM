import React from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Award, RefreshCcw } from 'lucide-react';

const ParagraphDisplay = ({ paragraph, title }) => {
  if (!paragraph) return null;
  const words = paragraph.split(/(\s+)/);

  return (
    <div className="mb-6">
      <h4 className="text-lg font-semibold text-gray-700 mb-2 text-center">{title}</h4>
      <div className="text-xl font-medium p-4 bg-gray-100 rounded-md shadow-inner text-center leading-relaxed">
        {words.map((word, wordIndex) => (
          <React.Fragment key={`word-revealed-${wordIndex}`}>
            {word.match(/\s+/) ? (
              <span>{word}</span>
            ) : (
              <span className="inline-block mx-0.5">
                {word.split('').map((char, charIndex) => (
                  <span key={`char-revealed-${wordIndex}-${charIndex}`} className="paragraph-char">
                    {char === '_' ? (
                      <span className="text-gray-400">_</span>
                    ) : (
                      <span className="text-gray-800">{char}</span>
                    )}
                  </span>
                ))}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};


const GuessStage = ({
  originalParagraph,
  revealedParagraph,
  score,
  guessedParagraph,
  setGuessedParagraph,
  handleGuessParagraph,
  similarity,
  resetGame,
}) => {
  return (
    <motion.div 
      className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-2xl space-y-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">최종 단계: 문장 추측</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          지금까지 푼 퀴즈와 드러난 문장을 바탕으로 원래 문장을 추측하여 입력해주세요!
        </p>
      </div>

      <div className="bg-gray-100 p-3 sm:p-4 rounded-lg shadow-inner">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2 text-center">현재까지 드러난 문장:</h3>
        <p className="text-center font-mono text-base sm:text-lg text-gray-800 p-2 bg-white rounded min-h-[60px] sm:min-h-[80px] flex items-center justify-center whitespace-pre-wrap break-all">
          {revealedParagraph || "문장이 아직 드러나지 않았습니다."}
        </p>
      </div>
      
      <Textarea
        placeholder="여기에 전체 문장을 추측하여 입력하세요..."
        value={guessedParagraph}
        onChange={(e) => setGuessedParagraph(e.target.value)}
        className="w-full min-h-[100px] sm:min-h-[120px] p-3 sm:p-4 text-sm sm:text-base border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
      />

      {similarity > 0 && (
        <div className={`text-center p-2 sm:p-3 rounded-md ${similarity >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <p className="font-semibold text-sm sm:text-base">문장 유사도: {similarity.toFixed(2)}%</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleGuessParagraph} 
          className="w-full sm:w-auto text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-2.5 shadow-md hover:shadow-lg transition-all duration-150 ease-in-out"
        >
          <Award className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> 추측 완료!
        </Button>
        <Button 
          onClick={resetGame} 
          variant="outline"
          className="w-full sm:w-auto text-xs sm:text-sm border-gray-300 text-gray-700 hover:bg-gray-100 py-2 sm:py-2.5"
        >
          <RefreshCcw className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> 새 게임 시작
        </Button>
      </div>
    </motion.div>
  );
};

export default GuessStage;
