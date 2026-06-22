import { prisma } from '../utils/db';
import { Request } from 'express';
import logger from './logger';

export const logAudit = async (
  req: Request,
  action: string,
  entityType: string,
  entityId?: number,
  oldData?: any,
  newData?: any
) => {
  try {
    const userId = (req as any).user?.id;
    
    // Skip audit log if no authenticated user (e.g., login endpoint)
    if (!userId) {
      return;
    }
    
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
        ipAddress: req.ip || 'unknown',
      },
    });
  } catch (error) {
    logger.error('Audit log failed', { error, userId, action, entityType, entityId });
  }
};
