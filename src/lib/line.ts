import crypto from 'crypto';

export interface LineMessage {
  type: string;
  [key: string]: any;
}

/**
 * Verify LINE webhook signatures
 */
export function verifySignature(body: string, signature: string, channelSecret: string): boolean {
  if (!signature || !channelSecret) return false;
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

/**
 * Reply to messages via LINE API
 */
export async function replyMessage(
  replyToken: string,
  messages: LineMessage | LineMessage[],
  channelAccessToken: string
): Promise<boolean> {
  try {
    const url = 'https://api.line.me/v2/bot/message/reply';
    const messageArray = Array.isArray(messages) ? messages : [messages];
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        replyToken,
        messages: messageArray
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Failed to send LINE reply:', errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in replyMessage:', err);
    return false;
  }
}

/**
 * Get group summary name from group ID
 */
export async function getGroupName(groupId: string, channelAccessToken: string): Promise<string> {
  try {
    const url = `https://api.line.me/v2/bot/group/${groupId}/summary`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${channelAccessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      return data.groupName || 'กลุ่มไลน์ (LINE Group)';
    }
  } catch (e) {
    console.error('Could not fetch group name from LINE API:', e);
  }
  return 'กลุ่มไลน์ (LINE Group)';
}

/**
 * Helper to build text message payload
 */
export function createTextMessage(text: string): LineMessage {
  return { type: 'text', text };
}

/**
 * Helper to build flex message payload
 */
export function createFlexMessage(altText: string, container: any): LineMessage {
  return {
    type: 'flex',
    altText,
    contents: container
  };
}

export interface LineUserProfile {
  displayName: string;
  userId: string;
  pictureUrl?: string;
  statusMessage?: string;
}

/**
 * Fetch LINE user profile using Messaging API
 */
export async function getUserProfile(
  userId: string,
  channelAccessToken: string
): Promise<LineUserProfile | null> {
  try {
    const url = `https://api.line.me/v2/bot/profile/${userId}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${channelAccessToken}` }
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error('Error fetching user profile from LINE:', err);
  }
  return null;
}

