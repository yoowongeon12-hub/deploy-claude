/**
 * ============================================================
 * Express.js API 서버 진입점
 * TODO CRUD API 서버 시작 파일
 * ============================================================
 */

const express = require('express');
// Swagger UI 라이브러리 임포트
const swaggerUi = require('swagger-ui-express');
// Swagger 설정 임포트
const { getSwaggerSpec } = require('./swagger-config');
// 할일 라우터 모듈 임포트
const todoRouter = require('./routes/todo');
// 게시글/댓글 라우터 모듈 임포트
const boardRouter = require('./routes/board-router');

// Express 앱 생성
const app = express();

// 포트 설정 (기본값: 3000, 환경 변수로 오버라이드 가능)
const PORT = process.env.PORT || 3000;

/**
 * ============================================================
 * 미들웨어 설정
 * ============================================================
 */

// JSON 요청 본문 파싱 미들웨어
// 요청의 Content-Type이 application/json인 경우 자동으로 파싱
app.use(express.json());

// URL 인코딩된 요청 본문 파싱 미들웨어
// 요청의 Content-Type이 application/x-www-form-urlencoded인 경우 파싱
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 미들웨어
// 현재 디렉토리의 모든 정적 파일(HTML, CSS, JS 등)을 제공
// 단, index.html은 명시적으로 처리하지 않도록 설정
app.use(express.static(__dirname, { index: false }));

// 요청 로깅 미들웨어 (개발 단계에서 디버깅용)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

/**
 * ============================================================
 * CORS 설정 (필요시)
 * ============================================================
 */

// 모든 CORS 요청 허용
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

/**
 * ============================================================
 * Swagger UI 설정
 * ============================================================
 */

// Swagger UI 엔드포인트 설정 (/api-docs 경로에서 API 문서 제공)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(getSwaggerSpec(), {
    // Swagger UI 레이아웃 설정 (기본 레이아웃 사용)
    swaggerOptions: {
        url: '/api-docs/swagger.json'
    }
}));

// Swagger JSON 스펙 제공 엔드포인트
app.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(getSwaggerSpec());
});

/**
 * ============================================================
 * 라우트 등록
 * ============================================================
 */

// 루트 경로: SPA 진입점 (index.html 제공)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// API 정보 엔드포인트
app.get('/api', (req, res) => {
    res.json({
        message: 'TODO & 게시판 API 서버',
        version: '2.0.0',
        endpoints: {
            'TODO API': {
                'POST /api/todos': '새로운 할일 추가',
                'GET /api/todos': '모든 할일 조회',
                'GET /api/todos/:id': '특정 할일 조회',
                'PATCH /api/todos/:id': '할일 수정 (완료 상태, 내용)',
                'DELETE /api/todos/:id': '할일 삭제'
            },
            '게시판 API': {
                'GET /api/posts': '게시글 목록 조회 (페이지네이션)',
                'POST /api/posts': '새 게시글 작성',
                'GET /api/posts/:id': '게시글 상세보기 (조회수 +1)',
                'PUT /api/posts/:id': '게시글 수정',
                'DELETE /api/posts/:id': '게시글 삭제',
                'GET /api/posts/:postId/comments': '댓글 목록 조회',
                'POST /api/posts/:postId/comments': '댓글 작성',
                'PUT /api/posts/:postId/comments/:commentId': '댓글 수정',
                'DELETE /api/posts/:postId/comments/:commentId': '댓글 삭제'
            }
        }
    });
});

// TODO API 라우트: /api/todos 경로로 모든 요청을 todoRouter에 전달
app.use('/api/todos', todoRouter);

// 게시판 API 라우트: /api/posts 경로로 모든 요청을 boardRouter에 전달
app.use('/api/posts', boardRouter);

// SPA 라우팅: 정의되지 않은 모든 경로는 index.html로 제공
// 이를 통해 클라이언트에서 라우팅을 처리할 수 있게 함
app.use((req, res) => {
    // index.html 파일 제공
    res.sendFile(__dirname + '/index.html');
});

// 에러 핸들링 미들웨어
// 요청 처리 중 발생한 에러를 일관된 형식으로 응답
app.use((err, req, res, next) => {
    console.error('에러 발생:', err);

    res.status(err.status || 500).json({
        success: false,
        data: null,
        message: err.message || '서버 오류가 발생했습니다.'
    });
});

/**
 * ============================================================
 * 서버 시작은 server.js에서 처리
 * ============================================================
 */
// api-server.js는 app 객체만 내보냄

/**
 * ============================================================
 * 모듈 내보내기 (테스트 시 필요)
 * ============================================================
 */

module.exports = app;
