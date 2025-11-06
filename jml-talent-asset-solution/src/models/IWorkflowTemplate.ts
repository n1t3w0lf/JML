import { ProcessType } from './IJMLProcess';
import { TaskCategory, Priority } from './IJMLTask';

export interface IWorkflowTemplate {
  Id?: number;
  templateId: string;
  templateName: string;
  description: string;
  processType: ProcessType;
  isActive: boolean;
  department?: string; // Department-specific template
  employeeType?: string; // Employee type-specific template
  priority: Priority;
  tasks: IWorkflowTaskTemplate[];
  estimatedDurationDays: number;
  createdDate: Date;
  modifiedDate: Date;
}

export interface IWorkflowTaskTemplate {
  Id?: number;
  taskTemplateId: string;
  workflowTemplateId: string;
  title: string;
  description: string;
  taskCategory: TaskCategory;
  priority: Priority;
  sequenceOrder: number;
  daysOffset: number; // Days from process start date
  estimatedHours: number;
  isRequired: boolean;
  dependencies?: string[]; // Task template IDs this depends on
  assignmentRule: TaskAssignmentRule;
  assigneeRole?: string; // Role to assign to (HR, IT, Manager, etc.)
  assigneeEmail?: string; // Specific email if assignmentRule is Specific
  requiresApproval: boolean;
  autoComplete: boolean; // Auto-complete if dependencies met
  notifyOnAssignment: boolean;
  notifyBeforeDueDays?: number; // Send reminder X days before due
  instructions?: string;
}

export enum TaskAssignmentRule {
  Specific = 'Specific', // Assigned to specific person
  Role = 'Role', // Assigned based on role (HR Coordinator, IT Admin, etc.)
  Manager = 'Manager', // Assigned to employee's manager
  Department = 'Department', // Assigned to department coordinator
  HRCoordinator = 'HRCoordinator',
  ITCoordinator = 'ITCoordinator',
  FacilitiesCoordinator = 'FacilitiesCoordinator',
  FinanceCoordinator = 'FinanceCoordinator',
  Employee = 'Employee' // Assigned to the employee themselves
}
