/**
 * ============================================================
 * 게시글 상세보기 페이지 JavaScript
 * 게시글 조회, 댓글 관리 기능
 * ============================================================
 */

// API 기본 URL 설정
let API_BASE_URL = 'http://localhost:3000/api/posts';

// 게시글 ID 저장
let postId = null;

// ============================================================
// 전역 네임스페이스에서 댓글 관련 상태 관리
// 스크립트 재로드 후에도 상태가 유지되도록 window 객체 활용
// ============================================================

// 댓글 관련 상태를 관리하는 전역 객체 (스크립트 재로드 후에도 유지됨)
if (!window.boardDetailState) {
    window.boardDetailState = {
        commentSubmitListener: null,
        editButtonListener: null,
        deleteButtonListener: null,
        isSubmittingComment: false,
        lastSubmitTime: 0  // 마지막 제출 시간 (중복 방지용)
    };
}

// 편의상 로컬 변수로 참조 (window.boardDetailState의 프록시)
let commentSubmitListener = null;
let editButtonListener = null;
let deleteButtonListener = null;
let isSubmittingComment = false;

/**
 * 게시글 상세보기 초기화 함수
 * app.js에서 호출됨
 */
function initBoardDetail(id) {
    // 게시글 ID 저장
    postId = id;

    // 게시글 ID가 없으면 목록으로 이동
    if (!postId) {
        showToast('잘못된 접근입니다', 'error');
        setTimeout(() => {
            window.location.hash = '#index';
        }, 1000);
        return;
    }

    // 게시글 로드
    loadPost();

    // 댓글 로드
    loadComments();

    // 이벤트 리스너 제거 및 재등록 (중복 방지)
    attachCommentEventListeners();
}

/**
 * 댓글 관련 이벤트 리스너를 등록하는 함수
 * 기존 리스너를 제거하고 새로 등록하여 중복을 방지함
 */
function attachCommentEventListeners() {
    // 댓글 제출 버튼 이벤트 리스너 제거 및 재등록
    const btnCommentSubmit = document.getElementById('btn-comment-submit');
    if (btnCommentSubmit) {
        // 1. 기존 리스너 제거 (있으면)
        if (commentSubmitListener) {
            btnCommentSubmit.removeEventListener('click', commentSubmitListener);
        }

        // 2. 새로운 리스너 등록
        commentSubmitListener = submitComment;
        btnCommentSubmit.addEventListener('click', commentSubmitListener);

        // 3. 데이터 속성으로 리스너 등록 여부 표시
        btnCommentSubmit.dataset.listenerAttached = 'true';
    }

    // 수정 버튼 이벤트 리스너 제거 및 재등록
    const btnEdit = document.getElementById('btn-edit');
    if (btnEdit) {
        // 1. 기존 리스너 제거 (있으면)
        if (editButtonListener) {
            btnEdit.removeEventListener('click', editButtonListener);
        }

        // 2. 새로운 리스너 등록
        editButtonListener = (e) => {
            e.preventDefault();
            // 수정 페이지로 이동 (게시글 ID 파라미터 전달)
            window.location.hash = `#edit/${postId}`;
        };
        btnEdit.addEventListener('click', editButtonListener);
        btnEdit.dataset.listenerAttached = 'true';
    }

    // 삭제 버튼 이벤트 리스너 제거 및 재등록
    const btnDelete = document.getElementById('btn-delete');
    if (btnDelete) {
        // 1. 기존 리스너 제거 (있으면)
        if (deleteButtonListener) {
            btnDelete.removeEventListener('click', deleteButtonListener);
        }

        // 2. 새로운 리스너 등록
        deleteButtonListener = deletePost;
        btnDelete.addEventListener('click', deleteButtonListener);
        btnDelete.dataset.listenerAttached = 'true';
    }
}

/**
 * 페이지 로드 완료 시 실행되는 초기화 함수 (레거시 지원)
 * 중복 등록을 방지하기 위해 한 번만 등록되도록 처리
 */
if (!window.boardDetailInitialized) {
    window.boardDetailInitialized = true;

    document.addEventListener('DOMContentLoaded', () => {
        // URL 쿼리 파라미터에서 게시글 ID 추출 (레거시)
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        // app.js가 없거나 직접 접근한 경우
        if (id && typeof initBoardDetail === 'function') {
            initBoardDetail(id);
        }
    });
}

