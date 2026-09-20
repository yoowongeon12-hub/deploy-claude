# 백엔드 로직 결함 수정 및 개선 사항

## 수정 일시
2026-09-19

## 수정 내용

### 1. 댓글 중복 작성 문제 해결 ✅

**문제 분석:**
- `board-detail.js`의 `initBoardDetail()` 함수에서 페이지 로드 시마다 이벤트 리스너가 중복 등록됨
- 같은 페이지에서 새로고침 또는 재접속 시 버튼 클릭 이벤트가 여러 번 실행되어 댓글이 중복 작성됨

**해결 방법:**
- `replaceWith(cloneNode(true))`를 사용하여 기존 이벤트 리스너 제거
- 새로운 엘리먼트에만 이벤트 리스너 추가
- 모든 버튼(댓글 제출, 수정, 삭제)에 동일한 처리 적용

**영향받는 파일:**
- `js/board-detail.js`

### 2. 알람 위치 변경 (상단 헤더 → 오른쪽 아래) ✅

**문제 분석:**
- 기존 `alert()` 함수를 사용하여 헤더와 겹치는 문제 발생
- 사용자 경험 저하

**해결 방법:**
- `showToast()` 함수 구현: 토스트 메시지 시스템 도입
- CSS 스타일 추가: 화면 오른쪽 아래 고정 위치에 표시
- 애니메이션 효과: 슬라이드인/페이드아웃 애니메이션으로 부드러운 UX 제공

**토스트 메시지 특징:**
- 성공 (success): 녹색 배경 (#28a745)
- 에러 (error): 빨간색 배경 (#dc3545)
- 경고 (warning): 노란색 배경 (#ffc107)
- 정보 (info): 파란색 배경 (#17a2b8)
- 자동 소멸: 3초 후 자동으로 사라짐

**영향받는 파일:**
- `js/board-detail.js`: alert() → showToast() 변환
- `style/board-detail.css`: 토스트 메시지 스타일 추가

### 3. Swagger 3.0 설치 및 API 문서 자동 생성 ✅

**설치된 패키지:**
- `swagger-ui-express`: ^5.0.0 (Swagger UI 제공)
- `swagger-jsdoc`: ^6.2.8 (JSDoc에서 OpenAPI 3.0 스펙 생성)

**설정 파일:**
- `swagger-config.js`: 새로 생성
  - OpenAPI 3.0 정의
  - API 메타데이터 설정
  - 라우터 파일 지정

**엔드포인트:**
- `/api-docs`: Swagger UI 인터페이스
- `/api-docs/swagger.json`: OpenAPI 스펙 JSON

**추가된 Swagger 주석:**

#### 게시글 API (Posts)
- `GET /api/posts`: 게시글 목록 조회 (페이지네이션)
- `POST /api/posts`: 새 게시글 작성
- `GET /api/posts/{id}`: 게시글 상세보기
- `PUT /api/posts/{id}`: 게시글 수정
- `DELETE /api/posts/{id}`: 게시글 삭제

#### 댓글 API (Comments)
- `GET /api/posts/{postId}/comments`: 댓글 목록 조회
- `POST /api/posts/{postId}/comments`: 댓글 작성
- `PUT /api/posts/{postId}/comments/{commentId}`: 댓글 수정
- `DELETE /api/posts/{postId}/comments/{commentId}`: 댓글 삭제

#### TODO API (Todos)
- `POST /api/todos`: 새 TODO 생성
- `GET /api/todos`: TODO 목록 조회
- `GET /api/todos/{id}`: 특정 TODO 조회
- `PUT /api/todos/{id}`: TODO 내용 수정
- `PATCH /api/todos/{id}/toggle`: TODO 완료 상태 토글
- `DELETE /api/todos/{id}`: TODO 삭제
- `GET /api/todos/stats/summary`: TODO 통계 조회

**영향받는 파일:**
- `package.json`: 의존성 추가
- `api-server.js`: Swagger UI 미들웨어 등록
- `swagger-config.js`: 새로 생성
- `routes/board-router.js`: Swagger JSDoc 주석 추가
- `routes/todo.js`: Swagger JSDoc 주석 추가

## 사용 방법

### 서버 실행
```bash
npm install  # 의존성 설치
npm start    # 서버 시작 (포트 3000)
```

### API 문서 접근
```
http://localhost:3000/api-docs
```

### 수정 전/후 비교

#### 댓글 작성 버그
**전:** 같은 버튼을 여러 번 클릭 시 댓글 중복 생성
**후:** 한 번만 생성 (이벤트 리스너 중복 제거)

#### 알림 표시
**전:** 중앙 상단에 JavaScript alert() 표시
**후:** 오른쪽 아래 토스트 메시지로 표시 (UX 개선)

#### API 문서
**전:** 별도의 API 문서 제공 없음
**후:** Swagger UI에서 인터랙티브한 API 문서 제공

## 테스트 항목

1. ✅ 댓글 작성 후 중복 여부 확인
2. ✅ 댓글 수정/삭제 시 오른쪽 아래 토스트 메시지 확인
3. ✅ `http://localhost:3000/api-docs` 접속 가능 여부 확인
4. ✅ Swagger UI에서 모든 엔드포인트 확인
5. ✅ Swagger UI에서 API 테스트 실행

## 기술 스택

- **백엔드 프레임워크**: Express.js 5.2.1
- **API 문서**: Swagger/OpenAPI 3.0
- **데이터베이스**: Prisma ORM
- **프론트엔드**: Vanilla JavaScript (SPA)

## 주의사항

- Swagger UI 접근 후 새로고침 시 모든 엔드포인트가 표시됨
- 토스트 메시지는 자동으로 3초 후 사라짐
- 댓글 버튼 클릭 시 중복 등록이 방지됨
