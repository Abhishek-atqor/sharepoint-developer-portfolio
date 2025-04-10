import * as React from 'react';
import { SPFI, spfi, SPFx } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Pagination,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { ITicketsDetailProps } from './ITicketsDetailProps';
import { ITicketsDetailState } from './ITicketsDetailState';

export default class TicketsDetail extends React.Component<ITicketsDetailProps, ITicketsDetailState> {
  private sp: SPFI;
  private _CurrentUserEmail: string;

  constructor(props: ITicketsDetailProps) {
    super(props);
    this._CurrentUserEmail = this.props.context.pageContext.user.email;
    this.sp = spfi().using(SPFx(this.props.context));
    this.state = {
      Data: [],
      isLoading: false,
      pageSize: 8,
      currentPage: 1,
      searchQuery: '',
    };
  }

  // Fetch tickets data
  public fetchData = async () => {
    this.setState({ isLoading: true });
    try {
      const response = await this.sp.web.lists
        .getByTitle('Ticket List')
        .items.select('*', 'Assignedto0/Id', 'Assignedto0/EMail', 'Assignedto0/Title', 'Modified', 'Status')
        .expand('Assignedto0')
        .filter(`Assignedto0/EMail eq '${this._CurrentUserEmail}'`)
        .orderBy('Modified', false)();

      console.log(response, 'data');
      this.setState({ Data: response });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      this.setState({ isLoading: false });
    }
  };

  componentDidMount() {
    this.fetchData();
  }

  // Handle search input change
  private handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchQuery: event.target.value });
  };

  // Export data as Excel file
  exportData = () => {
    const { Data } = this.state;
    const exportData = Data.map((item: any) => ({
      IncidentID: item.IncidentID,
      Title: item.Title,
      DateReported: new Date(item.DateReported).toLocaleDateString(),
      Status: item.Status,
      Modified: new Date(item.Modified).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets Detail');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, 'TicketsDetail.xlsx');
  };

  // Get filtered and paginated data
  private getFilteredData = () => {
    const { Data, searchQuery } = this.state;
    return Data.filter((item: any) =>
      item.Title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  public render(): React.ReactElement<ITicketsDetailProps> {
    const { isLoading, searchQuery, currentPage, pageSize } = this.state;
    const filteredData = this.getFilteredData();
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const currentItems = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Columns for DataGrid
    const columns: GridColDef[] = [
      {
        field: 'IncidentID',
        headerName: 'Incident ID',
        flex: 1,
        sortable: true,
      },
      {
        field: 'Title',
        headerName: 'Title',
        flex: 2,
        sortable: true,
      },
      {
        field: 'DateReported',
        headerName: 'Date Reported',
        flex: 1,
        sortable: true,
        valueGetter: (params: any) =>
          new Date(params.row.DateReported).toLocaleDateString(),
      },
      {
        field: 'Status',
        headerName: 'Status',
        flex: 1,
        sortable: true,
      },
      {
        field: 'Modified',
        headerName: 'Last Modified',
        flex: 1,
        sortable: true,
        valueGetter: (params: any) =>
          new Date(params.row.Modified).toLocaleDateString(),
      },
    ];

    return (
      <div style={{ padding: '20px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <CircularProgress />
            <Typography variant="h6" style={{ marginTop: '10px' }}>
              Loading Tickets...
            </Typography>
          </div>
        ) : (
          <>
            <Typography
              variant="h4"
              sx={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#191970',
                marginBottom: '20px',
                fontFamily: 'Segoe UI, Arial, sans-serif',
                textAlign: 'center',
                backgroundColor: '#f0f8ff',
                padding: '10px',     
                borderRadius: '8px',  
              }}
            >
              {this.props.description}
            </Typography>


            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              {/* Search Box */}
              <TextField
                label="Search Tickets"
                variant="outlined"
                style={{ flex: 1, marginRight: '10px' }}
                value={searchQuery}
                onChange={this.handleSearch}
              />

              {/* Export Button */}
              <Button variant="contained" color="primary" onClick={this.exportData} style={{ minWidth: '120px' }}>
                Export Data
              </Button>
            </div>

            {/* DataGrid Table */}
            <Box sx={{ height: 530, width: '100%' }}>
              <DataGrid
                rows={currentItems}
                columns={columns}
                pagination
                getRowId={(row) => row.Id}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: pageSize, page: currentPage - 1 },
                  },
                }}
                onPaginationModelChange={(model) => this.setState({ currentPage: model.page + 1 })}
                paginationMode="client"
              />
            </Box>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => this.setState({ currentPage: value })}
                variant="outlined"
                color="primary"
                shape="rounded"
              />
            </div>
          </>
        )}
      </div>
    );
  }
}
