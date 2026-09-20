# 세부 변경 사항

## 1. 댓글 중복 작성 버그 수정

### 파일: `js/board-detail.js`

#### 문제
- 페이지 로드 시 이벤트 리스너가 계속 추가되어 버튼 클릭 시 여러 번 실행됨
- 댓글 작성 버튼을 한 번 클릭하면 댓글이 2번 이상 생성됨
- 데이터베이스에도 중복으로 저장됨

#### 원인
`initBoardDetail()` 함수에서 매번 `.addEventListener()`만 사용하여 이전 리스너가 제거되지 않음

#### 수정 코드
```javascript
// 이전 방식 (문제 있음)
btnCommentSubmit.addEventListener('click', submitComment);

// 수정된 방식
btnCommentSubmit.replaceWith(btnCommentSubmit.cloneNode(true));
const newBtnCommentSubmit = document.getElementById('btn-comment-submit');
newBtnCommentSubmit.addEventListener('click', submitComment);
```

#### 적용 대상
- 댓글 제출 버튼 (btn-comment-submit)
- 게시글 수정 버튼 (btn-edit)
- 게시글 삭제 버튼 (btn-delete)

---

## 2. 알람 위치 변경 및 토스트 메시지 도입

### 파일들
- `js/board-detail.js`: 토스트 함수 추가 및 alert() → showToast() 변환
- `style/board-detail.css`: 토스트 메시지 스타일 추가

### 문제
- JavaScript의 `alert()` 함수가 중앙 상단에 표시되어 헤더와 겹침
- 사용자 경험 저하

### 해결 방법

#### 토스트 메시지 함수 구현
```javascript
function showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}
```

#### CSS 스타일 추가
```css
/* 토스트 컨테이너: 화면 오른쪽 아래 고정 */
.toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* 토스트 메시지 */
.toast-message {
    background-color: #333;
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-in-out;
}

/* 메시지 타입별 색상 */
.toast-message.success { background-color: #28a745; }  /* 녹색 */
.toast-message.error { background-color: #dc3545; }    /* 빨간색 */
.toast-message.warning { background-color: #ffc107; }  /* 노란색 */
.toast-message.info { background-color: #17a2b8; }     /* 파란색 */

/* 애니메이션 */
@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(400px);
    }
}
```

#### alert() → showToast() 변환 목록
| 함수 | 변환 내용 |
|------|----------|
| loadPost() | alert() → showToast('...', 'error') |
| loadComments() | alert() → showToast('...', 'error') |
| submitComment() | alert() → showToast('...', 'warning' 또는 'success') |
| editComment() | alert() → showToast('...', 'success' 또는 'error') |
| deleteComment() | alert() → showToast('...', 'success' 또는 'error') |
| deletePost() | alert() → showToast('...', 'success' 또는 'error') |

---

## 3. Swagger 3.0 API 문서 자동 생성

### 설치 패키지
```json
{
  "swagger-ui-express": "^5.0.0",
  "swagger-jsdoc": "^6.2.8"
}
```

### 새로 생성된 파일
#### `swagger-config.js`
```javascript
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TODO & 게시판 API',
            description: 'TODO 관리 및 게시판 기능을 제공하는 REST API 서버',
            version: '2.0.0'
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: '로컬 개발 서버'
            }
        ],
        tags: [
            { name: 'Posts', description: '게시글 관리 API' },
            { name: 'Comments', description: '댓글 관리 API' },
            { name: 'Todos', description: 'TODO 관리 API' }
        ]
    },
    apis: [
        './routes/board-router.js',
        './routes/todo.js'
    ]
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = { getSwaggerSpec: () => swaggerSpec };
```

### 수정된 파일
#### `api-server.js`
```javascript
const swaggerUi = require('swagger-ui-express');
const { getSwaggerSpec } = require('./swagger-config');

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(getSwaggerSpec()));

// Swagger JSON 스펙 제공
app.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(getSwaggerSpec());
});
```

### 추가된 Swagger JSDoc 주석

#### `routes/board-router.js`
모든 엔드포인트에 `@swagger` 주석 추가:
- GET /api/posts
- POST /api/posts
- GET /api/posts/{id}
- PUT /api/posts/{id}
- DELETE /api/posts/{id}
- GET /api/posts/{postId}/comments
- POST /api/posts/{postId}/comments
- PUT /api/posts/{postId}/comments/{commentId}
- DELETE /api/posts/{postId}/comments/{commentId}

#### `routes/todo.js`
모든 엔드포인트에 `@swagger` 주석 추가:
- POST /api/todos
- GET /api/todos
- GET /api/todos/{id}
- PUT /api/todos/{id}
- PATCH /api/todos/{id}/toggle
- DELETE /api/todos/{id}
- GET /api/todos/stats/summary

### Swagger UI 접근
```
http://localhost:3000/api-docs
```

### Swagger 스펙 JSON
```
http://localhost:3000/api-docs/swagger.json
```

---

## 변경 파일 목록

| 파일 경로 | 변경 유형 | 설명 |
|----------|---------|------|
| `js/board-detail.js` | 수정 | 이벤트 리스너 중복 제거, alert() → showToast() 변환 |
| `style/board-detail.css` | 수정 | 토스트 메시지 스타일 추가 |
| `package.json` | 수정 | swagger-ui-express, swagger-jsdoc 의존성 추가 |
| `api-server.js` | 수정 | Swagger UI 미들웨어 등록 |
| `routes/board-router.js` | 수정 | Swagger JSDoc 주석 추가 |
| `routes/todo.js` | 수정 | Swagger JSDoc 주석 추가 |
| `swagger-config.js` | 신규 | Swagger 설정 파일 |

---

## 테스트 체크리스트

### 댓글 중복 작성 테스트
- [ ] 댓글 입력 후 "등록" 버튼 클릭
- [ ] 댓글 개수 1개 증가 확인
- [ ] 데이터베이스 확인 (중복 없음)

### 토스트 메시지 테스트
- [ ] 댓글 작성 성공 시 오른쪽 아래 초록색 메시지 표시
- [ ] 댓글 삭제 시 오른쪽 아래 초록색 메시지 표시
- [ ] 에러 발생 시 빨간색 메시지 표시
- [ ] 3초 후 자동으로 사라짐 확인

### Swagger UI 테스트
- [ ] http://localhost:3000/api-docs 접속
- [ ] 모든 엔드포인트 목록 확인
- [ ] 각 엔드포인트 펼쳐서 스키마 확인
- [ ] "Try it out" 버튼으로 API 테스트 실행

---

## 성능 영향

### 긍정적 영향
- ✅ 사용자 경험 개선 (토스트 메시지)
- ✅ API 문서 자동 생성으로 개발 생산성 향상
- ✅ 버그 수정으로 데이터 무결성 보장

### 성능 오버헤드
- ✅ 미미함 (토스트 메시지는 단순 DOM 조작)
- ✅ Swagger UI는 개발 환경에서만 사용

---

## 향후 개선 사항

1. 토스트 메시지를 다른 페이지(board-write.js, board-index.js)에도 적용
2. Swagger UI 보안 설정 (API 키 인증)
3. API 응답 시간 로깅 추가
4. 더 상세한 에러 메시지 추가
