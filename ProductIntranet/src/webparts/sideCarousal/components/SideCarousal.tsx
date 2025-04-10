import * as React from 'react';
import styles from './SideCarousal.module.scss';
import type { ISideCarousalProps } from './ISideCarousalProps';

import { SPFI, spfi, SPFx } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { ISideCarousalState } from './ISideCarousalState';
import { Spinner, SpinnerSize } from '@fluentui/react';

interface IImage {
  FileRef: string;
  ImgTitle: string;
  ImgDescription: string;
  IsActive: boolean;
  ExternalLinks: string;
  ImgOrder: number;
  StartDate: string;
  EndDate: string;
}

export default class SideCarousal extends React.Component<ISideCarousalProps, ISideCarousalState> {
  private sp: SPFI;
  private timeInterval: number;
  private timer: any;

  constructor(props: ISideCarousalProps) {
    super(props);
    this.timeInterval = this.props.autoScroll * 1000;
    this.sp = spfi().using(SPFx(this.props.context));
    this.state = {
      images: [],
      currentIndex: 0,
      isLoading: false,
    };
  }

  // Fetch the data from the Picture Library
  fetchData = async () => {
    this.setState({ isLoading: true })
    try {
      const response = await this.sp.web.lists
        .getByTitle('Support IT List')
        .items.select('*')
        .top(5000)();

      const currentDate = new Date();

      // Filter images by IsActive and date range, and sort by ImgOrder
      const filteredImages = response
        .filter((file: IImage) => {
          if (!file.IsActive) return false;
          const startDate = file.StartDate ? new Date(file.StartDate) : null;
          const endDate = file.EndDate ? new Date(file.EndDate) : null;

          return (!startDate || currentDate >= startDate) && (!endDate || currentDate <= endDate);
        })
        .sort((a: IImage, b: IImage) => a.ImgOrder - b.ImgOrder);

      await this.setState({ images: filteredImages });

    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      this.setState({ isLoading: false })
    }
  };

  componentDidMount() {
    this.fetchData();

    // Auto scroll every 3 seconds
    this.timer = setInterval(() => {
      this.nextSlide();
    }, this.timeInterval);
  }

  componentWillUnmount() {
    // Clear interval when the component is unmounted
    if (this.timer) clearInterval(this.timer);
  }

  nextSlide = () => {
    this.setState((prevState: any) => ({
      currentIndex: (prevState.currentIndex + 1) % prevState.images.length,
    }));
  };

  prevSlide = () => {
    this.setState((prevState: any) => ({
      currentIndex:
        (prevState.currentIndex - 1 + prevState.images.length) %
        prevState.images.length,
    }));
  };

  render(): React.ReactElement<ISideCarousalProps> {
    const { currentIndex, images } = this.state;

    return (
      <div className={styles.sideCarousal} id="SideCarousal">
          {this.state.isLoading && (
            <div className={styles.spinnerContainer}>
              <Spinner size={SpinnerSize.large} label="Processing..." />
            </div>
          )}
        {images.length > 0 ? (
          <div className={styles.carouselContainer}>
            <div className={styles.carouselWrapper}>
              {/* Render current slide */}
              <div className={styles.carouselItem}>
                <img
                  src={images[currentIndex].ImgLink.Url}
                  alt={images[currentIndex].ImgTitle}
                  className={styles.carouselImage}
                />
                <div className={styles.textOverlay}>
                  <h4>{images[currentIndex].ImgTitle}</h4>
                  <span>{images[currentIndex].ImgDescription}</span>
                </div>
                <button className={styles.prevButton} onClick={this.prevSlide}>
                  &#10094;
                </button>
                <button className={styles.nextButton} onClick={this.nextSlide}>
                  &#10095;
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p>No active images available.</p>
        )}
      </div>
    );
  }
}
