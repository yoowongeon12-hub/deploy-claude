/**
 * Todo 서비스 - CRUD 작업을 담당하는 비즈니스 로직 계층
 * Prisma ORM을 사용하여 tbl_todo 테이블과 상호작용합니다.
 */

const { getPrismaInstance } = require('../lib/prisma');

class TodoService {
  constructor() {
    // Prisma 클라이언트 인스턴스 가져오기
    this.prisma = getPrismaInstance();
  }

  /**
   * 새로운 할일 생성 (CREATE)
   * @param {number} memberId - 회원 ID
   * @param {string} content - 할일 내용 (1자 이상 200자 이하)
   * @returns {Promise<Object>} 생성된 할일 객체
   * @throws {Error} 유효성 검사 실패 또는 DB 에러
   */
  async createTodo(memberId, content) {
    try {
      // 입력값 유효성 검사
      if (!memberId || typeof memberId !== 'number') {
        throw new Error('유효한 회원 ID가 필요합니다');
      }

      if (!content || typeof content !== 'string') {
        throw new Error('할일 내용이 필요합니다');
      }

      // 공백 제거 및 다시 검증
      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        throw new Error('공백만으로는 할일을 등록할 수 없습니다');
      }

      if (trimmedContent.length > 200) {
        throw new Error('할일 내용은 200자 이하여야 합니다');
      }

      // DB에 할일 생성
      const todo = await this.prisma.todo.create({
        data: {
          memberId,
          content: trimmedContent,
          completed: false,
        },
      });

      return todo;
    } catch (error) {
      // 외래키 제약 위반 (존재하지 않는 회원)
      if (error.code === 'P2003') {
        throw new Error('존재하지 않는 회원입니다');
      }
      throw error;
    }
  }

  /**
   * 특정 회원의 모든 할일 조회 (READ - 목록)
   * @param {number} memberId - 회원 ID
   * @param {Object} options - 조회 옵션
   * @param {string} options.filter - 필터 ('all', 'completed', 'pending')
   * @returns {Promise<Array>} 할일 배열 (최신순 정렬)
   * @throws {Error} DB 에러
   */
  async getTodosByMember(memberId, options = {}) {
    try {
      const { filter = 'all' } = options;

      // 기본 where 조건: 해당 회원 + 소프트 삭제되지 않음
      const whereCondition = {
        memberId,
        isDeleted: false,
      };

      // 완료 상태별 필터링
      if (filter === 'completed') {
        whereCondition.completed = true;
      } else if (filter === 'pending') {
        whereCondition.completed = false;
      }

      // DB에서 할일 목록 조회 (최신순으로 정렬)
      const todos = await this.prisma.todo.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return todos;
    } catch (error) {
      throw new Error(`할일 목록 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 특정 할일 조회 (READ - 단일)
   * @param {number} todoId - 할일 ID
   * @param {number} memberId - 회원 ID (소유자 검증용)
   * @returns {Promise<Object>} 할일 객체
   * @throws {Error} 찾을 수 없거나 소유자가 아닌 경우
   */
  async getTodoById(todoId, memberId) {
    try {
      // 할일 조회 (소유자 확인 + 소프트 삭제 제외)
      const todo = await this.prisma.todo.findFirst({
        where: {
          id: todoId,
          memberId,
          isDeleted: false,
        },
      });

      if (!todo) {
        throw new Error('할일을 찾을 수 없습니다');
      }

      return todo;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 할일 내용 수정 (UPDATE - 내용)
   * @param {number} todoId - 할일 ID
   * @param {number} memberId - 회원 ID (소유자 검증용)
   * @param {string} newContent - 새로운 할일 내용
   * @returns {Promise<Object>} 수정된 할일 객체
   * @throws {Error} 유효성 검사 실패, 찾을 수 없음, 또는 소유자가 아님
   */
  async updateTodoContent(todoId, memberId, newContent) {
    try {
      // 입력값 유효성 검사
      if (!newContent || typeof newContent !== 'string') {
        throw new Error('할일 내용이 필요합니다');
      }

      const trimmedContent = newContent.trim();
      if (trimmedContent.length === 0) {
        throw new Error('공백만으로는 할일을 수정할 수 없습니다');
      }

      if (trimmedContent.length > 200) {
        throw new Error('할일 내용은 200자 이하여야 합니다');
      }

      // 소유자 확인 및 수정
      const todo = await this.prisma.todo.updateMany({
        where: {
          id: todoId,
          memberId,
          isDeleted: false,
        },
        data: {
          content: trimmedContent,
        },
      });

      // 수정된 행이 없음 = 찾을 수 없거나 소유자가 아님
      if (todo.count === 0) {
        throw new Error('할일을 찾을 수 없습니다');
      }

      // 수정된 할일 재조회
      return await this.getTodoById(todoId, memberId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 할일 완료 상태 토글 (UPDATE - 완료 여부)
   * @param {number} todoId - 할일 ID
   * @param {number} memberId - 회원 ID (소유자 검증용)
   * @returns {Promise<Object>} 수정된 할일 객체
   * @throws {Error} 찾을 수 없거나 소유자가 아닌 경우
   */
  async toggleTodoCompletion(todoId, memberId) {
    try {
      // 현재 할일 상태 확인
      const currentTodo = await this.getTodoById(todoId, memberId);

      // 새로운 상태
      const newCompleted = !currentTodo.completed;
      const completedAt = newCompleted ? new Date() : null;

      // 완료 상태 업데이트
      const updatedTodo = await this.prisma.todo.update({
        where: {
          id: todoId,
        },
        data: {
          completed: newCompleted,
          completedAt,
        },
      });

      return updatedTodo;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 할일 삭제 - 소프트 삭제 방식 (UPDATE - 삭제 플래그)
   * 실제 DB 행은 유지되지만 조회에서 제외됩니다.
   * @param {number} todoId - 할일 ID
   * @param {number} memberId - 회원 ID (소유자 검증용)
   * @returns {Promise<Object>} 삭제된 할일 객체
   * @throws {Error} 찾을 수 없거나 소유자가 아닌 경우
   */
  async deleteTodo(todoId, memberId) {
    try {
      // 할일 존재 및 소유자 확인
      const todo = await this.getTodoById(todoId, memberId);

      // 소프트 삭제: isDeleted 플래그를 true로 설정
      const deletedTodo = await this.prisma.todo.update({
        where: {
          id: todoId,
        },
        data: {
          isDeleted: true,
        },
      });

      return deletedTodo;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 할일 영구 삭제 (하드 삭제)
   * 일반적으로는 사용하지 않지만, 관리자 작업이나 GDPR 대응 시 필요할 수 있습니다.
   * @param {number} todoId - 할일 ID
   * @param {number} memberId - 회원 ID (소유자 검증용)
   * @returns {Promise<Object>} 삭제된 할일 객체
   * @throws {Error} 찾을 수 없거나 소유자가 아닌 경우
   */
  async hardDeleteTodo(todoId, memberId) {
    try {
      // 할일 존재 및 소유자 확인
      await this.getTodoById(todoId, memberId);

      // 영구 삭제
      const deletedTodo = await this.prisma.todo.delete({
        where: {
          id: todoId,
        },
      });

      return deletedTodo;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('할일을 찾을 수 없습니다');
      }
      throw error;
    }
  }

  /**
   * 특정 회원의 할일 통계 조회
   * @param {number} memberId - 회원 ID
   * @returns {Promise<Object>} { total: 전체, completed: 완료, pending: 미완료 }
   * @throws {Error} DB 에러
   */
  async getTodoStats(memberId) {
    try {
      // 전체 할일 수
      const total = await this.prisma.todo.count({
        where: {
          memberId,
          isDeleted: false,
        },
      });

      // 완료된 할일 수
      const completed = await this.prisma.todo.count({
        where: {
          memberId,
          isDeleted: false,
          completed: true,
        },
      });

      // 미완료 할일 수
      const pending = total - completed;

      return {
        total,
        completed,
        pending,
      };
    } catch (error) {
      throw new Error(`할일 통계 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 특정 회원의 모든 할일을 복원하기 (소프트 삭제된 항목 포함 복원)
   * @param {number} memberId - 회원 ID
   * @returns {Promise<Array>} 복원된 할일 배열
   * @throws {Error} DB 에러
   */
  async getAllTodosIncludingDeleted(memberId) {
    try {
      const todos = await this.prisma.todo.findMany({
        where: {
          memberId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return todos;
    } catch (error) {
      throw new Error(`모든 할일 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 소프트 삭제된 할일 영구 삭제
   * 관리 목적으로 오래된 삭제 기록을 정리할 때 사용
   * @param {number} memberId - 회원 ID
   * @param {number} daysOld - 며칠 이전 항목까지 삭제할지 (선택사항)
   * @returns {Promise<number>} 삭제된 할일 개수
   * @throws {Error} DB 에러
   */
  async purgeDeletedTodos(memberId, daysOld = 0) {
    try {
      let whereCondition = {
        memberId,
        isDeleted: true,
      };

      // daysOld가 지정되면 그 이전 항목만 삭제
      if (daysOld > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        whereCondition.updatedAt = {
          lt: cutoffDate,
        };
      }

      // 소프트 삭제된 항목 영구 삭제
      const result = await this.prisma.todo.deleteMany({
        where: whereCondition,
      });

      return result.count;
    } catch (error) {
      throw new Error(`삭제된 할일 정리 중 오류가 발생했습니다: ${error.message}`);
    }
  }
}

// 싱글톤 패턴으로 서비스 인스턴스 생성
let todoServiceInstance = null;

/**
 * TodoService 싱글톤 인스턴스 반환
 * @returns {TodoService}
 */
function getTodoService() {
  if (!todoServiceInstance) {
    todoServiceInstance = new TodoService();
  }
  return todoServiceInstance;
}

module.exports = {
  TodoService,
  getTodoService,
};
