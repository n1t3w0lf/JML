import { IEmployee, IUserInfo } from './IEmployee';

/**
 * JML Process entity representing an onboarding, transfer, or offboarding process
 */
export interface IJMLProcess {
  Id?: number;
  processId: string;
  employee: IEmployee;
  processType: ProcessType;
  processStatus: ProcessStatus;
  initiatedDate: Date;
  initiatedBy: IUserInfo;
  targetCompletionDate: Date;
  actualCompletionDate?: Date;
  priority: Priority;
  currentStage?: string;
  overallProgress: number;
  hrAssigned?: IUserInfo;
  itAssigned?: IUserInfo;
  manager: IUserInfo;
  department: string;
  notes?: string;
  blockers?: string;

  // For Transfer processes
  oldDepartment?: string;
  newDepartment?: string;
  oldJobTitle?: string;
  newJobTitle?: string;

  // For Offboarding processes
  departureReason?: DepartureReason;
  exitInterviewCompleted?: boolean;
  accessRevoked?: boolean;
  assetsReturned?: boolean;
}

export enum ProcessType {
  Onboarding = "Onboarding",
  Transfer = "Transfer",
  Offboarding = "Offboarding"
}

export enum ProcessStatus {
  Pending = "Pending",
  InProgress = "In Progress",
  Completed = "Completed",
  OnHold = "On Hold",
  Cancelled = "Cancelled"
}

export enum Priority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Urgent = "Urgent"
}

export enum DepartureReason {
  Resignation = "Resignation",
  Termination = "Termination",
  Retirement = "Retirement",
  EndOfContract = "End of Contract"
}
