import { GiftsAndBenefitsGivenValidation } from "../../../frameworks/model/IGiftsAndBenefitsGivenValidation";
import { ISplistItemGiftsAndBenifitsGiven } from "../../../frameworks/model/ISplistItem";
import { IDropdownOption } from "@fluentui/react/lib/Dropdown";
export interface IGiftsAndBenifitsGivenState {
    SplistItem: ISplistItemGiftsAndBenifitsGiven;
    validation: GiftsAndBenefitsGivenValidation;
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