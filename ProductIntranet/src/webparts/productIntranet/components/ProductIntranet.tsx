import * as React from 'react';
import '../assets/customstyle.css';
import { Spinner, SpinnerSize } from '@fluentui/react';
export interface IPane {
  image: string;
  text: string;
  readMore: string;
  isVisible: boolean;
  title: any;
}

export interface IMyWebPartProps {
  panes: IPane[];
  onAddPane: () => void;
  onResetPane: (index: number) => void;
}

const ProductIntranet: React.FunctionComponent<IMyWebPartProps> = (props: any) => {

  return (
    <div className="panes-container" id="ITImpact">
      <h2 className='pane-Heading'>IT Impact</h2>
      {props.panes.map((pane: any, index: number) =>
        pane.isVisible ? ( // Conditional rendering based on isVisible
          <div key={index} className="pane">
            <div className="pane-image-container">
              <a href={pane.readMore}>  <img src={pane.image} alt="Pane Image" className="pane-image" /></a>
            </div>
            <div className="pane-content">
              {/* <h3 className="pane-title">
          {pane.text}
          </h3> */}
              <a className="pane-Title" href={pane.readMore}>
                {pane.title}
              </a>
              <p className="pane-description">
                {pane.text}
              </p>
              <a href={pane.readMore} className="pane-read-more">
                Read more →
              </a>
            </div>
          </div>
        ) : null // Hide pane if isVisible is false
      )}
    </div>


  );
};

export default ProductIntranet;
