import * as React from 'react';
import {
  PrimaryButton,
  Dropdown,
  IDropdownOption,
  Stack,
  Text,
  IStackTokens,
  Link,
  Spinner,
  SpinnerSize
} from '@fluentui/react';
import { SPFI, spfi, SPFx } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import '@pnp/sp/presets/all';
import "@pnp/sp/site-users/web";

import styles from './Banner.module.scss';
import { IBannerWebpartProps } from './IBannerProps';
import { IBannerWebpartState } from './IBannerState';

const stackTokens: IStackTokens = { childrenGap: 20 };

interface ICustomDropdownOption extends IDropdownOption {
  url?: string;
}

export default class BannerWebpart extends React.Component<IBannerWebpartProps, IBannerWebpartState> {
  private sp: SPFI;

  constructor(props: IBannerWebpartProps) {
    super(props);
    this.sp = spfi().using(SPFx(this.props.context));
    this.state = {
      Data: [],
      isLoading: false,
      currentIndex: 0,
      dropdownOptions: [],
      assistantPageLink: '',
      CurrentUserName: '',
    };
  }

  async fetchCurrentUser() {
    this.setState({ isLoading: true })
    try {
      const user = await this.sp.web.ensureUser(this.props.context.pageContext.user.email);
      this.setState({ CurrentUserName: user.Title });
    } catch (error) {
      console.error('Error fetching user data:', error);
      this.setState({ CurrentUserName: 'Error fetching user' });
    } finally {
      this.setState({ isLoading: false })
    }
  }

  fetchBannerData = async () => {
    this.setState({ isLoading: true })
    try {
      const response = await this.sp.web.lists
        .getByTitle('Banner')
        .items.select(
          'BannerTitle',
          'BannerSubTitle',
          'BannerBgImage',
          'Webpart1',
          'Webpart2',
          'Webpart3',
          'Webpart4',
        )
        .top(5000)();
      this.setState({ Data: response });

      // Fetch dropdown data and map it dynamically
      const dropdownData = await this.sp.web.lists
        .getByTitle('Dropdown List')
        .items.select('Dropdowns', 'Assistant')
        .top(5000)();

      const dropdownOptions: ICustomDropdownOption[] = [];

      console.log(dropdownData, "drop");

      dropdownData.forEach((item: any) => {
        Object.keys(item).forEach((key) => {
          if (key.startsWith('Dropdown') && item[key]?.Url && item[key]?.Description) {
            console.log(`Dropdown Key: ${key}, Description: ${item[key].Description}, URL: ${item[key].Url}`);
            dropdownOptions.push({
              key: `${item[key].Description}-${item[key].Url}`,
              text: item[key].Description,
              url: item[key].Url,
            });
          }
        });
      });

      console.log('Fetched dropdown options:', dropdownOptions);
      this.setState({ dropdownOptions, assistantPageLink: dropdownData[0].Assistant.Url });
    } catch (error) {
      console.error('Error fetching banner data:', error);
    } finally {
      this.setState({ isLoading: false })
    }
  };

  componentDidMount() {
    this.fetchCurrentUser();
    this.fetchBannerData();
  }

  // Redirect to URL when an option is clicked
  onDropdownChange = (event: React.FormEvent<HTMLDivElement>, option: ICustomDropdownOption) => {
    console.log('Dropdown option selected:', option);
    console.log('Redirecting to:', option.url);

    if (option && option.url) {
      window.location.href = option.url;
    } else {
      console.error('URL is undefined or missing for option:', option);
    }
  };

  render() {
    const { Data, CurrentUserName, dropdownOptions, assistantPageLink } = this.state;
    const bannerData = Data[0] || {};

    return (
      <div className={styles.mainBanner}>
        {this.state.isLoading && (
          <div className={styles.spinnerContainer}>
            <Spinner size={SpinnerSize.large} label="Processing..." />
          </div>
        )}
        <div
          className={styles.outerMainBanner}
          style={bannerData.BannerBgImage ? { backgroundImage: `url(${bannerData.BannerBgImage.Url})` } : undefined}
        >
          <Stack tokens={stackTokens} className={styles.container}>
            <Stack.Item align="center">
              <Text variant="xxLarge" className={styles.welcomeText}>
                {bannerData.BannerTitle}, {CurrentUserName}
              </Text>
              <br />
              <Text variant="large" className={styles.subTitle}>
                {bannerData.BannerSubTitle}
              </Text>
            </Stack.Item>

            <Stack horizontal tokens={stackTokens} className={styles.buttonContainer}>
              <Dropdown
                placeholder={this.props.dropdownLabel}
                options={dropdownOptions}
                onChange={this.onDropdownChange}
                className={styles.dropdown}
                styles={{
                  dropdownItem: {
                    selectors: {
                      ':hover': {
                        backgroundColor: '#fff',
                        color: '#ffffff',
                      },
                    },
                  },
                }}
              />
              <Link href={assistantPageLink}><PrimaryButton className={styles.assistantbtn} text={this.props.assistantButtonLabel} /></Link>
            </Stack>
          </Stack>
        </div>
        <Stack.Item className={styles.webpartContainer}>
          <div className={styles.webpartContent}>
            <div className={styles.webpartItem}>
              <Link href={`#${this.props.Tab1ID}`}>{this.props.Tab1}</Link>
            </div>
            <div className={styles.webpartItem}>
              <Link href={`#${this.props.Tab2ID}`}>{this.props.Tab2}</Link>
            </div>
            <div className={styles.webpartItem}>
              <Link href={`#${this.props.Tab3ID}`}>{this.props.Tab3}</Link>
            </div>
            <div className={styles.webpartItem}>
              <Link href={`#${this.props.Tab4ID}`}>{this.props.Tab4}</Link>
            </div>
          </div>
        </Stack.Item>
      </div>
    );
  }
}
