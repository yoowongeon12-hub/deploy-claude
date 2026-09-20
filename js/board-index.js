/**
 * ============================================================
 * 게시판 목록 페이지 JavaScript
 * 게시글 목록 조회 및 페이지네이션 기능
 * ============================================================
 */

// API 기본 URL 설정 (let 사용으로 재선언 가능하게 변경)
let API_BASE_URL = 'http://localhost:3000/api/posts';

// 한 페이지에 표시할 게시글 개수
const ITEMS_PER_PAGE = 10;

// 현재 페이지 번호
let currentPage = 1;

// 전체 페이지 수
let totalPages = 1;

/**
 * 게시판 목록 초기화 함수
 * app.js에서 호출됨
 */
function initBoardIndex() {
    // 글쓰기 버튼 클릭 이벤트
    const btnWrite = document.querySelector('.btn-write');
    if (btnWrite) {
        btnWrite.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = '#write';
        });
    }

    // 이전 버튼 클릭 이벤트
    const btnPrev = document.querySelector('.prev-btn');
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadPosts();
                window.scrollTo(0, 0);
            }
        });
    }

    // 다음 버튼 클릭 이벤트
    const btnNext = document.querySelector('.next-btn');
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadPosts();
                window.scrollTo(0, 0);
            }
        });
    }

    // 초기 게시글 로드
    loadPosts();
}

/**
 * 페이지 로드 완료 시 실행되는 초기화 함수 (레거시 지원)
 */
document.addEventListener('DOMContentLoaded', () => {
    // app.js가 없는 경우 직접 초기화
    if (typeof initBoardIndex === 'function') {
        initBoardIndex();
    }
});

/**
 * API에서 게시글 목록을 로드하는 함수
 * @async
 */
async function loadPosts() {
    try {
        // API 호출: 현재 페이지 게시글 목록 조회
        const response = await fetch(`${API_BASE_URL}?page=${currentPage}`);

        // 응답 상태 확인
        if (!response.ok) {
            throw new Error('게시글 목록을 불러올 수 없습니다');
        }

        // JSON 응답 파싱
        const result = await response.json();

        // API 응답 확인
        if (!result.success) {
            throw new Error(result.message || '게시글 목록 조회 실패');
        }

        // 전역 변수에 전체 페이지 수 저장
        totalPages = result.data.totalPages;

        // 게시글 목록 렌더링
        renderPostList(result.data.posts);

        // 페이지네이션 업데이트
        updatePagination();
    } catch (error) {
        // 에러 로깅 및 사용자에게 알림
        console.error('게시글 로드 에러:', error);
        alert('게시글을 불러오는 중 오류가 발생했습니다');

        // 게시글 목록 비우기
        document.getElementById('post-list').innerHTML = '';
    }
}

/**
 * 게시글 목록을 카드 형태로 렌더링하는 함수 (BRIX 스타일)
 * @param {Array} posts - 게시글 배열
 */
