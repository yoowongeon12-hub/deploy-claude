/**
 * ============================================================
 * 게시글 수정 페이지 JavaScript
 * 기존 게시글 수정 기능
 * ============================================================
 */

// API 기본 URL 설정 (let 사용으로 재선언 가능하게 변경)
let API_BASE_URL = 'http://localhost:3000/api/posts';

// URL에서 게시글 ID를 추출할 변수
let postId = null;

/**
 * 페이지 로드 완료 시 실행되는 초기화 함수
 */
document.addEventListener('DOMContentLoaded', () => {
    // URL 쿼리 파라미터에서 게시글 ID 추출
    const urlParams = new URLSearchParams(window.location.search);
    postId = urlParams.get('id');

    // 게시글 ID가 없으면 목록으로 이동
    if (!postId) {
        alert('잘못된 접근입니다');
        window.location.href = 'board-index.html';
        return;
    }

    // 게시글 로드
    loadPost();

    // 저장 버튼 클릭 이벤트
    const btnSave = document.getElementById('btn-save');
    btnSave.addEventListener('click', submitPost);

    // 취소 버튼 클릭 이벤트
    const btnCancel = document.getElementById('btn-cancel');
    btnCancel.addEventListener('click', () => {
        // 게시글 상세페이지로 이동
        window.location.href = `board-detail.html?id=${postId}`;
    });
});

/**
 * API에서 게시글 정보를 로드하는 함수
 * @async
 */
async function loadPost() {
    try {
        // API 호출: 게시글 상세보기
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

        // 입력 필드에 게시글 정보 채우기
        populateForm(result.data);

        // 페이지 제목 업데이트
        document.title = `${result.data.title} 수정 - 게시판`;
    } catch (error) {
        // 에러 로깅 및 사용자에게 알림
        console.error('게시글 로드 에러:', error);
        alert('게시글을 불러오는 중 오류가 발생했습니다');

        // 목록으로 이동
        window.location.href = 'board-index.html';
    }
}

/**
 * 게시글 정보를 폼에 채우는 함수
 * @param {Object} post - 게시글 객체
 */
function populateForm(post) {
    // 제목 필드에 기존 제목 설정
    document.getElementById('post-title').value = post.title;

    // 내용 필드에 기존 내용 설정
    document.getElementById('post-content').value = post.content;

    // 작성자명 필드에 기존 작성자명 설정 (읽기 전용)
    const authorInput = document.getElementById('post-author');
    authorInput.value = post.author_name;
    authorInput.disabled = true;

    // 페이지 헤더 제목 업데이트
    document.querySelector('.header h1').textContent = '게시글 수정';
}

/**
 * 수정된 게시글을 서버에 제출하는 함수
 * @async
 */
async function submitPost() {
    // 입력 필드들 가져오기
    const titleInput = document.getElementById('post-title');
    const contentInput = document.getElementById('post-content');

    // 각 필드의 값을 가져오기 (앞뒤 공백 제거)
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

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

    try {
        // 저장 버튼 비활성화 (중복 제출 방지)
        const btnSave = document.getElementById('btn-save');
        btnSave.disabled = true;

        // API 호출: 게시글 수정
        const response = await fetch(`${API_BASE_URL}/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });

        // 응답 상태 확인
        if (!response.ok) {
            // 저장 버튼 다시 활성화
            btnSave.disabled = false;
            throw new Error('게시글 수정에 실패했습니다');
        }

        // JSON 응답 파싱
        const result = await response.json();

        // API 응답 확인
        if (!result.success) {
            // 저장 버튼 다시 활성화
            btnSave.disabled = false;
            throw new Error(result.message || '게시글 수정 실패');
        }

        // 게시글 수정 성공 메시지
        alert('게시글이 수정되었습니다');

        // 수정된 게시글의 상세 페이지로 이동
        window.location.href = `board-detail.html?id=${postId}`;
    } catch (error) {
        // 에러 로깅
        console.error('게시글 수정 에러:', error);

        // 사용자에게 에러 메시지 표시
        alert(error.message || '게시글 수정 중 오류가 발생했습니다');

        // 저장 버튼 다시 활성화
        document.getElementById('btn-save').disabled = false;
    }
}
