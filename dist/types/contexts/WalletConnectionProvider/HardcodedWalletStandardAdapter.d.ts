import { BaseSignerWalletAdapter, WalletName, WalletReadyState } from "@solana/wallet-adapter-base";
import { Transaction, TransactionVersion, VersionedTransaction } from "@solana/web3.js";
export interface IHardcodedWalletStandardAdapter {
    id: string;
    name: WalletName;
    url: string;
    icon: string;
}
export default class HardcodedWalletStandardAdapter extends BaseSignerWalletAdapter {
    name: WalletName<string>;
    url: string;
    icon: string;
    supportedTransactionVersions: ReadonlySet<TransactionVersion>;
    /**
     * Storing a keypair locally like this is not safe because any application using this adapter could retrieve the
     * secret key, and because the keypair will be lost any time the wallet is disconnected or the window is refreshed.
     */
    private _keypair;
    constructor({ name, url, icon }: {
        name: WalletName;
        url: string;
        icon: string;
    });
    get connecting(): boolean;
    get publicKey(): import("@solana/web3.js").PublicKey | null;
    get readyState(): WalletReadyState;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
}
