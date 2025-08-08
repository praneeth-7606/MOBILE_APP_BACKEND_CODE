// import { createTransport } from 'nodemailer';
// import { CONFIG } from './database.js';

// let emailTransporter;
// let twilioClient;

// // Import Twilio if available
// let twilio;
// try {
//   twilio = await import('twilio');
// } catch (e) {
//   console.warn('⚠️  Twilio not installed. Phone features will not work in production.');
// }

// const log = (level, message, data = null) => {
//   const timestamp = new Date().toISOString();
//   const logData = data ? JSON.stringify(data) : '';
//   console.log(`[${timestamp}] ${level.toUpperCase()}: ${message} ${logData}`);
// };

// export const setupCommunication = () => {
//   // Email setup
//   if (CONFIG.EMAIL_USER && CONFIG.EMAIL_PASS) {
//     emailTransporter = createTransport({
//       host: CONFIG.EMAIL_HOST,
//       port: CONFIG.EMAIL_PORT,
//       secure: false,
//       auth: {
//         user: CONFIG.EMAIL_USER,
//         pass: CONFIG.EMAIL_PASS
//       }
//     });
//     log('info', '✅ Email transporter configured');
//   } else {
//     log('warn', '⚠️  Email not configured - email OTPs will be shown in console');
//   }
  
//   // Twilio setup
//   if (CONFIG.TWILIO_ACCOUNT_SID && CONFIG.TWILIO_AUTH_TOKEN && twilio) {
//     twilioClient = twilio.default(CONFIG.TWILIO_ACCOUNT_SID, CONFIG.TWILIO_AUTH_TOKEN);
//     log('info', '✅ Twilio SMS configured');
//   } else {
//     log('warn', '⚠️  Twilio not configured - phone OTPs will be shown in console');
//   }
// };

// export const sendEmail = async (to, subject, html) => {
//   try {
//     if (!emailTransporter) {
//       log('info', `📧 Email OTP for ${to}: ${subject}`);
//       return { success: true };
//     }
    
//     await emailTransporter.sendMail({
//       from: `"${CONFIG.APP_NAME}" <${CONFIG.EMAIL_USER}>`,
//       to,
//       subject,
//       html
//     });
//     return { success: true };
//   } catch (error) {
//     log('error', 'Email sending failed', { error: error.message, to });
//     return { success: false, error: error.message };
//   }
// };

// export const sendSMS = async (to, message) => {
//   try {
//     if (!twilioClient) {
//       log('info', `📱 SMS OTP for ${to}: ${message}`);
//       return { success: true };
//     }
    
//     await twilioClient.messages.create({
//       body: message,
//       from: CONFIG.TWILIO_PHONE_NUMBER,
//       to
//     });
//     return { success: true };
//   } catch (error) {
//     log('error', 'SMS sending failed', { error: error.message, to });
//     return { success: false, error: error.message };
//   }
// };

// export { emailTransporter, twilioClient };




import { createTransport } from 'nodemailer';

export const setupEmailTransporter = (config) => {
  if (config.EMAIL_USER && config.EMAIL_PASS) {
    const transporter = createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: false,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS
      }
    });
    console.log('✅ Email transporter configured');
    return transporter;
  } else {
    console.warn('⚠️  Email not configured - email OTPs will be shown in console');
    return null;
  }
};

export const setupTwilioClient = async (config) => {
  try {
    if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
      const twilio = await import('twilio');
      const client = twilio.default(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
      console.log('✅ Twilio SMS configured');
      return client;
    } else {
      console.warn('⚠️  Twilio not configured - phone OTPs will be shown in console');
      return null;
    }
  } catch (e) {
    console.warn('⚠️  Twilio not installed. Phone features will not work in production.');
    return null;
  }
};
