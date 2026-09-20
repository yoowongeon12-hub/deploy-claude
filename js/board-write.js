/**
 * ============================================================
 * 게시글 작성 페이지 JavaScript
 * 새로운 게시글 작성 기능
 * ============================================================
 */

// API 기본 URL 설정 (let 사용으로 재선언 가능하게 변경)
let API_BASE_URL = 'http://localhost:3000/api/posts';

/**
 * 게시글 작성/수정 초기화 함수
 * app.js에서 호출됨
 */
function initBoardWrite(postId) {
    try {
        // 저장 버튼 클릭 이벤트
        const btnSave = document.getElementById('btn-save');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                submitPost(postId);
            });
        }

        // 취소 버튼 클릭 이벤트
        const btnCancel = document.getElementById('btn-cancel');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                // 목록으로 이동 (SPA 라우팅)
                window.location.hash = '#index';
            });
        }

        // 수정 모드인 경우 기존 데이터 로드
        if (postId) {
            loadPostForEdit(postId);
        } else {
            // 제목 입력 필드에 포커스 설정
            const titleInput = document.getElementById('post-title');
            if (titleInput) {
                titleInput.focus();
            }
        }
    } catch (error) {
        console.error('initBoardWrite 에러:', error);
    }
}

/**
 * 수정 모드에서 기존 게시글 데이터 로드
 * @async
 * @param {number} postId - 게시글 ID
 */
async function loadPostForEdit(postId) {
    try {
        // API 호출: 게시글 상세 조회
        const response = await fetch(`${API_BASE_URL}/${postId}`);

        // 응답 상태 확인
        if (!response.ok) {
            throw new Error('게시글을 불러올 수 없습니다');
        }

        // JSON 응답 파싱
        const result = await response.json();

        // API 응답 확인
        if (!result.success) {
            throw new Error(result.message || '게시글 조회 실패');
        }

        // 기존 데이터를 입력 필드에 채우기
        const post = result.data;
        const titleInput = document.getElementById('post-title');
        const contentInput = document.getElementById('post-content');
        const authorInput = document.getElementById('post-author');

        if (titleInput) titleInput.value = post.title;
        if (contentInput) contentInput.value = post.content;
        if (authorInput) authorInput.value = post.author_name;
    } catch (error) {
        // 에러 로깅
        console.error('게시글 로드 에러:', error);
        alert('게시글을 불러올 수 없습니다');
        window.location.hash = '#index';
    }
}

/**
 * 페이지 로드 완료 시 실행되는 초기화 함수 (레거시 지원)
 */
document.addEventListener('DOMContentLoaded', () => {
    // URL 쿼리 파라미터에서 게시글 ID 추출 (레거시)
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    // app.js가 없거나 직접 접근한 경우
    if (typeof initBoardWrite === 'function') {
        initBoardWrite(postId);
    }
});

/**
 * 게시글을 서버에 제출하는 함수
 * @async
 * @param {number} postId - 수정할 게시글 ID (선택사항)
 */
async function submitPost(postId) {
    // 입력 필드들 가져오기
    const titleInput = document.getElementById('post-title');
    const contentInput = document.getElementById('post-content');
    const authorInput = document.getElementById('post-author');

    // 필드가 없으면 에러
    if (!titleInput || !contentInput || !authorInput) {
        alert('폼 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
        return;
    }

    // 각 필드의 값을 가져오기 (앞뒤 공백 제거)
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const authorName = authorInput.value.trim();

    // 입력값 검증: 제목 확인
    if (!title) {
        alert('제목을 입력해주세요');
        titleInput.focus();
        return;
    }

    // 입력값 검증: 제목 길이 확인 (1~200자)
    if (title.length < 1 || title.length > 200) {
        alert('제목은 1자 이상 200자 이하로 입력해주세요');
        titleInput.focus();
        return;
    }

    // 입력값 검증: 내용 확인
    if (!content) {
        alert('내용을 입력해주세요');
        contentInput.focus();
        return;
    }

    // 입력값 검증: 내용 길이 확인 (1~10000자)
    if (content.length < 1 || content.length > 10000) {
        alert('내용은 1자 이상 10000자 이하로 입력해주세요');
        contentInput.focus();
        return;
    }

    // 입력값 검증: 작성자명 확인
    if (!authorName) {
        alert('작성자명을 입력해주세요');
        authorInput.focus();
        return;
    }

    // 입력값 검증: 작성자명 길이 확인
    if (authorName.length < 1 || authorName.length > 50) {
        alert('작성자명은 1자 이상 50자 이하로 입력해주세요');
        authorInput.focus();
        return;
    }

    try {
        // 저장 버튼 비활성화 (중복 제출 방지)
        const btnSave = document.getElementById('btn-save');
        if (btnSave) {
            btnSave.disabled = true;
        }

        // 수정 모드인지 작성 모드인지 판단
        const isEditMode = !!postId;
        // API 엔드포인트 결정
        const apiEndpoint = isEditMode ? `${API_BASE_URL}/${postId}` : API_BASE_URL;
        // HTTP 메서드 결정
        const httpMethod = isEditMode ? 'PUT' : 'POST';

        // API 호출: 게시글 작성 또는 수정
        const response = await fetch(apiEndpoint, {
            method: httpMethod,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content,
                author_name: authorName
            })
        });

        // 응답 상태 확인
        if (!response.ok) {
            // 저장 버튼 다시 활성화
            if (btnSave) btnSave.disabled = false;
            throw new Error(isEditMode ? '게시글 수정에 실패했습니다' : '게시글 작성에 실패했습니다');
        }

        // JSON 응답 파싱
        const result = await response.json();

        // API 응답 확인
        if (!result.success) {
            // 저장 버튼 다시 활성화
            if (btnSave) btnSave.disabled = false;
            throw new Error(result.message || (isEditMode ? '게시글 수정 실패' : '게시글 작성 실패'));
        }

        // 게시글 작성/수정 성공 메시지
        alert(isEditMode ? '게시글이 수정되었습니다' : '게시글이 작성되었습니다');

        // 게시글의 상세 페이지로 이동
        const targetPostId = isEditMode ? postId : result.data.id;
        window.location.hash = `#detail/${targetPostId}`;
    } catch (error) {
        // 에러 로깅
        console.error('게시글 작성/수정 에러:', error);

        // 사용자에게 에러 메시지 표시
        alert(error.message || '게시글 작성/수정 중 오류가 발생했습니다');

        // 저장 버튼 다시 활성화
        const btnSave = document.getElementById('btn-save');
        if (btnSave) btnSave.disabled = false;
    }
}
