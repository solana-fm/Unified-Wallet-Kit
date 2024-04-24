import { Dispatch, SetStateAction } from 'react';
import { AllLanguage } from './i18n';
export declare const TranslationContext: import("react").Context<{
    lang: AllLanguage;
    setLang: Dispatch<SetStateAction<AllLanguage>>;
    t: (key: string) => string;
}>;
export declare const TranslationProvider: ({ lang: forceLang, children, }: {
    lang?: AllLanguage | undefined;
    children: React.ReactNode;
}) => import("@emotion/react/types/jsx-namespace").EmotionJSX.Element;
export declare const useTranslation: () => {
    lang: AllLanguage;
    setLang: Dispatch<SetStateAction<AllLanguage>>;
    t: (key: string) => string;
};
