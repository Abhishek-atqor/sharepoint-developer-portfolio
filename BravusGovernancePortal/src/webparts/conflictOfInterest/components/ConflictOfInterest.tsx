import * as React from 'react';
import styles from './ConflictOfInterest.module.scss';
import type { IConflictOfInterestProps } from './IConflictOfInterestProps';
import { escape } from '@microsoft/sp-lodash-subset';
import { IConflictOfIntrest } from "../../../frameworks/model/ISplistItem";
import { IConflictOfIntrestState } from './Conflictofintreststate';
import { DateConvention, DateTimePicker } from '@pnp/spfx-controls-react';
import { PeoplePicker, PrincipalType, IPeoplePickerContext } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { SPFI } from '@pnp/sp';
import { ListOperationService } from '../../../frameworks/services/ListOperation/ListOperationService';
import { IValidationService, ValidationService } from '../../../frameworks/services/ValidationServices/ValidationService';
import { Checkbox, DatePicker, Label, TextField, PrimaryButton, DefaultButton, MessageBar, MessageBarType, Dialog, DialogType, DialogFooter } from '@fluentui/react';
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { getSP } from '../../../pnpjsConfig';
import { Constant } from '../../../frameworks/constants/Constant';
import * as moment from 'moment';
import { ConflictofintrestValidation, IConflictofintrestValidation } from '../../../frameworks/model/IConflictofintrestValidation';
import "../assets/Custome.css";
import "@pnp/sp/webs";
import "@pnp/sp/site-groups";
import * as printJS from 'print-js';
import jsPDF from 'jspdf';


export default class ConflictOfInterest extends React.Component<IConflictOfInterestProps, IConflictOfIntrestState> {

  private _sp: SPFI = null;
  private _validationService: IValidationService = null;
  private _listoperation: ListOperationService;
  private currentUserID: number = null;
  public GovId: any = null;
  private sharepointGroupName: string = "Manager-CEO";
  public verticaldropdownoptions: { key: string; text: string; }[];

