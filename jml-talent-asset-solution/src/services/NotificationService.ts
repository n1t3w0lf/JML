import { PnPService } from './PnPService';
import { ErrorHandlerService, fetchWithRetry } from './ErrorHandler';
import { MSGraphClientV3 } from '@microsoft/sp-http';

export enum NotificationType {
  Email = 'Email',
  SystemAlert = 'SystemAlert',
  Teams = 'Teams'
}

export enum NotificationPriority {
  Low = 'Low',
  Normal = 'Normal',
  High = 'High',
  Urgent = 'Urgent'
}

export enum NotificationStatus {
  Pending = 'Pending',
  Sent = 'Sent',
  Failed = 'Failed',
  Cancelled = 'Cancelled'
}

export interface INotificationRequest {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  notificationType: NotificationType;
  priority: NotificationPriority;
  relatedProcessId?: number;
  relatedTaskId?: number;
  ccRecipients?: string[];
  attachments?: IEmailAttachment[];
}

export interface IEmailAttachment {
  name: string;
  contentType: string;
  contentBytes: string; // Base64 encoded
}

export interface INotificationQueueItem {
  Id?: number;
  Title: string;
  RecipientEmail: string;
  RecipientName?: string;
  Subject: string;
  Body: string;
  NotificationType: NotificationType;
  Priority: NotificationPriority;
  Status: NotificationStatus;
  ScheduledDate: string;
  SentDate?: string;
  RetryCount: number;
  ErrorMessage?: string;
  RelatedProcessId?: number;
  RelatedTaskId?: number;
}

/**
 * Service for managing notifications (emails, Teams messages, system alerts)
 */
export class NotificationService {
  private pnpService: PnPService;
  private graphClient: MSGraphClientV3;
  private readonly MAX_RETRIES = 3;
  private readonly QUEUE_LIST = 'Notifications Queue';

  constructor(pnpService: PnPService, graphClient: MSGraphClientV3) {
    this.pnpService = pnpService;
    this.graphClient = graphClient;
  }

  /**
   * Send an email notification immediately
   */
  public async sendEmail(request: INotificationRequest): Promise<void> {
    try {
      const message = this.buildEmailMessage(request);

      await fetchWithRetry(() =>
        this.graphClient
          .api('/me/sendMail')
          .post({
            message,
            saveToSentItems: true
          })
      );

      // Log successful send
      await this.logNotification(request, NotificationStatus.Sent);
    } catch (error) {
      ErrorHandlerService.handle(error as Error, 'NotificationService.sendEmail');

      // Queue for retry
      await this.queueNotification(request, NotificationStatus.Failed, (error as Error).message);
      throw error;
    }
  }

  /**
   * Queue a notification for later processing
   */
  public async queueNotification(
    request: INotificationRequest,
    status: NotificationStatus = NotificationStatus.Pending,
    errorMessage?: string
  ): Promise<number> {
    try {
      const queueItem: INotificationQueueItem = {
        Title: `${request.notificationType} - ${request.subject}`,
        RecipientEmail: request.recipientEmail,
        RecipientName: request.recipientName,
        Subject: request.subject,
        Body: request.body,
        NotificationType: request.notificationType,
        Priority: request.priority,
        Status: status,
        ScheduledDate: new Date().toISOString(),
        RetryCount: 0,
        ErrorMessage: errorMessage,
        RelatedProcessId: request.relatedProcessId,
        RelatedTaskId: request.relatedTaskId
      };

      const result = await this.pnpService.createListItem<INotificationQueueItem>(
        this.QUEUE_LIST,
        queueItem
      );

      return result.Id!;
    } catch (error) {
      ErrorHandlerService.handle(error as Error, 'NotificationService.queueNotification');
      throw error;
    }
  }

  /**
   * Process pending notifications from queue
   */
  public async processPendingNotifications(): Promise<void> {
    try {
      const pendingNotifications = await this.pnpService.getListItems<INotificationQueueItem>(
        this.QUEUE_LIST,
        undefined,
        `Status eq '${NotificationStatus.Pending}' or Status eq '${NotificationStatus.Failed}'`,
        'Priority desc, ScheduledDate asc',
        50
      );

      for (const notification of pendingNotifications) {
        await this.processQueuedNotification(notification);
      }
    } catch (error) {
      ErrorHandlerService.handle(error as Error, 'NotificationService.processPendingNotifications');
    }
  }

  /**
   * Send task assignment notification
   */
  public async sendTaskAssignmentNotification(
    assigneeEmail: string,
    assigneeName: string,
    taskTitle: string,
    taskDueDate: Date,
    processType: string
  ): Promise<void> {
    const body = `
      <p>Hello ${assigneeName},</p>
      <p>You have been assigned a new task:</p>
      <ul>
        <li><strong>Task:</strong> ${taskTitle}</li>
        <li><strong>Process Type:</strong> ${processType}</li>
        <li><strong>Due Date:</strong> ${taskDueDate.toLocaleDateString()}</li>
      </ul>
      <p>Please log in to the JML system to view task details and mark it complete when done.</p>
      <p>Thank you,<br/>JML System</p>
    `;

    await this.queueNotification({
      recipientEmail: assigneeEmail,
      recipientName: assigneeName,
      subject: `New Task Assigned: ${taskTitle}`,
      body,
      notificationType: NotificationType.Email,
      priority: NotificationPriority.Normal
    });
  }

