import nodemailer from "nodemailer";
import {
  emailHost,
  emailPort,
  emailAddress,
  emailPass,
  emailFrom,
} from "../core/config/config.js";

// Enhanced email service with retry logic and better error handling
class EmailService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      const portNumber = typeof emailPort === "string" ? parseInt(emailPort, 10) : emailPort;
      const isSecure = portNumber === 465;

      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: portNumber,
        secure: isSecure,
        auth: {
          user: emailAddress,
          pass: emailPass,
        },
        requireTLS: !isSecure,
        // Add connection timeout and other reliability settings
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 60000,     // 60 seconds
        pool: true,               // Use connection pooling
        maxConnections: 5,        // Maximum number of connections
        maxMessages: 100,         // Maximum messages per connection
      });

      console.log('Email transporter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  async sendEmailWithRetry({ to, subject, html, priority = 'normal' }) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Attempting to send email (attempt ${attempt}/${this.maxRetries}) to: ${to}`);
        
        const result = await this.sendEmail({ to, subject, html, priority });
        
        if (result.success) {
          console.log(`Email sent successfully to ${to} on attempt ${attempt}`);
          return result;
        }
        
        lastError = result.error;
      } catch (error) {
        lastError = error;
        console.error(`Email send attempt ${attempt} failed:`, error.message);
        
        // Don't retry on certain errors (like invalid email format)
        if (this.isNonRetryableError(error)) {
          console.log('Non-retryable error detected, stopping retries');
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    const errorMessage = `Failed to send email after ${this.maxRetries} attempts. Last error: ${lastError?.message || lastError}`;
    console.error(errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      attempts: this.maxRetries
    };
  }

  async sendEmail({ to, subject, html, priority = 'normal' }) {
    try {
      // Validate inputs
      if (!to || !subject || !html) {
        throw new Error('Missing required email parameters: to, subject, or html');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        throw new Error(`Invalid email format: ${to}`);
      }

      const fromAddress = emailFrom || emailAddress;
      
      const mailOptions = {
        from: fromAddress,
        to,
        subject,
        html,
        priority: priority === 'high' ? 'high' : 'normal',
        // Add headers for better deliverability
        headers: {
          'X-Priority': priority === 'high' ? '1' : '3',
          'X-Mailer': 'Toby Booking System',
        },
      };

      // Verify connection before sending
      await this.transporter.verify();
      
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', {
        messageId: info.messageId,
        to: to,
        subject: subject
      });

      return { 
        success: true, 
        messageId: info.messageId,
        to: to,
        subject: subject
      };
    } catch (error) {
      console.error("Email send error:", error);
      return { 
        success: false, 
        error: error.message,
        to: to,
        subject: subject
      };
    }
  }

  isNonRetryableError(error) {
    const nonRetryablePatterns = [
      /invalid email/i,
      /recipient address/i,
      /authentication failed/i,
      /invalid credentials/i,
      /permission denied/i,
      /quota exceeded/i,
      /rate limit/i
    ];

    return nonRetryablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.toString())
    );
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to send booking confirmation email
  async sendBookingConfirmation(bookingData) {
    const { name, email, category, room, service, time, bookingId, date } = bookingData;
    
    return await this.sendEmailWithRetry({
      to: email,
      subject: 'Your Booking Confirmation - Toby',
      html: this.generateBookingConfirmationHTML({
        name, category, room, service, time, bookingId, date
      }),
      priority: 'high'
    });
  }

  generateBookingConfirmationHTML({ name, category, room, service, time, bookingId, date }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px 0; }
          .booking-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p>Thank you for choosing Toby</p>
          </div>
          
          <div class="content">
            <p>Dear ${name},</p>
            <p>Your booking has been successfully confirmed. Here are your booking details:</p>
            
            <div class="booking-details">
              <h3>Booking Details</h3>
              <p><strong>Booking ID:</strong> ${bookingId}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Room:</strong> ${room}</p>
              <p><strong>Service:</strong> ${service}</p>
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Time Slots:</strong></p>
              <ul>
                ${time.map(slot => `<li>${slot.start} - ${slot.end}</li>`).join('')}
              </ul>
            </div>
            
            <p>If you have any questions or need to make changes to your booking, please contact us.</p>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Toby!</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export both the service and a convenience function for backward compatibility
export default emailService;

// Backward compatible function
export const sendEmail = async ({ to, subject, html }) => {
  return await emailService.sendEmailWithRetry({ to, subject, html });
};
