import { Router } from 'express';
import { validateSchema } from '../middleware/zod.middleware';
import { createExpenseSchema, updateExpenseSchema } from '../schemas/expense.schema';
import {
    createExpenseController,
    deleteExpenseController,
    getExpensesByOutletController,
    updateExpenseController,
} from '../controller/expense.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', validateSchema(createExpenseSchema), createExpenseController);
router.get('/outlet/:outletId', getExpensesByOutletController);
router.put('/:id', validateSchema(updateExpenseSchema), updateExpenseController);
router.delete('/:id', deleteExpenseController);

export default router;
