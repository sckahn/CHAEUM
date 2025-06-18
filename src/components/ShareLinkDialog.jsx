import React, { useState, useCallback } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import useGameToasts from '@/hooks/useGameToasts';

const ShareLinkDialog = ({ open, onOpenChange, shareLink }) => {
  const [copied, setCopied] = useState(false);
  const { notifySuccess, notifyError } = useGameToasts();

  const handleCopy = useCallback(async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      notifySuccess("링크 복사 완료!", "링크가 클립보드에 복사되었습니다.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      notifyError("복사 실패", "클립보드에 링크를 복사하는 중 오류가 발생했습니다.");
    }
  }, [shareLink, notifySuccess, notifyError]);

  React.useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-overlayShow" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 w-[90vw] sm:max-w-md max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg data-[state=open]:animate-contentShow focus:outline-none overflow-y-auto">
          <AlertDialog.Title className="text-lg font-semibold text-gray-800 mb-4">
            🔗 문제 공유 링크 생성됨
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-gray-600 mb-1">
            아래 링크를 복사하여 친구에게 공유하고 함께 퀴즈를 풀어보세요!
          </AlertDialog.Description>
          
          <div className="flex items-center space-x-2 mt-3 mb-5">
            <Input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 bg-gray-100 border-gray-300 text-gray-700 text-xs sm:text-sm"
              aria-label="공유 링크"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="border-gray-300 text-gray-600 hover:bg-gray-100"
              aria-label="링크 복사"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" className="text-sm" onClick={() => onOpenChange(false)}>
                닫기
              </Button>
            </AlertDialog.Cancel>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default ShareLinkDialog; 