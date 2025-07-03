/**
 * Menghasilkan template HTML untuk email verifikasi OTP.
 * @param {string} otp - Kode OTP yang akan ditampilkan.
 * @returns {string} String HTML yang sudah jadi.
 */
export const getOtpEmailTemplate = (otp: string): string => {
    return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kode Verifikasi Anda</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { color: #0D1B2A; }
            .content { text-align: center; }
            .content p { font-size: 16px; }
            .otp-code {
                display: inline-block;
                font-size: 36px;
                font-weight: bold;
                color: #E07A5F;
                letter-spacing: 8px;
                margin: 20px 0;
                padding: 10px 20px;
                border: 2px dashed #E07A5F;
                border-radius: 8px;
            }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
        </style>
    </head>
    <body>
        <div div class="container">
        <div class="header">
            <h1>Business One Stop System (BOSS)</h1>
        </div>
        <div class="content">
            <p>Halo,</p>
            <p>Terima kasih telah mendaftar. Gunakan kode di bawah ini untuk memverifikasi alamat email Anda:</p>
            <div class="otp-code">${otp}</div>
            <p>Kode ini akan kedaluwarsa dalam 10 menit.</p>
            <p>Jika Anda tidak merasa mendaftar, mohon abaikan email ini.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BOSS. All rights reserved.</p>
        </div>
        </div>
    </body>
    </html>
    `;
};
