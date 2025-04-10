import * as React from 'react';
import { ITrainingCertificationTrackerProps } from './ITrainingCertificationTrackerProps';
import { ITrainingCertification } from './ITrainingCertification';
import { SPFx, spfi } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';
import { Table } from 'reactstrap'; // Using Reactstrap for the table
import '../assets/customstyle.css';

interface ITrainingCertificationState {
  certifications: ITrainingCertification[];
  loading: boolean;
  error: string | null;
}

export default class TrainingCertificationTracker extends React.Component<ITrainingCertificationTrackerProps, ITrainingCertificationState> {
  constructor(props: ITrainingCertificationTrackerProps) {
    super(props);
    this.state = {
      certifications: [],
      loading: true,
      error: null,
    };
  }

  componentDidMount(): void {
    this.loadTrainingCertifications();
  }

  loadTrainingCertifications = async (): Promise<void> => {
    const sp = spfi().using(SPFx(this.props.context));

    try {
      const certifications: ITrainingCertification[] = await sp.web.lists
        .getByTitle('TrainingCertifications') // SharePoint list name
        .items.select('Title', 'TrainingName', 'CompletionDate', 'CertificationExpirationDate', 'Status')();

      this.setState({
        certifications,
        loading: false,
        error: null,
      });
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false,
      });
    }
  };

  render(): React.ReactElement {
    const { loading, error, certifications } = this.state;

    if (loading) return <div>Loading certifications...</div>;
    if (error) return <div>Error loading certifications: {error}</div>;
    if (!certifications.length) return <div>No certifications found.</div>;

    return (
      <div className="training-certifications-container">
        <h3>Employee Training and Certification Tracker</h3>
        <Table responsive>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Training Name</th>
              <th>Completion Date</th>
              <th>Certification Expiry</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {certifications.map((certification, index) => {
              // Handle CertificationExpirationDate
              const expiryDate = certification.CertificationExpirationDate
                ? new Date(certification.CertificationExpirationDate)
                : null;

              // Display '0' if CertificationExpirationDate is empty or invalid
              const expiryDateDisplay = expiryDate && expiryDate.getTime() > 0
                ? expiryDate.toLocaleDateString() // Format the date if valid
                : '0'; // Display '0' if empty or invalid date

              // Handle CompletionDate
              const completionDate = certification.CompletionDate
                ? new Date(certification.CompletionDate)
                : null;

              // Display '0' if CompletionDate is empty or invalid
              const completionDateDisplay = completionDate && completionDate.getTime() > 0
                ? completionDate.toLocaleDateString() // Format the date if valid
                : '0'; // Display '0' if empty or invalid date

              const isExpired = expiryDate && expiryDate < new Date();
              const statusClass = certification.Status === 'Completed' ? 'success' : 'warning';

              return (
                <tr key={index} className={isExpired ? 'expired' : ''}>
                  <td>{certification.Title}</td>
                  <td>{certification.TrainingName}</td>
                  <td>{completionDateDisplay}</td> {/* Show '0' if CompletionDate is empty */}
                  <td>{expiryDateDisplay}</td> {/* Show '0' if CertificationExpirationDate is empty */}
                  <td className={statusClass}>{certification.Status}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  }
}
