import * as React from 'react';
import styles from './TipTricks.module.scss';
import type { ITipTricksProps } from './ITipTricksProps';
import { SPFI, spfi, SPFx } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import { Spinner, SpinnerSize } from '@fluentui/react';

interface IState {
  Data: any[];
  isLoading: boolean;
}

export default class TipTricks extends React.Component<ITipTricksProps, IState> {
  private sp: SPFI;

  constructor(props: ITipTricksProps) {
    super(props);
    this.sp = spfi().using(SPFx(this.props.context));
    this.state = {
      Data: [],
      isLoading: false,
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  handleClick(newTabValue: any, link: string) {
    console.log(newTabValue, "Tab Value")
    console.log(link, "Link")
  }

  fetchData = async () => {
    this.setState({ isLoading: true })
    try {
      // Fetching the Site Pages list with a specific category filter
      const SitePageResponse = await this.sp.web.lists
        .getByTitle('Site Pages')
        .items.select('*', 'Title', 'FileLeafRef', 'FileRef', 'Modified', 'Category', 'NewTab')
        .filter(`Category eq '${this.props.category}'`)
        .orderBy('Modified', false)
        .top(100)();

      if (SitePageResponse.length > 0) {
        // Create an array of promises for fetching CanvasContent1 of each page
        const pageDataPromises = SitePageResponse.map(async (site) => {
          try {
            // Fetching CanvasContent1 (HTML content) of the page
            const pageData = await this.sp.web.lists
              .getByTitle('Site Pages')
              .items.select('Title', 'FileLeafRef', 'CanvasContent1', 'NewTab')
              .filter(`FileRef eq '${site.FileRef}'`)
              .top(1)();

            if (pageData.length > 0) {
              const canvasContent = pageData[0].CanvasContent1;
              return {
                ...site,
                canvasContent,
              };
            }
            return null;
          } catch (error) {
            console.error('Error fetching page data for FileRef:', site.FileRef, error);
            return null;
          } finally {
            this.setState({ isLoading: false })
          }
        });

        // Wait for all promises to resolve
        const resolvedPages = await Promise.all(pageDataPromises);

        // Filter out any null results
        const validPages = resolvedPages.filter(page => page !== null);

        this.setState({ Data: validPages });
      } else {
        console.log('No pages found matching the filter.');
      }
    } catch (error) {
      console.error('Error fetching Site Pages:', error);
    } finally {
      this.setState({ isLoading: false })
    }
  };

  public render(): React.ReactElement<ITipTricksProps> {
    const { Data } = this.state;

    return (
      <section className={styles.container} id="ITTipsTricks">
          {this.state.isLoading && (
            <div className={styles.spinnerContainer}>
              <Spinner size={SpinnerSize.large} label="Processing..." />
            </div>
          )}
        <div className={styles.header}>
          <div>
            <h2 className={styles.preTitle}>{this.props.SubTitle}</h2>
            <h1 className={styles.title}>{this.props.Title}</h1>
          </div>
          <a href="https://www.google.com/">
            <button className={styles.seeAll}>See all</button>
          </a>
        </div>

        <div className={styles.grid}>
          {Data.length > 0 ? (
            Data.map((data: any, index: number) => (
              <article key={index} className={styles.card}>
                <div
                  className={styles.cardDescription}
                  dangerouslySetInnerHTML={{ __html: data.canvasContent }}
                />
                <a
                  href={data.FileRef}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(data.FileRef, '_blank');
                  }}
                  className={styles.readMore}
                >
                  Read more
                </a>

              </article>
            ))
          ) : (
            <p>No tips found.</p>
          )}
        </div>
      </section>
    );
  }
}
