import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { ConflictofintrestValidation } from "../../../frameworks/model/IConflictofintrestValidation";
import { IAllBoolean, IAllDialogBoxMeg, IConflictOfIntrest } from "../../../frameworks/model/ISplistItem";
import { ConflictData } from "../../../frameworks/model/ISplistItem"

export interface IConflictOfIntrestState {
    IConflictOfIntrest: IConflictOfIntrest,
    Isloader: boolean,
    conflictRows: ConflictData[],
    validation: ConflictofintrestValidation,
    showValidationDialog: boolean,
    showErrorForDate: boolean;
    allBoolean: IAllBoolean,
    itemID: Number;
    isAllFielddiasble: boolean;
    IsRequestors: boolean;
    users: IDropdownOption[]; 
    selectedUsers: any;
    IsCompliancegroupMamber:boolean;
    allDialogBoxMeg: IAllDialogBoxMeg,
    showSuccessDialog: boolean,
    showDraftDialog: boolean

}