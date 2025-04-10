import { BaseComponentContext } from '@microsoft/sp-component-base';

export interface IDynamicField {
  description: string;
}

export interface IProductIntranetProps {
  dynamicFields: IDynamicField[];
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  onReset: (index: number) => void;
  addNewField: () => void;
  context: BaseComponentContext;
}