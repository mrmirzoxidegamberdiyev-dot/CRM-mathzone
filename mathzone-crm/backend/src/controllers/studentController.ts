import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

const studentSchema = z.object({
  name: z.string().min(2, 'Ism kamida 2 belgidan iborat bo\'lishi kerak'),
  phone: z.string().regex(/^998[0-9]{9}$/, 'Telefon raqami noto\'g\'ri formatda'),
  groupId: z.number().int().positive().optional().nullable(),
  balance: z.number().int().default(0),
  status: z.enum(['ACTIVE', 'TRIAL', 'FROZEN', 'GRADUATED', 'ARCHIVED']).optional(),
});

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { status, groupId, search } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (groupId) where.groupId = parseInt(groupId as string);
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: { 
        group: {
          include: { teacher: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

export const getStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: {
        group: { include: { teacher: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        attendances: { orderBy: { date: 'desc' }, take: 20 },
        grades: { orderBy: { createdAt: 'desc' } },
        notes: { where: { done: false }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const data = studentSchema.parse(req.body);
    
    // Check if phone already exists
    const existing = await prisma.student.findUnique({
      where: { phone: data.phone }
    });

    if (existing) {
      return res.status(400).json({ error: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan' });
    }

    const student = await prisma.student.create({
      data: {
        name: data.name,
        phone: data.phone,
        groupId: data.groupId || null,
        balance: data.balance,
        status: data.status || 'ACTIVE',
      },
      include: { group: true }
    });

    await logAudit(req, 'CREATE', 'Student', student.id, null, student);
    res.status(201).json(student);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create student' });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = studentSchema.partial().parse(req.body);

    const oldStudent = await prisma.student.findUnique({
      where: { id: parseInt(id) }
    });

    if (!oldStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = await prisma.student.update({
      where: { id: parseInt(id) },
      data,
      include: { group: true }
    });

    await logAudit(req, 'UPDATE', 'Student', student.id, oldStudent, student);
    res.json(student);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update student' });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await prisma.student.delete({
      where: { id: parseInt(id) }
    });

    await logAudit(req, 'DELETE', 'Student', parseInt(id), student, null);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
};