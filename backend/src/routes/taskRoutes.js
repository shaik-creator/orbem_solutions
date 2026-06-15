const express = require('express');
const { listTasks, createTask, updateTask, deleteTask, updateTaskStatus } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.route('/').get(listTasks).post(createTask);
router.route('/:id').put(updateTask).delete(deleteTask);
router.put('/:id/status', updateTaskStatus);

module.exports = router;
