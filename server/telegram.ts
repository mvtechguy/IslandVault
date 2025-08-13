import { storage } from "./storage";

export interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
}

export class TelegramService {
  private botToken: string | null = null;
  private adminChatId: string | null = null;

  constructor() {
    this.initializeBot();
  }

  async initialize(): Promise<void> {
    await this.initializeBot();
  }

  private async initializeBot() {
    try {
      const settings = await storage.getSettings();
      this.botToken = settings?.telegramBotToken || null;
      this.adminChatId = settings?.telegramAdminChatId || null;
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error);
    }
  }

  private async sendMessage(message: TelegramMessage): Promise<boolean> {
    if (!this.botToken) {
      console.warn('Telegram bot token not configured');
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      return false;
    }
  }

  async sendUserNotification(userId: number, message: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user?.telegramChatId || !user.telegramNotifications) {
        return false;
      }

      return await this.sendMessage({
        chat_id: user.telegramChatId,
        text: message,
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Failed to send user notification:', error);
      return false;
    }
  }

  async sendAdminNotification(message: string): Promise<boolean> {
    if (!this.adminChatId) {
      console.warn('Admin chat ID not configured');
      return false;
    }

    return await this.sendMessage({
      chat_id: this.adminChatId,
      text: message,
      parse_mode: 'HTML'
    });
  }

  // User notifications
  async notifyUserRegistrationApproved(userId: number): Promise<void> {
    const message = `🎉 Welcome to Kaiveni! Your account has been approved. You can now create posts and connect with other Maldivians looking for partners.`;
    await this.sendUserNotification(userId, message);
  }

  async notifyUserRegistrationRejected(userId: number, reason?: string): Promise<void> {
    const message = `❌ Sorry, your Kaiveni registration was not approved.${reason ? ` Reason: ${reason}` : ''}`;
    await this.sendUserNotification(userId, message);
  }

  async notifyPostApproved(userId: number, postTitle: string): Promise<void> {
    const message = `✅ Your post "${postTitle}" has been approved and is now visible to other users.`;
    await this.sendUserNotification(userId, message);
  }

  async notifyPostRejected(userId: number, postTitle: string, reason?: string): Promise<void> {
    const message = `❌ Your post "${postTitle}" was not approved.${reason ? ` Reason: ${reason}` : ''}`;
    await this.sendUserNotification(userId, message);
  }

  async notifyCoinsAdded(userId: number, amount: number): Promise<void> {
    const message = `💰 Your coin top-up has been approved! ${amount} coins have been added to your account.`;
    await this.sendUserNotification(userId, message);
  }

  async notifyTopupRejected(userId: number, amount: string, reason?: string): Promise<void> {
    const message = `❌ Your coin top-up request for MVR ${amount} was not approved.${reason ? ` Reason: ${reason}` : ''}`;
    await this.sendUserNotification(userId, message);
  }

  async notifyConnectionRequest(userId: number, requesterName: string): Promise<void> {
    const message = `💌 ${requesterName} sent you a connection request! Check your profile to respond.`;
    await this.sendUserNotification(userId, message);
  }

  async notifyConnectionApproved(userId: number, targetName: string): Promise<void> {
    const message = `💕 Great news! ${targetName} accepted your connection request.`;
    await this.sendUserNotification(userId, message);
  }

  async notifyConnectionRejected(userId: number, targetName: string): Promise<void> {
    const message = `💔 ${targetName} declined your connection request.`;
    await this.sendUserNotification(userId, message);
  }

  // Admin notifications
  async notifyAdminNewUser(username: string, fullName: string, island: string, atoll: string): Promise<void> {
    const message = `👤 <b>New User Registration</b>\n\n` +
                   `• Username: ${username}\n` +
                   `• Name: ${fullName}\n` +
                   `• Location: ${island}, ${atoll}\n\n` +
                   `Please review and approve/reject this user.`;
    await this.sendAdminNotification(message);
  }

  async notifyAdminNewPost(username: string, title: string, description: string): Promise<void> {
    const message = `📝 <b>New Post Submitted</b>\n\n` +
                   `• User: ${username}\n` +
                   `• Title: ${title}\n` +
                   `• Description: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}\n\n` +
                   `Please review and approve/reject this post.`;
    await this.sendAdminNotification(message);
  }

  async notifyAdminCoinRequest(username: string, amount: string, computedCoins: number): Promise<void> {
    const message = `💰 <b>New Coin Top-up Request</b>\n\n` +
                   `• User: ${username}\n` +
                   `• Amount: MVR ${amount}\n` +
                   `• Coins: ${computedCoins}\n\n` +
                   `Bank slip uploaded. Please verify and approve/reject.`;
    await this.sendAdminNotification(message);
  }

  async notifyAdminConnectionRequest(requesterName: string, targetName: string, postTitle?: string): Promise<void> {
    const message = `💌 <b>New Connection Request</b>\n\n` +
                   `• From: ${requesterName}\n` +
                   `• To: ${targetName}\n` +
                   `${postTitle ? `• Post: ${postTitle}\n` : ''}` +
                   `\nConnection request created for admin review.`;
    await this.sendAdminNotification(message);
  }

  async sendTestMessage(): Promise<void> {
    if (!this.adminChatId) {
      throw new Error('Admin chat ID not configured');
    }
    
    const message = `🤖 <b>Test Message</b>\n\nTelegram bot is working correctly!\n\nTime: ${new Date().toLocaleString()}`;
    const success = await this.sendMessage({
      chat_id: this.adminChatId,
      text: message,
      parse_mode: 'HTML'
    });
    
    if (!success) {
      throw new Error('Failed to send test message');
    }
  }

  async updateBotConfiguration(botToken?: string, adminChatId?: string): Promise<void> {
    if (botToken) this.botToken = botToken;
    if (adminChatId) this.adminChatId = adminChatId;
  }
}

export const telegramService = new TelegramService();