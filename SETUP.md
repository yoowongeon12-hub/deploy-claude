# TODO 애플리케이션 - 실행 가이드

## 🚀 실행 방법 (3가지)

### 방법 1: 전체 통합 서버 (권장)
```bash
npm start
# 또는
node server.js
```
- **포트**: 8000
- **접속**: http://localhost:8000
- **포함 내용**: HTML UI + API 서버

---

### 방법 2: API 서버만 실행
```bash
npm run start:api
# 또는
node todo.js
```
- **포트**: 8000 (또는 환경변수 PORT로 지정)
- **응답**: JSON API
- **용도**: API만 테스트하거나 다른 클라이언트에서 사용

---

### 방법 3: 수동 포트 지정
```bash
PORT=3000 node todo.js
```
- **포트**: 3000 (또는 지정한 포트)
- **장점**: 여러 인스턴스 동시 실행 가능

---

## ✅ 작동 확인

### 1. 서버 실행
```bash
npm start
```

### 2. 브라우저에서 확인
```
http://localhost:8000
```

### 3. 할일 추가 테스트
- 입력창에 "테스트" 입력
- "추가" 버튼 클릭
- 목록에 나타나는지 확인

### 4. API 직접 테스트 (curl)
```bash
# 할일 추가
curl -X POST http://localhost:8000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"content":"테스트 할일"}'

# 모든 할일 조회
curl http://localhost:8000/api/todos

# 특정 할일 조회
curl http://localhost:8000/api/todos/1789558152231

# 완료 상태 변경
curl -X PATCH http://localhost:8000/api/todos/1789558152231 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# 할일 삭제
curl -X DELETE http://localhost:8000/api/todos/1789558152231
```

---

## 📁 파일 구조

```
todo/
├── server.js              ← 통합 서버 (방법 1)
├── todo.js                ← API 라우터 + 독립 실행 가능 (방법 2)
├── todo.html              ← 클라이언트 UI
├── style/
│   └── todo.css           ← 스타일시트
├── package.json           ← 프로젝트 설정
├── README.md              ← 프로젝트 설명
└── SETUP.md               ← 이 파일
```

---

## 🔄 아키텍처

```
클라이언트 (todo.html)
        ↓
  Fetch API (http://localhost:8000/api/todos)
        ↓
Express 서버 (server.js 또는 todo.js)
        ↓
API 라우터 (todo.js)
        ↓
메모리 저장소 (todos 배열)
```

---

## 💡 주요 특징

✅ **localStorage 제거** - 모든 데이터가 서버에서 관리됨
✅ **독립 실행 가능** - `node todo.js`로 바로 실행 가능
✅ **환경변수 지원** - `PORT` 환경변수로 포트 변경 가능
✅ **에러 처리** - 모든 API 요청에 예외 처리 포함
✅ **REST API** - 표준 HTTP 메서드 사용 (GET, POST, PATCH, DELETE)

---

## 🐛 문제 해결

### 포트 8000이 이미 사용 중인 경우
```bash
PORT=3000 npm start
# 또는
PORT=3000 node todo.js
```

### 서버가 시작되지 않는 경우
```bash
# Node.js 설치 확인
node --version

# Express 모듈 설치 확인
npm install

# 서버 로그 확인
npm start
```

### API 요청 실패 시
```bash
# 서버가 실행 중인지 확인
curl http://localhost:8000

# 방화벽 설정 확인
# localhost:8000 접속 가능한지 확인
```

---

## 📊 API 응답 형식

### 성공 응답 (201/200)
```json
{
  "success": true,
  "data": {
    "id": 1789558152231,
    "content": "할일 내용",
    "completed": false,
    "createdAt": "2026-09-16T11:29:12.231Z",
    "completedAt": null
  },
  "message": "성공 메시지"
}
```

### 에러 응답 (400/404/500)
```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지"
}
```

---

## 🎯 다음 단계

1. **데이터베이스 연동** - 메모리 저장소를 DB로 변경
2. **사용자 인증** - JWT 토큰 기반 로그인
3. **다중 사용자** - 사용자별 할일 관리
4. **배포** - Heroku, AWS 등에 배포

