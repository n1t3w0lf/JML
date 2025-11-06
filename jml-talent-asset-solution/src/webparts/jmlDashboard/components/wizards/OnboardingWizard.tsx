import * as React from 'react';
import {
  TextField,
  Dropdown,
  IDropdownOption,
  DatePicker,
  PeoplePicker,
  Stack,
  Label,
  IStackTokens
} from '@fluentui/react';
import { ProcessWizard } from './ProcessWizard';
import { IProcessWizardProps, IProcessWizardState, IWizardStep, WizardStepKey } from './IProcessWizard';
import { EmployeeType, EmployeeStatus } from '../../../../models/IEmployee';
import { Priority } from '../../../../models/IJMLProcess';

interface IOnboardingFormData {
  employeeId: string;
  fullName: string;
  email: string;
  employeeType: EmployeeType;
  department: string;
  jobTitle: string;
  managerId?: number;
  startDate: Date;
  officeLocation: string;
  priority: Priority;
  hrAssignedId?: number;
  itAssignedId?: number;
  phoneNumber?: string;
  workLocationType: string;
}

const stackTokens: IStackTokens = { childrenGap: 15 };

const employeeTypeOptions: IDropdownOption[] = [
  { key: EmployeeType.FullTime, text: 'Full-Time' },
  { key: EmployeeType.PartTime, text: 'Part-Time' },
  { key: EmployeeType.Contractor, text: 'Contractor' },
  { key: EmployeeType.Intern, text: 'Intern' },
  { key: EmployeeType.Temporary, text: 'Temporary' }
];

const priorityOptions: IDropdownOption[] = [
  { key: Priority.Low, text: 'Low' },
  { key: Priority.Normal, text: 'Normal' },
  { key: Priority.High, text: 'High' },
  { key: Priority.Critical, text: 'Critical' }
];

const workLocationOptions: IDropdownOption[] = [
  { key: 'On-Site', text: 'On-Site' },
  { key: 'Remote', text: 'Remote' },
  { key: 'Hybrid', text: 'Hybrid' }
];

export class OnboardingWizard extends ProcessWizard<IProcessWizardProps, IProcessWizardState> {

  constructor(props: IProcessWizardProps) {
    super(props);
    this.state = {
      currentStep: 0,
      steps: this.getSteps(),
      isSubmitting: false,
      validationErrors: {},
      formData: {
        employeeId: '',
        fullName: '',
        email: '',
        employeeType: EmployeeType.FullTime,
        department: '',
        jobTitle: '',
        startDate: new Date(),
        officeLocation: '',
        priority: Priority.High,
        workLocationType: 'On-Site'
      } as IOnboardingFormData
    } as IProcessWizardState;
  }

  protected getSteps(): IWizardStep[] {
    return [
      {
        key: WizardStepKey.EmployeeInfo,
        label: 'Employee Information',
        isComplete: false,
        isValid: false
      },
      {
        key: WizardStepKey.ProcessDetails,
        label: 'Onboarding Details',
        isComplete: false,
        isValid: false
      },
      {
        key: WizardStepKey.TaskAssignments,
        label: 'Task Assignments',
        isComplete: false,
        isValid: false
      },
      {
        key: WizardStepKey.Review,
        label: 'Review & Submit',
        isComplete: false,
        isValid: false
      }
    ];
  }

  protected validateStep(stepKey: string): boolean {
    const { formData } = this.state;
    const errors: { [key: string]: string } = {};

    switch (stepKey) {
      case WizardStepKey.EmployeeInfo:
        if (!formData.fullName || formData.fullName.trim().length === 0) {
          errors.fullName = 'Full name is required';
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Valid email is required';
        }
        if (!formData.employeeId || formData.employeeId.trim().length === 0) {
          errors.employeeId = 'Employee ID is required';
        }
        break;

      case WizardStepKey.ProcessDetails:
        if (!formData.department || formData.department.trim().length === 0) {
          errors.department = 'Department is required';
        }
        if (!formData.jobTitle || formData.jobTitle.trim().length === 0) {
          errors.jobTitle = 'Job title is required';
        }
        if (!formData.startDate) {
          errors.startDate = 'Start date is required';
        }
        break;

      case WizardStepKey.TaskAssignments:
        // Optional validation - assignments can be done later
        break;

      case WizardStepKey.Review:
        // Final validation
        if (Object.keys(errors).length === 0) {
          return true;
        }
        break;
    }

    if (Object.keys(errors).length > 0) {
      this.setState({ validationErrors: errors } as IProcessWizardState);
      return false;
    }

    return true;
  }

  protected buildSubmissionData(): any {
    const { formData } = this.state;
    return {
      employeeData: {
        employeeId: formData.employeeId,
        fullName: formData.fullName,
        email: formData.email,
        employeeType: formData.employeeType,
        department: formData.department,
        jobTitle: formData.jobTitle,
        managerId: formData.managerId,
        startDate: formData.startDate,
        officeLocation: formData.officeLocation,
        phoneNumber: formData.phoneNumber,
        workLocationType: formData.workLocationType,
        employeeStatus: EmployeeStatus.PreBoarding
      },
      processData: {
        priority: formData.priority,
        hrAssignedId: formData.hrAssignedId,
        itAssignedId: formData.itAssignedId
      }
    };
  }