function renderPostList(posts) {
    // 게시글을 표시할 그리드 요소 가져오기
    const postListElement = document.getElementById('post-list');
    const noPostsElement = document.getElementById('no-posts');

    // 기존 목록 비우기
    postListElement.innerHTML = '';

    // 게시글 배열이 비어있으면 빈 상태 표시
    if (!posts || posts.length === 0) {
        postListElement.style.display = 'none';
        noPostsElement.style.display = 'grid';
        return;
    }

    postListElement.style.display = 'grid';
    noPostsElement.style.display = 'none';

    // 각 게시글을 카드 요소로 변환
    posts.forEach((post) => {
        // 카드 컨테이너 생성
        const card = document.createElement('div');
        card.className = 'post-card';

        // 작성일 포맷팅 (YYYY-MM-DD)
        const createdDate = new Date(post.created_at);
        const formattedDate = createdDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\. /g, '-');

        // 카테고리 배지 결정
        let categoryBadge = '';
        let categoryLabel = '일반';

        if (post.category === 'notice') {
            categoryBadge = '<span class="badge badge-notice">공지</span>';
            categoryLabel = '공지';
        } else if (post.category === 'qna') {
            categoryBadge = '<span class="badge badge-qna">Q&A</span>';
            categoryLabel = 'Q&A';
        } else if (post.category === 'free') {
            categoryBadge = '<span class="badge badge-free">자유</span>';
            categoryLabel = '자유';
        }

        // 조회수가 많으면 인기 배지 추가
        if (post.view_count > 100) {
            categoryBadge += '<span class="badge badge-popular">⭐ 인기</span>';
        }

        // 게시글 내용 요약 (첫 100자)
        const excerpt = escapeHtml(post.content || '').substring(0, 100);

        // 카드 HTML 내용 설정
        card.innerHTML = `
            <div class="card-header">
                <div class="card-badges">
                    ${categoryBadge}
                </div>
            </div>
            <h3 class="card-title">${escapeHtml(post.title)}</h3>
            ${excerpt ? `<p class="card-excerpt">${excerpt}...</p>` : ''}
            <div class="card-meta">
                <div class="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    ${escapeHtml(post.author_name)}
                </div>
                <div class="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    ${formattedDate}
                </div>
            </div>
            <div class="card-footer">
                <div class="views-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    ${post.view_count}
                </div>
            </div>
        `;

        // 카드 클릭 시 상세보기 페이지로 이동
        card.addEventListener('click', () => {
            window.location.hash = `#detail/${post.id}`;
        });

        // 그리드에 카드 추가
        postListElement.appendChild(card);
    });
}

/**
 * 페이지네이션 버튼 업데이트 함수
 */
function updatePagination() {
    // 이전/다음 버튼 가져오기
    const btnPrev = document.querySelector('.prev-btn');
    const btnNext = document.querySelector('.next-btn');

    // 첫 페이지이면 이전 버튼 비활성화
    btnPrev.disabled = currentPage === 1;

    // 마지막 페이지이면 다음 버튼 비활성화
    btnNext.disabled = currentPage === totalPages;

    // 페이지 번호 버튼들 업데이트
    updatePageNumbers();
}

/**
 * 페이지 번호 버튼들을 동적으로 생성하는 함수
 */
function updatePageNumbers() {
    // 페이지 번호를 표시할 컨테이너 가져오기
    const pageNumbersElement = document.getElementById('page-numbers');

    // 기존 번호 버튼들 비우기
    pageNumbersElement.innerHTML = '';

    // 표시할 페이지 번호의 범위 계산
    // 현재 페이지 주변 5개 페이지만 표시
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    // 시작 페이지가 1이 아닌 경우 첫 페이지 버튼 추가
    if (startPage > 1) {
        const firstBtn = createPageButton(1, 1 === currentPage);
        pageNumbersElement.appendChild(firstBtn);

        // 첫 페이지와 표시 범위 사이에 "..." 표시
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.padding = '6px 8px';
            pageNumbersElement.appendChild(dots);
        }
    }

    // 계산된 범위의 페이지 번호 버튼 생성
    for (let i = startPage; i <= endPage; i++) {
        const btn = createPageButton(i, i === currentPage);
        pageNumbersElement.appendChild(btn);
    }

    // 마지막 페이지가 표시 범위에 포함되지 않은 경우
    if (endPage < totalPages) {
        // 표시 범위와 마지막 페이지 사이에 "..." 표시
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.padding = '6px 8px';
            pageNumbersElement.appendChild(dots);
        }

        // 마지막 페이지 버튼 추가
        const lastBtn = createPageButton(totalPages, totalPages === currentPage);
        pageNumbersElement.appendChild(lastBtn);
    }
}

/**
 * 개별 페이지 번호 버튼을 생성하는 함수
 * @param {number} pageNum - 페이지 번호
 * @param {boolean} isActive - 현재 활성 페이지 여부
 * @returns {HTMLElement} 버튼 요소
 */
function createPageButton(pageNum, isActive) {
    // 버튼 요소 생성
    const btn = document.createElement('button');

    // 버튼 텍스트 설정
    btn.textContent = pageNum;

    // 활성 상태일 때 active 클래스 추가
    if (isActive) {
        btn.classList.add('active');
    }

    // 버튼 클릭 이벤트 처리
    btn.addEventListener('click', () => {
        currentPage = pageNum;
        loadPosts();
        // 페이지 상단으로 스크롤
        window.scrollTo(0, 0);
    });

    return btn;
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
