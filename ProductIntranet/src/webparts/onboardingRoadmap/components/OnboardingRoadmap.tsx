import * as React from 'react';
import styles from './OnboardingRoadmap.module.scss';
import type { IOnboardingRoadmapProps } from './IOnboardingRoadmapProps';
import { escape } from '@microsoft/sp-lodash-subset';
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
export interface IOnboardingStep {
  Title: string;
  Description: string;
  Icon: string;
  Order: number;
}

export interface IOnboardingRoadmapState {
  steps: IOnboardingStep[];
}
export default class OnboardingRoadmap extends React.Component<IOnboardingRoadmapProps, IOnboardingRoadmapState> {
  constructor(props: IOnboardingRoadmapProps) {
    super(props);
    this.state = {
      steps: [],
    };
  }
  public async componentDidMount(): Promise<void> {
    const sp = spfi().using(SPFx(this.props.context));
    const steps = await sp.web.lists
      .getByTitle("OnboardingSteps")
      .items.select("Title", "Description", "Icon", "Order")
      .orderBy("Order", true)();

    this.setState({ steps });
  }
  public render(): React.ReactElement<IOnboardingRoadmapProps> {
    const { steps } = this.state;
    return (
      <div className={styles.onboardingRoadmap}>
        <h2>Onboarding Roadmap & Calendar</h2>
        <div className={styles.stepsContainer}>
          {steps.map((step, index) => (
            <div key={index} className={styles.step}>
              <div className={styles.icon}>
                <img src={step.Icon} alt={step.Title} />
              </div>
              <h3>{step.Title}</h3>
              <p>{step.Description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
