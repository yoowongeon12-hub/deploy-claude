/**
 * ============================================================
 * TODO API 테스트 파일
 * Express.js 라우터 엔드포인트 테스트 (Node.js 내장 http 모듈 사용)
 * ============================================================
 */

const http = require('http');

/**
 * HTTP 요청을 보내고 응답을 받는 함수
 * @param {string} method - HTTP 메서드 (GET, POST, PATCH, DELETE)
 * @param {string} path - 요청 경로 (예: /api/todos)
 * @param {object} body - 요청 본문 (선택사항)
 * @returns {Promise<object>} 응답 데이터
 */
function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            // 응답 데이터 수집
            res.on('data', (chunk) => {
                data += chunk;
            });

            // 응답 완료
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: parsed
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        // 요청 에러 처리
        req.on('error', (error) => {
            reject(error);
        });

        // 요청 본문 전송
        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

/**
 * 테스트 결과 출력 함수
 * @param {string} name - 테스트 이름
 * @param {boolean} passed - 테스트 통과 여부
 * @param {string} message - 추가 메시지 (선택사항)
 */
function logTest(name, passed, message = '') {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    const color = passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${color}${status}${reset} - ${name}${message ? ` : ${message}` : ''}`);
}

/**
 * ============================================================
 * 테스트 실행
 * ============================================================
 */

async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log('TODO API 테스트 시작');
    console.log('='.repeat(60) + '\n');

    let todoId = null;
    let passedTests = 0;
    let totalTests = 0;

    try {
        // ============================================================
        // 1. POST /api/todos - 새로운 할일 추가
        // ============================================================
        console.log('\n[1] POST /api/todos - 새로운 할일 추가');
        console.log('-'.repeat(60));

        // 테스트 1-1: 정상적인 할일 추가
        totalTests++;
        try {
            const res1 = await makeRequest('POST', '/api/todos', {
                content: '테스트 할일 1'
            });

            const passed = res1.status === 201 &&
                          res1.data.success === true &&
                          res1.data.data.content === '테스트 할일 1';

            logTest('정상적인 할일 추가 (201 Created)', passed);
            if (passed) {
                passedTests++;
                todoId = res1.data.data.id;
                console.log(`  생성된 ID: ${todoId}`);
            }
        } catch (e) {
            logTest('정상적인 할일 추가 (201 Created)', false, e.message);
        }

        // 테스트 1-2: 빈 내용으로 추가 시도
        totalTests++;
        try {
            const res2 = await makeRequest('POST', '/api/todos', {
                content: ''
            });

            const passed = res2.status === 400 && res2.data.success === false;
            logTest('빈 내용으로 추가 시도 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('빈 내용으로 추가 시도 (400 Bad Request)', false, e.message);
        }

        // 테스트 1-3: 공백으로만 된 내용 추가 시도
        totalTests++;
        try {
            const res3 = await makeRequest('POST', '/api/todos', {
                content: '   '
            });

            const passed = res3.status === 400 && res3.data.success === false;
            logTest('공백만 입력하여 추가 시도 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('공백만 입력하여 추가 시도 (400 Bad Request)', false, e.message);
        }

        // 테스트 1-4: 200자 초과 내용 추가 시도
        totalTests++;
        try {
            const longContent = 'a'.repeat(201);
            const res4 = await makeRequest('POST', '/api/todos', {
                content: longContent
            });

            const passed = res4.status === 400 && res4.data.success === false;
            logTest('200자 초과 내용으로 추가 시도 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('200자 초과 내용으로 추가 시도 (400 Bad Request)', false, e.message);
        }

        // 테스트 1-5: 두 번째 할일 추가 (GET 테스트용)
        totalTests++;
        try {
            const res5 = await makeRequest('POST', '/api/todos', {
                content: '테스트 할일 2'
            });

            const passed = res5.status === 201 && res5.data.success === true;
            logTest('두 번째 할일 추가 (201 Created)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('두 번째 할일 추가 (201 Created)', false, e.message);
        }

        // ============================================================
        // 2. GET /api/todos - 모든 할일 조회
        // ============================================================
        console.log('\n[2] GET /api/todos - 모든 할일 조회');
        console.log('-'.repeat(60));

        // 테스트 2-1: 모든 할일 조회
        totalTests++;
        try {
            const res6 = await makeRequest('GET', '/api/todos', null);

            const passed = res6.status === 200 &&
                          res6.data.success === true &&
                          Array.isArray(res6.data.data) &&
                          res6.data.data.length >= 2;

            logTest('모든 할일 조회 (200 OK)', passed, `총 ${res6.data.data.length}개`);
            if (passed) passedTests++;
        } catch (e) {
            logTest('모든 할일 조회 (200 OK)', false, e.message);
        }

        // ============================================================
        // 3. GET /api/todos/:id - 특정 할일 조회
        // ============================================================
        console.log('\n[3] GET /api/todos/:id - 특정 할일 조회');
        console.log('-'.repeat(60));

        // 테스트 3-1: 존재하는 할일 조회
        totalTests++;
        try {
            const res7 = await makeRequest('GET', `/api/todos/${todoId}`, null);

            const passed = res7.status === 200 &&
                          res7.data.success === true &&
                          res7.data.data.id === todoId;

            logTest('존재하는 할일 조회 (200 OK)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('존재하는 할일 조회 (200 OK)', false, e.message);
        }

        // 테스트 3-2: 존재하지 않는 할일 조회
        totalTests++;
        try {
            const res8 = await makeRequest('GET', '/api/todos/999999999', null);

            const passed = res8.status === 404 && res8.data.success === false;
            logTest('존재하지 않는 할일 조회 (404 Not Found)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('존재하지 않는 할일 조회 (404 Not Found)', false, e.message);
        }

        // 테스트 3-3: 유효하지 않은 ID 조회
        totalTests++;
        try {
            const res9 = await makeRequest('GET', '/api/todos/invalid', null);

            const passed = res9.status === 400 && res9.data.success === false;
            logTest('유효하지 않은 ID 조회 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('유효하지 않은 ID 조회 (400 Bad Request)', false, e.message);
        }

        // ============================================================
        // 4. PATCH /api/todos/:id - 할일 수정
        // ============================================================
        console.log('\n[4] PATCH /api/todos/:id - 할일 수정');
        console.log('-'.repeat(60));

        // 테스트 4-1: 완료 상태 토글
        totalTests++;
        try {
            const res10 = await makeRequest('PATCH', `/api/todos/${todoId}`, {
                completed: true
            });

            const passed = res10.status === 200 &&
                          res10.data.success === true &&
                          res10.data.data.completed === true &&
                          res10.data.data.completedAt !== null;

            logTest('완료 상태 토글 (200 OK)', passed, '완료됨 상태로 변경');
            if (passed) passedTests++;
        } catch (e) {
            logTest('완료 상태 토글 (200 OK)', false, e.message);
        }

        // 테스트 4-2: 할일 내용 수정
        totalTests++;
        try {
            const res11 = await makeRequest('PATCH', `/api/todos/${todoId}`, {
                content: '수정된 할일'
            });

            const passed = res11.status === 200 &&
                          res11.data.success === true &&
                          res11.data.data.content === '수정된 할일';

            logTest('할일 내용 수정 (200 OK)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('할일 내용 수정 (200 OK)', false, e.message);
        }

        // 테스트 4-3: 존재하지 않는 할일 수정
        totalTests++;
        try {
            const res12 = await makeRequest('PATCH', '/api/todos/999999999', {
                completed: true
            });

            const passed = res12.status === 404 && res12.data.success === false;
            logTest('존재하지 않는 할일 수정 (404 Not Found)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('존재하지 않는 할일 수정 (404 Not Found)', false, e.message);
        }

        // 테스트 4-4: 유효하지 않은 내용으로 수정
        totalTests++;
        try {
            const res13 = await makeRequest('PATCH', `/api/todos/${todoId}`, {
                content: ''
            });

            const passed = res13.status === 400 && res13.data.success === false;
            logTest('유효하지 않은 내용으로 수정 시도 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('유효하지 않은 내용으로 수정 시도 (400 Bad Request)', false, e.message);
        }

        // ============================================================
        // 5. DELETE /api/todos/:id - 할일 삭제
        // ============================================================
        console.log('\n[5] DELETE /api/todos/:id - 할일 삭제');
        console.log('-'.repeat(60));

        // 테스트 5-1: 존재하는 할일 삭제
        totalTests++;
        try {
            const res14 = await makeRequest('DELETE', `/api/todos/${todoId}`, null);

            const passed = res14.status === 200 &&
                          res14.data.success === true &&
                          res14.data.data.id === todoId;

            logTest('존재하는 할일 삭제 (200 OK)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('존재하는 할일 삭제 (200 OK)', false, e.message);
        }

        // 테스트 5-2: 삭제된 할일 다시 삭제 시도
        totalTests++;
        try {
            const res15 = await makeRequest('DELETE', `/api/todos/${todoId}`, null);

            const passed = res15.status === 404 && res15.data.success === false;
            logTest('삭제된 할일 다시 삭제 시도 (404 Not Found)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('삭제된 할일 다시 삭제 시도 (404 Not Found)', false, e.message);
        }

        // 테스트 5-3: 존재하지 않는 할일 삭제
        totalTests++;
        try {
            const res16 = await makeRequest('DELETE', '/api/todos/999999999', null);

            const passed = res16.status === 404 && res16.data.success === false;
            logTest('존재하지 않는 할일 삭제 (404 Not Found)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('존재하지 않는 할일 삭제 (404 Not Found)', false, e.message);
        }

    } catch (error) {
        console.error('\n테스트 실행 중 예상 외 에러:', error.message);
    }

    // ============================================================
    // 테스트 결과 요약
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('테스트 결과 요약');
    console.log('='.repeat(60));
    console.log(`전체: ${passedTests}/${totalTests} 테스트 통과`);
    console.log(`성공률: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('='.repeat(60) + '\n');

    // 프로세스 종료
    process.exit(passedTests === totalTests ? 0 : 1);
}

/**
 * ============================================================
 * 테스트 시작
 * ============================================================
 */

// 서버 시작 대기 후 테스트 실행
setTimeout(() => {
    runTests();
}, 1000);
