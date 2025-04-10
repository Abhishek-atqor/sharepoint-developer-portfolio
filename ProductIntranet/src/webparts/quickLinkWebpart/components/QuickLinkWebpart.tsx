import * as React from 'react';
import styles from './QuickLinkWebpart.module.scss';
import type { IQuickLinkWebpartProps } from './IQuickLinkWebpartProps';
import { escape } from '@microsoft/sp-lodash-subset';
import { IQuickLinkWebpartState } from './IQuickLinkWebpartState';
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { ICamlQuery } from '@pnp/sp/lists';
export interface IState {
  quickLinks: IQuickLinkWebpartState[];
}
export default class QuickLinkWebpart extends React.Component<IQuickLinkWebpartProps, IState> {
  constructor(props: IQuickLinkWebpartProps) {
    super(props);
    this.state = {
      quickLinks: []
    };
  }
  public componentDidMount(): void {
    this._getQuickLinks();
  }

  private _getQuickLinks = async (): Promise<void> => {
    const sp = spfi().using(SPFx(this.props.context));

    const camlQuery: ICamlQuery = {
      ViewXml: `<View>
                  <Query>
                    <Where>
                      <IsNotNull>
                        <FieldRef Name='ImageColumn' />
                      </IsNotNull>
                    </Where>
                  </Query>
                  <ViewFields>
                    <FieldRef Name='Title' />
                    <FieldRef Name='ImageColumn' />
                    <FieldRef Name='RedirectUrl' />
                  </ViewFields>
                </View>`,
    };

    try {
      // Fetch items from SharePoint list using the CAML query
      const list = sp.web.lists.getByTitle("QuickLinks"); // Replace with your actual list name
      const items = await list.getItemsByCAMLQuery(camlQuery);

      console.log("Fetched Items:", items);

      // Map the fetched items to the state
      const mappedItems = items.map((item: { ImageColumn: string; ID: any; Title: any; RedirectUrl: any; }) => {
        let thumbnailUrl = "";

        if (item.ImageColumn) {
          try {
            const imageData = JSON.parse(item.ImageColumn);
            const fileName = imageData.fileName;

            // Construct the thumbnail URL dynamically
            thumbnailUrl = `https://imrchusky.sharepoint.com/sites/AtqorProductIntranet/_api/v2.1/sites('YOUR_SITE_ID')/lists('YOUR_LIST_ID')/items('${item.ID}')/attachments('${fileName}')/thumbnails/0/c300x2000/content?prefer=noredirect,closestavailablesize`;
            // Replace YOUR_SITE_ID and YOUR_LIST_ID with actual values
            thumbnailUrl = thumbnailUrl
              .replace("YOUR_SITE_ID", "853ed2ab-3fe6-4ea0-94e3-d05eeb382950")
              .replace("YOUR_LIST_ID", "2342d01f-401b-4f00-9f1a-fe4d996f8a08");
          } catch (e) {
            console.error("Error parsing ImageColumn data:", e);
          }
        }

        return {
          title: item.Title,
          thumbnailUrl,
          redirectUrl: item.RedirectUrl.Url,
        };
      });

      this.setState({
        quickLinks: mappedItems,
      });

    } catch (error) {
      console.error("Error fetching QuickLinks data: ", error);
    }
  };

  public render(): React.ReactElement<IQuickLinkWebpartProps> {

    return (
      <>
        <div className={styles.quickLinksContainer}>
          <h2 className={styles.quickLinksHeader}>Quick Links</h2>
          <div className={styles.quickLinksGrid}>
            {this.state.quickLinks.map((quickLink, index) => (
              <div key={index} className={styles.quickLinkCard}>
                <a href={quickLink.redirectUrl} target="_blank" rel="noopener noreferrer" className={styles.quickLink}>
                  <div className={styles.quickLinkImageContainer}>
                    {quickLink.thumbnailUrl ? (
                      <img src={quickLink.thumbnailUrl} alt={quickLink.title} className={styles.quickLinkImage} />
                    ) : (
                      <div className={styles.quickLinkPlaceholder}></div>
                    )}
                  </div>
                  <div className={styles.quickLinkTitle}>{quickLink.title}</div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }
}
