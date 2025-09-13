const bookingRefundTemplate = ({
  name = 'Customer',
  email = 'N/A',
  category = 'N/A',
  room = 'N/A',
  service = 'N/A',
  time = [],
  bookingId = 'N/A',
  date = 'N/A',
  refundAmount = 'N/A',
  refundMethod = 'N/A'
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #28a745; margin: 0; font-size: 28px;">💰 Refund Processed</h1>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your refund has been successfully processed</p>
      </div>
      
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
        <h3 style="color: #155724; margin: 0 0 10px 0; font-size: 18px;">✅ Refund Confirmed</h3>
        <p style="color: #155724; margin: 0; font-size: 14px;">Your refund has been processed and will appear in your account within 3-5 business days.</p>
      </div>

      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Refund Details</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <tr><td style="padding: 8px 0; font-weight: bold; width: 30%;">Booking ID:</td><td style="padding: 8px 0;">${bookingId}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Name:</td><td style="padding: 8px 0;">${name}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td style="padding: 8px 0;">${email}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Category:</td><td style="padding: 8px 0;">${category}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Room:</td><td style="padding: 8px 0;">${room}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Service:</td><td style="padding: 8px 0;">${service}</td></tr>
        ${Array.isArray(time) && time.length > 0 ? `<tr><td style="padding: 8px 0; font-weight: bold;">Time Slots:</td><td style="padding: 8px 0;">${time.join(', ')}</td></tr>` : `<tr><td style="padding: 8px 0; font-weight: bold;">Time:</td><td style="padding: 8px 0;">${time || 'N/A'}</td></tr>`}
        <tr><td style="padding: 8px 0; font-weight: bold;">Booking Date:</td><td style="padding: 8px 0;">${date}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Refund Amount:</td><td style="padding: 8px 0; color: #28a745; font-weight: bold;">${refundAmount}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Refund Method:</td><td style="padding: 8px 0;">${refundMethod}</td></tr>
      </table>

      <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
        <h3 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px;">📋 Refund Information</h3>
        <ul style="color: #0c5460; margin: 0; padding-left: 20px; font-size: 14px;">
          <li>Refund will appear in your original payment method within 3-5 business days</li>
          <li>You will receive a separate email confirmation from your payment provider</li>
          <li>If you don't see the refund after 5 business days, please contact our support team</li>
          <li>You can make a new booking at any time</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="#" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Make New Booking</a>
      </div>

      <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
        &copy; 2025 Your Company Name. All rights reserved.
      </footer>
    </div>
  </div>
`;

export default bookingRefundTemplate;
