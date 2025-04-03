import { GiftsAndBenefitsReceivedValidation } from "../../../frameworks/model/IGiftsAndBenefitsReceivedValidation";
import { ISplistItemGiftsAndBenefitsRceived } from "../../../frameworks/model/ISplistItem";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
export interface IGiftsAndBenefitsReceivedState {
    SplistItem: ISplistItemGiftsAndBenefitsRceived;
    validation: GiftsAndBenefitsReceivedValidation;
    showValidationDialog: boolean;
    isEditMode: boolean;
    status: any;
    hasAccess: any;
    IsCompliancegroupMamber: boolean;
    Isloader: boolean,
    users: IDropdownOption[];
    hasAccesscompliancegroup: any;
    selectedUsers: any;
    showSuccessDialog: boolean;
    showDraftDialog: boolean;
}