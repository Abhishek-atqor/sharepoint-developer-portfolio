import * as React from 'react';
import styles from './QuickLinks.module.scss';
import type { IQuickLinksProps } from './IQuickLinksProps';
import { ListOperationService } from '../../../frameworks/services/ListOperation/ListOperationService';
import { escape } from '@microsoft/sp-lodash-subset';
import { getSP } from '../../../pnpjsConfig';
import { Constant } from '../../../frameworks/constants/Constant';
import { IQuickLinksState } from './IQuickLinksState';
import { SPFI } from '@pnp/sp';

export default class QuickLinks extends React.Component<IQuickLinksProps, IQuickLinksState> {
  private _sp: SPFI = null;
  private _listoperation: ListOperationService;

  constructor(props: IQuickLinksProps) {
    super(props);
    this.state = {
      quickLinks: [],
    };
    this._listoperation = new ListOperationService();
  }

  public async componentDidMount() {
    await this._listoperation.Init(this.props.context);
    this._sp = getSP(this.props.context);
    this.getQuickLinks();
  }

  public async getQuickLinks() {
    try {
      const items = await this._listoperation.getItemsFromList(
        this.props.context,
        Constant.SpListQuickLink,
        '',
        ["Title", "Index", "RedirectLink", "FileRef"],
        ["AttachmentFiles"],
        '',
        true
      );

      const quickLinksData = items.map(item => ({
        Title: item.Title,
        Index: item.Index,
        RedirectLink: item.RedirectLink,
        Attachment: item.AttachmentFiles.length > 0 ? item.AttachmentFiles[0].ServerRelativeUrl : "",
      }));

      this.setState({ quickLinks: quickLinksData.sort((a, b) => a.Index - b.Index) });
    } catch (error) {
      console.error("Error fetching QuickLinks list:", error);
    }
  }

  public render(): React.ReactElement<IQuickLinksProps> {
    const siteUrl = this.props.context.pageContext.web.absoluteUrl; // ✅ Get the current site URL dynamically
    const addNewQuickLinkUrl = `${siteUrl}/Lists/QuickLinks/AllItems.aspx`; // ✅ Construct the full URL
    return (
      <div className={styles.quickLinksWrapper}>
        <div className={styles.headingWrapper}>
          <h2 className={styles.heading}>Quick Links</h2>
          <a
            href={addNewQuickLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.addNewLink}
          >
            + Add New Quick Link
          </a>
        </div>
        <div className={styles.quickLinksContainer}>
          {this.state.quickLinks.map((link, index) => (
            <div key={index} className={styles.card} onClick={() => window.open(link.RedirectLink, "_blank")} data-interception="off">
              <div className={styles.title}>{link.Title}</div>
              <div className={styles.imageContainer}>
                {link.Attachment ? <img src={link.Attachment} alt={link.Title} className={styles.image} /> : <div className={styles.placeholder}>No Image</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
