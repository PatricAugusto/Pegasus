import { Request, Response } from 'express';
import { userService } from '../../users/user.service';

export class UserController {
  async list(_req: Request, res: Response) {
    try {
      const users = await userService.listAllUsers();
      res.json(users);
    } catch {
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  }
}

export const userController = new UserController();
