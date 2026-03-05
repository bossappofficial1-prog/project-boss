'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/useI18n';
import { PaymentService } from '@/services/paymentService';
import { AlertCircle, CheckCircle, FileText, Loader2, UploadCloud, X } from 'lucide-react';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type ManualPaymentUploadProps = {
    orderId: string;
    expiryTime?: string;
    onSuccess?: () => void;
};

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function ManualPaymentUpload({ orderId, expiryTime, onSuccess }: ManualPaymentUploadProps) {
    const t = useTranslations('paymentDetail');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isExpired = Boolean(expiryTime && new Date(expiryTime.replace(' ', 'T')).getTime() < Date.now());

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setSelectedFile(null);
            setPreview(null);
            setStatus('error');
            setErrorMessage(t('manualUpload.fileTooLarge'));
            return;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            setSelectedFile(null);
            setPreview(null);
            setStatus('error');
            setErrorMessage(t('manualUpload.invalidType'));
            return;
        }

        setSelectedFile(file);
        setStatus('idle');
        setErrorMessage(null);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreview(null);
        setStatus('idle');
        setErrorMessage(null);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setStatus('uploading');
        setErrorMessage(null);

        try {
            await PaymentService.uploadManualPaymentProof(orderId, selectedFile);
            setStatus('success');
            setSelectedFile(null);
            setPreview(null);
            onSuccess?.();
        } catch (error) {
            console.error('Failed to upload manual payment proof:', error);
            setStatus('error');
            const message = error instanceof Error ? error.message : t('manualUpload.error');
            setErrorMessage(message || t('manualUpload.error'));
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t('manualUpload.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('manualUpload.description')}</p>
                <p className="text-xs text-muted-foreground">{t('manualUpload.hint')}</p>

                {isExpired && (
                    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{t('manualUpload.expired')}</span>
                    </div>
                )}

                {!selectedFile && !isExpired && (
                    <Input
                        type="file"
                        accept="image/*"
                        disabled={status === 'uploading'}
                        onChange={handleFileChange}
                    />
                )}

                {selectedFile && (
                    <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
                        <div className="h-14 w-14 flex items-center justify-center rounded-md bg-background">
                            {preview ? (
                                <img src={preview} alt={selectedFile.name} className="h-full w-full rounded-md object-cover" />
                            ) : (
                                <FileText className="h-6 w-6 text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium truncate">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleRemoveFile}
                            disabled={status === 'uploading'}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {errorMessage && (
                    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {status === 'success' && !errorMessage && (
                    <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>{t('manualUpload.success')}</span>
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        className="gap-2"
                        onClick={handleUpload}
                        disabled={!selectedFile || status === 'uploading' || isExpired}
                    >
                        {status !== 'uploading'
                            ? <UploadCloud className={`h-4 w-4`} />
                            : <Loader2 className='h-4 w-4 animate-spin' />}
                        {status === 'uploading' ? t('manualUpload.uploading') : t('manualUpload.uploadButton')}
                    </Button>
                    {selectedFile && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleRemoveFile}
                            disabled={status === 'uploading'}
                        >
                            {t('manualUpload.removeFile')}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
