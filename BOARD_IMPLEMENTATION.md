# 비회원 게시판 백엔드 구현 가이드

## 📋 프로젝트 구조

```
day02/
├── api-server.js                 # Express 메인 서버 (라우터 등록)
├── lib/
│   └── prisma.js                 # Prisma 싱글톤 관리
├── services/
│   ├── todoService.js            # Todo 비즈니스 로직
│   └── boardService.js           # Board 비즈니스 로직 (NEW)
├── routes/
│   ├── todo.js                   # Todo API 라우터
│   └── board-router.js           # Board API 라우터 (NEW)
├── prisma/
│   └── schema.prisma             # 데이터베이스 스키마
├── BOARD_API_GUIDE.md            # API 문서 (NEW)
└── BOARD_IMPLEMENTATION.md       # 이 파일
```

---

## 🔧 구현된 파일

### 1. `lib/prisma.js` - Prisma 싱글톤

**목적**: 전체 애플리케이션에서 단일 데이터베이스 연결 유지

**주요 기능**:
- Prisma 클라이언트 싱글톤 인스턴스 관리
- 프로세스 종료 시 graceful shutdown 처리
- 개발 환경에서 쿼리 로깅

**내보낸 함수**:
```javascript
getPrismaInstance()        // Prisma 클라이언트 인스턴스 반환
closePrismaConnection()    // 데이터베이스 연결 종료
```

---

### 2. `services/boardService.js` - Board 서비스

**목적**: 게시글과 댓글의 모든 CRUD 작업을 담당하는 비즈니스 로직

**클래스**: `BoardService`

#### 게시글(Post) 메서드

##### `createPost(data)`
- **설명**: 새로운 게시글 작성
- **파라미터**: `{ title, content, author_name }`
- **반환**: 생성된 게시글 객체
- **유효성 검사**:
  - 제목: 1~200자 필수
  - 내용: 1~10000자 필수
  - 작성자명: 1~100자 필수

```javascript
const post = await boardService.createPost({
  title: '게시글 제목',
  content: '게시글 내용',
  author_name: '작성자'
});
```

##### `getPosts(page)`
- **설명**: 게시글 목록 조회 (페이지네이션)
- **파라미터**: `page` (페이지 번호, 기본값: 1)
- **반환**: `{ posts: [], total: number, page: number, totalPages: number }`
- **특징**:
  - 최신순으로 정렬
  - 페이지당 10개
  - 댓글 개수 포함

```javascript
const result = await boardService.getPosts(1);
console.log(result.posts);      // 게시글 배열
console.log(result.totalPages); // 전체 페이지 수
```

##### `getPostById(postId)`
- **설명**: 게시글 상세보기 (조회수 +1)
- **파라미터**: `postId` (게시글 ID)
- **반환**: 게시글 객체 (댓글 포함)
- **부작용**: 조회수가 1 증가함

```javascript
const post = await boardService.getPostById(1);
console.log(post.view_count);    // 증가된 조회수
console.log(post.comments);      // 댓글 배열
```

##### `updatePost(postId, data)`
- **설명**: 게시글 수정
- **파라미터**: `postId`, `{ title?, content? }`
- **반환**: 수정된 게시글 객체
- **특징**: 제목과 내용 중 하나만 수정 가능

```javascript
const updated = await boardService.updatePost(1, {
  title: '수정된 제목',
  content: '수정된 내용'
});
```

##### `deletePost(postId)`
- **설명**: 게시글 삭제 (Cascade Delete)
- **파라미터**: `postId`
- **반환**: 삭제된 게시글 객체 (댓글 포함)
- **특징**: 게시글 삭제 시 댓글도 함께 삭제됨

```javascript
const deleted = await boardService.deletePost(1);
console.log(deleted.comments); // 함께 삭제된 댓글들
```

---

#### 댓글(Comment) 메서드

##### `getComments(postId)`
- **설명**: 게시글의 댓글 목록 조회
- **파라미터**: `postId`
- **반환**: 댓글 배열
- **정렬**: 생성 시간순 (오름차순)

```javascript
const comments = await boardService.getComments(1);
```

##### `createComment(postId, data)`
- **설명**: 새로운 댓글 작성
- **파라미터**: `postId`, `{ content, author_name }`
- **반환**: 생성된 댓글 객체
- **유효성 검사**:
  - 내용: 1~2000자 필수
  - 작성자명: 1~100자 필수

