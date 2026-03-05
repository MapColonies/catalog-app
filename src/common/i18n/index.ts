import { MessageFormatElement } from '@formatjs/icu-messageformat-parser';

import messages_en from './en.json';
import messages_he from './he.json';
import AG_GRID_LOCALE_EN from './grid.en';
import AG_GRID_LOCALE_HE from './grid.he';
const MESSAGES: {
  [key: string]: Record<string, string> | Record<string, MessageFormatElement[]>;
} = {
  he: messages_he,
  en: messages_en,
};

export const GRID_MESSAGES: {
  [key: string]: Record<string, string>;
} = {
  he: AG_GRID_LOCALE_HE,
  en: AG_GRID_LOCALE_EN,
};

export default MESSAGES;
