/**
 * ============================================================
 * Prisma ORM 싱글톤 관리
 * ============================================================
 * 전체 애플리케이션에서 하나의 Prisma 클라이언트 인스턴스를 공유합니다.
 * 데이터베이스 연결 풀을 효율적으로 관리합니다.
 */

// @prisma/client 라이브러리에서 PrismaClient 임포트
const { PrismaClient } = require('@prisma/client');

// 싱글톤 인스턴스를 저장할 변수
let prismaInstance = null;

/**
 * Prisma 클라이언트 싱글톤 인스턴스 반환
 * 첫 호출 시에는 새로운 인스턴스를 생성하고,
 * 이후 호출에서는 기존 인스턴스를 반환합니다.
 * @returns {PrismaClient} Prisma 클라이언트 인스턴스
 */
function getPrismaInstance() {
  // 인스턴스가 없으면 새로 생성
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      // 개발 환경에서는 쿼리 로깅 활성화
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error', 'warn'],
    });
  }

  return prismaInstance;
}

/**
 * Prisma 클라이언트 연결 종료
 * 애플리케이션 종료 시 또는 graceful shutdown 시 호출
 * @returns {Promise<void>}
 */
async function closePrismaConnection() {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

// Node.js 프로세스 종료 시 Prisma 연결도 종료
// 주의: 이 핸들러는 서버 종료 시에만 실행되도록 함
let isShuttingDown = false;

process.on('SIGINT', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\nGraceful shutdown: Prisma 연결을 종료합니다...');
  await closePrismaConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\nGraceful shutdown: Prisma 연결을 종료합니다...');
  await closePrismaConnection();
  process.exit(0);
});

module.exports = {
  getPrismaInstance,
  closePrismaConnection,
};