```javascript
const comment = await boardService.createComment(1, {
  content: '좋은 글입니다!',
  author_name: '독자'
});
```

##### `updateComment(postId, commentId, data)`
- **설명**: 댓글 수정
- **파라미터**: `postId`, `commentId`, `{ content? }`
- **반환**: 수정된 댓글 객체

```javascript
const updated = await boardService.updateComment(1, 5, {
  content: '수정된 댓글'
});
```

##### `deleteComment(postId, commentId)`
- **설명**: 댓글 삭제
- **파라미터**: `postId`, `commentId`
- **반환**: 삭제된 댓글 객체

```javascript
const deleted = await boardService.deleteComment(1, 5);
```

---

### 3. `routes/board-router.js` - Board 라우터

**마운트 경로**: `/api/posts`

#### 게시글 라우트

| 메서드 | 경로 | 설명 | 상태 코드 |
|--------|------|------|----------|
| GET | `/` | 게시글 목록 조회 | 200 |
| POST | `/` | 새 게시글 작성 | 201 |
| GET | `/:id` | 게시글 상세보기 | 200 |
| PUT | `/:id` | 게시글 수정 | 200 |
| DELETE | `/:id` | 게시글 삭제 | 200 |

#### 댓글 라우트

| 메서드 | 경로 | 설명 | 상태 코드 |
|--------|------|------|----------|
| GET | `/:postId/comments` | 댓글 목록 조회 | 200 |
| POST | `/:postId/comments` | 댓글 작성 | 201 |
| PUT | `/:postId/comments/:commentId` | 댓글 수정 | 200 |
| DELETE | `/:postId/comments/:commentId` | 댓글 삭제 | 200 |

**특징**:
- 모든 요청에 대해 try-catch 에러 핸들링
- 일관된 JSON 응답 포맷
- 유효성 검사 실패 시 400 응답
- 리소스 없음 시 404 응답

---

### 4. `api-server.js` - 수정 사항

**추가된 코드**:

```javascript
// 라우터 임포트 추가
const boardRouter = require('./routes/board-router');

// 미들웨어에 PUT 메서드 추가
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  // ...
});

// 라우터 등록
app.use('/api/posts', boardRouter);

// 루트 경로 응답에 게시판 API 추가
app.get('/', (req, res) => {
  res.json({
    // ... TODO API ...
    '게시판 API': {
      'GET /api/posts': '게시글 목록 조회 (페이지네이션)',
      'POST /api/posts': '새 게시글 작성',
      // ... 등
    }
  });
});
```

---

## 🎯 주요 기능

### 1. 게시글 관리
- ✅ 전체 게시글 조회 (페이지네이션)
- ✅ 새 게시글 작성
- ✅ 게시글 상세보기 (조회수 증가)
- ✅ 게시글 수정
- ✅ 게시글 삭제 (댓글 함께 삭제)

### 2. 댓글 관리
- ✅ 게시글별 댓글 조회
- ✅ 새 댓글 작성
- ✅ 댓글 수정
- ✅ 댓글 삭제

### 3. 유효성 검사
- ✅ 필수 필드 검증
- ✅ 문자 길이 검증
- ✅ 공백만 입력 방지
- ✅ 게시글/댓글 존재 여부 확인

### 4. 에러 처리
- ✅ 입력 오류 (400)
- ✅ 리소스 없음 (404)
- ✅ 서버 오류 (500)
- ✅ 모든 에러에 메시지 제공

### 5. 데이터베이스
- ✅ Prisma ORM 사용
- ✅ 1:N 관계 설정
- ✅ Cascade Delete 구현
- ✅ 인덱스 최적화

---

## 💾 데이터베이스 스키마

### Post 테이블
```prisma
model Post {
  id              Int       @id @default(autoincrement())
  title           String    @db.VarChar(200)
  content         String    @db.VarChar(10000)
  author_name     String
  view_count      Int       @default(0)
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  comments        Comment[]
  
  @@map("tbl_post")
  @@index([created_at(sort: Desc)])
  @@index([view_count(sort: Desc)])
}
```

