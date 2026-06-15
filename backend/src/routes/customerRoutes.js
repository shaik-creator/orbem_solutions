const express = require('express');
const {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.route('/').get(listCustomers).post(createCustomer);
router
  .route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(requireRoles('Admin / Owner', 'Operations Staff'), deleteCustomer);

module.exports = router;
