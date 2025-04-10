import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneLink,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'BannerWebPartStrings';
import Banner from './components/Banner';
import { IBannerWebpartProps } from './components/IBannerProps';

export interface IBannerWebpartWebPartProps {
  description: string;
  dropdownLabel: string;
  assistantButtonLabel: string;
  Tab1: string;
  Tab1ID: string;
  Tab2: string;
  Tab2ID: string
  Tab3: string;
  Tab3ID: string;
  Tab4: string;
  Tab4ID: string;
}

export default class BannerWebpart extends BaseClientSideWebPart<IBannerWebpartWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<IBannerWebpartProps> = React.createElement(
      Banner,
      {
        description: this.properties.description,
        dropdownLabel: this.properties.dropdownLabel || "How do I?",
        assistantButtonLabel: this.properties.assistantButtonLabel || "Need assistant?",
        Tab1: this.properties.Tab1 || "IT Tips & Tricks",
        Tab1ID: this.properties.Tab1ID || "ITTipsTricks",
        Tab2: this.properties.Tab2 || "My Tickets Requests",
        Tab2ID: this.properties.Tab2ID || "MyTicketsRequests",
        Tab3: this.properties.Tab3 || "IT Impact",
        Tab3ID: this.properties.Tab3ID || "ITImpact",
        Tab4: this.properties.Tab4 || "Events",
        Tab4ID: this.properties.Tab4ID || "EventList",
        context: this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('dropdownLabel', {
                  label: "Dropdown Label"
                }),
                PropertyPaneTextField('assistantButtonLabel', {
                  label: "Assistant Button Label"
                }),
                PropertyPaneTextField('Tab1', {
                  label: "Tab 1",
                  placeholder: "Enter Tab Value"
                }),
                PropertyPaneTextField('Tab1ID', {
                  label: "Tab 1 ID",
                  placeholder: "Enter Tab Link"
                }),
                PropertyPaneTextField('Tab2', {
                  label: "Tab 2",
                  placeholder: "Enter Tab Value"
                }),
                PropertyPaneTextField('Tab2ID', {
                  label: "Tab 2 ID",
                  placeholder: "Enter Tab Link"
                }),
                PropertyPaneTextField('Tab3', {
                  label: "Tab 3",
                  placeholder: "Enter Tab Value"
                }),
                PropertyPaneTextField('Tab3ID', {
                  label: "Tab 3 ID",
                  placeholder: "Enter Tab Link"
                }),
                PropertyPaneTextField('Tab4', {
                  label: "Tab 4",
                  placeholder: "Enter Tab Value"
                }),
                PropertyPaneTextField('Tab4ID', {
                  label: "Tab 4 ID",
                  placeholder: "Enter Tab Link"
                }),
              ]
            }
          ]
        }
      ]
    };
  }
}