/**
 * API에서 게시글 상세정보를 로드하는 함수
 * @async
 */
async function loadPost() {
    try {
        // API 호출: 게시글 상세보기 (조회수 자동 증가)
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

        // 게시글 정보 렌더링
        renderPost(result.data);
    } catch (error) {
        // 에러 로깅 및 사용자에게 알림
        console.error('게시글 로드 에러:', error);
        showToast('게시글을 불러오는 중 오류가 발생했습니다', 'error');

        // 목록으로 이동 (SPA 라우팅)
        setTimeout(() => {
            window.location.hash = '#index';
        }, 1000);
    }
}

/**
 * 게시글 정보를 HTML로 렌더링하는 함수
 * @param {Object} post - 게시글 객체
 */
function renderPost(post) {
    // 게시글 제목 설정
    document.getElementById('post-title').textContent = post.title;

    // 게시글 작성자 설정
    document.getElementById('post-author').textContent = `작성자: ${post.author_name}`;

    // 게시글 작성일 포맷팅 및 설정
    const createdDate = new Date(post.created_at);
    const formattedDate = createdDate.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('post-date').textContent = `작성일: ${formattedDate}`;

    // 게시글 조회수 설정
    document.getElementById('post-views').textContent = `조회수: ${post.view_count}`;

    // 게시글 내용 설정 (XSS 방지를 위해 textContent 사용)
    document.getElementById('post-content').textContent = post.content;

    // 페이지 제목 업데이트
    document.title = `${post.title} - 게시판`;
}

/**
 * API에서 댓글 목록을 로드하는 함수
 * @async
 */
async function loadComments() {
    try {
        // API 호출: 댓글 목록 조회
        const response = await fetch(`${API_BASE_URL}/${postId}/comments`);

        // 응답 상태 확인
        if (!response.ok) {
            throw new Error('댓글을 불러올 수 없습니다');
        }

        // JSON 응답 파싱
        const result = await response.json();

        // API 응답 확인
        if (!result.success) {
            throw new Error(result.message || '댓글 조회 실패');
        }

        // 댓글 목록 렌더링
        renderComments(result.data);
    } catch (error) {
        // 에러 로깅
        console.error('댓글 로드 에러:', error);
        alert('댓글을 불러오는 중 오류가 발생했습니다');
    }
}

/**
 * 댓글 목록을 HTML로 렌더링하는 함수
 * @param {Array} comments - 댓글 배열
 */
function renderComments(comments) {
    // 댓글 목록을 표시할 컨테이너 가져오기
    const commentListElement = document.getElementById('comment-list');

    // 댓글 개수 업데이트
    document.getElementById('comment-count').textContent = comments.length;

    // 기존 댓글 목록 비우기
    commentListElement.innerHTML = '';

    // 댓글 배열이 비어있으면 메시지 표시
    if (!comments || comments.length === 0) {
        commentListElement.innerHTML = '<div class="no-comments">등록된 댓글이 없습니다</div>';
        return;
    }

    // 각 댓글을 엘리먼트로 생성
    comments.forEach((comment) => {
        const commentElement = createCommentElement(comment);
        commentListElement.appendChild(commentElement);
    });
}

/**
 * 개별 댓글 엘리먼트를 생성하는 함수
 * @param {Object} comment - 댓글 객체
 * @returns {HTMLElement} 댓글 엘리먼트
 */
