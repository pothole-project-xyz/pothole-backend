const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('SMTP not configured — skipping email send:', subject);
    return;
  }
  const t = getTransporter();
  await t.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@smartroad.app',
    to,
    subject,
    html,
  });
}

module.exports = { sendEmail };
