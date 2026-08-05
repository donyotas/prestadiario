import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: number;
  rol: 'ADMIN' | 'COBRADOR';
  nombre: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está configurado');
  }
  return secret;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthUser;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function requireRole(...roles: AuthUser['rol'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    next();
  };
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, getJwtSecret(), { expiresIn: '12h' });
}
