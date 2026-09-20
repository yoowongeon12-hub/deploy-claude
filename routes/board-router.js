/**
 * ============================================================
 * 게시글/댓글 라우터 - Express.js 엔드포인트 (수정 버전)
 * ============================================================
 * Prisma를 직접 사용하여 HTTP 요청을 처리합니다.
 * 응답 포맷: { success: boolean, data: any, message: string }
 */

const express = require('express');
const { getPrismaInstance } = require('../lib/prisma');

// Express 라우터 생성
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - content
 *         - author_name
 *         - created_at
 *       properties:
 *         id:
 *           type: integer
 *           description: 게시글 ID
 *         title:
 *           type: string
 *           description: 게시글 제목
 *         content:
 *           type: string
 *           description: 게시글 내용
 *         author_name:
 *           type: string
 *           description: 작성자 이름
 *         view_count:
 *           type: integer
 *           description: 조회수
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 생성일시
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 수정일시
 *     Comment:
 *       type: object
 *       required:
 *         - id
 *         - post_id
 *         - content
 *         - author_name
 *       properties:
 *         id:
 *           type: integer
 *           description: 댓글 ID
 *         post_id:
 *           type: integer
 *           description: 게시글 ID
 *         content:
 *           type: string
 *           description: 댓글 내용
 *         author_name:
 *           type: string
 *           description: 댓글 작성자 이름
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 생성일시
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 수정일시
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: 요청 성공 여부
 *         data:
 *           type: object
 *           description: 응답 데이터
 *         message:
 *           type: string
 *           description: 응답 메시지
 */

/**
 * ============================================================
 * 게시글 엔드포인트 (Posts)
 * ============================================================
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: 게시글 목록 조회
 *     description: 페이지네이션과 함께 모든 게시글을 최신순으로 조회합니다.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "페이지 번호 (기본값: 1)""
 *     responses:
 *       200:
 *         description: 게시글 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 서버 오류
 */
router.get('/', async (req, res) => {
  try {
    const prisma = getPrismaInstance();
    const { page = 1 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const POSTS_PER_PAGE = 10;
    const skip = (pageNum - 1) * POSTS_PER_PAGE;

    // 전체 게시글 수 조회
    const total = await prisma.post.count();
    const totalPages = Math.ceil(total / POSTS_PER_PAGE);

    // 게시글 목록 조회
    const posts = await prisma.post.findMany({
      skip,
      take: POSTS_PER_PAGE,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        author_name: true,
        view_count: true,
        created_at: true,
        updated_at: true,
        comments: { select: { id: true } },
      },
    });

    // 댓글 개수를 포함
    const postsWithCommentCount = posts.map((post) => ({
      ...post,
      comment_count: post.comments.length,
      comments: undefined,
    }));

    res.json({
      success: true,
      data: {
        posts: postsWithCommentCount,
        total,
        page: pageNum,
        totalPages,
      },
      message: `게시글 목록 조회 완료 (총 ${total}개)`,
    });
  } catch (error) {
    console.error('게시글 목록 조회 에러:', error.message);
    res.status(500).json({
      success: false,
      data: null,
      message: error.message || '게시글 목록 조회 중 오류가 발생했습니다',
    });
  }
});

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: 새 게시글 작성
 *     description: 제목, 내용, 작성자 이름을 받아 새로운 게시글을 생성합니다.
 *     tags:
 *       - Posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - author_name
 *             properties:
 *               title:
 *                 type: string
 *                 description: 게시글 제목
 *               content:
 *                 type: string
 *                 description: 게시글 내용
 *               author_name:
 *                 type: string
 *                 description: 작성자 이름
 *     responses:
 *       201:
 *         description: 게시글 작성 성공
 *       400:
 *         description: 유효하지 않은 요청
 */
router.post('/', async (req, res) => {
  try {
    console.log('[POST /api/posts] 요청 도착');
    const prisma = getPrismaInstance();
    console.log('[POST /api/posts] Prisma:', !!prisma);
    const { title, content, author_name } = req.body;
    console.log('[POST /api/posts] 데이터:', { title, author_name });

    // 유효성 검사
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '게시글 제목이 필요합니다',
      });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '게시글 내용이 필요합니다',
      });
    }

    if (!author_name || typeof author_name !== 'string' || author_name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '작성자 이름이 필요합니다',
      });
    }

    // 게시글 생성
    const newPost = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        author_name: author_name.trim(),
        view_count: 0,
      },
    });

    res.status(201).json({
      success: true,
      data: newPost,
      message: '게시글이 작성되었습니다',
    });
  } catch (error) {
    console.error('게시글 작성 에러:', error.message);
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || '게시글 작성 중 오류가 발생했습니다',
    });
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: 게시글 상세보기
 *     description: 특정 게시글을 조회하고 조회수를 증가시킵니다.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 게시글 조회 성공
 *       404:
 *         description: 게시글을 찾을 수 없음
 */
