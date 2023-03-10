import api from './index';

interface IUpdate {
  spentTime?: string;
  estimatedTime?: string;
  _links?: { status: { href: string } };
  lockVersion: number | undefined;
}

export class OpenProjectService {
  static async getAllTasks() {
    const { data } = await api.get('/projects/test/work_packages');
    return data;
  }

  static async getAllProjects() {
    const { data } = await api.get('/projects');
    return data;
  }

  static async getAllTaskByProject(project_id: number) {
    const { data } = await api.get(`/projects/${project_id}/work_packages`);
    return data;
  }
  static async updateTask(upd_data: IUpdate, id: number | undefined) {
    const { data } = await api.patch(`work_packages/${id}`, upd_data);
    return data;
  }

  static async updateTaskToDefault(id: number | undefined, upd_data: IUpdate) {
    const { data } = await api.patch(`work_packages/${id}`, upd_data);
    return data;
  }
  static async updateTime(
    upd_data: {
      hours: string;
      spentOn: string;
      _links: { workPackage: { href: string } };
      comment: { format: string; raw: string };
    },
    id: number | undefined
  ) {
    const { data } = await api.post(`/time_entries`, upd_data);
    return data;
  }
}
