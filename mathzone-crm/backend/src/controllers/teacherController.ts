import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

const teacherSchema = z.object({
  name: z.string().min(2, 'Ism kamida 2 belgidan iborat bo\'lishi kerak'),
  phone: z.string().regex(/^998[0-9]{9}$/, 'Telefon raqami noto\'g\'ri formatda').optional().nullable(),
  subject: z.string().min(2, 'Fan nomi kamida 2 belgidan iborat bo\'lishi kerak'),
  salaryRate: z.number().int().positive('Ish haqi musbat bo\'lishi kerak').default(1500000),
});

export const getTeachers = async (req: AuthRequest, res: Response) => {
  try {
    const { subject } = req.query;
    
    const where: any = {};
    if (subject) where.subject = { contains: subject as string, mode: 'insensitive' };

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        groups: {
          include: {
            students: { where: { status: 'ACTIVE' } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
};

export const getTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) },
      include: {
        groups: {
          include: {
            students: { where: { status: 'ACTIVE' } }
          }
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
};

export const createTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const data = teacherSchema.parse(req.body);

    const teacher = await prisma.teacher.create({
      data: {
        name: data.name,
        phone: data.phone,
        subject: data.subject,
        salaryRate: data.salaryRate,
      }
    });

    await logAudit(req, 'CREATE', 'Teacher', teacher.id, null, teacher);
    res.status(201).json(teacher);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create teacher' });
  }
};

export const updateTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = teacherSchema.partial().parse(req.body);

    const oldTeacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) }
    });

    if (!oldTeacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacher = await prisma.teacher.update({
      where: { id: parseInt(id) },
      data,
      include: { groups: true }
    });

    await logAudit(req, 'UPDATE', 'Teacher', teacher.id, oldTeacher, teacher);
    res.json(teacher);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update teacher' });
  }
};

export const deleteTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) },
      include: { groups: true }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    if (teacher.groups.length > 0) {
      return res.status(400).json({ 
        error: 'Bu o\'qituvchida guruhlar mavjud. Avval guruhlarni boshqa o\'qituvchiga o\'tkazing yoki o\'chiring' 
      });
    }

    await prisma.teacher.delete({
      where: { id: parseInt(id) }
    });

    await logAudit(req, 'DELETE', 'Teacher', parseInt(id), teacher, null);
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
};
