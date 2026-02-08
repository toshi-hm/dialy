export type ISODateString = `${number}-${number}-${number}`;

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SameDateQuery {
  date: Date;
  years: number;
}
