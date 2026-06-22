import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { getGroups, getGroup, createGroup, updateGroup, deleteGroup } from '../controllers/groupController';

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRoles(['ADMINISTRATOR', 'RECEPTION', 'TEACHER', 'ACCOUNTANT']), getGroups);
router.get('/:id', authorizeRoles(['ADMINISTRATOR', 'RECEPTION', 'TEACHER', 'ACCOUNTANT']), getGroup);
router.post('/', authorizeRoles(['ADMINISTRATOR', 'RECEPTION']), createGroup);
router.put('/:id', authorizeRoles(['ADMINISTRATOR', 'RECEPTION']), updateGroup);
router.delete('/:id', authorizeRoles(['ADMINISTRATOR']), deleteGroup);

export default router;
