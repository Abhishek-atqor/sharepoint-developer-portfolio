import * as React from 'react';
import styles from './NewsEventsWebpart.module.scss';
import type { INewsEventsWebpartProps } from './INewsEventsWebpartProps';
import { ListOperationService } from '../../../frameworks/services/ListOperation/ListOperationService';
import { getSP } from '../../../pnpjsConfig';
import { Constant } from '../../../frameworks/constants/Constant';
import { INewsEventsState } from './INewsEventsState';
import { SPFI } from '@pnp/sp';

export default class NewsEventsWebpart extends React.Component<INewsEventsWebpartProps, INewsEventsState> {
  private _sp: SPFI = null;
  private _listoperation: ListOperationService;
  
  constructor(props: INewsEventsWebpartProps) {
    super(props);
    this.state = {
      newsEvents: [],
      showAll: false
    };
    this._listoperation = new ListOperationService();
  }

  public async componentDidMount() {
    await this._listoperation.Init(this.props.context);
    this._sp = getSP(this.props.context);
    await this.getNewsEvents();

    // Check if the current page is "NewEventPage.aspx"
    const currentPageUrl = window.location.pathname.toLowerCase();
    if (currentPageUrl.includes("/sitepages/neweventpage.aspx")) {
      this.setState({ showAll: true }); // Always show all events on the redirected page
    }
  }

  public async getNewsEvents() {
    try {
      const items = await this._listoperation.getItemsFromList(
        this.props.context,
        Constant.SpListNewsEvents,
        '',
        ["Title", "Index", "RedirectLink", "NewsDescription", "FileRef"],
        ["AttachmentFiles"],
        '',
        true
      );
      
      const newsEventsData = items.map(item => ({
        Title: item.Title,
        Index: item.Index,
        RedirectLink: item.RedirectLink,
        NewsDescription: item.NewsDescription,
        Attachment: item.AttachmentFiles.length > 0 ? item.AttachmentFiles[0].ServerRelativeUrl : "",
      }));

      this.setState({ newsEvents: newsEventsData.sort((a, b) => a.Index - b.Index) });
    } catch (error) {
      console.error("Error fetching News & Events list:", error);
    }
  }

  public toggleShowAll = () => {
    this.setState(prevState => ({ showAll: !prevState.showAll }));
  };

  public render(): React.ReactElement<INewsEventsWebpartProps> {
    const siteUrl = this.props.context.pageContext.web.absoluteUrl;
    const addNewEventUrl = `${siteUrl}/SitePages/NewEventPage.aspx`;
    const displayedNews = this.state.showAll ? this.state.newsEvents : this.state.newsEvents.slice(0, 2);

    // Hide "See All New Event" if already on the New Event Page
    const isOnNewEventPage = window.location.pathname.toLowerCase().includes("/sitepages/neweventpage.aspx");

    return (
      <div className={styles.newsEventsContainer}>
        <div className={styles.headingWrapper}>
          <h2 className={styles.heading}>News & Events</h2>
          {!this.state.showAll && !isOnNewEventPage && (
            <a
              href={addNewEventUrl}
              onClick={(e) => {
                e.preventDefault();
                this.toggleShowAll();
              }}
              className={styles.addNewEventLink}
            >
              + See All New Event
            </a>
          )}
        </div>
        <div className={styles.newsEventsList}>
          {displayedNews.map((news, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.imageContainer} onClick={() => window.open(news.RedirectLink, "_blank")} data-interception="off">
                {news.Attachment ? <img src={news.Attachment} alt={news.Title} className={styles.image} /> : <div className={styles.image}>No Image</div>}
              </div>
              <div className={styles.content}>
                <h3 className={styles.title}>{news.Title}</h3>
                <p className={styles.description}>{news.NewsDescription}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
