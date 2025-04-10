import * as React from 'react';
import styles from './TicketsWebpart.module.scss';
import type { ITicketsWebpartProps } from './ITicketsWebpartProps';
import { SPFI, spfi, SPFx } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { ITicketsWebpartState } from './ITicketWebpart';
import { Spinner, SpinnerSize } from '@fluentui/react';

export default class TicketsWebpart extends React.Component<ITicketsWebpartProps, ITicketsWebpartState> {
  private sp: SPFI;
  private _CurrentUserEmail: string;

  constructor(props: ITicketsWebpartProps) {
    super(props);
    this._CurrentUserEmail = this.props.context.pageContext.user.email;
    this.sp = spfi().using(SPFx(this.props.context));
    this.state = {
      Data: [],
      activeTab: 'tickets',
      isLoading: false,
    };
  }

  public fetchData = async () => {
    this.setState({ isLoading: true })
    try {
      const response = await this.sp.web.lists
        .getByTitle('Ticket List')
        .items.select('*', "Assignedto0/Id", "Assignedto0/EMail", "Assignedto0/Title",)
        .expand('Assignedto0')
        .filter(`Assignedto0/EMail eq '${this._CurrentUserEmail}'`)();

      console.log(response, "data");
      this.setState({ Data: response });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      this.setState({ isLoading: false })
    }
  };

  componentDidMount() {
    this.fetchData();
  }

  handleTabChange = (tab: string) => {
    this.setState({ activeTab: tab });
  };

  public render(): React.ReactElement<ITicketsWebpartProps> {
    const { activeTab, Data } = this.state;
    // Display only 3 data from list
    const displayData = Data.slice(0, 3);

    return (
      <div className={styles.ticketsContainer} id="MyTicketsRequests">
        {this.state.isLoading && (
          <div className={styles.spinnerContainer}>
            <Spinner size={SpinnerSize.large} label="Processing..." />
          </div>
        )}
        <div className={styles.header}>
          <div>
            <span className={styles.myText}>{this.props.SubTitle}</span>
            <h1>{this.props.Title}</h1>
          </div>
          <a href="https://imrchusky.sharepoint.com/sites/AtqorProductIntranet/SitePages/Ticket-Details-Page.aspx">
          <button className={styles.seeAllButton}>
            See all
          </button></a>
        </div>

        <div className={styles.tabs}>
          <span
            className={`${styles.tab} ${activeTab === 'tickets' ? styles.activeTab : ''}`}
            onClick={() => this.handleTabChange('tickets')}
          >
            Tickets
          </span>
          <span
            className={`${styles.tab} ${activeTab === 'requests' ? styles.activeTab : ''}`}
            onClick={() => this.handleTabChange('requests')}
          >
            Requests
          </span>
        </div>

        {activeTab === 'tickets' ? (
          <div className={styles.ticketList}>
            <table>
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((item: any) => (
                  <tr key={item.Id}>
                    <td>
                      <a href={`https://imrchusky.sharepoint.com/sites/AtqorProductIntranet/Lists/Ticket%20List/DispForm.aspx?ID=${item.ID}`}>{item.IncidentID}</a>
                    </td>
                    <td>{item.Title}</td>
                    <td>{new Date(item.DateReported).toLocaleDateString()}</td>
                    <td>{item.Status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.requestsContent}>
            <p>You will see your requests here.</p>
          </div>
        )}

        <div className={styles.decorativeShape}></div>
      </div>
    );
  }
}

