import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shuffle, Send, Brain, Zap } from 'lucide-react';

const MAX_INPUT_LENGTH = 50; // 최대 입력 글자 수 정의

// Vite 환경 변수 읽기
const ADSENSE_ENABLED = import.meta.env.VITE_ADSENSE_ENABLED === 'true';

const InputStage = ({ originalParagraph, setOriginalParagraph, onStartPractice, onStartTodaysChallenge }) => {
  
  const handleInputChange = (e) => {
    const inputText = e.target.value;
    if (inputText.length <= MAX_INPUT_LENGTH) {
      setOriginalParagraph(inputText);
    } else {
      // 사용자가 최대 글자 수를 넘겨 붙여넣기 등을 시도할 경우 잘라냄
      setOriginalParagraph(inputText.substring(0, MAX_INPUT_LENGTH));
      // 필요하다면 여기에 사용자에게 알림 (예: 토스트 메시지)
      // console.warn(`최대 ${MAX_INPUT_LENGTH}자까지만 입력 가능합니다.`);
    }
  };

  const remainingChars = MAX_INPUT_LENGTH - originalParagraph.length;
  const isInputEmpty = originalParagraph.trim().length === 0;
  const isInputTooLong = originalParagraph.length > MAX_INPUT_LENGTH;
  const isButtonDisabled = isInputEmpty || isInputTooLong;

  const showInterstitialAd = (callback) => {
    if (!ADSENSE_ENABLED) {
      // AdSense 비활성화 시, 광고를 표시하지 않고 바로 콜백 실행
      if (callback) callback();
      return;
    }

    console.log("Attempting to show interstitial ad...");
    // Google AdSense 전면 광고 (페이지 수준 광고로 설정되어 있어야 함)
    // AdSense는 전면 광고 표시를 자체적으로 관리할 수 있으며, 항상 표시되지 않을 수 있습니다.
    // 특정 광고 라이브러리를 사용한다면 해당 SDK의 showInterstitial() 메소드를 호출합니다.
    // 여기서는 AdSense의 자동 전면 광고에 의존하거나, AdSense가 프로그래밍 방식 호출을 지원하는지 확인 필요.
    // 간단한 예시로, 광고 로드 및 표시 시뮬레이션:
    alert("전면 광고 요청 (AdSense 설정에 따라 표시될 수 있음)");
    
    // 광고가 닫혔다고 가정하고 (실제로는 광고 SDK의 콜백 사용)
    // AdSense의 경우, 광고 표시는 비동기적이며 직접적인 닫힘 콜백이 없을 수 있습니다.
    // 사용자의 다음 행동을 너무 오래 막지 않도록 주의해야 합니다.
    if (callback) {
      // 약간의 딜레이 후 콜백 실행 (광고 상호작용 시간 고려)
      setTimeout(callback, 500); // 0.5초 후 실행 (실제 환경에 맞게 조절)
    }
  };

  const handleStart = (mode) => {
    if (!originalParagraph || originalParagraph.trim().length === 0) {
      alert('문장을 입력해주세요.');
      return;
    }
    // 광고 로직은 필요하다면 여기에 추가
    onStartPractice(originalParagraph, mode);
  };

  return (
    <motion.div 
      className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-2xl space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">채움 : 문장 퀴즈</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          퀴즈를 만들고 싶은 한국어 문장을 입력해주세요. 
          <br />
          문제를 만들거나 초성퀴즈를 만들 수 있습니다.
          <br />
          최대 {MAX_INPUT_LENGTH}자까지 입력 가능합니다.
        </p>
      </div>

      <div className="relative">
        <Textarea
          placeholder="여기에 문장을 입력하세요... (예: 푸른 하늘 은하수 하얀 쪽배엔 계수나무 한 나무 토끼 한 마리...)"
          value={originalParagraph}
          onChange={handleInputChange}
          className="w-full min-h-[120px] sm:min-h-[150px] p-3 sm:p-4 text-sm sm:text-base border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow resize-none pr-20 sm:pr-24"
        />
        <div className={`absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full ${remainingChars < 0 ? 'text-red-600 bg-red-100' : (remainingChars < MAX_INPUT_LENGTH / 4 ? 'text-orange-600 bg-orange-100' : 'text-gray-500 bg-gray-100')}`}>
          {isInputTooLong ? `${Math.abs(remainingChars)}자 초과` : `${remainingChars}자 남음`}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button 
          onClick={() => handleStart('word')}
          className="w-full text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-2.5 shadow-md hover:shadow-lg transition-all duration-150 ease-in-out"
          disabled={isButtonDisabled}
        >
          <Send className="w-4 h-4 mr-2" />
          단어퀴즈 만들기
        </Button>
        <Button 
          onClick={() => handleStart('consonant')}
          className="w-full text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-2.5 shadow-md hover:shadow-lg transition-all duration-150 ease-in-out"
          disabled={isButtonDisabled}
        >
          <Brain className="w-4 h-4 mr-2" />
          초성퀴즈 만들기
        </Button>
        <Button 
          onClick={() => handleStart('shuffle')}
          className="w-full text-sm sm:text-base bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 sm:py-2.5 shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center"
          disabled={isButtonDisabled}
        >
          <Shuffle className="w-4 h-4 mr-2" />
          글자섞기 만들기
        </Button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <Button 
          onClick={onStartTodaysChallenge} 
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 text-base"
        >
          <Zap className="w-5 h-5 mr-2" />
          오늘의 문제 도전!
        </Button>
        <p className="text-xs text-center text-gray-500 mt-2">
          매일 새로운 문장과 퀴즈 모드로 도전해보세요!
        </p>
      </div>
    </motion.div>
  );
};

export default InputStage;