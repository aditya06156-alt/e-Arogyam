"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSmsNotification = sendSmsNotification;
const uuid_1 = require("uuid");
const db_1 = require("./db");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
dotenv_1.default.config();
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || '';
async function sendSmsNotification(recipient, message, alertId) {
    const notif = {
        id: `SMS-${(0, uuid_1.v4)().substring(0, 8)}`,
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
        db_1.inMemoryStore.notifications.push(notif);
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
        const data = await response.json();
        if (response.ok && data.return) {
            notif.status = 'SENT';
            notif.providerMessageId = data.request_id || `FAST-${Date.now()}`;
            console.log(`📱 [SMS DISPATCH SUCCESS] Sent to ${recipient} via Fast2SMS | ID: ${notif.providerMessageId}`);
        }
        else {
            if (data.status_code === 999) {
                console.warn(`📱 [SMS DISPATCH - FAST2SMS ACCOUNT NOTICE] To: ${recipient}`);
                console.warn(`   Msg: "${message}"`);
                console.warn(`   Notice: Fast2SMS API requires completing a 100 INR account top-up to dispatch live network SMS.`);
            }
            else {
                console.error('Fast2SMS response error:', data);
            }
            notif.status = 'FAILED';
        }
    }
    catch (err) {
        console.error('Failed to send SMS via Fast2SMS:', err);
        notif.status = 'FAILED';
    }
    db_1.inMemoryStore.notifications.push(notif);
    return notif;
}
