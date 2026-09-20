/**
 * ============================================================
 * TODO CRUD 라우터
 * Express.js를 사용한 할일 관리 RESTful API 라우터
 * ============================================================
 */

const express = require('express');
const router = express.Router();

/**
 * In-memory 저장소 - 실제 환경에서는 데이터베이스 사용
 * 요청 처리 중 메모리에 저장되며, 서버 재시작 시 초기화됨
 */
const todos = [];

/**
 * ============================================================
 * 유틸리티 함수
 * ============================================================
 */

/**
 * 요청 본문 검증 함수
 * 할일 추가/수정 시 입력값이 유효한지 확인
 * @param {string} content - 검증할 할일 내용
 * @returns {object} { valid: boolean, message: string }
 */
function validateContent(content) {
    // null, undefined 체크
    if (content === null || content === undefined) {
        return {
            valid: false,
            message: '할일 내용을 입력해주세요.'
        };
    }

    // 문자열로 변환 후 공백 제거
    const trimmedContent = String(content).trim();

    // 빈 문자열 체크
    if (trimmedContent.length === 0) {
        return {
            valid: false,
            message: '할일 내용을 입력해주세요.'
        };
    }

    // 최대 길이 제한 (200자)
    if (trimmedContent.length > 200) {
        return {
            valid: false,
            message: '최대 200자까지 입력 가능합니다.'
        };
    }

    return {
        valid: true,
        message: '유효한 입력입니다.'
    };
}

/**
 * ID로 할일 찾기
 * 숫자 ID에 해당하는 할일 객체를 배열에서 검색
 * @param {number} id - 찾을 할일의 ID
 * @returns {object|null} 찾은 할일 객체 또는 null
 */
function findTodoById(id) {
    const numId = Number(id);
    return todos.find(todo => todo.id === numId) || null;
}

/**
 * ID로 할일 인덱스 찾기
 * 배열 수정/삭제 시 사용할 할일의 배열 인덱스 반환
 * @param {number} id - 찾을 할일의 ID
 * @returns {number} 할일의 배열 인덱스 또는 -1
 */
function findTodoIndexById(id) {
    const numId = Number(id);
    return todos.findIndex(todo => todo.id === numId);
}

/**
 * ============================================================
 * CRUD 엔드포인트
 * ============================================================
 */

/**
 * POST /api/todos
 * 새로운 할일 추가
 * 요청 본문: { content: string }
 * 응답: 201 Created - 생성된 할일 객체
 *       400 Bad Request - 검증 실패
 */
