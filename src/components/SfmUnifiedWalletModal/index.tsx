import { Adapter, WalletName, WalletReadyState } from '@solana/wallet-adapter-base';
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useToggle } from 'react-use';
import { WalletIcon, WalletListItem } from './WalletListItem';
import Collapse from '../../components/Collapse';
import { SolanaMobileWalletAdapterWalletName } from '@solana-mobile/wallet-adapter-mobile';
import tw, { TwStyle } from 'twin.macro';
import { useTranslation } from '../../contexts/TranslationProvider';
import { IUnifiedTheme, useUnifiedWallet, useUnifiedWalletContext } from '../../contexts/UnifiedWalletContext';
import { usePreviouslyConnected } from '../../contexts/WalletConnectionProvider/previouslyConnectedProvider';
import CloseIcon from '../../icons/CloseIcon';
import { isMobile, useOutsideClick } from '../../misc/utils';
import NotInstalled from '../UnifiedWalletModal/NotInstalled';
import { OnboardingFlow } from '../UnifiedWalletModal/Onboarding';
import { SfmLogo } from './SfmLogo';

const styles: Record<string, { [key in IUnifiedTheme]: TwStyle[] }> = {
  container: {
    light: [tw`bg-light-100 text-grey-700`],
    dark: [tw`bg-dark-700 text-grey-50`],
    jupiter: [tw`text-white bg-[rgb(49, 62, 76)]`],
  },
  shades: {
    light: [tw`bg-gradient-to-t from-[#EEF0F5] to-transparent pointer-events-none`],
    dark: [tw`bg-gradient-to-t from-[#151820] to-transparent pointer-events-none`],
    jupiter: [tw`bg-gradient-to-t from-[rgb(49, 62, 76)] to-transparent pointer-events-none`],
  },
  walletItem: {
    light: [tw`bg-gray-50 hover:shadow-lg`],
    dark: [tw`bg-dark-700 hover:shadow-2xl`],
    jupiter: [tw`hover:shadow-2xl hover:bg-white/10`],
  },
  subtitle: {
    light: [tw`text-black/50`],
    dark: [tw`text-white/50`],
    jupiter: [tw`text-white/50`],
  },
  header: {
    light: [tw`border-b`],
    dark: [],
    jupiter: [],
  },
  buttonText: {
    light: [tw`text-gray-800`],
    dark: [tw`text-white/80`],
    jupiter: [tw`text-white/80`],
  },
  badge: {
    light: [tw`inline-flex items-center rounded-md bg-[#E5E5E8] px-2 py-1 text-xs font-medium text-[#949497]`],
    dark: [tw`inline-flex items-center rounded-md bg-[#171C2D] px-2 py-1 text-xs font-medium text-[#5E5F64] `],
    jupiter: [tw`inline-flex items-center rounded-md bg-[#171C2D] px-2 py-1 text-xs font-medium text-gray-600`],
  },
};

const Header: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { theme } = useUnifiedWalletContext();
  const { t } = useTranslation();

  return (
    <div css={[tw`px-5 py-6 flex flex-row justify-center `, styles.header[theme]]}>
      <div tw="flex flex-col items-center">
        <img src={SfmLogo} alt="logo" />
        <div tw="font-semibold text-xl -mt-10">
          <span css={[tw`text-transparent bg-clip-text bg-gradient-to-r from-[#8057FF] to-[#D84E76]`]}>
            {t(`Connect Wallet`)}
          </span>
        </div>
        <div css={[tw`text-sm mt-1 font-semibold`, styles.subtitle[theme]]}>
          <span>{t(`Connect a wallet to proceed`)}</span>
        </div>
      </div>

      <button tw="absolute top-4 right-4" onClick={onClose}>
        <CloseIcon width={12} height={12} />
      </button>
    </div>
  );
};

