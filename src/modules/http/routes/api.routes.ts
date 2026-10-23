import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { categoryController } from '../controllers/category.controller';
import { transactionController } from '../controllers/transaction.controller';

export const apiRouter = Router();

// Usuários
apiRouter.get('/users', (req, res) => userController.list(req, res));

// Categorias
apiRouter.get('/categories', (req, res) => categoryController.list(req, res));

// Transações e Resumos
apiRouter.get('/transactions', (req, res) => transactionController.list(req, res));
apiRouter.get('/summary/:telegramId', (req, res) => transactionController.summary(req, res));
