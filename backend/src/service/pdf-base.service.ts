import hbs from 'handlebars';
import path from 'path';
import puppeteer, { PDFOptions } from 'puppeteer-core';
import fs from 'fs-extra';

hbs.registerHelper('formatRupiah', (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
});

hbs.registerHelper('statusColorClass', (status: string) => {
    switch (status) {
        case 'SUCCESS': return 'bg-success';
        case 'PAID': return 'bg-success';
        case 'PENDING': return 'bg-pending';
        case 'FAILED': return 'bg-failed';
        case 'CANCELLED': return 'bg-failed';
        default: return 'bg-pending';
    }
});

hbs.registerHelper('rowNumber', (index: number) => {
    return index + 1;
});

export interface PdfHeaderFooter {
    /** Teks kiri header (contoh: nomor dokumen) */
    headerLeft?: string;
    /** Teks kanan header (contoh: nama bisnis — periode) */
    headerRight?: string;
    /** Teks kiri footer (contoh: "BOSS App — Laporan Transaksi") */
    footerLeft?: string;
    /** Tampilkan nomor halaman di footer kanan (default: true) */
    showPageNumber?: boolean;
}

export interface PdfGenerateOptions {
    /** Nama file template .hbs (tanpa path, relatif ke folder templates/) */
    templateName: string;
    /** Data yang akan di-inject ke template Handlebars */
    data: Record<string, any>;
    /** Landscape atau portrait (default: landscape) */
    landscape?: boolean;
    /** Format kertas (default: A4) */
    format?: 'A4' | 'A3' | 'Letter' | 'Legal';
    /** Header & footer konfigurasi */
    headerFooter?: PdfHeaderFooter;
    /** Override margin (dalam mm). Default: { top: 20, right: 15, bottom: 18, left: 15 } */
    margin?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
}

export class PdfBaseService {
    private static readonly DEFAULT_MARGIN = {
        top: 20,
        right: 15,
        bottom: 18,
        left: 15,
    };

    /**
     * Load gambar dari folder public/ dan convert ke base64 data URI
     */
    static async loadImageToBase64(filePath: string): Promise<string> {
        try {
            const fullPath = path.join(process.cwd(), 'public', filePath);
            if (await fs.pathExists(fullPath)) {
                const fileBuffer = await fs.readFile(fullPath);
                const ext = path.extname(filePath).replace('.', '');
                const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
                return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
            }
            return '';
        } catch (error) {
            console.warn(`Gagal load image ${filePath}:`, error);
            return '';
        }
    }

    /**
     * Generate PDF buffer dari template Handlebars + data
     */
    static async generate(options: PdfGenerateOptions): Promise<Buffer> {
        const {
            templateName,
            data,
            landscape = true,
            format = 'A4',
            headerFooter,
            margin: marginOverride,
        } = options;

        let browser;

        try {
            // 1. Baca & compile template
            const templatePath = path.join(process.cwd(), 'templates', templateName);
            const templateHtml = await fs.readFile(templatePath, 'utf-8');

            // Auto-load logo
            const logoBase64 = await this.loadImageToBase64('icons/app-icon-192.png');

            const template = hbs.compile(templateHtml);
            const htmlContent = template({ ...data, logoBase64 });

            // 2. Launch Puppeteer
            browser = await puppeteer.launch({
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ],
            });

            const page = await browser.newPage();

            // 3. Set content (menggunakan networkidle2 agar lebih toleran terhadap koneksi lambat)
            try {
                await page.setContent(htmlContent, {
                    waitUntil: 'networkidle2',
                    timeout: 3000, // 3 detik timeout maksimum
                });
            } catch (setContentError: any) {
                console.warn('Puppeteer setContent timed out or encountered warning, proceeding to PDF generation anyway:', setContentError.message);
            }

            // 4. Build margin
            const m = { ...this.DEFAULT_MARGIN, ...marginOverride };

            // 5. Build PDF options
            const pdfOptions: PDFOptions = {
                format,
                landscape,
                printBackground: true,
                margin: {
                    top: `${m.top}mm`,
                    right: `${m.right}mm`,
                    bottom: `${m.bottom}mm`,
                    left: `${m.left}mm`,
                },
            };

            // 6. Header & footer
            if (headerFooter) {
                pdfOptions.displayHeaderFooter = true;
                pdfOptions.headerTemplate = this.buildHeaderTemplate(headerFooter);
                pdfOptions.footerTemplate = this.buildFooterTemplate(headerFooter);
            }

            // 7. Generate
            const pdfBuffer = await page.pdf(pdfOptions);

            return Buffer.from(pdfBuffer);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            throw new Error('Failed to generate PDF');
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Build header HTML template untuk Puppeteer
     */
    private static buildHeaderTemplate(hf: PdfHeaderFooter): string {
        const left = hf.headerLeft || '';
        const right = hf.headerRight || '';

        return `
            <div style="width: 100%; font-size: 8px; color: #94a3b8; padding: 0 15mm; display: flex; justify-content: space-between; font-family: 'Segoe UI', Arial, sans-serif;">
                <span>${left}</span>
                <span>${right}</span>
            </div>
        `;
    }

    /**
     * Build footer HTML template untuk Puppeteer
     */
    private static buildFooterTemplate(hf: PdfHeaderFooter): string {
        const left = hf.footerLeft || '';
        const showPage = hf.showPageNumber !== false;

        const pageHtml = showPage
            ? `<span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>`
            : '';

        return `
            <div style="width: 100%; font-size: 8px; color: #94a3b8; padding: 0 15mm; display: flex; justify-content: space-between; font-family: 'Courier New', monospace;">
                <span>${left}</span>
                ${pageHtml}
            </div>
        `;
    }
}