router.post('/', (req, res) => {
    try {
        // 요청 본문에서 content 추출
        const { content } = req.body;

        // 입력 검증
        const validation = validateContent(content);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                data: null,
                message: validation.message
            });
        }

        // 새로운 할일 객체 생성
        const newTodo = {
            // ID: 현재 타임스탬프 사용 (밀리초 단위)
            id: Date.now(),
            // 내용: 공백 제거
            content: String(content).trim(),
            // 초기 상태: 미완료
            completed: false,
            // 생성 시간: ISO 8601 형식
            createdAt: new Date().toISOString(),
            // 완료 시간: 아직 없음
            completedAt: null
        };

        // 배열 최상단에 추가 (최신 항목이 맨 위)
        todos.unshift(newTodo);

        // 201 Created 상태 코드로 응답
        res.status(201).json({
            success: true,
            data: newTodo,
            message: '할일이 정상적으로 추가되었습니다.'
        });
    } catch (error) {
        // 예상 외 에러 처리
        console.error('할일 추가 중 오류:', error);
        res.status(500).json({
            success: false,
            data: null,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/todos
 * 모든 할일 조회
 * 응답: 200 OK - 할일 배열
 */
router.get('/', (req, res) => {
    try {
        // 전체 할일 목록 반환
        res.status(200).json({
            success: true,
            data: todos,
            message: `총 ${todos.length}개의 할일을 조회했습니다.`
        });
    } catch (error) {
        // 예상 외 에러 처리
        console.error('할일 조회 중 오류:', error);
        res.status(500).json({
            success: false,
            data: null,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/todos/:id
 * 특정 할일 조회
 * 응답: 200 OK - 요청한 할일 객체
 *       404 Not Found - 할일을 찾을 수 없음
 */
router.get('/:id', (req, res) => {
    try {
        // URL 파라미터에서 ID 추출
        const id = Number(req.params.id);

        // 숫자 변환 검증
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: '유효하지 않은 ID 형식입니다.'
            });
        }

        // 해당 ID의 할일 찾기
        const todo = findTodoById(id);

        if (!todo) {
            return res.status(404).json({
                success: false,
                data: null,
                message: '해당하는 할일을 찾을 수 없습니다.'
            });
        }

        // 찾은 할일 반환
        res.status(200).json({
            success: true,
            data: todo,
            message: '할일을 정상적으로 조회했습니다.'
        });
    } catch (error) {
        // 예상 외 에러 처리
        console.error('할일 조회 중 오류:', error);
        res.status(500).json({
            success: false,
            data: null,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

/**
 * PATCH /api/todos/:id
 * 할일 수정 (완료 상태 토글 또는 내용 수정)
 * 요청 본문: { completed?: boolean, content?: string }
 * 응답: 200 OK - 수정된 할일 객체
 *       400 Bad Request - 검증 실패
 *       404 Not Found - 할일을 찾을 수 없음
 */
router.patch('/:id', (req, res) => {
    try {
        // URL 파라미터에서 ID 추출
        const id = Number(req.params.id);

        // 숫자 변환 검증
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: '유효하지 않은 ID 형식입니다.'
            });
        }

        // 요청 본문에서 업데이트 항목 추출
        const { completed, content } = req.body;

        // 해당 ID의 할일 찾기
        const todo = findTodoById(id);

        if (!todo) {
            return res.status(404).json({
                success: false,
                data: null,
                message: '해당하는 할일을 찾을 수 없습니다.'
            });
        }

        // content가 제공된 경우: 할일 내용 수정
        if (content !== undefined) {
            // 입력 검증
            const validation = validateContent(content);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    data: null,
                    message: validation.message
                });
            }

            // 내용 업데이트
            todo.content = String(content).trim();
        }

        // completed가 제공된 경우: 완료 상태 토글 또는 설정
        if (completed !== undefined) {
            const newCompletedStatus = Boolean(completed);
            todo.completed = newCompletedStatus;

            // 완료 시각 업데
            if (newCompletedStatus) {
                // 완료됨: 현재 시각 기록
                todo.completedAt = new Date().toISOString();
            } else {
                // 미완료: 완료 시각 제거
                todo.completedAt = null;
            }
        }

        // 수정된 할일 반환
        res.status(200).json({
            success: true,
            data: todo,
            message: '할일이 정상적으로 수정되었습니다.'
        });
    } catch (error) {
        // 예상 외 에러 처리
        console.error('할일 수정 중 오류:', error);
        res.status(500).json({
            success: false,
            data: null,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

/**
 * DELETE /api/todos/:id
 * 할일 삭제
 * 응답: 200 OK - 삭제 완료 메시지
 *       404 Not Found - 할일을 찾을 수 없음
 */
router.delete('/:id', (req, res) => {
    try {
        // URL 파라미터에서 ID 추출
        const id = Number(req.params.id);

        // 숫자 변환 검증
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: '유효하지 않은 ID 형식입니다.'
            });
        }

        // 해당 ID의 할일 인덱스 찾기
        const index = findTodoIndexById(id);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                data: null,
                message: '해당하는 할일을 찾을 수 없습니다.'
            });
        }

        // 배열에서 할일 제거 (splice 사용)
        const deletedTodo = todos.splice(index, 1)[0];

        // 삭제 완료 응답
        res.status(200).json({
            success: true,
            data: deletedTodo,
            message: '할일이 정상적으로 삭제되었습니다.'
        });
    } catch (error) {
        // 예상 외 에러 처리
        console.error('할일 삭제 중 오류:', error);
        res.status(500).json({
            success: false,
            data: null,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

/**
 * ============================================================
 * 라우터 내보내기
 * ============================================================
 */

module.exports = router;

/**
 * ============================================================
 * 독립 실행 모드 - todo.js를 직접 실행했을 때
 * 자동으로 Express 서버 시작
 * ============================================================
 */

if (require.main === module) {
    const express = require('express');
    const app = express();
    const PORT = process.env.PORT || 8000;

    // 미들웨어 설정
    app.use(express.json());

    // 라우터 마운트
    app.use('/api/todos', router);

    // 루트 경로
    app.get('/', (req, res) => {
        res.json({
            message: 'TODO API 서버 실행 중',
            endpoints: {
                'POST /api/todos': '새로운 할일 추가',
                'GET /api/todos': '모든 할일 조회',
                'GET /api/todos/:id': '특정 할일 조회',
                'PATCH /api/todos/:id': '할일 수정',
                'DELETE /api/todos/:id': '할일 삭제'
            }
        });
    });

    // 서버 시작
    app.listen(PORT, () => {
        console.log(`✅ TODO API 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
        console.log(`📡 API 기본 경로: http://localhost:${PORT}/api/todos`);
    });
}
## 역활
요구사항을 분석하여 Prisma ORM을 활용한 데이터베이스 스키마 설게한다.