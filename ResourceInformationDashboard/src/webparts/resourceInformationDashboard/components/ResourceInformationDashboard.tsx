import * as React from 'react';
import styles from './ResourceInformationDashboard.module.scss';
import type { IResourceInformationDashboardProps } from './IResourceInformationDashboardProps';
import { SPFI, SPFx, spfi } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/items/get-all";
import {
  Tabs,
  Tab,
  Button,
  IconButton,
  TextField,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import '../assets/CustomStyle.css';
import { Category } from '@mui/icons-material';
export interface IResourceInformation {
  Department: string;
  Designation: string;
  EmployeeName: string;
  Experience: string;
  Skills_Advanced: string;
  Skills_Basic: string;
  Skills_Moderate: string;
  ID: number;
}

export interface ISkillData {
  Skills: string;
  ID: number;
}

interface State {
  data: IResourceInformation[];
  skillsData: ISkillData[];
  tabIndex: number;
  isSkillsFilterOpen: boolean;
  filterType: 'basic' | 'moderate' | 'advanced';
  tempSelectedSkills: string[];
  appliedBasicSkillsFilter: string[];
  appliedModerateSkillsFilter: string[];
  appliedAdvancedSkillsFilter: string[];
  basicSkillsSearchText: string;
  moderateSkillsSearchText: string;
  advancedSkillsSearchText: string;
  showSkillsDropdown: boolean;
  isLoadingResources: boolean;
}
export default class ResourceInformationDashboard extends React.Component<IResourceInformationDashboardProps, State> {
  private sp = spfi().using(SPFx(this.props.context));
  constructor(props: IResourceInformationDashboardProps) {
    super(props);
    this.state = {
      data: [],
      skillsData: [],
      tabIndex: 0,
      isSkillsFilterOpen: false,
      filterType: 'basic',
      tempSelectedSkills: [],
      appliedBasicSkillsFilter: [],
      appliedModerateSkillsFilter: [],
      appliedAdvancedSkillsFilter: [],
      basicSkillsSearchText: '',
      moderateSkillsSearchText: '',
      advancedSkillsSearchText: '',
      showSkillsDropdown: false,
      isLoadingResources: false,
    };
  }

  public async componentDidMount() {
    await this.fetchResourceData();
    await this.fetchSkillsData();
  }

  private async fetchResourceData() {
    this.setState({ isLoadingResources: true }); // Start loading
    try {
      const items = await this.sp.web.lists.getByTitle('Resources Information').items
        .select('ID', 'BU', 'Designation', 'EmployeeName/Title', 'Experience', 'Skills_Advanced/Skills', 'Skills_Basic/Skills', 'Skills_Moderate/Skills', 'Category')
        .expand('EmployeeName', 'Skills_Advanced', 'Skills_Basic', 'Skills_Moderate')
        .getAll();
      const formattedData = items.map((item: any) => ({
        ID: item.ID,
        Department: item.BU,
        Designation: item.Designation,
        EmployeeName: item.EmployeeName?.Title || '',
        Experience: item.Experience,
        Skills_Basic: item.Skills_Basic?.map((skill: any) => skill.Skills).join(', ') || '',
        Skills_Moderate: item.Skills_Moderate?.map((skill: any) => skill.Skills).join(', ') || '',
        Skills_Advanced: item.Skills_Advanced?.map((skill: any) => skill.Skills).join(', ') || '',
        Category: item.Category
      }));
      this.setState({ data: formattedData, isLoadingResources: false });
    } catch (error) {
      console.error('Error fetching resource data:', error);
      this.setState({
        isLoadingResources: false // Stop loading even if error occurs
      });
    }
  }

  private async fetchSkillsData() {
    try {
      const items = await this.sp.web.lists.getByTitle('Skills').items.select('ID', 'Skills').getAll();
      const skillsData = items.map((item: any) => ({ ID: item.ID, Skills: item.Skills }));
      this.setState({ skillsData });
    } catch (error) {
      console.error('Error fetching skills data:', error);
    }
  }

  private getUniqueSkills = (): string[] => {
    const uniqueSkills = new Set<string>();
    this.state.skillsData.forEach(skill => uniqueSkills.add(skill.Skills));
    return Array.from(uniqueSkills).sort();
  };

  // private getFilteredData = (): IResourceInformation[] => {
  //   if (this.state.appliedSkillsFilter.length === 0) return this.state.data;

  //   return this.state.data.filter(item => {
  //     const itemSkills = item.Skills_Basic.toLowerCase().split(', ');
  //     return this.state.appliedSkillsFilter.some(filterSkill =>
  //       itemSkills.includes(filterSkill.toLowerCase())
  //     );
  //   });
  // };
  private getFilteredData = (): IResourceInformation[] => {
    let filteredData = this.state.data;

    // Apply Basic Skills filter
    if (this.state.appliedBasicSkillsFilter.length > 0) {
      filteredData = filteredData.filter(item => {
        const itemSkills = item.Skills_Basic.toLowerCase().split(', ');
        return this.state.appliedBasicSkillsFilter.some(filterSkill =>
          itemSkills.includes(filterSkill.toLowerCase())
        );
      });
    }

    // Apply Moderate Skills filter
    if (this.state.appliedModerateSkillsFilter.length > 0) {
      filteredData = filteredData.filter(item => {
        const itemSkills = item.Skills_Moderate.toLowerCase().split(', ');
        return this.state.appliedModerateSkillsFilter.some(filterSkill =>
          itemSkills.includes(filterSkill.toLowerCase())
        );
      });
    }

    // Apply Advanced Skills filter
    if (this.state.appliedAdvancedSkillsFilter.length > 0) {
      filteredData = filteredData.filter(item => {
        const itemSkills = item.Skills_Advanced.toLowerCase().split(', ');
        return this.state.appliedAdvancedSkillsFilter.some(filterSkill =>
          itemSkills.includes(filterSkill.toLowerCase())
        );
      });
    }

    return filteredData;
  };

  // private handleOpenSkillsFilter = () => {
  //   this.setState({
  //     isSkillsFilterOpen: true,
  //     tempSelectedSkills: [...this.state.appliedSkillsFilter],
  //     skillsSearchText: ''
  //   });
  // };
  private handleOpenSkillsFilter = (type: 'basic' | 'moderate' | 'advanced') => {
    let currentFilters: string[] = [];
    if (type === 'basic') currentFilters = this.state.appliedBasicSkillsFilter;
    if (type === 'moderate') currentFilters = this.state.appliedModerateSkillsFilter;
    if (type === 'advanced') currentFilters = this.state.appliedAdvancedSkillsFilter;

    this.setState({
      isSkillsFilterOpen: true,
      filterType: type,
      tempSelectedSkills: [...currentFilters],
      showSkillsDropdown: false
    });
  };
  private handleCloseSkillsFilter = () => {
    this.setState({
      isSkillsFilterOpen: false,
      showSkillsDropdown: false
    });
  };

  // private handleApplySkillsFilter = () => {
  //   this.setState({
  //     appliedSkillsFilter: [...this.state.tempSelectedSkills],
  //     isSkillsFilterOpen: false,
  //     skillsSearchText: this.state.tempSelectedSkills.join(', ')
  //   });
  // };
  private handleApplySkillsFilter = () => {
    const { filterType, tempSelectedSkills } = this.state;

    if (filterType === 'basic') {
      this.setState({
        appliedBasicSkillsFilter: [...tempSelectedSkills],
        isSkillsFilterOpen: false,
        basicSkillsSearchText: tempSelectedSkills.join(', ')
      });
    } else if (filterType === 'moderate') {
      this.setState({
        appliedModerateSkillsFilter: [...tempSelectedSkills],
        isSkillsFilterOpen: false,
        moderateSkillsSearchText: tempSelectedSkills.join(', ')
      });
    } else if (filterType === 'advanced') {
      this.setState({
        appliedAdvancedSkillsFilter: [...tempSelectedSkills],
        isSkillsFilterOpen: false,
        advancedSkillsSearchText: tempSelectedSkills.join(', ')
      });
    }
  };

  private handleClearSkillsFilter = () => {
    const { filterType } = this.state;

    if (filterType === 'basic') {
      this.setState({
        tempSelectedSkills: [],
        appliedBasicSkillsFilter: [],
        basicSkillsSearchText: ''
      });
    } else if (filterType === 'moderate') {
      this.setState({
        tempSelectedSkills: [],
        appliedModerateSkillsFilter: [],
        moderateSkillsSearchText: ''
      });
    } else if (filterType === 'advanced') {
      this.setState({
        tempSelectedSkills: [],
        appliedAdvancedSkillsFilter: [],
        advancedSkillsSearchText: ''
      });
    }
  };
  private handleSkillToggle = (skill: string) => {
    this.setState(prevState => {
      const newSelected = prevState.tempSelectedSkills.includes(skill)
        ? prevState.tempSelectedSkills.filter(s => s !== skill)
        : [...prevState.tempSelectedSkills, skill];

      return { tempSelectedSkills: newSelected };
    });
  };
  // private  = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const searchText = event.target.value;
  //   this.setState({
  //     skillsSearchThandleSearchInputChangeext: searchText,
  //     showSkillsDropdown: searchText.length >= 2
  //   });
  // };
  private handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'basic' | 'moderate' | 'advanced') => {
    const searchText = event.target.value;
    if (type === 'basic') {
      this.setState({
        basicSkillsSearchText: searchText,
        showSkillsDropdown: searchText.length >= 2
      });
    } else if (type === 'moderate') {
      this.setState({
        moderateSkillsSearchText: searchText,
        showSkillsDropdown: searchText.length >= 2
      });
    } else if (type === 'advanced') {
      this.setState({
        advancedSkillsSearchText: searchText,
        showSkillsDropdown: searchText.length >= 2
      });
    }
  };
  private renderSkillsFilterDialog = () => {
    const searchText = this.state.filterType === 'basic'
      ? this.state.basicSkillsSearchText
      : this.state.filterType === 'moderate'
        ? this.state.moderateSkillsSearchText
        : this.state.advancedSkillsSearchText;

    const filteredSkills = searchText
      ? this.getUniqueSkills().filter(skill =>
        skill.toLowerCase().includes(searchText.toLowerCase()))
      : this.getUniqueSkills();

    return (
      <Dialog
        open={this.state.isSkillsFilterOpen}
        onClose={this.handleCloseSkillsFilter}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Filter by {this.state.filterType.charAt(0).toUpperCase() + this.state.filterType.slice(1)} Skills</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={`Search ${this.state.filterType} skills...`}
            value={searchText}
            onChange={(e) => this.handleSearchInputChange(e as React.ChangeEvent<HTMLInputElement>, this.state.filterType)}
            sx={{ marginBottom: 2 }}
            autoFocus
          />
          {this.state.showSkillsDropdown && (
            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
              {filteredSkills.map((skill) => (
                <ListItem key={skill} disablePadding>
                  <ListItemButton onClick={() => this.handleSkillToggle(skill)}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={this.state.tempSelectedSkills.includes(skill)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText primary={skill} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClearSkillsFilter}>Clear All</Button>
          <Button onClick={this.handleCloseSkillsFilter}>Cancel</Button>
          <Button onClick={this.handleApplySkillsFilter} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>
    );
  };
  private handleAddNewResource = () => {
    const url = `https://atqor.sharepoint.com/sites/atQor-ResourceSkillsMatrix/_layouts/15/listform.aspx?PageType=8&ListId=%7B381BA63F-F99D-43C7-9208-C3743027D812%7D&RootFolder=%2Fsites%2FatQor-ResourceSkillsMatrix%2FLists%2FResource%20Details&Source=https%3A%2F%2Fatqor.sharepoint.com%2Fsites%2FatQor-ResourceSkillsMatrix%2FLists%2FResource%2520Details%2FAllItems.aspx&ContentTypeId=0x010007F5C4FBD205224DA37673A415E0AD6B00E84F5D2D18276A4FA05A333C3EADD2E0`;
    window.open(url, '_blank');
  };

  private handleAddNewSkill = () => {
    const url = `https://atqor.sharepoint.com/sites/atQor-ResourceSkillsMatrix/_layouts/15/listform.aspx?PageType=8&ListId=%7B2578F197-8F48-4D90-8DF4-EBDAA3EB74A5%7D&RootFolder=%2Fsites%2FatQor-ResourceSkillsMatrix%2FLists%2FSkills%20Details&Source=https%3A%2F%2Fatqor.sharepoint.com%2Fsites%2FatQor-ResourceSkillsMatrix%2FLists%2FSkills%2520Details%2FAllItems.aspx&ContentTypeId=0x01001276748FA38D1A4C8CBF7481673304C000ABACF867FB99004191A0989B0B7B3EF0`;
    window.open(url, '_blank');
  };

  private handleEditResource = (id: number) => {
    const url = `https://atqor.sharepoint.com/sites/atQor-ResourceSkillsMatrix/Lists/Resource%20Details/EditForm.aspx?ID=${id}`;
    window.open(url, '_blank');
  };

  private handleDeleteResource = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this resource item?')) {
      try {
        await this.sp.web.lists.getByTitle('Resources Information').items.getById(id).delete();
        alert('Resource item deleted successfully');
        await this.fetchResourceData();
      } catch (error) {
        console.error('Error deleting resource item:', error);
      }
    }
  };

  private handleDeleteSkill = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this skill item?')) {
      try {
        await this.sp.web.lists.getByTitle('Skills').items.getById(id).delete();
        alert('Skill item deleted successfully');
        await this.fetchSkillsData();
      } catch (error) {
        console.error('Error deleting skill item:', error);
      }
    }
  };

  private handleEditSkill = (id: number) => {
    const url = `https://atqor.sharepoint.com/sites/atQor-ResourceSkillsMatrix/Lists/Skills%20Details/EditForm.aspx?ID=${id}`;
    window.open(url, '_blank');
  };

  private handleViewResource = (id: number) => {
    const url = `https://atqor.sharepoint.com/sites/atQor-ResourceSkillsMatrix/Lists/Resource%20Details/DispForm.aspx?ID=${id}`;
    window.open(url, '_blank');
  };

  public render(): React.ReactElement<IResourceInformationDashboardProps> {
    const filteredData = this.getFilteredData();

    const resourceColumns: MRT_ColumnDef<IResourceInformation>[] = [
      {
        id: 'actions',
        header: 'Actions',
        enableColumnFilter: false,
        enableHiding: false,
        size: 150,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <IconButton
              onClick={() => this.handleViewResource(row.original.ID)}
              size="small"
              color="primary"
              title="View"
              sx={{ color: '#1976d2' }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => this.handleEditResource(row.original.ID)}
              size="small"
              color="secondary"
              title="Edit"
              sx={{ color: '#9c27b0' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => this.handleDeleteResource(row.original.ID)}
              size="small"
              color="error"
              title="Delete"
              sx={{ color: '#d32f2f' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
      {
        accessorKey: 'Department',
        header: 'Department',
        filterFn: 'contains',
        size: 150
      },
      {
        accessorKey: 'Designation',
        header: 'Designation',
        filterFn: 'contains',
        size: 150
      },
      {
        accessorKey: 'EmployeeName',
        header: 'Employee Name',
        filterFn: 'contains',
        size: 200,
        Cell: ({ row }) => (
          <Box
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => this.handleViewResource(row.original.ID)}
          >
            {row.original.EmployeeName}
          </Box>
        ),
      },
      {
        accessorKey: 'Experience',
        header: 'Experience',
        filterFn: 'equals',
        size: 120
      },
      // {
      //   accessorKey: 'Category',
      //   header: 'Category',
      //   filterFn: 'contains',
      //   size: 120
      // }, 
      {
        accessorKey: "Skills_Basic",
        header: "Basic Skills",
        size: 300,
        Filter: () => (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <TextField
              className='Basicskillssearch'
              variant="outlined"
              placeholder="Filter Basic skills..."
              value={this.state.basicSkillsSearchText}
              onChange={(e) => {
                this.setState({ basicSkillsSearchText: e.target.value });
                this.handleOpenSkillsFilter('basic');
              }}
              sx={{
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  cursor: 'text'
                }
              }}
              InputProps={{
                endAdornment: this.state.appliedBasicSkillsFilter.length > 0 && (
                  <Box sx={{ color: 'text.secondary', ml: 1 }}>
                    ({this.state.appliedBasicSkillsFilter.length})
                  </Box>
                )
              }}
            />
            {this.state.appliedBasicSkillsFilter.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {this.state.appliedBasicSkillsFilter.map(skill => (
                  <Chip
                    key={skill}
                    label={skill}
                    size="small"
                    onDelete={() => {
                      this.setState(prevState => ({
                        appliedBasicSkillsFilter: prevState.appliedBasicSkillsFilter.filter(s => s !== skill),
                        basicSkillsSearchText: prevState.appliedBasicSkillsFilter
                          .filter(s => s !== skill)
                          .join(', ')
                      }));
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!this.state.appliedBasicSkillsFilter.length) return true;
          const rowSkills = row.original.Skills_Basic.toLowerCase().split(', ');
          return this.state.appliedBasicSkillsFilter.some(skill =>
            rowSkills.includes(skill.toLowerCase())
          );
        },
      },
      {
        accessorKey: "Skills_Moderate",
        header: "Moderate Skills",
        size: 300,
        Filter: () => (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <TextField
              className='Basicskillssearch'
              variant="outlined"
              placeholder="Filter Moderate skills..."
              value={this.state.moderateSkillsSearchText}
              onChange={(e) => {
                this.setState({ moderateSkillsSearchText: e.target.value });
                this.handleOpenSkillsFilter('moderate');
              }}
              sx={{
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  cursor: 'text'
                }
              }}
              InputProps={{
                endAdornment: this.state.appliedModerateSkillsFilter.length > 0 && (
                  <Box sx={{ color: 'text.secondary', ml: 1 }}>
                    ({this.state.appliedModerateSkillsFilter.length})
                  </Box>
                )
              }}
            />
            {this.state.appliedModerateSkillsFilter.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {this.state.appliedModerateSkillsFilter.map(skill => (
                  <Chip
                    key={skill}
                    label={skill}
                    size="small"
                    onDelete={() => {
                      this.setState(prevState => ({
                        appliedModerateSkillsFilter: prevState.appliedModerateSkillsFilter.filter(s => s !== skill),
                        moderateSkillsSearchText: prevState.appliedModerateSkillsFilter
                          .filter(s => s !== skill)
                          .join(', ')
                      }));
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!this.state.appliedModerateSkillsFilter.length) return true;
          const rowSkills = row.original.Skills_Moderate.toLowerCase().split(', ');
          return this.state.appliedModerateSkillsFilter.some(skill =>
            rowSkills.includes(skill.toLowerCase())
          );
        },
      },
      {
        accessorKey: "Skills_Advanced",
        header: "Advanced Skills",
        size: 300,
        Filter: () => (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <TextField
              className='Basicskillssearch'
              variant="outlined"
              placeholder="Filter Advanced skills..."
              value={this.state.advancedSkillsSearchText}
              onChange={(e) => {
                this.setState({ advancedSkillsSearchText: e.target.value });
                this.handleOpenSkillsFilter('advanced');
              }}
              sx={{
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  cursor: 'text'
                }
              }}
              InputProps={{
                endAdornment: this.state.appliedAdvancedSkillsFilter.length > 0 && (
                  <Box sx={{ color: 'text.secondary', ml: 1 }}>
                    ({this.state.appliedAdvancedSkillsFilter.length})
                  </Box>
                )
              }}
            />
            {this.state.appliedAdvancedSkillsFilter.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {this.state.appliedAdvancedSkillsFilter.map(skill => (
                  <Chip
                    key={skill}
                    label={skill}
                    size="small"
                    onDelete={() => {
                      this.setState(prevState => ({
                        appliedAdvancedSkillsFilter: prevState.appliedAdvancedSkillsFilter.filter(s => s !== skill),
                        advancedSkillsSearchText: prevState.appliedAdvancedSkillsFilter
                          .filter(s => s !== skill)
                          .join(', ')
                      }));
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!this.state.appliedAdvancedSkillsFilter.length) return true;
          const rowSkills = row.original.Skills_Advanced.toLowerCase().split(', ');
          return this.state.appliedAdvancedSkillsFilter.some(skill =>
            rowSkills.includes(skill.toLowerCase())
          );
        },
      }
    ];

    const skillsColumns: MRT_ColumnDef<ISkillData>[] = [
      {
        accessorKey: 'Skills',
        header: 'Skills',
        filterFn: 'contains',
        size: 300
      },
      {
        id: 'skillActions',
        header: 'Actions',
        enableColumnFilter: false,
        enableHiding: false,
        size: 120,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <IconButton
              onClick={() => this.handleEditSkill(row.original.ID)}
              size="small"
              color="secondary"
              title="Edit"
              sx={{ color: '#9c27b0' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => this.handleDeleteSkill(row.original.ID)}
              size="small"
              color="error"
              title="Delete"
              sx={{ color: '#d32f2f' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    ];

    return (
      // <div className={styles.resourceInformationDashboard}>
      //   {this.renderSkillsFilterDialog()}

      //   <Tabs
      //     value={this.state.tabIndex}
      //     onChange={(_, newIndex) => this.setState({ tabIndex: newIndex })}
      //     sx={{ marginBottom: 2 }}
      //   >
      //     <Tab label="Resource Information" />
      //     <Tab label="Skills" />
      //   </Tabs>

      //   {this.state.tabIndex === 0 ? (
      //     <MaterialReactTable
      //       columns={resourceColumns}
      //       data={filteredData}
      //       enableColumnResizing
      //       initialState={{
      //         density: 'compact',
      //         pagination: { pageIndex: 0, pageSize: 100 },
      //         showColumnFilters: true,
      //       }}
      //       columnResizeMode="onEnd"
      //       positionToolbarAlertBanner="bottom"
      //       enablePinning
      //       enableGrouping
      //       enableStickyHeader
      //       enableStickyFooter
      //       enableDensityToggle={false}
      //       enableExpandAll={false}
      //       renderTopToolbarCustomActions={() => (
      //         <Button
      //           variant="contained"
      //           onClick={this.handleAddNewResource}
      //           sx={{ marginRight: 1 }}
      //         >
      //           Add New Resource
      //         </Button>
      //       )}
      //       muiTableBodyRowProps={({ row }) => ({
      //         sx: {
      //           '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
      //         }
      //       })}
      //     />
      //   ) : (
      //     <MaterialReactTable
      //       columns={skillsColumns}
      //       data={this.state.skillsData}
      //       enableColumnResizing
      //       initialState={{
      //         density: 'compact',
      //         pagination: { pageIndex: 0, pageSize: 100 },
      //         showColumnFilters: true
      //       }}
      //       columnResizeMode="onEnd"
      //       positionToolbarAlertBanner="bottom"
      //       enablePinning
      //       enableGrouping
      //       enableStickyHeader
      //       enableStickyFooter
      //       enableDensityToggle={false}
      //       enableExpandAll={false}
      //       renderTopToolbarCustomActions={() => (
      //         <Button
      //           variant="contained"
      //           onClick={this.handleAddNewSkill}
      //           sx={{ marginRight: 1 }}
      //         >
      //           Add New Skill
      //         </Button>
      //       )}
      //       muiTableBodyRowProps={({ row }) => ({
      //         sx: {
      //           '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
      //         }
      //       })}
      //     />
      //   )}
      // </div>
      <div className={styles.resourceInformationDashboard}>
        {this.renderSkillsFilterDialog()}

        <Tabs
          value={this.state.tabIndex}
          onChange={(_, newIndex) => this.setState({ tabIndex: newIndex })}
          sx={{ marginBottom: 2 }}
        >
          <Tab label="Resource Information" />
          <Tab label="Skills" />
        </Tabs>

        {this.state.isLoadingResources ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="300px"
          >
            <CircularProgress />
          </Box>
        ) : this.state.tabIndex === 0 ? (
          <MaterialReactTable
            columns={resourceColumns}
            data={filteredData}
            enableColumnResizing
            initialState={{
              density: 'compact',
              pagination: { pageIndex: 0, pageSize: 100 },
              showColumnFilters: true,
            }}
            columnResizeMode="onEnd"
            positionToolbarAlertBanner="bottom"
            enablePinning
            enableGrouping
            enableStickyHeader
            enableStickyFooter
            enableDensityToggle={false}
            enableExpandAll={false}
            renderTopToolbarCustomActions={() => (
              <Button
                variant="contained"
                onClick={this.handleAddNewResource}
                sx={{ marginRight: 1 }}
              >
                Add New Resource
              </Button>
            )}
            muiTableBodyRowProps={({ row }) => ({
              sx: {
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
              }
            })}
          />
        ) : (
          <MaterialReactTable
            columns={skillsColumns}
            data={this.state.skillsData}
            enableColumnResizing
            initialState={{
              density: 'compact',
              pagination: { pageIndex: 0, pageSize: 100 },
              showColumnFilters: true
            }}
            columnResizeMode="onEnd"
            positionToolbarAlertBanner="bottom"
            enablePinning
            enableGrouping
            enableStickyHeader
            enableStickyFooter
            enableDensityToggle={false}
            enableExpandAll={false}
            renderTopToolbarCustomActions={() => (
              <Button
                variant="contained"
                onClick={this.handleAddNewSkill}
                sx={{ marginRight: 1 }}
              >
                Add New Skill
              </Button>
            )}
            muiTableBodyRowProps={({ row }) => ({
              sx: {
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
              }
            })}
          />
        )}
      </div>
    );
  }
}