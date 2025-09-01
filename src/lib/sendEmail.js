import nodemailer from "nodemailer";
import {
  emailHost,
  emailPort,
  emailAddress,
  emailPass,
  emailFrom,
} from "../core/config/config.js";

// Hostinger-friendly SMTP helper
// - Use smtp.hostinger.com with port 465 (secure) or 587 (STARTTLS)
// - Ensure FROM matches the authenticated mailbox
const sendEmail = async ({ to, subject, html }) => {
  try {
    const portNumber = typeof emailPort === "string" ? parseInt(emailPort, 10) : emailPort;
    const isSecure = portNumber === 465; // Hostinger SSL port

    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: portNumber,
      secure: isSecure,
      auth: {
        user: emailAddress,
        pass: emailPass,
      },
      requireTLS: !isSecure,
    });

    const fromAddress = emailFrom || emailAddress;

    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
};

export default sendEmail;
