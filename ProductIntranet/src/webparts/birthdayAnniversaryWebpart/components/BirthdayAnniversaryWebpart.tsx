import * as React from 'react';
import { SPFx, spfi } from "@pnp/sp";
import { MessageBar, MessageBarType } from 'office-ui-fabric-react';
import { IBirthdayAnniversaryWebpartProps } from './IBirthdayAnniversaryWebpartProps';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
// import "@pnp/sp/items/get-all";
import "@pnp/sp/folders";
import "@pnp/sp/files";
// import {Moment} from "moment";
import * as moment from 'moment';
// import { IBirthdayAnniversaryState } from './IBirthdayAnniversaryState';
import '../assets/CustomStyle.css';
export interface IMyWebPartState {
  birthdayToday: any[];
  workAnniversaryToday: any[];
  errorMessage: string;
  activeCategory: string;
  noRecordFoundImage?: any; // New property for no record found image URL
}

export default class BirthdayAnniversaryWebpart extends React.Component<IBirthdayAnniversaryWebpartProps, IMyWebPartState> {
  constructor(props: IBirthdayAnniversaryWebpartProps) {
    super(props);

    this.state = {
      birthdayToday: [],
      workAnniversaryToday: [],
      errorMessage: '',
      activeCategory: 'Birthdate',
    };
  }

  public componentDidMount() {
    this.loadData();
  }

  private calculateYears = (joiningDate: Date) => {
    const today = new Date();
    const years = today.getFullYear() - joiningDate.getFullYear();

    if (
      today.getMonth() < joiningDate.getMonth() ||
      (today.getMonth() === joiningDate.getMonth() && today.getDate() < joiningDate.getDate())
    ) {
      return years - 1;
    }

    return years;
  };



  private loadData = async () => {
    try {
      const today = new Date();
      const spfxContext: any = spfi().using(SPFx(this.props.context));
      const listitems = spfxContext.web.lists.getByTitle('BirthdayList');
      const itemsResponse = await listitems.items();

      const birthdayToday = itemsResponse.filter((item: any) => {
        const birthdate = new Date(item.BirthDate);
        return birthdate.getDate() === today.getDate() && birthdate.getMonth() === today.getMonth();
      });

      const workAnniversaryToday = itemsResponse.filter((item: any) => {
        const joiningDate = new Date(item.UserJoiningDate);
        return (
          joiningDate.getDate() === today.getDate() &&
          joiningDate.getMonth() === today.getMonth()
        );
      });

      this.setState({
        birthdayToday,
        workAnniversaryToday,
        errorMessage: '',
      });
      this.loadNoRecordFoundImage();

    } catch (error) {
      this.setState({
        errorMessage: 'An error occurred while loading data.',
      });
    }
  };
  private toggleCategory = (category: string) => {
    this.setState({ activeCategory: category });
  };

  private loadNoRecordFoundImage = async () => {


    try {
      const spfxContext: any = spfi().using(SPFx(this.props.context));

      const text2: any = await spfxContext.web.getFolderByServerRelativePath("SiteAssets/NoDataImage").files.getByUrl("nodatafound.jpg")();

      console.log(text2);

      // Set the image URL in the state
      this.setState({
        noRecordFoundImage: text2.ServerRelativeUrl,
      });
    } catch (error) {
      // Handle error loading the image
      console.error('Error loading no record found image:', error);
    }
  };





  public render(): React.ReactElement<IBirthdayAnniversaryWebpartProps, any> {
    const { birthdayToday, workAnniversaryToday, errorMessage, activeCategory, noRecordFoundImage } = this.state;

    return (
      <div className="birthdayWrapper">
        <div className="button-container">
          <DefaultButton
            onClick={() => this.toggleCategory('Birthdate')}
            styles={{ root: { background: activeCategory === 'Birthdate' ? 'lightblue' : 'white', width: '100%' } }}
          >
            Birthday
          </DefaultButton>
          <DefaultButton
            onClick={() => this.toggleCategory('WorkAnniversary')}
            styles={{ root: { background: activeCategory === 'WorkAnniversary' ? 'lightblue' : 'white', width: '100%' } }}
          >
            Work Anniversary
          </DefaultButton>
        </div>

        {errorMessage && (
          <MessageBar messageBarType={MessageBarType.error}>{errorMessage}</MessageBar>
        )}

        <div className="record-container">
          {activeCategory === 'Birthdate' && (
            <div className="record-scroll-container">
              {/* <h2>Today's Birthdays</h2> */}
              {birthdayToday.length > 0 ? (
                <ul className='record-list'>
                  {birthdayToday.map((item) => (
                    <li key={item.Id}>
                      <div className="record-item">
                        <img src="https://cdn-icons-png.flaticon.com/256/6225/6225308.png" alt="User Avatar" />
                        <div className="record-details">
                          <div style={{ textTransform: 'uppercase' }}>{item.UserName}</div>
                          {/* {item.Birthdate} */}
                          {moment(item.BirthDate).format('DD-MMM')}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                // <div>No records found.</div>
                <div className='noDataFound'>  <img src={noRecordFoundImage} alt="No Record Found" /></div>
              )}
            </div>
          )}

          {activeCategory === 'WorkAnniversary' && (
            <div className="record-scroll-container">
              {/* <h2>Today's Work Anniversaries</h2> */}
              {workAnniversaryToday.length > 0 ? (
                <ul className='record-list'>
                  {workAnniversaryToday.map((item) => (
                    <li key={item.Id}>
                      <div className="record-item">
                        <img src="https://cdn-icons-png.flaticon.com/256/6225/6225308.png" alt="User Avatar" />
                        <div className="record-details">
                          <div style={{ textTransform: 'uppercase' }}>{item.UserName}</div>
                          {moment(item.UserJoiningDate).utc().format('DD-MMM-YYYY')}: {this.calculateYears(new Date(item.UserJoiningDate))} years
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                // <div>No records found.</div>
                <div className='noDataFound'>  <img src={noRecordFoundImage} alt="No Record Found" /></div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}