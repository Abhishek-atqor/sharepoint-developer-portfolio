import * as React from 'react';
//  import styles from './EventPickerWebpart.module.scss';
import type { IEventPickerWebpartProps } from './IEventPickerWebpartProps';
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { DatePicker } from 'antd';
import * as moment from 'moment';
import '../assets/customstyle.css';
import { Pagination } from "@pnp/spfx-controls-react/lib/pagination";

export interface IEventPickerState {
  selectedDate: Date | null;
  events: { Id: number; Title: string; EventDate: string }[];
  currentPage: number;
  pageSize: number;
  paginatedEvents: { Id: number; Title: string; EventDate: string }[];
}

export default class EventPickerWebpart extends React.Component<
  IEventPickerWebpartProps,
  IEventPickerState
> {
  constructor(props: IEventPickerWebpartProps) {
    super(props);
    this.state = {
      selectedDate: null,
      events: [],
      currentPage: 1,
      pageSize: 8, // Display 8 events per page
      paginatedEvents: [],
    };
  }

  /**
   * Fetches events for the selected month and year from the SharePoint list.
   */
  private async fetchEventsForMonth(month: number, year: number) {
    const sp = spfi().using(SPFx(this.props.context));
    try {
      // Fetch all events
      const allEvents = await sp.web.lists
        .getByTitle("Events")
        .items.orderBy('EventDate', true)();

      // Filter events by selected month and year
      const filteredEvents = allEvents.filter((event: { EventDate: any }) => {
        const eventDate = moment(event.EventDate); // Parse the EventDate using moment
        return eventDate.month() + 1 === month && eventDate.year() === year;
      });

      // Update state with filtered events
      this.setState({ events: filteredEvents }, this.updatePaginatedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }

  /**
   * Updates the paginated events for the current page.
   */
  private updatePaginatedEvents = () => {
    const { events, currentPage, pageSize } = this.state;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedEvents = events.slice(startIndex, startIndex + pageSize);
    this.setState({ paginatedEvents });
  };

  /**
   * Handles changes in the date picker.
   */
  private handleDateChange = (date: moment.Moment | null) => {
    if (date) {
      const month = date.month() + 1; // Months are 0-indexed in moment.js
      const year = date.year();
      this.setState({ selectedDate: date.toDate(), currentPage: 1 }, () => {
        this.fetchEventsForMonth(month, year);
      });
    }
  };

  /**
   * Handles page changes from the Pagination component.
   */
  private handlePageChange = (page: number) => {
    this.setState({ currentPage: page }, this.updatePaginatedEvents);
  };

  public render(): React.ReactElement<IEventPickerWebpartProps> {
    const { paginatedEvents, events, selectedDate, currentPage, pageSize } = this.state;

    return (
      <div className='eventPickerWebpart'>
        {/* <h2>Select Month to View Events</h2> */}
        <div className='datepicker'>
          <label>Please Select a Month</label>
        <DatePicker
          value={selectedDate ? moment(selectedDate) : null}
          onChange={this.handleDateChange}
          format="MM/YYYY"
          picker="month" // This makes the picker select only the month and year
          placeholder='Please Select a Month'
          className='DatepickerField'
        />
        </div>
        <div className='eventsContainer'>
          {events.length > 0 ? ( 
            <div>
                 <h3>Events</h3>
              <div className='cardGrid'>
                {paginatedEvents.map((event) => (
                  <div className='card' key={event.Id}>
                    <h4 className='cardTitle'>{event.Title}</h4>
                    <p className='cardDate'>
                      {moment(event.EventDate).format('MM/DD/YYYY')}
                    </p>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(events.length / pageSize)}
                onChange={this.handlePageChange}
              />
            </div>
          ) : (
            // <p>No events found for the selected month.</p>
            <img className='EventNoDataimg' src='https://i.pinimg.com/originals/49/e5/8d/49e58d5922019b8ec4642a2e2b9291c2.png'></img>
          )}
        </div>
      </div>
    );
  }
}