const ListOfWallets: React.FC<{
  list: {
    recommendedWallets: Adapter[];
    highlightedBy: HIGHLIGHTED_BY;
    highlight: Adapter[];
    others: Adapter[];
  };
  onToggle: (nextValue?: any) => void;
  isOpen: boolean;
}> = ({ list, onToggle, isOpen }) => {
  const { handleConnectClick, walletlistExplanation, walletAttachments, theme } = useUnifiedWalletContext();
  const { t } = useTranslation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotInstalled, setShowNotInstalled] = useState<Adapter | false>(false);

  const onClickWallet = React.useCallback((event: React.MouseEvent<HTMLElement, MouseEvent>, adapter: Adapter) => {
    if (adapter.readyState === WalletReadyState.NotDetected) {
      setShowNotInstalled(adapter);
      return;
    }
    handleConnectClick(event, adapter);
  }, []);

  const renderWalletList = useMemo(
    () => (
      <div>
        <div tw="mt-4 grid gap-2 grid-cols-2 pb-4" translate="no">
          {list.others.map((adapter, index) => {
            return (
              <ul key={index}>
                <WalletListItem handleClick={(e) => onClickWallet(e, adapter)} wallet={adapter} />
              </ul>
            );
          })}
        </div>
        {list.highlightedBy !== 'Onboarding' && walletlistExplanation ? (
          <div css={[tw`text-xs font-semibold underline text-center`, list.others.length > 6 ? tw`mb-8` : '']}>
            <a href={walletlistExplanation.href} target="_blank" rel="noopener noreferrer">
              <span>{t(`Can't find your wallet?`)}</span>
            </a>
          </div>
        ) : null}
      </div>
    ),
    [handleConnectClick, list.others],
  );

  const hasNoWallets = useMemo(() => {
    return list.highlight.length === 0 && list.others.length === 0;
  }, [list]);

  useEffect(() => {
    if (hasNoWallets) {
      setShowOnboarding(true);
    }
  }, [hasNoWallets]);

  if (showOnboarding) {
    return <OnboardingFlow showBack={!hasNoWallets} onClose={() => setShowOnboarding(false)} />;
  }

  if (showNotInstalled) {
    return (
      <NotInstalled
        adapter={showNotInstalled}
        onClose={() => setShowNotInstalled(false)}
        onGoOnboarding={() => {
          setShowOnboarding(true);
          setShowNotInstalled(false);
        }}
      />
    );
  }

  return (
    <>
      <div className="hideScrollbar" css={[tw`h-full overflow-y-auto pt-3 pb-8 px-5 relative`, isOpen && tw`mb-7`]}>
        <div tw="flex flex-col space-y-2">
          <span tw="text-sm font-semibold text-gray-500">{t(`Recommended`)}</span>
          {list.recommendedWallets.map((adapter, idx) => {
            const attachment = walletAttachments ? walletAttachments[adapter.name]?.attachment : null;
            const adapterName = (() => {
              if (adapter.name === SolanaMobileWalletAdapterWalletName) return t(`Mobile`);
              return adapter.name;
            })();

            return (
              <div
                key={idx}
                onClick={(event) => onClickWallet(event, adapter)}
                css={[
                  tw`p-[1px] border border-white/10 rounded-lg flex items-center lg:justify-center cursor-pointer flex-1 w-full`,
                  tw`hover:bg-gradient-to-r from-[#8057FF] to-[#D84E76]`,
                ]}
              >
                <div
                  css={[
                    tw`py-4 px-4 lg:px-2 rounded-lg flex items-center lg:justify-center cursor-pointer flex-1 w-full`,
                    styles.walletItem[theme],
                  ]}
                >
                  {isMobile() ? (
                    <WalletIcon wallet={adapter} width={24} height={24} />
                  ) : (
                    <WalletIcon wallet={adapter} width={30} height={30} />
                  )}
                  <span tw="font-semibold text-lg ml-4 lg:ml-2">{adapterName}</span>
                  {attachment ? <div>{attachment}</div> : null}
                </div>
                <span css={[tw`absolute right-10`, styles.badge[theme]]}>Recommended</span>
              </div>
            );
          })}
        </div>
        <div tw="mt-2 flex flex-col space-y-2 ">
          {list.highlight.map((adapter, idx) => {
            const adapterName = (() => {
              if (adapter.name === SolanaMobileWalletAdapterWalletName) return t(`Mobile`);
              return adapter.name;
            })();

            const attachment = walletAttachments ? walletAttachments[adapter.name]?.attachment : null;

            return (
              <div
                key={idx}
                onClick={(event) => onClickWallet(event, adapter)}
                css={[
                  tw`p-[1px] border border-white/10 rounded-lg flex items-center lg:justify-center cursor-pointer flex-1 w-full`,
                  tw`hover:backdrop-blur-xl transition-all`,
                  tw`hover:bg-gradient-to-r  from-[#8057FF] to-[#D84E76]`,
                  styles.walletItem[theme],
                ]}
              >
                <div
                  css={[
                    tw`py-4 px-4 lg:px-2 rounded-lg flex items-center lg:justify-center cursor-pointer flex-1 w-full`,
                    styles.walletItem[theme],
                  ]}
                >
                  {isMobile() ? (
                    <WalletIcon wallet={adapter} width={24} height={24} />
                  ) : (
                    <WalletIcon wallet={adapter} width={30} height={30} />
                  )}
                  <span tw="font-semibold text-lg ml-4 lg:ml-2">{adapterName}</span>
                  {attachment ? <div>{attachment}</div> : null}
                </div>
              </div>
            );
          })}
        </div>

        {walletlistExplanation && list.others.length === 0 ? (
          <div tw="text-xs font-semibold mt-4 -mb-2 text-white/80 underline cursor-pointer">
            <a href={walletlistExplanation.href} target="_blank" rel="noopener noreferrer">
              <span>{t(`Can't find your wallet?`)}</span>
            </a>
          </div>
        ) : null}

        {list.others.length > 0 ? (
          <>
            <div tw="mt-5 flex justify-center cursor-pointer" onClick={onToggle}>
              <span tw="text-xs font-semibold text-grey-500">
                <span>{t(`More options`)}</span>
              </span>
            </div>

            <Collapse height={0} maxHeight={'auto'} expanded={isOpen}>
              {renderWalletList}
            </Collapse>
          </>
        ) : null}
        <div
          css={[
            tw`text-xs flex justify-center font-semibold mt-4 -mb-2 underline cursor-pointer`,
            styles.buttonText[theme],
          ]}
        >
          <button type="button" onClick={() => setShowOnboarding(true)}>
            <span>{t(`I don't have a wallet`)}</span>
          </button>
        </div>
      </div>

      {/* Bottom Shades */}
      {isOpen && list.others.length > 6 ? (
        <>
          <div css={[tw`block w-full h-20 absolute left-0 bottom-7 z-50`, styles.shades[theme]]} />
        </>
      ) : null}
    </>
  );
};

