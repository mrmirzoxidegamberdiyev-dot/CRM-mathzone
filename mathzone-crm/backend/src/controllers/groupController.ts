import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

const groupSchema = z.object({
  name: z.string().min(2, 'Guruh nomi kamida 2 belgidan iborat bo\'lishi kerak'),
  teacherId: z.number().int().positive('O\'qituvchi tanlash majburiy'),
  price: z.number().int().positive('Narx musbat bo\'lishi kerak'),
  schedule: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const getGroups = async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId, active } = req.query;
    
    const where: any = {};
    if (teacherId) where.teacherId = parseInt(teacherId as string);
    if (active === 'true') {
      where.endDate = { gte: new Date() };
    }

    const groups = await prisma.group.findMany({
      where,
      include: {
        teacher: true,
        students: {
          where: { status: 'ACTIVE' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

export const getGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const group = await prisma.group.findUnique({
      where: { id: parseInt(id) },
      include: {
        teacher: true,
        students: {
          include: {
            payments: { orderBy: { createdAt: 'desc' }, take: 5 },
            attendances: { orderBy: { date: 'desc' }, take: 10 }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group' });
  }
};

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const data = groupSchema.parse(req.body);

    // Check if group name already exists
    const existing = await prisma.group.findUnique({
      where: { name: data.name }
    });

    if (existing) {
      return res.status(400).json({ error: 'Bu guruh nomi allaqachon mavjud' });
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: data.teacherId }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'O\'qituvchi topilmadi' });
    }

    const group = await prisma.group.create({
      data: {
        name: data.name,
        teacherId: data.teacherId,
        price: data.price,
        schedule: data.schedule,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: { teacher: true }
    });

    await logAudit(req, 'CREATE', 'Group', group.id, null, group);
    res.status(201).json(group);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create group' });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = groupSchema.partial().parse(req.body);

    const oldGroup = await prisma.group.findUnique({
      where: { id: parseInt(id) }
    });

    if (!oldGroup) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    const group = await prisma.group.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { teacher: true, students: true }
    });

    await logAudit(req, 'UPDATE', 'Group', group.id, oldGroup, group);
    res.json(group);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update group' });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id: parseInt(id) },
      include: { students: true }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.students.length > 0) {
      return res.status(400).json({ 
        error: 'Bu guruhda o\'quvchilar mavjud. Avval ularni boshqa guruhga o\'tkazing yoki o\'chiring' 
      });
    }

    await prisma.group.delete({
      where: { id: parseInt(id) }
    });

    await logAudit(req, 'DELETE', 'Group', parseInt(id), group, null);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
};
