import { PnPService } from './PnPService';
import { ErrorHandlerService } from './ErrorHandler';

export enum UserRole {
  SystemAdmin = 'System Administrator',
  HRManager = 'HR Manager',
  HRCoordinator = 'HR Coordinator',
  ITManager = 'IT Manager',
  ITCoordinator = 'IT Coordinator',
  DepartmentManager = 'Department Manager',
  Employee = 'Employee',
  ReadOnly = 'Read Only'
}

export enum Permission {
  // Employee permissions
  ViewEmployee = 'ViewEmployee',
  CreateEmployee = 'CreateEmployee',
  EditEmployee = 'EditEmployee',
  DeleteEmployee = 'DeleteEmployee',

  // Process permissions
  ViewProcess = 'ViewProcess',
  CreateProcess = 'CreateProcess',
  EditProcess = 'EditProcess',
  DeleteProcess = 'DeleteProcess',
  ApproveProcess = 'ApproveProcess',

  // Task permissions
  ViewTask = 'ViewTask',
  CreateTask = 'CreateTask',
  EditTask = 'EditTask',
  DeleteTask = 'DeleteTask',
  CompleteTask = 'CompleteTask',

  // Asset permissions
  ViewAsset = 'ViewAsset',
  CreateAsset = 'CreateAsset',
  EditAsset = 'EditAsset',
  DeleteAsset = 'DeleteAsset',
  AssignAsset = 'AssignAsset',

  // Talent permissions
  ViewTalent = 'ViewTalent',
  EditTalent = 'EditTalent',

  // Admin permissions
  ManageUsers = 'ManageUsers',
  ManageRoles = 'ManageRoles',
  ViewAuditLog = 'ViewAuditLog',
  ManageSettings = 'ManageSettings'
}

export interface IUserPermissions {
  userId: number;
  userEmail: string;
  roles: UserRole[];
  permissions: Permission[];
  department?: string;
  isManager: boolean;
}

export interface ISecurityContext {
  currentUser: IUserPermissions;
  canView: (resourceType: string, resourceId?: number) => boolean;
  canEdit: (resourceType: string, resourceId?: number) => boolean;
  canDelete: (resourceType: string, resourceId?: number) => boolean;
  canCreate: (resourceType: string) => boolean;
}

/**
 * Role-Based Access Control (RBAC) Service
 */
export class SecurityService {
  private pnpService: PnPService;
  private currentUserPermissions: IUserPermissions | null = null;
  private permissionCache: Map<string, boolean> = new Map();

  // Define role-permission mappings
  private static readonly ROLE_PERMISSIONS: Map<UserRole, Permission[]> = new Map([
    [UserRole.SystemAdmin, [
      Permission.ViewEmployee, Permission.CreateEmployee, Permission.EditEmployee, Permission.DeleteEmployee,
      Permission.ViewProcess, Permission.CreateProcess, Permission.EditProcess, Permission.DeleteProcess, Permission.ApproveProcess,
      Permission.ViewTask, Permission.CreateTask, Permission.EditTask, Permission.DeleteTask, Permission.CompleteTask,
      Permission.ViewAsset, Permission.CreateAsset, Permission.EditAsset, Permission.DeleteAsset, Permission.AssignAsset,
      Permission.ViewTalent, Permission.EditTalent,
      Permission.ManageUsers, Permission.ManageRoles, Permission.ViewAuditLog, Permission.ManageSettings
    ]],
    [UserRole.HRManager, [
      Permission.ViewEmployee, Permission.CreateEmployee, Permission.EditEmployee, Permission.DeleteEmployee,
      Permission.ViewProcess, Permission.CreateProcess, Permission.EditProcess, Permission.ApproveProcess,
      Permission.ViewTask, Permission.CreateTask, Permission.EditTask, Permission.CompleteTask,
      Permission.ViewAsset, Permission.ViewTalent, Permission.EditTalent,
      Permission.ViewAuditLog
    ]],
    [UserRole.HRCoordinator, [
      Permission.ViewEmployee, Permission.CreateEmployee, Permission.EditEmployee,
      Permission.ViewProcess, Permission.CreateProcess, Permission.EditProcess,
      Permission.ViewTask, Permission.CreateTask, Permission.EditTask, Permission.CompleteTask,
      Permission.ViewAsset, Permission.ViewTalent
    ]],
    [UserRole.ITManager, [
      Permission.ViewEmployee, Permission.ViewProcess,
      Permission.ViewTask, Permission.CreateTask, Permission.EditTask, Permission.CompleteTask,
      Permission.ViewAsset, Permission.CreateAsset, Permission.EditAsset, Permission.AssignAsset
    ]],
    [UserRole.ITCoordinator, [
      Permission.ViewEmployee, Permission.ViewProcess,
      Permission.ViewTask, Permission.EditTask, Permission.CompleteTask,
      Permission.ViewAsset, Permission.CreateAsset, Permission.EditAsset, Permission.AssignAsset
    ]],
    [UserRole.DepartmentManager, [
      Permission.ViewEmployee, Permission.ViewProcess, Permission.CreateProcess, Permission.ApproveProcess,
      Permission.ViewTask, Permission.CompleteTask,
      Permission.ViewAsset, Permission.ViewTalent
    ]],
    [UserRole.Employee, [
      Permission.ViewTask, Permission.CompleteTask,
      Permission.ViewTalent
    ]],
    [UserRole.ReadOnly, [
      Permission.ViewEmployee, Permission.ViewProcess, Permission.ViewTask, Permission.ViewAsset, Permission.ViewTalent
    ]]
  ]);

