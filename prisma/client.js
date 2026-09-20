/**
 * Prisma Client 초기화 및 관리
 *
 * 이 파일은 애플리케이션에서 Prisma ORM을 사용하기 위한
 * Prisma Client 인스턴스를 초기화하고 관리합니다.
 *
 * 싱글톤 패턴으로 구현되어 애플리케이션 전체에서 하나의
 * 인스턴스만 사용하여 데이터베이스 연결 풀을 효율적으로 관리합니다.
 */

const { PrismaClient } = require('@prisma/client');

// Prisma Client 싱글톤 인스턴스
let prismaInstance = null;

/**
 * Prisma Client 인스턴스 획득
 *
 * 싱글톤 패턴을 사용하여 애플리케이션 전체에서
 * 하나의 Prisma Client 인스턴스만 생성하여 사용합니다.
 *
 * @returns {PrismaClient} Prisma Client 인스턴스
 *
 * @example
 * const prisma = getPrismaClient();
 * const todos = await prisma.todo.findMany();
 */
function getPrismaClient() {
  // 이미 인스턴스가 생성되었으면 기존 인스턴스 반환
  if (prismaInstance) {
    return prismaInstance;
  }

  // 새로운 Prisma Client 인스턴스 생성
  // 환경 변수에서 DATABASE_URL을 읽어 데이터베이스 연결
  prismaInstance = new PrismaClient({
    // 로깅 설정: 쿼리 실행 시간이 100ms 이상이면 경고 메시지 출력
    log: [
      {
        emit: 'stdout',
        level: 'query',
      },
      {
        emit: 'stdout',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
  });

  return prismaInstance;
}

/**
 * Prisma Client 연결 종료
 *
 * 애플리케이션 종료 시 Prisma Client 연결을 종료합니다.
 * 서버 종료 또는 테스트 후정리 시 호출하세요.
 *
 * @async
 * @returns {Promise<void>}
 *
 * @example
 * await disconnectPrisma();
 */
async function disconnectPrisma() {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

// 모듈 내보내기
module.exports = {
  // Prisma Client 인스턴스를 반환하는 함수
  getPrismaClient,
  // Prisma Client 인스턴스를 직접 내보내기 (편의상)
  prisma: getPrismaClient(),
  // Prisma Client 연결 종료 함수
  disconnectPrisma,
};
