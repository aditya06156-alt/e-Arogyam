import { Notification } from './types';
import { v4 as uuidv4 } from 'uuid';
import { inMemoryStore } from './db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || '';

export async function sendSmsNotification(recipient: string, message: string, alertId?: string): Promise<Notification> {
  const notif: Notification = {
    id: `SMS-${uuidv4().substring(0, 8)}`,
    alertId,
    provider: 'FAST2SMS',
    recipient,
    status: 'QUEUED',
    createdAt: new Date().toISOString(),
  };

  if (!FAST2SMS_API_KEY) {
    console.log(`📱 [SMS DISPATCH - MOCK FAST2SMS] To: ${recipient} | Msg: "${message}"`);
    notif.status = 'SENT';
    notif.providerMessageId = `MOCK-MSG-${Date.now()}`;
    inMemoryStore.notifications.push(notif);
    return notif;
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'q',
        numbers: recipient.replace(/[^0-9]/g, ''),
        message: message,
        flash: 0
      })
    });

    const data = await response.json() as any;
    if (response.ok && data.return) {
      notif.status = 'SENT';
      notif.providerMessageId = data.request_id || `FAST-${Date.now()}`;
      console.log(`📱 [SMS DISPATCH SUCCESS] Sent to ${recipient} via Fast2SMS | ID: ${notif.providerMessageId}`);
    } else {
      if (data.status_code === 999) {
        console.warn(`📱 [SMS DISPATCH - FAST2SMS ACCOUNT NOTICE] To: ${recipient}`);
        console.warn(`   Msg: "${message}"`);
        console.warn(`   Notice: Fast2SMS API requires completing a 100 INR account top-up to dispatch live network SMS.`);
      } else {
        console.error('Fast2SMS response error:', data);
      }
      notif.status = 'FAILED';
    }
  } catch (err) {
    console.error('Failed to send SMS via Fast2SMS:', err);
    notif.status = 'FAILED';
  }

  inMemoryStore.notifications.push(notif);
  return notif;
}
