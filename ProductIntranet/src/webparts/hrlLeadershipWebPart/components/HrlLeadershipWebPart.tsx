import * as React from 'react';
import styles from './HrlLeadershipWebPart.module.scss';
import { IHrlLeadershipWebPartProps } from './IHrlLeadershipWebPartProps';
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/folders";
import "@pnp/sp/files";
import '../assets/style.css';

export interface IHRLLeadershipState {
  items: any[];
  DefaultImage?: any; // New property for no record found image URL
}

export default class HRLLeadershipWebPart extends React.Component<IHrlLeadershipWebPartProps, IHRLLeadershipState> {
  constructor(props: IHrlLeadershipWebPartProps) {
    super(props);

    this.state = {
      items: []
    };
  }

  public async componentDidMount() {
    await this.loadListData();
  }

  private async loadListData() {
    const sp = spfi().using(SPFx(this.props.context));
    const list = sp.web.lists.getByTitle('KeyPeople');

    // Fetch Person column properties along with Designation, Description, and UserImage
    const items = await list.items.select('Person/Title', 'Person/EMail', 'Person/WorkPhone', 'Designation', 'Description', 'UserImage')
      .expand('Person')();

    this.setState({
      items
    });

    this.defaultImage();
  }

  private defaultImage = async () => {
    try {
      const spfxContext: any = spfi().using(SPFx(this.props.context));
      const text2: any = await spfxContext.web.getFolderByServerRelativePath("SiteAssets/defaultimage").files.getByUrl("default.jpg")();
      console.log(text2);
      // Set the image URL in the state
      this.setState({
        DefaultImage: text2.ServerRelativeUrl,
      });
    } catch (error) {
      // Handle error loading the image
      console.error('Error loading no record found image:', error);
    }
  };

  public render(): React.ReactElement<IHrlLeadershipWebPartProps> {
    const { DefaultImage } = this.state;
    return (
      <>
        <div className={styles.hrheading}><h1>Test</h1></div>
        <div className={styles.hrlleadership}>
          {this.state.items.map((item) => {
            // Build the URL for the Person's image based on their email
            const userImageUrl = `${this.props.context.pageContext.web.absoluteUrl}/_layouts/15/userphoto.aspx?size=L&username=${item.Person?.EMail}`

            return (
              <div key={item.Id} className={styles.leaderitem}>
                <div className={styles.itemimg}>
                  <img className={styles.img} src={userImageUrl} alt={item.Person?.Title || "No Image"} />
                </div>
                <div className={styles.itemWrapper}>
                  <div className={styles.item}>{item.Person?.Title}</div>
                  <div className={styles.item}>{item.Designation}</div>
                  <div className={styles.item}>{item.Person?.WorkPhone}</div>
                  <div className={styles.item}>{item.Person?.EMail}</div>
                  <div className={styles.item}>{item.Description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }
}
