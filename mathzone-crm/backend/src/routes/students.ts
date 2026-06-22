import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { getStudents, getStudent, createStudent, updateStudent, deleteStudent } from '../controllers/studentController';

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRoles(['ADMINISTRATOR', 'RECEPTION', 'TEACHER', 'ACCOUNTANT']), getStudents);
router.get('/:id', authorizeRoles(['ADMINISTRATOR', 'RECEPTION', 'TEACHER', 'ACCOUNTANT']), getStudent);
router.post('/', authorizeRoles(['ADMINISTRATOR', 'RECEPTION']), createStudent);
router.put('/:id', authorizeRoles(['ADMINISTRATOR', 'RECEPTION']), updateStudent);
router.delete('/:id', authorizeRoles(['ADMINISTRATOR']), deleteStudent);

export default router;