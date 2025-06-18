import { useState, useEffect, useCallback } from 'react';

const useParagraphUpdater = (originalParagraph, quiz, hintLettersMeta) => {
  const [revealedParagraph, setRevealedParagraph] = useState('');

  const updateRevealedParagraph = useCallback((currentQuiz, currentHintLettersMeta) => {
    if (!originalParagraph) {
      setRevealedParagraph('');
      return;
    }

    let displayChars = originalParagraph.replace(/[가-힣]/g, '_').split('');
    // const originalChars = originalParagraph.split(''); // 이 변수는 이제 사용되지 않음

    // 모든 solved된 퀴즈를 순회 (full, partial 모두 포함될 수 있으나, partial은 constituentLettersMeta가 없을 수 있음)
    currentQuiz.forEach(q => {
      if (q.solved && q.constituentLettersMeta && q.constituentLettersMeta.length > 0) {
        // 각 퀴즈를 구성했던 글자들의 원래 위치에 해당 글자를 채워넣음
        q.constituentLettersMeta.forEach(letterMeta => {
          if (letterMeta.fromOriginal && displayChars[letterMeta.originalIndex] === '_') {
            // 해당 위치가 아직 밑줄인 경우에만 채움 (중복 방지 및 원래 글자 우선)
            // (그리고 letterMeta.fromOriginal === true 인 경우만, 즉 원본 문장에서 온 글자만)
            displayChars[letterMeta.originalIndex] = letterMeta.char;
          }
        });
      }
    });

    // 2. 문단에 남은 글자들(hintLettersMeta) 채우기
    if (currentHintLettersMeta) { // currentHintLettersMeta가 존재할 때만 실행
      currentHintLettersMeta.forEach(letterMeta => {
        // 이 글자는 퀴즈로 사용되지 않았으므로, 원래 위치에 그냥 표시
        if (letterMeta.fromOriginal && displayChars[letterMeta.originalIndex] === '_') {
          // 아직 밑줄인 경우에만 덮어쓰기 (퀴즈로 맞힌 글자가 우선될 수 있도록)
          displayChars[letterMeta.originalIndex] = letterMeta.char;
        }
      });
    }

    setRevealedParagraph(displayChars.join(''));
  }, [originalParagraph]);

  useEffect(() => {
    // quiz 또는 hintLettersMeta가 변경될 때마다 문단 업데이트
    updateRevealedParagraph(quiz, hintLettersMeta);
  }, [originalParagraph, quiz, hintLettersMeta, updateRevealedParagraph]);

  return { revealedParagraph, updateRevealedParagraph };
};

export default useParagraphUpdater;