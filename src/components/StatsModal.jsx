import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart, Copy, X, Share2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress'; // 만약 shadcn/ui에 Progress가 있다면 사용, 없다면 직접 구현

const StatsModal = ({ isOpen, onClose, stats, onCopyResults }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      // 한국 시간 (GMT+9) 기준으로 다음 날 자정 설정
      tomorrow.setUTCHours(tomorrow.getUTCHours() + 9); // 현재 시간을 KST로 변환
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1); // 다음 날로 설정
      tomorrow.setUTCHours(0, 0, 0, 0); // KST 자정
      tomorrow.setUTCHours(tomorrow.getUTCHours() - 9); // 다시 UTC로 변환하여 계산

      const diff = tomorrow.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    calculateTimeLeft();
    const timerId = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timerId);
  }, [isOpen]);

  const winPercentage = stats.totalPlayed > 0 ? Math.round((stats.totalWins / stats.totalPlayed) * 100) : 0;

  // 오늘 풀었던 문제 종류별 통계 계산
  const todaysModeStats = useMemo(() => {
    const getTodayDateString = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = getTodayDateString();
    const modeStats = {
      word: { attempted: 0, solved: 0 },
      consonant: { attempted: 0, solved: 0 },
      shuffle: { attempted: 0, solved: 0 }
    };

    // solveTimes에서 오늘 날짜의 기록 확인
    if (stats.solveTimes && stats.solveTimes[todayStr]) {
      const todaysRecord = stats.solveTimes[todayStr];
      const mode = todaysRecord.mode || 'word';
      modeStats[mode].attempted = 1;
      modeStats[mode].solved = 1;
    }

    // 각 모드별 표시 이름 매핑
    const modeDisplayNames = {
      word: '단어 찾기',
      consonant: '초성 퀴즈', 
      shuffle: '글자 섞기'
    };

    return Object.entries(modeStats)
      .filter(([mode, data]) => data.attempted > 0)
      .map(([mode, data]) => ({
        mode,
        displayName: modeDisplayNames[mode],
        attempted: data.attempted,
        solved: data.solved,
        percentage: data.attempted > 0 ? Math.round((data.solved / data.attempted) * 100) : 0
      }));
  }, [stats.solveTimes]);

  // 전체 기간 모드별 통계 계산
  const allTimeModeStats = useMemo(() => {
    const modeStats = {
      word: { attempted: 0, solved: 0 },
      consonant: { attempted: 0, solved: 0 },
      shuffle: { attempted: 0, solved: 0 }
    };

    // solveTimes에서 모든 날짜의 기록 확인
    if (stats.solveTimes) {
      Object.values(stats.solveTimes).forEach(record => {
        const mode = record.mode || 'word';
        modeStats[mode].attempted += 1;
        modeStats[mode].solved += 1; // solveTimes에 기록된 것은 모두 성공한 것
      });
    }

    // 각 모드별 표시 이름 매핑
    const modeDisplayNames = {
      word: '단어 찾기',
      consonant: '초성 퀴즈', 
      shuffle: '글자 섞기'
    };

    return Object.entries(modeStats)
      .filter(([mode, data]) => data.attempted > 0)
      .map(([mode, data]) => ({
        mode,
        displayName: modeDisplayNames[mode],
        attempted: data.attempted,
        solved: data.solved,
        percentage: data.attempted > 0 ? Math.round((data.solved / data.attempted) * 100) : 0
      }));
  }, [stats.solveTimes]);

  // const distributionBars = useMemo(() => { // 주석 처리 또는 삭제
  //   if (!stats.winDistribution) return [];
  //   const maxDistribution = Math.max(1, ...Object.values(stats.winDistribution));
  //   return Object.entries(stats.winDistribution).map(([time, count]) => ({
  //     label: time,
  //     count: count,
  //     percentage: maxDistribution > 0 ? (count / maxDistribution) * 100 : 0,
  //   }));
  // }, [stats.winDistribution]);
  
  // 결과 복사 텍스트 생성
  const handleCopyToClipboard = () => {
    if (!stats.lastWinDate || !stats.solveTimes || !stats.solveTimes[stats.lastWinDate]) {
      // 복사할 결과가 없는 경우 (예: 아직 한 번도 성공 못함)
      // 이 부분은 onCopyResults에서 처리하거나, 여기서 간단한 메시지 알림 가능
      if(onCopyResults) onCopyResults(null); 
      return;
    }
    const todayStr = stats.lastWinDate;
    const solveTime = stats.solveTimes[todayStr];
    const currentStreak = stats.currentStreak;

    const minutes = Math.floor(solveTime / 60);
    const seconds = solveTime % 60;
    const timeString = `${minutes > 0 ? `${minutes}분 ` : ''}${seconds}초`;

    const resultText = `오늘의 한국어 단어 퀴즈!\n📅 ${todayStr}\n⏱️ 성공 시간: ${timeString}\n🔥 연속 성공: ${currentStreak}일차`;
    if (onCopyResults) onCopyResults(resultText);
  };


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center">
            <BarChart className="w-7 h-7 mr-2 text-blue-500" />
            통계
          </DialogTitle>
          {/* DialogHeader 내부의 명시적인 X 버튼 제거
          <Button variant="ghost" size="icon" className="absolute top-3 right-3" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          */}
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
          <div>
            <p className="text-3xl font-bold">{stats.totalPlayed || 0}</p>
            <p className="text-xs text-gray-500">전체 도전</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{winPercentage}%</p>
            <p className="text-xs text-gray-500">정답률</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.currentStreak || 0}</p>
            <p className="text-xs text-gray-500">현재 연속 정답</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.maxStreak || 0}</p>
            <p className="text-xs text-gray-500">최다 연속 정답</p>
          </div>
        </div>

        {/* 오늘 풀었던 문제 종류별 통계 */}
        {todaysModeStats.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-center mb-3 text-gray-700">오늘의 도전 기록</h3>
            <div className="space-y-3">
              {todaysModeStats.map((modeStat) => (
                <div key={modeStat.mode} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{modeStat.displayName}</p>
                    <p className="text-sm text-gray-600">
                      {modeStat.solved}/{modeStat.attempted} 성공
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${modeStat.percentage === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                      {modeStat.percentage}%
                    </p>
                    {modeStat.percentage === 100 && (
                      <span className="text-xs text-green-600">✓ 완료</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 전체 기간 모드별 통계 */}
        {allTimeModeStats.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-center mb-3 text-gray-700">모드별 전체 기록</h3>
            <div className="space-y-3">
              {allTimeModeStats.map((modeStat) => (
                <div key={modeStat.mode} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{modeStat.displayName}</p>
                    <p className="text-sm text-gray-600">
                      총 {modeStat.solved}회 성공
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {modeStat.solved}회
                    </p>
                    <p className="text-xs text-gray-500">
                      성공률 100%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* <div className="mb-6"> // 도전 분포 섹션 주석 처리 또는 삭제
        </div> */}

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t mt-6">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-gray-700">새로운 문제까지</p>
            <p className="text-2xl font-bold text-blue-600 tracking-wider">{timeLeft}</p>
          </div>
          <Button 
            onClick={handleCopyToClipboard} 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 text-base rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Copy className="w-4 h-4 mr-2" />
            결과 복사
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatsModal; 