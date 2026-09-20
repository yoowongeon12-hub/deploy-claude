# TODO 애플리케이션 - 8000포트 통합 가이드

## 📋 구조 개요

이 프로젝트는 Express.js 백엔드와 클라이언트 프론트엔드를 통합한 TODO 관리 애플리케이션입니다.

### 파일 구성

```
├── server.js              # Express 메인 서버 (포트 8000)
├── todo.html              # 클라이언트 UI (API 통신)
├── todo.js                # CRUD API 라우터
├── package.json           # 프로젝트 설정
└── style/
    └── todo.css           # 스타일시트
```

## 🚀 실행 방법

### 1. 서버 시작
```bash
npm start
```
또는
```bash
node server.js
```

### 2. 브라우저 접속
```
http://localhost:8000
```

## 📡 API 통신 흐름

### 요청 경로
클라이언트의 모든 API 요청은 다음 기본 경로를 사용합니다:
```
http://localhost:8000/api/todos
```

### API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/todos` | 새로운 할일 추가 |
| GET | `/api/todos` | 모든 할일 조회 |
| GET | `/api/todos/:id` | 특정 할일 조회 |
| PATCH | `/api/todos/:id` | 할일 수정 (내용/상태) |
| DELETE | `/api/todos/:id` | 할일 삭제 |

## 🔄 클라이언트 변경사항

### 이전 (localStorage)
```javascript
// 로컬 저장소 사용
const stored = localStorage.getItem('todos');
this.todos = stored ? JSON.parse(stored) : [];
```

### 현재 (API 통신)
```javascript
// 서버 API 호출
const response = await fetch('http://localhost:8000/api/todos');
const result = await response.json();
this.todos = result.data || [];
```

### 주요 변경된 메서드

1. **addTodo()** - POST 요청으로 할일 추가
2. **deleteTodo()** - DELETE 요청으로 할일 삭제
3. **toggleTodo()** - PATCH 요청으로 완료 상태 변경
4. **confirmEditTodo()** - PATCH 요청으로 내용 수정
5. **loadFromStorage()** - GET 요청으로 데이터 로드

## 💾 데이터 관리

- **할일 데이터**: 메모리 저장소 (서버의 `todos` 배열)
- **필터 상태**: 로컬 localStorage 저장
- **서버 재시작 시**: 모든 할일 초기화됨

> 📌 데이터 영속성이 필요한 경우 데이터베이스 연동 필요

## ✨ 기능

- ✅ 할일 추가/수정/삭제
- ✅ 완료 상태 토글
- ✅ 필터 기능 (전체/미완료/완료)
- ✅ 문자 수 제한 (최대 200자)
- ✅ 실시간 UI 업데이트
- ✅ 서버 에러 처리

## 🛠 기술 스택

- **백엔드**: Express.js
- **프론트엔드**: Vanilla JavaScript (ES6+)
- **통신**: Fetch API
- **스타일**: CSS3 Flexbox

## 📝 예제 요청

### 할일 추가
```bash
curl -X POST http://localhost:8000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"content":"공부하기"}'
```

### 모든 할일 조회
```bash
curl http://localhost:8000/api/todos
```

### 할일 완료 상태 변경
```bash
curl -X PATCH http://localhost:8000/api/todos/1695034567890 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'
```

### 할일 삭제
```bash
curl -X DELETE http://localhost:8000/api/todos/1695034567890
```

## 🔍 주의사항

1. **CORS 정책**: 현재 같은 출처에서만 요청 (필요시 cors 미들웨어 추가)
2. **데이터 영속성**: 서버 재시작 시 메모리 데이터 초기화
3. **동시성**: 다중 사용자 환경에서는 데이터베이스 필요
4. **Error Handling**: 모든 API 요청에 에러 처리 포함