  /**
   * Send task reminder notification
   */
  public async sendTaskReminderNotification(
    assigneeEmail: string,
    assigneeName: string,
    taskTitle: string,
    taskDueDate: Date
  ): Promise<void> {
    const daysUntilDue = Math.ceil((taskDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const urgency = daysUntilDue <= 0 ? 'OVERDUE' : daysUntilDue === 1 ? 'due tomorrow' : `due in ${daysUntilDue} days`;

    const body = `
      <p>Hello ${assigneeName},</p>
      <p><strong>Reminder:</strong> You have a task that is ${urgency}:</p>
      <ul>
        <li><strong>Task:</strong> ${taskTitle}</li>
        <li><strong>Due Date:</strong> ${taskDueDate.toLocaleDateString()}</li>
      </ul>
      <p>Please complete this task as soon as possible.</p>
      <p>Thank you,<br/>JML System</p>
    `;

    await this.queueNotification({
      recipientEmail: assigneeEmail,
      recipientName: assigneeName,
      subject: `Task Reminder: ${taskTitle}`,
      body,
      notificationType: NotificationType.Email,
      priority: daysUntilDue <= 0 ? NotificationPriority.Urgent : NotificationPriority.High
    });
  }

  /**
   * Send process completion notification
   */
  public async sendProcessCompletionNotification(
    managerEmail: string,
    managerName: string,
    employeeName: string,
    processType: string,
    processId: string
  ): Promise<void> {
    const body = `
      <p>Hello ${managerName},</p>
      <p>The ${processType} process for ${employeeName} (${processId}) has been completed.</p>
      <p>All tasks have been finished and the process is now closed.</p>
      <p>Thank you,<br/>JML System</p>
    `;

    await this.queueNotification({
      recipientEmail: managerEmail,
      recipientName: managerName,
      subject: `${processType} Process Completed: ${employeeName}`,
      body,
      notificationType: NotificationType.Email,
      priority: NotificationPriority.Normal
    });
  }

  /**
   * Build email message for Microsoft Graph API
   */
  private buildEmailMessage(request: INotificationRequest): any {
    const message: any = {
      subject: request.subject,
      body: {
        contentType: 'HTML',
        content: request.body
      },
      toRecipients: [
        {
          emailAddress: {
            address: request.recipientEmail,
            name: request.recipientName
          }
        }
      ]
    };

    if (request.ccRecipients && request.ccRecipients.length > 0) {
      message.ccRecipients = request.ccRecipients.map(email => ({
        emailAddress: { address: email }
      }));
    }

    if (request.attachments && request.attachments.length > 0) {
      message.attachments = request.attachments.map(att => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.name,
        contentType: att.contentType,
        contentBytes: att.contentBytes
      }));
    }

    return message;
  }

  /**
   * Process a single queued notification
   */
  private async processQueuedNotification(notification: INotificationQueueItem): Promise<void> {
    try {
      if (notification.RetryCount >= this.MAX_RETRIES) {
        await this.pnpService.updateListItem(this.QUEUE_LIST, notification.Id!, {
          Status: NotificationStatus.Cancelled,
          ErrorMessage: 'Max retries exceeded'
        });
        return;
      }

      const request: INotificationRequest = {
        recipientEmail: notification.RecipientEmail,
        recipientName: notification.RecipientName,
        subject: notification.Subject,
        body: notification.Body,
        notificationType: notification.NotificationType,
        priority: notification.Priority
      };

      await this.sendEmail(request);

      await this.pnpService.updateListItem(this.QUEUE_LIST, notification.Id!, {
        Status: NotificationStatus.Sent,
        SentDate: new Date().toISOString()
      });
    } catch (error) {
      await this.pnpService.updateListItem(this.QUEUE_LIST, notification.Id!, {
        Status: NotificationStatus.Failed,
        RetryCount: notification.RetryCount + 1,
        ErrorMessage: (error as Error).message
      });
    }
  }

  /**
   * Log notification to audit trail
   */
  private async logNotification(request: INotificationRequest, status: NotificationStatus): Promise<void> {
    try {
      await this.pnpService.createListItem('Audit Log', {
        Title: `Notification: ${request.subject}`,
        EventType: 'Notification',
        EventDetails: JSON.stringify({
          recipient: request.recipientEmail,
          type: request.notificationType,
          status
        }),
        EventDate: new Date().toISOString()
      });
    } catch (error) {
      // Don't throw - logging failure shouldn't block notification
      console.error('Failed to log notification:', error);
    }
  }
}
