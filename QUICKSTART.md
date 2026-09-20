# 빠른 시작 가이드

## 3단계로 시작하기

### 1단계: 의존성 설치
```bash
npm install
```

### 2단계: 서버 시작
```bash
npm start
```

**출력:**
```
============================================================
TODO API 서버가 포트 3000에서 실행 중입니다.
http://localhost:3000

사용 가능한 엔드포인트:
- POST   /api/todos        : 새로운 할일 추가
- GET    /api/todos        : 모든 할일 조회
- GET    /api/todos/:id    : 특정 할일 조회
- PATCH  /api/todos/:id    : 할일 수정
- DELETE /api/todos/:id    : 할일 삭제
```

### 3단계: API 테스트

새 터미널 창을 열고 다음 명령어를 실행하세요:

#### 할일 추가
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"content": "첫 번째 할일"}'
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1694223456789,
    "content": "첫 번째 할일",
    "completed": false,
    "createdAt": "2024-09-16T10:00:00.000Z",
    "completedAt": null
  },
  "message": "할일이 정상적으로 추가되었습니다."
}
```

#### 모든 할일 조회
```bash
curl http://localhost:3000/api/todos
```

#### 완료 상태 변경 (ID 확인 후)
```bash
curl -X PATCH http://localhost:3000/api/todos/1694223456789 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

#### 할일 삭제 (ID 확인 후)
```bash
curl -X DELETE http://localhost:3000/api/todos/1694223456789
```

---

## 자동 테스트 실행

모든 엔드포인트를 자동으로 테스트합니다:

```bash
npm test
```

**결과:**
```
============================================================
TODO API 테스트 시작
============================================================

[1] POST /api/todos - 새로운 할일 추가
------------------------------------------------------------
✓ PASS - 정상적인 할일 추가 (201 Created)
✓ PASS - 빈 내용으로 추가 시도 (400 Bad Request)
✓ PASS - 공백만 입력하여 추가 시도 (400 Bad Request)
✓ PASS - 200자 초과 내용으로 추가 시도 (400 Bad Request)
✓ PASS - 두 번째 할일 추가 (201 Created)

[2] GET /api/todos - 모든 할일 조회
------------------------------------------------------------
✓ PASS - 모든 할일 조회 (200 OK) : 총 2개

... (더 많은 테스트)

============================================================
테스트 결과 요약
============================================================
전체: 16/16 테스트 통과
성공률: 100.0%
============================================================
```

---

## 파일 설명

| 파일 | 크기 | 설명 |
|------|------|------|
| **todo.js** | 11KB | CRUD 라우터 (검증, 에러 처리 포함) |
| **api-server.js** | 4.1KB | Express 서버 진입점 |
| **test.js** | 15KB | 자동 테스트 (16개 테스트 케이스) |
| **package.json** | 337B | 프로젝트 설정 및 의존성 |
| **API_GUIDE.md** | 6.5KB | 상세한 API 사용 설명서 |
| **IMPLEMENTATION_SUMMARY.md** | 8.4KB | 구현 세부 사항 |

---

## 자주 묻는 질문 (FAQ)

### Q1: 포트를 변경하려면?
```bash
PORT=5000 npm start
```

### Q2: 데이터는 어디에 저장되나요?
현재는 메모리(RAM)에 저장됩니다. 서버를 재시작하면 데이터가 초기화됩니다.

### Q3: 더 자세한 API 설명을 보려면?
`API_GUIDE.md` 파일을 참고하세요.

### Q4: 모든 엔드포인트를 확인하려면?
터미널에서 다음을 실행하세요:
```bash
curl http://localhost:3000
```

### Q5: 왜 테스트가 실패하나요?
- 포트 3000이 이미 사용 중일 수 있습니다.
- 다른 포트를 사용하도록 설정하세요: `PORT=3001 npm start`

---

## 코드 구조 이해하기

### todo.js (라우터)
```javascript
// 할일 추가
router.post('/', (req, res) => { ... })

// 모든 할일 조회
router.get('/', (req, res) => { ... })

// 특정 할일 조회
router.get('/:id', (req, res) => { ... })

// 할일 수정
router.patch('/:id', (req, res) => { ... })

// 할일 삭제
router.delete('/:id', (req, res) => { ... })
```

### api-server.js (서버 설정)
```javascript
// Express 앱 생성
const app = express();

// 미들웨어 설정
app.use(express.json());

// 라우터 연결
app.use('/api/todos', todoRouter);

// 서버 시작
app.listen(3000, () => { ... })
```

### test.js (테스트)
```javascript
// HTTP 요청 함수
function makeRequest(method, path, body) { ... }

// 테스트 실행
async function runTests() { ... }
```

---

## 다음 단계

### 기본 사용
1. ✓ 서버 시작 (`npm start`)
2. ✓ curl이나 Postman으로 API 테스트
3. ✓ 자동 테스트 실행 (`npm test`)

### 고급 활용
1. 데이터베이스 연동 (PostgreSQL, MongoDB 등)
2. 인증 추가 (JWT, OAuth)
3. 필터링/검색 기능 추가
4. 페이지네이션 구현

### 프로덕션 배포
1. 환경 변수 설정 (.env 파일)
2. 에러 로깅 추가 (winston, morgan)
3. API 문서 자동화 (Swagger/OpenAPI)
4. 배포 (Heroku, AWS, Docker 등)

---

## 예제 워크플로우

### 시나리오: 일일 작업 관리

```bash
# 1. 서버 시작
npm start

# 2. (다른 터미널) 아침에 할일 추가
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"content": "이메일 확인"}'

curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"content": "회의 준비"}'

curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"content": "보고서 작성"}'

# 3. 모든 할일 확인
curl http://localhost:3000/api/todos

# 4. 이메일 확인 완료 (ID는 위에서 확인)
curl -X PATCH http://localhost:3000/api/todos/1694223456789 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# 5. 최종 상태 확인
curl http://localhost:3000/api/todos

# 6. 테스트 종료 후 모두 삭제
curl -X DELETE http://localhost:3000/api/todos/1694223456789
curl -X DELETE http://localhost:3000/api/todos/1694223456790
curl -X DELETE http://localhost:3000/api/todos/1694223456791
```

---

## 문제 해결

### 문제: "Cannot find module 'express'"
**해결책:** `npm install`을 실행하세요

### 문제: "Port 3000 is already in use"
**해결책:** 다른 포트 사용: `PORT=3001 npm start`

### 문제: 테스트가 실패함
**해결책:** 서버가 정상 실행 중인지 확인하세요
```bash
curl http://localhost:3000
```

### 문제: curl 명령어가 작동하지 않음 (Windows)
**해결책:** PowerShell에서 다음과 같이 입력하세요:
```powershell
Invoke-WebRequest -Method POST http://localhost:3000/api/todos `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"content": "test"}'
```

또는 Postman 사용: https://www.postman.com/

---

## 추가 리소스

- **Express.js 공식 문서**: https://expressjs.com/
- **Node.js 공식 문서**: https://nodejs.org/
- **RESTful API 설계 가이드**: https://restfulapi.net/
- **HTTP 상태 코드**: https://httpwg.org/specs/rfc7231.html

---

## 다음 학습 주제

1. **데이터베이스**: Prisma, MongoDB, PostgreSQL
2. **인증**: JWT, OAuth 2.0, Passport.js
3. **테스트**: Jest, Supertest, Mocha
4. **배포**: Docker, Heroku, AWS Lambda
5. **모니터링**: Winston, Morgan, Sentry

---

**즐거운 개발되세요! 🚀**
