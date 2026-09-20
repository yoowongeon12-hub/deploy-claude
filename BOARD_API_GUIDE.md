# 게시판 API 가이드

## 개요

비회원 게시판의 Express.js CRUD API입니다. Prisma ORM을 사용하여 MySQL 데이터베이스와 연동됩니다.

### 기본 정보
- **기본 URL**: `http://localhost:3000/api/posts`
- **응답 포맷**: JSON
- **응답 구조**: 
  ```json
  {
    "success": boolean,
    "data": any,
    "message": string
  }
  ```

---

## 1. 게시글(Post) API

### 1.1 게시글 목록 조회

**엔드포인트**: `GET /api/posts`

**설명**: 모든 게시글을 페이지네이션과 함께 조회합니다. 최신순으로 정렬되며, 페이지당 10개의 게시글을 반환합니다.

**쿼리 파라미터**:
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| `page` | number | 1 | 페이지 번호 (1부터 시작) |

**요청 예시**:
```bash
curl "http://localhost:3000/api/posts?page=1" \
  -X GET
```

**응답 예시** (성공 - 200):
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
      },
      {
        "id": 2,
        "title": "두 번째 게시글",
        "author_name": "김영희",
        "view_count": 3,
        "comment_count": 0,
        "created_at": "2026-09-19T09:00:00.000Z",
        "updated_at": "2026-09-19T09:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "totalPages": 3
  },
  "message": "게시글 목록 조회 완료 (총 25개, 1/3 페이지)"
}
```

**응답 예시** (오류 - 500):
```json
{
  "success": false,
  "data": null,
  "message": "게시글 목록 조회 중 오류가 발생했습니다"
}
```

---

### 1.2 새 게시글 작성

**엔드포인트**: `POST /api/posts`

**설명**: 새로운 게시글을 작성합니다. 비회원이므로 작성자명을 입력해야 합니다.

**요청 헤더**:
```
Content-Type: application/json
```

**요청 본문**:
| 필드 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `title` | string | O | 1~200자 | 게시글 제목 |
| `content` | string | O | 1~10000자 | 게시글 내용 |
| `author_name` | string | O | 1~100자 | 작성자 이름 |

**요청 예시**:
```bash
curl "http://localhost:3000/api/posts" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "title": "새로운 게시글 제목",
    "content": "게시글의 상세 내용입니다. 이 곳에 본문을 작성할 수 있습니다.",
    "author_name": "홍길동"
  }'
```

**응답 예시** (성공 - 201):
```json
{
  "success": true,
  "data": {
    "id": 3,
    "title": "새로운 게시글 제목",
    "content": "게시글의 상세 내용입니다. 이 곳에 본문을 작성할 수 있습니다.",
    "author_name": "홍길동",
    "view_count": 0,
    "created_at": "2026-09-19T12:00:00.000Z",
    "updated_at": "2026-09-19T12:00:00.000Z"
  },
  "message": "게시글이 작성되었습니다"
}
```

**응답 예시** (유효성 검사 실패 - 400):
```json
{
  "success": false,
  "data": null,
  "message": "게시글 제목이 필요합니다"
}
```

---

### 1.3 게시글 상세보기

**엔드포인트**: `GET /api/posts/:id`

**설명**: 특정 게시글을 조회합니다. 조회 시 조회수(view_count)가 1 증가합니다.

**URL 파라미터**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | number | 게시글 ID |

**요청 예시**:
```bash
curl "http://localhost:3000/api/posts/1" \
  -X GET
```

**응답 예시** (성공 - 200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "첫 번째 게시글",
    "content": "게시글의 상세 내용입니다.",
    "author_name": "홍길동",
    "view_count": 6,
    "created_at": "2026-09-19T10:30:00.000Z",
    "updated_at": "2026-09-19T10:30:00.000Z",
    "comments": [
      {
        "id": 1,
        "post_id": 1,
        "content": "좋은 글입니다!",
        "author_name": "김영희",
        "created_at": "2026-09-19T11:00:00.000Z",
        "updated_at": "2026-09-19T11:00:00.000Z"
      }
    ]
  },
  "message": "게시글 조회 완료"
}
```

**응답 예시** (게시글 없음 - 404):
```json
{
  "success": false,
  "data": null,
  "message": "게시글을 찾을 수 없습니다"
}
```

---

### 1.4 게시글 수정

**엔드포인트**: `PUT /api/posts/:id`

**설명**: 기존 게시글의 제목과 내용을 수정합니다.

**URL 파라미터**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | number | 게시글 ID |

