import { Request, Response } from 'express';
import { categoryService } from '../../categories/category.service';

export class CategoryController {
  async list(_req: Request, res: Response) {
    try {
      const categories = await categoryService.getCategoriesForUser();
      res.json(categories);
    } catch {
      res.status(500).json({ error: 'Erro ao listar categorias' });
    }
  }
}

export const categoryController = new CategoryController();
