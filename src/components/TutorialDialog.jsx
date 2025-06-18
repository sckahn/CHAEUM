import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Lightbulb, X } from 'lucide-react';

// 모드별 튜토리얼 내용
const tutorialContent = {
  word: {
    title: "단어 찾기 퀴즈 튜토리얼",
    description: "주어진 문장과 뜻을 보고 숨겨진 단어들을 찾아보세요. 최종적으로 원래 문장을 완성하는 것이 목표입니다!",
    steps: [
      "제시된 단어의 뜻을 보고 어떤 단어인지 유추하여, 밑줄 친 빈칸에 글자를 입력합니다.",
      "밑줄의 종류는 해당 글자가 원래 문장에 포함되는지 여부를 알려줍니다: \n" +
      "   - **검은색 실선 밑줄 (▬)**: 이 자리에 들어갈 글자는 <span class='font-bold'>원래 문장에도 포함</span>됩니다. \n" +
      "   - **파란색 점선 밑줄 (┅)**: 이 자리에 들어갈 글자는 퀴즈 단어를 만드는 데는 필요하지만, <span class='font-bold'>원래 문장에는 포함되지 않습니다.</span>",
      "예를 들어, 문제 문장이 '사랑해' 이고" + "\n" +
      "    퀴즈 문장이 다음과 같다면" + "<br>" +
      "   - 퀴즈 문장: <span class=\"font-bold text-black-600 border-b-2 border-black-600 border-dotted\">_</span> <span class=\"font-bold text-blue-600 border-b-2 border-blue-600 border-dotted\">_</span> (뜻: 빨갛고 둥근 과일)" + "\n" +
      "   - 퀴즈 답: <span class=\"font-bold text-black-600 border-b-2 border-black-600 border-dotted\">사</span> <span class=\"font-bold text-blue-600 border-b-2 border-blue-600 border-dotted\">과</span>" + "\n" +

      "  <br> -  <span class=\"font-bold text-black-600 border-b-2 border-black-600 border-dotted\">사</span>는 검은색 밑줄 자리에 들어가는 글자로 정답 문장에 있는 글자" + "\n" +
      "  <br> -  <span class=\"font-bold text-blue-600 border-b-2 border-blue-600 border-dotted\">과</span>는 파란색 밑줄 자리에 들어가는 글자로 정답 문장에 없는 글자" + "\n" +
      "  <br> -  따라서, 이 퀴즈를 풀면 정답 문장에는 '사'만 반영됩니다.",
      "모든 검은색 밑줄의 글자를 찾아 원래 문장을 완성하세요!"
    ],
  },
  consonant: {
    title: "초성 퀴즈 튜토리얼",
    description: "주어진 문장의 초성만 보고 원래 문장을 맞춰보세요!",
    steps: [
      "화면에 표시된 초성들을 확인하세요.",
      "각 초성에 해당하는 원래 글자를 예상하여 전체 문장을 입력하세요.",
      "입력에 따라 실시간으로 정답 여부가 표시됩니다.",
    ],
  },
  shuffle: {
    title: "글자 섞기 퀴즈 튜토리얼",
    description: "순서가 뒤섞인 글자들을 보고 원래 문장을 배열해보세요!",
    steps: [
      "띄어쓰기와 글자수는 맞지만 뒤죽박죽 섞여있는 글자들을 확인하세요.",
      "글자들을 올바른 순서로 배열하여 원래 문장을 완성하세요.",
      "예시 문장: 고요 배가파 --> 배가 고파요" + "\n" +
      "입력에 따라 실시간으로 각 글자의 위치가 맞는지 피드백을 받습니다.",
    ],
  },
};

const TutorialDialog = ({ isOpen, mode, onClose, onMarkAsShown }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // 모달이 새로 열릴 때마다 "다시 보지 않기" 체크박스 상태 초기화
    if (isOpen) {
      setDontShowAgain(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (dontShowAgain && mode) {
      onMarkAsShown(mode); // "다시 보지 않기"가 체크된 경우, 해당 모드를 마킹
    } else {
      onClose(); // 단순 닫기
    }
  };

  if (!isOpen || !mode || !tutorialContent[mode]) return null;

  const currentTutorial = tutorialContent[mode];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4 sm:mx-auto">
        <DialogHeader className="mb-4 relative">
          <DialogTitle className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center">
            <Lightbulb className="w-7 h-7 mr-2 text-yellow-400" />
            {currentTutorial.title}
          </DialogTitle>
          {/* 수동으로 추가된 X 버튼을 주석 처리하여 DialogContent의 기본 닫기 버튼만 사용하도록 합니다. 
          <Button variant="ghost" size="icon" className="absolute top-0 right-0" onClick={handleClose}>
             <X className="h-5 w-5" />
          </Button>
          */}
        </DialogHeader>
        
        <p className="text-sm text-gray-600 mb-4">
          {currentTutorial.description}
        </p>

        <ul className="space-y-2 mb-6 list-decimal list-inside text-gray-700 text-sm">
          {currentTutorial.steps.map((step, index) => (
            <li key={index} dangerouslySetInnerHTML={{ __html: step }} />
          ))}
        </ul>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <Checkbox 
              id={`dont-show-again-${mode}`} 
              checked={dontShowAgain} 
              onCheckedChange={setDontShowAgain} 
            />
            <label 
              htmlFor={`dont-show-again-${mode}`} 
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              이 게임 모드 다시 보지 않기
            </label>
          </div>
          <Button onClick={handleClose} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm">
            알겠습니다!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialDialog; 