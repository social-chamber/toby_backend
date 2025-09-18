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

// Template for pending bookings (before payment confirmation)
export const bookingPendingTemplate = ({
  name = 'Customer',
  email = 'N/A',
  category = 'N/A',
  room = 'N/A',
  service = 'N/A',
  time = [],
  bookingId = 'N/A',
  date = 'N/A',
  promoCode = null,
  total = 'N/A'
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;">
      <div style="font-size: 48px; color: #ffa500;">⏳</div>
      <h2 style="color: #ffa500;">Booking Created - Payment Required</h2>
      <p style="font-size: 14px; color: #666;">Your booking has been created but payment is required to confirm it.</p>
    </div>
    
    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222;">Booking Details</h3>
    <table style="width: 100%; font-size: 14px; color: #333;">
      <tr><td style="padding: 8px 0;"><strong>Booking ID:</strong></td><td>${bookingId}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Name:</strong></td><td>${name}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Email:</strong></td><td>${email}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Category:</strong></td><td>${category}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Room:</strong></td><td>${room}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td>${service}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Time Slots:</strong></td><td>${time || 'N/A'}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Booking Date:</strong></td><td>${date}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Total Amount:</strong></td><td>$${total}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td style="color: #ffa500; font-weight: bold;">Pending Payment ⏳</td></tr>
    </table>

    ${promoCode ? `
    <div style="margin: 15px 0; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; color: #856404; font-size: 14px;">
      <strong>Promo Code Applied:</strong> ${promoCode} will be applied once payment is completed.
    </div>
    ` : ''}

    <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; color: #856404; font-size: 14px;">
      <strong>⚠️ Important:</strong> This booking is not yet confirmed. Please complete payment to secure your time slot.
    </div>
    
    <div style="margin-top: 15px; padding: 15px; background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; color: #0c5460; font-size: 14px;">
      <strong>Next Steps:</strong> Complete your payment to confirm this booking. You will receive a confirmation email with access details once payment is successful.
    </div>
    
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2025 Toby Booking System. All rights reserved.
    </footer>
  </div>
`;

// Legacy template - kept for backward compatibility but renamed
export const bookingCreationTemplate = bookingPendingTemplate;

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
      <tr><td style="padding: 8px 0;"><strong>Time Slots:</strong></td><td>${time || 'N/A'}</td></tr>
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
    <div style="text-align: center;">
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
      <tr><td style="padding: 8px 0;"><strong>Time Slots:</strong></td><td>${time || 'N/A'}</td></tr>
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

// Promo Code Usage Notification Templates
export const promoCodeUsedUserTemplate = ({
  name = 'Customer',
  email = 'N/A',
  promoCode = 'N/A',
  originalAmount = 'N/A',
  discountedAmount = 'N/A',
  savings = 'N/A',
  bookingId = 'N/A',
  service = 'N/A',
  room = 'N/A',
  date = 'N/A',
  time = []
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;">
      <div style="font-size: 48px; color: #ff6b35;">🎉</div>
      <h2 style="color: #ff6b35;">Promo Code Applied Successfully!</h2>
      <p style="font-size: 14px; color: #666;">Congratulations! Your promo code has been applied to your booking.</p>
    </div>
    
    <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border: 2px solid #ffeaa7; border-radius: 8px; text-align: center;">
      <h3 style="color: #856404; margin: 0 0 10px 0;">Your Savings</h3>
      <div style="font-size: 32px; font-weight: bold; color: #28a745;">$${savings}</div>
      <p style="color: #856404; margin: 5px 0 0 0;">You saved with promo code: <strong>${promoCode}</strong></p>
    </div>

    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222;">Booking Details</h3>
    <table style="width: 100%; font-size: 14px; color: #333;">
      <tr><td style="padding: 8px 0;"><strong>Booking ID:</strong></td><td>${bookingId}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Name:</strong></td><td>${name}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Email:</strong></td><td>${email}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td>${service}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Room:</strong></td><td>${room}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Time Slots:</strong></td><td>${time || 'N/A'}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Booking Date:</strong></td><td>${date}</td></tr>
    </table>

    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222; margin-top: 20px;">Payment Summary</h3>
    <table style="width: 100%; font-size: 14px; color: #333;">
      <tr><td style="padding: 8px 0;"><strong>Original Amount:</strong></td><td>$${originalAmount}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Promo Code:</strong></td><td style="color: #ff6b35; font-weight: bold;">${promoCode}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Discount:</strong></td><td style="color: #28a745;">-$${savings}</td></tr>
      <tr style="border-top: 2px solid #333;"><td style="padding: 8px 0;"><strong>Final Amount:</strong></td><td style="font-weight: bold; color: #333;">$${discountedAmount}</td></tr>
    </table>

    <div style="margin-top: 20px; padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; color: #155724; font-size: 14px;">
      <strong>Thank you!</strong> We appreciate your business and hope you enjoy your booking experience.
    </div>
    
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2025 Toby Booking System. All rights reserved.
    </footer>
  </div>
`;

// Booking Status Update Templates
export const bookingConfirmedTemplate = ({
  name = 'Customer',
  email = 'N/A',
  category = 'N/A',
  room = 'N/A',
  service = 'N/A',
  time = 'N/A',
  bookingId = 'N/A',
  date = 'N/A',
  total = 'N/A',
  promoCode = null,
  originalAmount = 'N/A',
  savings = 'N/A'
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;">
      <div style="font-size: 48px; color: #28a745;">✅</div>
      <h2 style="color: #28a745;">Booking Confirmed!</h2>
      <p style="font-size: 14px; color: #666;">Great news! Your booking has been confirmed and payment was successful.</p>
    </div>
    
    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222;">Booking Details</h3>
    <table style="width: 100%; font-size: 14px; color: #333;">
      <tr><td style="padding: 8px 0;"><strong>Booking ID:</strong></td><td>${bookingId}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Name:</strong></td><td>${name}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Email:</strong></td><td>${email}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Category:</strong></td><td>${category}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Room:</strong></td><td>${room}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td>${service}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Time Slots:</strong></td><td>${time}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Booking Date:</strong></td><td>${date}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td style="color: #28a745; font-weight: bold;">Confirmed ✅</td></tr>
    </table>

    ${promoCode ? `
    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222; margin-top: 20px;">Promo Code Applied</h3>
    <div style="margin: 15px 0; padding: 15px; background-color: #fff3cd; border: 2px solid #ffeaa7; border-radius: 8px; text-align: center;">
      <h4 style="color: #856404; margin: 0 0 10px 0;">🎉 Promo Code Successfully Applied!</h4>
      <div style="font-size: 24px; font-weight: bold; color: #28a745; margin: 10px 0;">$${savings} Saved</div>
      <p style="color: #856404; margin: 5px 0;"><strong>Promo Code:</strong> ${promoCode}</p>
      <p style="color: #856404; margin: 5px 0; font-size: 12px;">Original Amount: $${originalAmount} → Final Amount: $${total}</p>
    </div>
    ` : ''}

    <div style="margin-top: 20px; padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; color: #155724; font-size: 14px;">
      <strong>Important:</strong> Please use code <strong style="font-size: 16px; background-color: #fff; padding: 4px 8px; border-radius: 4px; border: 2px solid #28a745;">3388#</strong> to access the main entrance door.
    </div>
    
    <div style="margin-top: 15px; padding: 15px; background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; color: #004085; font-size: 14px;">
      <strong>Next Steps:</strong> Your booking is confirmed! Please arrive on time for your scheduled session. If you need to make any changes, please contact us at least 24 hours in advance.
    </div>
    
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2025 Toby Booking System. All rights reserved.
    </footer>
  </div>
`;

export const bookingCancelledTemplate = ({
  name = 'Customer',
  email = 'N/A',
  category = 'N/A',
  room = 'N/A',
  service = 'N/A',
  time = 'N/A',
  bookingId = 'N/A',
  date = 'N/A',
  total = 'N/A',
  promoCode = null,
  reason = 'N/A'
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;">
      <div style="font-size: 48px; color: #dc3545;">❌</div>
      <h2 style="color: #dc3545;">Booking Cancelled</h2>
      <p style="font-size: 14px; color: #666;">We're sorry to inform you that your booking has been cancelled.</p>
    </div>
    
    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222;">Booking Details</h3>
    <table style="width: 100%; font-size: 14px; color: #333;">
      <tr><td style="padding: 8px 0;"><strong>Booking ID:</strong></td><td>${bookingId}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Name:</strong></td><td>${name}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Email:</strong></td><td>${email}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Category:</strong></td><td>${category}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Room:</strong></td><td>${room}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td>${service}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Time Slots:</strong></td><td>${time}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Booking Date:</strong></td><td>${date}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Amount:</strong></td><td>$${total}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td style="color: #dc3545; font-weight: bold;">Cancelled ❌</td></tr>
      ${reason !== 'N/A' ? `<tr><td style="padding: 8px 0;"><strong>Reason:</strong></td><td>${reason}</td></tr>` : ''}
    </table>

    ${promoCode ? `
    <div style="margin: 15px 0; padding: 15px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24; font-size: 14px;">
      <strong>Promo Code Information:</strong> The promo code "${promoCode}" that was applied to this booking has been released and can be used for future bookings.
    </div>
    ` : ''}

    <div style="margin-top: 20px; padding: 15px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24; font-size: 14px;">
      <strong>Refund Information:</strong> If payment was made, a refund will be processed within 3-5 business days. You will receive a separate email confirmation once the refund is processed.
    </div>
    
    <div style="margin-top: 15px; padding: 15px; background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; color: #004085; font-size: 14px;">
      <strong>Need Help?</strong> If you have any questions about this cancellation or would like to make a new booking, please contact our support team.
    </div>
    
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2025 Toby Booking System. All rights reserved.
    </footer>
  </div>
`;

export const bookingRefundedTemplate = ({
  name = 'Customer',
  email = 'N/A',
  category = 'N/A',
  room = 'N/A',
  service = 'N/A',
  time = 'N/A',
  bookingId = 'N/A',
  date = 'N/A',
  total = 'N/A',
  promoCode = null,
  refundAmount = 'N/A',
  refundId = 'N/A'
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;">
      <div style="font-size: 48px; color: #ffc107;">💰</div>
      <h2 style="color: #ffc107;">Refund Processed</h2>
      <p style="font-size: 14px; color: #666;">Your refund has been successfully processed and will appear in your account within 3-5 business days.</p>
    </div>
    
    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222;">Booking Details</h3>
    <table style="width: 100%; font-size: 14px; color: #333;">
      <tr><td style="padding: 8px 0;"><strong>Booking ID:</strong></td><td>${bookingId}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Name:</strong></td><td>${name}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Email:</strong></td><td>${email}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Category:</strong></td><td>${category}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Room:</strong></td><td>${room}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td>${service}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Time Slots:</strong></td><td>${time}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Booking Date:</strong></td><td>${date}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Original Amount:</strong></td><td>$${total}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td style="color: #ffc107; font-weight: bold;">Refunded 💰</td></tr>
    </table>

    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222; margin-top: 20px;">Refund Information</h3>
    <div style="margin: 15px 0; padding: 15px; background-color: #fff3cd; border: 2px solid #ffeaa7; border-radius: 8px; text-align: center;">
      <h4 style="color: #856404; margin: 0 0 10px 0;">💰 Refund Amount</h4>
      <div style="font-size: 32px; font-weight: bold; color: #28a745; margin: 10px 0;">$${refundAmount}</div>
      <p style="color: #856404; margin: 5px 0;"><strong>Refund ID:</strong> ${refundId}</p>
      <p style="color: #856404; margin: 5px 0; font-size: 12px;">Processing Time: 3-5 business days</p>
    </div>

    ${promoCode ? `
    <div style="margin: 15px 0; padding: 15px; background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; color: #0c5460; font-size: 14px;">
      <strong>Promo Code Information:</strong> The promo code "${promoCode}" that was applied to this booking has been released and can be used for future bookings.
    </div>
    ` : ''}

    <div style="margin-top: 20px; padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; color: #155724; font-size: 14px;">
      <strong>Important:</strong> The refund will be credited back to the original payment method used for this booking. Please allow 3-5 business days for the refund to appear in your account.
    </div>
    
    <div style="margin-top: 15px; padding: 15px; background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; color: #004085; font-size: 14px;">
      <strong>Need Help?</strong> If you have any questions about this refund or would like to make a new booking, please contact our support team.
    </div>
    
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2025 Toby Booking System. All rights reserved.
    </footer>
  </div>
`;

export const promoCodeUsedAdminTemplate = ({
  userName = 'N/A',
  userEmail = 'N/A',
  userPhone = 'N/A',
  promoCode = 'N/A',
  discountType = 'N/A',
  discountValue = 'N/A',
  originalAmount = 'N/A',
  discountedAmount = 'N/A',
  savings = 'N/A',
  bookingId = 'N/A',
  service = 'N/A',
  room = 'N/A',
  date = 'N/A',
  time = [],
  usageCount = 'N/A',
  remainingUses = 'N/A'
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;">
      <div style="font-size: 48px; color: #007bff;">📊</div>
      <h2 style="color: #007bff;">Promo Code Usage Alert</h2>
      <p style="font-size: 14px; color: #666;">A customer has successfully used a promo code for their booking.</p>
    </div>

    <div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px;">
      <h3 style="color: #1976d2; margin: 0 0 10px 0;">Promo Code Details</h3>
      <table style="width: 100%; font-size: 14px; color: #333;">
        <tr><td style="padding: 4px 0;"><strong>Code:</strong></td><td style="font-weight: bold; color: #ff6b35;">${promoCode}</td></tr>
        <tr><td style="padding: 4px 0;"><strong>Discount Type:</strong></td><td>${discountType}</td></tr>
        <tr><td style="padding: 4px 0;"><strong>Discount Value:</strong></td><td>${discountValue}</td></tr>
        <tr><td style="padding: 4px 0;"><strong>Total Savings:</strong></td><td style="color: #28a745; font-weight: bold;">$${savings}</td></tr>
        <tr><td style="padding: 4px 0;"><strong>Usage Count:</strong></td><td>${usageCount}</td></tr>
        <tr><td style="padding: 4px 0;"><strong>Remaining Uses:</strong></td><td>${remainingUses}</td></tr>
      </table>
    </div>

    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222;">Customer Information</h3>
    <table style="width: 100%; font-size: 14px; color: #333;">
      <tr><td style="padding: 8px 0;"><strong>Name:</strong></td><td>${userName}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Email:</strong></td><td>${userEmail}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Phone:</strong></td><td>${userPhone}</td></tr>
    </table>

    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222; margin-top: 20px;">Booking Details</h3>
    <table style="width: 100%; font-size: 14px; color: #333;">
      <tr><td style="padding: 8px 0;"><strong>Booking ID:</strong></td><td>${bookingId}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td>${service}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Room:</strong></td><td>${room}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Time Slots:</strong></td><td>${time || 'N/A'}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Booking Date:</strong></td><td>${date}</td></tr>
    </table>

    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #222; margin-top: 20px;">Payment Summary</h3>
    <table style="width: 100%; font-size: 14px; color: #333;">
      <tr><td style="padding: 8px 0;"><strong>Original Amount:</strong></td><td>$${originalAmount}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Discount Applied:</strong></td><td style="color: #28a745;">-$${savings}</td></tr>
      <tr style="border-top: 2px solid #333;"><td style="padding: 8px 0;"><strong>Final Amount:</strong></td><td style="font-weight: bold; color: #333;">$${discountedAmount}</td></tr>
    </table>

    <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; color: #856404; font-size: 14px;">
      <strong>Action Required:</strong> This notification is for tracking purposes. No immediate action is required unless you notice any suspicious activity.
    </div>
    
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2025 Toby Booking System. All rights reserved.
    </footer>
  </div>
`;