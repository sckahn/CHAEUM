import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, XCircle, Lightbulb, Gamepad2, RotateCcw, Info } from 'lucide-react';

const useGameToasts = () => {
  const { toast } = useToast();

  const notifySuccess = (title, description) => {
    toast({
      title: title,
      description: description,
      action: <CheckCircle className="text-green-500" />,
      className: "bg-green-100 border-green-300 text-green-800"
    });
  };

  const notifyError = (title, description) => {
    toast({
      title: title,
      description: description,
      variant: "destructive",
      action: <XCircle className="text-red-500" />,
      className: "bg-red-100 border-red-300 text-red-800"
    });
  };

  const notifyInfo = (title, description) => {
    toast({
      title: title,
      description: description,
      action: <Info className="text-blue-500" />,
      className: "bg-blue-100 border-blue-300 text-blue-800"
    });
  };
  
  const notifyGameStart = () => {
    toast({
      title: "게임 시작!",
      description: "단어 퀴즈를 풀고 원래 문단을 추측해보세요.",
      className: "bg-green-100 border-green-300 text-green-800"
    });
  };

  const notifyQuizComplete = () => {
    toast({
      title: "퀴즈 완료!",
      description: "모든 단어를 맞추셨습니다! 이제 원래 문단을 추측해보세요.",
      className: "bg-blue-100 border-blue-300 text-blue-800"
    });
  };

  const notifyPerfectMatch = (simScore) => {
    toast({
      title: "정답!",
      description: `유사도 ${simScore.toFixed(2)}% 로 원래 문단을 거의 정확히 맞추셨습니다!`,
      action: <Gamepad2 className="text-green-500" />,
      className: "bg-green-100 border-green-300 text-green-800"
    });
  };

  const notifyAlmostCorrect = (simScore) => {
    toast({
      title: "거의 정답!",
      description: `유사도 ${simScore.toFixed(2)}% 입니다. 조금만 더 힘내세요!`,
      action: <Lightbulb className="text-yellow-500" />,
      className: "bg-yellow-100 border-yellow-300 text-yellow-800"
    });
  };

  const notifyTryAgain = (simScore) => {
     toast({
      title: "아쉬워요",
      description: `유사도 ${simScore.toFixed(2)}% 입니다. 다시 시도해보세요!`,
      variant: "destructive",
      className: "bg-red-100 border-red-300 text-red-800"
    });
  };


  return { 
    notifySuccess, 
    notifyError, 
    notifyInfo,
    notifyGameStart,
    notifyQuizComplete,
    notifyPerfectMatch,
    notifyAlmostCorrect,
    notifyTryAgain,
    toast
  };
};

export default useGameToasts;