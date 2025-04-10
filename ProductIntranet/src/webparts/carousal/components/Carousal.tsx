import * as React from 'react';
import styles from './Carousal.module.scss';
import type { ICarousalProps } from './ICarousalProps';
import { SPFI, spfi, SPFx } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { IconButton } from '@fluentui/react/lib/Button';
import { Link, Spinner, SpinnerSize } from '@fluentui/react';
import { ICarousalState } from './ICarousalState';

interface IImage {
  FileRef: string;
  ImgTitle: string;
  ImgSubTitle: string;
  IsActive: boolean;
  ExternalLinks: string;
  ImageOrder: number;
  StartDate: string;
  EndDate: string;
}

export default class Carousal extends React.Component<ICarousalProps, ICarousalState> {
  private carouselInterval: any;
  private siteAbsoluteUrl = this.props.context.pageContext.web.absoluteUrl;
  private baseUrl = this.siteAbsoluteUrl.split('/sites')[0];
  private timeInterval: number;
  private sp: SPFI;

  constructor(props: ICarousalProps) {
    super(props);
    this.sp = spfi().using(SPFx(this.props.context));
    this.timeInterval = this.props.autoScrollInterval * 1000;
    this.state = {
      images: [],
      currentIndex: 0,
      isLoading: false,
    };
  }

  // Fetch data 
  fetchData = async () => {
    this.setState({ isLoading: true })
    try {
      const response = await this.sp.web.lists
        .getByTitle('Banner List')
        .items.select('*', 'FileRef', 'ImgTitle', 'ImgSubTitle', 'IsActive', 'ExternalLinks', 'ImageOrder', 'StartDate', 'EndDate')
        .top(5000)();

      console.log(response);

      const currentDate = new Date();

      // Filter images by IsActive and date range, and sort by ImageOrder
      const filteredImages = response
        .filter((file: IImage) => {
          if (!file.IsActive) return false;
          const startDate = file.StartDate ? new Date(file.StartDate) : null;
          const endDate = file.EndDate ? new Date(file.EndDate) : null;

          return (!startDate || currentDate >= startDate) && (!endDate || currentDate <= endDate);
        })
        .sort((a: IImage, b: IImage) => a.ImageOrder - b.ImageOrder);

      this.setState({
        images: filteredImages,
      });
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      this.setState({ isLoading: false })
    }
  };

  // Start the auto-scroll carousel with the dynamic interval
  startCarousel = (interval: number) => {
    this.carouselInterval = setInterval(() => {
      this.setState((prevState) => {
        const nextIndex = (prevState.currentIndex + 1) % prevState.images.length;
        return { currentIndex: nextIndex };
      });
    }, interval);
  };

  // Stop the carousel when the component is unmounted
  componentWillUnmount() {
    clearInterval(this.carouselInterval);
  }

  componentDidMount() {
    this.fetchData();
    this.startCarousel(this.timeInterval);
  }

  // Handle the previous button click 
  handlePrev = () => {
    this.setState((prevState) => {
      const prevIndex = (prevState.currentIndex - 1 + prevState.images.length) % prevState.images.length;
      return { currentIndex: prevIndex };
    });
  };

  // Handle the next button click 
  handleNext = () => {
    this.setState((prevState) => {
      const nextIndex = (prevState.currentIndex + 1) % prevState.images.length;
      return { currentIndex: nextIndex };
    });
  };

  render() {
    const { images, currentIndex } = this.state;

    return (
      <div className={styles.carousalContainer}>
          {this.state.isLoading && (
            <div className={styles.spinnerContainer}>
              <Spinner size={SpinnerSize.large} label="Processing..." />
            </div>
          )}
        {images.length > 0 ? (
          <div className={styles.carousel}>
            <div
              className={styles.carousalItem}
              style={{ backgroundImage: `url('${this.baseUrl}${images[currentIndex].FileRef}')` }}
            >
              <div className={styles.overlay}>
                <h3>{images[currentIndex].ImgTitle}</h3>
                <Link
                  href={images[currentIndex].ExternalLinks}
                  target="_blank"
                  styles={{
                    root: {
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      color: '#043776',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.3s ease, transform 0.3s ease',
                    },
                  }}
                >
                  {images[currentIndex].LinkLabel}
                </Link>
              </div>

              {/* Left Arrow Button */}
              <IconButton
                iconProps={{ iconName: 'ChevronLeft' }}
                title="Previous"
                ariaLabel="Previous"
                className={styles.prevButton}
                onClick={this.handlePrev}
              />

              {/* Right Arrow Button */}
              <IconButton
                iconProps={{ iconName: 'ChevronRight' }}
                title="Next"
                ariaLabel="Next"
                className={styles.nextButton}
                onClick={this.handleNext}
              />
            </div>

            {/* Slick Dots */}
            <div className={styles.slickDots}>
              {images.map((_: any, index: number) => (
                <button
                  key={index}
                  className={`${styles.dot} ${currentIndex === index ? styles.activeDot : ''
                    }`}
                  onClick={() => this.setState({ currentIndex: index })}
                  aria-label={`Go to slide ${index + 1}`}
                ></button>
              ))}
            </div>

          </div>
        ) : (
          <p>No active images available.</p>
        )}
      </div>
    );
  }
}
