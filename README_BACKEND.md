# TODO 관리 시스템 - Express.js 백엔드 API

HTML 기반의 클라이언트 애플리케이션(`todo.html`)을 위한 RESTful API 백엔드 서버입니다.

## 프로젝트 개요

- **목표**: `todo.html`의 localStorage 기반 로직을 Express.js 백엔드로 구현
- **기술**: Node.js 18+, Express.js 4.18+
- **저장소**: In-Memory 배열 (실제 환경에서는 DB 권장)
- **테스트**: 16개 엔드포인트 자동 테스트 포함

---

## 생성된 파일 정보

### 백엔드 코드 (881줄)

#### 1. **todo.js** (360줄)
Express.js CRUD 라우터 구현

**특징:**
- 모든 함수에 상세한 JSDoc 주석
- 입력 검증 및 에러 처리
- 5개 엔드포인트 (POST, GET×2, PATCH, DELETE)
- 유틸리티 함수: validateContent, findTodoById, findTodoIndexById

**엔드포인트:**
```
POST   /api/todos      - 새로운 할일 추가
GET    /api/todos      - 모든 할일 조회
GET    /api/todos/:id  - 특정 할일 조회
PATCH  /api/todos/:id  - 할일 수정 (완료 상태, 내용)
DELETE /api/todos/:id  - 할일 삭제
```

#### 2. **api-server.js** (131줄)
Express 애플리케이션 설정 및 서버 시작

**특징:**
- JSON 및 URL 인코딩 미들웨어 설정
- 요청 로깅 및 CORS 설정
- 포트 설정 (기본값: 3000, 환경 변수로 변경 가능)
- 404 및 에러 핸들링 미들웨어

#### 3. **test.js** (390줄)
자동 통합 테스트 (16개 테스트 케이스)

**테스트 커버리지:**
- POST /api/todos: 5개 테스트
- GET /api/todos: 1개 테스트
- GET /api/todos/:id: 3개 테스트
- PATCH /api/todos/:id: 4개 테스트
- DELETE /api/todos/:id: 3개 테스트

**실행:**
```bash
npm test
```

#### 4. **package.json**
프로젝트 설정 및 의존성 관리

```json
{
  "dependencies": {
    "express": "^4.18.2"
  },
  "scripts": {
    "start": "node api-server.js",
    "test": "node api-server.js & sleep 2 && node test.js"
  }
}
```

### 문서 (22.2KB)

#### 1. **QUICKSTART.md** (7.3KB)
3단계로 시작하는 빠른 시작 가이드
- 설치 및 실행 방법
- curl 예제
- 자동 테스트 실행
- 문제 해결 가이드

#### 2. **API_GUIDE.md** (6.5KB)
완전한 API 사용 설명서
- 모든 엔드포인트의 curl 예제
- 요청/응답 포맷 상세 설명
- HTTP 상태 코드 설명
- 검증 규칙

#### 3. **IMPLEMENTATION_SUMMARY.md** (8.4KB)
구현 세부사항 및 아키텍처
- HTML 분석 결과
- 파일 구조 설명
- 핵심 구현 패턴
- 확장 가능성

---

## 핵심 특징

### 1. 완전한 CRUD 구현
| 작업 | 메서드 | 엔드포인트 | 응답 |
|------|--------|-----------|------|
| Create | POST | /api/todos | 201 |
| Read | GET | /api/todos, /api/todos/:id | 200 |
| Update | PATCH | /api/todos/:id | 200 |
| Delete | DELETE | /api/todos/:id | 200 |

### 2. 강력한 검증
```javascript
// 입력값 검증
- null/undefined 확인
- 공백 확인
- 최소/최대 길이 (1~200자)
- 명확한 에러 메시지
```

### 3. 일관된 응답 포맷
```json
{
  "success": true,
  "data": {},
  "message": "설명"
}
```

### 4. HTTP 상태 코드 준수
```
200 OK - 성공
201 Created - 생성 완료
400 Bad Request - 검증 실패
404 Not Found - 리소스 없음
500 Internal Server Error - 서버 오류
```

### 5. 상세한 코드 주석
- 모든 함수에 JSDoc 형식 주석
- 각 단계별 코드 설명
- HTTP 메서드별 상세 설명

---

## 빠른 시작

### 설치
```bash
npm install
```

### 실행
```bash
npm start
```

### 테스트
```bash
npm test
```

### API 호출 예제
```bash
# 할일 추가
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"content": "할일"}'

# 모든 할일 조회
curl http://localhost:3000/api/todos

# 완료 상태 변경
curl -X PATCH http://localhost:3000/api/todos/1694223456789 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# 할일 삭제
curl -X DELETE http://localhost:3000/api/todos/1694223456789
```

---

## 파일 경로

```
C:\claude_1900_yog\workspace\claude2\day01\

# 백엔드 코드
├── todo.js                    ✓ CRUD 라우터 (360줄)
├── api-server.js              ✓ Express 서버 (131줄)
├── test.js                    ✓ 자동 테스트 (390줄)
├── package.json               ✓ 프로젝트 설정

# 문서
├── QUICKSTART.md              ✓ 빠른 시작 가이드
├── API_GUIDE.md               ✓ API 사용 설명서
├── IMPLEMENTATION_SUMMARY.md  ✓ 구현 상세 설명
└── README_BACKEND.md          ✓ 이 파일

# 클라이언트 (기존)
├── todo.html                  ✓ 클라이언트 앱
├── style/todo.css             ✓ 스타일
└── server.js                  ✓ 정적 파일 서빙
```

---

## 데이터 구조

