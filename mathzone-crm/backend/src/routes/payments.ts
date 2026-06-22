import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { getPayments, getPayment, createPayment, deletePayment } from '../controllers/paymentController';

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRoles(['ADMINISTRATOR', 'RECEPTION', 'ACCOUNTANT']), getPayments);
router.get('/:id', authorizeRoles(['ADMINISTRATOR', 'RECEPTION', 'ACCOUNTANT']), getPayment);
router.post('/', authorizeRoles(['ADMINISTRATOR', 'RECEPTION', 'ACCOUNTANT']), createPayment);
router.delete('/:id', authorizeRoles(['ADMINISTRATOR', 'ACCOUNTANT']), deletePayment);

export default router;
