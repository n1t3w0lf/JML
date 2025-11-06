import * as React from 'react';
import { TextField, Dropdown, IDropdownOption, DatePicker, Stack, Label, IStackTokens } from '@fluentui/react';
import { ProcessWizard } from './ProcessWizard';
import { IProcessWizardProps, IProcessWizardState, IWizardStep, WizardStepKey } from './IProcessWizard';
import { Priority } from '../../../../models/IJMLProcess';

interface ITransferFormData {
  employeeLookupId: number;
  oldDepartment: string;
  newDepartment: string;
  oldJobTitle: string;
  newJobTitle: string;
  effectiveDate: Date;
  priority: Priority;
  reason: string;
  newManager?: number;
  newOfficeLocation?: string;
}

const stackTokens: IStackTokens = { childrenGap: 15 };

const priorityOptions: IDropdownOption[] = [
  { key: Priority.Low, text: 'Low' },
  { key: Priority.Normal, text: 'Normal' },
  { key: Priority.High, text: 'High' },
  { key: Priority.Critical, text: 'Critical' }
];

export class TransferWizard extends ProcessWizard<IProcessWizardProps, IProcessWizardState> {

  constructor(props: IProcessWizardProps) {
    super(props);
    this.state = {
      currentStep: 0,
      steps: this.getSteps(),
      isSubmitting: false,
      validationErrors: {},
      formData: {
        employeeLookupId: props.employeeId || 0,
        oldDepartment: '',
        newDepartment: '',
        oldJobTitle: '',
        newJobTitle: '',
        effectiveDate: new Date(),
        priority: Priority.Normal,
        reason: ''
      } as ITransferFormData
    } as IProcessWizardState;
  }

  protected getSteps(): IWizardStep[] {
    return [
      { key: WizardStepKey.EmployeeInfo, label: 'Select Employee', isComplete: false, isValid: false },
      { key: WizardStepKey.ProcessDetails, label: 'Transfer Details', isComplete: false, isValid: false },
      { key: WizardStepKey.Review, label: 'Review & Submit', isComplete: false, isValid: false }
    ];
  }

  protected validateStep(stepKey: string): boolean {
    const { formData } = this.state;
    const errors: { [key: string]: string } = {};

    switch (stepKey) {
      case WizardStepKey.EmployeeInfo:
        if (!formData.employeeLookupId || formData.employeeLookupId === 0) {
          errors.employeeLookupId = 'Employee selection is required';
        }
        break;
      case WizardStepKey.ProcessDetails:
        if (!formData.newDepartment?.trim()) errors.newDepartment = 'New department is required';
        if (!formData.newJobTitle?.trim()) errors.newJobTitle = 'New job title is required';
        if (!formData.effectiveDate) errors.effectiveDate = 'Effective date is required';
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
      employeeLookupId: formData.employeeLookupId,
      transferData: {
        oldDepartment: formData.oldDepartment,
        newDepartment: formData.newDepartment,
        oldJobTitle: formData.oldJobTitle,
        newJobTitle: formData.newJobTitle,
        effectiveDate: formData.effectiveDate,
        reason: formData.reason,
        newManagerId: formData.newManager,
        newOfficeLocation: formData.newOfficeLocation
      },
      processData: {
        priority: formData.priority
      }
    };
  }

  protected renderStepContent(step: IWizardStep): React.ReactElement {
    const { formData, validationErrors } = this.state;

    switch (step.key) {
      case WizardStepKey.EmployeeInfo:
        return (
          <Stack tokens={stackTokens}>
            <Label>Select the employee to transfer (lookup field will be implemented)</Label>
            <TextField
              label="Employee ID"
              placeholder="Search employee..."
              errorMessage={validationErrors.employeeLookupId}
            />
          </Stack>
        );

      case WizardStepKey.ProcessDetails:
        return (
          <Stack tokens={stackTokens}>
            <TextField label="Current Department" value={formData.oldDepartment}
              onChange={(_, v) => this.updateFormData('oldDepartment', v)} />
            <TextField label="New Department" required value={formData.newDepartment}
              onChange={(_, v) => this.updateFormData('newDepartment', v)}
              errorMessage={validationErrors.newDepartment} />
            <TextField label="Current Job Title" value={formData.oldJobTitle}
              onChange={(_, v) => this.updateFormData('oldJobTitle', v)} />
            <TextField label="New Job Title" required value={formData.newJobTitle}
              onChange={(_, v) => this.updateFormData('newJobTitle', v)}
              errorMessage={validationErrors.newJobTitle} />
            <DatePicker label="Effective Date" isRequired value={formData.effectiveDate}
              onSelectDate={(d) => this.updateFormData('effectiveDate', d)} />
            <TextField label="New Office Location" value={formData.newOfficeLocation || ''}
              onChange={(_, v) => this.updateFormData('newOfficeLocation', v)} />
            <Dropdown label="Priority" selectedKey={formData.priority} options={priorityOptions}
              onChange={(_, o) => this.updateFormData('priority', o?.key)} />
            <TextField label="Reason for Transfer" multiline rows={3} value={formData.reason}
              onChange={(_, v) => this.updateFormData('reason', v)} />
          </Stack>
        );

      case WizardStepKey.Review:
        return (
          <Stack tokens={stackTokens}>
            <Label>Review transfer details:</Label>
            <div><strong>New Department:</strong> {formData.newDepartment}</div>
            <div><strong>New Job Title:</strong> {formData.newJobTitle}</div>
            <div><strong>Effective Date:</strong> {formData.effectiveDate?.toLocaleDateString()}</div>
            <div><strong>Priority:</strong> {formData.priority}</div>
            {formData.reason && <div><strong>Reason:</strong> {formData.reason}</div>}
          </Stack>
        );

      default:
        return <div>Unknown step</div>;
    }
  }
}
