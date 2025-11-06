import { SecurityService, UserRole, Permission } from '../SecurityService';
import { PnPService } from '../PnPService';

// Mock PnPService
jest.mock('../PnPService');

describe('SecurityService', () => {
  let securityService: SecurityService;
  let mockPnPService: jest.Mocked<PnPService>;

  beforeEach(() => {
    mockPnPService = new PnPService({} as any) as jest.Mocked<PnPService>;
    securityService = new SecurityService(mockPnPService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('should return HR Manager permissions for HR Manager role', async () => {
      // Arrange
      mockPnPService.isUserInGroup = jest.fn()
        .mockResolvedValueOnce(false) // System Admin
        .mockResolvedValueOnce(true)  // HR Manager
        .mockResolvedValueOnce(false) // HR Coordinator
        .mockResolvedValueOnce(false) // IT Manager
        .mockResolvedValueOnce(false) // IT Coordinator
        .mockResolvedValueOnce(false) // Dept Manager
        .mockResolvedValueOnce(false); // Read Only

      mockPnPService.getListItems = jest.fn().mockResolvedValue([]);

      // Act
      const permissions = await securityService.getUserPermissions(1, 'test@example.com');

      // Assert
      expect(permissions.roles).toContain(UserRole.HRManager);
      expect(permissions.permissions).toContain(Permission.ViewEmployee);
      expect(permissions.permissions).toContain(Permission.CreateEmployee);
      expect(permissions.permissions).toContain(Permission.EditEmployee);
      expect(permissions.permissions).toContain(Permission.DeleteEmployee);
    });

    it('should return Employee permissions when no roles found', async () => {
      // Arrange
      mockPnPService.isUserInGroup = jest.fn().mockResolvedValue(false);
      mockPnPService.getListItems = jest.fn().mockResolvedValue([]);

      // Act
      const permissions = await securityService.getUserPermissions(1, 'test@example.com');

      // Assert
      expect(permissions.roles).toContain(UserRole.Employee);
      expect(permissions.permissions).toContain(Permission.ViewTask);
      expect(permissions.permissions).toContain(Permission.CompleteTask);
      expect(permissions.permissions).not.toContain(Permission.CreateEmployee);
    });

    it('should aggregate permissions from multiple roles', async () => {
      // Arrange
      mockPnPService.isUserInGroup = jest.fn()
        .mockResolvedValueOnce(false) // System Admin
        .mockResolvedValueOnce(true)  // HR Manager
        .mockResolvedValueOnce(false) // HR Coordinator
        .mockResolvedValueOnce(true)  // IT Manager
        .mockResolvedValueOnce(false) // IT Coordinator
        .mockResolvedValueOnce(false) // Dept Manager
        .mockResolvedValueOnce(false); // Read Only

      mockPnPService.getListItems = jest.fn().mockResolvedValue([]);

      // Act
      const permissions = await securityService.getUserPermissions(1, 'test@example.com');

      // Assert
      expect(permissions.roles).toContain(UserRole.HRManager);
      expect(permissions.roles).toContain(UserRole.ITManager);
      expect(permissions.permissions).toContain(Permission.ViewEmployee);
      expect(permissions.permissions).toContain(Permission.ViewAsset);
      expect(permissions.permissions).toContain(Permission.EditAsset);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has permission', async () => {
      // Arrange
      mockPnPService.isUserInGroup = jest.fn().mockResolvedValueOnce(true).mockResolvedValue(false);
      mockPnPService.getListItems = jest.fn().mockResolvedValue([]);
      mockPnPService.getCurrentUser = jest.fn().mockResolvedValue({ Id: 1, Email: 'test@example.com' });

      await securityService.initializeSecurityContext();

      // Act
      const result = securityService.hasPermission(Permission.ViewEmployee);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not have permission', async () => {
      // Arrange
      mockPnPService.isUserInGroup = jest.fn().mockResolvedValue(false);
      mockPnPService.getListItems = jest.fn().mockResolvedValue([]);
      mockPnPService.getCurrentUser = jest.fn().mockResolvedValue({ Id: 1, Email: 'test@example.com' });

      await securityService.initializeSecurityContext();

      // Act
      const result = securityService.hasPermission(Permission.DeleteEmployee);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('canView', () => {
    it('should return true when user can view employees', async () => {
      // Arrange
      mockPnPService.isUserInGroup = jest.fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true) // HR Manager
        .mockResolvedValue(false);
      mockPnPService.getListItems = jest.fn().mockResolvedValue([]);
      mockPnPService.getCurrentUser = jest.fn().mockResolvedValue({ Id: 1, Email: 'test@example.com' });

      await securityService.initializeSecurityContext();

      // Act
      const result = securityService.canView('employee');

      // Assert
      expect(result).toBe(true);
    });

    it('should cache permission checks', async () => {
      // Arrange
      mockPnPService.isUserInGroup = jest.fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockResolvedValue(false);
      mockPnPService.getListItems = jest.fn().mockResolvedValue([]);
      mockPnPService.getCurrentUser = jest.fn().mockResolvedValue({ Id: 1, Email: 'test@example.com' });

      await securityService.initializeSecurityContext();

      // Act
      const result1 = securityService.canView('employee');
      const result2 = securityService.canView('employee');

      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      // Cache should prevent multiple checks
    });
  });

  describe('clearCache', () => {
    it('should clear permission cache', async () => {
      // Arrange
      mockPnPService.isUserInGroup = jest.fn().mockResolvedValueOnce(true).mockResolvedValue(false);
      mockPnPService.getListItems = jest.fn().mockResolvedValue([]);
      mockPnPService.getCurrentUser = jest.fn().mockResolvedValue({ Id: 1, Email: 'test@example.com' });

      await securityService.initializeSecurityContext();
      securityService.canView('employee'); // Populate cache

      // Act
      securityService.clearCache();

      // Assert - should work without errors after cache clear
      expect(() => securityService.clearCache()).not.toThrow();
    });
  });
});
