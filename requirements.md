# 비회원 게시판 기능명세

## 기능명세

1. **게시판 목록 및 상세 페이지**: 사용자가 게시글 목록을 조회하고 개별 게시글을 클릭하여 상세 내용을 확인할 수 있는 페이지 제공
2. **게시글 관리 기능**: app.js에서 게시글 CRUD(생성, 조회, 수정, 삭제) 작업을 기존 API 엔드포인트(/api/posts, /api/posts/:id)와 연동하여 처리
3. **댓글 시스템**: 상세보기 페이지에서 댓글 조회, 작성, 수정, 삭제 기능을 구현하고 /api/posts/:postId/comments API를 통해 관리

## 구현 범위

- **페이지**: board-index.html(목록), board-detail.html(상세), board-write.html(작성), board-edit.html(수정)
- **스크립트**: app.js에서 DOM 조작 및 API 통신 로직 구현
- **스타일**: CSS 파일을 style 폴더에 구성 (flex 기반)
- **데이터**: 기존 api-server.js의 API 엔드포인트 활용

## 기술 요구사항

- 영상, 사진 미포함
- 비회원 게시판(회원가입/로그인 불필요)
- 기존 api-server.js와 API 엔드포인트 활용
