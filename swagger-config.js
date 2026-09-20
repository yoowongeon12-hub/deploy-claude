/**
 * ============================================================
 * Swagger/OpenAPI 3.0 설정 파일
 * API 문서 자동 생성을 위한 설정
 * ============================================================
 */

const swaggerJsdoc = require('swagger-jsdoc');

// Swagger 옵션 설정
const options = {
    // API 정의 버전
    definition: {
        // OpenAPI 스펙 버전 3.0 사용
        openapi: '3.0.0',
        // API 기본 정보
        info: {
            // API 제목
            title: 'TODO & 게시판 API',
            // API 설명
            description: 'TODO 관리 및 게시판 기능을 제공하는 REST API 서버',
            // API 버전
            version: '2.0.0',
            // 연락처 정보
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            }
        },
        // 서버 정보
        servers: [
            {
                // 로컬 개발 서버 URL
                url: 'http://localhost:3000',
                // 서버 설명
                description: '로컬 개발 서버'
            }
        ],
        // 태그 정의 (API 엔드포인트 분류)
        tags: [
            {
                // 태그 이름
                name: 'Posts',
                // 태그 설명
                description: '게시글 관리 API'
            },
            {
                name: 'Comments',
                description: '댓글 관리 API'
            },
            {
                name: 'Todos',
                description: 'TODO 관리 API'
            }
        ]
    },
    // Swagger JSDoc 주석을 찾을 파일 경로
    // JSDoc 주석이 포함된 모든 라우터 파일을 지정
    apis: [
        './routes/board-router.js',
        './routes/todo.js'
    ]
};

// Swagger 스펙 생성
const swaggerSpec = swaggerJsdoc(options);

/**
 * Swagger 스펙 조회 함수
 * @returns {Object} OpenAPI 3.0 스펙 객체
 */
function getSwaggerSpec() {
    return swaggerSpec;
}

/**
 * 모듈 내보내기
 */
module.exports = { getSwaggerSpec };
