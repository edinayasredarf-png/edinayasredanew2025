'use client';

import { auth } from './blogStore';

const LOGIN = 'proeco';
const PASS = 'ecostroy2013';

export const editorAuth = {
  isAuthed() {
    return auth.isAuthed();
  },
  login(login: string, pass: string) {
    if (login === LOGIN && pass === PASS) {
      // делегируем существующей системе авторизации
      return auth.login(LOGIN, PASS);
    }
    return false;
  },
  logout() {
    auth.logout();
  },
};
