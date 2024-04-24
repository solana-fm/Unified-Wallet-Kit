/// <reference types="react" />
export declare const OnboardingIntro: React.FC<{
    flow: IOnboardingFlow;
    setFlow: (flow: IOnboardingFlow) => void;
    onClose: () => void;
    showBack: boolean;
}>;
export declare const OnboardingGetWallets: React.FC<{
    flow: IOnboardingFlow;
    setFlow: (flow: IOnboardingFlow) => void;
}>;
export type IOnboardingFlow = 'Onboarding' | 'Get Wallet';
export declare const OnboardingFlow: ({ onClose, showBack }: {
    onClose: () => void;
    showBack: boolean;
}) => import("@emotion/react/types/jsx-namespace").EmotionJSX.Element;
