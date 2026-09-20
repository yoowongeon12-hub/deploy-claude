# TODO API 가이드

Express.js를 기반으로 한 TODO 관리 CRUD API 서버입니다.

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. API 서버 시작
```bash
npm start
```

또는 직접 실행:
```bash
node api-server.js
```

서버는 포트 3000에서 실행됩니다.
```
http://localhost:3000
```

## API 엔드포인트

### 기본 응답 포맷
모든 API 응답은 다음 구조를 따릅니다:
```json
{
  "success": true,
  "data": {},
  "message": "설명"
}
```

---

## 1. POST /api/todos - 새로운 할일 추가

**요청:**
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"content": "할일 내용"}'
```

**요청 본문:**
```json
{
  "content": "할일 내용"
}
```

**성공 응답 (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1694223456789,
    "content": "할일 내용",
    "completed": false,
    "createdAt": "2024-09-16T10:00:00.000Z",
    "completedAt": null
  },
  "message": "할일이 정상적으로 추가되었습니다."
}
```

**에러 응답 (400 Bad Request):**
```json
{
  "success": false,
  "data": null,
  "message": "할일 내용을 입력해주세요."
}
```

**검증 규칙:**
- ✓ 필수 입력: `content`
- ✓ 최소 길이: 1글자
- ✓ 최대 길이: 200글자

---

## 2. GET /api/todos - 모든 할일 조회

**요청:**
```bash
curl http://localhost:3000/api/todos
```

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1694223456789,
      "content": "첫 번째 할일",
      "completed": false,
      "createdAt": "2024-09-16T10:00:00.000Z",
      "completedAt": null
    },
    {
      "id": 1694223456790,
      "content": "두 번째 할일",
      "completed": true,
      "createdAt": "2024-09-16T10:01:00.000Z",
      "completedAt": "2024-09-16T10:02:00.000Z"
    }
  ],
  "message": "총 2개의 할일을 조회했습니다."
}
```

---

## 3. GET /api/todos/:id - 특정 할일 조회

**요청:**
```bash
curl http://localhost:3000/api/todos/1694223456789
```

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1694223456789,
    "content": "특정 할일",
    "completed": false,
    "createdAt": "2024-09-16T10:00:00.000Z",
    "completedAt": null
  },
  "message": "할일을 정상적으로 조회했습니다."
}
```

**에러 응답 (404 Not Found):**
```json
{
  "success": false,
  "data": null,
  "message": "해당하는 할일을 찾을 수 없습니다."
}
```

---

## 4. PATCH /api/todos/:id - 할일 수정

**요청 1: 완료 상태 토글**
```bash
curl -X PATCH http://localhost:3000/api/todos/1694223456789 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

**요청 2: 할일 내용 수정**
```bash
curl -X PATCH http://localhost:3000/api/todos/1694223456789 \
  -H "Content-Type: application/json" \
  -d '{"content": "수정된 내용"}'
```

**요청 3: 완료 상태와 내용 동시 수정**
```bash
curl -X PATCH http://localhost:3000/api/todos/1694223456789 \
  -H "Content-Type: application/json" \
  -d '{"content": "수정된 내용", "completed": true}'
```

**요청 본문 (선택 사항):**
```json
{
  "completed": boolean,  // 선택: 완료 상태 변경
  "content": string      // 선택: 할일 내용 수정
}
```

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1694223456789,
    "content": "수정된 내용",
    "completed": true,
    "createdAt": "2024-09-16T10:00:00.000Z",
    "completedAt": "2024-09-16T10:05:00.000Z"
  },
  "message": "할일이 정상적으로 수정되었습니다."
}
```

**에러 응답:**
- 404 Not Found: 할일을 찾을 수 없음
- 400 Bad Request: 유효하지 않은 내용

---

## 5. DELETE /api/todos/:id - 할일 삭제

**요청:**
```bash
curl -X DELETE http://localhost:3000/api/todos/1694223456789
```

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1694223456789,
    "content": "삭제된 할일",
    "completed": false,
    "createdAt": "2024-09-16T10:00:00.000Z",
    "completedAt": null
  },
  "message": "할일이 정상적으로 삭제되었습니다."
}
```

**에러 응답 (404 Not Found):**
```json
{
  "success": false,
  "data": null,
  "message": "해당하는 할일을 찾을 수 없습니다."
}
```

---

## 테스트 실행

### 자동 테스트
```bash
npm test
```

이 명령어는 API 서버를 시작하고 자동으로 모든 엔드포인트를 테스트합니다.

### 테스트 내용
- ✓ 할일 추가 (정상, 빈 내용, 초과 길이)
- ✓ 할일 조회 (전체, 특정)
- ✓ 할일 수정 (완료 상태, 내용)
- ✓ 할일 삭제
- ✓ 에러 처리 (404, 400, 500)

---

## 파일 구조

```
day01/
├── api-server.js          # Express.js 서버 진입점
├── todo.js                # CRUD 라우터
├── test.js                # 자동 테스트 파일
├── todo.html              # 클라이언트 HTML
├── server.js              # 정적 파일 서빙 서버
├── package.json           # 프로젝트 설정
└── API_GUIDE.md          # 이 파일
```

---

## 기술 스택

- **Node.js** 18+
- **Express.js** 4.18+
- **JavaScript (ES6+)**

## 데이터 저장소

현재 구현은 **In-Memory 저장소**를 사용합니다.
- 메모리에 데이터 저장
- 서버 재시작 시 초기화됨
- 실제 환경에서는 데이터베이스(PostgreSQL, MongoDB 등) 연동 권장

## 설명 주석

모든 코드에는 상세한 설명 주석이 포함되어 있습니다:
- 함수별 역할 및 매개변수 설명
- 비즈니스 로직 설명
- HTTP 상태 코드와 응답 형식 설명

---

## 예제: 완전한 TODO 워크플로우

```bash
# 1. 새로운 할일 추가
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"content": "장보기"}' | jq .

# 응답에서 ID 확인: 1694223456789

# 2. 모든 할일 조회
curl http://localhost:3000/api/todos | jq .

# 3. 특정 할일 조회
curl http://localhost:3000/api/todos/1694223456789 | jq .

# 4. 할일 내용 수정
curl -X PATCH http://localhost:3000/api/todos/1694223456789 \
  -H "Content-Type: application/json" \
  -d '{"content": "마트에서 장보기"}' | jq .

# 5. 완료 상태 변경
curl -X PATCH http://localhost:3000/api/todos/1694223456789 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}' | jq .

# 6. 할일 삭제
curl -X DELETE http://localhost:3000/api/todos/1694223456789 | jq .
```

---

## 라이선스 및 기여

이 프로젝트는 학습 목적으로 작성되었습니다.
