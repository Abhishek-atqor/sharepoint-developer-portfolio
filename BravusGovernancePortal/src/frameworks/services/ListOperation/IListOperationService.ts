//add below code on 21/06 by Nirali
import { SPHttpClientResponse } from "@microsoft/sp-http";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IItem } from "@pnp/sp/items";


export interface IListOperationService {
    //addItemsToListWithBatch: (context: WebPartContext, listName: string, item: any) => Promise<IItemAddResult>;
    addItemsToList: (context: WebPartContext, listName: string, item: any) => Promise<any>;
    addItemsToLogList(context: WebPartContext, listName: string, functionName: string, PageName: string, message: string, exceptionmsg: string, errorDate:Date): Promise<any>;
    updateItemInList: (context: WebPartContext, listName: string, itemId: number, item: any) => Promise<any>;
    deleteItemFromList: (context: WebPartContext, listName: string, itemId: number) => Promise<void>;
    getUserId: (email: string) => Promise<number>;
    getItemsFromList: (context: WebPartContext,listName:string,filter:string,select:string[],expand:string[],orderBy:string,ascending:boolean) => Promise<any>;
    getLastItemFromList: (context: WebPartContext, listName: string, filter: string, select: string[], expand: string[], orderBy: string, ascending: boolean) => Promise<any>;
    getItemById(context: WebPartContext, listName: string, itemId: number, select: string[], expand: string[]): Promise<IItem>;
    createFolder(context: WebPartContext,documentLibrary: string,folderURL: string): Promise<any>;
    checkUserGroup(context:WebPartContext): Promise<any>;
    CheckFolderExist(folderPath:string): Promise<any>;
}