function createCommentElement(comment) {
    // 댓글 컨테이너 생성
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item';

    // 댓글 작성일 포맷팅
    const commentDate = new Date(comment.created_at);
    const formattedDate = commentDate.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    // 댓글 HTML 내용 설정
    commentDiv.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${escapeHtml(comment.author_name)}</span>
            <span class="comment-date">${formattedDate}</span>
        </div>
        <div class="comment-content">${escapeHtml(comment.content)}</div>
        <div class="comment-actions">
            <button class="comment-btn comment-btn-edit" data-comment-id="${comment.id}">수정</button>
            <button class="comment-btn comment-btn-delete" data-comment-id="${comment.id}">삭제</button>
        </div>
    `;

    // 댓글 수정 버튼 클릭 이벤트
    const editBtn = commentDiv.querySelector('.comment-btn-edit');
    editBtn.addEventListener('click', () => {
        editComment(comment.id, comment.content, commentDiv);
    });

    // 댓글 삭제 버튼 클릭 이벤트
    const deleteBtn = commentDiv.querySelector('.comment-btn-delete');
    deleteBtn.addEventListener('click', () => {
        if (confirm('댓글을 삭제하시겠습니까?')) {
            deleteComment(comment.id);
        }
    });

    return commentDiv;
}

/**
 * 댓글을 제출하는 함수
 * @async
 * 중복 요청 방지를 위해 여러 레벨의 방어 메커니즘 사용
 * 1. 전역 플래그 (isSubmittingComment)
 * 2. 시간 기반 중복 제거 (lastSubmitTime)
 * 3. 버튼 비활성화
 */
async function submitComment() {
    // 방지 1: 이미 댓글 작성 중이면 중단
    if (window.boardDetailState.isSubmittingComment) {
        showToast('댓글 작성 중입니다. 잠시만 기다려주세요.', 'warning');
        return;
    }

    // 방지 2: 마지막 제출로부터 0.5초 이내면 무시 (더블 클릭 방지)
    const now = Date.now();
    if (now - window.boardDetailState.lastSubmitTime < 500) {
        console.warn('댓글 작성이 너무 빈번합니다. 요청이 무시되었습니다.');
        return;
    }

    // 댓글 입력 텍스트 영역 가져오기
    const commentInput = document.getElementById('comment-input');
    if (!commentInput) {
        showToast('댓글 입력 필드를 찾을 수 없습니다', 'error');
        return;
    }

    // 댓글 내용 가져오기 (앞뒤 공백 제거)
    const content = commentInput.value.trim();

    // 댓글 내용이 비어있으면 경고
    if (!content) {
        showToast('댓글 내용을 입력해주세요', 'warning');
        commentInput.focus();
        return;
    }

    // 제출 시간 업데이트
    window.boardDetailState.lastSubmitTime = now;

    try {
        // 댓글 작성 중 플래그 설정
        window.boardDetailState.isSubmittingComment = true;

        // 버튼 비활성화
        const btnSubmit = document.getElementById('btn-comment-submit');
        if (btnSubmit) {
            btnSubmit.disabled = true;
        }

        // 댓글 작성자명 입력받기 (UI에서 필요시)
        const authorName = prompt('작성자 이름을 입력해주세요:');

        // 작성자명이 입력되지 않으면 취소
        if (!authorName) {
            window.boardDetailState.isSubmittingComment = false;
            if (btnSubmit) {
                btnSubmit.disabled = false;
            }
            return;
        }

        // API 호출: 댓글 작성
        const response = await fetch(`${API_BASE_URL}/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                author_name: authorName
            })
        });

        // 응답 상태 확인
        if (!response.ok) {
            throw new Error('댓글 작성에 실패했습니다');
        }

        // JSON 응답 파싱
        const result = await response.json();

        // API 응답 확인
        if (!result.success) {
            throw new Error(result.message || '댓글 작성 실패');
        }

        // 댓글 작성 성공 메시지
        showToast('댓글이 작성되었습니다', 'success');

        // 입력 필드 비우기
        commentInput.value = '';

        // 댓글 목록 다시 로드
        loadComments();
    } catch (error) {
        // 에러 로깅 및 사용자에게 알림
        console.error('댓글 작성 에러:', error);
        showToast('댓글 작성 중 오류가 발생했습니다', 'error');
    } finally {
        // 댓글 작성 완료 플래그 해제
        window.boardDetailState.isSubmittingComment = false;

        // 버튼 활성화
        const btnSubmit = document.getElementById('btn-comment-submit');
        if (btnSubmit) {
            btnSubmit.disabled = false;
        }
    }
}

/**
 * 댓글을 수정하는 함수
 * @async
 * @param {number} commentId - 댓글 ID
 * @param {string} currentContent - 현재 댓글 내용
 * @param {HTMLElement} commentElement - 댓글 엘리먼트
 */