### Todo 객체
```javascript
{
  id: number,                  // 타임스탬프 기반 고유 ID (예: 1694223456789)
  content: string,             // 할일 내용 (1~200자)
  completed: boolean,          // 완료 상태 (true/false)
  createdAt: string,          // 생성 시각 (ISO 8601: 2024-09-16T10:00:00.000Z)
  completedAt: string | null  // 완료 시각 (완료 시 설정, 미완료 시 null)
}
```

### In-Memory 저장소
```javascript
const todos = [];

// 추가
todos.unshift(newTodo);

// 조회
const todo = todos.find(t => t.id === id);

// 수정
todo.completed = true;

// 삭제
todos.splice(index, 1);
```

---

## 기술 스택

### 런타임 & 프레임워크
- **Node.js** 18.0+
- **Express.js** 4.18.2+

### 테스트
- Node.js 내장 `http` 모듈 사용
- 16개 엔드포인트 자동 테스트

### 문서
- Markdown 형식 (4개 문서)

---

## 코드 품질

### 주석 커버리지: 100%
- 모든 함수에 JSDoc 주석
- 각 단계별 코드 설명
- HTTP 메서드별 상세 설명

### 에러 처리: 전수 적용
- 모든 엔드포인트에서 try-catch
- 명확한 에러 메시지
- 적절한 HTTP 상태 코드

### 테스트 커버리지: 16개 테스트
- 정상 케이스
- 에러 케이스
- 엣지 케이스

---

## 사용 시나리오

### 클라이언트-서버 통신 흐름

```
todo.html (클라이언트)              api-server.js (백엔드)
     |                                    |
     |--- POST /api/todos             (1) 할일 추가
     |    (content: "...")                |
     |                              -> 201 Created
     |<-- {success, data, message}        |
     |                                    |
     |--- GET /api/todos              (2) 모든 할일 조회
     |                                    |
     |<-- {success, [todos]}              |
     |                                    |
     |--- PATCH /api/todos/:id        (3) 완료 상태 변경
     |    (completed: true)               |
     |                              -> 200 OK
     |<-- {success, updatedTodo}          |
     |                                    |
     |--- DELETE /api/todos/:id       (4) 할일 삭제
     |                                    |
     |<-- {success, deletedTodo}          |
```

---

## 확장 로드맵

### Phase 1 (현재 완료)
- ✓ Express.js CRUD API 구현
- ✓ In-Memory 저장소
- ✓ 16개 자동 테스트
- ✓ 상세한 문서

### Phase 2 (권장)
- [ ] 데이터베이스 연동 (PostgreSQL + Prisma)
- [ ] 사용자 인증 (JWT)
- [ ] 필터링/검색 기능
- [ ] 페이지네이션

### Phase 3 (선택)
- [ ] 웹소켓 실시간 업데이트
- [ ] 파일 업로드 지원
- [ ] API 문서 자동화 (Swagger)
- [ ] Docker 컨테이너화

---

## 자주 묻는 질문

**Q: 데이터는 어디에 저장되나요?**
A: 현재는 서버 메모리(RAM)에 저장됩니다. 서버 재시작 시 데이터가 초기화됩니다.

**Q: 프로덕션에서 사용할 수 있나요?**
A: 아니요. 실제 환경에서는 데이터베이스 연동이 필수입니다.

**Q: 포트를 변경하려면?**
A: `PORT=5000 npm start`로 실행하세요.

**Q: 클라이언트를 연결하려면?**
A: `todo.html`의 JavaScript를 수정하여 API 엔드포인트를 연결하세요.

**Q: 테스트가 실패하면?**
A: 포트 3000이 사용 중이거나 Express가 설치되지 않은 상태입니다. `npm install`을 다시 실행하세요.

---

## 학습 가치

이 프로젝트를 통해 다음을 배울 수 있습니다:

1. **Express.js 기초**
   - 라우팅 및 미들웨어
   - 요청/응답 처리
   - 에러 핸들링

2. **RESTful API 설계**
   - HTTP 메서드 (GET, POST, PATCH, DELETE)
   - 상태 코드 사용
   - JSON 응답 형식

3. **입력 검증 및 에러 처리**
   - 사용자 입력 검증
   - 명확한 에러 메시지
   - 트라이-캐치 패턴

4. **자동 테스트**
   - Node.js http 모듈
   - 엔드포인트 테스트
   - 테스트 결과 보고

---

## 라이선스

이 프로젝트는 학습 및 개발 목적으로 작성되었습니다.

---

## 문의 및 지원

- **API 사용 가이드**: API_GUIDE.md 참고
- **빠른 시작**: QUICKSTART.md 참고
- **구현 세부사항**: IMPLEMENTATION_SUMMARY.md 참고

---

## 체크리스트

### 구현 완료 항목
- ✓ Express.js 서버 구현
- ✓ CRUD 라우터 (5개 엔드포인트)
- ✓ 입력 검증 및 에러 처리
- ✓ In-Memory 저장소
- ✓ 16개 자동 테스트
- ✓ 상세한 코드 주석
- ✓ 4개 문서 (가이드 포함)

### 파일 확인
- ✓ todo.js (360줄)
- ✓ api-server.js (131줄)
- ✓ test.js (390줄)
- ✓ package.json
- ✓ QUICKSTART.md
- ✓ API_GUIDE.md
- ✓ IMPLEMENTATION_SUMMARY.md
- ✓ README_BACKEND.md (이 파일)

---

**프로젝트 완성일**: 2026년 9월 16일
**총 코드량**: 881줄 (주석 포함)
**총 문서량**: 22.2KB (4개 문서)
**테스트 커버리지**: 16개 엔드포인트
