import { Router } from 'express';
import { validateSchema } from '../middleware/zod.middleware';
import { createExpenseSchema, updateExpenseSchema } from '../schemas/expense.schema';
import { expenseController } from '../controller/expense.controller';
import { protect } from '../middleware/auth.middleware';
import { uploadSingleImage, handleUploadError } from '../middleware/upload.middleware';

const router = Router();

router.use(protect);

router.post('/', validateSchema(createExpenseSchema), expenseController.create);
router.get('/outlet/:outletId', expenseController.getByOutlet);
router.put('/:id', validateSchema(updateExpenseSchema), expenseController.update);
router.delete('/:id', expenseController.delete);

// AI Receipt Scanner route
router.post(
    '/scan-receipt',
    uploadSingleImage('receipt'),
    handleUploadError,
    expenseController.scanReceipt
);

export default router;
