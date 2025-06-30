import { body, param, ValidationChain } from "express-validator";

export const validateCreateProductForOutlet: ValidationChain[] = [
    param('outletId').isUUID().withMessage('Outlet ID must be a valid UUID'),
    body('name').notEmpty().withMessage('Product name is required').trim().escape(),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('type').isIn(['GOODS', 'SERVICE']).withMessage('Invalid product type. Must be GOODS or SERVICE.'),
    body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer for GOODS type.'),
    body('unit').optional().isString().trim().escape(),
    body('description').optional().isString().trim().escape(),
];

export const validateUpdateProductForOutlet = [
    param('outletId').isUUID().withMessage('Outlet ID must be a valid UUID'),
    param('productId').isUUID().withMessage('Product ID must be a valid UUID'),
    body('name').optional()
        .notEmpty().withMessage('Product name is required').trim().escape(),
    body('price').optional()
        .isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('type').optional()
        .isIn(['GOODS', 'SERVICE']).withMessage('Invalid product type. Must be GOODS or SERVICE.'),
    body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer for GOODS type.'),
    body('unit').optional().isString().trim().escape(),
    body('description').optional().isString().trim().escape(),
]