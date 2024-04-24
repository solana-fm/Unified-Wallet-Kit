import BN from 'bn.js';
import React, { PropsWithChildren } from 'react';
export interface IAccountsBalance {
    balance: number;
    balanceLamports: BN;
    hasBalance: boolean;
    decimals: number;
}
interface IAccountContext {
    accounts: Record<string, IAccountsBalance>;
    loading: boolean;
    refresh: () => void;
}
declare const AccountsProvider: React.FC<PropsWithChildren>;
declare const useAccounts: () => IAccountContext;
export { AccountsProvider, useAccounts };
