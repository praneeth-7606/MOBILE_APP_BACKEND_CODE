export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const generateSessionId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return `${localPart[0]}***@${domain}`;
  return `${localPart.substring(0, 2)}***@${domain}`;
};

export const maskPhone = (phone) => {
  if (!phone) return '';
  if (phone.length <= 6) return `${phone.substring(0, 3)}***`;
  const start = phone.substring(0, 4);
  const end = phone.substring(phone.length - 4);
  return `${start}***${end}`;
};

export const formatResponse = (success, message, data = null) => {
  const response = { success, message };
  if (data) Object.assign(response, data);
  return response;
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data) : '';
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message} ${logData}`);
};