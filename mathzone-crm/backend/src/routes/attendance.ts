import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { getAttendances, createAttendance, updateAttendance, deleteAttendance } from '../controllers/attendanceController';

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRoles(['ADMINISTRATOR', 'RECEPTION', 'TEACHER']), getAttendances);
router.post('/', authorizeRoles(['ADMINISTRATOR', 'RECEPTION', 'TEACHER']), createAttendance);
router.put('/:id', authorizeRoles(['ADMINISTRATOR', 'RECEPTION', 'TEACHER']), updateAttendance);
router.delete('/:id', authorizeRoles(['ADMINISTRATOR']), deleteAttendance);

export default router;
