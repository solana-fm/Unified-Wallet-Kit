import { Adapter } from '@solana/wallet-adapter-base';
import { DetailedHTMLProps, FC, ImgHTMLAttributes, MouseEventHandler } from 'react';
import 'twin.macro';
export interface WalletIconProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    wallet: Adapter | null;
    width?: number;
    height?: number;
}
export declare const WalletIcon: FC<WalletIconProps>;
export interface WalletListItemProps {
    handleClick: MouseEventHandler<HTMLLIElement>;
    wallet: Adapter;
}
export declare const WalletListItem: ({ handleClick, wallet }: WalletListItemProps) => import("@emotion/react/types/jsx-namespace").EmotionJSX.Element;
