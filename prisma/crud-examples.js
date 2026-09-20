/**
 * Prisma ORM을 사용한 Todo CRUD 작업 예제
 *
 * 이 파일은 Prisma Client를 사용하여 Todo 항목에 대한
 * CREATE, READ, UPDATE, DELETE 작업을 수행하는 방법을 보여줍니다.
 *
 * Prisma 문서: https://www.prisma.io/docs/
 */

const { getPrismaClient } = require('./client');

// ============================================================================
// CREATE 작업: 새로운 할일 생성
// ============================================================================

/**
 * 새로운 할일 항목 생성
 *
 * @param {number} memberId - 회원 ID
 * @param {string} title - 할일 제목
 * @returns {Promise<Object>} 생성된 할일 객체
 *
 * @example
 * const newTodo = await createTodo(1, '프로젝트 완성하기');
 * console.log(newTodo);
 * // {
 * //   id: 1,
 * //   memberId: 1,
 * //   title: '프로젝트 완성하기',
 * //   completed: false,
 * //   createdAt: 2024-01-15T10:30:00.000Z,
 * //   updatedAt: 2024-01-15T10:30:00.000Z,
 * //   completedAt: null,
 * //   isDeleted: false
 * // }
 */
async function createTodo(memberId, title) {
  const prisma = getPrismaClient();

  // prisma.todo.create(): 새로운 할일 생성
  // data: 생성할 할일의 데이터 지정
  const todo = await prisma.todo.create({
    data: {
      memberId,           // 회원 ID (필수)
      title,              // 할일 제목 (필수)
      completed: false,   // 완료 여부 (기본값: false)
      // createdAt, updatedAt는 자동 설정됨
    },
  });

  return todo;
}

/**
 * 여러 할일을 한 번에 생성 (배치 작업)
 *
 * @param {number} memberId - 회원 ID
 * @param {string[]} titles - 할일 제목 배열
 * @returns {Promise<Object[]>} 생성된 할일 배열
 *
 * @example
 * const todos = await createTodoBatch(1, ['공부하기', '운동하기', '책 읽기']);
 */
async function createTodoBatch(memberId, titles) {
  const prisma = getPrismaClient();

  // prisma.todo.createMany(): 여러 항목을 한 번에 생성
  const result = await prisma.todo.createMany({
    data: titles.map((title) => ({
      memberId,
      title,
      completed: false,
    })),
  });

  return result;
}

// ============================================================================
// READ 작업: 할일 조회
// ============================================================================

/**
 * 특정 할일 하나 조회
 *
 * @param {number} todoId - 할일 ID
 * @returns {Promise<Object|null>} 할일 객체 또는 null
 *
 * @example
 * const todo = await getTodoById(1);
 * if (todo) {
 *   console.log(`제목: ${todo.title}, 완료: ${todo.completed}`);
 * }
 */
async function getTodoById(todoId) {
  const prisma = getPrismaClient();

  // prisma.todo.findUnique(): 고유한 필드(ID)로 정확히 하나의 항목 조회
  const todo = await prisma.todo.findUnique({
    where: {
      id: todoId,
    },
  });

  return todo;
}

/**
 * 회원의 모든 할일 조회
 *
 * @param {number} memberId - 회원 ID
 * @param {Object} options - 조회 옵션
 * @param {boolean} options.includeDeleted - 삭제된 항목 포함 여부
 * @returns {Promise<Object[]>} 할일 배열
 *
 * @example
 * const todos = await getTodosByMember(1);
 * console.log(`총 ${todos.length}개의 할일이 있습니다.`);
 */
async function getTodosByMember(memberId, options = {}) {
  const prisma = getPrismaClient();
  const { includeDeleted = false } = options;

  // prisma.todo.findMany(): 여러 항목을 조건에 따라 조회
  const todos = await prisma.todo.findMany({
    where: {
      memberId,
      // includeDeleted가 false이면 삭제되지 않은 항목만 조회
      isDeleted: includeDeleted ? undefined : false,
    },
    // orderBy: 정렬 기준 (최신순으로 정렬)
    orderBy: {
      createdAt: 'desc',
    },
  });

  return todos;
}

/**
 * 완료되지 않은 할일만 조회
 *
 * @param {number} memberId - 회원 ID
 * @returns {Promise<Object[]>} 미완료 할일 배열
 *
 * @example
 * const pendingTodos = await getPendingTodos(1);
 * console.log(`미완료 할일: ${pendingTodos.length}개`);
 */
