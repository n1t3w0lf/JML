import { NotificationService, NotificationType, NotificationPriority, NotificationStatus } from '../NotificationService';
import { PnPService } from '../PnPService';
import { MSGraphClientV3 } from '@microsoft/sp-http';

jest.mock('../PnPService');
jest.mock('@microsoft/sp-http');

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockPnPService: jest.Mocked<PnPService>;
  let mockGraphClient: jest.Mocked<MSGraphClientV3>;

  beforeEach(() => {
    mockPnPService = new PnPService({} as any) as jest.Mocked<PnPService>;
    mockGraphClient = {
      api: jest.fn().mockReturnThis(),
      post: jest.fn().mockResolvedValue({})
    } as any;

    notificationService = new NotificationService(mockPnPService, mockGraphClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('queueNotification', () => {
    it('should queue notification successfully', async () => {
      // Arrange
      const request = {
        recipientEmail: 'test@example.com',
        recipientName: 'Test User',
        subject: 'Test Subject',
        body: 'Test Body',
        notificationType: NotificationType.Email,
        priority: NotificationPriority.Normal
      };

      mockPnPService.createListItem = jest.fn().mockResolvedValue({ Id: 1 });

      // Act
      const result = await notificationService.queueNotification(request);

      // Assert
      expect(result).toBe(1);
      expect(mockPnPService.createListItem).toHaveBeenCalledWith(
        'Notifications Queue',
        expect.objectContaining({
          RecipientEmail: 'test@example.com',
          Subject: 'Test Subject',
          Status: NotificationStatus.Pending
        })
      );
    });

    it('should handle queue errors gracefully', async () => {
      // Arrange
      const request = {
        recipientEmail: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        notificationType: NotificationType.Email,
        priority: NotificationPriority.Normal
      };

      mockPnPService.createListItem = jest.fn().mockRejectedValue(new Error('Queue error'));

      // Act & Assert
      await expect(notificationService.queueNotification(request)).rejects.toThrow('Queue error');
    });
  });

  describe('sendTaskAssignmentNotification', () => {
    it('should send task assignment notification', async () => {
      // Arrange
      mockPnPService.createListItem = jest.fn().mockResolvedValue({ Id: 1 });

      // Act
      await notificationService.sendTaskAssignmentNotification(
        'assignee@example.com',
        'John Doe',
        'Complete Onboarding',
        new Date('2025-01-01'),
        'Onboarding'
      );

      // Assert
      expect(mockPnPService.createListItem).toHaveBeenCalledWith(
        'Notifications Queue',
        expect.objectContaining({
          RecipientEmail: 'assignee@example.com',
          Subject: 'New Task Assigned: Complete Onboarding'
        })
      );
    });
  });

  describe('sendTaskReminderNotification', () => {
    it('should send urgent reminder for overdue tasks', async () => {
      // Arrange
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 1);

      mockPnPService.createListItem = jest.fn().mockResolvedValue({ Id: 1 });

      // Act
      await notificationService.sendTaskReminderNotification(
        'assignee@example.com',
        'John Doe',
        'Complete Task',
        overdueDate
      );

      // Assert
      expect(mockPnPService.createListItem).toHaveBeenCalledWith(
        'Notifications Queue',
        expect.objectContaining({
          Priority: NotificationPriority.Urgent
        })
      );
    });

    it('should send high priority reminder for tasks due tomorrow', async () => {
      // Arrange
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockPnPService.createListItem = jest.fn().mockResolvedValue({ Id: 1 });

      // Act
      await notificationService.sendTaskReminderNotification(
        'assignee@example.com',
        'John Doe',
        'Complete Task',
        tomorrow
      );

      // Assert
      expect(mockPnPService.createListItem).toHaveBeenCalledWith(
        'Notifications Queue',
        expect.objectContaining({
          Priority: NotificationPriority.High
        })
      );
    });
  });

  describe('sendProcessCompletionNotification', () => {
    it('should send process completion notification to manager', async () => {
      // Arrange
      mockPnPService.createListItem = jest.fn().mockResolvedValue({ Id: 1 });

      // Act
      await notificationService.sendProcessCompletionNotification(
        'manager@example.com',
        'Jane Manager',
        'John Doe',
        'Onboarding',
        'ONB-001'
      );

      // Assert
      expect(mockPnPService.createListItem).toHaveBeenCalledWith(
        'Notifications Queue',
        expect.objectContaining({
          RecipientEmail: 'manager@example.com',
          Subject: 'Onboarding Process Completed: John Doe'
        })
      );
    });
  });
});
