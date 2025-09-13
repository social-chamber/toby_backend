/**
 * Email templates for different booking scenarios
 */

// Default export for backward compatibility
export const verificationCodeTemplate = ({
  name = 'User',
  code = '123456'
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;">
      <div style="font-size: 48px; color: #007bff;">🔐</div>
      <h2 style="color: #333;">Verification Code</h2>
      <p style="font-size: 14px; color: #666;">Hello ${name}, please use this code to verify your account.</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
        ${code}
      </div>
    </div>
    <div style="text-align: center; color: #666; font-size: 14px;">
      <p>This code will expire in 15 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2025 Toby Booking System. All rights reserved.
    </footer>
  </div>
`;

// Default export for backward compatibility
export default verificationCodeTemplate;

export const bookingCreationTemplate = ({
  name = 'Customer',
  email = 'N/A',
  category = 'N/A',
  room = 'N/A',
  service = 'N/A',
  time = [],
  bookingId = 'N/A',
  date = 'N/A'
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;">
      <div style="font-size: 48px; color: #ffa500;">📋</div>
      <h2 style="color: #333;">Booking Details</h2>
      <p style="font-size: 14px; color: #666;">Thank you for your booking. Your payment has been processed and your booking is being reviewed by our team.</p>
    </div>
    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222;">Booking Details</h3>
    <table style="width: 100%; font-size: 14px; color: #333;">
      <tr><td style="padding: 8px 0;"><strong>Booking ID:</strong></td><td>${bookingId}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Name:</strong></td><td>${name}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Email:</strong></td><td>${email}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Category:</strong></td><td>${category}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Room:</strong></td><td>${room}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td>${service}</td></tr>
      ${Array.isArray(time) && time.length > 0 ? `<tr><td style="padding: 8px 0;"><strong>Time Slots:</strong></td><td>${time.join(', ')}</td></tr>` : `<tr><td style="padding: 8px 0;"><strong>Time:</strong></td><td>${time || 'N/A'}</td></tr>`}
      <tr><td style="padding: 8px 0;"><strong>Booking Date:</strong></td><td>${date}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td style="color: #ffa500; font-weight: bold;">Under Review</td></tr>
    </table>
    <div style="margin-top: 20px; padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; color: #155724; font-size: 14px;"></div>
      <strong>Important:</strong> Please use code <strong style="font-size: 16px; background-color: #fff; padding: 4px 8px; border-radius: 4px; border: 2px solid #28a745;">3388#</strong> to access the main entrance door.
    </div>
    <div style="margin-top: 15px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; color: #856404; font-size: 14px;">
      <strong>Next Step:</strong> Please complete your payment to confirm your booking. You will receive another email once payment is successful.
    </div>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2025 Toby Booking System. All rights reserved.
    </footer>
  </div>
`;

export const paymentFailedTemplate = ({
  name = 'Customer',
  email = 'N/A',
  category = 'N/A',
  room = 'N/A',
  service = 'N/A',
  time = [],
  bookingId = 'N/A',
  date = 'N/A'
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;">
      <div style="font-size: 48px; color: #dc3545;">❌</div>
      <h2 style="color: #dc3545;">Payment Failed</h2>
      <p style="font-size: 14px; color: #666;">Unfortunately, your payment could not be processed and your booking has been cancelled.</p>
    </div>
    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222;">Booking Details</h3>
    <table style="width: 100%; font-size: 14px; color: #333;">
      <tr><td style="padding: 8px 0;"><strong>Booking ID:</strong></td><td>${bookingId}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Name:</strong></td><td>${name}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Email:</strong></td><td>${email}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Category:</strong></td><td>${category}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Room:</strong></td><td>${room}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td>${service}</td></tr>
      ${Array.isArray(time) && time.length > 0 ? `<tr><td style="padding: 8px 0;"><strong>Time Slots:</strong></td><td>${time.join(', ')}</td></tr>` : `<tr><td style="padding: 8px 0;"><strong>Time:</strong></td><td>${time || 'N/A'}</td></tr>`}
      <tr><td style="padding: 8px 0;"><strong>Booking Date:</strong></td><td>${date}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td style="color: #dc3545; font-weight: bold;">Cancelled - Payment Failed</td></tr>
    </table>
    <div style="margin-top: 20px; padding: 15px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24; font-size: 14px;">
      <strong>What happened?</strong> Your payment could not be processed. This could be due to insufficient funds, incorrect card details, or bank restrictions.
    </div>
    <div style="margin-top: 15px; padding: 15px; background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; color: #0c5460; font-size: 14px;">
      <strong>Next Steps:</strong> You can try booking again with a different payment method. If you continue to experience issues, please contact our support team.
    </div>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2025 Toby Booking System. All rights reserved.
    </footer>
  </div>
`;

export const paymentSuccessTemplate = ({
  name = 'Customer',
  email = 'N/A',
  category = 'N/A',
  room = 'N/A',
  service = 'N/A',
  time = [],
  bookingId = 'N/A',
  date = 'N/A'
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;"></div>
      <div style="font-size: 48px; color: #28a745;">✅</div>
      <h2 style="color: #28a745;">Booking Confirmed!</h2>
      <p style="font-size: 14px; color: #666;">Your payment was successful and your booking is now confirmed.</p>
    </div>
    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222;">Booking Details</h3>
    <table style="width: 100%; font-size: 14px; color: #333;">
      <tr><td style="padding: 8px 0;"><strong>Booking ID:</strong></td><td>${bookingId}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Name:</strong></td><td>${name}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Email:</strong></td><td>${email}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Category:</strong></td><td>${category}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Room:</strong></td><td>${room}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td>${service}</td></tr>
      ${Array.isArray(time) && time.length > 0 ? `<tr><td style="padding: 8px 0;"><strong>Time Slots:</strong></td><td>${time.join(', ')}</td></tr>` : `<tr><td style="padding: 8px 0;"><strong>Time:</strong></td><td>${time || 'N/A'}</td></tr>`}
      <tr><td style="padding: 8px 0;"><strong>Booking Date:</strong></td><td>${date}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td style="color: #28a745; font-weight: bold;">Confirmed - Payment Successful</td></tr>
    </table>
    <div style="margin-top: 20px; padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; color: #155724; font-size: 14px;">
      <strong>Important:</strong> Please use code <strong>3388#</strong> to access the main entrance door.
    </div>
    <div style="margin-top: 15px; padding: 15px; background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; color: #0c5460; font-size: 14px;">
      <strong>Need Help?</strong> If you have any questions or need to make changes to your booking, please contact us.
    </div>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2025 Toby Booking System. All rights reserved.
    </footer>
  </div>
`;