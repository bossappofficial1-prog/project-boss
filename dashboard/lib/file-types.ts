import { type DropzoneOptions } from 'react-dropzone'

export const ACCEPTED_FILE_TYPES = {
    EXCEL: {
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    } as DropzoneOptions['accept'],

    PDF: {
        'application/pdf': ['.pdf']
    } as DropzoneOptions['accept'],

    IMAGE: {
        'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    } as DropzoneOptions['accept']
}