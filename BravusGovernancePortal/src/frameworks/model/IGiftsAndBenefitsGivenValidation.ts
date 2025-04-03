export interface IGiftsAndBenefitsGivenValidation {
    validationfullname:string;
    validationdesignation:string;
    validationdepartment:string;
    validationcompany:string;
    validationdate:string;
    validationnotReceivedGifts:string;
    validationreceivedGiftsCheckbox:string;
    validationsignature:string;
    validationsignatureDate:string;
} 
export class GiftsAndBenefitsGivenValidation implements IGiftsAndBenefitsGivenValidation{
    validationfullname:string = "";
    validationdesignation:string = "";
    validationdepartment:string ="";
    validationcompany:string = "" ;
    validationdate:string = "";
    validationnotReceivedGifts:string ="";
    validationreceivedGiftsCheckbox:string ="";
    validationsignature:string ="";
    validationsignatureDate:string = "";
}