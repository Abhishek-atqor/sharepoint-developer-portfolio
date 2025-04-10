import * as React from 'react';
import styles from './EventListWebPart.module.scss';
import type { IEventListWebPartProps } from './IEventListWebPartProps';
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { escape } from '@microsoft/sp-lodash-subset';
import '../assets/customstyle.css';
import * as moment from 'moment';
import { Spinner, SpinnerSize } from '@fluentui/react';

export interface IEvent {
  Title: any;
  EventDate: any;
  EventTime: any;
  Description: any;
}

export interface IState {
  events: IEvent[];
  isLoading: boolean;
}

export default class EventListWebPart extends React.Component<IEventListWebPartProps, IState> {
  constructor(props: IEventListWebPartProps) {
    super(props);
    this.state = {
      events: [],
      isLoading: false,
    };
  }

  public componentDidMount(): void {
    this._fetchEventList();
  }

  private _fetchEventList = async (): Promise<void> => {
    this.setState({ isLoading: true })
    const sp = spfi().using(SPFx(this.props.context));
    try {
      const events: any = await sp.web.lists.getByTitle('Events').items.orderBy('EventDate', true)(); // Sort events by date
      this.setState({ events });
    } catch (error) {
      console.error('Error fetching event list:', error);
    } finally {
      this.setState({ isLoading: false })
    }
  }

  // Function to strip HTML tags
  private stripHtmlTags = (html: string): string => {
    return html.replace(/<\/?[^>]+(>|$)/g, ''); // This removes all HTML tags
  }

  // Function to format the date using moment.js
  private formatEventDate = (date: string): string => {
    return moment(date).format('dddd hh:mm A [EST]');
  }

  public render(): React.ReactElement<IEventListWebPartProps> {
    const { events } = this.state;

    // Limit events to top 4
    const topEvents = events.slice(0, 4);
    const seeAllUrl = `${this.props.context.pageContext.web.absoluteUrl}/SitePages/EventDashboard.aspx`;

    return (
      <>
      <div className="event-dashboard" id='EventList'>
        {this.state.isLoading && (
          <div className={styles.spinnerContainer}>
            <Spinner size={SpinnerSize.large} label="Processing..." />
          </div>
        )}
        {/* <h2>IT Events</h2> */}
        <div className='event-heading'>
          <h2 className='event-text'>IT Events</h2>
          <a
            href={seeAllUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "#0078d4", fontWeight: "bold" }}
          >
            See All
          </a>
        </div>
        <div className="event-cards">
          {topEvents.map((event, index) => (
            <div key={index} className="event-card">
              <div className="event-date">
                <span className="event-month">{new Date(event.EventDate).toLocaleString('en-US', { month: 'short' })}</span>
                <span className="event-day">{new Date(event.EventDate).getDate()}</span>
              </div>
              <div className="event-details">
                <h3>{event.Title}</h3>
                <p>{this.formatEventDate(event.EventDate)}</p> {/* Using the formatEventDate function */}
                {/* <p>{this.stripHtmlTags(event.Description)}</p> */}
              </div>
            </div>
          ))}
        </div>
      </div>
     </>
    );
  }
}
