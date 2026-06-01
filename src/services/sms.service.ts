import axios from 'axios';

const ALPHA_SMS_URL = 'https://api.sms.net.bd/sendsms';

function isSmsSendSuccess(data: any) {
  return (
    data?.success === true ||
    data?.success === 'true' ||
    data?.error === 0 ||
    data?.error === '0' ||
    data?.status === 'success' ||
    data?.status === 'SUCCESS'
  );
}

export async function sendOtpSms(mobile: string, code: string) {
  if (!process.env.SMS_PROVIDER) {
    console.log(`[SMS stub] OTP for ${mobile}: ${code}`);
    return;
  }

  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) throw new Error('SMS gateway not configured');

  const provider = process.env.SMS_PROVIDER.toLowerCase();
  const message = `Your Easy Buy Corner OTP is ${code}. Valid for 5 minutes.`;

  const apiUrl = process.env.SMS_API_URL || (provider === 'alpha_sms' ? ALPHA_SMS_URL : '');
  if (!apiUrl) throw new Error('SMS gateway not configured');

  const payload =
    provider === 'alpha_sms'
      ? {
          api_key: apiKey,
          sender_id: process.env.SMS_SENDER_ID,
          to: mobile,
          msg: message,
        }
      : {
          api_key: apiKey,
          sender_id: process.env.SMS_SENDER_ID,
          to: mobile,
          message,
        };

  const res = await axios.post(apiUrl, payload, { timeout: 10000 });

  if (!isSmsSendSuccess(res.data)) {
    const detail = res.data?.msg || res.data?.message || 'SMS send failed';
    throw new Error(detail);
  }
}