async function getPendingTodos(memberId) {
  const prisma = getPrismaClient();

  const todos = await prisma.todo.findMany({
    where: {
      memberId,
      completed: false,      // 완료되지 않은 항목만
      isDeleted: false,      // 삭제되지 않은 항목만
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return todos;
}

/**
 * 완료된 할일만 조회
 *
 * @param {number} memberId - 회원 ID
 * @returns {Promise<Object[]>} 완료된 할일 배열
 *
 * @example
 * const completedTodos = await getCompletedTodos(1);
 * console.log(`완료된 할일: ${completedTodos.length}개`);
 */
async function getCompletedTodos(memberId) {
  const prisma = getPrismaClient();

  const todos = await prisma.todo.findMany({
    where: {
      memberId,
      completed: true,       // 완료된 항목만
      isDeleted: false,      // 삭제되지 않은 항목만
    },
    orderBy: {
      completedAt: 'desc',   // 완료 시간순으로 정렬
    },
  });

  return todos;
}

/**
 * 페이지네이션을 적용한 할일 조회
 *
 * @param {number} memberId - 회원 ID
 * @param {number} page - 페이지 번호 (1부터 시작)
 * @param {number} pageSize - 페이지당 항목 수
 * @returns {Promise<Object>} { todos: [], total: number, page: number, pageSize: number }
 *
 * @example
 * const result = await getTodosWithPagination(1, 1, 10);
 * console.log(`${result.total}개 중 ${result.page}페이지 조회`);
 */
async function getTodosWithPagination(memberId, page = 1, pageSize = 10) {
  const prisma = getPrismaClient();

  // skip: 건너뛸 항목 수 계산 (0부터 시작하므로 (page - 1) * pageSize)
  const skip = (page - 1) * pageSize;

  // 총 할일 개수 조회
  const total = await prisma.todo.count({
    where: {
      memberId,
      isDeleted: false,
    },
  });

  // 페이지에 해당하는 할일 조회
  const todos = await prisma.todo.findMany({
    where: {
      memberId,
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,           // 건너뛸 항목 수
    take: pageSize, // 가져올 항목 수
  });

  return {
    todos,
    total,
    page,
    pageSize,
  };
}

// ============================================================================
// UPDATE 작업: 할일 수정
// ============================================================================

/**
 * 할일 제목 수정
 *
 * @param {number} todoId - 할일 ID
 * @param {string} newTitle - 새로운 제목
 * @returns {Promise<Object>} 수정된 할일 객체
 *
 * @example
 * const updatedTodo = await updateTodoTitle(1, '새로운 제목');
 * console.log(updatedTodo.updatedAt); // 수정 시간 자동 갱신됨
 */
async function updateTodoTitle(todoId, newTitle) {
  const prisma = getPrismaClient();

  // prisma.todo.update(): 기존 항목 수정
  const todo = await prisma.todo.update({
    where: {
      id: todoId,
    },
    data: {
      title: newTitle,
      // updatedAt은 자동으로 현재 시각으로 설정됨
    },
  });

  return todo;
}

/**
 * 할일 완료 상태 변경
 *
 * @param {number} todoId - 할일 ID
 * @param {boolean} completed - 완료 여부
 * @returns {Promise<Object>} 수정된 할일 객체
 *
 * @example
 * const todo = await updateTodoCompletion(1, true);
 * console.log(todo.completedAt); // 완료 시간이 기록됨
 */
async function updateTodoCompletion(todoId, completed) {
  const prisma = getPrismaClient();

  const todo = await prisma.todo.update({
    where: {
      id: todoId,
    },
    data: {
      completed,
      // 완료되면 현재 시각을 completedAt에 저장, 미완료면 null
      completedAt: completed ? new Date() : null,
    },
  });

  return todo;
}

/**
 * 할일 완료 상태 토글 (반전)
 *
 * @param {number} todoId - 할일 ID
 * @returns {Promise<Object>} 수정된 할일 객체
 *
 * @example
 * const todo = await toggleTodoCompletion(1);
 * console.log(`완료 상태: ${todo.completed}`); // 이전 반대값
 */
async function toggleTodoCompletion(todoId) {
  const prisma = getPrismaClient();

  // 먼저 기존 할일 조회
  const todo = await prisma.todo.findUnique({
    where: { id: todoId },
  });

  if (!todo) {
    throw new Error('할일을 찾을 수 없습니다');
  }

  // 완료 상태 반전
  const updatedTodo = await prisma.todo.update({
    where: {
      id: todoId,
    },
    data: {
      completed: !todo.completed,
      completedAt: !todo.completed ? new Date() : null,
    },
  });

  return updatedTodo;
}

/**
 * 할일 정보 전체 수정
 *
 * @param {number} todoId - 할일 ID
 * @param {Object} data - 수정할 데이터
 * @returns {Promise<Object>} 수정된 할일 객체
 *
 * @example
 * const todo = await updateTodo(1, { title: '새 제목', completed: true });
 */
async function updateTodo(todoId, data) {
  const prisma = getPrismaClient();

  const todo = await prisma.todo.update({
    where: {
      id: todoId,
    },
    data: {
      // null이 아닌 필드만 업데이트
      ...(data.title !== undefined && { title: data.title }),
      ...(data.completed !== undefined && {
        completed: data.completed,
        completedAt: data.completed ? new Date() : null,
      }),
    },
  });

  return todo;
}

// ============================================================================
// DELETE 작업: 할일 삭제
// ============================================================================

/**
 * 할일 소프트 삭제
 *
 * 데이터를 실제로 삭제하지 않고 isDeleted 플래그를 true로 설정합니다.
 * 데이터 무결성 및 감사(audit) 추적을 위해 사용됩니다.
 *
 * @param {number} todoId - 할일 ID
 * @returns {Promise<Object>} 삭제 처리된 할일 객체
 *
 * @example
 * const todo = await softDeleteTodo(1);
 * console.log(todo.isDeleted); // true
 */
async function softDeleteTodo(todoId) {
  const prisma = getPrismaClient();

  // 소프트 삭제: isDeleted를 true로 설정만 함
  const todo = await prisma.todo.update({
    where: {
      id: todoId,
    },
    data: {
      isDeleted: true,
    },
  });

  return todo;
}

/**
 * 할일 하드 삭제
 *
 * 데이터를 실제로 데이터베이스에서 완전히 삭제합니다.
 * 주의: 이 작업은 되돌릴 수 없습니다.
 *
 * @param {number} todoId - 할일 ID
 * @returns {Promise<Object>} 삭제된 할일 객체
 *
 * @example
 * const todo = await hardDeleteTodo(1);
 * console.log('할일이 완전히 삭제되었습니다');
 */
async function hardDeleteTodo(todoId) {
  const prisma = getPrismaClient();

  // 하드 삭제: 데이터베이스에서 완전히 제거
  const todo = await prisma.todo.delete({
    where: {
      id: todoId,
    },
  });

  return todo;
}

/**
 * 회원의 모든 할일 삭제 (소프트 삭제)
 *
 * @param {number} memberId - 회원 ID
 * @returns {Promise<Object>} { count: number }
 *
 * @example
 * const result = await deleteAllTodosByMember(1);
 * console.log(`${result.count}개의 할일이 삭제되었습니다`);
 */
async function deleteAllTodosByMember(memberId) {
  const prisma = getPrismaClient();

  // updateMany: 여러 항목을 한 번에 수정
  const result = await prisma.todo.updateMany({
    where: {
      memberId,
      isDeleted: false,
    },
    data: {
      isDeleted: true,
    },
  });

  return result;
}

// ============================================================================
// 통계 및 복합 작업
// ============================================================================

/**
 * 회원의 할일 통계 조회
 *
 * @param {number} memberId - 회원 ID
 * @returns {Promise<Object>} { total: number, completed: number, pending: number, completionRate: number }
 *
 * @example
 * const stats = await getTodoStats(1);
 * console.log(`완료율: ${stats.completionRate.toFixed(2)}%`);
 */
async function getTodoStats(memberId) {
  const prisma = getPrismaClient();

  // 전체 할일 개수
  const total = await prisma.todo.count({
    where: {
      memberId,
      isDeleted: false,
    },
  });

  // 완료된 할일 개수
  const completed = await prisma.todo.count({
    where: {
      memberId,
      completed: true,
      isDeleted: false,
    },
  });

  // 미완료 할일 개수
  const pending = total - completed;

  // 완료율 (%)
  const completionRate = total === 0 ? 0 : (completed / total) * 100;

  return {
    total,
    completed,
    pending,
    completionRate,
  };
}

/**
 * 트랜잭션을 사용한 복합 작업
 *
 * 여러 데이터베이스 작업을 하나의 트랜잭션으로 처리합니다.
 * 모든 작업이 성공하거나 모두 실패합니다.
 *
 * @param {number} memberId - 회원 ID
 * @param {string} newTitle - 새로운 할일 제목
 * @returns {Promise<Object>} 트랜잭션 결과
 *
 * @example
 * const result = await transactionExample(1, '새 할일');
 */
async function transactionExample(memberId, newTitle) {
  const prisma = getPrismaClient();

  // $transaction: 여러 작업을 하나의 트랜잭션으로 처리
  const result = await prisma.$transaction(async (tx) => {
    // 1단계: 새로운 할일 생성
    const newTodo = await tx.todo.create({
      data: {
        memberId,
        title: newTitle,
      },
    });

    // 2단계: 전체 할일 통계 조회
    const total = await tx.todo.count({
      where: {
        memberId,
        isDeleted: false,
      },
    });

    // 3단계: 완료된 할일 수 조회
    const completed = await tx.todo.count({
      where: {
        memberId,
        completed: true,
        isDeleted: false,
      },
    });

    return {
      newTodo,
      stats: { total, completed },
    };
  });

  return result;
}

// ============================================================================
// 모듈 내보내기
// ============================================================================

module.exports = {
  // CREATE 함수
  createTodo,
  createTodoBatch,

  // READ 함수
  getTodoById,
  getTodosByMember,
  getPendingTodos,
  getCompletedTodos,
  getTodosWithPagination,

  // UPDATE 함수
  updateTodoTitle,
  updateTodoCompletion,
  toggleTodoCompletion,
  updateTodo,

  // DELETE 함수
  softDeleteTodo,
  hardDeleteTodo,
  deleteAllTodosByMember,

  // 통계 및 복합 작업
  getTodoStats,
  transactionExample,
};
