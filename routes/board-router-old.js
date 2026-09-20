/**
 * ============================================================
 * 게시글/댓글 라우터 - Express.js 엔드포인트
 * ============================================================
 * BoardService를 사용하여 HTTP 요청을 처리합니다.
 * 응답 포맷: { success: boolean, data: any, message: string }
 *
 * 라우터 마운트 경로: /api/posts
 * 따라서 실제 엔드포인트는 /api/posts/{path} 형태입니다.
 */

const express = require('express');
const { getBoardService } = require('../services/boardService');

// Express 라우터 생성
const router = express.Router();

// 요청 로깅 미들웨어
router.use((req, res, next) => {
  console.log(`[Board Router] ${req.method} ${req.path}`);
  next();
});

// BoardService 싱글톤 인스턴스를 지연 로드하는 함수
// 이렇게 하면 라우터 초기화 시점이 아닌 요청 시점에 서비스를 로드할 수 있음
function getBoardServiceInstance() {
  const service = getBoardService();
  console.log('[getBoardServiceInstance] Service loaded:', !!service, 'Has prisma:', !!(service && service.prisma));
  return service;
}

/**
 * ============================================================
 * 게시글 엔드포인트 (Posts)
 * ============================================================
 */

/**
 * GET /api/posts
 * 게시글 전체 목록 조회 (페이지네이션, 최신순)
 * Query Parameters:
 *   - page: 페이지 번호 (기본값: 1)
 * Response: { success: boolean, data: { posts: [], total: number, page: number, totalPages: number }, message: string }
 */
router.get('/', async (req, res) => {
  try {
    // 쿼리 파라미터에서 페이지 번호 추출 (기본값: 1)
    const { page = 1 } = req.query;

    // boardService의 getPosts 메서드 호출
    const boardService = getBoardServiceInstance();
    const result = await boardService.getPosts(page);

    res.json({
      success: true,
      data: result,
      message: `게시글 목록 조회 완료 (총 ${result.total}개, ${result.page}/${result.totalPages} 페이지)`,
    });
  } catch (error) {
    // 에러 로깅
    console.error('게시글 목록 조회 에러:', error);

    res.status(500).json({
      success: false,
      data: null,
      message: error.message || '게시글 목록 조회 중 오류가 발생했습니다',
    });
  }
});

/**
 * POST /api/posts
 * 새로운 게시글 작성
 * Request Body:
 *   - title: string (필수, 1~200자)
 *   - content: string (필수, 1~10000자)
 *   - author_name: string (필수, 비회원 작성자명)
 * Response: { success: boolean, data: post, message: string }
 */
router.post('/', async (req, res) => {
  try {
    // 요청 본문에서 게시글 데이터 추출
    const { title, content, author_name } = req.body;

    // boardService의 createPost 메서드 호출
    const boardService = getBoardServiceInstance();

    // 디버그: boardService 확인
    if (!boardService) {
      console.error('BoardService is undefined');
      throw new Error('BoardService가 로드되지 않았습니다');
    }

    if (!boardService.prisma) {
      console.error('BoardService.prisma is undefined');
      throw new Error('Prisma 클라이언트가 로드되지 않았습니다');
    }

    const newPost = await boardService.createPost({
      title,
      content,
      author_name,
    });

    // 201 Created 상태 코드로 응답
    res.status(201).json({
      success: true,
      data: newPost,
      message: '게시글이 작성되었습니다',
    });
  } catch (error) {
    // 에러 로깅
    console.error('게시글 작성 에러:', error.message);
    console.error('에러 스택:', error.stack);

    res.status(400).json({
      success: false,
      data: null,
      message: error.message || '게시글 작성 중 오류가 발생했습니다',
    });
  }
});

/**
 * GET /api/posts/:id
 * 게시글 상세보기 (조회수 +1)
 * URL Parameters: id (게시글 ID)
 * Response: { success: boolean, data: post, message: string }
 */
router.get('/:id', async (req, res) => {
  try {
    // URL 파라미터에서 게시글 ID 추출
    const { id } = req.params;

    // boardService의 getPostById 메서드 호출
    const boardService = getBoardServiceInstance();
    const post = await boardService.getPostById(id);

    res.json({
      success: true,
      data: post,
      message: '게시글 조회 완료',
    });
  } catch (error) {
    // 에러 로깅
    console.error('게시글 조회 에러:', error);

    res.status(404).json({
      success: false,
      data: null,
      message: error.message || '게시글을 찾을 수 없습니다',
    });
  }
});

/**
 * PUT /api/posts/:id
 * 게시글 수정
 * URL Parameters: id (게시글 ID)
 * Request Body:
 *   - title: string (선택사항, 1~200자)
 *   - content: string (선택사항, 1~10000자)
 * Response: { success: boolean, data: post, message: string }
 */
router.put('/:id', async (req, res) => {
  try {
    // URL 파라미터에서 게시글 ID 추출
    const { id } = req.params;

    // 요청 본문에서 수정할 데이터 추출
    const { title, content } = req.body;

    // boardService의 updatePost 메서드 호출
    const boardService = getBoardServiceInstance();
    const updatedPost = await boardService.updatePost(id, {
      title,
      content,
    });

    res.json({
      success: true,
      data: updatedPost,
      message: '게시글이 수정되었습니다',
    });
  } catch (error) {
    // 에러 로깅
    console.error('게시글 수정 에러:', error);

    res.status(400).json({
      success: false,
      data: null,
      message: error.message || '게시글 수정 중 오류가 발생했습니다',
    });
  }
});

