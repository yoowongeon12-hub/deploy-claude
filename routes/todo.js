/**
 * Todo 라우터 - Express.js 엔드포인트
 * TodoService를 사용하여 HTTP 요청을 처리합니다.
 * 응답 포맷: { success: boolean, data: any, message: string }
 */

const express = require('express');
const { getTodoService } = require('../services/todoService');

const router = express.Router();
const todoService = getTodoService();

/**
 * @swagger
 * components:
 *   schemas:
 *     Todo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: TODO ID
 *         content:
 *           type: string
 *           description: TODO 내용
 *         completed:
 *           type: boolean
 *           description: 완료 여부
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 생성일시
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 수정일시
 */

/**
 * @swagger
 * /api/todos:
 *   post:
 *     summary: 새 TODO 생성
 *     description: 새로운 할일을 생성합니다.
 *     tags:
 *       - Todos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: TODO 내용
 *     responses:
 *       201:
 *         description: TODO 생성 성공
 *       400:
 *         description: 유효하지 않은 요청
 */
router.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    // 실제 구현에서는 req.user.id나 session에서 memberId 가져오기
    const memberId = req.user?.id || 1; // 예제용

    // todoService의 createTodo 메서드 호출
    const newTodo = await todoService.createTodo(memberId, content);

    res.status(201).json({
      success: true,
      data: newTodo,
      message: '할일이 등록되었습니다',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || '할일 등록 중 오류가 발생했습니다',
    });
  }
});

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: TODO 목록 조회
 *     description: 사용자의 모든 할일을 조회합니다.
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, completed, pending]
 *           default: all
 *         description: 필터 옵션
 *     responses:
 *       200:
 *         description: TODO 목록 조회 성공
 *       500:
 *         description: 서버 오류
 */
router.get('/', async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    // 실제 구현에서는 req.user.id나 session에서 memberId 가져오기
    const memberId = req.user?.id || 1; // 예제용

    // todoService의 getTodosByMember 메서드 호출
    const todos = await todoService.getTodosByMember(memberId, { filter });

    res.json({
      success: true,
      data: todos,
      message: `할일 목록 조회 완료 (총 ${todos.length}개)`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message || '할일 목록 조회 중 오류가 발생했습니다',
    });
  }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   get:
 *     summary: 특정 TODO 조회
 *     description: 특정 할일을 조회합니다.
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TODO ID
 *     responses:
 *       200:
 *         description: TODO 조회 성공
 *       404:
 *         description: TODO를 찾을 수 없음
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // 실제 구현에서는 req.user.id나 session에서 memberId 가져오기
    const memberId = req.user?.id || 1; // 예제용

    // todoService의 getTodoById 메서드 호출
    const todo = await todoService.getTodoById(parseInt(id), memberId);

    res.json({
      success: true,
      data: todo,
      message: '할일 조회 완료',
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      data: null,
      message: error.message || '할일을 찾을 수 없습니다',
    });
  }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   put:
 *     summary: TODO 내용 수정
 *     description: 할일의 내용을 수정합니다.
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TODO ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 수정할 TODO 내용
 *     responses:
 *       200:
 *         description: TODO 수정 성공
 *       400:
 *         description: 유효하지 않은 요청
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    // 실제 구현에서는 req.user.id나 session에서 memberId 가져오기
    const memberId = req.user?.id || 1; // 예제용

    // todoService의 updateTodoContent 메서드 호출
    const updatedTodo = await todoService.updateTodoContent(
      parseInt(id),
      memberId,
      content
    );

    res.json({
      success: true,
      data: updatedTodo,
      message: '할일이 수정되었습니다',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || '할일 수정 중 오류가 발생했습니다',
    });
  }
});

/**
 * @swagger
 * /api/todos/{id}/toggle:
 *   patch:
 *     summary: TODO 완료 상태 토글
 *     description: 할일의 완료 상태를 전환합니다.
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TODO ID
 *     responses:
 *       200:
 *         description: 상태 변경 성공
 *       400:
 *         description: 상태 변경 실패
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    // 실제 구현에서는 req.user.id나 session에서 memberId 가져오기
    const memberId = req.user?.id || 1; // 예제용

    // todoService의 toggleTodoCompletion 메서드 호출
    const updatedTodo = await todoService.toggleTodoCompletion(
      parseInt(id),
      memberId
    );

    res.json({
      success: true,
      data: updatedTodo,
      message: updatedTodo.completed ? '할일이 완료되었습니다' : '할일이 미완료로 변경되었습니다',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || '상태 변경 중 오류가 발생했습니다',
    });
  }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   delete:
 *     summary: TODO 삭제
 *     description: 할일을 삭제합니다.
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TODO ID
 *     responses:
 *       200:
 *         description: TODO 삭제 성공
 *       404:
 *         description: TODO를 찾을 수 없음
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // 실제 구현에서는 req.user.id나 session에서 memberId 가져오기
    const memberId = req.user?.id || 1; // 예제용

    // todoService의 deleteTodo 메서드 호출
    const deletedTodo = await todoService.deleteTodo(parseInt(id), memberId);

    res.json({
      success: true,
      data: deletedTodo,
      message: '할일이 삭제되었습니다',
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      data: null,
      message: error.message || '할일을 찾을 수 없습니다',
    });
  }
});

/**
 * @swagger
 * /api/todos/stats/summary:
 *   get:
 *     summary: TODO 통계 조회
 *     description: 할일의 통계 정보를 조회합니다 (전체, 완료, 미완료).
 *     tags:
 *       - Todos
 *     responses:
 *       200:
 *         description: 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     completed:
 *                       type: integer
 *                     pending:
 *                       type: integer
 *       500:
 *         description: 서버 오류
 */
router.get('/stats/summary', async (req, res) => {
  try {
    // 실제 구현에서는 req.user.id나 session에서 memberId 가져오기
    const memberId = req.user?.id || 1; // 예제용

    // todoService의 getTodoStats 메서드 호출
    const stats = await todoService.getTodoStats(memberId);

    res.json({
      success: true,
      data: stats,
      message: '할일 통계 조회 완료',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error.message || '통계 조회 중 오류가 발생했습니다',
    });
  }
});

module.exports = router;
