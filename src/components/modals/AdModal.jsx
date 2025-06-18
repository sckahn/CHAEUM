import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, Play, Timer, X } from 'lucide-react';
import { REWARDED_ADS_CONFIG } from '@/config';

const AdModal = ({ isOpen, onClose, onAdCompleted }) => {
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (isWatching && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (isWatching && countdown === 0) {
      handleAdCompleted();
    }
    return () => clearTimeout(timer);
  }, [isWatching, countdown]);

  const handleStartDemoAd = () => {
    setIsWatching(true);
    setCountdown(REWARDED_ADS_CONFIG.DEMO.SIMULATION_TIME / 1000);
  };

  const handleAdCompleted = () => {
    setIsWatching(false);
    onAdCompleted();
  };

  const handleClose = () => {
    if (isWatching) return;
    setIsWatching(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            힌트 받기 (데모)
          </DialogTitle>
          <DialogDescription>
            데모 광고를 시청하고 힌트를 받으세요. 실제 환경에서는 Google AdSense 광고가 표시될 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {!isWatching ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">데모 광고 시청</h3>
                <p className="text-sm text-gray-600 mb-4">
                  아래 버튼을 눌러 데모 광고 시청을 시작하세요.
                </p>
                <Button 
                  onClick={handleStartDemoAd}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                  size="lg"
                >
                  <Play className="mr-2 h-4 w-4" />
                  데모 광고 보기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                   <Timer className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">광고 시청 중...</h3>
                <p className="text-gray-500 mb-4">잠시 후 보상이 지급됩니다.</p>
                <div className="text-4xl font-bold text-purple-600 tabular-nums">
                  {countdown}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isWatching}>
            <X className="mr-2 h-4 w-4" />
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdModal; 