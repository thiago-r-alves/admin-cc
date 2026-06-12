import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../../models/User';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await UserModel.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('Erro: JWT_SECRET não está definido nas variáveis de ambiente.');
      return res.status(500).json({ message: 'Erro de configuração interna do servidor.' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    return res.json({
      token,
      role: user.role,
      expiresIn: 30 * 24 * 60 * 60,
    });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});
