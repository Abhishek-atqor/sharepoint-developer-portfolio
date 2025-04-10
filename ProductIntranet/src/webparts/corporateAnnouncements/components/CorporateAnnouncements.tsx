import * as React from 'react';
import styles from './CorporateAnnouncements.module.scss';
import type { ICorporateAnnouncementsProps } from './ICorporateAnnouncementsProps';
import { spfi, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';
import * as moment from 'moment';
import { DefaultButton, Modal, TextField, Dropdown, IDropdownOption, Spinner } from 'office-ui-fabric-react';
import { Pagination } from '@pnp/spfx-controls-react/lib/pagination'; // Import Pagination

interface IAnnouncement {
  id: number;
  title: string;
  description: string;
  date: string; // Format: YYYY-MM-DD
  category: string;
}

interface ICorporateAnnouncementsState {
  announcements: IAnnouncement[];
  filteredAnnouncements: IAnnouncement[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string;
  currentPage: number;
  pageSize: number;
  selectedAnnouncement: IAnnouncement | null;
  categories: IDropdownOption[]; // Added for dynamic category fetching
}

export default class CorporateAnnouncements extends React.Component<ICorporateAnnouncementsProps, ICorporateAnnouncementsState> {
  constructor(props: ICorporateAnnouncementsProps) {
    super(props);
    this.state = {
      announcements: [],
      filteredAnnouncements: [],
      isLoading: true,
      error: null,
      searchQuery: '',
      selectedCategory: 'All',
      currentPage: 1,
      pageSize: 4, // Set page size to 4 records per page
      selectedAnnouncement: null,
      categories: [], // Initialize categories
    };
  }

  componentDidMount(): void {
    this.fetchAnnouncements();
    this.fetchCategories(); // Call the function to fetch categories
  }

  fetchAnnouncements = async () => {
    const sp = spfi().using(SPFx(this.props.context));
    try {
      const items = await sp.web.lists
        .getByTitle('CorporateAnnouncements')
        .items.select('Id', 'Title', 'Description', 'EventDate', 'Category')();

      const announcements: IAnnouncement[] = items.map((item: any) => ({
        id: item.Id,
        title: item.Title,
        description: item.Description,
        date: moment(item.EventDate).format('YYYY-MM-DD'),
        category: item.Category || 'General',
      }));

      this.setState({
        announcements,
        filteredAnnouncements: announcements,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      this.setState({ isLoading: false, error: 'Failed to fetch announcements.' });
    }
  };

  fetchCategories = async () => {
    const sp = spfi().using(SPFx(this.props.context));
    try {
      // Fetch the list fields, specifically the Category field
      const list = await sp.web.lists.getByTitle('CorporateAnnouncements');
      const fields = await list.fields();

      // Find the Category field (Choice field)
      const categoryField = fields.find((field: any) => field.Title === 'Category');
      if (categoryField && categoryField.Choices) {
        const categories: IDropdownOption[] = categoryField.Choices.map((choice: string) => ({
          key: choice,
          text: choice,
        }));

        // Add an "All" option for filtering purposes
        categories.unshift({ key: 'All', text: 'All' });

        // Update the state with the fetched categories
        this.setState({ categories });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = event.target.value.toLowerCase();
    this.setState(
      { searchQuery },
      this.applyFilters // Reapply filters whenever search query changes
    );
  };

  handleCategoryChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    this.setState(
      { selectedCategory: option?.key as string || 'All' },
      this.applyFilters // Reapply filters whenever category changes
    );
  };

  applyFilters = () => {
    const { announcements, searchQuery, selectedCategory } = this.state;

    const filteredAnnouncements = announcements.filter((announcement) => {
      const matchesSearch =
        announcement.title.toLowerCase().includes(searchQuery) ||
        announcement.description.toLowerCase().includes(searchQuery);
      const matchesCategory =
        selectedCategory === 'All' || announcement.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    this.setState({ filteredAnnouncements, currentPage: 1 }); // Reset to the first page
  };

  getPaginatedAnnouncements = () => {
    const { filteredAnnouncements, currentPage, pageSize } = this.state;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAnnouncements.slice(startIndex, startIndex + pageSize);
  };

  changePage = (pageNumber: number) => {
    this.setState({ currentPage: pageNumber });
  };

  showDetails = (announcement: IAnnouncement) => {
    this.setState({ selectedAnnouncement: announcement });
  };

  closeDetails = () => {
    this.setState({ selectedAnnouncement: null });
  };

  exportToCSV = () => {
    const { announcements } = this.state;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Title,Description,Date,Category']
        .concat(
          announcements.map(
            (a) => `${a.title},${a.description},${a.date},${a.category}`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'announcements.csv');
    document.body.appendChild(link);
    link.click();
  };

  getCountdown = (date: string): string => {
    const now = moment();
    const eventDate = moment(date);
    const diff = eventDate.diff(now, 'days');
    return diff > 0
      ? `${diff} days remaining`
      : diff === 0
        ? 'Today!'
        : 'Event passed';
  };

  public render(): React.ReactElement<ICorporateAnnouncementsProps> {
    const {
      filteredAnnouncements,
      isLoading,
      error,
      currentPage,
      pageSize,
      selectedAnnouncement,
      categories,
    } = this.state;

    const totalPages = Math.ceil(filteredAnnouncements.length / pageSize);

    return (
      <div className={styles.corporateAnnouncements}>
        <h2>Corporate Announcements</h2>

        <div className={styles.controls}>
          <TextField
            placeholder="Search announcements..."
            onChange={this.handleSearch}
            ariaLabel="Search for announcements"
          />
          <Dropdown
            placeholder="Filter by category"
            options={categories}
            onChange={this.handleCategoryChange}
            ariaLabel="Filter by category"
          />
          <DefaultButton text="Export to CSV" onClick={this.exportToCSV} />
        </div>

        {isLoading ? (
          <Spinner label="Loading announcements..." />
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : filteredAnnouncements.length === 0 ? (
          <p>No announcements available.</p>
        ) : (
          <>
            <ul className={styles.announcementList}>
              {this.getPaginatedAnnouncements().map((announcement) => (
                <li
                  key={announcement.id}
                  onClick={() => this.showDetails(announcement)}
                  className={styles.announcementItem}
                >
                  <h3>{announcement.title}</h3>
                  <p>{announcement.description}</p>
                  <p>
                    <strong>Date:</strong> {moment(announcement.date).format('MMMM DD, YYYY')}
                  </p>
                  <p className={styles.countdown}>
                    <strong>Countdown:</strong> {this.getCountdown(announcement.date)}
                  </p>
                </li>
              ))}
            </ul>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={this.changePage}
            />
          </>
        )}

        {selectedAnnouncement && (
          <Modal isOpen={!!selectedAnnouncement} onDismiss={this.closeDetails}>
            <div className={styles.modalContent}>
              <h3>{selectedAnnouncement.title}</h3>
              <p>{selectedAnnouncement.description}</p>
              <p>{selectedAnnouncement.date}</p>
              <DefaultButton text="Close" onClick={this.closeDetails} />
            </div>
          </Modal>
        )}
      </div>
    );
  }
}
