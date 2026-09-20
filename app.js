


/**
 * ============================================================
 * 프론트엔드 메인 진입점
 * 게시판 SPA(Single Page Application) 라우팅 관리
 * ============================================================
 */

/**
 * SPA 라우터 클래스
 * 페이지 간 네비게이션을 관리하고 URL 상태를 유지
 */
class AppRouter {
    // 생성자: 라우터 초기화
    constructor() {
        // 현재 페이지 추적
        this.currentPage = null;
        // API 서버 기본 URL
        this.apiUrl = 'http://localhost:3000/api';
        // 초기화 수행
        this.init();
    }

    /**
     * 라우터 초기화
     * - 페이지 로드 시 URL 기반 페이지 표시
     * - 뒤로/앞으로 버튼 이벤트 처리
     */
    init() {
        // 페이지 로드 시 현재 URL에 해당하는 페이지 표시
        this.handleRouteChange();

        // 브라우저 뒤로/앞으로 버튼 클릭 시 라우트 변경
        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });
    }

    /**
     * URL 변경 처리
     * 현재 URL의 해시(#)를 읽어서 해당 페이지 표시
     */
    handleRouteChange() {
        // URL의 해시값 추출 (예: #detail/1 -> detail/1)
        const hash = window.location.hash.slice(1) || '';
        // 해시가 비어있으면 기본값 설정
        const page = hash ? hash.split('/')[0] : 'index';
        // 해시의 파라미터 부분 추출
        const [, ...params] = hash.split('/');

        // 페이지 종류에 따라 해당 로직 실행
        switch (page) {
            // 게시판 목록 페이지
            case 'index':
                this.showIndex();
                break;
            // 게시글 상세보기 페이지
            case 'detail':
                this.showDetail(params[0]);
                break;
            // 게시글 작성 페이지
            case 'write':
                this.showWrite();
                break;
            // 게시글 수정 페이지
            case 'edit':
                this.showEdit(params[0]);
                break;
            // 기본값: 목록 페이지로 이동
            default:
                // 유효하지 않은 페이지는 목록으로 리다이렉트
                this.showIndex();
        }
    }

    /**
     * 게시판 목록 페이지 표시
     * - 게시글 목록 로드
     * - 페이지네이션 설정
     */
    async showIndex() {
        // 현재 페이지 상태 업데이트
        this.currentPage = 'index';

        // HTML 문서에서 메인 컨테이너 요소 선택
        const mainContainer = document.getElementById('app-container');

        // 게시판 목록 HTML 마크업 구성
        mainContainer.innerHTML = `
            <!-- 헤더: 제목과 글쓰기 버튼 -->
            <div class="container">
                <header class="header">
                    <h1>게시판</h1>
                    <a href="#write" class="btn-write">글쓰기</a>
                </header>

                <!-- 게시글 목록 테이블 -->
                <div class="board-list">
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="col-number">번호</th>
                                <th class="col-title">제목</th>
                                <th class="col-author">작성자</th>
                                <th class="col-date">작성일</th>
                                <th class="col-views">조회</th>
                            </tr>
                        </thead>
                        <tbody id="post-list">
                            <!-- 동적으로 생성될 게시글 목록 -->
                        </tbody>
                    </table>
                </div>

                <!-- 페이지네이션: 이전/다음 버튼과 페이지 번호 -->
                <div class="pagination">
                    <button class="btn-prev" id="btn-prev">이전</button>
                    <div class="page-numbers" id="page-numbers"></div>
                    <button class="btn-next" id="btn-next">다음</button>
                </div>
            </div>
        `;

        // 동적 CSS 로드 (스타일 적용)
        this.loadStyleSheet('style/board-index.css');

        // 동적 스크립트 로드 및 실행
        this.loadScript('js/board-index.js', () => {
            // board-index.js의 초기화 함수 호출
            if (window.initBoardIndex) {
                window.initBoardIndex();
            }
        });
    }

    /**
     * 게시글 상세보기 페이지 표시
     * @param {number} postId - 표시할 게시글의 ID
     */
    async showDetail(postId) {
        // 현재 페이지 상태 업데이트
        this.currentPage = 'detail';

        // HTML 문서에서 메인 컨테이너 요소 선택
        const mainContainer = document.getElementById('app-container');

        // 게시글 상세보기 HTML 마크업 구성
        mainContainer.innerHTML = `
            <!-- 헤더: 뒤로가기와 제목 -->
            <div class="container">
                <header class="header">
                    <a href="#index" class="btn-back">← 목록</a>
                    <h1>게시글 상세보기</h1>
                </header>

                <!-- 게시글 상세 내용 -->
                <article class="post-detail">
                    <!-- 게시글 헤더: 제목, 작성자, 작성일, 조회수 -->
                    <div class="post-header">
                        <h2 id="post-title" class="post-title"></h2>
                        <div class="post-meta">
                            <span id="post-author" class="post-author"></span>
                            <span id="post-date" class="post-date"></span>
                            <span id="post-views" class="post-views"></span>
                        </div>
                    </div>

                    <!-- 게시글 본문 내용 -->
                    <div class="post-content" id="post-content"></div>

                    <!-- 게시글 액션 버튼: 수정, 삭제 -->
                    <div class="post-actions">
                        <a href="#" id="btn-edit" class="btn btn-primary">수정</a>
                        <button id="btn-delete" class="btn btn-danger">삭제</button>
                    </div>
                </article>

                <!-- 댓글 섹션 -->
                <section class="comments-section">
                    <!-- 댓글 개수 표시 -->
                    <h3>댓글 (<span id="comment-count">0</span>)</h3>

                    <!-- 댓글 입력 폼 -->
                    <div class="comment-form">
                        <textarea id="comment-input" class="comment-input" placeholder="댓글을 입력하세요..."></textarea>
                        <button id="btn-comment-submit" class="btn btn-primary">등록</button>
                    </div>

                    <!-- 댓글 목록 -->
                    <div class="comment-list" id="comment-list">
                        <!-- 동적으로 생성될 댓글 목록 -->
                    </div>
                </section>
            </div>
        `;

        // 동적 CSS 로드 (스타일 적용)
        this.loadStyleSheet('style/board-detail.css');

        // 동적 스크립트 로드 및 실행
        this.loadScript('js/board-detail.js', () => {
            // board-detail.js의 초기화 함수 호출
            if (window.initBoardDetail) {
                window.initBoardDetail(postId);
            }
        });
    }

    /**
     * 게시글 작성 페이지 표시
     */
    async showWrite() {
        // 현재 페이지 상태 업데이트
        this.currentPage = 'write';

        // HTML 문서에서 메인 컨테이너 요소 선택
        const mainContainer = document.getElementById('app-container');

        // 게시글 작성 HTML 마크업 구성
        mainContainer.innerHTML = `
            <!-- 메인 컨테이너 -->
            <div class="container">
                <!-- 헤더: 제목 -->
                <header class="header">
                    <h1>게시글 작성</h1>
                </header>

                <!-- 게시글 작성 폼 -->
                <div class="form-container">
                    <!-- 제목 입력 필드 -->
                    <div class="form-group">
                        <label for="post-title">제목</label>
                        <input type="text" id="post-title" placeholder="제목을 입력하세요 (1~200자)">
                    </div>

                    <!-- 내용 입력 필드 -->
                    <div class="form-group">
                        <label for="post-content">내용</label>
                        <textarea id="post-content" placeholder="내용을 입력하세요 (1~10000자)"></textarea>
                    </div>

                    <!-- 작성자명 입력 필드 -->
                    <div class="form-group">
                        <label for="post-author">작성자명</label>
                        <input type="text" id="post-author" placeholder="작성자명을 입력하세요">
                    </div>

                    <!-- 폼 액션 버튼: 저장, 취소 -->
                    <div class="form-actions">
                        <button id="btn-save" class="btn btn-primary">저장</button>
                        <button id="btn-cancel" class="btn btn-secondary">취소</button>
                    </div>
                </div>
            </div>
        `;

        // 동적 CSS 로드 (스타일 적용)
        this.loadStyleSheet('style/board-write.css');

        // 동적 스크립트 로드 및 실행
        this.loadScript('js/board-write.js', () => {
            // board-write.js의 초기화 함수 호출
            if (window.initBoardWrite) {
                window.initBoardWrite();
            }
        });
    }

    /**
     * 게시글 수정 페이지 표시
     * @param {number} postId - 수정할 게시글의 ID
     */
    async showEdit(postId) {
        // 현재 페이지 상태 업데이트
        this.currentPage = 'edit';

        // HTML 문서에서 메인 컨테이너 요소 선택
        const mainContainer = document.getElementById('app-container');

        // 게시글 수정 HTML 마크업 구성
        mainContainer.innerHTML = `
            <!-- 메인 컨테이너 -->
            <div class="container">
                <!-- 헤더: 제목 -->
                <header class="header">
                    <h1>게시글 수정</h1>
                </header>

                <!-- 게시글 수정 폼 -->
                <div class="form-container">
                    <!-- 제목 입력 필드 -->
                    <div class="form-group">
                        <label for="post-title">제목</label>
                        <input type="text" id="post-title" placeholder="제목을 입력하세요 (1~200자)">
                    </div>

                    <!-- 내용 입력 필드 -->
                    <div class="form-group">
                        <label for="post-content">내용</label>
                        <textarea id="post-content" placeholder="내용을 입력하세요 (1~10000자)"></textarea>
                    </div>

                    <!-- 작성자명 입력 필드 -->
                    <div class="form-group">
                        <label for="post-author">작성자명</label>
                        <input type="text" id="post-author" placeholder="작성자명을 입력하세요">
                    </div>

                    <!-- 폼 액션 버튼: 저장, 취소 -->
                    <div class="form-actions">
                        <button id="btn-save" class="btn btn-primary">저장</button>
                        <button id="btn-cancel" class="btn btn-secondary">취소</button>
                    </div>
                </div>
            </div>
        `;

        // 동적 CSS 로드 (스타일 적용)
        this.loadStyleSheet('style/board-write.css');

        // 동적 스크립트 로드 및 실행
        this.loadScript('js/board-write.js', () => {
            // board-write.js의 초기화 함수 호출 (수정 모드)
            if (window.initBoardWrite) {
                window.initBoardWrite(postId);
            }
        });
    }

    /**
     * CSS 파일을 동적으로 로드
     * @param {string} href - CSS 파일 경로
     */
    loadStyleSheet(href) {
        // 이미 로드된 CSS 파일 확인
        const existingLink = document.querySelector(`link[href="${href}"]`);
        // 이미 로드되었으면 새로 로드하지 않음
        if (existingLink) {
            return;
        }

        // 새로운 <link> 요소 생성
        const link = document.createElement('link');
        // CSS 파일 타입 설정
        link.rel = 'stylesheet';
        // CSS 파일 경로 설정
        link.href = href;
        // 문서 헤드에 추가
        document.head.appendChild(link);
    }

    /**
     * 자바스크립트 파일을 동적으로 로드
     * @param {string} src - JS 파일 경로
     * @param {function} callback - 로드 완료 후 실행할 콜백 함수
     */
    loadScript(src, callback) {
        // 이미 로드된 스크립트 확인
        const existingScript = document.querySelector(`script[src="${src}"]`);
        // 이미 로드되었으면 새로 로드하지 않음
        if (existingScript) {
            existingScript.remove();
        }

        // 새로운 <script> 요소 생성
        const script = document.createElement('script');
        // JS 파일 경로 설정
        script.src = src;
        // 스크립트 로드 완료 이벤트 처리
        script.onload = () => {
            // 약간의 지연을 주어 스크립트가 완전히 실행되도록 함
            setTimeout(() => {
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }, 50);
        };
        // 스크립트 로드 실패 이벤트 처리
        script.onerror = () => {
            console.error(`Failed to load script: ${src}`);
        };
        // 문서 바디에 추가
        document.body.appendChild(script);
    }
}

/**
 * 페이지 로드 시 앱 라우터 초기화
 * DOM이 모두 로드된 후 실행
 */
// DOMContentLoaded 이벤트가 이미 발생했으면 즉시 
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new AppRouter();
    });
} else {
    // 이미 로드되었으면 즉시 실행
    window.app = new AppRouter();
}
