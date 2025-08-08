export const sendLoginOTP = (emailService, config) => async (email, otp, isResend = false) => {
  const subject = isResend ? 'New Login Verification Code' : 'Login Verification Code';
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; text-align: center;">
        ${isResend ? 'New ' : ''}Email Login Verification
      </h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 16px; color: #555;">
          ${isResend ? 'You requested a new verification code.' : 'Hello! Someone is trying to login to your account using email.'}
        </p>
        <p style="font-size: 16px; color: #555;">Your verification code is:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #666;">
          This code will expire in 10 minutes. If you didn't request this, please ignore this email.
        </p>
      </div>
    </div>
  `;
  
  return await emailService(email, subject, emailHtml);
};

export const sendPhoneOTP = (smsService, config) => async (phone, otp, isResend = false) => {
  const message = `${config.APP_NAME}: Your ${isResend ? 'new ' : ''}verification code is ${otp}. This code expires in 10 minutes. If you didn't request this, please ignore.`;
  return await smsService(phone, message);
};