**요청 본문** (수정할 필드만 전송 가능):
| 필드 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `title` | string | X | 1~200자 | 수정할 제목 |
| `content` | string | X | 1~10000자 | 수정할 내용 |

**요청 예시**:
```bash
curl "http://localhost:3000/api/posts/1" \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "title": "수정된 게시글 제목",
    "content": "수정된 게시글 내용입니다."
  }'
```

**응답 예시** (성공 - 200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "수정된 게시글 제목",
    "content": "수정된 게시글 내용입니다.",
    "author_name": "홍길동",
    "view_count": 6,
    "created_at": "2026-09-19T10:30:00.000Z",
    "updated_at": "2026-09-19T12:15:00.000Z",
    "comments": []
  },
  "message": "게시글이 수정되었습니다"
}
```

---

### 1.5 게시글 삭제

**엔드포인트**: `DELETE /api/posts/:id`

**설명**: 게시글을 삭제합니다. 게시글 삭제 시 해당 게시글의 모든 댓글도 함께 삭제됩니다. (Cascade Delete)

**URL 파라미터**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | number | 게시글 ID |

**요청 예시**:
```bash
curl "http://localhost:3000/api/posts/1" \
  -X DELETE
```

**응답 예시** (성공 - 200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "수정된 게시글 제목",
    "content": "수정된 게시글 내용입니다.",
    "author_name": "홍길동",
    "view_count": 6,
    "created_at": "2026-09-19T10:30:00.000Z",
    "updated_at": "2026-09-19T12:15:00.000Z",
    "comments": []
  },
  "message": "게시글이 삭제되었습니다"
}
```

---

## 2. 댓글(Comment) API

### 2.1 댓글 목록 조회

**엔드포인트**: `GET /api/posts/:postId/comments`

**설명**: 특정 게시글의 댓글 목록을 조회합니다. 생성 시간순으로 정렬됩니다.

**URL 파라미터**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `postId` | number | 게시글 ID |

**요청 예시**:
```bash
curl "http://localhost:3000/api/posts/1/comments" \
  -X GET
```

**응답 예시** (성공 - 200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "post_id": 1,
      "content": "좋은 글입니다!",
      "author_name": "김영희",
      "created_at": "2026-09-19T11:00:00.000Z",
      "updated_at": "2026-09-19T11:00:00.000Z"
    },
    {
      "id": 2,
      "post_id": 1,
      "content": "감사합니다!",
      "author_name": "이순신",
      "created_at": "2026-09-19T11:30:00.000Z",
      "updated_at": "2026-09-19T11:30:00.000Z"
    }
  ],
  "message": "댓글 목록 조회 완료 (총 2개)"
}
```

---

### 2.2 새 댓글 작성

**엔드포인트**: `POST /api/posts/:postId/comments`

**설명**: 특정 게시글에 새로운 댓글을 작성합니다.

**URL 파라미터**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `postId` | number | 게시글 ID |

**요청 본문**:
| 필드 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `content` | string | O | 1~2000자 | 댓글 내용 |
| `author_name` | string | O | 1~100자 | 작성자 이름 |

**요청 예시**:
```bash
curl "http://localhost:3000/api/posts/1/comments" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "content": "좋은 글입니다!",
    "author_name": "김영희"
  }'
```

**응답 예시** (성공 - 201):
```json
{
  "success": true,
  "data": {
    "id": 3,
    "post_id": 1,
    "content": "좋은 글입니다!",
    "author_name": "김영희",
    "created_at": "2026-09-19T12:00:00.000Z",
    "updated_at": "2026-09-19T12:00:00.000Z"
  },
  "message": "댓글이 작성되었습니다"
}
```

---

### 2.3 댓글 수정

**엔드포인트**: `PUT /api/posts/:postId/comments/:commentId`

**설명**: 기존 댓글의 내용을 수정합니다.

**URL 파라미터**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `postId` | number | 게시글 ID |
| `commentId` | number | 댓글 ID |

**요청 본문**:
| 필드 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `content` | string | X | 1~2000자 | 수정할 댓글 내용 |

**요청 예시**:
```bash
curl "http://localhost:3000/api/posts/1/comments/3" \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "content": "정말 좋은 글입니다!"
  }'