/**
 * DELETE /api/posts/:id
 * 게시글 삭제 (댓글도 함께 삭제됨)
 * URL Parameters: id (게시글 ID)
 * Response: { success: boolean, data: post, message: string }
 */
router.delete('/:id', async (req, res) => {
  try {
    // URL 파라미터에서 게시글 ID 추출
    const { id } = req.params;

    // boardService의 deletePost 메서드 호출
    const boardService = getBoardServiceInstance();
    const deletedPost = await boardService.deletePost(id);

    res.json({
      success: true,
      data: deletedPost,
      message: '게시글이 삭제되었습니다',
    });
  } catch (error) {
    // 에러 로깅
    console.error('게시글 삭제 에러:', error);

    res.status(404).json({
      success: false,
      data: null,
      message: error.message || '게시글을 찾을 수 없습니다',
    });
  }
});

/**
 * ============================================================
 * 댓글 엔드포인트 (Comments)
 * ============================================================
 */

/**
 * GET /api/posts/:postId/comments
 * 특정 게시글의 댓글 목록 조회 (생성 순서)
 * URL Parameters: postId (게시글 ID)
 * Response: { success: boolean, data: comments[], message: string }
 */
router.get('/:postId/comments', async (req, res) => {
  try {
    // URL 파라미터에서 게시글 ID 추출
    const { postId } = req.params;

    // boardService의 getComments 메서드 호출
    const boardService = getBoardServiceInstance();
    const comments = await boardService.getComments(postId);

    res.json({
      success: true,
      data: comments,
      message: `댓글 목록 조회 완료 (총 ${comments.length}개)`,
    });
  } catch (error) {
    // 에러 로깅
    console.error('댓글 목록 조회 에러:', error);

    res.status(404).json({
      success: false,
      data: null,
      message: error.message || '댓글 목록을 조회할 수 없습니다',
    });
  }
});

/**
 * POST /api/posts/:postId/comments
 * 새로운 댓글 작성
 * URL Parameters: postId (게시글 ID)
 * Request Body:
 *   - content: string (필수, 1~2000자)
 *   - author_name: string (필수, 비회원 작성자명)
 * Response: { success: boolean, data: comment, message: string }
 */
router.post('/:postId/comments', async (req, res) => {
  try {
    // URL 파라미터에서 게시글 ID 추출
    const { postId } = req.params;

    // 요청 본문에서 댓글 데이터 추출
    const { content, author_name } = req.body;

    // boardService의 createComment 메서드 호출
    const boardService = getBoardServiceInstance();
    const newComment = await boardService.createComment(postId, {
      content,
      author_name,
    });

    // 201 Created 상태 코드로 응답
    res.status(201).json({
      success: true,
      data: newComment,
      message: '댓글이 작성되었습니다',
    });
  } catch (error) {
    // 에러 로깅
    console.error('댓글 작성 에러:', error);

    res.status(400).json({
      success: false,
      data: null,
      message: error.message || '댓글 작성 중 오류가 발생했습니다',
    });
  }
});

/**
 * PUT /api/posts/:postId/comments/:commentId
 * 댓글 수정
 * URL Parameters: postId (게시글 ID), commentId (댓글 ID)
 * Request Body:
 *   - content: string (선택사항, 1~2000자)
 * Response: { success: boolean, data: comment, message: string }
 */
router.put('/:postId/comments/:commentId', async (req, res) => {
  try {
    // URL 파라미터에서 게시글 ID와 댓글 ID 추출
    const { postId, commentId } = req.params;

    // 요청 본문에서 수정할 데이터 추출
    const { content } = req.body;

    // boardService의 updateComment 메서드 호출
    const boardService = getBoardServiceInstance();
    const updatedComment = await boardService.updateComment(postId, commentId, {
      content,
    });

    res.json({
      success: true,
      data: updatedComment,
      message: '댓글이 수정되었습니다',
    });
  } catch (error) {
    // 에러 로깅
    console.error('댓글 수정 에러:', error);

    res.status(400).json({
      success: false,
      data: null,
      message: error.message || '댓글 수정 중 오류가 발생했습니다',
    });
  }
});

/**
 * DELETE /api/posts/:postId/comments/:commentId
 * 댓글 삭제
 * URL Parameters: postId (게시글 ID), commentId (댓글 ID)
 * Response: { success: boolean, data: comment, message: string }
 */
router.delete('/:postId/comments/:commentId', async (req, res) => {
  try {
    // URL 파라미터에서 게시글 ID와 댓글 ID 추출
    const { postId, commentId } = req.params;

    // boardService의 deleteComment 메서드 호출
    const boardService = getBoardServiceInstance();
    const deletedComment = await boardService.deleteComment(postId, commentId);

    res.json({
      success: true,
      data: deletedComment,
      message: '댓글이 삭제되었습니다',
    });
  } catch (error) {
    // 에러 로깅
    console.error('댓글 삭제 에러:', error);

    res.status(404).json({
      success: false,
      data: null,
      message: error.message || '댓글을 찾을 수 없습니다',
    });
  }
});

// 라우터 모듈 내보내기
module.exports = router;
