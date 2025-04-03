export interface IGiftsAndBenefitsReceivedValidation {
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
export class GiftsAndBenefitsReceivedValidation implements IGiftsAndBenefitsReceivedValidation{
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