  constructor(pnpService: PnPService) {
    this.pnpService = pnpService;
  }

  /**
   * Initialize security context for current user
   */
  public async initializeSecurityContext(): Promise<ISecurityContext> {
    try {
      const currentUser = await this.pnpService.getCurrentUser();
      const userPermissions = await this.getUserPermissions(currentUser.Id, currentUser.Email);
      this.currentUserPermissions = userPermissions;

      return {
        currentUser: userPermissions,
        canView: (resourceType, resourceId) => this.canView(resourceType, resourceId),
        canEdit: (resourceType, resourceId) => this.canEdit(resourceType, resourceId),
        canDelete: (resourceType, resourceId) => this.canDelete(resourceType, resourceId),
        canCreate: (resourceType) => this.canCreate(resourceType)
      };
    } catch (error) {
      ErrorHandlerService.handle(error as Error, 'SecurityService.initializeSecurityContext');
      throw error;
    }
  }

  /**
   * Get user permissions based on roles
   */
  public async getUserPermissions(userId: number, userEmail: string): Promise<IUserPermissions> {
    try {
      const roles = await this.getUserRoles(userId);
      const permissions = this.getPermissionsForRoles(roles);

      // Check if user is a manager
      const isManager = await this.isUserManager(userId);

      return {
        userId,
        userEmail,
        roles,
        permissions,
        isManager
      };
    } catch (error) {
      ErrorHandlerService.handle(error as Error, 'SecurityService.getUserPermissions');

      // Return minimal permissions on error
      return {
        userId,
        userEmail,
        roles: [UserRole.Employee],
        permissions: SecurityService.ROLE_PERMISSIONS.get(UserRole.Employee) || [],
        isManager: false
      };
    }
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(permission: Permission): boolean {
    if (!this.currentUserPermissions) {
      return false;
    }
    return this.currentUserPermissions.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified roles
   */
  public hasRole(roles: UserRole | UserRole[]): boolean {
    if (!this.currentUserPermissions) {
      return false;
    }

    const rolesToCheck = Array.isArray(roles) ? roles : [roles];
    return rolesToCheck.some(role => this.currentUserPermissions!.roles.includes(role));
  }

  /**
   * Check view permission for resource
   */
  public canView(resourceType: string, resourceId?: number): boolean {
    const cacheKey = `view_${resourceType}_${resourceId || 'all'}`;
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    let canView = false;

    switch (resourceType.toLowerCase()) {
      case 'employee':
        canView = this.hasPermission(Permission.ViewEmployee);
        break;
      case 'process':
        canView = this.hasPermission(Permission.ViewProcess);
        break;
      case 'task':
        canView = this.hasPermission(Permission.ViewTask);
        break;
      case 'asset':
        canView = this.hasPermission(Permission.ViewAsset);
        break;
      case 'talent':
        canView = this.hasPermission(Permission.ViewTalent);
        break;
      default:
        canView = false;
    }

    this.permissionCache.set(cacheKey, canView);
    return canView;
  }

  /**
   * Check edit permission for resource
   */
  public canEdit(resourceType: string, resourceId?: number): boolean {
    const cacheKey = `edit_${resourceType}_${resourceId || 'all'}`;
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    let canEdit = false;

    switch (resourceType.toLowerCase()) {
      case 'employee':
        canEdit = this.hasPermission(Permission.EditEmployee);
        break;
      case 'process':
        canEdit = this.hasPermission(Permission.EditProcess);
        break;
      case 'task':
        canEdit = this.hasPermission(Permission.EditTask);
        break;
      case 'asset':
        canEdit = this.hasPermission(Permission.EditAsset);
        break;
      case 'talent':
        canEdit = this.hasPermission(Permission.EditTalent);
        break;
      default:
        canEdit = false;
    }

    this.permissionCache.set(cacheKey, canEdit);
    return canEdit;
  }

  /**
   * Check delete permission for resource
   */
  public canDelete(resourceType: string, resourceId?: number): boolean {
    switch (resourceType.toLowerCase()) {
      case 'employee':
        return this.hasPermission(Permission.DeleteEmployee);
      case 'process':
        return this.hasPermission(Permission.DeleteProcess);
      case 'task':
        return this.hasPermission(Permission.DeleteTask);
      case 'asset':
        return this.hasPermission(Permission.DeleteAsset);
      default:
        return false;
    }
  }

  /**
   * Check create permission for resource
   */
  public canCreate(resourceType: string): boolean {
    switch (resourceType.toLowerCase()) {
      case 'employee':
        return this.hasPermission(Permission.CreateEmployee);
      case 'process':
        return this.hasPermission(Permission.CreateProcess);
      case 'task':
        return this.hasPermission(Permission.CreateTask);
      case 'asset':
        return this.hasPermission(Permission.CreateAsset);
      default:
        return false;
    }
  }

  /**
   * Get user roles from SharePoint groups
   */
  private async getUserRoles(userId: number): Promise<UserRole[]> {
    const roles: UserRole[] = [];

    // Check SharePoint group membership
    const groupMemberships = [
      { group: 'JML System Administrators', role: UserRole.SystemAdmin },
      { group: 'JML HR Managers', role: UserRole.HRManager },
      { group: 'JML HR Coordinators', role: UserRole.HRCoordinator },
      { group: 'JML IT Managers', role: UserRole.ITManager },
      { group: 'JML IT Coordinators', role: UserRole.ITCoordinator },
      { group: 'JML Department Managers', role: UserRole.DepartmentManager },
      { group: 'JML Read Only', role: UserRole.ReadOnly }
    ];

    for (const membership of groupMemberships) {
      const isInGroup = await this.pnpService.isUserInGroup(membership.group);
      if (isInGroup) {
        roles.push(membership.role);
      }
    }

    // Default to Employee role if no other roles found
    if (roles.length === 0) {
      roles.push(UserRole.Employee);
    }

    return roles;
  }

  /**
   * Get aggregated permissions for all user roles
   */
  private getPermissionsForRoles(roles: UserRole[]): Permission[] {
    const permissionSet = new Set<Permission>();

    roles.forEach(role => {
      const rolePermissions = SecurityService.ROLE_PERMISSIONS.get(role) || [];
      rolePermissions.forEach(permission => permissionSet.add(permission));
    });

    return Array.from(permissionSet);
  }

  /**
   * Check if user is a manager
   */
  private async isUserManager(userId: number): Promise<boolean> {
    try {
      // Check if user has any employees reporting to them
      const directReports = await this.pnpService.getListItems(
        'Employees',
        ['Id'],
        `JMLManager/Id eq ${userId}`,
        undefined,
        1
      );

      return directReports.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear permission cache
   */
  public clearCache(): void {
    this.permissionCache.clear();
  }

  /**
   * Log security event to audit log
   */
  public async logSecurityEvent(
    eventType: string,
    resourceType: string,
    resourceId: number,
    action: string,
    success: boolean
  ): Promise<void> {
    try {
      await this.pnpService.createListItem('Audit Log', {
        Title: `Security Event: ${eventType}`,
        EventType: 'Security',
        EventDetails: JSON.stringify({
          resourceType,
          resourceId,
          action,
          success,
          userId: this.currentUserPermissions?.userId,
          userEmail: this.currentUserPermissions?.userEmail
        }),
        EventDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}
