export interface IDictionaryValue {
  en: string;
  he: string;
  icon: string;
}

export interface IDictionary {
  [key: string]: IDictionaryValue;
}
