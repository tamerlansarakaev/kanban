import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

import { Column, Record, User } from 'PersonalKanban/types';
import { RecordStatus } from '../enums';
import { parse } from 'tinyduration';

// Basic parsing

export const getId = (): string => {
  return uuidv4();
};

const estimatedTime = (time: string) => {
  const interval: any = parse(time);
  const hours = interval.hours ? interval.hours : 0;
  const days = interval.days ? interval.days * 24 : 0;
  const weeks = interval.weeks ? interval.weeks * 7 * 24 : 0;
  const month = interval.months ? interval.months * 30 * 24 : 0;
  const years = interval.years ? interval.years * 12 * 30 * 24 : 0;

  const result = hours + days + weeks + month + years;
  return result;
};

export const getMovedUsers = (
  usersState: User[],
  choosedUserId: number,
  record: Record | any,
  column: Column,
  changedDT: string
) => {
  const bufferUsers: User[] = usersState;
  const chosenUser: User = usersState[choosedUserId - 1];
  let bufferRecords: Record[] = [];
  chosenUser.records.forEach((value) => {
    if (value.item_id === record.item_id) {
      bufferRecords = chosenUser.records.filter(
        (item) => item.item_id !== record.item_id
      );
      bufferRecords.push({
        ...record,
        status: column.status,
        changedDate: changedDT,
      });
    }
  });
  chosenUser.records = bufferRecords.sort(function (a, b) {
    // @ts-ignore
    return new Date(a.start_date) - new Date(b.start_date);
  });
  bufferUsers[choosedUserId - 1] = chosenUser;
  return bufferUsers;
};
const valueExistsInStatus = (status: string) => {
  const values = Object.values(RecordStatus);
  return values.includes(status as RecordStatus)
    ? (status as RecordStatus)
    : false;
};
export const getUsersFromResponse = (
  defaultUsersData: User[],
  data: any
): User[] => {
  let tempUsersData: User[] = defaultUsersData;
  data.forEach(
    (item: {
      _links: {
        [x: string]: any;
        customField6: { title: string };
        status: { title: string };
        responsible?: { title: string };
      };
      id: number;
      spentTime: string;
      estimatedTime: string;
      subject: any;
      description: { raw: any };
      startDate: any;
      lockVersion: number;
      nameProject: string;
      dueDate: any;
      updatedAt: string | number | Date;
    }) => {
      const userIndex = tempUsersData.findIndex((user) => {
        return user.name === item._links?.assignee?.title;
      });
      if (userIndex !== -1 && valueExistsInStatus(item._links.status.title)) {
        const taskStatus = valueExistsInStatus(
          item._links.status.title
        ) as RecordStatus;

        tempUsersData[userIndex].records.push({
          item_id: item.id,
          lockVersion: item.lockVersion,
          id: getId(),
          title: String(item.id),
          description: item.subject || '',
          status: taskStatus,
          nameProject: item.nameProject,
          estimated_time: item.estimatedTime
            ? estimatedTime(item.estimatedTime)
            : 0,
          start_date: item.startDate || '',
          end_date: item.dueDate || '',
          changedDate: new Date(item.updatedAt)
            .toLocaleString()
            .split(',')
            .join(''),
          caption: '',
          color: '',
          createdAt: '',
          hours: estimatedTime(item.spentTime),
        });
      }
    }
  );
  return tempUsersData;
};
export const reorder = (list: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const getCreatedAt = () => {
  return `${moment().format('DD.MM.YYYY')} ${moment().format('HH:mm:ss')}`;
};

export const reorderCards = ({
  columns,
  sourceColumn,
  destinationColumn,
  sourceIndex,
  destinationIndex,
}: {
  columns: Column[];
  sourceColumn: Column;
  destinationColumn: Column;
  sourceIndex: number;
  destinationIndex: number;
}) => {
  const getColumnIndex = (columnId: string) =>
    columns.findIndex((c) => c.id === columnId);

  const getRecords = (columnId: string) => [
    ...columns.find((c) => c.id === columnId)?.records!,
  ];

  const current = getRecords(sourceColumn.id);
  const next = getRecords(destinationColumn.id);
  const target = current[sourceIndex];

  // moving to same list
  if (sourceColumn.id === destinationColumn.id) {
    const reordered = reorder(current, sourceIndex, destinationIndex);
    const newColumns = columns.map((c) => ({ ...c }));
    newColumns[getColumnIndex(sourceColumn.id)].records = reordered;

    return newColumns;
  }

  // moving to different list
  current.splice(sourceIndex, 1);
  next.splice(destinationIndex, 0, target);

  const newColumns = columns.map((c) => ({ ...c }));
  newColumns[getColumnIndex(sourceColumn.id)].records = current;
  newColumns[getColumnIndex(destinationColumn.id)].records = next;

  return newColumns;
};
export const insertToPositionArr = (
  arr: any[],
  data: any,
  position: number
) => {
  if (position >= arr.length) {
    arr.push(data); // Put at the end if position is more than total length of array
  } else if (position <= 0) {
    arr.unshift(data); // Put at the start if position is less than or equal to 0
  } else {
    // Shift all elements to right
    for (let i = arr.length; i >= position; i--) {
      arr[i] = arr[i - 1];
    }
    arr[position] = data;
  }
};
export const getInitialState = (contentCard: Record[]) => {
  // содежимое блока формируем из приходящего значения
  const filterCardsByStatus = (status: RecordStatus) => {
    return contentCard.filter((item) => item.status === status);
  };

  return [
    {
      id: getId(),
      title: 'В плане',
      color: 'Orange',
      status: RecordStatus.Plan,
      records: filterCardsByStatus(RecordStatus.Plan),
      createdAt: getCreatedAt(),
    },
    {
      id: getId(),
      title: 'В работе',
      color: 'Blue',
      status: RecordStatus.Progress,
      records: filterCardsByStatus(RecordStatus.Progress),
      createdAt: getCreatedAt(),
    },
    {
      id: getId(),
      title: 'На проверке',
      color: 'Purple',
      status: RecordStatus.Inspection,
      records: filterCardsByStatus(RecordStatus.Inspection),
      createdAt: getCreatedAt(),
    },
  ];
};