const PRIORITISE: {
  [value in WalletReadyState]: number;
} = {
  [WalletReadyState.Installed]: 1,
  [WalletReadyState.Loadable]: 2,
  [WalletReadyState.NotDetected]: 3,
  [WalletReadyState.Unsupported]: 3,
};
export interface WalletModalProps {
  className?: string;
  logo?: ReactNode;
  container?: string;
}

type HIGHLIGHTED_BY = 'PreviouslyConnected' | 'Installed' | 'TopWallet' | 'Onboarding' | 'Recommended';
const RECOMMENDED_WALLETS: WalletName[] = ['Solflare' as WalletName<'Solflare'>];

const TOP_WALLETS: WalletName[] = [
  'Coinbase Wallet' as WalletName<'Coinbase Wallet'>,
  'Backpack' as WalletName<'Backpack'>,
  'Phantom' as WalletName<'Phantom'>,
];

interface IUnifiedWalletModal {
  onClose: () => void;
}

const sortByPrecedence = (walletPrecedence: WalletName[]) => (a: Adapter, b: Adapter) => {
  if (!walletPrecedence) return 0;

  const aIndex = walletPrecedence.indexOf(a.name);
  const bIndex = walletPrecedence.indexOf(b.name);

  if (aIndex === -1 && bIndex === -1) return 0;
  if (aIndex >= 0) {
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  }

  if (bIndex >= 0) {
    if (aIndex === -1) return 1;
    return bIndex - aIndex;
  }
  return 0;
};

