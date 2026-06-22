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

/**
 * Generates a styled LINE Flex Message bubble with action buttons linking to LIFF
 */
export function createStatsFlexMessage(todayCount: number, totalCount: number, liffId: string): LineMessage {
  const todayUri = `https://liff.line.me/${liffId}/admin/dashboard?filter=today`;
  const allUri = `https://liff.line.me/${liffId}/admin/dashboard`;

  return {
    type: 'flex',
    altText: 'รายงานสถิติการฝึกหน้าร้าน 📊',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#EF4444',
        paddingAll: '20px',
        contents: [
          {
            type: 'text',
            text: 'IN-STORE TRAINING SURVEY',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'sm',
            letterSpacing: '1px'
          },
          {
            type: 'text',
            text: 'บัดดี้ (Buddy) รายงานผลประเมินรายวัน',
            color: '#FFEBEB',
            size: 'xs',
            margin: 'xs'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        contents: [
          {
            type: 'text',
            text: 'สรุปรายการประเมินล่าสุด',
            weight: 'bold',
            size: 'md',
            color: '#111827'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'จำนวนประเมินวันนี้:',
                    size: 'sm',
                    color: '#4B5563'
                  },
                  {
                    type: 'text',
                    text: `${todayCount} รายการ`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#EF4444',
                    align: 'right'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'จำนวนประเมินทั้งหมด:',
                    size: 'sm',
                    color: '#4B5563'
                  },
                  {
                    type: 'text',
                    text: `${totalCount} รายการ`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#10B981',
                    align: 'right'
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '20px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#EF4444',
            action: {
              type: 'uri',
              label: 'ดูรายละเอียดวันนี้',
              uri: todayUri
            }
          },
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'uri',
              label: 'ดูข้อมูลประเมินทั้งหมด',
              uri: allUri
            }
          }
        ]
      }
    }
  };
}

/**
 * Generates a styled LINE Flex Message bubble for a newly assigned task
 */
export function createTaskFlexMessage(task: {
  id: number;
  assignee?: string | null;
  description: string;
  displayName?: string | null;
}, liffId: string): LineMessage {
  const taskUri = `https://liff.line.me/${liffId}/admin/tasks?id=${task.id}`;

  return {
    type: 'flex',
    altText: 'บัดดี้ บันทึกมอบหมายงานสำเร็จ! 📝',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#10B981',
        paddingAll: '20px',
        contents: [
          {
            type: 'text',
            text: 'TASK ASSIGNED',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'sm',
            letterSpacing: '1px'
          },
          {
            type: 'text',
            text: 'บัดดี้ (Buddy) บันทึกมอบหมายงานสำเร็จ',
            color: '#E6F4EA',
            size: 'xs',
            margin: 'xs'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        contents: [
          {
            type: 'text',
            text: `งานมอบหมายหมายเลข #${task.id}`,
            weight: 'bold',
            size: 'md',
            color: '#111827'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'ผู้รับผิดชอบ:',
                    size: 'sm',
                    color: '#4B5563',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: task.assignee || 'ไม่ได้ระบุ',
                    size: 'sm',
                    weight: 'bold',
                    color: '#10B981',
                    align: 'right',
                    flex: 3
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'ผู้สั่งงาน:',
                    size: 'sm',
                    color: '#4B5563',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: task.displayName || 'ไม่ได้ระบุ',
                    size: 'sm',
                    color: '#111827',
                    align: 'right',
                    flex: 3
                  }
                ]
              },
              {
                type: 'box',
                layout: 'vertical',
                margin: 'md',
                contents: [
                  {
                    type: 'text',
                    text: 'รายละเอียดงาน:',
                    size: 'sm',
                    color: '#4B5563',
                    margin: 'sm'
                  },
                  {
                    type: 'text',
                    text: task.description,
                    size: 'sm',
                    color: '#111827',
                    wrap: true,
                    margin: 'xs',
                    weight: 'medium'
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#10B981',
            action: {
              type: 'uri',
              label: 'ดูรายละเอียดและทำเสร็จสิ้น',
              uri: taskUri
            }
          }
        ]
      }
    }
  };
}

