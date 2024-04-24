import { RefObject } from 'react';
export declare const numberFormatter: Intl.NumberFormat;
export declare const formatNumber: {
    format: (val?: number, precision?: number) => string;
};
export declare function shortenAddress(address: string, chars?: number): string;
export declare function fromLamports(lamportsAmount?: number, decimals?: number, rate?: number): number;
export declare function toLamports(lamportsAmount: number, decimals: number): number;
export declare function useReactiveEventListener(eventName: string, handler: (event: any) => void, element?: (Window & typeof globalThis) | null): void;
export declare const isMobile: () => boolean;
export declare const detectedSeparator: string;
export declare function useOutsideClick(ref: RefObject<HTMLElement>, handler: (e: MouseEvent) => void): void;
export declare function useDebouncedEffect(fn: Function, deps: any[], time: number): void;