const SfmUnifiedWalletModal: React.FC<IUnifiedWalletModal> = ({ onClose }) => {
  const { wallets } = useUnifiedWallet();
  const { walletPrecedence, theme } = useUnifiedWalletContext();
  const [isOpen, onToggle] = useToggle(false);
  const previouslyConnected = usePreviouslyConnected();

  const list: {
    recommendedWallets: Adapter[];
    highlightedBy: HIGHLIGHTED_BY;
    highlight: Adapter[];
    others: Adapter[];
  } = useMemo(() => {
    // Then, Installed, Top 3, Loadable, NotDetected
    const filteredAdapters = wallets.reduce<{
      previouslyConnected: Adapter[];
      installed: Adapter[];
      top3: Adapter[];
      loadable: Adapter[];
      notDetected: Adapter[];
      recommendedWallets: Adapter[];
    }>(
      (acc, wallet) => {
        const adapterName = wallet.adapter.name;

        if (RECOMMENDED_WALLETS.some((wallet) => wallet === adapterName) && acc.recommendedWallets.length < 1) {
          // Prevent duplicates since Coinbase Wallet has two adapters duplicate
          if (acc.recommendedWallets.some((wallet) => wallet.name === adapterName)) return acc;
          acc.recommendedWallets.push(wallet.adapter);
          return acc;
        }

        // Previously connected takes highest
        const previouslyConnectedIndex = previouslyConnected.indexOf(adapterName);
        if (previouslyConnectedIndex >= 0) {
          acc.previouslyConnected[previouslyConnectedIndex] = wallet.adapter;
          return acc;
        }
        // Then Installed
        if (wallet.readyState === WalletReadyState.Installed) {
          acc.installed.push(wallet.adapter);
          return acc;
        }
        // Top 3
        const topWalletsIndex = TOP_WALLETS.indexOf(adapterName);
        if (topWalletsIndex >= 0) {
          acc.top3[topWalletsIndex] = wallet.adapter;
          return acc;
        }
        // Loadable
        if (wallet.readyState === WalletReadyState.Loadable) {
          acc.loadable.push(wallet.adapter);
          return acc;
        }
        // NotDetected
        if (wallet.readyState === WalletReadyState.NotDetected) {
          acc.loadable.push(wallet.adapter);
          return acc;
        }
        return acc;
      },
      {
        recommendedWallets: [],
        previouslyConnected: [],
        installed: [],
        top3: [],
        loadable: [],
        notDetected: [],
      },
    );

    if (filteredAdapters.previouslyConnected.length > 0) {
      const { recommendedWallets, previouslyConnected, ...rest } = filteredAdapters;

      const highlight = filteredAdapters.previouslyConnected.slice(0, 3);
      let others = Object.values(rest)
        .flat()
        .sort((a, b) => PRIORITISE[a.readyState] - PRIORITISE[b.readyState])
        .sort(sortByPrecedence(walletPrecedence || []));
      others.unshift(...filteredAdapters.previouslyConnected.slice(3, filteredAdapters.previouslyConnected.length));
      others = others.filter(Boolean);

      return {
        recommendedWallets,
        highlightedBy: 'PreviouslyConnected',
        highlight,
        others,
      };
    }

    if (filteredAdapters.installed.length > 0) {
      const { recommendedWallets, installed, ...rest } = filteredAdapters;

      console.log(recommendedWallets);
      // Sort the installed wallets according to the top wallets that we want to show to the user first
      const highlight: Adapter[] = [];

      // Loop through the installed wallet adapters and check if they are in the top wallets list
      // If they are in the top wallet list, we will add it to the filtered recommende wallets
      TOP_WALLETS.forEach((topWallet) => {
        filteredAdapters.installed.forEach((installedWallet, index) => {
          if (topWallet === installedWallet.name) {
            const walletToPush = filteredAdapters.installed.splice(index, 1)[0];
            highlight.push(walletToPush);
          }
        });
      });

      // highlight.push(...filteredAdapters.installed.slice(0, 1));
      console.log(highlight);
      console.log(filteredAdapters.installed);
      const others = Object.values(rest)
        .flat()
        .sort((a, b) => PRIORITISE[a.readyState] - PRIORITISE[b.readyState])
        .sort(sortByPrecedence(walletPrecedence || []));
      others.unshift(...filteredAdapters.installed.slice(0, filteredAdapters.installed.length));

      return { recommendedWallets, highlightedBy: 'Installed', highlight, others };
    }

    if (filteredAdapters.loadable.length === 0) {
      return {
        recommendedWallets: filteredAdapters.recommendedWallets,
        highlightedBy: 'Onboarding',
        highlight: [],
        others: [],
      };
    }

    const { recommendedWallets, top3, ...rest } = filteredAdapters;
    const others = Object.values(rest)
      .flat()
      .sort((a, b) => PRIORITISE[a.readyState] - PRIORITISE[b.readyState])
      .sort(sortByPrecedence(walletPrecedence || []));
    return { recommendedWallets, highlightedBy: 'TopWallet', highlight: top3, others };
  }, [wallets, previouslyConnected]);

  const contentRef = useRef<HTMLDivElement>(null);
  useOutsideClick(contentRef, onClose);

  return (
    <div
      ref={contentRef}
      css={[
        tw`max-w-md w-full relative flex flex-col overflow-hidden rounded-xl max-h-[90vh] lg:max-h-[600px] transition-height duration-500 ease-in-out`,
        styles.container[theme],
      ]}
    >
      <Header onClose={onClose} />
      <ListOfWallets list={list} onToggle={onToggle} isOpen={isOpen} />
    </div>
  );
};

export default SfmUnifiedWalletModal;
