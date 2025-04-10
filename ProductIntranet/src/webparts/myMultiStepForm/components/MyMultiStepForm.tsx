import * as React from 'react';
import styles from './MyMultiStepForm.module.scss';
import type { IMyMultiStepFormProps } from './IMyMultiStepFormProps';
import { spfi, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import { Stepper, Step, StepLabel, Button } from '@mui/material';

export interface IFormState {
  name: string;
  email: string;
  department: string;
  role: string;
  comments: string;
  step: number;
}

export default class MyMultiStepForm extends React.Component<IMyMultiStepFormProps, IFormState> {
  private sp = spfi().using(SPFx(this.props.context));

  constructor(props: IMyMultiStepFormProps) {
    super(props);
    this.state = {
      name: '',
      email: '',
      department: '',
      role: '',
      comments: '',
      step: 0,
    };
  }

  private saveFormData = async () => {
    const { name, email, department, role, comments } = this.state;

    try {
      await this.sp.web.lists.getByTitle('Multistepformlist').items.add({
        Title: name,
        Email: email,
        Department: department,
        Role: role,
        Comments: comments,
      });

      alert('Form submitted successfully!');
      this.resetForm();
    } catch (error) {
      console.error('Error saving form data:', error);
      alert('Error submitting the form. Please try again.');
    }
  };

  private resetForm = () => {
    this.setState({
      name: '',
      email: '',
      department: '',
      role: '',
      comments: '',
      step: 0,
    });
  };

  private updateState = (newState:any) => {
    this.setState(newState);
  };

  private validateCurrentStep = (): boolean => {
    const { step, name, email, department, role } = this.state;

    if (step === 0) {
      if (!name.trim() || !email.trim()) {
        alert('Please fill out all fields in Step 1 before proceeding.');
        return false;
      }
    }

    if (step === 1) {
      if (!department.trim() || !role.trim()) {
        alert('Please fill out all fields in Step 2 before proceeding.');
        return false;
      }
    }

    return true;
  };

  private nextStep = () => {
    if (this.validateCurrentStep()) {
      this.setState({ step: this.state.step + 1 });
    }
  };

  private prevStep = () => {
    this.setState({ step: this.state.step - 1 });
  };

  public render(): React.ReactElement<IMyMultiStepFormProps> {
    const { name, email, department, role, comments, step } = this.state;
    const steps = ['Personal Information', 'Job Details', 'Additional Information'];

    return (
      <div className={styles.myMultiStepForm}>
        <h2 className={styles.formHeader}>Multi-Step Form</h2>

        {/* Material-UI Stepper */}
        <Stepper activeStep={step} alternativeLabel className={styles.stepper}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <div className={styles.stepContent}>
          {step === 0 && (
            <div className={styles.stepSection}>
              <h3 className={styles.stepTitle}>Step 1: Personal Information</h3>
              <label className={styles.formLabel}>
                Name:
                <input
                  type="text"
                  value={name}
                  className={styles.formInput}
                  onChange={(e) => this.updateState({ name: e.target.value })}
                />
              </label>
              <label className={styles.formLabel}>
                Email:
                <input
                  type="email"
                  value={email}
                  className={styles.formInput}
                  onChange={(e) => this.updateState({ email: e.target.value })}
                />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className={styles.stepSection}>
              <h3 className={styles.stepTitle}>Step 2: Job Details</h3>
              <label className={styles.formLabel}>
                Department:
                <input
                  type="text"
                  value={department}
                  className={styles.formInput}
                  onChange={(e) => this.updateState({ department: e.target.value })}
                />
              </label>
              <label className={styles.formLabel}>
                Role:
                <input
                  type="text"
                  value={role}
                  className={styles.formInput}
                  onChange={(e) => this.updateState({ role: e.target.value })}
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className={styles.stepSection}>
              <h3 className={styles.stepTitle}>Step 3: Additional Information</h3>
              <label className={styles.formLabel}>
                Comments:
                <textarea
                  value={comments}
                  className={styles.formTextarea}
                  onChange={(e) => this.updateState({ comments: e.target.value })}
                ></textarea>
              </label>
              <Button variant="contained" onClick={this.saveFormData} className={styles.submitButton}>
                Submit
              </Button>
              <Button
                variant="outlined"
                onClick={this.resetForm}
                className={styles.resetButton}
                style={{ marginLeft: '10px' }}
              >
                Reset
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className={styles.navigationButtons}>
          <Button
            variant="outlined"
            onClick={this.prevStep}
            disabled={step === 0}
            className={styles.prevButton}
          >
            Previous
          </Button>
          <Button
            variant="contained"
            onClick={this.nextStep}
            disabled={step === steps.length - 1}
            className={styles.nextButton}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }
}
