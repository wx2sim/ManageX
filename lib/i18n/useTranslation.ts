'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { fr } from './dictionaries/fr';
import { ar } from './dictionaries/ar';

const dictionaries = {
  fr,
  ar,
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof fr>;

export function useTranslation() {
  const { language, dir } = useLanguage();
  const dictionary = dictionaries[language];

  // Utility to get nested property safely
  const t = (key: TranslationKey | string, fallback?: string): string => {
    const keys = key.split('.');
    let current: any = dictionary;

    for (const k of keys) {
      if (current[k] === undefined) {
        console.warn(`Translation key not found: ${key} for language: ${language}`);
        return fallback || key;
      }
      current = current[k];
    }

    if (typeof current !== 'string') {
      console.warn(`Translation key does not resolve to string: ${key}`);
      return fallback || key;
    }

    return current;
  };

  const tError = (errorMsg: string): string => {
    if (!errorMsg) return '';
    const dict = dictionary as any;
    if (dict.serverErrors && dict.serverErrors[errorMsg]) {
      return dict.serverErrors[errorMsg];
    }
    return errorMsg;
  };

  return { t, tError, language, dir };
}
