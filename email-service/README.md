# Email Service

A simple Node.js email service that accepts HTTP requests to send emails via SMTP.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your SMTP configuration:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=your-email@gmail.com
   PORT=3000
   ```

## Development

Run in development mode:

```bash
npm run dev
```

## Build

Build the project:

```bash
npm run build
```

## Usage

### Send Email

Make a POST request to `/send-email` with JSON body:

```json
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "text": "This is a test email",
  "html": "<p>This is a <strong>test</strong> email</p>"
}
```

Required fields: `to`, `subject`

Optional fields: `text`, `html`

### Health Check

GET `/` - Returns service status.

## Deployment

This service is configured for Vercel deployment. Push to your repository and Vercel will handle the build and deployment.

Make sure to set environment variables in Vercel dashboard under Project Settings > Environment Variables.
