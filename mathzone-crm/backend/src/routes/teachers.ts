import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher } from '../controllers/teacherController';

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRoles(['ADMINISTRATOR', 'RECEPTION', 'ACCOUNTANT']), getTeachers);
router.get('/:id', authorizeRoles(['ADMINISTRATOR', 'RECEPTION', 'ACCOUNTANT']), getTeacher);
router.post('/', authorizeRoles(['ADMINISTRATOR']), createTeacher);
router.put('/:id', authorizeRoles(['ADMINISTRATOR']), updateTeacher);
router.delete('/:id', authorizeRoles(['ADMINISTRATOR']), deleteTeacher);

export default router;