router.get('/:id', async (req, res) => {
  try {
    const prisma = getPrismaInstance();
    const { id } = req.params;
    const postId = parseInt(id);

    if (isNaN(postId) || postId <= 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '유효한 게시글 ID가 필요합니다',
      });
    }

    // 게시글 조회
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { comments: { orderBy: { created_at: 'asc' } } },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '게시글을 찾을 수 없습니다',
      });
    }

    // 조회수 비동기 증가
    prisma.post
      .update({
        where: { id: postId },
        data: { view_count: { increment: 1 } },
      })
      .catch((error) => {
        console.error('조회수 증가 중 오류:', error);
      });

    res.json({
      success: true,
      data: post,
      message: '게시글 조회 완료',
    });
  } catch (error) {
    console.error('게시글 조회 에러:', error.message);
    res.status(404).json({
      success: false,
      data: null,
      message: error.message || '게시글을 찾을 수 없습니다',
    });
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: 게시글 수정
 *     description: 게시글의 제목과 내용을 수정합니다.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 게시글 제목
 *               content:
 *                 type: string
 *                 description: 게시글 내용
 *     responses:
 *       200:
 *         description: 게시글 수정 성공
 *       400:
 *         description: 유효하지 않은 요청
 *       404:
 *         description: 게시글을 찾을 수 없음
 */
router.put('/:id', async (req, res) => {
  try {
    const prisma = getPrismaInstance();
    const { id } = req.params;
    const { title, content } = req.body;
    const postId = parseInt(id);

    if (isNaN(postId) || postId <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '유효한 게시글 ID가 필요합니다',
      });
    }

    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          data: null,
          message: '유효한 제목이 필요합니다',
        });
      }
      updateData.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          data: null,
          message: '유효한 내용이 필요합니다',
        });
      }
      updateData.content = content.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '수정할 데이터가 없습니다',
      });
    }

    // 게시글 수정
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: { comments: { orderBy: { created_at: 'asc' } } },
    });

    res.json({
      success: true,
      data: updatedPost,
      message: '게시글이 수정되었습니다',
    });
  } catch (error) {
    console.error('게시글 수정 에러:', error.message);
    if (error.code === 'P2025') {
      return res.status(400).json({
        success: false,
        data: null,
        message: '게시글을 찾을 수 없습니다',
      });
    }
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || '게시글 수정 중 오류가 발생했습니다',
    });
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: 게시글 삭제
 *     description: 특정 게시글과 관련된 모든 댓글을 함께 삭제합니다.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 게시글 삭제 성공
 *       404:
 *         description: 게시글을 찾을 수 없음
 */
router.delete('/:id', async (req, res) => {
  try {
    const prisma = getPrismaInstance();
    const { id } = req.params;
    const postId = parseInt(id);

    if (isNaN(postId) || postId <= 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '유효한 게시글 ID가 필요합니다',
      });
    }

    // 게시글 삭제
    const deletedPost = await prisma.post.delete({
      where: { id: postId },
      include: { comments: true },
    });

    res.json({
      success: true,
      data: deletedPost,
      message: '게시글이 삭제되었습니다',
    });
  } catch (error) {
    console.error('게시글 삭제 에러:', error.message);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        data: null,
        message: '게시글을 찾을 수 없습니다',
      });
    }
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
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: 댓글 목록 조회
 *     description: 특정 게시글의 모든 댓글을 조회합니다.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 댓글 목록 조회 성공
 *       404:
 *         description: 게시글을 찾을 수 없음
 */
router.get('/:postId/comments', async (req, res) => {
  try {
    const prisma = getPrismaInstance();
    const { postId } = req.params;
    const postIdNum = parseInt(postId);

    if (isNaN(postIdNum) || postIdNum <= 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '유효한 게시글 ID가 필요합니다',
      });
    }

    // 게시글 존재 확인
    const post = await prisma.post.findUnique({ where: { id: postIdNum } });
    if (!post) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '게시글을 찾을 수 없습니다',
      });
    }

    // 댓글 조회
    const comments = await prisma.comment.findMany({
      where: { post_id: postIdNum },
      orderBy: { created_at: 'asc' },
    });

    res.json({
      success: true,
      data: comments,
      message: `댓글 목록 조회 완료 (총 ${comments.length}개)`,
    });
  } catch (error) {
    console.error('댓글 목록 조회 에러:', error.message);
    res.status(404).json({
      success: false,
      data: null,
      message: error.message || '댓글 목록을 조회할 수 없습니다',
    });
  }
});

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: 댓글 작성
 *     description: 특정 게시글에 새로운 댓글을 작성합니다.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - author_name
 *             properties:
 *               content:
 *                 type: string
 *                 description: 댓글 내용
 *               author_name:
 *                 type: string
 *                 description: 댓글 작성자 이름
 *     responses:
 *       201:
 *         description: 댓글 작성 성공
 *       400:
 *         description: 유효하지 않은 요청
 */
