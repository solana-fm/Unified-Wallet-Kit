import { FC, PropsWithChildren, ReactNode } from 'react';
import { Adapter, SupportedTransactionVersions, WalletName } from '@solana/wallet-adapter-base';
import { Cluster } from '@solana/web3.js';
import { IHardcodedWalletStandardAdapter } from './HardcodedWalletStandardAdapter';
import { IUnifiedTheme } from '../UnifiedWalletContext';
import { AllLanguage } from '../TranslationProvider/i18n';
export interface IWalletNotification {
    publicKey: string;
    shortAddress: string;
    walletName: string;
    metadata: {
        name: string;
        url: string;
        icon: string;
        supportedTransactionVersions?: SupportedTransactionVersions;
    };
}
export interface IUnifiedWalletConfig {
    autoConnect: boolean;
    metadata: IUnifiedWalletMetadata;
    env: Cluster;
    walletPrecedence?: WalletName[];
    hardcodedWallets?: IHardcodedWalletStandardAdapter[];
    notificationCallback?: {
        onConnect: (props: IWalletNotification) => void;
        onConnecting: (props: IWalletNotification) => void;
        onDisconnect: (props: IWalletNotification) => void;
        onNotInstalled: (props: IWalletNotification) => void;
    };
    walletlistExplanation?: {
        href: string;
    };
    theme?: IUnifiedTheme;
    lang?: AllLanguage;
    walletAttachments?: Record<string, {
        attachment: ReactNode;
    }>;
}
export interface IUnifiedWalletMetadata {
    name: string;
    url: string;
    description: string;
    iconUrls: string[];
    additionalInfo?: string;
}
declare const WalletConnectionProvider: FC<PropsWithChildren & {
    wallets: Adapter[];
    config: IUnifiedWalletConfig;
}>;
export default WalletConnectionProvider;
