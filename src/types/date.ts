export type ISODateString = `${number}-${number}-${number}`;

export type DateRange = {
  start: Date;
  end: Date;
};

export type SameDateQuery = {
  date: Date;
  years: number;
};
