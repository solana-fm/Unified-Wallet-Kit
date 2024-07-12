import { Adapter } from '@solana/wallet-adapter-base';
import React, { DetailedHTMLProps, FC, ImgHTMLAttributes, MouseEventHandler, useCallback, useMemo } from 'react';
import 'twin.macro';

import UnknownIconSVG from '../../icons/UnknownIconSVG';
import { isMobile } from '../../misc/utils';
import { SolanaMobileWalletAdapterWalletName } from '@solana-mobile/wallet-adapter-mobile';
import tw, { TwStyle } from 'twin.macro';
import { IUnifiedTheme, useUnifiedWalletContext } from '../../contexts/UnifiedWalletContext';
import { useTranslation } from '../../contexts/TranslationProvider';

export interface WalletIconProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
  wallet: Adapter | null;
  width?: number;
  height?: number;
}

const styles: Record<string, { [key in IUnifiedTheme]: TwStyle[] }> = {
  container: {
    light: [tw`bg-light-100 text-grey-700`],
    dark: [tw`bg-dark-700 text-grey-50`],
    jupiter: [tw`hover:shadow-2xl hover:bg-white/10`],
  },
  walletItem: {
    light: [tw`bg-gray-50 hover:shadow-lg`],
    dark: [tw`bg-dark-700 hover:shadow-2xl`],
    jupiter: [tw`hover:shadow-2xl hover:bg-white/10`],
  },
};

export const WalletIcon: FC<WalletIconProps> = ({ wallet, width = 24, height = 24 }) => {
  const [hasError, setHasError] = React.useState(false);

  const onError = useCallback(() => setHasError(true), []);

  if (wallet && wallet.icon && !hasError) {
    return (
      <div style={{ minWidth: width, minHeight: height }}>
        {/* // eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={width}
          height={height}
          src={wallet.icon}
          alt={`${wallet.name} icon`}
          tw="object-contain"
          onError={onError}
        />
      </div>
    );
  } else {
    return (
      <div style={{ minWidth: width, minHeight: height }}>
        <UnknownIconSVG width={width} height={height} />
      </div>
    );
  }
};

export interface WalletListItemProps {
  handleClick: MouseEventHandler<HTMLLIElement>;
  wallet: Adapter;
}

export const WalletListItem = ({ handleClick, wallet }: WalletListItemProps) => {
  const { theme } = useUnifiedWalletContext();
  const { t } = useTranslation();

  const adapterName = useMemo(() => {
    if (!wallet) return '';
    if (wallet.name === SolanaMobileWalletAdapterWalletName) return t(`Mobile`);
    return wallet.name;
  }, [wallet?.name]);

  return (
    <li
      onClick={handleClick}
      css={[
        tw`flex items-center p-[1px] space-x-5 cursor-pointer border border-white/10 rounded-lg hover:bg-white/10 hover:backdrop-blur-xl hover:shadow-2xl transition-all`,
        tw`hover:bg-gradient-to-r from-[#8057FF] to-[#D84E76]`,
        styles.container[theme],
      ]}
    >
      <div
        css={[
          tw`py-4 px-4 lg:px-2 rounded-lg flex items-center lg:justify-center cursor-pointer flex-1 w-full gap-1`,
          styles.walletItem[theme],
        ]}
      >
        {isMobile() ? (
          <WalletIcon wallet={wallet} width={24} height={24} />
        ) : (
          <WalletIcon wallet={wallet} width={30} height={30} />
        )}
        <span tw="font-semibold text-xs overflow-hidden text-ellipsis">{adapterName}</span>
      </div>
    </li>
  );
};
