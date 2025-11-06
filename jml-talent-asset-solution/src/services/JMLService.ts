import { PnPService } from './PnPService';
import { GraphService } from './GraphService';
import {
  IEmployee,
  IJMLProcess,
  IWorkflowTask,
  ProcessType,
  ProcessStatus,
  EmployeeStatus,
  JMLStatus,
  TaskStatus,
  Priority
} from '../models';
import { ErrorHandlerService, ValidationError, NotFoundError } from './ErrorHandler';

/**
 * JML Service for employee lifecycle management
 */
export class JMLService {
  private pnpService: PnPService;
  private graphService: GraphService;

  constructor(pnpService: PnPService, graphService: GraphService) {
    this.pnpService = pnpService;
    this.graphService = graphService;
  }

  /**
   * Get all active JML processes
   */
  public async getActiveProcesses(): Promise<IJMLProcess[]> {
    try {
      const items = await this.pnpService.getListItems<any>(
        'JML Processes',
        [
          'Id', 'Title', 'JMLProcessType', 'JMLProcessStatus',
          'JMLInitiatedDate', 'JMLTargetCompletion', 'JMLPriority',
          'JMLOverallProgress', 'JMLEmployeeLookup/Title', 'JMLEmployeeLookup/Id'
        ],
        "JMLProcessStatus eq 'Pending' or JMLProcessStatus eq 'In Progress'",
        'JMLTargetCompletion',
        50
      );

      return items.map(item => this.mapToJMLProcess(item));
    } catch (error) {
      ErrorHandlerService.handle(error as Error, 'JMLService.getActiveProcesses');
      throw error;
    }
  }

