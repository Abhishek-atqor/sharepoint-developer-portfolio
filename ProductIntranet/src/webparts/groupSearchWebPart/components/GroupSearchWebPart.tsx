import * as React from "react";
import styles from "./GroupSearchWebPart.module.scss";
import type { IGroupSearchWebPartProps } from "./IGroupSearchWebPartProps";
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/site-groups";
import "@pnp/sp/site-users";
import "@pnp/sp/site-users/web";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { DefaultButton } from "office-ui-fabric-react";

export interface IGroupSearchWebPartState {
  selectedGroupId: number | null;
  groupMembers: Array<{ id: number; title: string; email: string }>;
  loading: boolean;
}

export default class GroupSearchWebPart extends React.Component<
  IGroupSearchWebPartProps,
  IGroupSearchWebPartState
> {
  private sp: ReturnType<typeof spfi>;

  constructor(props: IGroupSearchWebPartProps) {
    super(props);

    this.state = {
      selectedGroupId: null,
      groupMembers: [],
      loading: false,
    };

    // Initialize PnP SP
    this.sp = spfi().using(SPFx(this.props.context));
  }

  handleGroupSelection = async (items: any[]) => {
    if (items.length > 0) {
      const selectedGroupId = parseInt(items[0].id, 10); // Use group ID
      this.setState({ selectedGroupId, groupMembers: [] });

      await this.fetchGroupMembers(selectedGroupId);
    } else {
      this.setState({ selectedGroupId: null, groupMembers: [] });
    }
  };

  fetchGroupMembers = async (groupId: number) => {
    try {
      this.setState({ loading: true });

      // Fetch group details and users
      const users = await this.sp.web.siteGroups.getById(groupId).users();

      const groupMembers = users.map((user) => ({
        id: user.Id,
        title: user.Title,
        email: user.Email,
      }));

      this.setState({ groupMembers, loading: false });
    } catch (error) {
      console.error("Error fetching group members:", error);
      this.setState({ loading: false });
    }
  };

  public render(): React.ReactElement<IGroupSearchWebPartProps> {
    const { groupMembers, loading } = this.state;

    return (
      <div className={styles.container}>
        <h2>Search Site Group</h2>
        <PeoplePicker
          context={this.props.context}
          titleText="Select a Site Group"
          personSelectionLimit={1}
          showHiddenInUI={false}
          principalTypes={[PrincipalType.SharePointGroup]}
          resolveDelay={500}
          onChange={this.handleGroupSelection}
        />
        <DefaultButton
          text="Clear Selection"
          onClick={() => this.setState({ selectedGroupId: null, groupMembers: [] })}
          className={styles.clearButton}
        />

        {loading ? (
          <p>Loading group members...</p>
        ) : groupMembers.length > 0 ? (
          <div className={styles.groupMembersContainer}>
            <h3>Group Members</h3>
            <ul>
              {groupMembers.map((member) => (
                <li key={member.id}>
                  <strong>{member.title}</strong> - {member.email}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No group members to display.</p>
        )}
      </div>
    );
  }
}