  protected renderStepContent(step: IWizardStep): React.ReactElement {
    switch (step.key) {
      case WizardStepKey.EmployeeInfo:
        return this.renderEmployeeInfoStep();
      case WizardStepKey.ProcessDetails:
        return this.renderProcessDetailsStep();
      case WizardStepKey.TaskAssignments:
        return this.renderTaskAssignmentsStep();
      case WizardStepKey.Review:
        return this.renderReviewStep();
      default:
        return <div>Unknown step</div>;
    }
  }

  private renderEmployeeInfoStep(): React.ReactElement {
    const { formData, validationErrors } = this.state;

    return (
      <Stack tokens={stackTokens}>
        <TextField
          label="Employee ID"
          required
          value={formData.employeeId}
          onChange={(_, value) => this.updateFormData('employeeId', value)}
          errorMessage={validationErrors.employeeId}
          placeholder="e.g., EMP001"
        />
        <TextField
          label="Full Name"
          required
          value={formData.fullName}
          onChange={(_, value) => this.updateFormData('fullName', value)}
          errorMessage={validationErrors.fullName}
          placeholder="e.g., John Smith"
        />
        <TextField
          label="Email"
          required
          type="email"
          value={formData.email}
          onChange={(_, value) => this.updateFormData('email', value)}
          errorMessage={validationErrors.email}
          placeholder="e.g., john.smith@company.com"
        />
        <Dropdown
          label="Employee Type"
          required
          selectedKey={formData.employeeType}
          options={employeeTypeOptions}
          onChange={(_, option) => this.updateFormData('employeeType', option?.key)}
        />
        <TextField
          label="Phone Number"
          value={formData.phoneNumber || ''}
          onChange={(_, value) => this.updateFormData('phoneNumber', value)}
          placeholder="e.g., +1 555-0123"
        />
      </Stack>
    );
  }

  private renderProcessDetailsStep(): React.ReactElement {
    const { formData, validationErrors } = this.state;

    return (
      <Stack tokens={stackTokens}>
        <TextField
          label="Department"
          required
          value={formData.department}
          onChange={(_, value) => this.updateFormData('department', value)}
          errorMessage={validationErrors.department}
          placeholder="e.g., Engineering"
        />
        <TextField
          label="Job Title"
          required
          value={formData.jobTitle}
          onChange={(_, value) => this.updateFormData('jobTitle', value)}
          errorMessage={validationErrors.jobTitle}
          placeholder="e.g., Software Engineer"
        />
        <DatePicker
          label="Start Date"
          isRequired
          value={formData.startDate}
          onSelectDate={(date) => this.updateFormData('startDate', date)}
          placeholder="Select start date"
        />
        <TextField
          label="Office Location"
          value={formData.officeLocation}
          onChange={(_, value) => this.updateFormData('officeLocation', value)}
          placeholder="e.g., New York Office"
        />
        <Dropdown
          label="Work Location Type"
          selectedKey={formData.workLocationType}
          options={workLocationOptions}
          onChange={(_, option) => this.updateFormData('workLocationType', option?.key)}
        />
        <Dropdown
          label="Process Priority"
          required
          selectedKey={formData.priority}
          options={priorityOptions}
          onChange={(_, option) => this.updateFormData('priority', option?.key)}
        />
      </Stack>
    );
  }

  private renderTaskAssignmentsStep(): React.ReactElement {
    return (
      <Stack tokens={stackTokens}>
        <Label>Assign process coordinators (optional - can be assigned later)</Label>
        {/* Note: PeoplePicker requires context - simplified for now */}
        <TextField
          label="HR Coordinator"
          placeholder="Will be assigned based on department"
          disabled
        />
        <TextField
          label="IT Coordinator"
          placeholder="Will be assigned based on default rules"
          disabled
        />
        <TextField
          label="Direct Manager"
          placeholder="Enter manager name or email"
          onChange={(_, value) => this.updateFormData('managerEmail', value)}
        />
      </Stack>
    );
  }

  private renderReviewStep(): React.ReactElement {
    const { formData } = this.state;

    return (
      <Stack tokens={stackTokens}>
        <Label>Review the information below before creating the onboarding process:</Label>

        <Stack tokens={{ childrenGap: 10 }}>
          <div><strong>Employee ID:</strong> {formData.employeeId}</div>
          <div><strong>Full Name:</strong> {formData.fullName}</div>
          <div><strong>Email:</strong> {formData.email}</div>
          <div><strong>Employee Type:</strong> {formData.employeeType}</div>
          <div><strong>Department:</strong> {formData.department}</div>
          <div><strong>Job Title:</strong> {formData.jobTitle}</div>
          <div><strong>Start Date:</strong> {formData.startDate?.toLocaleDateString()}</div>
          <div><strong>Office Location:</strong> {formData.officeLocation || 'Not specified'}</div>
          <div><strong>Work Location:</strong> {formData.workLocationType}</div>
          <div><strong>Priority:</strong> {formData.priority}</div>
        </Stack>
      </Stack>
    );
  }
}
