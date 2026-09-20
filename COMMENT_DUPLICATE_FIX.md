# 댓글 중복 작성 버그 상세 수정 보고서

## 문제 분석

### 증상
- 댓글 작성 "완료" 버튼을 클릭했을 때 **같은 댓글이 2번 이상 생성**됨
- 데이터베이스에도 중복으로 저장됨
- 사용자가 한 번만 클릭해도 여러 건의 요청이 전송됨

### 근본 원인

#### 원인 1: 이벤트 리스너 중복 등록
```javascript
// 문제있는 코드
function initBoardDetail(id) {
    const btnCommentSubmit = document.getElementById('btn-comment-submit');
    if (btnCommentSubmit) {
        btnCommentSubmit.addEventListener('click', submitComment); // 계속 추가됨
    }
}
```

- `initBoardDetail()` 함수가 페이지 로드/업데이트될 때마다 호출됨
- 매번 같은 버튼에 새로운 이벤트 리스너가 추가됨
- 이전 리스너는 제거되지 않음 → **누적됨**

#### 원인 2: 동시성 문제 (Race Condition)
- 버튼을 빠르게 여러 번 클릭하면 비동기 요청이 모두 실행됨
- 첫 번째 요청이 완료되기 전에 두 번째 클릭이 가능함

---

## 해결 방법

### 1단계: 이벤트 리스너 추적 및 제거

**변경 전:**
```javascript
function initBoardDetail(id) {
    const btnCommentSubmit = document.getElementById('btn-comment-submit');
    if (btnCommentSubmit) {
        btnCommentSubmit.addEventListener('click', submitComment);
    }
}
```

**변경 후:**
```javascript
// 리스너 참조 저장
let commentSubmitListener = null;

function attachCommentEventListeners() {
    const btnCommentSubmit = document.getElementById('btn-comment-submit');
    
    // 기존 리스너 제거
    if (btnCommentSubmit && commentSubmitListener) {
        btnCommentSubmit.removeEventListener('click', commentSubmitListener);
    }
    
    // 새 리스너 등록
    if (btnCommentSubmit) {
        commentSubmitListener = submitComment;
        btnCommentSubmit.addEventListener('click', commentSubmitListener);
    }
}
```

**효과:**
- 리스너의 참조를 저장하여 나중에 정확하게 제거 가능
- `removeEventListener()`는 동일한 함수 참조를 필요로 함
- 클로저 문제를 피하기 위해 리스너를 변수에 저장

### 2단계: 동시 요청 방지 플래그

**변경 전:**
```javascript
async function submitComment() {
    // 요청 전송
    const response = await fetch(...);
}
```

**변경 후:**
```javascript
let isSubmittingComment = false;

async function submitComment() {
    // 이미 작성 중이면 중단
    if (isSubmittingComment) {
        showToast('댓글 작성 중입니다. 잠시만 기다려주세요.', 'warning');
        return;
    }

    try {
        isSubmittingComment = true;  // 시작
        
        // 댓글 작성 로직...
        
    } finally {
        isSubmittingComment = false;  // 완료
    }
}
```

**효과:**
- 첫 번째 요청이 진행 중일 때 추가 클릭을 무시
- 비동기 작업 중에도 안전함
- `finally` 블록으로 에러 발생 시에도 플래그 해제

---

## 수정된 코드 구조

### 전역 변수 (중복 방지 플래그)
```javascript
// 댓글 작성 중복 방지 플래그
let isSubmittingComment = false;

// 이벤트 리스너 참조 저장 (정확한 제거를 위해)
let commentSubmitListener = null;
let editButtonListener = null;
let deleteButtonListener = null;
```

### 초기화 함수
```javascript
function initBoardDetail(id) {
    postId = id;
    loadPost();
    loadComments();
    
    // 이벤트 리스너 등록 (중복 제거 로직 포함)
    attachCommentEventListeners();
}
```

### 이벤트 리스너 등록 함수
```javascript
function attachCommentEventListeners() {
    // 1. 기존 리스너 제거
    // 2. 새 리스너 등록
}
```

### 댓글 작성 함수
```javascript
async function submitComment() {
    // 1. 중복 요청 체크
    if (isSubmittingComment) return;
    
    // 2. 입력 검증
    // 3. 플래그 설정
    isSubmittingComment = true;
    
    // 4. API 호출
    // 5. 응답 처리
    // 6. 플래그 해제
}
```

---

## 테스트 시나리오

