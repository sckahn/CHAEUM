import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, BookOpen, Type } from 'lucide-react';
import { cn } from "@/lib/utils";

const HintSelectionModal = ({ isOpen, onClose, hints, onSelectHint, gameMode, originalParagraph, quiz }) => {
  if (!hints || hints.length === 0) return null;

  const renderWordModeHints = () => {
    if (!quiz || quiz.length === 0) return null;
    
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 text-center">
          공개하고 싶은 단어를 클릭하세요:
        </p>
        <div className="grid grid-cols-1 gap-3">
          {hints.map((hint) => {
            const clue = quiz[hint.index];
            if (!clue) return null;
            
            return (
              <Card 
                key={hint.id} 
                className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 border-2"
                onClick={() => onSelectHint(hint.id)}
              >
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">
                        {clue.meaning}
                      </span>
                    </div>
                    
                    <div className="text-lg tracking-wider mb-2">
                      {clue.clueWordDisplayChars && clue.clueWordDisplayChars.map((dc, charIndex) => (
                        <span
                          key={charIndex}
                          className="inline-block mx-0.5 px-1 py-1 border-b-2 border-gray-400 min-w-[1em] text-center"
                        >
                          _
                        </span>
                      ))}
                      <span className="ml-2 text-xs text-gray-500">({clue.clueWord.length}글자)</span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      클릭하여 이 단어 공개
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCharacterModeHints = () => {
    if (!originalParagraph) return null;
    
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 text-center">
          공개하고 싶은 글자를 클릭하세요:
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-2 p-4 bg-gray-50 rounded-lg">
          {originalParagraph.split('').map((origChar, index) => {
            const isSpace = origChar === ' ';
            if (isSpace) {
              return <span key={`space-${index}`} className="w-4 h-8 inline-block"> </span>;
            }
            
            // 이 글자가 힌트로 선택 가능한지 확인
            const isSelectable = hints.some(hint => hint.index === index);
            
            return (
              <div 
                key={`char-${index}`} 
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border-2 rounded-md text-base sm:text-lg font-medium transition-all duration-200",
                  isSelectable 
                    ? "cursor-pointer border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400" 
                    : "border-green-500 bg-green-50 text-green-700"
                )}
                onClick={() => {
                  if (isSelectable) {
                    const hint = hints.find(h => h.index === index);
                    if (hint) onSelectHint(hint.id);
                  }
                }}
              >
                {isSelectable ? (
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-blue-600">_</span>
                  </div>
                ) : (
                  origChar
                )}
              </div>
            );
          })}
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-blue-300 bg-blue-50 rounded"></div>
              <span>선택 가능</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-green-500 bg-green-50 rounded"></div>
              <span>이미 맞힘</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            힌트 선택하기
          </DialogTitle>
          <DialogDescription>
            {gameMode === 'word' 
              ? `해결할 단어를 선택해주세요. (총 ${hints.length}개 선택 가능)`
              : `공개할 글자를 선택해주세요. (총 ${hints.length}개 선택 가능)`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {gameMode === 'word' ? renderWordModeHints() : renderCharacterModeHints()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HintSelectionModal; 