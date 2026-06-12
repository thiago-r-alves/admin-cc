import type express from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends express.Request {
  userData?: {
    userId: string;
    role: 'admin' | 'motorista';
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ message: 'JWT Secret não configurado no servidor.' });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.sendStatus(403);
    }

    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded && 'role' in decoded) {
      req.userData = {
        userId: (decoded as { userId: string }).userId,
        role: (decoded as { role: 'admin' | 'motorista' }).role,
      };
      return next();
    }

    return res.status(403).json({ message: 'Token inválido ou malformado.' });
  });
};

export const isAdmin = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (!req.userData || req.userData.role !== 'admin') {
    return res
      .status(403)
      .json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }
  return next();
};

export const isDriver = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (!req.userData || req.userData.role !== 'motorista') {
    return res
      .status(403)
      .json({ message: 'Acesso negado. Apenas motoristas podem realizar esta ação.' });
  }
  return next();
};
