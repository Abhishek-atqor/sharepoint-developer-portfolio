import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IItem } from "@pnp/sp/items";
import { IFolderInfo, SPFI } from "@pnp/sp/presets/all";
import { IListOperationService } from "./IListOperationService";
import { getSP } from "../../../pnpjsConfig";
import { LogHelper } from "../../../helper/LogHelper";
//import * as HTMLDecoder from 'html-decoder';
//import * as Handlebars from "handlebars";
import { ICamlQuery } from "@pnp/sp/lists";
import "@pnp/sp/folders";
import "@pnp/sp/site-users/web";
import "@pnp/sp/batching";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { SPHttpClient, SPHttpClientResponse, SPHttpClientConfiguration, HttpClient } from '@microsoft/sp-http';
import { Constant } from '../../constants/Constant';
const logList = "LogHistory";

export class ListOperationService implements IListOperationService {

    private _sp: SPFI = null;

    public async Init(context?: WebPartContext) {
        this._sp = getSP(context)
        LogHelper.info('SharePointService', 'constructor', 'PnP SP context initialised');
    }
    //Get folders from Lib
    public async getFoldersFromDocumentLibrary(context: WebPartContext, documentLibrary: string, folderName: string): Promise<any> {
        const query = "<Where>" +
            "<And>" +
            "<Eq>" +
            "<FieldRef Name=\"FSObjType\"/>" +
            "<Value Type=\"Integer\">1</Value>" +
            "</Eq>" +
            "<Eq>" +
            "<FieldRef Name=\"FileLeafRef\" />" +
            "<Value Type=\"Text\">" + folderName + "</Value>" +
            "</Eq>" +
            "</And>" +
            "</Where>";
        const viewXml =
            `<View><Query>${query}</Query><RowLimit>1</RowLimit></View>`;
        const q: ICamlQuery = {
            ViewXml: viewXml,
        };

        return new Promise((resolve, reject) => {
            this._sp.web.lists.getByTitle(documentLibrary)
                .getItemsByCAMLQuery(q)
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }


    // For Adding Items to List 
    public async addItemsToList(context: WebPartContext, listName: string, item: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this._sp.web.lists.getByTitle(listName).items.add(item)
                .then(result => {
                    return resolve(result);
                })
                .catch(async error => {
                    reject(error);
                    await this.addItemsToLogList(context, logList, "AddItemsToList", "capex Register", "error in UpdateItemInList", error, new Date());
                });
        });
    }
    //For Adding Errors with function name in to Log List
    public async addItemsToLogList(context: WebPartContext, listName: string, functionName: string, PageName: string, message: string, exceptionmsg: string, errorDate: Date): Promise<any> {
        return new Promise((resolve, reject) => {
            const item = {
                Title: functionName,
                gen_PageName: PageName,
                gen_Message: message,
                gen_ExceptionMessage: exceptionmsg.toString(),
                gen_ExceptionMessageDate: errorDate
            };

            this._sp.web.lists.getByTitle(listName).items.add(item)
                .then(result => {
                    resolve(result);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    
    // For Update Items in to List
    public updateItemInList(context: WebPartContext, listName: string, itemId: number, item: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this._sp.web.lists.getByTitle(listName).items.getById(itemId).update(item)
                .then(result => {
                    resolve(result);
                })
                .catch(async error => {
                    reject(error);
                    await this.addItemsToLogList(context, logList, "UpdateItemInList", "capex Register", "error in UpdateItemInList", error, new Date());
                });
        });
    }
    //For Delete items from list
    public async deleteItemFromList(context: WebPartContext, listName: string, itemId: number): Promise<void> {
        return await this._sp.web.lists.getByTitle(listName).items.getById(itemId).delete();
    }
    // For Get all items from list
    public getItemsFromList(context: WebPartContext, listName: string, filter: string = "", select: string[] = [], expand: string[] = [], orderBy: string = "", ascending: boolean = true): Promise<any> {
        return new Promise((resolve, reject) => {
            
            let items = this._sp.web.lists.getByTitle(listName).items;

            if (filter !== "") {
                items = items.filter(filter);
            }
            if (expand.length > 0) {
                items = items.expand(...expand);
            }
            if (select.length > 0) {
                items = items.select(...select);
            }
            if (orderBy !== "") {
                items = items.orderBy(orderBy, ascending);
            }
            items.top(5000)().then(result => {
                resolve(result);
            })
                .catch(async error => {
                    reject(error);
                    await this.addItemsToLogList(context, logList, "GetItemsFromList", "capex Register", "error in GetItemsFromList", error, new Date());
                });
        });
    }
    // For Get All(5000) Items from List
    public async GetAllItemsFromList(context: WebPartContext, listName: string, filter: string = "", select: string[] = [], expand: string[] = [],orderBy:string,ascending:boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            let items:any = this._sp.web.lists.getByTitle(listName).items;
            if (filter != "") {
                items = items.filter(filter);
            }
            if (expand.length > 0) {
                items = items.expand(...expand);
            }
            if (select.length > 0) {
                items = items.select(...select);
            }
            if (orderBy !== "") {
                items = items.orderBy(orderBy, ascending);
            }
            items.getAll().then(async (result:any) => {
                resolve(result);
            }).catch(async (error:any) => {
                reject(error);
                await this.addItemsToLogList(context, logList, "GetAllItemsFromList", "capex Register", "error in GetItemsFromList", error, new Date());
            });
        });


    }
    // For Get Last Items from List
    public getLastItemFromList(context: WebPartContext, listName: string, filter: string = "", select: string[] = [], expand: string[] = [], orderBy: string = "", ascending: boolean): Promise<any> {
        return new Promise<any>((resolve, reject) => {

            let items = this._sp.web.lists.getByTitle(listName).items;
            if (filter !== "") {
                items = items.filter(filter);
            }
            if (expand.length > 0) {
                items = items.expand(...expand);
            }
            if (select.length > 0) {
                items = items.select(...select);
            }
            if (orderBy !== "") {
                items = items.orderBy(orderBy, ascending);
            }
            items.top(1)()
                .then((result) => {
                    resolve(result);
                })
                .catch(async (error) => {
                    await this.addItemsToLogList(context, logList, "GetLastItemsFromList", "capex Register", "error in GetLastItemsFromList", error, new Date());
                    reject(error);
                });
        });
    }
    //For Item Get By Id
    public getItemById(context: WebPartContext, listName: string, itemId: number, select: string[], expand: string[]): Promise<IItem> {
        return new Promise<IItem>((resolve, reject) => {
            let item = this._sp.web.lists.getByTitle(listName).items.getById(itemId);
            if (select.length > 0) {
                item = item.select(...select);
            }
            if (expand.length > 0) {
                item = item.expand(...expand);
            }
            item()
                .then((retrievedItem) => {
                    resolve(retrievedItem);
                })
                .catch(async (error) => {
                    await this.addItemsToLogList(context, logList, "GetItemById", "capex Register", "error in GetItemById", error, new Date());
                    reject(error);
                });
        });
    }
    //For Creating New Folder
    public createFolder(context: WebPartContext, documentLibrary: string, folderName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            //this._sp.web.folders.addUsingPath(folderName)
            this._sp.web.lists.getByTitle(documentLibrary).rootFolder.folders.addUsingPath(folderName)
                //lists.getByTitle(documentLibrary).rootFolder.folders.add(folderName);
                .then((folder) => {
                    console.log('Folder created:', folder);
                    resolve(folder);
                })
                .catch(async (error) => {
                    console.log('Error:', error);
                    await this.addItemsToLogList(context, logList, "Create Folder", "capex Register", "error in create folder", error, new Date());
                    reject(error);
                });
        });
    }
    //For check User in which Sharepoint group
    public checkUserGroup(context: WebPartContext): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._sp.web.currentUser.groups()
                .then((currentUser) => {
                    resolve(currentUser);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
    //Get User Id
    public getUserId(email: string): Promise<number> {
        return new Promise<number>((resolve, reject) => {
           this._sp.site.rootWeb.ensureUser(email)
                .then((result:any) => {
                    resolve(result.data.Id);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
    public getMaximumId(listName: string): Promise<number> {
        let maxId: number;
        return new Promise<number>((resolve, reject) => {
            this._sp.web.lists.getByTitle(listName)
                .items
                .orderBy("Id", false)
                .top(1)
                .select("Id")().then((results) => {
                    if (results.length > 0) {
                        maxId = results[0].Id;
                        resolve(maxId);
                    }
                }).catch((error) => {
                    reject(error);
                })

        })
    }
    // public async getMoreThan5000itemUsingPNPJSWithFilter(listName: string, filterValue: any ,queryTemplates:any): Promise<IItems[]> {
    //     const pageSize = 2000;
    //     let finalCollection: any = [];
    //     return new Promise<IItems[]>((resolve, reject) => {

    //         this.getMaximumId(listName).then(async (listMaxID: number) => {
    //             try {
    //                 // eslint-disable-next-line no-var
    //                 for (var i = 0; i < Math.ceil(listMaxID / pageSize); i++) {
    //                     const minId = i * pageSize + 1;
    //                     const maxId = (i + 1) * pageSize;
    //                     await this.getItemsForEachIteration(listName, minId, maxId, filterValue,queryTemplates).then(items => {
    //                         console.log(items);
    //                         finalCollection = finalCollection.concat(...items);
    //                     })
    //                 }
    //                 resolve(finalCollection);
    //             }
    //             catch (error) {
                    
    //                 console.log(error);
    //             }

    //         }).catch((error) => {
    //             reject(error);
    //         })
    //     })
    // }
    // public _getTemplateValue = (template: string, value: any): string => {
    //     const hTemplate = Handlebars.compile(HTMLDecoder.decode(template));
    //     return HTMLDecoder.decode(hTemplate(value));
    // };
    // public async getItemsForEachIteration(listName: string, minId: number, maxId: number, filterText: string,queryType: 'qry_bizSegment' | 'qry_bizSegmentSupplier'): Promise<IItems[]> {
    //     const queryTemplate = queryTemplates[queryType];
    //     const camlQuery: string = this._getTemplateValue(queryTemplate, { minId: minId, maxId: maxId, filterText: filterText });
        
    //     return new Promise<IItems[]>((resolve, reject) => {
    //         try {
    //             this._sp.web.lists.getByTitle(listName).getItemsByCAMLQuery({ ViewXml: camlQuery }).then((results) => {
    //                 resolve(results);
    //             }).catch((ex) => {
    //                 reject(ex);
    //             });
    //         }
    //         catch (error) {
    //             reject(error);
    //         }
    //     });
    // }
    public async CheckFolderExist(folderPath: string) {
        let fileResult: IFolderInfo = await this._sp.web.getFolderByServerRelativePath(folderPath).select('Exists')();
        return fileResult.Exists;

    }
}