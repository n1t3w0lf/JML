import * as React from 'react';
import { TextField, Dropdown, IDropdownOption, DatePicker, Checkbox, Stack, Label, IStackTokens } from '@fluentui/react';
import { ProcessWizard } from './ProcessWizard';
import { IProcessWizardProps, IProcessWizardState, IWizardStep, WizardStepKey } from './IProcessWizard';
import { Priority, DepartureReason } from '../../../../models/IJMLProcess';

interface IOffboardingFormData {
  employeeLookupId: number;
  lastWorkingDay: Date;
  departureReason: DepartureReason;
  priority: Priority;
  exitInterviewRequired: boolean;
  accessRevocationRequired: boolean;
  assetReturnRequired: boolean;
  knowledgeTransferRequired: boolean;
  replacementNeeded: boolean;
  notes: string;
}

const stackTokens: IStackTokens = { childrenGap: 15 };

const departureReasonOptions: IDropdownOption[] = [
  { key: DepartureReason.Resignation, text: 'Resignation' },
  { key: DepartureReason.Retirement, text: 'Retirement' },
  { key: DepartureReason.ContractEnd, text: 'Contract End' },
  { key: DepartureReason.Termination, text: 'Termination' },
  { key: DepartureReason.Layoff, text: 'Layoff' },
  { key: DepartureReason.Other, text: 'Other' }
];

const priorityOptions: IDropdownOption[] = [
  { key: Priority.Low, text: 'Low' },
  { key: Priority.Normal, text: 'Normal' },
  { key: Priority.High, text: 'High' },
  { key: Priority.Critical, text: 'Critical' }
];

export class OffboardingWizard extends ProcessWizard<IProcessWizardProps, IProcessWizardState> {

  constructor(props: IProcessWizardProps) {
    super(props);
    this.state = {
      currentStep: 0,
      steps: this.getSteps(),
      isSubmitting: false,
      validationErrors: {},
      formData: {
        employeeLookupId: props.employeeId || 0,
        lastWorkingDay: new Date(),
        departureReason: DepartureReason.Resignation,
        priority: Priority.High,
        exitInterviewRequired: true,
        accessRevocationRequired: true,
        assetReturnRequired: true,
        knowledgeTransferRequired: true,
        replacementNeeded: false,
        notes: ''
      } as IOffboardingFormData
    } as IProcessWizardState;
  }

  protected getSteps(): IWizardStep[] {
    return [
      { key: WizardStepKey.EmployeeInfo, label: 'Select Employee', isComplete: false, isValid: false },
      { key: WizardStepKey.ProcessDetails, label: 'Offboarding Details', isComplete: false, isValid: false },
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
        if (!formData.lastWorkingDay) errors.lastWorkingDay = 'Last working day is required';
        if (!formData.departureReason) errors.departureReason = 'Departure reason is required';
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
      offboardingData: {
        lastWorkingDay: formData.lastWorkingDay,
        departureReason: formData.departureReason,
        exitInterviewRequired: formData.exitInterviewRequired,
        accessRevocationRequired: formData.accessRevocationRequired,
        assetReturnRequired: formData.assetReturnRequired,
        knowledgeTransferRequired: formData.knowledgeTransferRequired,
        replacementNeeded: formData.replacementNeeded,
        notes: formData.notes
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
            <Label>Select the employee who is leaving</Label>
            <TextField
              label="Employee ID or Name"
              placeholder="Search employee..."
              errorMessage={validationErrors.employeeLookupId}
            />
          </Stack>
        );

      case WizardStepKey.ProcessDetails:
        return (
          <Stack tokens={stackTokens}>
            <DatePicker label="Last Working Day" isRequired value={formData.lastWorkingDay}
              onSelectDate={(d) => this.updateFormData('lastWorkingDay', d)}
              errorMessage={validationErrors.lastWorkingDay} />
            <Dropdown label="Departure Reason" required selectedKey={formData.departureReason}
              options={departureReasonOptions}
              onChange={(_, o) => this.updateFormData('departureReason', o?.key)}
              errorMessage={validationErrors.departureReason} />
            <Dropdown label="Process Priority" selectedKey={formData.priority}
              options={priorityOptions}
              onChange={(_, o) => this.updateFormData('priority', o?.key)} />

            <Label>Offboarding Requirements:</Label>
            <Checkbox label="Exit Interview Required" checked={formData.exitInterviewRequired}
              onChange={(_, checked) => this.updateFormData('exitInterviewRequired', checked)} />
            <Checkbox label="Access Revocation Required" checked={formData.accessRevocationRequired}
              onChange={(_, checked) => this.updateFormData('accessRevocationRequired', checked)} />
            <Checkbox label="Asset Return Required" checked={formData.assetReturnRequired}
              onChange={(_, checked) => this.updateFormData('assetReturnRequired', checked)} />
            <Checkbox label="Knowledge Transfer Required" checked={formData.knowledgeTransferRequired}
              onChange={(_, checked) => this.updateFormData('knowledgeTransferRequired', checked)} />
            <Checkbox label="Replacement Needed" checked={formData.replacementNeeded}
              onChange={(_, checked) => this.updateFormData('replacementNeeded', checked)} />

            <TextField label="Additional Notes" multiline rows={4} value={formData.notes}
              onChange={(_, v) => this.updateFormData('notes', v)} />
          </Stack>
        );

      case WizardStepKey.Review:
        return (
          <Stack tokens={stackTokens}>
            <Label>Review offboarding details:</Label>
            <div><strong>Last Working Day:</strong> {formData.lastWorkingDay?.toLocaleDateString()}</div>
            <div><strong>Departure Reason:</strong> {formData.departureReason}</div>
            <div><strong>Priority:</strong> {formData.priority}</div>
            <div><strong>Exit Interview:</strong> {formData.exitInterviewRequired ? 'Yes' : 'No'}</div>
            <div><strong>Access Revocation:</strong> {formData.accessRevocationRequired ? 'Yes' : 'No'}</div>
            <div><strong>Asset Return:</strong> {formData.assetReturnRequired ? 'Yes' : 'No'}</div>
            <div><strong>Knowledge Transfer:</strong> {formData.knowledgeTransferRequired ? 'Yes' : 'No'}</div>
            <div><strong>Replacement Needed:</strong> {formData.replacementNeeded ? 'Yes' : 'No'}</div>
            {formData.notes && <div><strong>Notes:</strong> {formData.notes}</div>}
          </Stack>
        );

      default:
        return <div>Unknown step</div>;
    }
  }
}
