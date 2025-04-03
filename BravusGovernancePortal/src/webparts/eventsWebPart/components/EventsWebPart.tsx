import * as React from 'react';
import styles from './EventsWebPart.module.scss';
import type { IEventsWebPartProps } from './IEventsWebPartProps';
import { escape } from '@microsoft/sp-lodash-subset';
import { ListOperationService } from '../../../frameworks/services/ListOperation/ListOperationService';
import { getSP } from '../../../pnpjsConfig';
import { Constant } from '../../../frameworks/constants/Constant';
import { IEventsState } from './IEventsState';
import { SPFI } from '@pnp/sp';
import * as moment from 'moment';
export default class EventsWebPart extends React.Component<IEventsWebPartProps, IEventsState> {
  private _sp: SPFI = null;
  private _listoperation: ListOperationService;
  public constructor(props: IEventsWebPartProps) {
    super(props);
    this.state = {
      events: [],
    };
    this._listoperation = new ListOperationService();
  }
  public async componentDidMount() {
    await this._listoperation.Init(this.props.context);
    this._sp = getSP(this.props.context);
    await this.getEvents();
  }
  public async getEvents() {
    try {
      // const items = await this._sp.web.lists.getByTitle("Events List").items.select("Title", "StartDate", "EndDate")();
      const items = await this._listoperation.getItemsFromList(
        this.props.context,
        'Events',
        '',
        ["Title", "EventDate", "EndDate"],
        [""],
        '',
        true
      );


      const formattedEvents = items.map((item) => ({
        Title: item.Title,
        // StartDate: moment(item.StartDate).format("h:mm A"), // Format as 8:00 AM
        StartDate: item.EventDate, // Format as 8:00 AM
        EndDate: moment(item.EndDate).format("h:mm A"), // Format as 9:00 AM
        CurrentDate: moment().format("D MMM").toUpperCase()
      }));

      this.setState({ events: formattedEvents });
    } catch (error) {
      console.error("Error fetching events list:", error);
    }
  }
  public render(): React.ReactElement<IEventsWebPartProps> {
    return (
      <div className={styles.eventsContainer}>
        {/* <h2 className={styles.heading}>Upcoming Events</h2> */}
        <div className={styles.eventList}>
          {this.state.events.map((event, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.leftSide}>
                <p className={styles.currentDate}>{moment(event.StartDate).format("D MMM")}</p>
              </div>
              {/* Vertical Divider Line */}
              <div className={styles.divider}></div>
              <div className={styles.rightSide}>
                <h3 className={styles.title}>{event.Title}</h3>
                <p className={styles.time}>{moment(event.StartDate).format("h:mm A")} - {event.EndDate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
