
export interface IGovernanceDashboardState {
  data: any[]; // Adjust if you have a specific type for data
  isLoading: boolean;
  selectedTab: string;
  dynamicColumns: any[]; // Add this line
}
