/// <reference types="react" />
import type { Adapter } from '@solana/wallet-adapter-base';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import { IUnifiedWalletConfig } from './WalletConnectionProvider';
export declare const MWA_NOT_FOUND_ERROR = "MWA_NOT_FOUND_ERROR";
export type IUnifiedTheme = 'light' | 'dark' | 'jupiter';
export interface IUnifiedWalletContext {
    walletPrecedence: IUnifiedWalletConfig['walletPrecedence'];
    handleConnectClick: (event: React.MouseEvent<HTMLElement, globalThis.MouseEvent>, wallet: Adapter) => Promise<void>;
    showModal: boolean;
    setShowModal: (showModal: boolean) => void;
    walletlistExplanation: IUnifiedWalletConfig['walletlistExplanation'];
    theme: IUnifiedTheme;
    walletAttachments: IUnifiedWalletConfig['walletAttachments'];
}
export declare const UnifiedWalletContext: import("react").Context<IUnifiedWalletContext>;
export declare const UNIFIED_WALLET_VALUE_DEFAULT_CONTEXT: WalletContextState;
export declare const UnifiedWalletValueContext: import("react").Context<WalletContextState>;
export declare const useUnifiedWalletContext: () => IUnifiedWalletContext;
export declare const useUnifiedWallet: () => WalletContextState;
