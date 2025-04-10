import * as React from 'react';
import { IProjectTimelineProps } from './IProjectTimelineProps';
import { IProject } from './IProject';
import { SPFx, spfi } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';
import { Bar } from 'react-chartjs-2'; // Import Bar chart from react-chartjs-2
import '../assets/CustomStyle.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register required chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface IProjectTimelineState {
  projects: IProject[];
  loading: boolean;
  error: string | null;
  chartData: {
    labels: string[];
    datasets: any[];
  };
}

export default class ProjectTimeline extends React.Component<IProjectTimelineProps, IProjectTimelineState> {
  constructor(props: IProjectTimelineProps) {
    super(props);
    this.state = {
      projects: [],
      loading: true,
      error: null,
      chartData: {
        labels: [],
        datasets: [],
      },
    };
  }

  componentDidMount(): void {
    this.loadProjects();
  }

  loadProjects = async (): Promise<void> => {
    const sp = spfi().using(SPFx(this.props.context));
    try {
      const projects: IProject[] = await sp.web.lists
        .getByTitle('ProjectsTimline') // Replace 'ProjectsTimline' with your SharePoint list name
        .items.select('Title', 'StartDate', 'EndDate', 'Status')();

      // Prepare data for the chart
      const labels = projects.map((project) => project.Title);

      // Determine the background color based on project status
      const durations = projects.map((project) => {
        const startDate = new Date(project.StartDate);
        const endDate = new Date(project.EndDate);
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // Duration in days

        let backgroundColor = 'rgba(75, 192, 192, 0.6)'; // Default color (in progress)
        if (project.Status === 'Completed') {
          backgroundColor = 'rgba(0, 255, 0, 0.6)'; // Green for completed
        } else if (project.Status === 'Not Started') {
          backgroundColor = 'rgba(255, 0, 0, 0.6)'; // Red for not started
        }

        return {
          duration,
          backgroundColor,
        };
      });

      // Extract duration and color data
      const durationsData = durations.map((item) => item.duration);
      const backgroundColors = durations.map((item) => item.backgroundColor);

      this.setState({
        projects,
        loading: false,
        chartData: {
          labels,
          datasets: [
            {
              label: 'Project Duration (days)',
              data: durationsData,
              backgroundColor: backgroundColors,
              borderColor: 'rgba(75, 192, 192, 1)', // Optional: customize the border color if needed
              borderWidth: 1,
            },
          ],
        },
      });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  };

  render(): React.ReactElement {
    const { loading, error, chartData } = this.state;

    if (loading) return <div>Loading projects...</div>;
    if (error) return <div>Error loading projects: {error}</div>;
    if (!chartData.labels.length) return <div>No projects found.</div>;

    return (
      <div className="chart-container">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Project Timeline Tracker',
              },
            },
          }}
        />
        <div className="status-legend">
          <div className="status-item">
            <div className="status-box completed"></div>
            <span>Completed</span>
          </div>
          <div className="status-item">
            <div className="status-box in-progress"></div>
            <span>In Progress</span>
          </div>
          <div className="status-item">
            <div className="status-box not-started"></div>
            <span>Not Started</span>
          </div>
        </div>
      </div>
    );
  }
}