  /**
   * Get JML process by ID
   */
  public async getProcessById(processId: number): Promise<IJMLProcess> {
    try {
      const item = await this.pnpService.getListItemById<any>(
        'JML Processes',
        processId,
        [
          'Id', 'Title', 'JMLProcessType', 'JMLProcessStatus',
          'JMLInitiatedDate', 'JMLInitiatedBy/Title', 'JMLInitiatedBy/EMail',
          'JMLTargetCompletion', 'JMLActualCompletion', 'JMLPriority',
          'JMLCurrentStage', 'JMLOverallProgress', 'JMLNotes',
          'JMLAccessRevoked', 'JMLAssetsReturned',
          'JMLEmployeeLookup/Id', 'JMLEmployeeLookup/Title'
        ]
      );

      if (!item) {
        throw new NotFoundError('JML Process', processId);
      }

      return this.mapToJMLProcess(item);
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `JMLService.getProcessById(${processId})`);
      throw error;
    }
  }

  /**
   * Create a new onboarding process
   */
  public async createOnboardingProcess(employeeData: {
    employeeId: string;
    fullName: string;
    email: string;
    department: string;
    jobTitle: string;
    startDate: Date;
    managerId?: number;
  }): Promise<number> {
    try {
      // Validate employee data
      this.validateEmployeeData(employeeData);

      // Create employee record
      const employee = await this.createEmployeeRecord(employeeData);

      // Create JML process
      const processData = {
        Title: `ONB-${employeeData.employeeId}-${new Date().getFullYear()}`,
        JMLProcessType: ProcessType.Onboarding,
        JMLProcessStatus: ProcessStatus.Pending,
        JMLEmployeeLookupId: employee.Id,
        JMLInitiatedDate: new Date().toISOString(),
        JMLTargetCompletion: employeeData.startDate.toISOString(),
        JMLPriority: Priority.High,
        JMLCurrentStage: 'Pre-Boarding',
        JMLOverallProgress: 0,
        JMLAccessRevoked: false,
        JMLAssetsReturned: false
      };

      const process = await this.pnpService.createListItem<any>(
        'JML Processes',
        processData
      );

      // Generate onboarding tasks
      await this.generateOnboardingTasks(process.Id, employee.Id!);

      return process.Id;
    } catch (error) {
      ErrorHandlerService.handle(error as Error, 'JMLService.createOnboardingProcess');
      throw error;
    }
  }

  /**
   * Create a new offboarding process
   */
  public async createOffboardingProcess(
    employeeId: number,
    lastWorkDay: Date,
    departureReason: string
  ): Promise<number> {
    try {
      // Get employee
      const employee = await this.pnpService.getListItemById<any>(
        'Employees Master',
        employeeId
      );

      if (!employee) {
        throw new NotFoundError('Employee', employeeId);
      }

      // Create JML process
      const processData = {
        Title: `OFF-${employee.JMLEmployeeID}-${new Date().getFullYear()}`,
        JMLProcessType: ProcessType.Offboarding,
        JMLProcessStatus: ProcessStatus.Pending,
        JMLEmployeeLookupId: employeeId,
        JMLInitiatedDate: new Date().toISOString(),
        JMLTargetCompletion: lastWorkDay.toISOString(),
        JMLPriority: Priority.High,
        JMLCurrentStage: 'Knowledge Transfer',
        JMLOverallProgress: 0,
        JMLDepartureReason: departureReason,
        JMLAccessRevoked: false,
        JMLAssetsReturned: false
      };

      const process = await this.pnpService.createListItem<any>(
        'JML Processes',
        processData
      );

      // Update employee status
      await this.pnpService.updateListItem('Employees Master', employeeId, {
        JMLEmployeeStatus: EmployeeStatus.NoticePeriod,
        JMLStatus: JMLStatus.Offboarding,
        JMLEndDate: lastWorkDay.toISOString()
      });

      // Generate offboarding tasks
      await this.generateOffboardingTasks(process.Id, employeeId);

      return process.Id;
    } catch (error) {
      ErrorHandlerService.handle(error as Error, 'JMLService.createOffboardingProcess');
      throw error;
    }
  }

  /**
   * Get tasks for a JML process
   */
  public async getProcessTasks(processId: number): Promise<IWorkflowTask[]> {
    try {
      const items = await this.pnpService.getListItems<any>(
        'JML Tasks',
        [
          'Id', 'Title', 'JMLTaskCategory', 'Status',
          'JMLPriority', 'DueDate', 'CompletedDate',
          'AssignedTo/Title', 'AssignedTo/EMail'
        ],
        `JMLProcessLookupId eq ${processId}`,
        'DueDate'
      );

      return items.map(item => this.mapToWorkflowTask(item));
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `JMLService.getProcessTasks(${processId})`);
      throw error;
    }
  }

  /**
   * Update task status
   */
  public async updateTaskStatus(
    taskId: number,
    status: TaskStatus,
    completionNotes?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        Status: status
      };

      if (status === TaskStatus.Completed) {
        updateData.CompletedDate = new Date().toISOString();
        updateData.JMLCompletionNotes = completionNotes || '';
      }

      await this.pnpService.updateListItem('JML Tasks', taskId, updateData);

      // Update process overall progress
      // TODO: Calculate and update overall progress percentage
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `JMLService.updateTaskStatus(${taskId})`);
      throw error;
    }
  }

  /**
   * Complete JML process
   */
  public async completeProcess(processId: number): Promise<void> {
    try {
      // Check all tasks are completed
      const tasks = await this.getProcessTasks(processId);
      const incompleteTasks = tasks.filter(t => t.status !== TaskStatus.Completed);

      if (incompleteTasks.length > 0) {
        throw new ValidationError(
          'Process Completion',
          `${incompleteTasks.length} tasks are still incomplete`
        );
      }

      // Update process status
      await this.pnpService.updateListItem('JML Processes', processId, {
        JMLProcessStatus: ProcessStatus.Completed,
        JMLActualCompletion: new Date().toISOString(),
        JMLOverallProgress: 100
      });

      // Get process to update employee
      const process = await this.getProcessById(processId);

      // Update employee JML status
      await this.updateEmployeeJMLStatus(
        process.employee.Id!,
        JMLStatus.None
      );
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `JMLService.completeProcess(${processId})`);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async createEmployeeRecord(employeeData: any): Promise<IEmployee> {
    const data = {
      Title: employeeData.fullName,
      JMLEmployeeID: employeeData.employeeId,
      Email: employeeData.email,
      JMLDepartment: employeeData.department,
      JMLJobTitle: employeeData.jobTitle,
      JMLStartDate: employeeData.startDate.toISOString(),
      JMLEmployeeType: 'Full-time',
      JMLEmployeeStatus: EmployeeStatus.PreBoarding,
      JMLStatus: JMLStatus.Onboarding,
      JMLRehireEligible: true
    };

    if (employeeData.managerId) {
      (data as any).JMLManagerId = employeeData.managerId;
    }

    return await this.pnpService.createListItem<IEmployee>(
      'Employees Master',
      data
    );
  }

  private async generateOnboardingTasks(
    processId: number,
    employeeId: number
  ): Promise<void> {
    const currentUser = await this.pnpService.getCurrentUser();

    // Standard onboarding tasks
    const tasks = [
      {
        Title: 'Send welcome email',
        JMLProcessLookupId: processId,
        JMLEmployeeLookupId: employeeId,
        JMLTaskCategory: 'HR',
        Status: TaskStatus.NotStarted,
        JMLPriority: 'High',
        DueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day
        JMLAutoGenerated: true,
        AssignedToId: currentUser.Id
      },
      {
        Title: 'Create Entra ID account',
        JMLProcessLookupId: processId,
        JMLEmployeeLookupId: employeeId,
        JMLTaskCategory: 'IT',
        Status: TaskStatus.NotStarted,
        JMLPriority: 'Critical',
        DueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
        JMLAutoGenerated: true,
        AssignedToId: currentUser.Id
      },
      {
        Title: 'Assign Microsoft 365 licenses',
        JMLProcessLookupId: processId,
        JMLEmployeeLookupId: employeeId,
        JMLTaskCategory: 'IT',
        Status: TaskStatus.NotStarted,
        JMLPriority: 'High',
        DueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        JMLAutoGenerated: true,
        AssignedToId: currentUser.Id
      },
      {
        Title: 'Assign laptop and peripherals',
        JMLProcessLookupId: processId,
        JMLEmployeeLookupId: employeeId,
        JMLTaskCategory: 'IT',
        Status: TaskStatus.NotStarted,
        JMLPriority: 'High',
        DueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        JMLAutoGenerated: true,
        AssignedToId: currentUser.Id
      },
      {
        Title: 'Setup workspace',
        JMLProcessLookupId: processId,
        JMLEmployeeLookupId: employeeId,
        JMLTaskCategory: 'Facilities',
        Status: TaskStatus.NotStarted,
        JMLPriority: 'Medium',
        DueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        JMLAutoGenerated: true,
        AssignedToId: currentUser.Id
      }
    ];

    await this.pnpService.batchCreateItems('JML Tasks', tasks);
  }

  private async generateOffboardingTasks(
    processId: number,
    employeeId: number
  ): Promise<void> {
    const currentUser = await this.pnpService.getCurrentUser();

    const tasks = [
      {
        Title: 'Collect all company assets',
        JMLProcessLookupId: processId,
        JMLEmployeeLookupId: employeeId,
        JMLTaskCategory: 'IT',
        Status: TaskStatus.NotStarted,
        JMLPriority: 'Critical',
        DueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        JMLAutoGenerated: true,
        AssignedToId: currentUser.Id
      },
      {
        Title: 'Revoke Entra ID access',
        JMLProcessLookupId: processId,
        JMLEmployeeLookupId: employeeId,
        JMLTaskCategory: 'IT',
        Status: TaskStatus.NotStarted,
        JMLPriority: 'Critical',
        DueDate: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000).toISOString(), // Last day
        JMLAutoGenerated: true,
        AssignedToId: currentUser.Id
      },
      {
        Title: 'Remove from distribution lists',
        JMLProcessLookupId: processId,
        JMLEmployeeLookupId: employeeId,
        JMLTaskCategory: 'IT',
        Status: TaskStatus.NotStarted,
        JMLPriority: 'High',
        DueDate: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000).toISOString(),
        JMLAutoGenerated: true,
        AssignedToId: currentUser.Id
      },
      {
        Title: 'Conduct exit interview',
        JMLProcessLookupId: processId,
        JMLEmployeeLookupId: employeeId,
        JMLTaskCategory: 'HR',
        Status: TaskStatus.NotStarted,
        JMLPriority: 'Medium',
        DueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Day before last day
        JMLAutoGenerated: true,
        AssignedToId: currentUser.Id
      },
      {
        Title: 'Transfer knowledge and documents',
        JMLProcessLookupId: processId,
        JMLEmployeeLookupId: employeeId,
        JMLTaskCategory: 'Manager',
        Status: TaskStatus.NotStarted,
        JMLPriority: 'High',
        DueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days before
        JMLAutoGenerated: true,
        AssignedToId: currentUser.Id
      }
    ];

    await this.pnpService.batchCreateItems('JML Tasks', tasks);
  }

  private async updateEmployeeJMLStatus(
    employeeId: number,
    jmlStatus: JMLStatus
  ): Promise<void> {
    await this.pnpService.updateListItem('Employees Master', employeeId, {
      JMLStatus: jmlStatus
    });
  }

  private validateEmployeeData(data: any): void {
    if (!data.employeeId || data.employeeId.trim() === '') {
      throw new ValidationError('Employee ID', 'Employee ID is required');
    }

    if (!data.fullName || data.fullName.trim() === '') {
      throw new ValidationError('Full Name', 'Full name is required');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      throw new ValidationError('Email', 'Valid email address is required');
    }

    if (!data.department || data.department.trim() === '') {
      throw new ValidationError('Department', 'Department is required');
    }

    if (!data.startDate) {
      throw new ValidationError('Start Date', 'Start date is required');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private mapToJMLProcess(item: any): IJMLProcess {
    return {
      Id: item.Id,
      processId: item.Title,
      employee: {
        Id: item.JMLEmployeeLookup?.Id,
        employeeId: '',
        fullName: item.JMLEmployeeLookup?.Title || '',
        email: '',
        employeeType: undefined as any,
        department: '',
        jobTitle: '',
        startDate: new Date(),
        officeLocation: '',
        employeeStatus: EmployeeStatus.Active,
        jmlStatus: JMLStatus.None
      },
      processType: item.JMLProcessType,
      processStatus: item.JMLProcessStatus,
      initiatedDate: new Date(item.JMLInitiatedDate),
      initiatedBy: {
        Id: 0,
        Title: '',
        EMail: ''
      },
      targetCompletionDate: new Date(item.JMLTargetCompletion),
      priority: item.JMLPriority,
      currentStage: item.JMLCurrentStage,
      overallProgress: item.JMLOverallProgress || 0,
      manager: {
        Id: 0,
        Title: '',
        EMail: ''
      },
      department: item.JMLDepartment || '',
      accessRevoked: item.JMLAccessRevoked || false,
      assetsReturned: item.JMLAssetsReturned || false
    };
  }

  private mapToWorkflowTask(item: any): IWorkflowTask {
    return {
      Id: item.Id,
      title: item.Title,
      jmlProcessId: 0,
      employeeId: 0,
      taskCategory: item.JMLTaskCategory,
      assignedTo: {
        Id: item.AssignedTo?.Id || 0,
        Title: item.AssignedTo?.Title || '',
        EMail: item.AssignedTo?.EMail || ''
      },
      status: item.Status,
      priority: item.JMLPriority,
      dueDate: new Date(item.DueDate),
      taskType: '',
      autoGenerated: item.JMLAutoGenerated || false
    };
  }
}