### ✅ 테스트 1: 일반적인 댓글 작성
1. 게시글 상세보기 페이지 접속
2. 댓글 입력칸에 텍스트 입력
3. "등록" 버튼 클릭
4. **예상 결과:** 댓글 1개만 생성됨

### ✅ 테스트 2: 빠른 연속 클릭
1. 댓글 입력
2. "등록" 버튼을 빠르게 여러 번 클릭
3. **예상 결과:** 첫 번째 클릭만 처리되고 나머지는 무시됨
4. **경고 메시지:** "댓글 작성 중입니다. 잠시만 기다려주세요."

### ✅ 테스트 3: 페이지 새로고침 후 댓글 작성
1. 댓글 작성 후 F5로 페이지 새로고침
2. 다시 댓글 작성
3. **예상 결과:** 새 댓글이 정상적으로 1개만 생성됨

### ✅ 테스트 4: 네트워크 지연 시나리오
1. 브라우저 DevTools → Network에서 속도 낮춤
2. 댓글 입력 후 "등록" 클릭
3. 요청이 진행 중일 때 버튼 다시 클릭
4. **예상 결과:** 두 번째 클릭은 무시되고 경고 메시지 표시

---

## 파일 변경 사항

### `js/board-detail.js`
**추가된 코드:**
```javascript
// 라인 10-17: 전역 변수 추가
let isSubmittingComment = false;
let commentSubmitListener = null;
let editButtonListener = null;
let deleteButtonListener = null;

// 라인 36-65: attachCommentEventListeners() 함수 추가
function attachCommentEventListeners() { ... }

// 라인 278-348: submitComment() 함수 수정
async function submitComment() { ... }
```

**삭제된 코드:**
- `replaceWith(cloneNode(true))` 방식 제거
- 이전의 비효율적인 중복 제거 로직

---

## 성능 영향

### 긍정적 영향
- ✅ 불필요한 API 요청 제거 → 서버 부하 감소
- ✅ 데이터베이스 중복 저장 방지 → 데이터 무결성 보장
- ✅ 사용자 경험 개선 (빠른 연속 클릭 시 안내 메시지)

### 성능 오버헤드
- ✅ 무시할 수 있는 수준 (단순 플래그 체크)

---

## 권장사항

### 1. 추가 개선사항
```javascript
// 버튼 비활성화로 더욱 명확한 피드백 제공
async function submitComment() {
    const btn = document.getElementById('btn-comment-submit');
    
    try {
        isSubmittingComment = true;
        btn.disabled = true;  // UI 피드백
        
        // 작성 로직...
    } finally {
        isSubmittingComment = false;
        btn.disabled = false;  // 복구
    }
}
```

### 2. 다른 페이지에도 적용
- `board-write.js`: 게시글 작성 중복 방지
- `board-index.js`: 검색/필터 요청 중복 방지

### 3. 타임아웃 추가
```javascript
// 일정 시간 후 자동 해제 (네트워크 에러 대비)
async function submitComment() {
    isSubmittingComment = true;
    
    const timeout = setTimeout(() => {
        isSubmittingComment = false;
    }, 10000);  // 10초
    
    try {
        // ...
    } finally {
        clearTimeout(timeout);
        isSubmittingComment = false;
    }
}
```

---

## 결론

**문제:** 이벤트 리스너 중복 등록 + 동시성 문제

**해결:**
1. 리스너 참조 저장 후 정확하게 제거
2. 진행 중 플래그로 동시 요청 방지
3. `finally` 블록으로 안전성 보장

**결과:** 댓글이 정확히 1번만 생성되며, 빠른 클릭에도 안전함

---

## 추가 참고

### 왜 replaceWith(cloneNode(true))는 충분하지 않았나?
```javascript
// 이전 방식의 문제
btnCommentSubmit.replaceWith(btnCommentSubmit.cloneNode(true));

// 1. 성능: DOM 요소를 완전히 재구성
// 2. 속성 손실: data-* 속성 등이 복사되지 않을 수 있음
// 3. 다른 리스너: 다른 곳에서 등록한 리스너는 제거 안 됨
// 4. 복잡성: 불필요한 DOM 조작
```

### removeEventListener()의 중요성
```javascript
// ❌ 작동하지 않음 (다른 함수 객체)
btn.addEventListener('click', function() { ... });
btn.removeEventListener('click', function() { ... });

// ✅ 작동함 (같은 함수 참조)
const handler = function() { ... };
btn.addEventListener('click', handler);
btn.removeEventListener('click', handler);
```
