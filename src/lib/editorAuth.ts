'use client';

import { auth } from './blogStore';

const LOGIN = 'proeco09@yandex.ru';
const PASS = 'ecostroy2013';

export const editorAuth = {
  isAuthed() {
    return auth.isAuthed();
  },
  async login(login: string, pass: string) {
    if (login === LOGIN && pass === PASS) {
      return auth.login(LOGIN, PASS);
    }
    return false;
  },
  async logout() {
    await auth.logout();
  },
};
