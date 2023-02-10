import Axios from 'axios';
import { config } from '../Config';

const userName = config.userName;
const apiKey = config.TOKEN;

const basicAuth = 'Basic ' + btoa(userName + ':' + apiKey);
const api = Axios.create({
  baseURL: config.OPEN_PROJECT_URL,

  headers: {
    Authorization: basicAuth,
    'Content-Type': 'application/json',
  },
});
export default api;
