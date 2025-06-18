// src/config.js

const ENVIRONMENT = import.meta.env.MODE || 'development';

// Google AdSense 광고 설정
export const ADSENSE_CONFIG = {
  // 'production' 환경일 때만 광고를 활성화합니다.
  ENABLED: ENVIRONMENT === 'production',
  CLIENT_ID: "ca-pub-XXXXXXXXXXXXXXXX", // 실제 AdSense 클라이언트 ID로 교체
  
  // 배너 광고 슬롯 ID
  BANNER_SLOTS: {
    LEADERBOARD: "YOUR_LEADERBOARD_SLOT_ID", // 728x90 등
    MEDIUM_RECTANGLE: "YOUR_MEDIUM_RECTANGLE_SLOT_ID", // 300x250
    // 필요한 다른 슬롯 ID 추가
  },
};

// 보상형 광고 설정 (데모 모드)
export const REWARDED_ADS_CONFIG = {
  // 'production' 환경일 때만 실제 광고 로직을 고려하고, 아닐 경우 데모만 활성화
  ENABLED: true,
  PLATFORM: ENVIRONMENT === 'production' ? "adsense" : "demo", // 향후 AdSense 보상형 광고 추가 대비
  MAX_DAILY_REWARDS: 5, // 하루 최대 보상 횟수
  COOLDOWN_SECONDS: 60, // 광고 시청 후 쿨다운 시간 (초)
  
  // 개발/테스트용 설정
  DEMO: {
    ENABLED: true,
    SIMULATION_TIME: 3000, // 데모 광고 시뮬레이션 시간 (ms)
    COOLDOWN_TIME: 10000   // 데모 쿨다운 시간 (ms)
  }
};

// 기타 필요한 전역 설정들을 여기에 추가할 수 있습니다.
// 예: export const API_BASE_URL = "https://api.example.com"; 