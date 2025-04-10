import * as React from 'react';
import styles from './GraphApiWebpart.module.scss';
import type { IGraphApiWebpartProps } from './IGraphApiWebpartProps';
import { escape } from '@microsoft/sp-lodash-subset';
import { graphfi } from "@pnp/graph";
import { SPFx } from "@pnp/sp";
import "@pnp/graph/users";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
export interface IGraphApiWebpartState {
  selectedUsers: any[];
  allUsers: any[];
}
export default class GraphApiWebpart extends React.Component<IGraphApiWebpartProps, IGraphApiWebpartState> {
  constructor(props: IGraphApiWebpartProps) {
    super(props);

    this.state = {
      selectedUsers: [],
      allUsers:[]
    };
  }
  public async componentDidMount(): Promise<void> {
    const graph = graphfi().using(SPFx(this.props.context));
    try {
      const users = await graph.users();
      console.log("Fetched Users:", users);
      this.setState({
        allUsers: users.map((user: { id: any; displayName: any; mail: any; }) => ({
          key: user.id,
          text: user.displayName,
          secondaryText: user.mail,
        })),
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to fetch users. Check permissions and API access.");
    }
  }
  

  private onPeoplePickerChange = (items: any[]): void => {
    this.setState({ selectedUsers: items });
  };
  public render(): React.ReactElement<IGraphApiWebpartProps> {


    return (
      <div>
      <h2>Organization People Picker</h2>
      <PeoplePicker
        context={this.props.context}
        titleText="Select Users"
        personSelectionLimit={5}
        showtooltip={true}
        required={true}
        onChange={this.onPeoplePickerChange} // Corrected property name
        showHiddenInUI={false}
        principalTypes={[PrincipalType.User]}
        resolveDelay={1000}
      />
      <h3>Selected Users</h3>
      <ul>
        {this.state.selectedUsers.map((user, index) => (
          <li key={index}>
            {user.text} ({user.secondaryText})
          </li>
        ))}
      </ul>
    </div>
    );
  }
}
