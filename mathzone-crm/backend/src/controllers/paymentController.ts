import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

const paymentSchema = z.object({
  studentId: z.number().int().positive('Talaba tanlash majburiy'),
  amount: z.number().int().positive('Summa musbat bo\'lishi kerak'),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CLICK', 'PAYME', 'UZUM']),
  comment: z.string().optional().nullable(),
});

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, startDate, endDate, method } = req.query;
    
    const where: any = {};
    if (studentId) where.studentId = parseInt(studentId as string);
    if (method) where.method = method;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          include: { group: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const getPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: {
        student: {
          include: { group: true }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const data = paymentSchema.parse(req.body);

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Talaba topilmadi' });
    }

    // Create payment and update student balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          studentId: data.studentId,
          amount: data.amount,
          method: data.method,
          comment: data.comment,
        },
        include: { student: true }
      });

      // Update student balance
      await tx.student.update({
        where: { id: data.studentId },
        data: {
          balance: {
            increment: data.amount
          }
        }
      });

      return payment;
    });

    await logAudit(req, 'CREATE', 'Payment', result.id, null, result);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

export const deletePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Delete payment and update student balance in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: { id: parseInt(id) }
      });

      // Reverse the balance
      await tx.student.update({
        where: { id: payment.studentId },
        data: {
          balance: {
            decrement: payment.amount
          }
        }
      });
    });

    await logAudit(req, 'DELETE', 'Payment', parseInt(id), payment, null);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};
