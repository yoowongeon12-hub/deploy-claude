/**
 * ============================================================
 * 게시판 API 테스트 파일
 * Express.js 라우터 엔드포인트 테스트 (Node.js 내장 http 모듈 사용)
 * ============================================================
 * 게시글 CRUD 및 댓글 CRUD 엔드포인트 검증
 */

const http = require('http');

/**
 * HTTP 요청을 보내고 응답을 받는 함수
 * @param {string} method - HTTP 메서드 (GET, POST, PUT, DELETE)
 * @param {string} path - 요청 경로 (예: /api/posts)
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
    console.log('게시판 API 테스트 시작');
    console.log('='.repeat(60) + '\n');

    let postId = null;
    let commentId = null;
    let passedTests = 0;
    let totalTests = 0;

    try {
        // ============================================================
        // 1. POST /api/posts - 새 게시글 작성
        // ============================================================
        console.log('\n[1] POST /api/posts - 새 게시글 작성');
        console.log('-'.repeat(60));

        // 테스트 1-1: 정상적인 게시글 작성
        totalTests++;
        try {
            const res1 = await makeRequest('POST', '/api/posts', {
                title: '테스트 게시글 1',
                content: '이것은 테스트 게시글입니다.',
                author_name: '테스트 작성자'
            });

            const passed = res1.status === 201 &&
                          res1.data.success === true &&
                          res1.data.data.title === '테스트 게시글 1';

            logTest('정상적인 게시글 작성 (201 Created)', passed);
            if (passed) {
                passedTests++;
                postId = res1.data.data.id;
                console.log(`  생성된 게시글 ID: ${postId}`);
            }
        } catch (e) {
            logTest('정상적인 게시글 작성 (201 Created)', false, e.message);
        }

        // 테스트 1-2: 빈 제목으로 작성 시도
        totalTests++;
        try {
            const res2 = await makeRequest('POST', '/api/posts', {
                title: '',
                content: '내용',
                author_name: '작성자'
            });

            const passed = res2.status === 400 && res2.data.success === false;
            logTest('빈 제목으로 작성 시도 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('빈 제목으로 작성 시도 (400 Bad Request)', false, e.message);
        }

        // 테스트 1-3: 빈 내용으로 작성 시도
        totalTests++;
        try {
            const res3 = await makeRequest('POST', '/api/posts', {
                title: '제목',
                content: '',
                author_name: '작성자'
            });

            const passed = res3.status === 400 && res3.data.success === false;
            logTest('빈 내용으로 작성 시도 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('빈 내용으로 작성 시도 (400 Bad Request)', false, e.message);
        }

        // 테스트 1-4: 빈 작성자명으로 작성 시도
        totalTests++;
        try {
            const res4 = await makeRequest('POST', '/api/posts', {
                title: '제목',
                content: '내용',
                author_name: ''
            });

            const passed = res4.status === 400 && res4.data.success === false;
            logTest('빈 작성자명으로 작성 시도 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('빈 작성자명으로 작성 시도 (400 Bad Request)', false, e.message);
        }

        // 테스트 1-5: 두 번째 게시글 작성
        totalTests++;
        try {
            const res5 = await makeRequest('POST', '/api/posts', {
                title: '테스트 게시글 2',
                content: '두 번째 테스트 게시글입니다.',
                author_name: '작성자 2'
            });

            const passed = res5.status === 201 && res5.data.success === true;
            logTest('두 번째 게시글 작성 (201 Created)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('두 번째 게시글 작성 (201 Created)', false, e.message);
        }

        // ============================================================
        // 2. GET /api/posts - 게시글 목록 조회 (페이지네이션)
        // ============================================================
        console.log('\n[2] GET /api/posts - 게시글 목록 조회 (페이지네이션)');
        console.log('-'.repeat(60));

        // 테스트 2-1: 첫 번째 페이지 조회
        totalTests++;
        try {
            const res6 = await makeRequest('GET', '/api/posts?page=1', null);

            const passed = res6.status === 200 &&
                          res6.data.success === true &&
                          Array.isArray(res6.data.data.posts) &&
                          res6.data.data.total >= 2;

            logTest('첫 번째 페이지 조회 (200 OK)', passed, `총 ${res6.data.data.total}개`);
            if (passed) passedTests++;
        } catch (e) {
            logTest('첫 번째 페이지 조회 (200 OK)', false, e.message);
        }

        // 테스트 2-2: 페이지네이션 정보 확인
        totalTests++;
        try {
            const res7 = await makeRequest('GET', '/api/posts?page=1', null);

            const passed = res7.status === 200 &&
                          res7.data.data.page === 1 &&
                          typeof res7.data.data.totalPages === 'number';

            logTest('페이지네이션 정보 확인', passed, `페이지: ${res7.data.data.page}/${res7.data.data.totalPages}`);
            if (passed) passedTests++;
        } catch (e) {
            logTest('페이지네이션 정보 확인', false, e.message);
        }

        // ============================================================
        // 3. GET /api/posts/:id - 게시글 상세보기 (조회수 +1)
        // ============================================================
        console.log('\n[3] GET /api/posts/:id - 게시글 상세보기 (조회수 +1)');
        console.log('-'.repeat(60));

        // 테스트 3-1: 게시글 상세보기 조회
        totalTests++;
        try {
            const res8 = await makeRequest('GET', `/api/posts/${postId}`, null);

            const passed = res8.status === 200 &&
                          res8.data.success === true &&
                          res8.data.data.id === postId;

            logTest('게시글 상세보기 조회 (200 OK)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('게시글 상세보기 조회 (200 OK)', false, e.message);
        }

        // 테스트 3-2: 조회수 증가 확인
        totalTests++;
        try {
            const res9a = await makeRequest('GET', `/api/posts/${postId}`, null);
            const initialViewCount = res9a.data.data.view_count;

            // 약간의 지연 후 다시 조회
            await new Promise(resolve => setTimeout(resolve, 100));

            const res9b = await makeRequest('GET', `/api/posts/${postId}`, null);
            const newViewCount = res9b.data.data.view_count;

            const passed = newViewCount > initialViewCount;

            logTest('조회수 증가 확인', passed, `${initialViewCount} -> ${newViewCount}`);
            if (passed) passedTests++;
        } catch (e) {
            logTest('조회수 증가 확인', false, e.message);
        }

        // 테스트 3-3: 존재하지 않는 게시글 조회
        totalTests++;
        try {
            const res10 = await makeRequest('GET', '/api/posts/999999999', null);

            const passed = res10.status === 404 && res10.data.success === false;
            logTest('존재하지 않는 게시글 조회 (404 Not Found)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('존재하지 않는 게시글 조회 (404 Not Found)', false, e.message);
        }

        // ============================================================
        // 4. PUT /api/posts/:id - 게시글 수정
        // ============================================================
        console.log('\n[4] PUT /api/posts/:id - 게시글 수정');
        console.log('-'.repeat(60));

        // 테스트 4-1: 제목 수정
        totalTests++;
        try {
            const res11 = await makeRequest('PUT', `/api/posts/${postId}`, {
                title: '수정된 제목'
            });

            const passed = res11.status === 200 &&
                          res11.data.success === true &&
                          res11.data.data.title === '수정된 제목';

            logTest('게시글 제목 수정 (200 OK)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('게시글 제목 수정 (200 OK)', false, e.message);
        }

        // 테스트 4-2: 내용 수정
        totalTests++;
        try {
            const res12 = await makeRequest('PUT', `/api/posts/${postId}`, {
                content: '수정된 내용입니다.'
            });

            const passed = res12.status === 200 &&
                          res12.data.success === true &&
                          res12.data.data.content === '수정된 내용입니다.';

            logTest('게시글 내용 수정 (200 OK)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('게시글 내용 수정 (200 OK)', false, e.message);
        }

        // 테스트 4-3: 존재하지 않는 게시글 수정
        totalTests++;
        try {
            const res13 = await makeRequest('PUT', '/api/posts/999999999', {
                title: '수정된 제목'
            });

            const passed = res13.status === 400 && res13.data.success === false;
            logTest('존재하지 않는 게시글 수정 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('존재하지 않는 게시글 수정 (400 Bad Request)', false, e.message);
        }

        // ============================================================
        // 5. POST /api/posts/:postId/comments - 댓글 작성
        // ============================================================
        console.log('\n[5] POST /api/posts/:postId/comments - 댓글 작성');
        console.log('-'.repeat(60));

        // 테스트 5-1: 정상적인 댓글 작성
        totalTests++;
        try {
            const res14 = await makeRequest('POST', `/api/posts/${postId}/comments`, {
                content: '좋은 글이네요!',
                author_name: '댓글 작성자'
            });

            const passed = res14.status === 201 &&
                          res14.data.success === true &&
                          res14.data.data.content === '좋은 글이네요!';

            logTest('정상적인 댓글 작성 (201 Created)', passed);
            if (passed) {
                passedTests++;
                commentId = res14.data.data.id;
                console.log(`  생성된 댓글 ID: ${commentId}`);
            }
        } catch (e) {
            logTest('정상적인 댓글 작성 (201 Created)', false, e.message);
        }

        // 테스트 5-2: 빈 댓글 내용으로 작성 시도
        totalTests++;
        try {
            const res15 = await makeRequest('POST', `/api/posts/${postId}/comments`, {
                content: '',
                author_name: '작성자'
            });

            const passed = res15.status === 400 && res15.data.success === false;
            logTest('빈 댓글 내용으로 작성 시도 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('빈 댓글 내용으로 작성 시도 (400 Bad Request)', false, e.message);
        }

        // 테스트 5-3: 빈 댓글 작성자명으로 작성 시도
        totalTests++;
        try {
            const res16 = await makeRequest('POST', `/api/posts/${postId}/comments`, {
                content: '댓글',
                author_name: ''
            });

            const passed = res16.status === 400 && res16.data.success === false;
            logTest('빈 댓글 작성자명으로 작성 시도 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('빈 댓글 작성자명으로 작성 시도 (400 Bad Request)', false, e.message);
        }

        // 테스트 5-4: 존재하지 않는 게시글에 댓글 작성 시도
        totalTests++;
        try {
            const res17 = await makeRequest('POST', '/api/posts/999999999/comments', {
                content: '댓글',
                author_name: '작성자'
            });

            const passed = res17.status === 400 && res17.data.success === false;
            logTest('존재하지 않는 게시글에 댓글 작성 시도 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('존재하지 않는 게시글에 댓글 작성 시도 (400 Bad Request)', false, e.message);
        }

        // 테스트 5-5: 두 번째 댓글 작성
        totalTests++;
        try {
            const res18 = await makeRequest('POST', `/api/posts/${postId}/comments`, {
                content: '공감합니다!',
                author_name: '댓글 작성자 2'
            });

            const passed = res18.status === 201 && res18.data.success === true;
            logTest('두 번째 댓글 작성 (201 Created)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('두 번째 댓글 작성 (201 Created)', false, e.message);
        }

        // ============================================================
        // 6. GET /api/posts/:postId/comments - 댓글 목록 조회
        // ============================================================
        console.log('\n[6] GET /api/posts/:postId/comments - 댓글 목록 조회');
        console.log('-'.repeat(60));

        // 테스트 6-1: 댓글 목록 조회
        totalTests++;
        try {
            const res19 = await makeRequest('GET', `/api/posts/${postId}/comments`, null);

            const passed = res19.status === 200 &&
                          res19.data.success === true &&
                          Array.isArray(res19.data.data) &&
                          res19.data.data.length >= 2;

            logTest('댓글 목록 조회 (200 OK)', passed, `총 ${res19.data.data.length}개`);
            if (passed) passedTests++;
        } catch (e) {
            logTest('댓글 목록 조회 (200 OK)', false, e.message);
        }

        // 테스트 6-2: 존재하지 않는 게시글의 댓글 조회
        totalTests++;
        try {
            const res20 = await makeRequest('GET', '/api/posts/999999999/comments', null);

            const passed = res20.status === 404 && res20.data.success === false;
            logTest('존재하지 않는 게시글의 댓글 조회 (404 Not Found)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('존재하지 않는 게시글의 댓글 조회 (404 Not Found)', false, e.message);
        }

        // ============================================================
        // 7. PUT /api/posts/:postId/comments/:commentId - 댓글 수정
        // ============================================================
        console.log('\n[7] PUT /api/posts/:postId/comments/:commentId - 댓글 수정');
        console.log('-'.repeat(60));

        // 테스트 7-1: 댓글 수정
        totalTests++;
        try {
            const res21 = await makeRequest('PUT', `/api/posts/${postId}/comments/${commentId}`, {
                content: '수정된 댓글입니다!'
            });

            const passed = res21.status === 200 &&
                          res21.data.success === true &&
                          res21.data.data.content === '수정된 댓글입니다!';

            logTest('댓글 수정 (200 OK)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('댓글 수정 (200 OK)', false, e.message);
        }

        // 테스트 7-2: 존재하지 않는 댓글 수정
        totalTests++;
        try {
            const res22 = await makeRequest('PUT', `/api/posts/${postId}/comments/999999999`, {
                content: '수정된 댓글'
            });

            const passed = res22.status === 400 && res22.data.success === false;
            logTest('존재하지 않는 댓글 수정 (400 Bad Request)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('존재하지 않는 댓글 수정 (400 Bad Request)', false, e.message);
        }

        // ============================================================
        // 8. DELETE /api/posts/:postId/comments/:commentId - 댓글 삭제
        // ============================================================
        console.log('\n[8] DELETE /api/posts/:postId/comments/:commentId - 댓글 삭제');
        console.log('-'.repeat(60));

        // 테스트 8-1: 댓글 삭제
        totalTests++;
        try {
            const res23 = await makeRequest('DELETE', `/api/posts/${postId}/comments/${commentId}`, null);

            const passed = res23.status === 200 &&
                          res23.data.success === true &&
                          res23.data.data.id === commentId;

            logTest('댓글 삭제 (200 OK)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('댓글 삭제 (200 OK)', false, e.message);
        }

        // 테스트 8-2: 삭제된 댓글 다시 삭제 시도
        totalTests++;
        try {
            const res24 = await makeRequest('DELETE', `/api/posts/${postId}/comments/${commentId}`, null);

            const passed = res24.status === 404 && res24.data.success === false;
            logTest('삭제된 댓글 다시 삭제 시도 (404 Not Found)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('삭제된 댓글 다시 삭제 시도 (404 Not Found)', false, e.message);
        }

        // ============================================================
        // 9. DELETE /api/posts/:id - 게시글 삭제 (댓글도 함께 삭제)
        // ============================================================
        console.log('\n[9] DELETE /api/posts/:id - 게시글 삭제 (댓글도 함께 삭제)');
        console.log('-'.repeat(60));

        // 테스트 9-1: 게시글 삭제
        totalTests++;
        try {
            const res25 = await makeRequest('DELETE', `/api/posts/${postId}`, null);

            const passed = res25.status === 200 &&
                          res25.data.success === true &&
                          res25.data.data.id === postId;

            logTest('게시글 삭제 (200 OK)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('게시글 삭제 (200 OK)', false, e.message);
        }

        // 테스트 9-2: 삭제된 게시글 조회 시도
        totalTests++;
        try {
            const res26 = await makeRequest('GET', `/api/posts/${postId}`, null);

            const passed = res26.status === 404 && res26.data.success === false;
            logTest('삭제된 게시글 조회 시도 (404 Not Found)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('삭제된 게시글 조회 시도 (404 Not Found)', false, e.message);
        }

        // 테스트 9-3: 존재하지 않는 게시글 삭제
        totalTests++;
        try {
            const res27 = await makeRequest('DELETE', '/api/posts/999999999', null);

            const passed = res27.status === 404 && res27.data.success === false;
            logTest('존재하지 않는 게시글 삭제 (404 Not Found)', passed);
            if (passed) passedTests++;
        } catch (e) {
            logTest('존재하지 않는 게시글 삭제 (404 Not Found)', false, e.message);
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
