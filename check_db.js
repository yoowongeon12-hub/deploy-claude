const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('데이터베이스 연결 테스트...');

    // 연결 테스트
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('✓ 데이터베이스 연결 성공:', result);

    // 테이블 확인
    console.log('\n테이블 목록:');
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = 'claude'
    `;

    if (tables.length === 0) {
      console.log('- 테이블이 없습니다. 마이그레이션이 필요합니다.');
    } else {
      console.log('- 기존 테이블:');
      tables.forEach(t => console.log('  *', t.TABLE_NAME));
    }

    // Post 테이블 확인
    try {
      const posts = await prisma.post.count();
      console.log('\n✓ Post 테이블 존재, 레코드 수:', posts);
    } catch (e) {
      console.log('\n✗ Post 테이블 없음');
    }

  } catch (error) {
    console.error('에러:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
