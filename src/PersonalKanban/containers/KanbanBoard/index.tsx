// Пожалуйста, оптимизируйте код. Читать и масштабировать очень сложно. Как минимум, вам нужно разбить компоненты на подкомпоненты. Вдобавок - желательно комментировать код, как делаю я.
import { serialize } from 'tinyduration';
import React from 'react';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import KanbanBoard from 'PersonalKanban/components/KanbanBoard';
import { Column, IResponseProject, Record, User } from 'PersonalKanban/types';
import {
  checkColumnsEmpty,
  getCreatedAt,
  getId,
  getInitialState,
  getMovedUsers,
  getUsersFromResponse,
  reorderCards,
} from 'PersonalKanban/services/Utils';
import StorageService, {
  getItem,
  setItem,
} from 'PersonalKanban/services/StorageService';
import Toolbar from 'PersonalKanban/containers/Toolbar';

import useFetch from '../../hooks/useFetch';
import { OpenProjectService } from '../../../Api/OpenProjectService';

import { defaultUsersData } from '../../../index';
import { COLUMNS_STATUSES } from '../../constants';

const useKanbanBoardStyles = makeStyles((theme) => ({
  toolbar: theme.mixins.toolbar,
}));

type KanbanBoardContainerProps = {};

export interface IRecordContext {
  handleRecordHours: (idRecord: string, hours: number) => void;
}

export const RecordContext = React.createContext<IRecordContext>({
  handleRecordHours(idRecord: string, hours: number): void {},
});