```

**응답 예시** (성공 - 200):
```json
{
  "success": true,
  "data": {
    "id": 3,
    "post_id": 1,
    "content": "정말 좋은 글입니다!",
    "author_name": "김영희",
    "created_at": "2026-09-19T12:00:00.000Z",
    "updated_at": "2026-09-19T12:30:00.000Z"
  },
  "message": "댓글이 수정되었습니다"
}
```

---

### 2.4 댓글 삭제

**엔드포인트**: `DELETE /api/posts/:postId/comments/:commentId`

**설명**: 특정 댓글을 삭제합니다.

**URL 파라미터**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `postId` | number | 게시글 ID |
| `commentId` | number | 댓글 ID |

**요청 예시**:
```bash
curl "http://localhost:3000/api/posts/1/comments/3" \
  -X DELETE
```

**응답 예시** (성공 - 200):
```json
{
  "success": true,
  "data": {
    "id": 3,
    "post_id": 1,
    "content": "정말 좋은 글입니다!",
    "author_name": "김영희",
    "created_at": "2026-09-19T12:00:00.000Z",
    "updated_at": "2026-09-19T12:30:00.000Z"
  },
  "message": "댓글이 삭제되었습니다"
}
```

---

## 3. 에러 처리

모든 API는 다음과 같은 HTTP 상태 코드를 반환합니다.

| 상태 코드 | 설명 | 예시 |
|----------|------|------|
| 200 | 성공 (조회, 수정, 삭제) | GET, PUT, DELETE 요청 성공 |
| 201 | 생성 성공 | POST 요청 성공 |
| 400 | 요청 오류 (유효성 검사 실패) | 필수 필드 누락, 필드 길이 초과 |
| 404 | 리소스 없음 | 게시글/댓글을 찾을 수 없음 |
| 500 | 서버 오류 | DB 연결 오류, 예상치 못한 오류 |

### 공통 에러 응답:
```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지"
}
```

---

## 4. 유효성 검사 규칙

### 게시글
- **제목**: 1~200자 필수
- **내용**: 1~10000자 필수
- **작성자명**: 1~100자 필수
- 공백만으로는 등록/수정 불가

### 댓글
- **내용**: 1~2000자 필수
- **작성자명**: 1~100자 필수
- 공백만으로는 작성/수정 불가

### 페이지네이션
- **페이지당 항목 수**: 10개
- **기본 페이지**: 1 (1부터 시작)
- **정렬**: 최신순 (created_at DESC)

---

## 5. 데이터베이스 구조

### Post 테이블
```
id: 자동 증가 정수 (PK)
title: 문자열 (최대 200자)
content: 문자열 (최대 10000자)
author_name: 문자열
view_count: 정수 (기본값: 0)
created_at: 타임스탬프 (자동 생성)
updated_at: 타임스탬프 (자동 갱신)
```

### Comment 테이블
```
id: 자동 증가 정수 (PK)
post_id: 정수 (FK -> Post.id, Cascade Delete)
content: 문자열 (최대 2000자)
author_name: 문자열
created_at: 타임스탬프 (자동 생성)
updated_at: 타임스탬프 (자동 갱신)
```

### 관계
- **Post 1 : Comment N** (일대다)
- 게시글 삭제 시 해당 댓글도 자동 삭제됨 (Cascade Delete)

---

## 6. 실행 방법

### 서버 시작
```bash
node api-server.js
```

### 데이터베이스 마이그레이션
```bash
npx prisma migrate dev --name init
```

### 데이터베이스 초기화
```bash
npx prisma db push
```

---

## 7. 예제 코드

### JavaScript (Fetch API)

**게시글 작성:**
```javascript
const createPost = async () => {
  const response = await fetch('http://localhost:3000/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '새 게시글',
      content: '게시글 내용',
      author_name: '홍길동'
    })
  });
  const data = await response.json();
  console.log(data);
};
```

**게시글 목록 조회:**
```javascript
const getPosts = async (page = 1) => {
  const response = await fetch(`http://localhost:3000/api/posts?page=${page}`);
  const data = await response.json();
  console.log(data.data.posts);
};
```

**댓글 작성:**
```javascript
const createComment = async (postId) => {
  const response = await fetch(
    `http://localhost:3000/api/posts/${postId}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '좋은 글입니다!',
        author_name: '김영희'
      })
    }
  );
  const data = await response.json();
  console.log(data);
};
```

---

## 8. 주의사항

1. **비회원 게시판**: 별도의 인증 시스템이 없습니다.
2. **조회수**: 게시글 조회 시 자동으로 1씩 증가합니다.
3. **Cascade Delete**: 게시글 삭제 시 해당 댓글이 자동으로 삭제됩니다.
4. **시간대**: UTC 기준으로 저장됩니다.
5. **정렬 순서**: 게시글은 최신순(내림차순), 댓글은 생성순(오름차순)입니다.