router.post('/:postId/comments', async (req, res) => {
  try {
    const prisma = getPrismaInstance();
    const { postId } = req.params;
    const { content, author_name } = req.body;
    const postIdNum = parseInt(postId);

    if (isNaN(postIdNum) || postIdNum <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '유효한 게시글 ID가 필요합니다',
      });
    }

    // 유효성 검사
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '댓글 내용이 필요합니다',
      });
    }

    if (!author_name || typeof author_name !== 'string' || author_name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '작성자 이름이 필요합니다',
      });
    }

    // 게시글 존재 확인
    const post = await prisma.post.findUnique({ where: { id: postIdNum } });
    if (!post) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '게시글을 찾을 수 없습니다',
      });
    }

    // 댓글 생성
    const newComment = await prisma.comment.create({
      data: {
        post_id: postIdNum,
        content: content.trim(),
        author_name: author_name.trim(),
      },
    });

    res.status(201).json({
      success: true,
      data: newComment,
      message: '댓글이 작성되었습니다',
    });
  } catch (error) {
    console.error('댓글 작성 에러:', error.message);
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || '댓글 작성 중 오류가 발생했습니다',
    });
  }
});

/**
 * @swagger
 * /api/posts/{postId}/comments/{commentId}:
 *   put:
 *     summary: 댓글 수정
 *     description: 특정 댓글의 내용을 수정합니다.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시글 ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 댓글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 댓글 내용
 *     responses:
 *       200:
 *         description: 댓글 수정 성공
 *       400:
 *         description: 유효하지 않은 요청
 *       404:
 *         description: 댓글을 찾을 수 없음
 */
router.put('/:postId/comments/:commentId', async (req, res) => {
  try {
    const prisma = getPrismaInstance();
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const postIdNum = parseInt(postId);
    const commentIdNum = parseInt(commentId);

    if (isNaN(postIdNum) || postIdNum <= 0 || isNaN(commentIdNum) || commentIdNum <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '유효한 게시글 ID와 댓글 ID가 필요합니다',
      });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '유효한 댓글 내용이 필요합니다',
      });
    }

    // 댓글 존재 확인 및 수정
    const updated = await prisma.comment.updateMany({
      where: {
        id: commentIdNum,
        post_id: postIdNum,
      },
      data: { content: content.trim() },
    });

    if (updated.count === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '댓글을 찾을 수 없습니다',
      });
    }

    // 수정된 댓글 조회
    const updatedComment = await prisma.comment.findUnique({
      where: { id: commentIdNum },
    });

    res.json({
      success: true,
      data: updatedComment,
      message: '댓글이 수정되었습니다',
    });
  } catch (error) {
    console.error('댓글 수정 에러:', error.message);
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || '댓글 수정 중 오류가 발생했습니다',
    });
  }
});

/**
 * @swagger
 * /api/posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: 댓글 삭제
 *     description: 특정 댓글을 삭제합니다.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시글 ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 댓글 ID
 *     responses:
 *       200:
 *         description: 댓글 삭제 성공
 *       404:
 *         description: 댓글을 찾을 수 없음
 */
router.delete('/:postId/comments/:commentId', async (req, res) => {
  try {
    const prisma = getPrismaInstance();
    const { postId, commentId } = req.params;
    const postIdNum = parseInt(postId);
    const commentIdNum = parseInt(commentId);

    if (isNaN(postIdNum) || postIdNum <= 0 || isNaN(commentIdNum) || commentIdNum <= 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '유효한 게시글 ID와 댓글 ID가 필요합니다',
      });
    }

    // 댓글 존재 확인
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentIdNum,
        post_id: postIdNum,
      },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '댓글을 찾을 수 없습니다',
      });
    }

    // 댓글 삭제
    const deletedComment = await prisma.comment.delete({
      where: { id: commentIdNum },
    });

    res.json({
      success: true,
      data: deletedComment,
      message: '댓글이 삭제되었습니다',
    });
  } catch (error) {
    console.error('댓글 삭제 에러:', error.message);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        data: null,
        message: '댓글을 찾을 수 없습니다',
      });
    }
    res.status(404).json({
      success: false,
      data: null,
      message: error.message || '댓글을 찾을 수 없습니다',
    });
  }
});

// 라우터 모듈 내보내기
module.exports = router;
