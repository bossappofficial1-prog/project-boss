import { config } from '../config';

export class EmailTemplates {
    static getVerificationEmail(code: string): { subject: string; html: string; text: string } {
        const subject = 'Verifikasi Akun Anda - BOSS App';
        const text = `Kode verifikasi Anda adalah: ${code}`;

        const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Akun - BOSS App</title>
    <style>
        /* Reset and base styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
        }

        /* Base styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f4f4f4;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .email-body {
            padding: 40px 30px;
        }
        .title {
            font-size: 24px;
            color: #1f2937;
            margin: 0 0 20px 0;
            text-align: center;
            font-weight: 600;
        }
        .content {
            color: #374151;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .verification-code {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 3px solid #0ea5e9;
            border-radius: 12px;
            padding: 30px 20px;
            text-align: center;
            margin: 30px 0;
            font-size: 36px;
            font-weight: bold;
            color: #0c4a6e;
            letter-spacing: 6px;
            font-family: 'Courier New', monospace;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .email-footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer-text {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
        }
        .footer-link {
            color: #2563eb;
            text-decoration: none;
        }

        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                border-radius: 0 !important;
            }
            .email-header, .email-body, .email-footer {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }
            .verification-code {
                font-size: 28px !important;
                letter-spacing: 4px !important;
                padding: 20px 15px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1 class="logo">BOSS App</h1>
        </div>

        <div class="email-body">
            <h2 class="title">Verifikasi Akun</h2>

            <div class="content">
                <p>Halo,</p>
                <p>Terima kasih telah mendaftar di BOSS App! Untuk menyelesaikan proses verifikasi akun Anda, gunakan kode verifikasi berikut:</p>

                <div class="verification-code">
                    ${code}
                </div>

                <p>Masukkan kode ini ke aplikasi untuk mengaktifkan akun Anda. Kode ini akan kedaluwarsa dalam 10 menit.</p>

                <p>Jika Anda tidak melakukan pendaftaran ini, abaikan email ini.</p>
            </div>
        </div>

        <div class="email-footer">
            <p class="footer-text">
                Terima kasih telah menggunakan BOSS App<br>
                Jika Anda memiliki pertanyaan, hubungi tim support kami di <a href="mailto:bossappofficial1@gmail.com" class="footer-link">bossappofficial1@gmail.com</a>
            </p>
        </div>
    </div>
</body>
</html>`;

        return { subject, html, text };
    }

    static getResendVerificationEmail(code: string): { subject: string; html: string; text: string } {
        const subject = 'Verifikasi Akun Anda - Kode Baru - BOSS App';
        const text = `Kode verifikasi baru Anda adalah: ${code}`;

        const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode Verifikasi Baru - BOSS App</title>
    <style>
        /* Reset and base styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
        }

        /* Base styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f4f4f4;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .email-body {
            padding: 40px 30px;
        }
        .title {
            font-size: 24px;
            color: #1f2937;
            margin: 0 0 20px 0;
            text-align: center;
            font-weight: 600;
        }
        .content {
            color: #374151;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .verification-code {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 3px solid #0ea5e9;
            border-radius: 12px;
            padding: 30px 20px;
            text-align: center;
            margin: 30px 0;
            font-size: 36px;
            font-weight: bold;
            color: #0c4a6e;
            letter-spacing: 6px;
            font-family: 'Courier New', monospace;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .email-footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer-text {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
        }
        .footer-link {
            color: #2563eb;
            text-decoration: none;
        }

        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                border-radius: 0 !important;
            }
            .email-header, .email-body, .email-footer {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }
            .verification-code {
                font-size: 28px !important;
                letter-spacing: 4px !important;
                padding: 20px 15px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1 class="logo">BOSS App</h1>
        </div>

        <div class="email-body">
            <h2 class="title">Kode Verifikasi Baru</h2>

            <div class="content">
                <p>Halo,</p>
                <p>Berikut adalah kode verifikasi baru untuk akun Anda di BOSS App:</p>

                <div class="verification-code">
                    ${code}
                </div>

                <p>Masukkan kode ini ke aplikasi untuk mengaktifkan akun Anda. Kode ini akan kedaluwarsa dalam 10 menit.</p>

                <p>Jika Anda tidak meminta kode baru ini, abaikan email ini.</p>
            </div>
        </div>

        <div class="email-footer">
            <p class="footer-text">
                Terima kasih telah menggunakan BOSS App<br>
                Jika Anda memiliki pertanyaan, hubungi tim support kami di <a href="mailto:bossappofficial1@gmail.com" class="footer-link">bossappofficial1@gmail.com</a>
            </p>
        </div>
    </div>
</body>
</html>`;

        return { subject, html, text };
    }

    static getForgotPasswordEmail(resetToken: string): { subject: string; html: string; text: string } {
        const subject = 'Reset Password - BOSS App';
        const text = `Klik link berikut untuk reset password: ${config.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
        const resetLink = `${config.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

        const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - BOSS App</title>
    <style>
        /* Reset and base styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
        }

        /* Base styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f4f4f4;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .email-body {
            padding: 40px 30px;
        }
        .title {
            font-size: 24px;
            color: #1f2937;
            margin: 0 0 20px 0;
            text-align: center;
            font-weight: 600;
        }
        .content {
            color: #374151;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }
        .button:hover {
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
            box-shadow: 0 6px 8px rgba(0,0,0,0.15);
        }
        .warning {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            color: #92400e;
            font-size: 14px;
            line-height: 1.5;
        }
        .warning strong {
            color: #78350f;
        }
        .link-container {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #374151;
        }
        .email-footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer-text {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
        }
        .footer-link {
            color: #2563eb;
            text-decoration: none;
        }

        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                border-radius: 0 !important;
            }
            .email-header, .email-body, .email-footer {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }
            .button {
                display: block !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .link-container {
                font-size: 11px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1 class="logo">BOSS App</h1>
        </div>

        <div class="email-body">
            <h2 class="title">Reset Password</h2>

            <div class="content">
                <p>Halo,</p>
                <p>Kami menerima permintaan untuk mereset password akun Anda. Jika Anda yang melakukan permintaan ini, klik tombol di bawah untuk melanjutkan proses reset password:</p>

                <div style="text-align: center;">
                    <a href="${resetLink}" class="button">
                        Reset Password Sekarang
                    </a>
                </div>

                <div class="warning">
                    <strong>⚠️ Penting:</strong> Link ini akan kedaluwarsa dalam 24 jam dan hanya dapat digunakan satu kali. Jika Anda tidak meminta reset password, abaikan email ini dan pastikan keamanan akun Anda.
                </div>

                <p>Jika tombol di atas tidak berfungsi, Anda dapat menyalin dan menempelkan link berikut ke browser Anda:</p>

                <div class="link-container">
                    ${resetLink}
                </div>
            </div>
        </div>

        <div class="email-footer">
            <p class="footer-text">
                Terima kasih telah menggunakan BOSS App<br>
                Jika Anda memiliki pertanyaan, hubungi tim support kami di <a href="mailto:bossappofficial1@gmail.com" class="footer-link">bossappofficial1@gmail.com</a>
            </p>
        </div>
    </div>
</body>
</html>`;

        return { subject, html, text };
    }
}