async function editComment(commentId, currentContent, commentElement) {
    // 수정할 새로운 내용 입력받기
    const newContent = prompt('수정할 내용을 입력해주세요:', currentContent);

    // 취소되거나 변경이 없으면 리턴
    if (!newContent || newContent.trim() === currentContent.trim()) {
        return;
    }

    try {
        // API 호출: 댓글 수정
        const response = await fetch(`${API_BASE_URL}/${postId}/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: newContent.trim()
            })
        });

        // 응답 상태 확인
        if (!response.ok) {
            throw new Error('댓글 수정에 실패했습니다');
        }

        // JSON 응답 파싱
        const result = await response.json();

        // API 응답 확인
        if (!result.success) {
            throw new Error(result.message || '댓글 수정 실패');
        }

        // 댓글 수정 성공 메시지
        showToast('댓글이 수정되었습니다', 'success');

        // 댓글 목록 다시 로드
        loadComments();
    } catch (error) {
        // 에러 로깅 및 사용자에게 알림
        console.error('댓글 수정 에러:', error);
        showToast('댓글 수정 중 오류가 발생했습니다', 'error');
    }
}

/**
 * 댓글을 삭제하는 함수
 * @async
 * @param {number} commentId - 댓글 ID
 */
async function deleteComment(commentId) {
    try {
        // API 호출: 댓글 삭제
        const response = await fetch(`${API_BASE_URL}/${postId}/comments/${commentId}`, {
            method: 'DELETE'
        });

        // 응답 상태 확인
        if (!response.ok) {
            throw new Error('댓글 삭제에 실패했습니다');
        }

        // JSON 응답 파싱
        const result = await response.json();

        // API 응답 확인
        if (!result.success) {
            throw new Error(result.message || '댓글 삭제 실패');
        }

        // 댓글 삭제 성공 메시지
        showToast('댓글이 삭제되었습니다', 'success');

        // 댓글 목록 다시 로드
        loadComments();
    } catch (error) {
        // 에러 로깅 및 사용자에게 알림
        console.error('댓글 삭제 에러:', error);
        showToast('댓글 삭제 중 오류가 발생했습니다', 'error');
    }
}

/**
 * 게시글을 삭제하는 함수
 * @async
 */
async function deletePost() {
    // 사용자 확인
    if (!confirm('게시글을 삭제하시겠습니까?')) {
        return;
    }

    try {
        // API 호출: 게시글 삭제
        const response = await fetch(`${API_BASE_URL}/${postId}`, {
            method: 'DELETE'
        });

        // 응답 상태 확인
        if (!response.ok) {
            throw new Error('게시글 삭제에 실패했습니다');
        }

        // JSON 응답 파싱
        const result = await response.json();

        // API 응답 확인
        if (!result.success) {
            throw new Error(result.message || '게시글 삭제 실패');
        }

        // 게시글 삭제 성공 메시지
        showToast('게시글이 삭제되었습니다', 'success');

        // 목록으로 이동
        setTimeout(() => {
            window.location.hash = '#index';
        }, 1000);
    } catch (error) {
        // 에러 로깅 및 사용자에게 알림
        console.error('게시글 삭제 에러:', error);
        showToast('게시글 삭제 중 오류가 발생했습니다', 'error');
    }
}

/**
 * HTML 태그 이스케이프 처리 함수
 * XSS 공격 방지를 위해 HTML 특수문자를 엔티티로 변환
 * @param {string} text - 변환할 텍스트
 * @returns {string} 이스케이프 처리된 텍스트
 */
function escapeHtml(text) {
    // 임시 div 요소 생성
    const div = document.createElement('div');

    // 텍스트 내용 설정 (자동으로 이스케이프 처리됨)
    div.textContent = text;

    // 이스케이프 처리된 HTML 반환
    return div.innerHTML;
}

/**
 * 토스트 메시지 표시 함수
 * 화면 오른쪽 아래에 임시 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {string} type - 메시지 타입 (success, error, warning, info)
 * @param {number} duration - 표시 지속 시간 (밀리초)
 */
function showToast(message, type = 'info', duration = 3000) {
    // 토스트 컨테이너가 없으면 생성
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // 토스트 메시지 요소 생성
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;

    // 토스트를 컨테이너에 추가
    container.appendChild(toast);

    // 지정된 시간 후 토스트 제거
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}
