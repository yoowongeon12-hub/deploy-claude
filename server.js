/**
 * ============================================================
 * 프로덕션 서버 진입점
 * API 서버 시작
 * ============================================================
 */

// API 서버 모듈 임포트
const app = require('./api-server');

// 포트 설정 (기본값: 3000, 환경 변수로 오버라이드 가능)
const PORT = process.env.PORT || 3000;

/**
 * 서버 시작
 */
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT}`);
    console.log(`${'='.repeat(60)}\n`);
});
