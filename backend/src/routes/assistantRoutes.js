const express = require('express');
const { chat, history } = require('../controllers/assistantController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/chat', chat);
router.get('/history', history);

module.exports = router;
