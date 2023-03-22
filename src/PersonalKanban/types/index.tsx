import { RecordStatus } from '../enums';

export type User = {
  id: number;
  name: string;
  records: Record[];
};

export type Record = {
  item_id?: number;
  lockVersion?: number;
  id: string;
  title: string;
  description?: string;
  caption?: string;
  status: RecordStatus;
  nameProject?: string;
  color?: string;
  createdAt?: string;
  estimated_time?: any;
  hours?: number;
  start_date?: string;
  end_date?: string;
  changedDate: string;
};

export type IEstimatedTime = {
  hours: number | undefined;
  days: number | undefined;
  months: number | undefined;
  years: number | undefined;
};

type TimeTaskItem = {
  createdAt?: string;
  hours?: string;
  id?: number;
  spentOn?: string;
  updatedAt?: string;

  _links?: {
    delete?: {
      href: string;
      method: string;
    };
  };
};

export type TimeTask = {
  _embedded: {
    elements: TimeTaskItem[];
  };
};

export type Column = {
  id: string;
  title: string;
  description?: string;
  caption?: string;
  status: RecordStatus;
  color?: string;
  records?: Record[];
  wipLimit?: number;
  wipEnabled?: boolean;
  createdAt?: string;
};
export interface IResponseProject {
  id: number;
  identifier: string;
  name: string;
  active: boolean;
  _links: {
    workPackages: {
      href: string | undefined;
    };
    status:
      | {
          href: string;
        }
      | undefined;
  };
}
