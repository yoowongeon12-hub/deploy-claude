/**
 * ============================================================
 * Board 서비스 - 게시글 및 댓글 CRUD 작업을 담당하는 비즈니스 로직 계층
 * ============================================================
 * Prisma ORM을 사용하여 tbl_post, tbl_comment 테이블과 상호작용합니다.
 */

const { getPrismaInstance } = require('../lib/prisma');

/**
 * ============================================================
 * 게시글 서비스 클래스
 * ============================================================
 */
class BoardService {
  // 생성자: Prisma 클라이언트 인스턴스 초기화
  constructor() {
    // Prisma 클라이언트 인스턴스 가져오기
    this.prisma = getPrismaInstance();
    // 페이지당 게시글 수
    this.POSTS_PER_PAGE = 10;
  }

  /**
   * ============================================================
   * 게시글 CRUD 메서드
   * ============================================================
   */

  /**
   * 새로운 게시글 생성 (CREATE)
   * 비회원 게시판이므로 회원 검증 없음
   * @param {Object} data - 게시글 데이터
   * @param {string} data.title - 게시글 제목 (필수, 1~200자)
   * @param {string} data.content - 게시글 내용 (필수, 1~10000자)
   * @param {string} data.author_name - 작성자 이름 (필수, 비회원)
   * @returns {Promise<Object>} 생성된 게시글 객체
   * @throws {Error} 유효성 검사 실패 또는 DB 에러
   */
  async createPost(data) {
    try {
      // 입력값 유효성 검사
      const { title, content, author_name } = data;

      // 제목 검증
      if (!title || typeof title !== 'string') {
        throw new Error('게시글 제목이 필요합니다');
      }

      // 제목 공백 제거 및 길이 검증
      const trimmedTitle = title.trim();
      if (trimmedTitle.length === 0) {
        throw new Error('공백만으로는 제목을 등록할 수 없습니다');
      }

      if (trimmedTitle.length > 200) {
        throw new Error('게시글 제목은 200자 이하여야 합니다');
      }

      // 내용 검증
      if (!content || typeof content !== 'string') {
        throw new Error('게시글 내용이 필요합니다');
      }

      // 내용 공백 제거 및 길이 검증
      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        throw new Error('공백만으로는 내용을 등록할 수 없습니다');
      }

      if (trimmedContent.length > 10000) {
        throw new Error('게시글 내용은 10000자 이하여야 합니다');
      }

      // 작성자명 검증
      if (!author_name || typeof author_name !== 'string') {
        throw new Error('작성자 이름이 필요합니다');
      }

      // 작성자명 공백 제거 및 길이 검증
      const trimmedAuthorName = author_name.trim();
      if (trimmedAuthorName.length === 0) {
        throw new Error('공백만으로는 작성자 이름을 등록할 수 없습니다');
      }

      if (trimmedAuthorName.length > 100) {
        throw new Error('작성자 이름은 100자 이하여야 합니다');
      }

      // DB에 게시글 생성
      const post = await this.prisma.post.create({
        data: {
          title: trimmedTitle,
          content: trimmedContent,
          author_name: trimmedAuthorName,
          view_count: 0,
        },
      });

      return post;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 게시글 목록 조회 (READ - 목록) with 페이지네이션
   * 최신순으로 정렬하고, 페이지당 10개씩 반환
   * @param {number} page - 페이지 번호 (기본값: 1, 1부터 시작)
   * @returns {Promise<Object>} { posts: [], total: number, page: number, totalPages: number }
   * @throws {Error} DB 에러
   */
  async getPosts(page = 1) {
    try {
      // 페이지 번호 유효성 검사
      const pageNum = Math.max(1, parseInt(page) || 1);

      // skip 계산: (페이지-1) * 페이지당개수
      const skip = (pageNum - 1) * this.POSTS_PER_PAGE;

      // 전체 게시글 수 조회
      const total = await this.prisma.post.count();

      // 전체 페이지 수 계산
      const totalPages = Math.ceil(total / this.POSTS_PER_PAGE);

      // 게시글 목록 조회 (최신순으로 정렬)
      const posts = await this.prisma.post.findMany({
        skip,
        take: this.POSTS_PER_PAGE,
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          title: true,
          author_name: true,
          view_count: true,
          created_at: true,
          updated_at: true,
          comments: {
            select: {
              id: true,
            },
          },
        },
      });

      // 댓글 개수를 포함하여 변환
      const postsWithCommentCount = posts.map((post) => ({
        ...post,
        comment_count: post.comments.length,
        comments: undefined,
      }));

      return {
        posts: postsWithCommentCount,
        total,
        page: pageNum,
        totalPages,
      };
    } catch (error) {
      throw new Error(`게시글 목록 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 특정 게시글 조회 (READ - 단일)
   * 조회 시 view_count를 1 증가시킵니다.
   * @param {number} postId - 게시글 ID
   * @returns {Promise<Object>} 게시글 객체 (댓글 포함)
   * @throws {Error} 게시글을 찾을 수 없는 경우
   */
  async getPostById(postId) {
    try {
      // 게시글 ID 유효성 검사
      const id = parseInt(postId);
      if (isNaN(id) || id <= 0) {
        throw new Error('유효한 게시글 ID가 필요합니다');
      }

      // 게시글 조회
      const post = await this.prisma.post.findUnique({
        where: {
          id,
        },
        include: {
          comments: {
            orderBy: {
              created_at: 'asc',
            },
          },
        },
      });

      // 게시글이 없으면 에러 발생
      if (!post) {
        throw new Error('게시글을 찾을 수 없습니다');
      }

      // 조회수 증가 (비동기로 처리, 응답 대기 안 함)
      this.prisma.post
        .update({
          where: { id },
          data: { view_count: { increment: 1 } },
        })
        .catch((error) => {
          console.error('조회수 증가 중 오류:', error);
        });

      return post;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 게시글 수정 (UPDATE)
   * 제목과 내용을 수정할 수 있습니다.
   * @param {number} postId - 게시글 ID
   * @param {Object} data - 수정할 데이터
   * @param {string} data.title - 수정할 제목 (선택사항)
   * @param {string} data.content - 수정할 내용 (선택사항)
   * @returns {Promise<Object>} 수정된 게시글 객체
   * @throws {Error} 유효성 검사 실패 또는 게시글을 찾을 수 없음
   */
  async updatePost(postId, data) {
    try {
      // 게시글 ID 유효성 검사
      const id = parseInt(postId);
      if (isNaN(id) || id <= 0) {
        throw new Error('유효한 게시글 ID가 필요합니다');
      }

      // 수정할 데이터 객체 초기화
      const updateData = {};

      // 제목 수정
      if (data.title !== undefined) {
        if (typeof data.title !== 'string') {
          throw new Error('제목은 문자열이어야 합니다');
        }

        const trimmedTitle = data.title.trim();
        if (trimmedTitle.length === 0) {
          throw new Error('공백만으로는 제목을 수정할 수 없습니다');
        }

        if (trimmedTitle.length > 200) {
          throw new Error('게시글 제목은 200자 이하여야 합니다');
        }

        updateData.title = trimmedTitle;
      }

      // 내용 수정
      if (data.content !== undefined) {
        if (typeof data.content !== 'string') {
          throw new Error('내용은 문자열이어야 합니다');
        }

        const trimmedContent = data.content.trim();
        if (trimmedContent.length === 0) {
          throw new Error('공백만으로는 내용을 수정할 수 없습니다');
        }

        if (trimmedContent.length > 10000) {
          throw new Error('게시글 내용은 10000자 이하여야 합니다');
        }

        updateData.content = trimmedContent;
      }

      // 수정할 데이터가 없으면 에러
      if (Object.keys(updateData).length === 0) {
        throw new Error('수정할 데이터가 없습니다');
      }

      // 게시글 수정
      const updatedPost = await this.prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          comments: {
            orderBy: {
              created_at: 'asc',
            },
          },
        },
      });

      return updatedPost;
    } catch (error) {
      // 게시글을 찾을 수 없는 경우
      if (error.code === 'P2025') {
        throw new Error('게시글을 찾을 수 없습니다');
      }
      throw error;
    }
  }

  /**
   * 게시글 삭제 (DELETE)
   * 게시글 삭제 시 해당 게시글의 모든 댓글도 자동으로 삭제됩니다. (Cascade)
   * @param {number} postId - 게시글 ID
   * @returns {Promise<Object>} 삭제된 게시글 객체
   * @throws {Error} 게시글을 찾을 수 없는 경우
   */
  async deletePost(postId) {
    try {
      // 게시글 ID 유효성 검사
      const id = parseInt(postId);
      if (isNaN(id) || id <= 0) {
        throw new Error('유효한 게시글 ID가 필요합니다');
      }

      // 게시글 삭제 (댓글도 자동 삭제됨)
      const deletedPost = await this.prisma.post.delete({
        where: { id },
        include: {
          comments: true,
        },
      });

      return deletedPost;
    } catch (error) {
      // 게시글을 찾을 수 없는 경우
      if (error.code === 'P2025') {
        throw new Error('게시글을 찾을 수 없습니다');
      }
      throw error;
    }
  }

  /**
   * ============================================================
   * 댓글 CRUD 메서드
   * ============================================================
   */

  /**
   * 게시글의 댓글 목록 조회 (READ - 댓글 목록)
   * 생성 시간순(오래된 것부터)으로 정렬합니다.
   * @param {number} postId - 게시글 ID
   * @returns {Promise<Array>} 댓글 배열
   * @throws {Error} 게시글을 찾을 수 없거나 DB 에러
   */
  async getComments(postId) {
    try {
      // 게시글 ID 유효성 검사
      const id = parseInt(postId);
      if (isNaN(id) || id <= 0) {
        throw new Error('유효한 게시글 ID가 필요합니다');
      }

      // 게시글 존재 확인
      const post = await this.prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new Error('게시글을 찾을 수 없습니다');
      }

      // 댓글 목록 조회 (생성 시간순으로 정렬)
      const comments = await this.prisma.comment.findMany({
        where: {
          post_id: id,
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      return comments;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 새로운 댓글 작성 (CREATE)
   * @param {number} postId - 게시글 ID
   * @param {Object} data - 댓글 데이터
   * @param {string} data.content - 댓글 내용 (필수, 1~2000자)
   * @param {string} data.author_name - 작성자 이름 (필수)
   * @returns {Promise<Object>} 생성된 댓글 객체
   * @throws {Error} 유효성 검사 실패 또는 DB 에러
   */
  async createComment(postId, data) {
    try {
      // 게시글 ID 유효성 검사
      const id = parseInt(postId);
      if (isNaN(id) || id <= 0) {
        throw new Error('유효한 게시글 ID가 필요합니다');
      }

      // 입력값 유효성 검사
      const { content, author_name } = data;

      // 댓글 내용 검증
      if (!content || typeof content !== 'string') {
        throw new Error('댓글 내용이 필요합니다');
      }

      // 댓글 내용 공백 제거 및 길이 검증
      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        throw new Error('공백만으로는 댓글을 작성할 수 없습니다');
      }

      if (trimmedContent.length > 2000) {
        throw new Error('댓글은 2000자 이하여야 합니다');
      }

      // 작성자명 검증
      if (!author_name || typeof author_name !== 'string') {
        throw new Error('작성자 이름이 필요합니다');
      }

      // 작성자명 공백 제거 및 길이 검증
      const trimmedAuthorName = author_name.trim();
      if (trimmedAuthorName.length === 0) {
        throw new Error('공백만으로는 작성자 이름을 등록할 수 없습니다');
      }

      if (trimmedAuthorName.length > 100) {
        throw new Error('작성자 이름은 100자 이하여야 합니다');
      }

      // 게시글 존재 확인
      const post = await this.prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new Error('게시글을 찾을 수 없습니다');
      }

      // DB에 댓글 생성
      const comment = await this.prisma.comment.create({
        data: {
          post_id: id,
          content: trimmedContent,
          author_name: trimmedAuthorName,
        },
      });

      return comment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 댓글 수정 (UPDATE)
   * @param {number} postId - 게시글 ID
   * @param {number} commentId - 댓글 ID
   * @param {Object} data - 수정할 데이터
   * @param {string} data.content - 수정할 내용 (선택사항)
   * @returns {Promise<Object>} 수정된 댓글 객체
   * @throws {Error} 유효성 검사 실패 또는 댓글을 찾을 수 없음
   */
  async updateComment(postId, commentId, data) {
    try {
      // 게시글 ID 유효성 검사
      const postIdNum = parseInt(postId);
      if (isNaN(postIdNum) || postIdNum <= 0) {
        throw new Error('유효한 게시글 ID가 필요합니다');
      }

      // 댓글 ID 유효성 검사
      const commentIdNum = parseInt(commentId);
      if (isNaN(commentIdNum) || commentIdNum <= 0) {
        throw new Error('유효한 댓글 ID가 필요합니다');
      }

      // 수정할 데이터 객체 초기화
      const updateData = {};

      // 댓글 내용 수정
      if (data.content !== undefined) {
        if (typeof data.content !== 'string') {
          throw new Error('내용은 문자열이어야 합니다');
        }

        const trimmedContent = data.content.trim();
        if (trimmedContent.length === 0) {
          throw new Error('공백만으로는 댓글을 수정할 수 없습니다');
        }

        if (trimmedContent.length > 2000) {
          throw new Error('댓글은 2000자 이하여야 합니다');
        }

        updateData.content = trimmedContent;
      }

      // 수정할 데이터가 없으면 에러
      if (Object.keys(updateData).length === 0) {
        throw new Error('수정할 데이터가 없습니다');
      }

      // 댓글이 해당 게시글에 속하는지 확인 및 수정
      const updatedComment = await this.prisma.comment.updateMany({
        where: {
          id: commentIdNum,
          post_id: postIdNum,
        },
        data: updateData,
      });

      // 수정된 행이 없음 = 댓글이 없거나 다른 게시글의 댓글
      if (updatedComment.count === 0) {
        throw new Error('댓글을 찾을 수 없습니다');
      }

      // 수정된 댓글 재조회
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentIdNum },
      });

      return comment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 댓글 삭제 (DELETE)
   * @param {number} postId - 게시글 ID
   * @param {number} commentId - 댓글 ID
   * @returns {Promise<Object>} 삭제된 댓글 객체
   * @throws {Error} 댓글을 찾을 수 없는 경우
   */
  async deleteComment(postId, commentId) {
    try {
      // 게시글 ID 유효성 검사
      const postIdNum = parseInt(postId);
      if (isNaN(postIdNum) || postIdNum <= 0) {
        throw new Error('유효한 게시글 ID가 필요합니다');
      }

      // 댓글 ID 유효성 검사
      const commentIdNum = parseInt(commentId);
      if (isNaN(commentIdNum) || commentIdNum <= 0) {
        throw new Error('유효한 댓글 ID가 필요합니다');
      }

      // 댓글이 해당 게시글에 속하는지 확인
      const comment = await this.prisma.comment.findFirst({
        where: {
          id: commentIdNum,
          post_id: postIdNum,
        },
      });

      if (!comment) {
        throw new Error('댓글을 찾을 수 없습니다');
      }

      // 댓글 삭제
      const deletedComment = await this.prisma.comment.delete({
        where: { id: commentIdNum },
      });

      return deletedComment;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('댓글을 찾을 수 없습니다');
      }
      throw error;
    }
  }
}

// ============================================================
// 싱글톤 패턴
// ============================================================

// 서비스 인스턴스를 저장할 변수
let boardServiceInstance = null;

/**
 * BoardService 싱글톤 인스턴스 반환
 * @returns {BoardService}
 */
function getBoardService() {
  // 인스턴스가 없으면 새로 생성
  if (!boardServiceInstance) {
    boardServiceInstance = new BoardService();
  }
  return boardServiceInstance;
}

// 모듈 내보내기
module.exports = {
  BoardService,
  getBoardService,
};
