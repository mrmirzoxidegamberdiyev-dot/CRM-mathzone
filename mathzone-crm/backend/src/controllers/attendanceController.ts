import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

const attendanceSchema = z.object({
  studentId: z.number().int().positive('Talaba tanlash majburiy'),
  groupId: z.number().int().positive().optional().nullable(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Noto\'g\'ri sana formati'),
  status: z.enum(['present', 'absent', 'late', 'excused']),
});

export const getAttendances = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, groupId, startDate, endDate, status } = req.query;
    
    const where: any = {};
    if (studentId) where.studentId = parseInt(studentId as string);
    if (groupId) where.groupId = parseInt(groupId as string);
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: { group: true }
        }
      },
      orderBy: { date: 'desc' },
      take: 200
    });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendances' });
  }
};

export const createAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const data = attendanceSchema.parse(req.body);

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Talaba topilmadi' });
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId: data.studentId,
        groupId: data.groupId,
        date: new Date(data.date),
        status: data.status,
      },
      include: { student: true }
    });

    await logAudit(req, 'CREATE', 'Attendance', attendance.id, null, attendance);
    res.status(201).json(attendance);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create attendance' });
  }
};

export const updateAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = attendanceSchema.partial().parse(req.body);

    const oldAttendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id) }
    });

    if (!oldAttendance) {
      return res.status(404).json({ error: 'Attendance not found' });
    }

    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);

    const attendance = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { student: true }
    });

    await logAudit(req, 'UPDATE', 'Attendance', attendance.id, oldAttendance, attendance);
    res.json(attendance);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

export const deleteAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const attendance = await prisma.attendance.findUnique({
      where: { id: parseInt(id) }
    });

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance not found' });
    }

    await prisma.attendance.delete({
      where: { id: parseInt(id) }
    });

    await logAudit(req, 'DELETE', 'Attendance', parseInt(id), attendance, null);
    res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
};
