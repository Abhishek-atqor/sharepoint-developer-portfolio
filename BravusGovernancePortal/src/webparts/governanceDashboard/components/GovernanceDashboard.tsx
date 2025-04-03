import * as React from 'react';
import styles from './GovernanceDashboard.module.scss';
import type { IGovernanceDashboardProps } from './IGovernanceDashboardProps';
import { IGovernanceDashboardState } from './IGovernanceDashboardState';
import { SPFI, SPFx, spfi } from '@pnp/sp';
import { Table, Tabs, Button, Space, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { ListOperationService } from '../../../frameworks/services/ListOperation/ListOperationService';
import { getSP } from '../../../pnpjsConfig';
import { Constant } from '../../../frameworks/constants/Constant';
import * as moment from 'moment';
import '../assets/GovernanceDashboard.css';
const { TabPane } = Tabs;

export default class GovernanceDashboard extends React.Component<IGovernanceDashboardProps, IGovernanceDashboardState> {
  private _sp: SPFI = null;
  _listoperation: ListOperationService;

  constructor(props: IGovernanceDashboardProps) {
    super(props);
    this.state = {
      data: [],
      isLoading: true,
      selectedTab: '0',
      dynamicColumns: [],
    };
    this._listoperation = new ListOperationService();
  }

  public async componentDidMount() {
    await this._listoperation.Init(this.props.context);
    this._sp = getSP(this.props.context);
    await this.fetchData();
  }
  private fetchData = async () => {
    try {
      let listName = "";
      let selectColumns: string[] = [];
      let dynamicColumns: any[] = [];

      if (this.state.selectedTab === '0') {
        listName = Constant.SpListname;
        selectColumns = ["ID", "FullName", "Designation", "Department", "Company", "Date", "NotRecivedGifts", "ReceivedGiftsBenefits", "IterationDetails", "Signature", "SignatureDate", "Status"];
        dynamicColumns = [
          { title: 'ID', dataIndex: 'ID', key: 'ID' },
          { title: 'Full Name', dataIndex: 'FullName', key: 'FullName' },
          { title: 'Designation', dataIndex: 'Designation', key: 'Designation' },
          { title: 'Department', dataIndex: 'Department', key: 'Department' },
          { title: 'Company', dataIndex: 'Company', key: 'Company' },
          { title: 'Date', dataIndex: 'Date', key: 'Date', render: (text: string) => (text ? moment(text).format('DD-MM-YYYY') : '-') },
          { title: 'Not Received Gifts', dataIndex: 'NotRecivedGifts', key: 'NotRecivedGifts', render: (value: boolean) => (value ? 'Yes' : 'No') },
          { title: 'Received Gifts & Benefits', dataIndex: 'ReceivedGiftsBenefits', key: 'ReceivedGiftsBenefits', render: (value: boolean) => (value ? 'Yes' : 'No') },
          // { title: 'Iteration Details', dataIndex: 'IterationDetails', key: 'IterationDetails' },
          { title: 'Signature', dataIndex: 'Signature', key: 'Signature' },
          { title: 'Signature Date', dataIndex: 'SignatureDate', key: 'SignatureDate', render: (text: string) => (text ? moment(text).format('DD-MM-YYYY') : '-') },
          { title: 'Status', dataIndex: 'Status', key: 'Status' },
          {
            title: 'Actions',
            key: 'actions',
            render: (text: any, record: any) => (
              <Space size="middle">
                {record.Status === 'SaveAsDraft' && (
                  <>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => this.handleEdit(record)}
                    >
                      Edit
                    </Button>
                    {/* <Button
                      icon={<DeleteOutlined />}
                      onClick={() => this.handleDelete(record)}
                      danger
                    >
                      Delete
                    </Button> */}
                  </>
                )}
                {record.Status === 'Submit' || record.Status === 'Approved' && (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => this.handleEdit(record)}
                  >
                    View
                  </Button>
                )}

                {record.Status === 'Pending For Final Approval' && (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => this.handleEdit(record)}
                  >
                    View
                  </Button>
                )}


                {record.Status === 'Submit' && (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => this.handleEdit(record)}
                  >
                    View
                  </Button>
                )}

              </Space>
            ),
          },
        ];
      } else if (this.state.selectedTab === '1') {
        listName = Constant.SpListnameGiven;
        selectColumns = ["ID", "FullName", "Designation", "Department", "Company", "Date", "NotRecivedGifts", "ReceivedGiftsBenefits", "IterationDetails", "Signature", "SignatureDate", "Status"];
        dynamicColumns = [
          { title: 'ID', dataIndex: 'ID', key: 'ID' },
          { title: 'Full Name', dataIndex: 'FullName', key: 'FullName' },
          { title: 'Designation', dataIndex: 'Designation', key: 'Designation' },
          { title: 'Department', dataIndex: 'Department', key: 'Department' },
          { title: 'Company', dataIndex: 'Company', key: 'Company' },
          { title: 'Date', dataIndex: 'Date', key: 'Date', render: (text: string) => (text ? moment(text).format('DD-MM-YYYY') : '-') },
          { title: 'Not Received Gifts', dataIndex: 'NotRecivedGifts', key: 'NotRecivedGifts', render: (value: boolean) => (value ? 'Yes' : 'No') },
          { title: 'Received Gifts & Benefits', dataIndex: 'ReceivedGiftsBenefits', key: 'ReceivedGiftsBenefits', render: (value: boolean) => (value ? 'Yes' : 'No') },
          // { title: 'Iteration Details', dataIndex: 'IterationDetails', key: 'IterationDetails' },
          { title: 'Signature', dataIndex: 'Signature', key: 'Signature' },
          { title: 'Signature Date', dataIndex: 'SignatureDate', key: 'SignatureDate', render: (text: string) => (text ? moment(text).format('DD-MM-YYYY') : '-') },
          { title: 'Status', dataIndex: 'Status', key: 'Status' },
          {
            title: 'Actions',
            key: 'actions',
            render: (text: any, record: any) => (
              <Space size="middle">
                {record.Status === 'SaveAsDraft' && (
                  <>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => this.handleEdit(record)}
                    >
                      Edit
                    </Button>
                  </>
                )}

                {record.Status === 'Submit' || record.Status === 'Approved' && (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => this.handleEdit(record)}
                  >
                    View
                  </Button>
                )}

                {record.Status === 'Submit' && (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => this.handleEdit(record)}
                  >
                    View
                  </Button>
                )}

                {record.Status === 'Pending For Final Approval' && (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => this.handleEdit(record)}
                  >
                    View
                  </Button>
                )}
              </Space>
            ),
          },
        ];
      } else if (this.state.selectedTab === '2') {
        listName = Constant.COIListname;
        selectColumns = ["ID", "FullName", "Designation", "Department", "Company", "Date", "NoConflictInterestDeclaration", "COIDeclaration", "ItretionDetails", "Signature", "SignatureDate", "Status"];
        dynamicColumns = [
          { title: 'ID', dataIndex: 'ID', key: 'ID' },
          { title: 'Full Name', dataIndex: 'FullName', key: 'FullName' },
          { title: 'Designation', dataIndex: 'Designation', key: 'Designation' },
          { title: 'Department', dataIndex: 'Department', key: 'Department' },
          { title: 'Company', dataIndex: 'Company', key: 'Company' },
          { title: 'Date', dataIndex: 'Date', key: 'Date', render: (text: string) => (text ? moment(text).format('DD-MM-YYYY') : '-') },
          { title: 'No Conflict Interest Declaration', dataIndex: 'NoConflictInterestDeclaration', key: 'NoConflictInterestDeclaration', render: (value: boolean) => (value ? 'Yes' : 'No') },
          { title: 'COI Declaration', dataIndex: 'COIDeclaration', key: 'COIDeclaration', render: (value: boolean) => (value ? 'Yes' : 'No') },
          // { title: 'Iteration Details', dataIndex: 'ItretionDetails', key: 'ItretionDetails' },
          { title: 'Signature', dataIndex: 'Signature', key: 'Signature' },
          { title: 'Signature Date', dataIndex: 'SignatureDate', key: 'SignatureDate', render: (text: string) => (text ? moment(text).format('DD-MM-YYYY') : '-') },
          { title: 'Status', dataIndex: 'Status', key: 'Status' },
          {
            title: 'Actions',
            key: 'actions',
            render: (text: any, record: any) => (
              <Space size="middle">
                {record.Status === 'SaveAsDraft' && (
                  <>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => this.handleEdit(record)}
                    >
                      Edit
                    </Button>
                  </>
                )}
                {record.Status === 'Submit' || record.Status === 'Approved' && (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => this.handleEdit(record)}
                  >
                    View
                  </Button>
                )}

                {record.Status === 'Pending For Final Approval' && (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => this.handleEdit(record)}
                  >
                    View
                  </Button>
                )}

                {record.Status === 'Submit' && (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => this.handleEdit(record)}
                  >
                    View
                  </Button>
                )}

              </Space>
            ),
          },
        ];
      }

      const items = await this._listoperation.getItemsFromList(
        this.props.context,
        listName,
        '',
        selectColumns,
        [""],
        '',
        false
      );

      this.setState({ data: items, isLoading: false, dynamicColumns });
    } catch (error) {
      console.error('Error fetching list items:', error);
      this.setState({ isLoading: false });
    }
  };
  private handleTabChange = (key: string) => {
    this.setState({ selectedTab: key, isLoading: true }, () => {
      this.fetchData();
    });
  };

  public handleEdit = (record: any) => {
    const itemId = record.ID;
    const siteUrl = this.props.context.pageContext.web.absoluteUrl;
    let editUrl = '';
    let formMode = '';

    if (record.Status === 'SaveAsDraft' || record.Status === 'Resubmit') {
      formMode = 'Draft';
    } else if (record.Status === 'Submit' || record.Status === 'Pending For Final Approval') {
      formMode = 'Edit';
    }
    else {
      formMode = 'View';
    }

    if (this.state.selectedTab === '0') {
      editUrl = `${siteUrl}/SitePages/GovernancePortalGiftsReceived.aspx?itemID=${itemId}&formMode=${formMode}`;
    } else if (this.state.selectedTab === '1') {
      editUrl = `${siteUrl}/SitePages/GovernanceportalGiftsGiven.aspx?itemID=${itemId}&formMode=${formMode}`;
    } else if (this.state.selectedTab === '2') {
      editUrl = `${siteUrl}/SitePages/Conflictofintrest.aspx?itemID=${itemId}&formMode=${formMode}`;
    }

    console.log('Edit URL:', editUrl); // Debugging: Check the generated URL
    window.open(editUrl, '_blank');
  };
  public render(): React.ReactElement<IGovernanceDashboardProps> {
    const { data, isLoading, selectedTab, dynamicColumns } = this.state;
    return (
      <>
        <Tabs activeKey={selectedTab} onChange={this.handleTabChange} centered className="custom-tabs">
          <TabPane tab="Gifts And Benefits Received" key="0" />
          <TabPane tab="Gifts And Benefits Given" key="1" />
          <TabPane tab="Conflict Of Interest" key="2" />
        </Tabs>

        <Table
          columns={dynamicColumns}
          dataSource={data}
          loading={isLoading}
          rowKey="ID"
          pagination={{ pageSize: 20 }}
          className="custom-table"
        />
      </>
    );
  }
}