### Comment 테이블
```prisma
model Comment {
  id              Int       @id @default(autoincrement())
  post_id         Int
  content         String    @db.VarChar(2000)
  author_name     String
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  post            Post      @relation(fields: [post_id], references: [id], onDelete: Cascade)
  
  @@map("tbl_comment")
  @@index([post_id, created_at(sort: Asc)])
}
```

---

## 🚀 사용 방법

### 서버 시작
```bash
node api-server.js
```

출력:
```
============================================================
TODO & 게시판 API 서버가 포트 3000에서 실행 중입니다.
http://localhost:3000
============================================================

사용 가능한 엔드포인트:

[TODO API]
- POST   /api/todos                    : 새로운 할일 추가
- ...

[게시판 API]
- GET    /api/posts                    : 게시글 목록 조회
- POST   /api/posts                    : 새 게시글 작성
- ...
```

### API 테스트 (cURL 예시)

**게시글 작성:**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "첫 번째 게시글",
    "content": "게시글 내용입니다.",
    "author_name": "홍길동"
  }'
```

**게시글 목록:**
```bash
curl -X GET "http://localhost:3000/api/posts?page=1"
```

**게시글 상세보기:**
```bash
curl -X GET "http://localhost:3000/api/posts/1"
```

**댓글 작성:**
```bash
curl -X POST "http://localhost:3000/api/posts/1/comments" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "좋은 글입니다!",
    "author_name": "김영희"
  }'
```

---

## 📚 응답 예시

### 게시글 작성 성공 (201)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "첫 번째 게시글",
    "content": "게시글 내용입니다.",
    "author_name": "홍길동",
    "view_count": 0,
    "created_at": "2026-09-19T10:30:00.000Z",
    "updated_at": "2026-09-19T10:30:00.000Z"
  },
  "message": "게시글이 작성되었습니다"
}
```

### 게시글 목록 조회 (200)
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "첫 번째 게시글",
        "author_name": "홍길동",
        "view_count": 5,
        "comment_count": 2,
        "created_at": "2026-09-19T10:30:00.000Z",
        "updated_at": "2026-09-19T10:30:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "totalPages": 3
  },
  "message": "게시글 목록 조회 완료 (총 25개, 1/3 페이지)"
}
```

### 유효성 검사 실패 (400)
```json
{
  "success": false,
  "data": null,
  "message": "게시글 제목이 필요합니다"
}
```

### 리소스 없음 (404)
```json
{
  "success": false,
  "data": null,
  "message": "게시글을 찾을 수 없습니다"
}
```

---

## 🔍 코드 주석 규칙

모든 코드에는 다음과 같이 주석이 달려 있습니다:

```javascript
/**
 * ============================================================
 * 섹션 제목
 * ============================================================
 */

// 한 줄 주석: 코드의 목적 설명
const variable = value;

/**
 * 함수 설명
 * @param {타입} 파라미터 - 설명
 * @returns {타입} 반환값 설명
 */
async function exampleFunction(param) {
  // 세부 로직 설명
}
```

---

## ✅ 구현 체크리스트

- [x] Prisma 싱글톤 (`lib/prisma.js`)
- [x] Board 서비스 (`services/boardService.js`)
  - [x] 게시글 CRUD
  - [x] 댓글 CRUD
  - [x] 유효성 검사
  - [x] 에러 처리
- [x] Board 라우터 (`routes/board-router.js`)
  - [x] 게시글 엔드포인트
  - [x] 댓글 엔드포인트
  - [x] 에러 핸들링
- [x] 서버 통합 (`api-server.js`)
- [x] API 문서 (`BOARD_API_GUIDE.md`)

---

## 🎓 학습 포인트

1. **Prisma ORM**: 데이터베이스 쿼리를 타입 안전하게 작성
2. **서비스 패턴**: 비즈니스 로직을 별도 계층으로 분리
3. **라우터 패턴**: HTTP 요청을 service로 위임
4. **에러 처리**: try-catch와 HTTP 상태 코드 활용
5. **유효성 검사**: 입력 데이터 검증의 중요성
6. **데이터베이스 관계**: 1:N 관계와 Cascade Delete
7. **페이지네이션**: 대용량 데이터 조회 최적화

---

## 📝 추가 정보

- **데이터베이스**: MySQL
- **ORM**: Prisma
- **웹 프레임워크**: Express.js
- **Node.js 버전**: 14.0 이상 권장
- **API 문서**: `BOARD_API_GUIDE.md` 참조
