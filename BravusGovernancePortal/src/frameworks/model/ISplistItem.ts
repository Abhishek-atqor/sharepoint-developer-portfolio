export interface ISplistItem {
    
}
export interface IGiftItem {
    dateGiven: Date | null;
    recipientName: string;
    businessEntity: string;
    provider: string;
    description: string;
    value: string;
    retained: string;
    reason: string;
  }
  

export interface ISplistItemGiftsAndBenefitsRceived {
    fullname: string;
    designation: string;
    department: string;
    company: string;
    date:any;
    notReceivedGifts:any;
    receivedGifts: IGiftItem[];
    signature: string;
    signatureDate: any;
    receivedGiftsCheckbox:any;
}

export interface IGiftItemGiven {
  dateGiven: Date | null;
  name: string;
  businessEntity: string;
  description: string;
  value: string;
  reason: string;
}
export interface ISplistItemGiftsAndBenifitsGiven {
  fullname: string;
  designation: string;
  department: string;
  company: string;
  date:any;
  notReceivedGifts:any;
  receivedGifts: IGiftItemGiven[];
  signature: string;
  signatureDate: any;
  receivedGiftsCheckbox:any;
}
export interface IConflictOfIntrest {
  ID: any,
  FullName: string,
  Designation: string,
  Department: string,
  Company: string
  Date: any,
  Signature: string,
  Signaturedate: any,
  NoConflictofIntrest: boolean
  ConflictOfIntrest: boolean,
  ItemStatus:any
  FinalApprover:any

}
export interface ConflictData {
  index: number
  details: string,
  nature:string,
  type: string,
  parties:string,
  sinceWhen:any,
  stepsTaken:string
}

export interface IAllBoolean {
  isEditMode: boolean,
  isDisplayMode: boolean,
  isDraftMode: boolean,
  isViewMode:boolean;


}
export interface IQuickLink {
  Title: string;
  Index: number;
  RedirectLink: string;
  Attachment: string;
}
export interface INewsEvent {
  Title: string;
  Index: number;
  RedirectLink: string;
  Attachment: string;
  NewsDescription: string;
}
export interface IEvent {
  Title: string;
  StartDate: string;
  EndDate: string;
  CurrentDate: string;
}


export interface IAllDialogBoxMeg {
  showDialog: boolean,
  dialogType: any,
  dialogMessage: any
}