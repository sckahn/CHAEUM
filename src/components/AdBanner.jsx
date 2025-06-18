import React, { useEffect } from 'react';
import { ADSENSE_CONFIG } from '@/config'; // config 객체 가져오기

// Vite 환경 변수 읽기 (VITE_ 접두사 필요) -> 주석 처리 또는 삭제
// const ADSENSE_ENABLED = import.meta.env.VITE_ADSENSE_ENABLED === 'true';

const AdBanner = ({ slot, format = "auto", responsive = "true", style }) => {

  useEffect(() => {
    // AdSense가 활성화된 경우에만 스크립트 푸시 시도
    if (ADSENSE_CONFIG.ENABLED) {
      try {
        // window.adsbygoogle가 정의되어 있을 때만 push 실행
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (e) {
        // 운영 환경에서 발생할 수 있는 오류 로깅
        console.error(`AdSense push error for slot ${slot}:`, e);
      }
    }
  }, [slot]); // slot이 변경될 때마다 광고를 다시 로드 시도

  // 개발 모드이거나 AdSense가 비활성화된 경우 플레이스홀더 표시
  if (!ADSENSE_CONFIG.ENABLED) {
    return (
      <div style={{
        textAlign: 'center', margin: '10px auto', minHeight: '90px', width: '100%', maxWidth: '728px', backgroundColor: '#e9e9e9',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc', color: '#888', fontSize: '14px', borderRadius: '8px', ...style 
      }}>
        <span>광고 영역 (DEV MODE)</span>
      </div>
    );
  }

  // 슬롯 ID가 유효하지 않은 경우 (실제 운영 환경용)
  if (!slot || slot.startsWith("YOUR_")) {
     return (
       <div style={{
        textAlign: 'center', margin: '10px auto', minHeight: '90px', width: '100%', maxWidth: '728px', backgroundColor: '#ffebee',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ffcdd2', color: '#c62828', fontSize: '14px', borderRadius: '8px', ...style 
      }}>
        <span>광고 오류: Ad Slot ID를 확인하세요.</span>
      </div>
    )
  }

  // 실제 광고 렌더링 (운영 환경)
  return (
    <div className="adsense-banner-container" style={{ textAlign: 'center', margin: '10px auto', minHeight: '90px', width: '100%', maxWidth: '728px', ...style }}>
      <ins
           key={slot} // slot이 바뀔 때마다 컴포넌트를 새로 그리도록 key 추가
           className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client={ADSENSE_CONFIG.CLIENT_ID}
           data-ad-slot={slot}
           data-ad-format={format}
           data-full-width-responsive={responsive}></ins>
    </div>
  );
};

export default AdBanner; 