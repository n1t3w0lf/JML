import * as React from 'react';
import {
  Panel,
  PanelType,
  Stack,
  PrimaryButton,
  DefaultButton,
  ProgressIndicator,
  MessageBar,
  MessageBarType,
  IStackTokens
} from '@fluentui/react';
import { IProcessWizardProps, IProcessWizardState, IWizardStep } from './IProcessWizard';

const stackTokens: IStackTokens = { childrenGap: 20 };

export abstract class ProcessWizard<P extends IProcessWizardProps, S extends IProcessWizardState>
  extends React.Component<P, S> {

  protected abstract getSteps(): IWizardStep[];
  protected abstract renderStepContent(step: IWizardStep): React.ReactElement;
  protected abstract validateStep(stepKey: string): boolean;
  protected abstract buildSubmissionData(): any;

  protected handleNext = (): void => {
    const { currentStep, steps } = this.state;
    const currentStepData = steps[currentStep];

    if (this.validateStep(currentStepData.key)) {
      const updatedSteps = [...steps];
      updatedSteps[currentStep].isComplete = true;
      updatedSteps[currentStep].isValid = true;

      this.setState({
        currentStep: currentStep + 1,
        steps: updatedSteps,
        validationErrors: {}
      } as S);
    }
  };

  protected handlePrevious = (): void => {
    const { currentStep } = this.state;
    if (currentStep > 0) {
      this.setState({ currentStep: currentStep - 1 } as S);
    }
  };

  protected handleSubmit = async (): Promise<void> => {
    try {
      this.setState({ isSubmitting: true } as S);
      const submissionData = this.buildSubmissionData();
      await this.props.onSubmit(submissionData);
      this.props.onDismiss();
    } catch (error) {
      this.setState({
        isSubmitting: false,
        validationErrors: { submit: (error as Error).message }
      } as S);
    }
  };

  protected updateFormData = (field: string, value: any): void => {
    this.setState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        [field]: value
      }
    } as S));
  };

  protected renderFooter = (): React.ReactElement => {
    const { currentStep, steps, isSubmitting } = this.state;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    return (
      <Stack horizontal tokens={{ childrenGap: 10 }} horizontalAlign="end">
        <DefaultButton
          text="Cancel"
          onClick={this.props.onDismiss}
          disabled={isSubmitting}
        />
        {!isFirstStep && (
          <DefaultButton
            text="Previous"
            onClick={this.handlePrevious}
            disabled={isSubmitting}
          />
        )}
        {!isLastStep && (
          <PrimaryButton
            text="Next"
            onClick={this.handleNext}
            disabled={isSubmitting}
          />
        )}
        {isLastStep && (
          <PrimaryButton
            text={isSubmitting ? "Creating Process..." : "Create Process"}
            onClick={this.handleSubmit}
            disabled={isSubmitting}
          />
        )}
      </Stack>
    );
  };

  protected renderProgressIndicator = (): React.ReactElement => {
    const { currentStep, steps } = this.state;
    const progress = (currentStep + 1) / steps.length;

    return (
      <Stack tokens={stackTokens}>
        <ProgressIndicator
          label={`Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep].label}`}
          percentComplete={progress}
        />
      </Stack>
    );
  };

  protected renderValidationErrors = (): React.ReactElement | null => {
    const { validationErrors } = this.state;
    const errorMessages = Object.values(validationErrors);

    if (errorMessages.length === 0) {
      return null;
    }

    return (
      <MessageBar messageBarType={MessageBarType.error} isMultiline>
        {errorMessages.map((error, index) => (
          <div key={index}>{error}</div>
        ))}
      </MessageBar>
    );
  };

  public render(): React.ReactElement {
    const { isOpen, processType } = this.props;
    const { currentStep, steps } = this.state;
    const currentStepData = steps[currentStep];

    return (
      <Panel
        isOpen={isOpen}
        onDismiss={this.props.onDismiss}
        type={PanelType.medium}
        headerText={`New ${processType} Process`}
        onRenderFooterContent={this.renderFooter}
        isFooterAtBottom={true}
      >
        <Stack tokens={stackTokens}>
          {this.renderProgressIndicator()}
          {this.renderValidationErrors()}
          {this.renderStepContent(currentStepData)}
        </Stack>
      </Panel>
    );
  }
}
