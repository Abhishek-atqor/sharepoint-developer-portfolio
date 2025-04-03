import * as React from 'react';
import styles from './GiftsAndBenifitsGiven.module.scss';
import type { IGiftsAndBenifitsGivenProps } from './IGiftsAndBenifitsGivenProps';
import { ListOperationService } from '../../../frameworks/services/ListOperation/ListOperationService';
import { IValidationService, ValidationService } from '../../../frameworks/services/ValidationServices/ValidationService';
import { SPFI, spfi } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/site-groups";
import "@pnp/sp/site-users/web";
import { IGiftsAndBenifitsGivenState } from './IGiftsAndBenifitsGivenState';
import { Checkbox, DatePicker, PrimaryButton, DefaultButton, TextField, Dialog, DialogFooter, DialogType, Label } from 'office-ui-fabric-react';
import '../assets/GiftsAndBenifitsGiven.css';
import { GiftsAndBenefitsGivenValidation } from '../../../frameworks/model/IGiftsAndBenefitsGivenValidation';
import { IGiftItemGiven } from '../../../frameworks/model/ISplistItem';
import * as moment from 'moment';
import { getSP } from '../../../pnpjsConfig';
import { Constant } from '../../../frameworks/constants/Constant';
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
export default class GiftsAndBenifitsGiven extends React.Component<IGiftsAndBenifitsGivenProps, IGiftsAndBenifitsGivenState> {
  private _sp: SPFI = null;
  private _validationService: IValidationService = null;
  private _listoperation: ListOperationService;
  CustID: any;
  private sharepointGroupName: string = "Manager-CEO";
  public constructor(props: IGiftsAndBenifitsGivenProps) {
    super(props);
    let validationConstant = new GiftsAndBenefitsGivenValidation();
    this.state = {
      SplistItem: {
        fullname: '',
        designation: '',
        department: '',
        company: '',
        date: null,
        notReceivedGifts: false,
        receivedGiftsCheckbox: false,
        receivedGifts: [
          {
            dateGiven: null,
            name: '',
            businessEntity: '',
            description: '',
            value: '',
            reason: '',
          },
        ],
        signature: '',
        signatureDate: null,
      },
      validation: { ...validationConstant },
      showValidationDialog: false,
      isEditMode: false,
      status: '',
      hasAccess: false,
      IsCompliancegroupMamber: false,
      Isloader: false,
      users: [],
      hasAccesscompliancegroup: false,
      selectedUsers: "",
      showSuccessDialog: false,
      showDraftDialog: false
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this._validationService = new ValidationService();
    this._listoperation = new ListOperationService();
  }
  public async componentDidMount() {
    await this._listoperation.Init(this.props.context);
    this._sp = getSP(this.props.context);
    await this.fetchUsersFromGroup();
    const usergrouparray = await this._listoperation.checkUserGroup(this.props.context);
    let isRequestor = false;
    let isComplianceMember = false;

    for (const group of usergrouparray) {
      if (group.LoginName === "Requestors") {
        // isRequestor = true;
        this.setState({ hasAccess: true });
      }
      if (group.LoginName === "Compliance Group") {
        // isComplianceMember = true;
        this.setState({ hasAccesscompliancegroup: true });
      }
    }

    let formMode = this.getParameterByName("formMode", window.location.href);
    this.CustID = this.getParameterByName("itemID", window.location.href);

    if (this.CustID) {
      await this.BindAllListdata(Number(this.CustID));

      // Check the status after binding data
      if (this.state.status === "SaveAsDraft") {
        formMode = "SaveAsDraft";
      } else if (this.state.status === "Submit") {
        formMode = "Edit";
      }
      else if (this.state.status === "Approved") {
        formMode = "View";
      }
    }

    this.setState({
      isEditMode: true
    });
  }
  private fetchUsersFromGroup = async () => {
    try {
      const groupUsers = await this._sp.web.siteGroups.getByName(this.sharepointGroupName).users();
      console.log("Fetched Users:", groupUsers);

      const userOptions: IDropdownOption[] = groupUsers.map((user) => ({
        key: user.Id.toString(),
        text: user.Title,
      }));

      this.setState({ users: userOptions });
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    finally {
      this.setState({ Isloader: false })
    }
  };
  private async BindAllListdata(itemID: number) {
    try {
      // Fetch the item from the SharePoint list using the itemID
      const item: any = await this._listoperation.getItemById(this.props.context, Constant.SpListnameGiven, itemID, ["ID", "Title", "FullName", "Designation", "Department", "Company", "Date", "NotRecivedGifts", "ReceivedGiftsBenefits", "IterationDetails", "Signature", "SignatureDate", "Status"], [""]);
      console.log(item);

      const rawIterationDetails = item.IterationDetails || "";

      // Extract JSON content if wrapped in an HTML tag
      const jsonMatch = rawIterationDetails.match(/>(.*?)<\/div>/);
      const encodedJson = jsonMatch ? jsonMatch[1] : rawIterationDetails;

      // Decode HTML entities
      const decodeHtmlEntities = (text: string) => {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = text;
        return textarea.value;
      };

      let decodedJson = decodeHtmlEntities(encodedJson).trim();

      // Ensure JSON is properly formatted by wrapping it in square brackets if necessary
      if (!decodedJson.startsWith("[") || !decodedJson.endsWith("]")) {
        decodedJson = `[${decodedJson}]`;
      }

      let receivedGifts = [];
      try {
        receivedGifts = JSON.parse(decodedJson);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }

      const parseDateString = (dateStr: string) => {
        if (!dateStr) return null; // Handle empty or undefined values

        const [day, month, year] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day); // Month is 0-based in JavaScript
      };

      const parsedGifts = receivedGifts.map(gift => ({
        ...gift,
        dateGiven: parseDateString(gift.dateGiven) // Convert dateGiven to Date object
      }));

      // Get the status of the item
      const status = item.Status || "";

      // Update the state with the fetched data and status
      this.setState({
        SplistItem: {
          fullname: item.FullName || '',
          designation: item.Designation || '',
          department: item.Department || '',
          company: item.Company || '',
          date: item.Date ? new Date(item.Date) : null,
          notReceivedGifts: item.NotRecivedGifts || false,
          receivedGiftsCheckbox: item.ReceivedGiftsBenefits || false,
          receivedGifts: parsedGifts,
          signature: item.Signature || '',
          signatureDate: item.SignatureDate ? new Date(item.SignatureDate) : null,
        },
        status: status, // Save status in state
      });
    } catch (error) {
      console.error('Error fetching data from SharePoint list:', error);
      alert('An error occurred while fetching the data. Please try again.');
    }
  }
  public IsStrNullOrEmpty(str: any) {
    return str === null || str === undefined || str === '';
  }
  // Call for get the parameter from query string
  public getParameterByName(name: any, url: any) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
  public isFormvalid() {  // check validations
    let valid: boolean = true;
    let tempFormControl = { ...this.state.SplistItem };
    let tempValidation: boolean = true;
    let newValidationState = { ...this.state.validation };
    [tempValidation, newValidationState.validationfullname] = this._validationService.isTextFieldEmpty(tempFormControl.fullname, newValidationState.validationfullname);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationdesignation] = this._validationService.isTextFieldEmpty(tempFormControl.designation, newValidationState.validationdesignation);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationdepartment] = this._validationService.isTextFieldEmpty(tempFormControl.department, newValidationState.validationdepartment);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationcompany] = this._validationService.isTextFieldEmpty(tempFormControl.company, newValidationState.validationcompany);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationdate] = this._validationService.isDateFieldEmpty(tempFormControl.date, newValidationState.validationdate);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationsignature] = this._validationService.isTextFieldEmpty(tempFormControl.signature, newValidationState.validationsignature);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationsignatureDate] = this._validationService.isDateFieldEmpty(tempFormControl.signatureDate, newValidationState.validationsignatureDate);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationnotReceivedGifts] = this._validationService.isCheckboxChecked(tempFormControl.notReceivedGifts, newValidationState.validationnotReceivedGifts);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationreceivedGiftsCheckbox] = this._validationService.isCheckboxChecked(tempFormControl.receivedGiftsCheckbox, newValidationState.validationreceivedGiftsCheckbox);
    valid = valid && !tempValidation;
    if (valid) {
      valid = true;
    }
    else {
      valid = false;
    }
    this.setState({ validation: newValidationState });
    return valid;

  }
  handleChange = (field: string, value: any) => {
    this.setState((prevState) => ({
      SplistItem: {
        ...prevState.SplistItem,
        [field]: value,
      },
      validation: {
        ...prevState.validation,
        [`validation${field}`]: value ? '' : prevState.validation[`validation${field}`], // Clear validation only if value is entered
      },
    }));
  };

  private handleDateChange = (field: keyof IGiftsAndBenifitsGivenState["SplistItem"], date: any) => {
    this.setState(prevState => ({
      SplistItem: {
        ...prevState.SplistItem,
        [field]: date
      },
      validation: {
        ...prevState.validation,
        [`validation${field}`]: date ? '' : prevState.validation[`validation${field}`], // Clear validation only if date is entered
      },
    }));
  };
  public async onResubmitClick() {
    try {
      this.setState({ Isloader: true });
      // const { allBoolean } = this.state;
      const isValidate = this.isFormvalid();
      if (!isValidate) {
        this.setState({ showValidationDialog: true, Isloader: false }); // Show the dialog if the form is not valid
        return;
      }

      const { SplistItem } = this.state;
      // Format the receivedGifts dates to DD-MM-YYYY
      const formattedReceivedGifts = SplistItem.receivedGifts.map(gift => ({
        ...gift,
        dateGiven: gift.dateGiven ? moment(gift.dateGiven).format('DD-MM-YYYY') : null,
      }));
      const iterationDetails = JSON.stringify(formattedReceivedGifts);

      const listItem = {
        'Title': SplistItem.fullname,
        'FullName': SplistItem.fullname,
        'Designation': SplistItem.designation,
        'Department': SplistItem.department,
        'Company': SplistItem.company,
        'Date': new Date(SplistItem.date),
        'NotRecivedGifts': SplistItem.notReceivedGifts,
        'ReceivedGiftsBenefits': SplistItem.receivedGiftsCheckbox,
        'IterationDetails': iterationDetails,
        'Signature': SplistItem.signature,
        'SignatureDate': new Date(SplistItem.signatureDate),
        'Status': 'Resubmit'
      };

      await this._listoperation.updateItemInList(this.props.context, Constant.SpListnameGiven, this.CustID, listItem);
      // this.setState({ Isloader: false });
      alert("Form Resubmitted successfully!");
      this.setState({ Isloader: false });
      window.location.href = this.props.context.pageContext.web.absoluteUrl

    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error submitting form. Please try again.");
      this.setState({ Isloader: false });
    }
  };
  private handleSubmit = async () => {
    this.setState({ Isloader: true });
    const isValidate = this.isFormvalid();
    if (!isValidate) {
      this.setState({ showValidationDialog: true, Isloader: false }); // Show the dialog if the form is not valid
      return;
    }

    const { SplistItem } = this.state;
    // Format the receivedGifts dates to DD-MM-YYYY
    const formattedReceivedGifts = SplistItem.receivedGifts.map(gift => ({
      ...gift,
      dateGiven: gift.dateGiven ? moment(gift.dateGiven).format('DD-MM-YYYY') : null,
    }));
    const iterationDetails = JSON.stringify(formattedReceivedGifts);
    // const iterationDetails = JSON.stringify(SplistItem.receivedGifts);
    try {
      const listItem = {
        'Title': SplistItem.fullname,
        'FullName': SplistItem.fullname,
        'Designation': SplistItem.designation,
        'Department': SplistItem.department,
        'Company': SplistItem.company,
        'Date': new Date(SplistItem.date),
        'NotRecivedGifts': SplistItem.notReceivedGifts,
        'ReceivedGiftsBenefits': SplistItem.receivedGiftsCheckbox,
        'IterationDetails': iterationDetails,
        'Signature': SplistItem.signature,
        'SignatureDate': new Date(SplistItem.signatureDate),
        'Status': 'Submit'
      };
      let itemId: number | null = null;
      let isNewItem = false; // Flag to check if it's a new item

      if (this.state.isEditMode && this.CustID) {
        isNewItem = true;
        itemId = this.CustID;
        await this._listoperation.updateItemInList(this.props.context, Constant.SpListnameGiven, Number(this.CustID), listItem);
      }
      else if (this.state.isEditMode && this.CustID && this.state.status === "Pending For Final Approval") {
        isNewItem = false;
        itemId = this.CustID;
        const itemsforUpdate = {
          "FinalApproverId": Number(this.state.selectedUsers),
          "Status": 'Pending For Final Approval',
        }
        await this._listoperation.updateItemInList(this.props.context, Constant.SpListnameGiven, this.CustID, itemsforUpdate);
      }
      else {
        isNewItem = true; // Mark as new item
        const response = await this._listoperation.addItemsToList(this.props.context, Constant.SpListnameGiven, listItem);
        itemId = response.Id;
      }
      // **Trigger Power Automate flow only if it's a new item**
      if (isNewItem && itemId) {
        await this.triggerPowerAutomateFlow(itemId, listItem);
      }
      console.log('Data saved successfully!');
      this.setState({ showSuccessDialog: true, Isloader: false })

      setTimeout(() => {
        window.location.href = this.props.context.pageContext.web.absoluteUrl;
      }, 5000); // Adjust delay if needed
    }
    catch (error) {
      console.error('Error saving data to SharePoint list:', error);
      alert('An error occurred while submitting the form. Please try again.');
      this.setState({ Isloader: false });
    }
  };
  // **Function to trigger Power Automate Flow**
  private async triggerPowerAutomateFlow(itemId: number, itemData: any) {
    try {
      const flowUrl = "https://prod-29.australiasoutheast.logic.azure.com:443/workflows/6a8db18a0e7041f6bd464b45a2db0563/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=3reueJP1ffplCt1K1gvZRXkvo0GAV-WnMJ0Ee2oap_k";

      const requestBody = {
        itemId: itemId,
        ListName: Constant.SpListnameGiven,  // Passing the item ID to Power Automate
        ...itemData
      };

      const response = await fetch(flowUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Flow trigger failed: ${response.statusText}`);
      }

      console.log("Power Automate flow triggered successfully");
    } catch (error) {
      console.error("Error triggering Power Automate flow:", error);
    }
  }

  handleSaveAsDraft = async () => {
    const { SplistItem } = this.state;
    // Format the receivedGifts dates to DD-MM-YYYY
    const formattedReceivedGifts = SplistItem.receivedGifts.map(gift => ({
      ...gift,
      dateGiven: gift.dateGiven ? moment(gift.dateGiven).format('DD-MM-YYYY') : null,
    }));
    const iterationDetails = JSON.stringify(formattedReceivedGifts);
    // const iterationDetails = JSON.stringify(SplistItem.receivedGifts);

    // Prepare the list item with conditional date fields
    const listItem: any = {
      'Title': SplistItem.fullname,
      'FullName': SplistItem.fullname,
      'Designation': SplistItem.designation,
      'Department': SplistItem.department,
      'Company': SplistItem.company,
      'NotRecivedGifts': SplistItem.notReceivedGifts,
      'ReceivedGiftsBenefits': SplistItem.receivedGiftsCheckbox,
      'IterationDetails': iterationDetails,
      'Signature': SplistItem.signature,
      'Status': 'SaveAsDraft' // Set the status to "Save As Draft"
    };

    // Only add the Date field if it has a valid value
    if (SplistItem.date) {
      listItem['Date'] = new Date(SplistItem.date);
    }

    // Only add the SignatureDate field if it has a valid value
    if (SplistItem.signatureDate) {
      listItem['SignatureDate'] = new Date(SplistItem.signatureDate);
    }

    try {
      await this._listoperation.addItemsToList(this.props.context, Constant.SpListnameGiven, listItem);
      console.log('Data saved as draft successfully!');
      this.setState({ showDraftDialog: true })
    } catch (error) {
      console.error('Error saving data to SharePoint list:', error);
      alert('An error occurred while saving the form as draft. Please try again.');
    }
  };
  handleCancel = () => {
    window.location.href = this.props.context.pageContext.web.absoluteUrl;
  };

  addGiftRow = () => {
    this.setState(prevState => ({
      SplistItem: {
        ...prevState.SplistItem,
        receivedGifts: [
          ...prevState.SplistItem.receivedGifts,
          {
            dateGiven: null,
            name: '',
            businessEntity: '',
            description: '',
            value: '',
            reason: '',
          }
        ]
      }
    }));
  };

  removeGiftRow = (index: number) => {
    const updatedGifts = [...this.state.SplistItem.receivedGifts];
    updatedGifts.splice(index, 1);
    this.setState(prevState => ({
      SplistItem: {
        ...prevState.SplistItem,
        receivedGifts: updatedGifts
      }
    }));
  };

  handleGiftChange = (index: number, field: keyof IGiftItemGiven, value: any) => {
    const updatedGifts = [...this.state.SplistItem.receivedGifts];
    updatedGifts[index][field] = value;

    this.setState(prevState => ({
      SplistItem: {
        ...prevState.SplistItem,
        receivedGifts: updatedGifts
      }
    }));
  };
  // Handle checkbox changes
  handleCheckboxChange = (field: string, isChecked: boolean) => {
    this.setState((prevState) => ({
      SplistItem: {
        ...prevState.SplistItem,
        [field]: isChecked,
      },
      validation: {
        ...prevState.validation,
        [`validation${field}`]: isChecked ? '' : prevState.validation[`validation${field}`], // Clear validation only if checked
      },
    }));
  };
  private onUserChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    if (option) {
      this.setState({ selectedUsers: option.key as string });
    }
  };
  public render(): React.ReactElement<IGiftsAndBenifitsGivenProps> {
    const { hasAccess, hasAccesscompliancegroup } = this.state;

    // if (!hasAccess) {
    //   return (
    //     <div className="gift-form-container">
    //       <h2 className='gift-form-h2'>Access Denied</h2>
    //       <p>You do not have permission to access this form.</p>
    //     </div>
    //   );
    // }
    return (
      <div className="gift-form-container">
        {this.state.Isloader ?
          <div className='overlay'>
            <div className='loader'>
              <img src={require('../../../CommonAssets/BravusModernLoader.svg')} alt="Loading..." />
            </div>
          </div>
          : undefined}
        <h2 className='gift-form-h2'>Gifts and benefits Given Self-Declaration Form</h2>
        <TextField label="Full Name" value={this.state.SplistItem.fullname} onChange={(_, value) => this.handleChange('fullname', value)} className="form-field" errorMessage={this.state.validation.validationfullname} disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"} required={true} />
        <TextField label="Designation" value={this.state.SplistItem.designation} onChange={(_, value) => this.handleChange('designation', value)} className="form-field" errorMessage={this.state.validation.validationdesignation} disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"} required={true} />
        <TextField label="Department" value={this.state.SplistItem.department} onChange={(_, value) => this.handleChange('department', value)} className="form-field" errorMessage={this.state.validation.validationdepartment} disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"} required={true} />
        <TextField label="Company" value={this.state.SplistItem.company} onChange={(_, value) => this.handleChange('company', value)} className="form-field" errorMessage={this.state.validation.validationcompany} disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"} required={true} />
        <div className='datePickerWrapper'>

          <DatePicker label="Date" onSelectDate={(date) => this.handleDateChange('date', date)} value={this.state.SplistItem.date} className="form-field" disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"} isRequired={true} >
          </DatePicker>
          {this.state.validation.validationdate && (
            <div className="error-message">{this.state.validation.validationdate}</div>
          )}
        </div>

        <div className="section-header">Section 2: Declaration of the receipt of Gifts & Given</div>
        <p className="declaration-text">I, [Your Name], hereby declare that:</p>
        <div className='checkboxWrapper'>
          <Checkbox
            label="I have not given any gifts or benefits to declare."
            checked={this.state.SplistItem.notReceivedGifts}
            onChange={(_, checked) => this.handleCheckboxChange('notReceivedGifts', checked)}
            className="form-field"
            disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"}
          />
          <span style={{ color: 'red' }}> * </span>
          {this.state.validation.validationnotReceivedGifts && (
            <div className="error-message">{this.state.validation.validationnotReceivedGifts}</div>
          )}
        </div>

        <div className='checkboxWrapper'>
          <Checkbox label="I have given the following gifts and benefits during my duties and responsibilities at [Company Name]. (Abbot Point Operations, Bowen Rail, Bravus, Bravus Mining, NQXT, Rugby Run)" checked={this.state.SplistItem.receivedGiftsCheckbox} onChange={(_, checked) => this.handleCheckboxChange('receivedGiftsCheckbox', checked)} className="form-field" disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"} />
          <span style={{ color: 'red' }}> * </span>
          {this.state.validation.validationreceivedGiftsCheckbox && (
            <div className="error-message">{this.state.validation.validationreceivedGiftsCheckbox}</div>
          )}
        </div>
        {/* <h3>Received Gifts or Benefits</h3> */}
        <div className='gift-table-wrapper'>
          <table className="gift-table">
            <thead>
              <tr>
                <th>Date Given</th>
                <th>Name of Person</th>
                <th>Person's business entity</th>
                <th>Description of gift or benefit</th>
                <th>Value ($)</th>
                <th>Reason(s) for giving (what is the business benefit?)</th>
              </tr>
            </thead>
            <tbody>
              {this.state.SplistItem.receivedGifts.map((gift, index) => (
                <tr key={index}>
                  <td>
                    <DatePicker
                      onSelectDate={(date) => this.handleGiftChange(index, 'dateGiven', date)}
                      value={gift.dateGiven}
                      disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"}
                    />
                  </td>
                  <td>
                    <TextField
                      value={gift.name}
                      onChange={(_, value) => this.handleGiftChange(index, 'name', value)}
                      disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"}
                    />
                  </td>
                  <td>
                    <TextField
                      value={gift.businessEntity}
                      onChange={(_, value) => this.handleGiftChange(index, 'businessEntity', value)}
                      disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"}
                    />
                  </td>
                  <td>
                    <TextField
                      value={gift.description}
                      onChange={(_, value) => this.handleGiftChange(index, 'description', value)}
                      disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"}
                    />
                  </td>
                  <td>
                    <TextField
                      value={gift.value}
                      onChange={(_, value) => this.handleGiftChange(index, 'value', value)}
                      disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"}
                    />
                  </td>
                  <td>
                    <TextField
                      value={gift.reason}
                      onChange={(_, value) => this.handleGiftChange(index, 'reason', value)}
                      disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"}
                    />
                  </td>
                  <td>
                    <DefaultButton className="add-btn" onClick={this.addGiftRow} disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"}>+</DefaultButton>

                  </td>
                  <td>
                    {this.state.SplistItem.receivedGifts.length > 1 && (
                      <DefaultButton className="remove-btn" onClick={() => this.removeGiftRow(index)} disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"}>-</DefaultButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section-header">Section 3: Declaration & Signature</div>
        <p className="declaration-text">
          I confirm that the information provided above is true and complete to the best of my knowledge. I understand that failure to disclose the giving of gifts or benefits may result in disciplinary action. I agree to notify [Company Name] of any changes in my circumstances related to the giving of gifts or benefits.
        </p>

        <TextField label="Signature" value={this.state.SplistItem.signature} onChange={(_, value) => this.handleChange('signature', value)} className="form-field" errorMessage={this.state.validation.validationsignature} disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"} required={true} />
        <div className='datePickerWrapper'>
          <DatePicker label="Signature Date" onSelectDate={(date) => this.handleDateChange('signatureDate', date)} value={this.state.SplistItem.signatureDate} className="form-field" disabled={this.state.status === "Submit" || this.state.status === "Approved" || this.state.status === "Pending with Compliance Group"} isRequired={true} />
          {this.state.validation.validationsignatureDate && (
            <div className="error-message">{this.state.validation.validationsignatureDate}</div>
          )}
        </div>
        {/* Add the Dialog component */}
        <Dialog
          hidden={!this.state.showValidationDialog}
          onDismiss={() => this.setState({ showValidationDialog: false })}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Validation Error',
            subText: 'Please fill out all required fields before submitting the form.',
          }}
        >
          <DialogFooter>
            <PrimaryButton
              text="OK"
              onClick={() => this.setState({ showValidationDialog: false })}
            />
          </DialogFooter>
        </Dialog>
        {/* Success Dialog */}
        <Dialog
          hidden={!this.state.showSuccessDialog}
          onDismiss={() => this.setState({ showSuccessDialog: false })}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Success',
            subText: 'Form submitted successfully!',
          }}
        >
          <DialogFooter>
            <PrimaryButton
              text="OK"
              onClick={() => {
                this.setState({ showSuccessDialog: false });
                window.location.href = this.props.context.pageContext.web.absoluteUrl;
              }}
            />
          </DialogFooter>
        </Dialog>
        {/* Draft Dialog */}
        <Dialog
          hidden={!this.state.showDraftDialog}
          onDismiss={() => this.setState({ showDraftDialog: false })}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Success',
            subText: 'Form Draft successfully!',
          }}
        >
          <DialogFooter>
            <PrimaryButton
              text="OK"
              onClick={() => {
                this.setState({ showDraftDialog: false });
                window.location.href = this.props.context.pageContext.web.absoluteUrl;
              }}
            />
          </DialogFooter>
        </Dialog>
        {hasAccesscompliancegroup && this.state.status === 'Pending with Compliance Group' && (
          <div>
            <Label className='customLabel'>Final Approver:<span style={{ color: 'red' }}> * </span></Label>
            <Dropdown
              id="Final Approver"
              placeholder='Select Final Approver'
              tabIndex={22}
              selectedKey={this.state.selectedUsers}
              onChange={(event: any, option: any) => this.onUserChange(event, option)}
              options={this.state.users}

            />
          </div>
        )}
        <div className="button-group">
          {this.state.status === '' ? (
            <>
              <PrimaryButton text="Submit" onClick={this.handleSubmit} className="submit-button" />
              <DefaultButton text="Save as Draft" onClick={this.handleSaveAsDraft} className="draft-button" />
              <DefaultButton text="Cancel" onClick={this.handleCancel} className="cancel-button" />
            </>
          ) : this.state.status === "SaveAsDraft" ? (
            <>
              <PrimaryButton text="Submit" onClick={this.handleSubmit} className="submit-button" />
              <DefaultButton text="Save as Draft" onClick={this.handleSaveAsDraft} className="draft-button" />
              <DefaultButton text="Cancel" onClick={this.handleCancel} className="cancel-button" />
            </>
          ) : this.state.status === "Submit" ? (
            <>
              <DefaultButton text="Cancel" onClick={this.handleCancel} className="cancel-button" />
            </>
          ) : this.state.status === "Approved" ? (
            <>
              <DefaultButton text="Cancel" onClick={this.handleCancel} className="cancel-button" />
            </>

          )
            : this.state.status === "Pending with Compliance Group" ? (
              <>
                <DefaultButton text="Cancel" onClick={this.handleCancel} className="cancel-button" />
                {/* <PrimaryButton text="Update" onClick={this.handleSubmit} className="submit-button" />
                        <DefaultButton text="Cancel" onClick={this.handleCancel} className="cancel-button" /> */}
              </>

            )
              : null} {/* No buttons for other status values */}
        </div>
        {hasAccesscompliancegroup && this.state.status === 'Pending For Final Approval' && (
          <DefaultButton
            text="Submit Final Approver"
            onClick={this.handleSubmit}
            styles={{ root: { backgroundColor: '#d9534f', color: 'white' } }}
          />
        )}
        {hasAccesscompliancegroup && this.state.status === 'Pending with Compliance Group' && (
          <DefaultButton
            text="Select Manager or CEO"
            onClick={this.handleSubmit}
            styles={{ root: { backgroundColor: '#d9534f', color: 'white' } }}
          />
        )}
        {hasAccesscompliancegroup && this.state.status === 'Pending with Compliance Group' && (
          <DefaultButton
            text="Return To Requestor"
            onClick={this.onResubmitClick}
            styles={{ root: { backgroundColor: '#d9534f', color: 'white' } }}
          />
        )}
      </div>
    );
  }
}
