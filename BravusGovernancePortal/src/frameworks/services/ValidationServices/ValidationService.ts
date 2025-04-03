 import * as strings from "BravusGovernancePortalWebPartStrings";
import { Constant } from "../../constants/Constant";
 let msg_RequiredField = Constant.TextboxrequiredMsg
 let RequiredmandatoryText = Constant.TextboxrequiredMsg
export interface IValidationService {
    isTextFieldEmpty(value: string, message: string): any[];
    isDateFieldEmpty(value: string, message: string): any[];
    isRichTextFieldEmpty(value: string, message: string): any[];
    isDatePickerEmpty(value: Date, message: string): any[];
    isNumberFieldEmpty(value: number, message: string): any[];
    isAttachmentEmpty(value: any[]): any[];
    isMultiSelectDropdownEmpty(value: any, message: string): any[];
    isSinglePeoplePickerEmpty(personID:any,message:string):any[];
    isDropdownEmpty(selectedText: string, message: string): any[];
    isDropdownEmptyForPaymentTerms(selectedText: string, message: string): any[];
    isCheckboxChecked(isChecked:any,message:any):any[];
}

export class ValidationService implements IValidationService {
    public isSinglePeoplePickerEmpty(personID:any, message: string): any[] {
        // debugger;
        if (personID==null || personID=="") {
            message = RequiredmandatoryText;
            return [true, message];
        } else {
            message = "";
            return [false, message];
        }
    }

    public isDropdownEmpty(selectedText: string, message: string): any[] {
        // debugger;
        if (selectedText == "" || selectedText == null || selectedText == "0") {
            message = msg_RequiredField
            return [true, message];
        } else {
            message = "";
            return [false, message];
        }
    }

    public isCheckboxChecked(isChecked: boolean, message: string): any[] {
        if (!isChecked) {
            message = RequiredmandatoryText;
            return [true, message];
        } else {
            message = "";
            return [false, message];
        }
    }

    public isDropdownEmptyForPaymentTerms(selectedText: string, message: string): any[] {
        // debugger;
        if (selectedText == "" || selectedText == null ) {
            message = msg_RequiredField
            return [true, message];
        } else {
            message = "";
            return [false, message];
        }
    }
    public isTextFieldEmpty(value: string, message: string): any[] {
        // debugger;
        if (value == "" || value == null) {
            message = RequiredmandatoryText;
            return [true, message];
        } else {
            message = "";
            return [false, message];
        }
    }

    public isDateFieldEmpty(value: string, message: string): any[] {
        //debugger;
        if (value == "" || value == null) {
            message = RequiredmandatoryText;
            return [true, message];
        } else {
            message = "";
            return [false, message];
        }
    }

    public isRichTextFieldEmpty(value: string, message: string): any[] {

        // var temp = value;
        // temp = temp.replace(/<[^>]*>/g, '');
        value = value.replace(/<[^>]*>/g, '');
        //if (value == "") {
        if (value.trim().length == 0) {
            message =RequiredmandatoryText;
            return [true, message];
        } else {
            message = "";
            return [false, message];
        }
    }

    public isNumberFieldEmpty(value: number, message: string): any[] {
        if (value == 0 || value == null) {
            message = RequiredmandatoryText;
            return [true, message];
        } else {
            message = "";
            return [false, message];
        }
    }

    public isDatePickerEmpty(value: Date, message: string): any[] {
        if (value == null) {

            message = RequiredmandatoryText;
            return [true, message];
        } else {
            message = "";
            return [false, message];
        }
    }
    public isAttachmentEmpty(value: any[]): any[] {
        if (value == null || value.length == 0) {

            return [true, RequiredmandatoryText];
        } else {

            return [false, ""];
        }
    }
    public isMultiSelectDropdownEmpty(value: any, message: string): any[] {
        if (value == null || value == -1) {
            message = RequiredmandatoryText;
            return [true, message];
        } else {
            message = "";
            return [false, message];
        }
    }
}