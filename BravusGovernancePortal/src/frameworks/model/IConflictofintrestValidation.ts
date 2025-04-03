
export interface IConflictofintrestValidation {
    validationFullName:string;
    validationDesignation:string;
    validationDepartment:string;
    validationCompany:string;
    validationDate:string;
    validationNoConflictofIntrest:string;
    validationConflictOfIntrest:string;
    validationSignature:string;
    validationSignaturedate:string;
    validationFinalApprover:string;
} 
export class ConflictofintrestValidation implements IConflictofintrestValidation{
    validationFullName:string = "";
    validationDesignation:string = "";
    validationDepartment:string ="";
    validationCompany:string = "" ;
    validationDate:string = "";
    validationNoConflictofIntrest:string ="";
    validationConflictOfIntrest:string ="";
    validationSignature:string ="";
    validationSignaturedate:string = "";
    validationFinalApprover:string = "";
}