  public constructor(props: IConflictOfInterestProps) {
    super(props);

    let validationConstant = new ConflictofintrestValidation();

    this.state = {
      conflictRows: [{
        index: 0,
        details: '', nature: '', type: '', parties: '', sinceWhen: null, stepsTaken: '',
      }],
      IConflictOfIntrest: {
        ID: '',
        FullName: '',
        Designation: '',
        Department: '',
        Company: '',
        Date: null,
        Signature: '',
        Signaturedate: null,
        NoConflictofIntrest: false,
        ConflictOfIntrest: false,
        ItemStatus: '',
        FinalApprover: ''

      },
      allBoolean: {
        isEditMode: false,
        isDisplayMode: false,
        isDraftMode: false,
        isViewMode: false

      },
      Isloader: false,
      validation: { ...validationConstant },
      showValidationDialog: false,
      showErrorForDate: false,
      itemID: null,
      isAllFielddiasble: false,
      IsRequestors: false,
      IsCompliancegroupMamber: false,
      users: [],
      selectedUsers: "",
      allDialogBoxMeg: {
        showDialog: false,
        dialogType: null,
        dialogMessage: ''
      },
      showSuccessDialog: false,
      showDraftDialog: false

    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDateChange1 = this.handleDateChange1.bind(this)
    this.onResubmitClick = this.onResubmitClick.bind(this);
    this._listoperation = new ListOperationService();
    this._validationService = new ValidationService();
  }
  public async componentDidMount() {
    try {
      this.setState({ Isloader: true });

      this._sp = getSP(this.props.context);
      await this._listoperation.Init(this.props.context);

      const currentUser = await this._sp.web.currentUser.select('Id', 'Email')();
      this.currentUserID = currentUser.Id;

      await this.fetchUsersFromGroup(); // Ensure users are fetched before proceeding

      const usergrouparray = await this._listoperation.checkUserGroup(this.props.context);

      let tempBoolean = { ...this.state.allBoolean };
      let isRequestor = false;
      let isComplianceMember = false;

      for (const group of usergrouparray) {
        if (group.LoginName === "Requestors") {
          isRequestor = true;
        }
        if (group.LoginName === "Compliance Group") {
          isComplianceMember = true;
        }
      }

      let formMode = this.getParameterByName("formMode", window.location.href);
      this.GovId = this.getParameterByName("itemID", window.location.href);

      if (!this.IsStrNullOrEmpty(this.GovId)) {
        if (formMode?.toLowerCase() === "edit") {
          tempBoolean.isEditMode = true;
        } else if (formMode?.toLowerCase() === "draft") {
          tempBoolean.isDraftMode = true;
        } else if (formMode?.toLowerCase() === "view") {
          tempBoolean.isViewMode = true;
        }

        // Ensure data binding completes before setting loader to false
        await this.BindAllListdata(Number(this.GovId));
      }

      // Ensure `setState` is executed only when component is still mounted
      this.setState({
        allBoolean: tempBoolean,
        itemID: Number(this.GovId),
        Isloader: false,
        IsRequestors: isRequestor,
        IsCompliancegroupMamber: isComplianceMember,
      });

      console.log('formMode:', formMode);
      console.log('GovId:', this.GovId);
      console.log('Draft Mode:', tempBoolean.isDraftMode);
      console.log('IsRequestors:', isRequestor);
      console.log("is complaince", isComplianceMember)
      console.log("is requestor", isRequestor)

    } catch (error) {
      console.error("Error in componentDidMount:", error);
    }
  }



  private formatDatePicker = (date: any): string => {
    return moment(date).format('DD/MM/YYYY');
  };

  public IsStrNullOrEmpty(str: any) {
    return str === null || str === undefined || str === '';
  }

  public getParameterByName(name: string, url: any) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  //handle submit method to add item
  private handleSubmit = async () => {
    try {
      this.setState({ Isloader: true });
      const { allBoolean } = this.state;
      const isValidate = this.isFormvalid();

      if (!isValidate) {
        this.setState({ showValidationDialog: true }); // Show validation dialog if the form is not valid
        return;
      }

      // Convert conflict table data to JSON
      const conflictJsonData = JSON.stringify(this.state.conflictRows);

      // Prepare the data object
      const itemData = {
        'Title': this.state.IConflictOfIntrest.FullName,
        'FullName': this.state.IConflictOfIntrest.FullName,
        'Designation': this.state.IConflictOfIntrest.Designation,
        'Department': this.state.IConflictOfIntrest.Department,
        'Company': this.state.IConflictOfIntrest.Company,
        'Date': this.state.IConflictOfIntrest.Date,
        'Signature': this.state.IConflictOfIntrest.Signature,
        'SignatureDate': this.state.IConflictOfIntrest.Signaturedate,
        'NoConflictInterestDeclaration': this.state.IConflictOfIntrest.NoConflictofIntrest,
        'COIDeclaration': this.state.IConflictOfIntrest.ConflictOfIntrest,
        'ItretionDetails': conflictJsonData,
        'Status': "Submit"
      };

      let itemId: number | null = null;
      let isNewItem = false; // Flag to check if it's a new item

      if (allBoolean.isDraftMode && this.GovId) {
        isNewItem = true;
        // Updating an existing item in Draft Mode
        await this._listoperation.updateItemInList(this.props.context, Constant.COIListname, this.GovId, itemData);
        itemId = this.GovId;
      } else if (allBoolean.isEditMode && this.GovId && this.state.IConflictOfIntrest.ItemStatus === "Pending with Compliance Group") {
        isNewItem = false;
        // Updating an existing item in Edit Mode
        const itemsforUpdate = {
          "FinalApproverId": Number(this.state.selectedUsers),
          "Status": 'Pending For Final Approval',
        };
        await this._listoperation.updateItemInList(this.props.context, Constant.COIListname, this.GovId, itemsforUpdate);
        itemId = this.GovId;
      } else {
        // Adding a new item to the SharePoint list
        isNewItem = true; // Mark as new item
        const response = await this._listoperation.addItemsToList(this.props.context, Constant.COIListname, itemData);
        itemId = response.Id; // Get the new item ID
      }

      // **Trigger Power Automate flow only if it's a new item**
      if (isNewItem && itemId) {
        await this.triggerPowerAutomateFlow(itemId, itemData);
      }

      // alert("Form Submitted successfully!");
      this.setState({ showSuccessDialog: true, Isloader: false });

      // Delay the page redirection to give time for the dialog to show
      setTimeout(() => {
        window.location.href = this.props.context.pageContext.web.absoluteUrl;
      }, 5000); // Adjust delay if needed

    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error submitting form. Please try again.");
      this.setState({ Isloader: false });
    }
  };

  // **Function to trigger Power Automate Flow**
  private async triggerPowerAutomateFlow(itemId: number, itemData: any) {
    try {
      const flowUrl = "https://prod-29.australiasoutheast.logic.azure.com:443/workflows/6a8db18a0e7041f6bd464b45a2db0563/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=3reueJP1ffplCt1K1gvZRXkvo0GAV-WnMJ0Ee2oap_k";

      const requestBody = {
        itemId: itemId,
        ListName: Constant.COIListname,  // Passing the item ID to Power Automate
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

  private handleCancel = (): void => {
    // Clear form or navigate away
    this.setState({
      IConflictOfIntrest: {
        FullName: '',
        Designation: '',
        Department: '',
        Company: '',
        Date: null,
        Signature: '',
        ID: undefined,
        Signaturedate: null,
        NoConflictofIntrest: false,
        ConflictOfIntrest: false,
        ItemStatus: '',
        FinalApprover: ''
      },
      conflictRows: []
    });
    window.location.href = this.props.context.pageContext.web.absoluteUrl
  };

  public isFormvalid() {  // check validations
    let valid: boolean = true;
    let tempFormControl = { ...this.state.IConflictOfIntrest };
    let tempValidation: boolean = true;
    let newValidationState = { ...this.state.validation };


    [tempValidation, newValidationState.validationFullName] = this._validationService.isTextFieldEmpty(tempFormControl.FullName, newValidationState.validationFullName);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationDesignation] = this._validationService.isTextFieldEmpty(tempFormControl.Designation, newValidationState.validationDesignation);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationDepartment] = this._validationService.isTextFieldEmpty(tempFormControl.Department, newValidationState.validationDepartment);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationCompany] = this._validationService.isTextFieldEmpty(tempFormControl.Company, newValidationState.validationCompany);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationDate] = this._validationService.isDateFieldEmpty(tempFormControl.Date, newValidationState.validationDate);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationSignature] = this._validationService.isTextFieldEmpty(tempFormControl.Signature, newValidationState.validationSignature);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationSignaturedate] = this._validationService.isDateFieldEmpty(tempFormControl.Signaturedate, newValidationState.validationSignaturedate);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationNoConflictofIntrest] = this._validationService.isCheckboxChecked(tempFormControl.NoConflictofIntrest, newValidationState.validationNoConflictofIntrest);
    valid = valid && !tempValidation;
    [tempValidation, newValidationState.validationConflictOfIntrest] = this._validationService.isCheckboxChecked(tempFormControl.ConflictOfIntrest, newValidationState.validationConflictOfIntrest);
    valid = valid && !tempValidation;


    if (valid) {
      valid = true;
    }
    else {
      valid = false;
    }
    this.setState({ validation: newValidationState, Isloader: false });
    return valid;

  }
  //Save As Draft
  private handleSaveAsDraft = async () => {
    try {
      this.setState({ Isloader: true });

      // Convert conflict table data to JSON
      const conflictJsonData = JSON.stringify(this.state.conflictRows);

      // Prepare the data object
      const itemData = {
        'Title': this.state.IConflictOfIntrest.FullName, // Set Title as Full Name
        'FullName': this.state.IConflictOfIntrest.FullName,
        'Designation': this.state.IConflictOfIntrest.Designation,
        'Department': this.state.IConflictOfIntrest.Department,
        'Company': this.state.IConflictOfIntrest.Company,
        'Date': this.state.IConflictOfIntrest.Date,
        'Signature': this.state.IConflictOfIntrest.Signature,
        'SignatureDate': this.state.IConflictOfIntrest.Signaturedate,
        'NoConflictInterestDeclaration': this.state.IConflictOfIntrest.NoConflictofIntrest,
        'COIDeclaration': this.state.IConflictOfIntrest.ConflictOfIntrest,
        'ItretionDetails': conflictJsonData, // Store JSON in a Multi-line Text Column
        "Status": "SaveAsDraft"
      };

      // Save data using PnPjs
      await this._listoperation.addItemsToList(this.props.context, Constant.COIListname, itemData);

      // Show success dialog
      this.setState({ showDraftDialog: true, Isloader: false });

      // Delay the page redirection to give time for the dialog to show
      setTimeout(() => {
        window.location.href = this.props.context.pageContext.web.absoluteUrl;
      }, 5000); // Adjust delay if needed

    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error submitting form. Please try again.");
      this.setState({ Isloader: false });
    }
  };


  //Bind All List Data
  private async BindAllListdata(itemID: number) {
    try {
      // this.setState({ Isloader: true });
      // Fetch the item from the SharePoint list using the itemID
      const item: any = await this._listoperation.getItemById(this.props.context, "ConflictOfInterest", itemID, ["*", "FinalApprover/Title", "FinalApprover/Id"], ["FinalApprover"]);

      console.log(item);
      const ConflictData = item.ItretionDetails || "";

      let tempvertical: IDropdownOption[] = []

      // if (item.FinalApprover) {
      //   tempvertical.push({
      //     key: item.FinalApprover.Id.toString() || '', // Convert Id to string
      //     text: item.FinalApprover.Title || '' // Display name
      //   });
      // }

      // Extract JSON content if wrapped in an HTML tag
      const jsonMatch = ConflictData.match(/>(.*?)<\/div>/);
      const encodedJson = jsonMatch ? jsonMatch[1] : ConflictData;

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

      const parsedGifts = receivedGifts.map((gift: any) => ({
        ...gift,
        dateGiven: parseDateString(gift.dateGiven), // Convert dateGiven to Date object
      }));

      // Update the state with the fetched data
      this.setState({
        IConflictOfIntrest: {
          FullName: item.FullName || '',
          Designation: item.Designation || '',
          Department: item.Department || '',
          Company: item.Company || '',
          Date: item.Date ? new Date(item.Date) : null,
          NoConflictofIntrest: item.NoConflictInterestDeclaration || false,
          ConflictOfIntrest: item.COIDeclaration || false,
          Signature: item.Signature || '',
          Signaturedate: item.SignatureDate ? new Date(item.SignatureDate) : null,
          ID: item.ID || '',
          ItemStatus: item.Status || '',
          FinalApprover: item.FinalApproverId || '',
        },
        // selectedUsers: item.FinalApprover?.Id.toString(),
        // users: tempvertical,
        conflictRows: parsedGifts,
        isAllFielddiasble: item.Status === "Submit" || item.Status === "Pending with Compliance Group" || item.Status === "Approved",
      });


      console.log("Item Status:", item.Status);
      console.log("isAllFielddiasble:", this.state.isAllFielddiasble);

    } catch (error) {
      console.error("Error fetching data from SharePoint list:", error);
      alert("An error occurred while fetching the data. Please try again.");
    }
    finally {
      // this.setState({ Isloader: false })
    }
  }


  //Convert DDMMYY
  private convertDDMMYYYYToDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr.length !== 10) return null; // Ensure "DD/MM/YYYY" format

    return moment(dateStr, "DD/MM/YYYY").toDate(); // Convert to Date object
  };

  //Add Rows
  private addRow = () => {
    this.setState(prevState => ({
      conflictRows: [
        ...prevState.conflictRows,
        {
          index: prevState.conflictRows.length, // Assigning a unique index
          details: '',
          nature: '',
          type: '',
          parties: '',
          sinceWhen: null,
          stepsTaken: ''
        }
      ]
    }));
  };

  private removeRow = (index: number) => {
    this.setState((prevState: any) => {
      // Prevent removal if there's only one row
      if (prevState.conflictRows.length <= 1) {

        return prevState; // No change to the state
      }

      // Proceed with removing the row at the provided index
      return {
        conflictRows: prevState.conflictRows.filter(
          (_: any, i: number) => i !== index // Remove the row at the provided index
        )
      };
    });
  };

  private handleTextFieldChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string): void => {
    const { rowId, field } = event.currentTarget.dataset;
    const fieldName = event.currentTarget.id;

    if (!field) return; // Ensure field exists

    this.setState(prevState => ({
      IConflictOfIntrest: {
        ...prevState.IConflictOfIntrest,
        [fieldName]: newValue || ''
      },
      validation: {
        ...prevState.validation,
        [(`validation${field}` as keyof IConflictofintrestValidation)]: "" // Reset validation message
      }
    }));

    if (rowId) {
      this.setState(prevState => ({
        conflictRows: prevState.conflictRows.map(row =>
          row.index === Number(rowId) ? { ...row, [field]: newValue } : row
        )
      }));
    }

    console.log("Updated Validation State:", this.state.validation); // Debugging
  };

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

  private onUserChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    if (option) {
      this.setState({ selectedUsers: option.key as string });
    }
  };



  public async onResubmitClick() {
    try {
      this.setState({ Isloader: true });
      const { allBoolean } = this.state;
      const isValidate = this.isFormvalid();

      if (!isValidate) {
        this.setState({ showValidationDialog: true }); // Show the dialog if the form is not valid
        return;
      }

      // Convert conflict table data to JSON
      const conflictJsonData = JSON.stringify(this.state.conflictRows);

      // Prepare the data object
      const itemData = {
        'Title': this.state.IConflictOfIntrest.FullName, // Set Title as Full Name
        'FullName': this.state.IConflictOfIntrest.FullName,
        'Designation': this.state.IConflictOfIntrest.Designation,
        'Department': this.state.IConflictOfIntrest.Department,
        'Company': this.state.IConflictOfIntrest.Company,
        'Date': this.state.IConflictOfIntrest.Date,
        'Signature': this.state.IConflictOfIntrest.Signature,
        'SignatureDate': this.state.IConflictOfIntrest.Signaturedate,
        'NoConflictInterestDeclaration': this.state.IConflictOfIntrest.NoConflictofIntrest,
        'COIDeclaration': this.state.IConflictOfIntrest.ConflictOfIntrest,
        'ItretionDetails': conflictJsonData, // Store JSON in a Multi-line Text Column
        'Status': "Resubmit"
      };

      await this._listoperation.updateItemInList(this.props.context, Constant.COIListname, this.GovId, itemData);
      this.setState({ Isloader: false });


      alert("Form Resubmitted successfully!");
      this.setState({ Isloader: false });
      window.location.href = this.props.context.pageContext.web.absoluteUrl

    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error submitting form. Please try again.");
      this.setState({ Isloader: false });
    }
  };

  private handleTextFieldChange1 = (e: React.FormEvent<HTMLInputElement>, newValue: string): void => {
    const rowId = parseInt(e.currentTarget.getAttribute('data-row-id')!);
    const field = e.currentTarget.getAttribute('data-field')!;

    // Ensure you only update the specific field in the correct row
    this.setState(prevState => ({
      conflictRows: prevState.conflictRows.map(row =>
        row.index === rowId ? { ...row, [field]: newValue } : row
      ),
    }));
  };

  private handleDateChange = (date: Date, field: string) => {
    this.setState(prevState => ({
      IConflictOfIntrest: {
        ...prevState.IConflictOfIntrest,
        [field]: date ?  date : null
      },
      validation: {
        ...prevState.validation,
        [`validation${field}` as keyof IConflictofintrestValidation]: ""
      }
    }));


  }

  private handleDateChange1 = (date: Date | null, rowId: number) => {
    if (!date) return; // Prevent null values

    const formattedDate = moment(date).format('DD/MM/YYYY'); // Store in "DD/MM/YYYY"

    this.setState(prevState => ({
      conflictRows: prevState.conflictRows.map((row, index) =>
        index === rowId ? { ...row, sinceWhen: formattedDate } : row
      ),

    }));
  };

  private handleDismissForQueryForApprovedDate = () => {
    this.setState({
      showErrorForDate: false
    });

  };

  private handleCheckboxChange = (field: string, value: any) => {
    this.setState((prevState) => ({
      IConflictOfIntrest: {
        ...prevState.IConflictOfIntrest,
        [field]: value,
      },
      validation: {
        ...prevState.validation,
        [(`validation${field}` as keyof IConflictofintrestValidation)]: ""
      }
    }));
  };

  //print function 

  private formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString || isNaN(Date.parse(dateString))) {
      return ""; // Return empty string if date is invalid
    }
    return new Date(dateString).toISOString().split("T")[0]; // Converts to YYYY-MM-DD
  };

  private handlePrint = async () => {
    const { IConflictOfIntrest, conflictRows } = this.state;

    const formattedDate = this.formatDateForInput(IConflictOfIntrest.Date);
    const formattedSignatureDate = this.formatDateForInput(IConflictOfIntrest.Signaturedate);

    const CustomHTML = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Conflict of Interest Form</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 10mm;
              font-size: 12px;
            }
          }
          table, th, td {
            border: 1px solid #b3b3b3;
            border-collapse: collapse;
            padding: 10px;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <h2 style="text-align: center; font-weight: bold;">Conflict of Interest Self-Declaration Form</h2>
  
        <h3 style="border-bottom: 2px solid #0064af; padding-bottom: 5px; font-size: 18px;">Section 1: Personal Details</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
          <div style="width: 32%;">
            <label style="color: #0064af; font-weight: bold;">Full Name <span style="color: red;">*</span></label>
            <input type="text" value="${IConflictOfIntrest.FullName || ''}" style="width: 100%; height: 35px; border: 1px solid #b3b3b3; padding: 5px;" readonly />
          </div>
          <div style="width: 32%;">
            <label style="color: #0064af; font-weight: bold;">Designation <span style="color: red;">*</span></label>
            <input type="text" value="${IConflictOfIntrest.Designation || ''}" style="width: 100%; height: 35px; border: 1px solid #b3b3b3; padding: 5px;" readonly />
          </div>
          <div style="width: 32%;">
            <label style="color: #0064af; font-weight: bold;">Department <span style="color: red;">*</span></label>
            <input type="text" value="${IConflictOfIntrest.Department || ''}" style="width: 100%; height: 35px; border: 1px solid #b3b3b3; padding: 5px;" readonly />
          </div>
          <div style="width: 32%;">
            <label style="color: #0064af; font-weight: bold;">Company/Organization <span style="color: red;">*</span></label>
            <input type="text" value="${IConflictOfIntrest.Company || ''}" style="width: 100%; height: 35px; border: 1px solid #b3b3b3; padding: 5px;" readonly />
          </div>
          <div style="width: 32%;">
            <label style="color: #0064af; font-weight: bold;">Date <span style="color: red;">*</span></label>
            <input type="date" value="${formattedDate}" style="width: 100%; height: 35px; border: 1px solid #b3b3b3; padding: 5px;" readonly />
          </div>
        </div>
  
        <h3 style="border-bottom: 2px solid #0064af; padding-bottom: 5px; font-size: 18px;">Section 2: Declaration of Conflict of Interest</h3>
        <p>
          <input type="checkbox" ${IConflictOfIntrest.ConflictOfIntrest ? "checked" : ""} /> 
          I have the following actual, potential, or perceived conflicts of interest.
        </p>
        <p>
          <input type="checkbox" ${IConflictOfIntrest.NoConflictofIntrest ? "checked" : ""} /> 
          I declare that I have no conflict of interest.
        </p>
  
        <h3 style="border-bottom: 2px solid #0064af; padding-bottom: 5px; font-size: 18px;">Conflict Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Sr. No</th>
              <th>Details of the Conflict</th>
              <th>Nature of the Conflict</th>
              <th>Conflict Type</th>
              <th>Parties Involved</th>
              <th>Since When</th>
              <th>Steps Taken</th>
            </tr>
          </thead>
          <tbody>
            ${conflictRows.map((e: any, index: number) => `
            <tr>
              <td>${index + 1}</td>
              <td>${e.details || ""}</td>
              <td>${e.nature || ""}</td>
              <td>${e.type || ""}</td>
              <td>${e.parties || ""}</td>
              <td>${e.sinceWhen || ""}</td>
              <td>${e.stepsTaken || ""}</td>
            </tr>`).join("")}
          </tbody>
        </table>
  
        <h3 style="border-bottom: 2px solid #0064af; padding-bottom: 5px; font-size: 18px;">Section 3: Declaration & Signature</h3>
        <p>I confirm that the information provided above is true and complete to the best of my knowledge.</p>
        <div style="width: 100%;">
          <label style="color: #0064af; font-weight: bold;">Signature<span style="color: red;">*</span></label>
          <input type="text" value="${IConflictOfIntrest.Signature || ''}" style="width: 100%; height: 35px; border: 1px solid #b3b3b3; padding: 5px;" readonly />
        </div>
        <div style="width: 100%;">
          <label style="color: #0064af; font-weight: bold;">Signature Date<span style="color: red;">*</span></label>
          <input type="date" value="${formattedSignatureDate}" style="width: 100%; height: 35px; border: 1px solid #b3b3b3; padding: 5px;" readonly />
        </div>
      </body>
    </html>`;

    printJS({
      printable: CustomHTML,
      type: "raw-html",
    });
  };

  public render(): React.ReactElement<IConflictOfInterestProps> {
    return (
      <div>
        {this.state.Isloader ?
          <div className={styles.overlay}>
            <div className={styles.loader}>
              <img src={require('../../../CommonAssets/BravusModernLoader.svg')} alt="Loading..." />
            </div>
          </div>
          : undefined}
        <div>
          <h2>Conflict of Interest Self-Declaration Form</h2>
          <h3>Section 1: Personal Details</h3>
          <div>
            <div className={styles.formDetailWrapper}>
              <div className={styles.formDetail}>
                <Label>Full Name <span style={{ color: 'red' }}> * </span></Label>
                <TextField
                  id="FullName"
                  data-field="FullName"
                  onChange={(e, v) => { this.handleTextFieldChange(e, v) }}
                  value={this.state.IConflictOfIntrest.FullName} // Correct field
                  errorMessage={this.state.validation.validationFullName}
                  disabled={this.state.isAllFielddiasble}
                />
              </div>
              <div className={styles.formDetail}>
                <Label>Designation: <span style={{ color: 'red' }}> * </span></Label>
                <TextField
                  id="Designation"
                  data-field="Designation"
                  onChange={(e, v) => { this.handleTextFieldChange(e, v) }}
                  errorMessage={this.state.validation.validationDesignation}
                  value={this.state.IConflictOfIntrest.Designation}
                  disabled={this.state.isAllFielddiasble}
                />
              </div>
              <div className={styles.formDetail}>
                <Label>Department: <span style={{ color: 'red' }}> * </span></Label>
                <TextField
                  id="Department"
                  data-field="Department"
                  onChange={(e, v) => { this.handleTextFieldChange(e, v) }}
                  value={this.state.IConflictOfIntrest.Department}
                  errorMessage={this.state.validation.validationDepartment}
                  disabled={this.state.isAllFielddiasble}

                />
              </div>
              <div className={styles.formDetail}>
                <Label>Company/Organization:  <span style={{ color: 'red' }}> * </span></Label>
                <TextField
                  id="Company"
                  data-field="Company"
                  onChange={(e, v) => { this.handleTextFieldChange(e, v) }}
                  value={this.state.IConflictOfIntrest.Company}
                  errorMessage={this.state.validation.validationCompany}
                  disabled={this.state.isAllFielddiasble}

                />
              </div>
              <div className={styles.formDetail}>
                <Label>Date <span style={{ color: 'red' }}> * </span></Label>
                <DateTimePicker
                  dateConvention={DateConvention.Date}
                  timeConvention={null}
                  showLabels={false}
                  value={this.state.IConflictOfIntrest.Date}
                  data-field="Date"
                  onChange={(date) => this.handleDateChange(date, 'Date')}
                  formatDate={(date) => this.formatDatePicker(date)}
                  allowTextInput={false}
                  disabled={this.state.isAllFielddiasble}
                />
                {this.state.validation.validationDate && (
                  <MessageBar messageBarType={MessageBarType.error} onDismiss={() => this.handleDismissForQueryForApprovedDate()}>
                    This field is required
                  </MessageBar>
                )}
              </div>
            </div>
          </div>
          <div className={styles.section2Wrapper}>
            <h3>Section 2: Declaration of Conflict of Interest</h3>
            <div>
              <Checkbox
                label="I have the following actual, potential, or perceived conflicts of interest related to my duties and responsibilities at [Company Name]. (Abbot Point Operations, Bowen Rail, Bravus, Bravus Mining, NQXT, Rugby Run)"
                checked={this.state.IConflictOfIntrest.NoConflictofIntrest}
                onChange={(_, checked) => this.handleCheckboxChange('NoConflictofIntrest', checked)} className="form-field"
                disabled={this.state.isAllFielddiasble} />
              {this.state.validation.validationNoConflictofIntrest && (
                <div className="error-message">{this.state.validation.validationNoConflictofIntrest}</div>
              )}
            </div>
            <div>
              <Checkbox
                label="I have the following actual, potential, or perceived conflicts of interest related to my duties and responsibilities at [Company Name]. (Abbot Point Operations, Bowen Rail, Bravus, Bravus Mining, NQXT, Rugby Run)"
                checked={this.state.IConflictOfIntrest.ConflictOfIntrest}
                onChange={(_, checked) => this.handleCheckboxChange('ConflictOfIntrest', checked)} className="form-field"
                disabled={this.state.isAllFielddiasble} />
              {this.state.validation.validationConflictOfIntrest && (
                <div className="error-message">{this.state.validation.validationConflictOfIntrest}</div>
              )}
            </div>

          </div>

          {/* Table for Conflict of Interest Entries */}
          <div className="IterationDetailsWrapper">
            <table className="IterationDetails">
              <thead>
                <tr>
                  <th>Sr. No</th>
                  <th>Details of the Conflict of Interest</th>
                  <th>Nature of the Conflict</th>
                  <th>Conflict Type</th>
                  <th>Parties Involved</th>
                  <th>Since When</th>
                  <th>Steps Taken to Mitigate Conflict</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {this.state.conflictRows.map((row, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <TextField
                        value={row.details}
                        onChange={(e: any, newValue) => this.handleTextFieldChange1(e, newValue)}
                        data-row-id={index}
                        data-field="details"
                        disabled={this.state.isAllFielddiasble}
                      />
                    </td>
                    <td>
                      <TextField
                        value={row.nature}
                        onChange={(e: any, newValue) => this.handleTextFieldChange1(e, newValue)}
                        data-row-id={index}
                        data-field="nature"
                        disabled={this.state.isAllFielddiasble}
                      />
                    </td>
                    <td>
                      <TextField
                        value={row.type}
                        onChange={(e: any, newValue) => this.handleTextFieldChange1(e, newValue)}
                        data-row-id={index}
                        data-field="type"
                        disabled={this.state.isAllFielddiasble}
                      />
                    </td>
                    <td>
                      <TextField
                        value={row.parties}
                        onChange={(e: any, newValue) => this.handleTextFieldChange1(e, newValue)}
                        data-row-id={index}
                        data-field="parties"
                        disabled={this.state.isAllFielddiasble}
                      />
                    </td>
                    <td>
                      <DateTimePicker
                        dateConvention={DateConvention.Date}
                        timeConvention={null}
                        showLabels={false}
                        value={row.sinceWhen ? this.convertDDMMYYYYToDate(row.sinceWhen) : null} // Convert stored date
                        onChange={(date) => this.handleDateChange1(date, index)}
                        formatDate={(date) => moment(date).format('DD/MM/YYYY')} // Display in correct format
                        allowTextInput={false}
                        disabled={this.state.isAllFielddiasble}
                      />
                    </td>
                    <td>
                      <TextField
                        value={row.stepsTaken}
                        onChange={(e: any, newValue) => this.handleTextFieldChange1(e, newValue)}
                        data-row-id={index}
                        data-field="stepsTaken"
                        disabled={this.state.isAllFielddiasble}
                      />
                    </td>
                    {!this.state.allBoolean.isViewMode && !this.state.allBoolean.isEditMode && (
                      <td>
                        <PrimaryButton text="Remove" onClick={() => this.removeRow(index)} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>


            {!this.state.allBoolean.isViewMode && !this.state.allBoolean.isEditMode && (
              <PrimaryButton text="Add Row" onClick={this.addRow} />
            )}

          </div>
          <div className={styles.section3Wrapper}>
            <h3>Section 3: Declaration & Signature</h3>
            <p>I confirm that the information provided above is true and complete to the best of my knowledge.</p>

            {/* Signature Section */}
            <div>
              <Label>Signature: <span style={{ color: 'red' }}> * </span></Label>
              <TextField
                id="Signature"
                data-field="Signature"
                onChange={(e, v) => { this.handleTextFieldChange(e, v) }}
                value={this.state.IConflictOfIntrest.Signature}
                errorMessage={this.state.validation.validationSignature}
                disabled={this.state.isAllFielddiasble}
              />
            </div>
            <div>
              <Label>Date: <span style={{ color: 'red' }}> * </span></Label>
              <DateTimePicker
                dateConvention={DateConvention.Date}
                timeConvention={null}
                showLabels={false}
                value={this.state.IConflictOfIntrest.Signaturedate}
                onChange={(date) => this.handleDateChange(date, 'Signaturedate')}
                formatDate={(date) => this.formatDatePicker(date)}
                allowTextInput={false}
                disabled={this.state.isAllFielddiasble}
              />
              {this.state.validation.validationSignaturedate && (
                <MessageBar messageBarType={MessageBarType.error} onDismiss={() => this.handleDismissForQueryForApprovedDate()}>
                  This field is required
                </MessageBar>
              )}
            </div>
          </div>
          {this.state.IsCompliancegroupMamber && this.state.IConflictOfIntrest.ItemStatus === 'Pending with Compliance Group' && (
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
          <div className={styles.btnWrapper} style={{ marginTop: '20px' }}>
            {(this.state.IConflictOfIntrest.ItemStatus === 'SaveAsDraft' ||
              this.state.IConflictOfIntrest.ItemStatus === '') && (
                <>
                  <DefaultButton
                    text="Cancel"
                    onClick={this.handleCancel}
                    styles={{ root: { backgroundColor: '#d9534f', color: 'white' } }}
                  />

                  <PrimaryButton
                    text="Save as Draft"
                    onClick={this.handleSaveAsDraft}
                    styles={{ root: { backgroundColor: '#d9534f', color: 'white' } }}
                  />

                  <PrimaryButton
                    text="Submit"
                    onClick={this.handleSubmit}
                    styles={{ root: { backgroundColor: '#d9534f', color: 'white' } }}
                  />
                </>
              )}

            {this.state.IConflictOfIntrest.ItemStatus === 'Submit' && (
              <DefaultButton
                text="Cancel"
                onClick={this.handleCancel}
                styles={{ root: { backgroundColor: '#d9534f', color: 'white' } }}
              />
            )}

            {this.state.IsCompliancegroupMamber && this.state.IConflictOfIntrest.ItemStatus === 'Pending with Compliance Group' && (
              <DefaultButton
                text="Select Manager or CEO"
                onClick={this.handleSubmit}
                styles={{ root: { backgroundColor: '#d9534f', color: 'white' } }}
              />
            )}
            {this.state.IsCompliancegroupMamber && this.state.IConflictOfIntrest.ItemStatus === 'Pending with Compliance Group' && (
              <DefaultButton
                text="Return To Requestor"
                onClick={this.onResubmitClick}
                styles={{ root: { backgroundColor: '#d9534f', color: 'white' } }}
              />
            )}

            {(this.state.IConflictOfIntrest.ItemStatus === 'Approved' ||
              this.state.IConflictOfIntrest.ItemStatus === 'Pending with Compliance Group') && (
                <DefaultButton
                  text="Print"
                  onClick={this.handlePrint}
                  styles={{ root: { backgroundColor: '#d9534f', color: 'white' } }}
                />
              )}



          </div>

          {/* Validation Dialog */}
          <Dialog
            hidden={!this.state.showValidationDialog}
            dialogContentProps={{
              type: this.state.allDialogBoxMeg.dialogMessage,
              title: `Required Field`,
              subText: "Please Fill Required Field",
            }}
          >
            <DialogFooter>
              <PrimaryButton text="Ok" onClick={() => this.setState({ showValidationDialog: false })} />
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

          {/* Draft dialog*/}
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
        </div>
      </div>
    );
  }
}
