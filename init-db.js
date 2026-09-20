/**
 * 데이터베이스 초기화 스크립트
 * 모든 게시글과 댓글을 삭제합니다.
 */

(async () => {
  const { getPrismaInstance } = require('./lib/prisma');
  const prisma = getPrismaInstance();

  try {
    // 모든 댓글 삭제
    const deletedComments = await prisma.comment.deleteMany();
    console.log('Deleted comments:', deletedComments.count);

    // 모든 게시글 삭제
    const deletedPosts = await prisma.post.deleteMany();
    console.log('Deleted posts:', deletedPosts.count);

    await prisma.$disconnect();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
