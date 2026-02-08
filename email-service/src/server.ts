import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '20mb' }));

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Endpoint to send email
app.post('/send-email', async (req, res) => {
    try {
        const { to, subject, text, html, from, attachments } = req.body;

        if (!to || !subject) {
            return res.status(400).json({ error: 'Missing required fields: to, subject' });
        }

        const mailOptions = {
            from: from || (process.env.SMTP_FROM || process.env.SMTP_USER),
            to,
            subject,
            text,
            html,
        };

        const info = await transporter.sendMail({ ...mailOptions, attachments });
        console.log('Email sent:', info.messageId);

        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'Email service is running' });
});

app.listen(port, () => {
    console.log(`Email service listening on port ${port}`);
});

export default app;