export const sendEmail = (transporter, config) => async (to, subject, html) => {
  try {
    if (!transporter) {
      console.log(`🔧 Email would be sent to ${to}: ${subject}`);
      return { success: true };
    }
    
    await transporter.sendMail({
      from: `"${config.APP_NAME}" <${config.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendSMS = (twilioClient, config) => async (to, message) => {
  try {
    if (!twilioClient) {
      console.log(`🔧 SMS would be sent to ${to}: ${message}`);
      return { success: true };
    }
    
    await twilioClient.messages.create({
      body: message,
      from: config.TWILIO_PHONE_NUMBER,
      to
    });
    return { success: true };
  } catch (error) {
    console.error('SMS sending failed:', error.message);
    return { success: false, error: error.message };
  }
};
