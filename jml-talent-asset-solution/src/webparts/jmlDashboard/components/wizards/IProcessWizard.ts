import { ProcessType } from '../../../../models/IJMLProcess';

export interface IWizardStep {
  key: string;
  label: string;
  isComplete: boolean;
  isValid: boolean;
}

export interface IProcessWizardProps {
  isOpen: boolean;
  processType: ProcessType;
  employeeId?: number;
  onDismiss: () => void;
  onSubmit: (processData: any) => Promise<void>;
}

export interface IProcessWizardState {
  currentStep: number;
  steps: IWizardStep[];
  isSubmitting: boolean;
  validationErrors: { [key: string]: string };
  formData: any;
}

export enum WizardStepKey {
  EmployeeInfo = 'employeeInfo',
  ProcessDetails = 'processDetails',
  TaskAssignments = 'taskAssignments',
  Review = 'review'
}