const KanbanBoardContainer: React.FC<KanbanBoardContainerProps> = (props) => {
  let initialState = StorageService.getColumns() || [];

  const classes = useKanbanBoardStyles();

  const [usersState, setUsers] = React.useState<User[]>(defaultUsersData);
  const [updateTasks, setUpdateTasks] = React.useState<boolean>(true);
  const [choosedUserId, setChoosedUserId] = React.useState<number>(1);
  const [contentCardKanban, setContentCardKanban] = React.useState<Record[]>(
    []
  );

  const [columns, setColumns] = React.useState<Column[]>(initialState);

  if (!initialState) {
    initialState = getInitialState(contentCardKanban);
  }
  const { req, loading, setLoading } = useFetch(async () => {
    // Получение задач с OpenProject, которые при попадании в resolve попадут в состояния.
    if (updateTasks) {
      setLoading(true);
    }
    const allTasks: any[] = [];
    let finalProjects: any = [];
    // const res = await OpenProjectService.getAllProjects();
    const allProjects = await OpenProjectService.getProjects();
    allProjects.forEach((projects: any) => {
      finalProjects.push(...projects._embedded.elements);
    });

    // const projects = res?._embedded.elements as IResponseProject[];

    for (const item of finalProjects) {
      if (!item.active || item._links.status.title === 'Приостановлен')
        continue;
      const projectTasks = await OpenProjectService.getAllTaskByProject(
        item.id
      );
      projectTasks?._embedded.elements.forEach((val: any) => {
        if (val._links.children) return;
        allTasks.push({ ...val, nameProject: item.identifier });
      });
    }

    const users = getUsersFromResponse(defaultUsersData, allTasks);
    setUsers(users);
    contentCardKanbanChange(choosedUserId);
    setLoading(false);
  });

  const cloneColumns = React.useCallback((columns: Column[]) => {
    return columns.map((column: Column) => ({
      ...column,
      records: [...column.records!],
    }));
  }, []);

  const getColumnIndex = React.useCallback(
    (id: string) => {
      return columns.findIndex((c: Column) => c.id === id);
    },
    [columns]
  );

  const getRecordIndex = React.useCallback(
    (recordId: string, columnId: string) => {
      return columns[getColumnIndex(columnId)]?.records?.findIndex(
        (r: Record) => r.id === recordId
      );
    },
    [columns, getColumnIndex]
  );
  const contentCardKanbanChange = (dataClick: number) => {
    // здесь находится функционал, меняющий содержимое канбана
    // в данном случае после клика, используя полученное значение, находим нужные данные и сохраняем в state приложения

    setChoosedUserId(dataClick);
    setContentCardKanban(
      usersState.filter((item) => item.id === dataClick)[0].records
    );
  };

  const handleClearBoard = React.useCallback(() => {
    setColumns([]);
  }, []);

  const handleToDefaultColumns = React.useCallback(async () => {
    // Получает пользователя с основными данными.
    const choosedUser = usersState.find((state) => {
      return state.id === choosedUserId;
    });

    if (!choosedUser) return;

    const requestData = choosedUser.records.map((record) => {
      return {
        id: record.item_id,
        lockVersion: record.lockVersion,
        identificateId: record.id,
      };
    });

    // Ставит колонны на в плане, выбранного пользователя.
    let statusRequest: boolean = false;

    const result = await Promise.all(
      requestData.map(async (record) => {
        return await OpenProjectService.getTask(record.id).then(
          (task: Record) => {
            OpenProjectService.updateTaskToDefault(record.id, {
              lockVersion: task.lockVersion,
              _links: {
                status: { href: COLUMNS_STATUSES[0].link },
              },
            });
          }
        );
      })
    ).then(() => (statusRequest = true));
    if (statusRequest) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [choosedUserId]);

  // const handleColumnMove = React.useCallback(
  //     ({column, index}: { column: Column; index: number }) => {
  //         const updatedColumns = reorder(columns, getColumnIndex(column.id), index);
  //         setColumns(updatedColumns);
  //     },
  //
  //     [columns, getColumnIndex]
  // );

  const handleColumnEdit = React.useCallback(
    ({ column }: { column: Column }) => {
      setColumns((_columns: Column[]) => {
        const columnIndex = getColumnIndex(column.id);
        const columns = cloneColumns(_columns);
        columns[columnIndex].title = column.title;
        columns[columnIndex].description = column.description;
        columns[columnIndex].color = column.color;
        columns[columnIndex].wipEnabled = column.wipEnabled;
        columns[columnIndex].wipLimit = column.wipLimit;
        return columns;
      });
    },

    [getColumnIndex, cloneColumns]
  );

  const handleColumnDelete = React.useCallback(
    ({ column }: { column: Column }) => {
      setColumns((_columns: Column[]) => {
        const columns = cloneColumns(_columns);
        columns.splice(getColumnIndex(column.id), 1);
        return columns;
      });
    },
    [cloneColumns, getColumnIndex]
  );

  const handleCardMove = React.useCallback(
    ({
      column,
      index,
      source,
      record,
    }: {
      column: Column;
      index: number;
      source: Column;
      record: Record;
    }) => {
      const changedDT: string = new Date().toLocaleString().split(',').join('');
      record.changedDate = changedDT;
      const updatedColumns = reorderCards({
        columns,
        destinationColumn: column,
        destinationIndex: index,
        sourceColumn: source,
        sourceIndex: getRecordIndex(record.id, source.id)!,
      });
      const newStatusUrl = COLUMNS_STATUSES.filter(
        (item) => item.status === column.status
      )[0].link;

      OpenProjectService.getTask(record.item_id).then((task: Record) => {
        OpenProjectService.updateTask(
          {
            lockVersion: task.lockVersion,
            _links: {
              status: {
                href: newStatusUrl,
              },
            },
          },
          record.item_id
        );
      });
      setColumns(updatedColumns);
      const bufferUsers = getMovedUsers(
        usersState,
        choosedUserId,
        record,
        column,
        changedDT
      );

      setUsers(bufferUsers);
    },

    [columns, getRecordIndex, usersState, props]
  );
  const handleRecordHours = React.useCallback(
    async (idRecord: string, hours: number) => {
      const idTask = Number(idRecord);
      const currentTaskStatus = await OpenProjectService.getTask(idTask).then(
        (record): any => record._links.status.title
      );
      const date = new Date();
      await OpenProjectService.getTask(idTask).then((task: Record) => {
        OpenProjectService.updateTime(
          {
            comment: {
              format: 'plain',
              raw: 'Kanban Test',
            },
            spentOn: `${date.toISOString().split('T')[0]}`,
            lockVersion: task.lockVersion,
            hours: serialize({
              hours: hours,
            }),
            _links: {
              workPackage: {
                href: `/api/v3/work_packages/${idTask}`,
              },
            },
          },
          idTask
        );
      });

      let indexCurrentColumn = 0;
      const currentColumn = columns.find((column, i) => {
        indexCurrentColumn = i;
        return column.title === currentTaskStatus;
      });

      let indexTask = 0;

      const currentTask = currentColumn?.records?.find((record) => {
        return record.item_id === idTask;
      });
      let resultHours = 0;
      const cloneColumns = JSON.parse(JSON.stringify(columns));
      const newTasks = cloneColumns[indexCurrentColumn].records?.map(
        (record: any, i: number) => {
          if (record.item_id === currentTask?.item_id) {
            indexTask = i;
            resultHours = hours + record.hours;
            return {
              ...record,
              hours: record.hours + hours,
              id: idRecord,
            };
          }
          return record;
        }
      );
      const changedDT: string = new Date().toLocaleString().split(',').join('');

      cloneColumns[indexCurrentColumn].records = newTasks;

      if (cloneColumns[indexCurrentColumn].records) {
        const bufferUsers = getMovedUsers(
          usersState,
          choosedUserId,
          newTasks[indexTask],
          cloneColumns[indexCurrentColumn],
          changedDT
        );
        setColumns(cloneColumns);
        setUsers(bufferUsers);
      }
      return;
    },
    [choosedUserId, columns, usersState]
  );

  // const handleAddRecord = React.useCallback(
  //   ({ column, record }: { column: Column; record: Record }) => {
  //     const columnIndex = getColumnIndex(column.id);
  //     setColumns((_columns: Column[]) => {
  //       const columns = cloneColumns(_columns);

  //       columns[columnIndex].records = [
  //         {
  //           id: getId(),
  //           title: record.title,
  //           description: record.description,
  //           color: record.color,
  //           hours: 0,
  //           status: record.status,
  //           createdAt: getCreatedAt(),
  //           changedDate: new Date().toLocaleDateString().split(',').join(''),
  //         },
  //         ...columns[columnIndex].records,
  //       ];
  //       return columns;
  //     });
  //   },

  //   [cloneColumns, getColumnIndex]
  // );

  const handleRecordEdit = React.useCallback(
    ({ column, record }: { column: Column; record: Record }) => {
      const columnIndex = getColumnIndex(column.id);
      const recordIndex = getRecordIndex(record.id, column.id);
      setColumns((_columns) => {
        const columns = cloneColumns(_columns);
        const _record = columns[columnIndex].records[recordIndex!];
        _record.title = record.title;
        _record.description = record.description;
        _record.color = record.color;
        return columns;
      });
    },

    [getColumnIndex, getRecordIndex, cloneColumns]
  );

  const handleRecordDelete = React.useCallback(
    ({ column, record }: { column: Column; record: Record }) => {
      const columnIndex = getColumnIndex(column.id);
      const recordIndex = getRecordIndex(record.id, column.id);
      setColumns((_columns) => {
        const columns = cloneColumns(_columns);
        columns[columnIndex].records.splice(recordIndex!, 1);
        return columns;
      });
    },
    [cloneColumns, getColumnIndex, getRecordIndex]
  );

  const handleAllRecordDelete = React.useCallback(
    ({ column }: { column: Column }) => {
      const columnIndex = getColumnIndex(column.id);
      setColumns((_columns) => {
        const columns = cloneColumns(_columns);
        columns[columnIndex].records = [];
        return columns;
      });
    },
    [cloneColumns, getColumnIndex]
  );
  React.useEffect(() => {
    StorageService.setColumns(columns);
  }, []);

  React.useEffect(() => {
    if (updateTasks) {
      req();
      setUpdateTasks(false);
    }
  }, []);
  React.useEffect(() => {
    initialState = getInitialState(
      contentCardKanban.sort((a, b) => {
        // @ts-ignore
        return new Date(b.start_date) - new Date(a.start_date);
      })
    );
    setColumns(initialState);
    StorageService.setUsers(usersState);
  }, [contentCardKanban]);

  return (
    <RecordContext.Provider value={{ handleRecordHours }}>
      <Toolbar
        clearButtonDisabled={!columns?.length}
        onDefaultColumns={handleToDefaultColumns}
        onClearBoard={handleClearBoard}
        users={usersState}
        choosed={choosedUserId}
        contentCardKanbanChange={contentCardKanbanChange}
      />
      <div className={classes.toolbar} />

      <Box padding={1}>
        {!loading ? (
          <KanbanBoard
            columns={columns}
            onColumnEdit={handleColumnEdit}
            onColumnDelete={handleColumnDelete}
            onCardMove={handleCardMove}
            // onAddRecord={handleAddRecord}
            onRecordEdit={handleRecordEdit}
            onRecordDelete={handleRecordDelete}
            onAllRecordDelete={handleAllRecordDelete}
          />
        ) : (
          <p>Загрузка</p>
        )}
      </Box>
    </RecordContext.Provider>
  );
};

export default KanbanBoardContainer;
