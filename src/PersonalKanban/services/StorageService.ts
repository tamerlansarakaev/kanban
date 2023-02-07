import {Column, User} from "PersonalKanban/types";

const DARK_MODE = "dark_mode";
const COLUMNS = "columns";
const USERS = "user_data"

export function getItem(key: string) {
  return JSON.parse(localStorage.getItem(key)!);
}

export function setItem(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getDarkMode() {
  return getItem(DARK_MODE);
}

export function setDarkMode(value: boolean) {
  return setItem(DARK_MODE, value);
}

export function setColumns(value: Column[]) {
  return setItem(COLUMNS, value);
}

export function getColumns() {
  return getItem(COLUMNS);
}

export function setUsers(value: User[]) {
  return setItem(USERS, value);
}

export function getUsers() {
  return getItem(USERS);
}

const StorageService = {
  getItem,
  setItem,
  setUsers,
  getUsers,
  getDarkMode,
  setDarkMode,
  getColumns,
  setColumns,
};

export default StorageService;
