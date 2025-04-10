import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneButton,
  PropertyPaneButtonType
} from '@microsoft/sp-webpart-base';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import ProductIntranet, { IMyWebPartProps } from './components/ProductIntranet';

// Import File Picker
import { PropertyFieldFilePicker, IFilePickerResult } from '@pnp/spfx-property-controls/lib/PropertyFieldFilePicker';

export interface IMyWebPartWebPartProps {
  panes: { image: string; text: string; readMore: string,isVisible: boolean,title:any}[];
}

export default class ProductIntranetWebPart extends BaseClientSideWebPart<IMyWebPartWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IMyWebPartProps> = React.createElement(ProductIntranet, {
      panes: this.properties.panes,
      onAddPane: this.addPane.bind(this),
      onResetPane: this.resetPane.bind(this),
    });

    ReactDom.render(element, this.domElement);
  }

  private addPane(): void {
    const newPane = { image: '', text: '', readMore: '' ,isVisible: true,title:''};
    this.properties.panes = [...this.properties.panes, newPane];
    this.context.propertyPane.refresh();
    this.render();
  }

  private resetPane(index: number): void {
    this.properties.panes[index] = { image: '', text: '', readMore: '',isVisible: true,title:'' };
    this.context.propertyPane.refresh();
    this.render();
  }
  private deletePane(index: number): void {
    this.properties.panes.splice(index, 1); // Remove the pane at the specified index
    this.context.propertyPane.refresh();
    this.render();
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const paneGroups = this.properties.panes.map((pane, index) => ({
      groupName: `Pane ${index + 1}`,
      groupFields: [
        PropertyFieldFilePicker(`panes[${index}].image`, {
          label: `Upload Image for Pane ${index + 1}`,
          context: this.context as any,
          filePickerResult: {
            fileAbsoluteUrl: this.properties.panes[index].image || '',
            fileName: '',
            fileNameWithoutExtension: '',
            downloadFileContent: function (): Promise<File> {
              throw new Error('Function not implemented.');
            }
          },
          onSave: (filePickerResult: IFilePickerResult) => {
            this.properties.panes[index].image = filePickerResult.fileAbsoluteUrl || '';
            this.context.propertyPane.refresh();
            this.render();
          },
          buttonLabel: 'Select Image',
          accepts: ['.png', '.jpg', '.jpeg', '.bmp', '.gif'],
          key: `imagePicker-${index}`,
          onPropertyChange: function (propertyPath: string, oldValue: any, newValue: any): void {
            throw new Error('Function not implemented.');
          },
          properties: undefined
        }),
        PropertyPaneTextField(`panes[${index}].title`, {
          label: `Title for Pane ${index + 1}`
        }),
        PropertyPaneTextField(`panes[${index}].text`, {
          label: `Multiline Text for Pane ${index + 1}`,
          multiline: true
        }),
        PropertyPaneTextField(`panes[${index}].readMore`, {
          label: `Read More Link for Pane ${index + 1}`
        }),
        PropertyPaneButton(`addButton-${index}`, {
          text: 'Add Pane',
          buttonType: PropertyPaneButtonType.Primary,
          onClick: () => this.addPane()
        }),
        PropertyPaneButton(`resetButton-${index}`, {
          text: 'Reset Pane',
          buttonType: PropertyPaneButtonType.Normal,
          onClick: () => this.resetPane(index)
        }),
        PropertyPaneButton(`deleteButton-${index}`, {
          text: 'Delete Pane',
          buttonType: PropertyPaneButtonType.Normal,
          onClick: () => this.deletePane(index)
        })
      ]
    }));

    return {
      pages: [{ header: { description: 'Dynamic Property Panes' }, groups: paneGroups }]
    };
  }

  protected onInit(): Promise<void> {
    this.properties.panes = this.properties.panes || [{ image: '', text: '', readMore: '',isVisible: true,title:'' }];
    return super.onInit();
  }
}
