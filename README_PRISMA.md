# Prisma CRUD 구현 - Todo 관리 시스템

## 📋 목차

1. [개요](#개요)
2. [파일 구조](#파일-구조)
3. [설치 및 설정](#설치-및-설정)
4. [데이터베이스 스키마](#데이터베이스-스키마)
5. [서비스 계층 API](#서비스-계층-api)
6. [라우터 API](#라우터-api)
7. [사용 예제](#사용-예제)
8. [에러 처리](#에러-처리)

---

## 개요

본 문서는 Prisma ORM을 사용하여 구현한 Todo 관리 시스템의 CRUD 기능에 대해 설명합니다.

### 주요 기능

- **생성 (CREATE)**: 새로운 할일 등록
- **조회 (READ)**: 할일 목록 및 단일 할일 조회
- **수정 (UPDATE)**: 할일 내용 및 완료 상태 변경
- **삭제 (DELETE)**: 할일 소프트 삭제 및 영구 삭제
- **검증**: 입력값 유효성 검사
- **권한**: 회원별 데이터 격리

---

## 파일 구조

```
project/
├── prisma/
│   └── schema.prisma              # Prisma 데이터베이스 스키마
├── lib/
│   └── prisma.js                  # Prisma 클라이언트 싱글톤
├── services/
│   └── todoService.js             # Todo CRUD 서비스
├── routes/
│   └── todo.js                    # Express.js 라우터
├── test-todo.js                   # 테스트 파일
├── MIGRATION_GUIDE.md             # 마이그레이션 가이드
└── README_PRISMA.md               # 이 파일
```

---

## 설치 및 설정

### 1. 필수 패키지 설치

```bash
npm install @prisma/client prisma
npm install express  # 라우터 사용 시
```

### 2. .env 파일 설정

```env
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
```

### 3. Prisma 클라이언트 생성

```bash
npx prisma generate
```

### 4. 데이터베이스 마이그레이션

```bash
npx prisma migrate dev --name add_todo_model
```

---

## 데이터베이스 스키마

### Member 모델 (기존)

```prisma
model Member {
  @@map("tbl_member")
  
  id Int @id @default(autoincrement())
  memberEmail String @unique
  memberPassword String
  memberName String
  memberAge Int
  memberCreateAt DateTime @default(now())
  
  // 할일 관계
  todos Todo[]
}
```

### Todo 모델 (신규)

```prisma
model Todo {
  @@map("tbl_todo")
  @@index([memberId, createdAt(sort: Desc)])
  
  // 고유 식별자
  id Int @id @default(autoincrement())
  
  // 외래키 (회원 참조)
  memberId Int
  member Member @relation(fields: [memberId], references: [id], onDelete: Cascade)
  
  // 할일 내용 (최대 200자)
  content String @db.VarChar(200)
  
  // 완료 여부 (기본값: 미완료)
  completed Boolean @default(false)
  
  // 타임스탬프
  createdAt DateTime @default(now())      // 작성 시간
  completedAt DateTime?                   // 완료 시간 (nullable)
  updatedAt DateTime @updatedAt           // 수정 시간
  
  // 소프트 삭제 플래그
  isDeleted Boolean @default(false)
}
```

### 테이블 관계

```
tbl_member (1) ─── (N) tbl_todo
   id               memberId
                    ↓
             (외래키 제약)
```

**관계 규칙:**
- Member 1 : Todo N (1대 다)
- 회원 삭제 시 해당 할일도 함께 삭제 (`onDelete: Cascade`)
- 인덱스: `(memberId, createdAt DESC)` - 회원별 최신순 조회 최적화

---

## 서비스 계층 API

`TodoService` 클래스는 모든 CRUD 작업을 담당합니다.

### 초기화

```javascript
const { getTodoService } = require('./services/todoService');
const todoService = getTodoService();
```

### CREATE 메서드

#### `createTodo(memberId, content)`

새로운 할일을 생성합니다.

**매개변수:**
- `memberId` (number): 회원 ID
- `content` (string): 할일 내용 (1자 이상 200자 이하)

**반환값:**
- Promise<Todo>: 생성된 할일 객체

**에러:**
- "유효한 회원 ID가 필요합니다"
- "할일 내용이 필요합니다"
- "공백만으로는 할일을 등록할 수 없습니다"
- "할일 내용은 200자 이하여야 합니다"
- "존재하지 않는 회원입니다"

**예제:**

```javascript
try {
  const todo = await todoService.createTodo(1, '장보기');
  console.log(`할일 #${todo.id} 생성: ${todo.content}`);
} catch (error) {
  console.error('에러:', error.message);
}
```

---

### READ 메서드

#### `getTodosByMember(memberId, options)`

특정 회원의 모든 할일을 조회합니다.

**매개변수:**
- `memberId` (number): 회원 ID
- `options.filter` (string): 필터 옵션
  - `'all'` - 모든 할일 (기본값)
  - `'completed'` - 완료된 할일만
  - `'pending'` - 미완료 할일만

**반환값:**
- Promise<Todo[]>: 할일 배열 (최신순 정렬)

**에러:**
- "할일 목록 조회 중 오류가 발생했습니다"

**예제:**

```javascript
// 모든 할일
const allTodos = await todoService.getTodosByMember(1);

// 미완료 할일만
const pendingTodos = await todoService.getTodosByMember(1, { filter: 'pending' });

// 완료된 할일만
const completedTodos = await todoService.getTodosByMember(1, { filter: 'completed' });

// 결과 출력
console.log(`전체: ${allTodos.length}개, 미완료: ${pendingTodos.length}개`);
```

---

#### `getTodoById(todoId, memberId)`

특정 할일 하나를 조회합니다.

**매개변수:**
- `todoId` (number): 할일 ID
- `memberId` (number): 회원 ID (소유자 검증용)

**반환값:**
- Promise<Todo>: 할일 객체

**에러:**
- "할일을 찾을 수 없습니다" (존재하지 않거나 소유자가 아님)

**예제:**

```javascript
try {
  const todo = await todoService.getTodoById(1, 1);
  console.log(`${todo.content} (완료: ${todo.completed})`);
} catch (error) {
  console.error('할일을 찾을 수 없습니다');
}
```

---

### UPDATE 메서드

#### `updateTodoContent(todoId, memberId, newContent)`

할일의 내용을 수정합니다.

**매개변수:**
- `todoId` (number): 할일 ID
- `memberId` (number): 회원 ID (소유자 검증용)
- `newContent` (string): 새로운 내용 (1자 이상 200자 이하)

**반환값:**
- Promise<Todo>: 수정된 할일 객체

**에러:**
- "할일 내용이 필요합니다"
- "공백만으로는 할일을 수정할 수 없습니다"
- "할일 내용은 200자 이하여야 합니다"
- "할일을 찾을 수 없습니다"

**예제:**

```javascript
const updated = await todoService.updateTodoContent(
  1,
  1,
  '장보기 - 우유, 계란 추가'
);
console.log(`수정됨: ${updated.content}`);
```

---

#### `toggleTodoCompletion(todoId, memberId)`

할일의 완료 상태를 토글합니다 (완료 ↔ 미완료).

**매개변수:**
- `todoId` (number): 할일 ID
- `memberId` (number): 회원 ID (소유자 검증용)

**반환값:**
- Promise<Todo>: 수정된 할일 객체
  - 완료 시: `completed = true`, `completedAt = 현재 시각`
  - 미완료 시: `completed = false`, `completedAt = null`

**에러:**
- "할일을 찾을 수 없습니다"

**예제:**

```javascript
const todo = await todoService.toggleTodoCompletion(1, 1);

if (todo.completed) {
  console.log(`완료됨 (${todo.completedAt})`);
} else {
  console.log('미완료로 변경됨');
}
```

---

### DELETE 메서드

#### `deleteTodo(todoId, memberId)`

할일을 소프트 삭제합니다 (논리적 삭제).

**매개변수:**
- `todoId` (number): 할일 ID
- `memberId` (number): 회원 ID (소유자 검증용)

**반환값:**
- Promise<Todo>: 삭제된 할일 객체 (isDeleted = true)

**에러:**
- "할일을 찾을 수 없습니다"

**특징:**
- 실제 DB 행은 유지됨
- 조회 쿼리에서 제외됨
- 필요 시 복구 가능

**예제:**

```javascript
const deleted = await todoService.deleteTodo(1, 1);
console.log(`삭제됨: "${deleted.content}"`);

// 삭제 후 조회 시 목록에서 제외
const todos = await todoService.getTodosByMember(1);
// deleted는 포함되지 않음
```

---

#### `hardDeleteTodo(todoId, memberId)`

할일을 영구 삭제합니다 (물리적 삭제).

**매개변수:**
- `todoId` (number): 할일 ID
- `memberId` (number): 회원 ID (소유자 검증용)

**반환값:**
- Promise<Todo>: 삭제된 할일 객체

**에러:**
- "할일을 찾을 수 없습니다"

**주의:**
- 삭제된 데이터는 복구 불가능
- 관리자 작업이나 특수한 상황에서만 사용

**예제:**

```javascript
// 영구 삭제 - 신중하게 사용
const deleted = await todoService.hardDeleteTodo(1, 1);
```

---

### 기타 메서드

#### `getTodoStats(memberId)`

할일 통계를 조회합니다.

**반환값:**
```javascript
{
  total: 10,      // 전체 할일 수
  completed: 3,   // 완료된 할일 수
  pending: 7      // 미완료 할일 수
}
```

**예제:**

```javascript
const stats = await todoService.getTodoStats(1);
console.log(`${stats.pending}개 남음 (전체 ${stats.total}개 중)`);
```

---

#### `getAllTodosIncludingDeleted(memberId)`

소프트 삭제된 항목을 포함한 모든 할일을 조회합니다.

**반환값:**
- Promise<Todo[]>: 모든 할일 배열 (isDeleted 상관없이)

---

#### `purgeDeletedTodos(memberId, daysOld)`

소프트 삭제된 오래된 할일을 영구 삭제합니다.

**매개변수:**
- `memberId` (number): 회원 ID
- `daysOld` (number): N일 이전 항목만 삭제 (기본값: 0 = 모두)

**반환값:**
- Promise<number>: 삭제된 항목 수

**예제:**

```javascript
// 30일 이상 전에 소프트 삭제된 항목 영구 삭제
const purged = await todoService.purgeDeletedTodos(1, 30);
console.log(`${purged}개 항목 영구 삭제`);
```

---

## 라우터 API

Express.js 라우터는 TodoService를 HTTP 엔드포인트로 노출합니다.

### 라우터 등록

```javascript
const express = require('express');
const todoRouter = require('./routes/todo');

const app = express();
app.use(express.json());
app.use('/api/todos', todoRouter);
```

### 응답 포맷

모든 응답은 다음 형식을 따릅니다:

```json
{
  "success": true,
  "data": { /* 응답 데이터 */ },
  "message": "설명 메시지"
}
```

---

### POST /api/todos - 할일 생성

```http
POST /api/todos
Content-Type: application/json

{
  "content": "장보기"
}
```

**응답 (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "memberId": 1,
    "content": "장보기",
    "completed": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "completedAt": null,
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "isDeleted": false
  },
  "message": "할일이 등록되었습니다"
}
```

---

### GET /api/todos - 할일 목록 조회

```http
GET /api/todos?filter=all
```

**쿼리 매개변수:**
- `filter`: `all` | `pending` | `completed` (기본값: `all`)

**응답 (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "memberId": 1,
      "content": "보고서 작성",
      "completed": false,
      "createdAt": "2024-01-15T10:31:00.000Z",
      "completedAt": null,
      "updatedAt": "2024-01-15T10:31:00.000Z",
      "isDeleted": false
    },
    {
      "id": 1,
      "memberId": 1,
      "content": "장보기",
      "completed": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "completedAt": "2024-01-15T10:32:00.000Z",
      "updatedAt": "2024-01-15T10:32:00.000Z",
      "isDeleted": false
    }
  ],
  "message": "할일 목록 조회 완료 (총 2개)"
}
```

---

### GET /api/todos/:id - 특정 할일 조회

```http
GET /api/todos/1
```

**응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "memberId": 1,
    "content": "장보기",
    "completed": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "completedAt": "2024-01-15T10:32:00.000Z",
    "updatedAt": "2024-01-15T10:32:00.000Z",
    "isDeleted": false
  },
  "message": "할일 조회 완료"
}
```

---

### PUT /api/todos/:id - 할일 수정

```http
PUT /api/todos/1
Content-Type: application/json

{
  "content": "장보기 - 우유, 계란, 빵"
}
```

**응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "memberId": 1,
    "content": "장보기 - 우유, 계란, 빵",
    "completed": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "completedAt": "2024-01-15T10:32:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z",
    "isDeleted": false
  },
  "message": "할일이 수정되었습니다"
}
```

---

### PATCH /api/todos/:id/toggle - 완료 상태 토글

```http
PATCH /api/todos/1/toggle
```

**응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "memberId": 1,
    "content": "장보기",
    "completed": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "completedAt": null,
    "updatedAt": "2024-01-15T10:36:00.000Z",
    "isDeleted": false
  },
  "message": "할일이 미완료로 변경되었습니다"
}
```

---

### DELETE /api/todos/:id - 할일 삭제

```http
DELETE /api/todos/1
```

**응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "memberId": 1,
    "content": "장보기",
    "completed": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "completedAt": null,
    "updatedAt": "2024-01-15T10:37:00.000Z",
    "isDeleted": true
  },
  "message": "할일이 삭제되었습니다"
}
```

---

### GET /api/todos/stats/summary - 통계 조회

```http
GET /api/todos/stats/summary
```

**응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "completed": 3,
    "pending": 7
  },
  "message": "할일 통계 조회 완료"
}
```

---

## 사용 예제

### 예제 1: 기본 CRUD

```javascript
const { getTodoService } = require('./services/todoService');

async function example1() {
  const todoService = getTodoService();
  const memberId = 1;

  try {
    // CREATE: 할일 생성
    const todo = await todoService.createTodo(memberId, '매일 운동하기');
    console.log('생성:', todo);

    // READ: 목록 조회
    const todos = await todoService.getTodosByMember(memberId);
    console.log('목록:', todos);

    // UPDATE: 내용 수정
    const updated = await todoService.updateTodoContent(
      todo.id,
      memberId,
      '매일 30분 운동하기'
    );
    console.log('수정:', updated);

    // UPDATE: 완료 상태 토글
    const toggled = await todoService.toggleTodoCompletion(todo.id, memberId);
    console.log('토글:', toggled);

    // DELETE: 삭제
    const deleted = await todoService.deleteTodo(todo.id, memberId);
    console.log('삭제:', deleted);
  } catch (error) {
    console.error('에러:', error.message);
  }
}

example1();
```

---

### 예제 2: Express.js 라우터 통합

```javascript
// server.js
const express = require('express');
const todoRouter = require('./routes/todo');

const app = express();

app.use(express.json());

// 인증 미들웨어 (예)
app.use((req, res, next) => {
  // 실제 구현에서는 JWT, 세션 등으로 사용자 인증
  req.user = { id: 1 }; // 임시로 사용자 ID 설정
  next();
});

// 라우터 등록
app.use('/api/todos', todoRouter);

app.listen(3000, () => {
  console.log('서버 시작: http://localhost:3000');
});
```

**테스트:**

```bash
# 할일 생성
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"content":"장보기"}'

# 목록 조회
curl http://localhost:3000/api/todos

# 미완료만 조회
curl "http://localhost:3000/api/todos?filter=pending"

# 특정 할일 조회
curl http://localhost:3000/api/todos/1

# 할일 수정
curl -X PUT http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"content":"장보기 - 우유 추가"}'

# 완료 토글
curl -X PATCH http://localhost:3000/api/todos/1/toggle

# 삭제
curl -X DELETE http://localhost:3000/api/todos/1

# 통계 조회
curl http://localhost:3000/api/todos/stats/summary
```

---

### 예제 3: 입력 검증

```javascript
const { getTodoService } = require('./services/todoService');

async function validateInput() {
  const todoService = getTodoService();
  const memberId = 1;

  const testCases = [
    { input: '', expected: '빈 값 거부' },
    { input: '   ', expected: '공백만 입력 거부' },
    { input: 'a'.repeat(201), expected: '200자 초과 거부' },
    { input: '  정상 입력  ', expected: '공백 제거 후 정상 저장' },
  ];

  for (const test of testCases) {
    try {
      const result = await todoService.createTodo(memberId, test.input);
      console.log(`✓ ${test.expected}: "${result.content}"`);
    } catch (error) {
      console.log(`✓ ${test.expected}: ${error.message}`);
    }
  }
}

validateInput();
```

---

## 에러 처리

### 서비스 레벨 에러

```javascript
try {
  const todo = await todoService.createTodo(999, 'Task');
} catch (error) {
  // error.message: "존재하지 않는 회원입니다"
  console.error(error.message);
}

try {
  const todo = await todoService.getTodoById(999, 1);
} catch (error) {
  // error.message: "할일을 찾을 수 없습니다"
  console.error(error.message);
}
```

### Prisma 에러 코드

| 코드 | 의미 | 처리 |
|------|------|------|
| P2003 | 외래키 제약 위반 | 존재하지 않는 회원 |
| P2025 | 레코드 없음 | 찾을 수 없음 |
| P2002 | 고유 제약 위반 | 중복 입력 |

```javascript
const { PrismaClientKnownRequestError } = require('@prisma/client/runtime/library');

try {
  await todoService.createTodo(memberId, content);
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      // 외래키 제약 위반
    } else if (error.code === 'P2025') {
      // 레코드 없음
    }
  }
}
```

---

## 성능 최적화

### 인덱스

테이블에 설정된 인덱스:

```sql
INDEX (memberId, createdAt DESC)
```

이 인덱스는 다음 쿼리를 최적화합니다:
- 특정 회원의 할일을 최신순으로 조회
- 완료/미완료 필터링

### 조회 최적화

```javascript
// 좋은 예: 인덱스 활용
const todos = await todoService.getTodosByMember(memberId);

// 피할 것: 모든 회원의 할일 조회
const allTodos = await prisma.todo.findMany();
```

### 배치 작업

```javascript
// 여러 할일 동시 삭제
const deletedCount = await todoService.purgeDeletedTodos(memberId, 30);
```

---

## 보안 고려사항

### 1. 소유자 검증

모든 수정/삭제 작업에서 회원 ID를 검증합니다:

```javascript
// 서비스에서 자동 검증
await todoService.updateTodoContent(todoId, memberId, content);
// memberId가 일치하지 않으면 에러 발생
```

### 2. 입력 검증

공백 제거 및 길이 제한:

```javascript
const trimmedContent = content.trim();
if (trimmedContent.length === 0) {
  throw new Error('공백만으로는...');
}
if (trimmedContent.length > 200) {
  throw new Error('200자 이하...');
}
```

### 3. SQL 인젝션 방지

Prisma는 파라미터화된 쿼리를 사용하므로 자동 보호됩니다:

```javascript
// 안전: Prisma가 자동으로 처리
const todo = await prisma.todo.findFirst({
  where: {
    content: userInput,  // SQL 인젝션 불가능
  },
});
```

---

## FAQ

### Q1: 소프트 삭제된 항목을 복구할 수 있나요?

A: 예. `isDeleted` 플래그를 다시 `false`로 설정하면 복구 가능합니다.

```javascript
await prisma.todo.update({
  where: { id: todoId },
  data: { isDeleted: false },
});
```

### Q2: 할일을 정렬 순서를 바꿀 수 있나요?

A: 현재는 최신순만 지원합니다. 커스텀 정렬을 원하면 서비스에 메서드 추가:

```javascript
async getTodosByMember(memberId, { filter = 'all', orderBy = 'createdAt' }) {
  return await this.prisma.todo.findMany({
    where: { /* ... */ },
    orderBy: { [orderBy]: 'desc' },
  });
}
```

### Q3: 대량의 할일을 일괄 처리할 수 있나요?

A: 예. Prisma의 `updateMany`, `deleteMany` 사용:

```javascript
await prisma.todo.updateMany({
  where: { memberId, completed: false },
  data: { completed: true },
});
```

---

**작성일**: 2024-01-15  
**버전**: 1.0  
**상태**: 완료
