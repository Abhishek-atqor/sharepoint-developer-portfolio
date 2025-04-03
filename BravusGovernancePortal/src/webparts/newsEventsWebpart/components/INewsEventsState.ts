import { INewsEvent } from "../../../frameworks/model/ISplistItem";

export interface INewsEventsState {
    newsEvents: INewsEvent[];
    showAll:boolean;
  }