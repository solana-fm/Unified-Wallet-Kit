import { BaseSignerWalletAdapter, WalletReadyState, WalletNotConnectedError, isVersionedTransaction } from '@solana/wallet-adapter-base';
export * from '@solana/wallet-adapter-base';
import { useWallet, useLocalStorage, WalletProvider } from '@solana/wallet-adapter-react';
export * from '@solana/wallet-adapter-react';
import React, { useEffect, useContext, useMemo, useReducer, useRef, useState, useCallback, createContext } from 'react';
import { SolanaMobileWalletAdapter, createDefaultAddressSelector, createDefaultAuthorizationResultCache, createDefaultWalletNotFoundHandler, SolanaMobileWalletAdapterWalletName } from '@solana-mobile/wallet-adapter-mobile';
import { jsx } from '@emotion/react';
import 'decimal.js';
import { PublicKey } from '@solana/web3.js';
import '@solana/spl-token';

const PreviouslyConnectedContext = /*#__PURE__*/React.createContext([]);
const PreviouslyConnectedProvider = ({
  children
}) => {
  const {
    wallet,
    connected
  } = useWallet();
  const [previouslyConnected, setPreviouslyConnected] = useLocalStorage(`open-wallet-previously-connected`, []);
  useEffect(() => {
    if (connected && wallet) {
      // make sure the most recently connected wallet is first
      const combined = new Set([wallet.adapter.name, ...previouslyConnected]);
      setPreviouslyConnected([...combined]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, connected]);
  return jsx(PreviouslyConnectedContext.Provider, {
    value: previouslyConnected
  }, children);
};
const usePreviouslyConnected = () => {
  return useContext(PreviouslyConnectedContext);
};

class HardcodedWalletStandardAdapter extends BaseSignerWalletAdapter {
  name = '';
  url = '';
  icon = '';
  supportedTransactionVersions = new Set(['legacy', 0]);

  /**
   * Storing a keypair locally like this is not safe because any application using this adapter could retrieve the
   * secret key, and because the keypair will be lost any time the wallet is disconnected or the window is refreshed.
   */
  _keypair = null;
  constructor({
    name,
    url,
    icon
  }) {
    super();
    this.name = name;
    this.url = url;
    this.icon = icon;
  }
  get connecting() {
    return false;
  }
  get publicKey() {
    return this._keypair && this._keypair.publicKey;
  }
  get readyState() {
    return WalletReadyState.NotDetected;
  }
  async connect() {
    throw new WalletNotConnectedError();
  }
  async disconnect() {
    this._keypair = null;
    this.emit('disconnect');
  }
  async signTransaction(transaction) {
    if (!this._keypair) throw new WalletNotConnectedError();
    if (isVersionedTransaction(transaction)) {
      transaction.sign([this._keypair]);
    } else {
      transaction.partialSign(this._keypair);
    }
    return transaction;
  }
}

const noop = (error, adapter) => {
  console.log({
    error,
    adapter
  });
};
const WalletConnectionProvider = ({
  wallets: passedWallets,
  config,
  children
}) => {
  const wallets = useMemo(() => {
    return [new SolanaMobileWalletAdapter({
      addressSelector: createDefaultAddressSelector(),
      appIdentity: {
        uri: config.metadata.url,
        // TODO: Icon support looks flaky
        icon: '',
        name: config.metadata.name
      },
      authorizationResultCache: createDefaultAuthorizationResultCache(),
      cluster: config.env,
      // TODO: Check if MWA still redirects aggressively.
      onWalletNotFound: createDefaultWalletNotFoundHandler()
    }), ...passedWallets, ...(config.hardcodedWallets || []).map(item => new HardcodedWalletStandardAdapter(item))];
  }, []);
  return jsx(WalletProvider, {
    wallets: wallets,
    autoConnect: config.autoConnect,
    onError: noop
  }, jsx(PreviouslyConnectedProvider, null, children));
};
var WalletConnectionProvider$1 = WalletConnectionProvider;

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var toggleReducer = function (state, nextValue) {
    return typeof nextValue === 'boolean' ? nextValue : !state;
};
var useToggle = function (initialValue) {
    return useReducer(toggleReducer, initialValue);
};
var useToggle$1 = useToggle;

function usePrevious(state) {
    var ref = useRef();
    useEffect(function () {
        ref.current = state;
    });
    return ref.current;
}

const userLocale = typeof window !== 'undefined' ? navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language : 'en-US';
const numberFormatter = new Intl.NumberFormat(userLocale, {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 9
});
const formatNumber = {
  format: (val, precision) => {
    if (!val && val !== 0) {
      return '--';
    }
    if (precision !== undefined) {
      return val.toFixed(precision);
    } else {
      return numberFormatter.format(val);
    }
  }
};
function shortenAddress(address, chars = 4) {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

const isMobile = () => typeof window !== 'undefined' && screen && screen.width <= 480;
formatNumber.format(1.1).substring(1, 2);
function useOutsideClick(ref, handler) {
  useEffect(() => {
    const listener = event => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mouseup', listener);
    return () => {
      document.removeEventListener('mouseup', listener);
    };
  }, [ref, handler]);
}

const ModalDialog = ({
  open,
  onClose: onCloseFunc,
  children
}) => {
  const ref = useRef(null);
  const [isLocalOpen, setIsLocalOpen] = useState(false);
  useEffect(() => {
    if (!isLocalOpen) setIsLocalOpen(open);
    if (isLocalOpen) {
      setTimeout(() => {
        setIsLocalOpen(open);
      }, 150);
    }
  }, [open]);
  const onClose = useCallback(() => {
    ref.current?.close();
    onCloseFunc();
  }, [onCloseFunc, ref]);
  useEffect(() => {
    if (ref.current) {
      if (isLocalOpen) {
        if (!ref.current.open) {
          ref.current.showModal();
        }
      } else {
        ref.current.close();
      }
    }

    // Make sure when `ESC` (browser default) is clicked, we close the dialog
    if (isLocalOpen) {
      const refNode = ref.current;
      refNode?.addEventListener('close', onClose);
      return () => {
        refNode?.removeEventListener('close', onClose);
      };
    }
  }, [onClose, isLocalOpen]);
  if (!isLocalOpen) return null;
  return jsx("dialog", {
    role: "dialog",
    "aria-modal": "true",
    css: ["left:0px;top:0px;z-index:50;display:flex;height:100%;width:100%;@keyframes fade-in{0%{opacity:0.2;}100%{opacity:1;}}animation:fade-in 0.15s ease-in-out;cursor:auto;align-items:center;justify-content:center;background-color:rgb(0 0 0 / 0.25);--tw-backdrop-blur:blur(4px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);", isLocalOpen && !open && {
      "@keyframes fade-out": {
        "0%": {
          "opacity": "1"
        },
        "100%": {
          "opacity": "0"
        }
      },
      "animation": "fade-out 0.15s ease-out",
      "opacity": "0"
    }, process.env.NODE_ENV === "production" ? "" : ";label:ModalDialog;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFnRE0iLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IFByb3BzV2l0aENoaWxkcmVuLCB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHcgZnJvbSAndHdpbi5tYWNybyc7XG5cbmNvbnN0IE1vZGFsRGlhbG9nOiBSZWFjdC5GQzx7IG9wZW46IGJvb2xlYW47IG9uQ2xvc2U6ICgpID0+IHZvaWQgfSAmIFByb3BzV2l0aENoaWxkcmVuPiA9ICh7IG9wZW4sIG9uQ2xvc2U6IG9uQ2xvc2VGdW5jLCBjaGlsZHJlbiB9KSA9PiB7XG4gIGNvbnN0IHJlZiA9IHVzZVJlZjxIVE1MRGlhbG9nRWxlbWVudD4obnVsbCk7XG5cbiAgY29uc3QgW2lzTG9jYWxPcGVuLCBzZXRJc0xvY2FsT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFpc0xvY2FsT3Blbikgc2V0SXNMb2NhbE9wZW4ob3Blbik7XG5cbiAgICBpZiAoaXNMb2NhbE9wZW4pIHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBzZXRJc0xvY2FsT3BlbihvcGVuKTtcbiAgICAgIH0sIDE1MCk7XG4gICAgfVxuICB9LCBbb3Blbl0pXG5cbiAgY29uc3Qgb25DbG9zZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICByZWYuY3VycmVudD8uY2xvc2UoKTtcbiAgICBvbkNsb3NlRnVuYygpO1xuICB9LCBbb25DbG9zZUZ1bmMsIHJlZl0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHJlZi5jdXJyZW50KSB7XG4gICAgICBpZiAoaXNMb2NhbE9wZW4pIHtcbiAgICAgICAgaWYgKCFyZWYuY3VycmVudC5vcGVuKSB7XG4gICAgICAgICAgcmVmLmN1cnJlbnQuc2hvd01vZGFsKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZi5jdXJyZW50LmNsb3NlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTWFrZSBzdXJlIHdoZW4gYEVTQ2AgKGJyb3dzZXIgZGVmYXVsdCkgaXMgY2xpY2tlZCwgd2UgY2xvc2UgdGhlIGRpYWxvZ1xuICAgIGlmIChpc0xvY2FsT3Blbikge1xuICAgICAgY29uc3QgcmVmTm9kZSA9IHJlZi5jdXJyZW50O1xuICAgICAgcmVmTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCBvbkNsb3NlKTtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHJlZk5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Nsb3NlJywgb25DbG9zZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSwgW29uQ2xvc2UsIGlzTG9jYWxPcGVuXSk7XG5cbiAgaWYgKCFpc0xvY2FsT3BlbikgcmV0dXJuIG51bGw7XG4gIHJldHVybiAoXG4gICAgPGRpYWxvZ1xuICAgICAgcm9sZT1cImRpYWxvZ1wiXG4gICAgICBhcmlhLW1vZGFsPVwidHJ1ZVwiXG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgdG9wLTAgbGVmdC0wIGgtZnVsbCB3LWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2svMjUgYmFja2Ryb3AtYmx1ci1zbSBhbmltYXRlLWZhZGUtaW4gY3Vyc29yLWF1dG8gei01MGAsXG4gICAgICAgIGlzTG9jYWxPcGVuICYmICFvcGVuICYmIHR3YGFuaW1hdGUtZmFkZS1vdXQgb3BhY2l0eS0wYCxcbiAgICAgIF19XG4gICAgICByZWY9e3JlZn1cbiAgICA+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgPC9kaWFsb2c+XG4gIClcbn1cblxuZXhwb3J0IGRlZmF1bHQgTW9kYWxEaWFsb2ciXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:ModalDialog;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFnRE0iLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IFByb3BzV2l0aENoaWxkcmVuLCB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHcgZnJvbSAndHdpbi5tYWNybyc7XG5cbmNvbnN0IE1vZGFsRGlhbG9nOiBSZWFjdC5GQzx7IG9wZW46IGJvb2xlYW47IG9uQ2xvc2U6ICgpID0+IHZvaWQgfSAmIFByb3BzV2l0aENoaWxkcmVuPiA9ICh7IG9wZW4sIG9uQ2xvc2U6IG9uQ2xvc2VGdW5jLCBjaGlsZHJlbiB9KSA9PiB7XG4gIGNvbnN0IHJlZiA9IHVzZVJlZjxIVE1MRGlhbG9nRWxlbWVudD4obnVsbCk7XG5cbiAgY29uc3QgW2lzTG9jYWxPcGVuLCBzZXRJc0xvY2FsT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFpc0xvY2FsT3Blbikgc2V0SXNMb2NhbE9wZW4ob3Blbik7XG5cbiAgICBpZiAoaXNMb2NhbE9wZW4pIHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBzZXRJc0xvY2FsT3BlbihvcGVuKTtcbiAgICAgIH0sIDE1MCk7XG4gICAgfVxuICB9LCBbb3Blbl0pXG5cbiAgY29uc3Qgb25DbG9zZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICByZWYuY3VycmVudD8uY2xvc2UoKTtcbiAgICBvbkNsb3NlRnVuYygpO1xuICB9LCBbb25DbG9zZUZ1bmMsIHJlZl0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHJlZi5jdXJyZW50KSB7XG4gICAgICBpZiAoaXNMb2NhbE9wZW4pIHtcbiAgICAgICAgaWYgKCFyZWYuY3VycmVudC5vcGVuKSB7XG4gICAgICAgICAgcmVmLmN1cnJlbnQuc2hvd01vZGFsKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZi5jdXJyZW50LmNsb3NlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTWFrZSBzdXJlIHdoZW4gYEVTQ2AgKGJyb3dzZXIgZGVmYXVsdCkgaXMgY2xpY2tlZCwgd2UgY2xvc2UgdGhlIGRpYWxvZ1xuICAgIGlmIChpc0xvY2FsT3Blbikge1xuICAgICAgY29uc3QgcmVmTm9kZSA9IHJlZi5jdXJyZW50O1xuICAgICAgcmVmTm9kZT8uYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCBvbkNsb3NlKTtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHJlZk5vZGU/LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Nsb3NlJywgb25DbG9zZSk7XG4gICAgICB9O1xuICAgIH1cbiAgfSwgW29uQ2xvc2UsIGlzTG9jYWxPcGVuXSk7XG5cbiAgaWYgKCFpc0xvY2FsT3BlbikgcmV0dXJuIG51bGw7XG4gIHJldHVybiAoXG4gICAgPGRpYWxvZ1xuICAgICAgcm9sZT1cImRpYWxvZ1wiXG4gICAgICBhcmlhLW1vZGFsPVwidHJ1ZVwiXG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgdG9wLTAgbGVmdC0wIGgtZnVsbCB3LWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2svMjUgYmFja2Ryb3AtYmx1ci1zbSBhbmltYXRlLWZhZGUtaW4gY3Vyc29yLWF1dG8gei01MGAsXG4gICAgICAgIGlzTG9jYWxPcGVuICYmICFvcGVuICYmIHR3YGFuaW1hdGUtZmFkZS1vdXQgb3BhY2l0eS0wYCxcbiAgICAgIF19XG4gICAgICByZWY9e3JlZn1cbiAgICA+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgPC9kaWFsb2c+XG4gIClcbn1cblxuZXhwb3J0IGRlZmF1bHQgTW9kYWxEaWFsb2ciXX0= */"],
    ref: ref
  }, children);
};
var ModalDialog$1 = ModalDialog;

const UnknownIconSVG = ({
  width = 24,
  height = 24
}) => {
  return jsx("svg", {
    width: width,
    height: height,
    viewBox: "0 0 24 24",
    fill: "inherit",
    xmlns: "http://www.w3.org/2000/svg"
  }, jsx("path", {
    d: "M12 0C18.6271 0 24 5.37288 24 12C24 18.6271 18.6269 24 12 24C5.37312 24 0 18.6286 0 12C0 5.37144 5.37216 0 12 0Z",
    fill: "#23C1AA"
  }), jsx("path", {
    d: "M10.79 14.55H12.89V14.355C12.89 13.925 13.01 13.55 13.25 13.23C13.49 12.91 13.765 12.605 14.075 12.315C14.315 12.085 14.545 11.85 14.765 11.61C14.985 11.36 15.165 11.09 15.305 10.8C15.455 10.5 15.53 10.16 15.53 9.78C15.53 9.25 15.395 8.75 15.125 8.28C14.855 7.8 14.45 7.41 13.91 7.11C13.38 6.8 12.725 6.645 11.945 6.645C11.305 6.645 10.725 6.765 10.205 7.005C9.69504 7.245 9.27504 7.575 8.94504 7.995C8.62504 8.415 8.42004 8.905 8.33004 9.465L10.415 9.99C10.475 9.61 10.64 9.31 10.91 9.09C11.19 8.86 11.515 8.745 11.885 8.745C12.315 8.745 12.64 8.85 12.86 9.06C13.09 9.26 13.205 9.52 13.205 9.84C13.205 10.15 13.09 10.425 12.86 10.665C12.63 10.895 12.37 11.155 12.08 11.445C11.77 11.765 11.475 12.14 11.195 12.57C10.925 13 10.79 13.545 10.79 14.205V14.55ZM10.73 18H12.98V15.75H10.73V18Z",
    fill: "white"
  }));
};
var UnknownIconSVG$1 = UnknownIconSVG;

const MWA_NOT_FOUND_ERROR = 'MWA_NOT_FOUND_ERROR';
const UnifiedWalletContext = /*#__PURE__*/createContext({
  walletPrecedence: [],
  handleConnectClick: async (event, wallet) => {},
  showModal: false,
  setShowModal: showModal => {},
  walletlistExplanation: undefined,
  theme: 'light',
  walletAttachments: undefined
});

// Copied from @solana/wallet-adapter-react
function constructMissingProviderErrorMessage(action, valueName) {
  return 'You have tried to ' + ` ${action} "${valueName}"` + ' on a WalletContext without providing one.' + ' Make sure to render a WalletProvider' + ' as an ancestor of the component that uses ' + 'WalletContext';
}
const UNIFIED_WALLET_VALUE_DEFAULT_CONTEXT = {
  autoConnect: false,
  connecting: false,
  connected: false,
  disconnecting: false,
  select(_name) {
    console.error(constructMissingProviderErrorMessage('get', 'select'));
  },
  connect() {
    return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'connect')));
  },
  disconnect() {
    return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'disconnect')));
  },
  sendTransaction(_transaction, _connection, _options) {
    return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'sendTransaction')));
  },
  signTransaction(_transaction) {
    return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signTransaction')));
  },
  signAllTransactions(_transaction) {
    return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signAllTransactions')));
  },
  signMessage(_message) {
    return Promise.reject(console.error(constructMissingProviderErrorMessage('get', 'signMessage')));
  }
};
const UnifiedWalletValueContext = /*#__PURE__*/createContext(UNIFIED_WALLET_VALUE_DEFAULT_CONTEXT);

// Interal context for use within the library
const useUnifiedWalletContext = () => {
  return useContext(UnifiedWalletContext);
};
const useUnifiedWallet = () => {
  return useContext(UnifiedWalletValueContext);
};

// TODO: Depending on language requirement, we might need a library that supports pluralization
const i18n = {
  [`Connecting...`]: {
    zh: `连接中...`,
    vi: `Đang kết nối...`,
    fr: `Connexion...`,
    ja: `接続中...`,
    id: `Sedang menghubungkan...`,
    ru: `Подключение...`
  },
  [`Connect Wallet`]: {
    zh: `连接钱包`,
    vi: `Kết nối ví`,
    fr: `Connecter le portefeuille`,
    ja: `ウォレットに接続する`,
    id: `Hubungkan dompet`,
    ru: `Подключить кошелек`
  },
  [`Connect`]: {
    zh: `连接`,
    vi: `Kết nối`,
    fr: `Connecter`,
    ja: `接続`,
    id: `Hubungkan`,
    ru: `Подключить`
  },
  [`You need to connect a Solana wallet.`]: {
    zh: `您需要连接一个 Solana 钱包。`,
    vi: `Bạn cần kết nối ví Solana.`,
    fr: `Vous devez connecter un portefeuille Solana.`,
    ja: `Solanaウォレットを接続する必要があります。`,
    id: `Anda perlu menghubungkan dompet Solana.`,
    ru: `Вам нужно подключить кошелек Solana.`
  },
  [`New here?`]: {
    zh: `新来的？`,
    vi: `Mới đến?`,
    fr: `Nouveau ici?`,
    ja: `初めてですか？`,
    id: `Baru disini?`,
    ru: `Новичок?`
  },
  [`Welcome to SolanaFM! Create a crypto wallet to get started!`]: {
    zh: `欢迎来到 SolanaFM！创建一个加密钱包吧！`,
    vi: `Chào mừng đến với DeFi! Tạo ví crypto để bắt đầu!`,
    fr: `Bienvenue dans DeFi! Créez un portefeuille crypto pour commencer!`,
    ja: `DeFiへようこそ！暗号ウォレットを作成して始めましょう！`,
    id: `Selamat datang di DeFi! Buat dompet crypto untuk memulai!`,
    ru: `Добро пожаловать в DeFi! Создайте криптокошелек, чтобы начать!`
  },
  [`Get Started`]: {
    zh: `开始`,
    vi: `Bắt đầu`,
    fr: `Commencer`,
    ja: `始める`,
    id: `Mulai`,
    ru: `Начать`
  },
  [`Popular wallets to get started`]: {
    zh: `热门钱包`,
    vi: `Ví phổ biến để bắt đầu`,
    fr: `Portefeuilles populaires pour commencer`,
    ja: `始める人気のウォレット`,
    id: `Dompet populer untuk memulai`,
    ru: `Популярные кошельки для начала`
  },
  [`More wallets`]: {
    zh: `更多钱包`,
    vi: `Thêm ví`,
    fr: `Plus de portefeuilles`,
    ja: `その他のウォレット`,
    id: `Dompet lainnya`,
    ru: `Другие кошельки`
  },
  [`Once installed, refresh this page`]: {
    zh: `安装后，请刷新此页面`,
    vi: `Sau khi cài đặt, làm mới trang này`,
    fr: `Une fois installé, rafraîchissez cette page`,
    ja: `インストールしたら、このページを更新してください`,
    id: `Setelah diinstal, segarkan halaman ini`,
    ru: `После установки обновите эту страницу`
  },
  [`Go back`]: {
    zh: `返回`,
    vi: `Quay lại`,
    fr: `Retourner`,
    ja: `戻る`,
    id: `Kembali`,
    ru: `Назад`
  },
  [`Recently used`]: {
    zh: `最近使用`,
    vi: `Đã sử dụng gần đây`,
    fr: `Utilisé récemment`,
    ja: `最近使用した`,
    id: `Baru saja digunakan`,
    ru: `Недавно использованные`
  },
  [`Installed wallets`]: {
    zh: `已安装钱包`,
    vi: `Các ví đã cài đặt`,
    fr: `Portefeuilles installés`,
    ja: `インストール済みのウォレット`,
    id: `Dompet yang diinstal`,
    ru: `Установленные кошельки`
  },
  [`Popular wallets`]: {
    zh: `热门钱包`,
    vi: `Ví phổ biến`,
    fr: `Portefeuilles populaires`,
    ja: `人気のウォレット`,
    id: `Dompet populer`,
    ru: `Популярные кошельки`
  },
  [`Recommended wallets`]: {
    zh: `热门钱包`,
    vi: `Ví phổ biến`,
    fr: `Portefeuilles populaires`,
    ja: `人気のウォレット`,
    id: `Dompet populer`,
    ru: `Популярные кошельки`
  },
  [`Can't find your wallet?`]: {
    zh: `找不到您的钱包？`,
    vi: `Không tìm thấy ví của bạn?`,
    fr: `Vous ne trouvez pas votre portefeuille?`,
    ja: `ウォレットが見つかりませんか？`,
    id: `Tidak dapat menemukan dompet Anda?`,
    ru: `Не можете найти свой кошелек?`
  },
  [`I don't have a wallet`]: {
    zh: `我没有钱包`,
    vi: `Tôi không có ví`,
    fr: `Je n'ai pas de portefeuille`,
    ja: `私はウォレットを持っていません`,
    id: `Saya tidak punya dompet`,
    ru: `У меня нет кошелька`
  },
  [`Have you installed`]: {
    zh: `您是否已安装`,
    vi: `Bạn đã cài đặt`,
    fr: `Avez-vous installé`,
    ja: `インストールしましたか`,
    id: `Apakah Anda sudah menginstal`,
    ru: `Вы установили`
  },
  [`Install`]: {
    zh: `安装`,
    vi: `Cài đặt`,
    fr: `Installer`,
    ja: `インストール`,
    id: `Memasang`,
    ru: `Установить`
  },
  [`On mobile:`]: {
    zh: `在手机上：`,
    vi: `Trên điện thoại:`,
    fr: `Sur mobile:`,
    ja: `モバイル：`,
    id: `Di ponsel:`,
    ru: `На мобильном:`
  },
  [`You should open the app instead`]: {
    zh: `您应该打开应用程序`,
    vi: `Bạn nên mở ứng dụng thay vì`,
    fr: `Vous devriez ouvrir l'application à la place`,
    ja: `代わりにアプリを開く必要があります`,
    id: `Anda harus membuka aplikasi bukannya`,
    ru: `Вместо этого вы должны открыть приложение`
  },
  [`On desktop:`]: {
    zh: `在桌面上：`,
    vi: `Trên máy tính để bàn:`,
    fr: `Sur ordinateur:`,
    ja: `デスクトップ：`,
    id: `Di desktop:`,
    ru: `На рабочем столе:`
  },
  [`Install and refresh the page`]: {
    zh: `安装并刷新页面`,
    vi: `Cài đặt và làm mới trang`,
    fr: `Installez et actualisez la page`,
    ja: `インストールしてページを更新する`,
    id: `Pasang dan segarkan halaman`,
    ru: `Установите и обновите страницу`
  }
};

const TranslationContext = /*#__PURE__*/createContext({
  lang: 'en',
  setLang: () => {},
  t: key => key
});
const TranslationProvider = ({
  lang: forceLang,
  children
}) => {
  const [lang, setLang] = useState('en');
  useEffect(() => {
    if (forceLang) {
      setLang(forceLang);
    }
  }, [forceLang]);
  const t = useCallback(key => {
    if (lang === 'en') {
      return key;
    }
    const found = i18n[key] && i18n[key][lang];
    return found ? found : 'not found';
  }, [lang]);
  return jsx(TranslationContext.Provider, {
    value: {
      lang,
      setLang,
      t
    }
  }, children);
};
const useTranslation = () => {
  const props = useContext(TranslationContext);
  return props;
};

function _EMOTION_STRINGIFIED_CSS_ERROR__$5() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const styles$4 = {
  container: {
    light: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(249 250 251 / var(--tw-bg-opacity))",
      ":hover": {
        "borderColor": "rgb(0 0 0 / 0.1)",
        "--tw-shadow": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "--tw-shadow-colored": "0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color)",
        "boxShadow": "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)"
      }
    }],
    dark: [{
      ":hover": {
        "backgroundColor": "rgb(255 255 255 / 0.1)",
        "--tw-shadow": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        "--tw-shadow-colored": "0 25px 50px -12px var(--tw-shadow-color)",
        "boxShadow": "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)"
      }
    }],
    jupiter: [{
      ":hover": {
        "backgroundColor": "rgb(255 255 255 / 0.1)",
        "--tw-shadow": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        "--tw-shadow-colored": "0 25px 50px -12px var(--tw-shadow-color)",
        "boxShadow": "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)"
      }
    }]
  }
};
var _ref$5 = process.env.NODE_ENV === "production" ? {
  name: "k19fg7",
  styles: "object-fit:contain"
} : {
  name: "d74yxu-WalletIcon",
  styles: "object-fit:contain;label:WalletIcon;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$5
};
const WalletIcon = ({
  wallet,
  width = 24,
  height = 24
}) => {
  const [hasError, setHasError] = React.useState(false);
  const onError = useCallback(() => setHasError(true), []);
  if (wallet && wallet.icon && !hasError) {
    return jsx("div", {
      style: {
        minWidth: width,
        minHeight: height
      }
    }, jsx("img", {
      width: width,
      height: height,
      src: wallet.icon,
      alt: `${wallet.name} icon`,
      css: _ref$5,
      onError: onError
    }));
  } else {
    return jsx("div", {
      style: {
        minWidth: width,
        minHeight: height
      }
    }, jsx(UnknownIconSVG$1, {
      width: width,
      height: height
    }));
  }
};
var _ref2$5 = process.env.NODE_ENV === "production" ? {
  name: "18g8lgp",
  styles: "overflow:hidden;text-overflow:ellipsis;font-size:0.75rem;line-height:1rem;font-weight:600"
} : {
  name: "1knvv8w-WalletListItem",
  styles: "overflow:hidden;text-overflow:ellipsis;font-size:0.75rem;line-height:1rem;font-weight:600;label:WalletListItem;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$5
};
const WalletListItem = ({
  handleClick,
  wallet
}) => {
  const {
    theme
  } = useUnifiedWalletContext();
  const {
    t
  } = useTranslation();
  const adapterName = useMemo(() => {
    if (!wallet) return '';
    if (wallet.name === SolanaMobileWalletAdapterWalletName) return t(`Mobile`);
    return wallet.name;
  }, [wallet?.name]);
  return jsx("li", {
    onClick: handleClick,
    css: ["display:flex;cursor:pointer;align-items:center;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(1.25rem * var(--tw-space-x-reverse));margin-left:calc(1.25rem * calc(1 - var(--tw-space-x-reverse)));}border-radius:0.5rem;border-width:1px;border-color:rgb(255 255 255 / 0.1);padding-left:1.25rem;padding-right:1.25rem;padding-top:1rem;padding-bottom:1rem;transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;:hover{background-color:rgb(255 255 255 / 0.1);--tw-shadow:0 25px 50px -12px rgb(0 0 0 / 0.25);--tw-shadow-colored:0 25px 50px -12px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);--tw-backdrop-blur:blur(24px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);}", styles$4.container[theme], process.env.NODE_ENV === "production" ? "" : ";label:WalletListItem;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIldhbGxldExpc3RJdGVtLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1RU0iLCJmaWxlIjoiV2FsbGV0TGlzdEl0ZW0udHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgRGV0YWlsZWRIVE1MUHJvcHMsIEZDLCBJbWdIVE1MQXR0cmlidXRlcywgTW91c2VFdmVudEhhbmRsZXIsIHVzZUNhbGxiYWNrLCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0ICd0d2luLm1hY3JvJztcblxuaW1wb3J0IFVua25vd25JY29uU1ZHIGZyb20gJy4uLy4uL2ljb25zL1Vua25vd25JY29uU1ZHJztcbmltcG9ydCB7IGlzTW9iaWxlIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldEljb25Qcm9wcyBleHRlbmRzIERldGFpbGVkSFRNTFByb3BzPEltZ0hUTUxBdHRyaWJ1dGVzPEhUTUxJbWFnZUVsZW1lbnQ+LCBIVE1MSW1hZ2VFbGVtZW50PiB7XG4gIHdhbGxldDogQWRhcHRlciB8IG51bGw7XG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG59XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGcgaG92ZXI6Ym9yZGVyLWJsYWNrLzEwYF0sXG4gICAgZGFyazogW3R3YGhvdmVyOnNoYWRvdy0yeGwgaG92ZXI6Ymctd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IFdhbGxldEljb246IEZDPFdhbGxldEljb25Qcm9wcz4gPSAoeyB3YWxsZXQsIHdpZHRoID0gMjQsIGhlaWdodCA9IDI0IH0pID0+IHtcbiAgY29uc3QgW2hhc0Vycm9yLCBzZXRIYXNFcnJvcl0gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG5cbiAgY29uc3Qgb25FcnJvciA9IHVzZUNhbGxiYWNrKCgpID0+IHNldEhhc0Vycm9yKHRydWUpLCBbXSk7XG5cbiAgaWYgKHdhbGxldCAmJiB3YWxsZXQuaWNvbiAmJiAhaGFzRXJyb3IpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBzdHlsZT17eyBtaW5XaWR0aDogd2lkdGgsIG1pbkhlaWdodDogaGVpZ2h0IH19PlxuICAgICAgICB7LyogLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEBuZXh0L25leHQvbm8taW1nLWVsZW1lbnQgKi99XG4gICAgICAgIDxpbWdcbiAgICAgICAgICB3aWR0aD17d2lkdGh9XG4gICAgICAgICAgaGVpZ2h0PXtoZWlnaHR9XG4gICAgICAgICAgc3JjPXt3YWxsZXQuaWNvbn1cbiAgICAgICAgICBhbHQ9e2Ake3dhbGxldC5uYW1lfSBpY29uYH1cbiAgICAgICAgICB0dz1cIm9iamVjdC1jb250YWluXCJcbiAgICAgICAgICBvbkVycm9yPXtvbkVycm9yfVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBzdHlsZT17eyBtaW5XaWR0aDogd2lkdGgsIG1pbkhlaWdodDogaGVpZ2h0IH19PlxuICAgICAgICA8VW5rbm93bkljb25TVkcgd2lkdGg9e3dpZHRofSBoZWlnaHQ9e2hlaWdodH0gLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2FsbGV0TGlzdEl0ZW1Qcm9wcyB7XG4gIGhhbmRsZUNsaWNrOiBNb3VzZUV2ZW50SGFuZGxlcjxIVE1MTElFbGVtZW50PjtcbiAgd2FsbGV0OiBBZGFwdGVyO1xufVxuXG5leHBvcnQgY29uc3QgV2FsbGV0TGlzdEl0ZW0gPSAoeyBoYW5kbGVDbGljaywgd2FsbGV0IH06IFdhbGxldExpc3RJdGVtUHJvcHMpID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIGNvbnN0IGFkYXB0ZXJOYW1lID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKCF3YWxsZXQpIHJldHVybiAnJztcbiAgICBpZiAod2FsbGV0Lm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgcmV0dXJuIHdhbGxldC5uYW1lO1xuICB9LCBbd2FsbGV0Py5uYW1lXSk7XG5cbiAgcmV0dXJuIChcbiAgICA8bGlcbiAgICAgIG9uQ2xpY2s9e2hhbmRsZUNsaWNrfVxuICAgICAgY3NzPXtbXG4gICAgICAgIHR3YGZsZXggaXRlbXMtY2VudGVyIHB4LTUgcHktNCBzcGFjZS14LTUgY3Vyc29yLXBvaW50ZXIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGhvdmVyOmJnLXdoaXRlLzEwIGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgaG92ZXI6c2hhZG93LTJ4bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXt3YWxsZXR9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICkgOiAoXG4gICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17d2FsbGV0fSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICApfVxuICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQteHMgb3ZlcmZsb3ctaGlkZGVuIHRleHQtZWxsaXBzaXNcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgIDwvbGk+XG4gICk7XG59O1xuIl19 */", process.env.NODE_ENV === "production" ? "" : ";label:WalletListItem;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIldhbGxldExpc3RJdGVtLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1RU0iLCJmaWxlIjoiV2FsbGV0TGlzdEl0ZW0udHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgRGV0YWlsZWRIVE1MUHJvcHMsIEZDLCBJbWdIVE1MQXR0cmlidXRlcywgTW91c2VFdmVudEhhbmRsZXIsIHVzZUNhbGxiYWNrLCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0ICd0d2luLm1hY3JvJztcblxuaW1wb3J0IFVua25vd25JY29uU1ZHIGZyb20gJy4uLy4uL2ljb25zL1Vua25vd25JY29uU1ZHJztcbmltcG9ydCB7IGlzTW9iaWxlIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldEljb25Qcm9wcyBleHRlbmRzIERldGFpbGVkSFRNTFByb3BzPEltZ0hUTUxBdHRyaWJ1dGVzPEhUTUxJbWFnZUVsZW1lbnQ+LCBIVE1MSW1hZ2VFbGVtZW50PiB7XG4gIHdhbGxldDogQWRhcHRlciB8IG51bGw7XG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG59XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGcgaG92ZXI6Ym9yZGVyLWJsYWNrLzEwYF0sXG4gICAgZGFyazogW3R3YGhvdmVyOnNoYWRvdy0yeGwgaG92ZXI6Ymctd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IFdhbGxldEljb246IEZDPFdhbGxldEljb25Qcm9wcz4gPSAoeyB3YWxsZXQsIHdpZHRoID0gMjQsIGhlaWdodCA9IDI0IH0pID0+IHtcbiAgY29uc3QgW2hhc0Vycm9yLCBzZXRIYXNFcnJvcl0gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG5cbiAgY29uc3Qgb25FcnJvciA9IHVzZUNhbGxiYWNrKCgpID0+IHNldEhhc0Vycm9yKHRydWUpLCBbXSk7XG5cbiAgaWYgKHdhbGxldCAmJiB3YWxsZXQuaWNvbiAmJiAhaGFzRXJyb3IpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBzdHlsZT17eyBtaW5XaWR0aDogd2lkdGgsIG1pbkhlaWdodDogaGVpZ2h0IH19PlxuICAgICAgICB7LyogLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEBuZXh0L25leHQvbm8taW1nLWVsZW1lbnQgKi99XG4gICAgICAgIDxpbWdcbiAgICAgICAgICB3aWR0aD17d2lkdGh9XG4gICAgICAgICAgaGVpZ2h0PXtoZWlnaHR9XG4gICAgICAgICAgc3JjPXt3YWxsZXQuaWNvbn1cbiAgICAgICAgICBhbHQ9e2Ake3dhbGxldC5uYW1lfSBpY29uYH1cbiAgICAgICAgICB0dz1cIm9iamVjdC1jb250YWluXCJcbiAgICAgICAgICBvbkVycm9yPXtvbkVycm9yfVxuICAgICAgICAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBzdHlsZT17eyBtaW5XaWR0aDogd2lkdGgsIG1pbkhlaWdodDogaGVpZ2h0IH19PlxuICAgICAgICA8VW5rbm93bkljb25TVkcgd2lkdGg9e3dpZHRofSBoZWlnaHQ9e2hlaWdodH0gLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2FsbGV0TGlzdEl0ZW1Qcm9wcyB7XG4gIGhhbmRsZUNsaWNrOiBNb3VzZUV2ZW50SGFuZGxlcjxIVE1MTElFbGVtZW50PjtcbiAgd2FsbGV0OiBBZGFwdGVyO1xufVxuXG5leHBvcnQgY29uc3QgV2FsbGV0TGlzdEl0ZW0gPSAoeyBoYW5kbGVDbGljaywgd2FsbGV0IH06IFdhbGxldExpc3RJdGVtUHJvcHMpID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIGNvbnN0IGFkYXB0ZXJOYW1lID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKCF3YWxsZXQpIHJldHVybiAnJztcbiAgICBpZiAod2FsbGV0Lm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgcmV0dXJuIHdhbGxldC5uYW1lO1xuICB9LCBbd2FsbGV0Py5uYW1lXSk7XG5cbiAgcmV0dXJuIChcbiAgICA8bGlcbiAgICAgIG9uQ2xpY2s9e2hhbmRsZUNsaWNrfVxuICAgICAgY3NzPXtbXG4gICAgICAgIHR3YGZsZXggaXRlbXMtY2VudGVyIHB4LTUgcHktNCBzcGFjZS14LTUgY3Vyc29yLXBvaW50ZXIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGhvdmVyOmJnLXdoaXRlLzEwIGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgaG92ZXI6c2hhZG93LTJ4bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXt3YWxsZXR9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICkgOiAoXG4gICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17d2FsbGV0fSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICApfVxuICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQteHMgb3ZlcmZsb3ctaGlkZGVuIHRleHQtZWxsaXBzaXNcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgIDwvbGk+XG4gICk7XG59O1xuIl19 */"]
  }, isMobile() ? jsx(WalletIcon, {
    wallet: wallet,
    width: 24,
    height: 24
  }) : jsx(WalletIcon, {
    wallet: wallet,
    width: 30,
    height: 30
  }), jsx("span", {
    css: _ref2$5
  }, adapterName));
};

const Collapse = ({
  children,
  className = '',
  height,
  maxHeight,
  expanded
}) => {
  const [localHeight, setLocalHeight] = useState(height);
  useEffect(() => {
    if (expanded) setLocalHeight(maxHeight);else setLocalHeight(height);
  }, [height, maxHeight, expanded]);
  const animationClass = expanded ? {
    "@keyframes fade-in": {
      "0%": {
        "opacity": "0.2"
      },
      "100%": {
        "opacity": "1"
      }
    },
    "animation": "fade-in 0.15s ease-in-out"
  } : {
    "@keyframes fade-out": {
      "0%": {
        "opacity": "1"
      },
      "100%": {
        "opacity": "0"
      }
    },
    "animation": "fade-out 0.15s ease-out"
  };
  return jsx("div", {
    css: ["overflow:hidden;transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:200ms;", animationClass, process.env.NODE_ENV === "production" ? "" : ";label:Collapse;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1Qk0iLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICd0d2luLm1hY3JvJztcbmltcG9ydCBSZWFjdCwgeyBIVE1MQXR0cmlidXRlcywgUHJvcHNXaXRoQ2hpbGRyZW4sIHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHcgZnJvbSAndHdpbi5tYWNybyc7XG5cbmNvbnN0IENvbGxhcHNlOiBSZWFjdC5GQzxcbiAgUHJvcHNXaXRoQ2hpbGRyZW48e1xuICAgIGNsYXNzTmFtZT86IEhUTUxBdHRyaWJ1dGVzPEhUTUxEaXZFbGVtZW50PlsnY2xhc3NOYW1lJ107XG4gICAgaGVpZ2h0OiBzdHJpbmcgfCBudW1iZXI7XG4gICAgbWF4SGVpZ2h0OiBzdHJpbmcgfCBudW1iZXI7XG4gICAgZXhwYW5kZWQ6IGJvb2xlYW47XG4gIH0+XG4+ID0gKHsgY2hpbGRyZW4sIGNsYXNzTmFtZSA9ICcnLCBoZWlnaHQsIG1heEhlaWdodCwgZXhwYW5kZWQgfSkgPT4ge1xuICBjb25zdCBbbG9jYWxIZWlnaHQsIHNldExvY2FsSGVpZ2h0XSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bWJlcj4oaGVpZ2h0KTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChleHBhbmRlZCkgc2V0TG9jYWxIZWlnaHQobWF4SGVpZ2h0KTtcbiAgICBlbHNlIHNldExvY2FsSGVpZ2h0KGhlaWdodCk7XG4gIH0sIFtoZWlnaHQsIG1heEhlaWdodCwgZXhwYW5kZWRdKTtcblxuICBjb25zdCBhbmltYXRpb25DbGFzcyA9IGV4cGFuZGVkID8gdHdgYW5pbWF0ZS1mYWRlLWluYCA6IHR3YGFuaW1hdGUtZmFkZS1vdXRgO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgY3NzPXtbdHdgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMjAwIG92ZXJmbG93LWhpZGRlbmAsIGFuaW1hdGlvbkNsYXNzXX1cbiAgICAgIHN0eWxlPXt7IGhlaWdodDogbG9jYWxIZWlnaHQsIG1heEhlaWdodCB9fVxuICAgID5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IENvbGxhcHNlO1xuIl19 */", process.env.NODE_ENV === "production" ? "" : ";label:Collapse;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1Qk0iLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICd0d2luLm1hY3JvJztcbmltcG9ydCBSZWFjdCwgeyBIVE1MQXR0cmlidXRlcywgUHJvcHNXaXRoQ2hpbGRyZW4sIHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHcgZnJvbSAndHdpbi5tYWNybyc7XG5cbmNvbnN0IENvbGxhcHNlOiBSZWFjdC5GQzxcbiAgUHJvcHNXaXRoQ2hpbGRyZW48e1xuICAgIGNsYXNzTmFtZT86IEhUTUxBdHRyaWJ1dGVzPEhUTUxEaXZFbGVtZW50PlsnY2xhc3NOYW1lJ107XG4gICAgaGVpZ2h0OiBzdHJpbmcgfCBudW1iZXI7XG4gICAgbWF4SGVpZ2h0OiBzdHJpbmcgfCBudW1iZXI7XG4gICAgZXhwYW5kZWQ6IGJvb2xlYW47XG4gIH0+XG4+ID0gKHsgY2hpbGRyZW4sIGNsYXNzTmFtZSA9ICcnLCBoZWlnaHQsIG1heEhlaWdodCwgZXhwYW5kZWQgfSkgPT4ge1xuICBjb25zdCBbbG9jYWxIZWlnaHQsIHNldExvY2FsSGVpZ2h0XSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bWJlcj4oaGVpZ2h0KTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChleHBhbmRlZCkgc2V0TG9jYWxIZWlnaHQobWF4SGVpZ2h0KTtcbiAgICBlbHNlIHNldExvY2FsSGVpZ2h0KGhlaWdodCk7XG4gIH0sIFtoZWlnaHQsIG1heEhlaWdodCwgZXhwYW5kZWRdKTtcblxuICBjb25zdCBhbmltYXRpb25DbGFzcyA9IGV4cGFuZGVkID8gdHdgYW5pbWF0ZS1mYWRlLWluYCA6IHR3YGFuaW1hdGUtZmFkZS1vdXRgO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgY3NzPXtbdHdgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMjAwIG92ZXJmbG93LWhpZGRlbmAsIGFuaW1hdGlvbkNsYXNzXX1cbiAgICAgIHN0eWxlPXt7IGhlaWdodDogbG9jYWxIZWlnaHQsIG1heEhlaWdodCB9fVxuICAgID5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IENvbGxhcHNlO1xuIl19 */"],
    style: {
      height: localHeight,
      maxHeight
    }
  }, children);
};
var Collapse$1 = Collapse;

const ChevronDownIcon = ({
  className = ''
}) => {
  return jsx("svg", {
    className: className,
    width: "10",
    height: "6",
    viewBox: "0 0 10 6",
    fill: "inherit",
    xmlns: "http://www.w3.org/2000/svg"
  }, jsx("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M0.292893 0.292893C0.683416 -0.097631 1.31658 -0.097631 1.7071 0.292893L4.99999 3.58579L8.29288 0.292893C8.6834 -0.0976311 9.31657 -0.0976311 9.70709 0.292893C10.0976 0.683417 10.0976 1.31658 9.70709 1.70711L5.7071 5.70711C5.31657 6.09763 4.68341 6.09763 4.29289 5.70711L0.292893 1.70711C-0.0976309 1.31658 -0.0976309 0.683417 0.292893 0.292893Z",
    fill: "currentColor"
  }));
};
var ChevronDownIcon$1 = ChevronDownIcon;

const ChevronUpIcon = ({
  className = ''
}) => {
  return jsx("svg", {
    className: className,
    width: "10",
    height: "6",
    viewBox: "0 0 10 6",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, jsx("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M0.292893 5.70711C0.683416 6.09763 1.31658 6.09763 1.7071 5.70711L4.99999 2.41421L8.29288 5.70711C8.6834 6.09763 9.31657 6.09763 9.70709 5.70711C10.0976 5.31658 10.0976 4.68342 9.70709 4.29289L5.7071 0.292893C5.31657 -0.097631 4.68341 -0.097631 4.29289 0.292893L0.292893 4.29289C-0.0976309 4.68342 -0.0976309 5.31658 0.292893 5.70711Z",
    fill: "currentColor"
  }));
};
var ChevronUpIcon$1 = ChevronUpIcon;

const CloseIcon = ({
  width = 20,
  height = 20
}) => {
  return jsx("svg", {
    width: width,
    height: height,
    viewBox: "0 0 20 21",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, jsx("path", {
    d: "M2.0336 16.2126L8.2336 10.0126L2.0336 3.81263C1.7961 3.57903 1.66172 3.25951 1.66016 2.92669C1.65938 2.59309 1.79141 2.27357 2.02734 2.03763C2.26328 1.80247 2.5828 1.67045 2.9164 1.67201C3.25 1.67357 3.56874 1.80795 3.80234 2.04623L9.99994 8.24623L16.1999 2.04623C16.4335 1.80795 16.7523 1.67357 17.0859 1.67201C17.4187 1.67045 17.739 1.80248 17.9749 2.03763C18.2109 2.27357 18.3429 2.59309 18.3413 2.92669C18.3406 3.25951 18.2062 3.57903 17.9687 3.81263L11.7663 10.0126L17.9663 16.2126C18.2038 16.4462 18.3382 16.7658 18.3397 17.0986C18.3405 17.4322 18.2085 17.7517 17.9725 17.9876C17.7366 18.2228 17.4171 18.3548 17.0835 18.3533C16.7499 18.3517 16.4311 18.2173 16.1975 17.979L9.99994 11.779L3.79994 17.979C3.31088 18.4611 2.52494 18.4579 2.039 17.9736C1.55384 17.4884 1.54994 16.7025 2.03119 16.2126L2.0336 16.2126Z",
    fill: "currentColor"
  }));
};
var CloseIcon$1 = CloseIcon;

const ExternalIcon = ({
  width = 10,
  height = 10
}) => jsx("svg", {
  width: width,
  height: height,
  viewBox: "0 0 10 10",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, jsx("path", {
  d: "M4 2V3H1.5V8.5H7V6H8V9C8 9.13261 7.94732 9.25979 7.85355 9.35355C7.75979 9.44732 7.63261 9.5 7.5 9.5H1C0.867392 9.5 0.740215 9.44732 0.646447 9.35355C0.552678 9.25979 0.5 9.13261 0.5 9V2.5C0.5 2.36739 0.552678 2.24021 0.646447 2.14645C0.740215 2.05268 0.867392 2 1 2H4ZM9.5 0.5V4.5H8.5V2.2065L4.6035 6.1035L3.8965 5.3965L7.7925 1.5H5.5V0.5H9.5Z",
  fill: "currentColor"
}));
var ExternalIcon$1 = ExternalIcon;

function _EMOTION_STRINGIFIED_CSS_ERROR__$4() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const styles$3 = {
  subtitle: {
    light: [{
      "color": "rgb(0 0 0 / 0.7)"
    }],
    dark: [{
      "color": "rgb(255 255 255 / 0.5)"
    }],
    jupiter: [{
      "color": "rgb(255 255 255 / 0.5)"
    }]
  },
  button: {
    light: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(49 51 59 / var(--tw-bg-opacity))",
      "--tw-text-opacity": "1",
      "color": "rgb(255 255 255 / var(--tw-text-opacity))",
      ":hover": {
        "--tw-bg-opacity": "1",
        "backgroundColor": "rgb(0 0 0 / var(--tw-bg-opacity))"
      }
    }],
    dark: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(49 51 59 / var(--tw-bg-opacity))",
      ":hover": {
        "backgroundColor": "rgb(0 0 0 / 0.3)"
      }
    }],
    jupiter: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(0 0 0 / var(--tw-bg-opacity))",
      ":hover": {
        "backgroundColor": "rgb(0 0 0 / 0.5)"
      }
    }]
  }
};
var _ref$4 = process.env.NODE_ENV === "production" ? {
  name: "1e4wqln",
  styles: "@keyframes fade-in{0%{opacity:0.2;}100%{opacity:1;}}animation:fade-in 0.15s ease-in-out;overflow-y:scroll;transition-duration:500ms"
} : {
  name: "1itopph-NotInstalled",
  styles: "@keyframes fade-in{0%{opacity:0.2;}100%{opacity:1;}}animation:fade-in 0.15s ease-in-out;overflow-y:scroll;transition-duration:500ms;label:NotInstalled;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5vdEluc3RhbGxlZC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBNkJTIiwiZmlsZSI6Ik5vdEluc3RhbGxlZC50c3giLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZGFwdGVyIH0gZnJvbSAnQHNvbGFuYS93YWxsZXQtYWRhcHRlci1iYXNlJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IEV4dGVybmFsSWNvbiBmcm9tICcuLi9pY29ucy9FeHRlcm5hbEljb24nO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay83MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgYnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bIzMxMzMzQl0gdGV4dC13aGl0ZSBob3ZlcjpiZy1ibGFja2BdLFxuICAgIGRhcms6IFt0d2BiZy1bIzMxMzMzQl0gaG92ZXI6YmctYmxhY2svMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctYmxhY2sgaG92ZXI6YmctYmxhY2svNTBgXSxcbiAgfSxcbn07XG5cbmNvbnN0IE5vdEluc3RhbGxlZDogUmVhY3QuRkM8eyBhZGFwdGVyOiBBZGFwdGVyOyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBvbkdvT25ib2FyZGluZzogKCkgPT4gdm9pZCB9PiA9ICh7XG4gIGFkYXB0ZXIsXG4gIG9uQ2xvc2UsXG4gIG9uR29PbmJvYXJkaW5nLFxufSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YGR1cmF0aW9uLTUwMCBhbmltYXRlLWZhZGUtaW4gb3ZlcmZsb3cteS1zY3JvbGxgXX0gY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiPlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHAtNVwiPlxuICAgICAgICA8aW1nIHNyYz17YWRhcHRlci5pY29ufSB3aWR0aD17MTAwfSBoZWlnaHQ9ezEwMH0gLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBIYXZlIHlvdSBpbnN0YWxsZWRgKSArIGAgJHthZGFwdGVyLm5hbWV9P2B9PC9zcGFuPlxuXG4gICAgICAgIDxhXG4gICAgICAgICAgaHJlZj17YWRhcHRlci51cmx9XG4gICAgICAgICAgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiXG4gICAgICAgICAgdGFyZ2V0PVwiX2JsYW5rXCJcbiAgICAgICAgICB0dz1cInRleHQteHMgZmxleCBteS0zIGl0ZW1zLWNlbnRlciBzcGFjZS14LTIgdW5kZXJsaW5lXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAge3QoYEluc3RhbGxgKX0ge2FkYXB0ZXIubmFtZX1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPEV4dGVybmFsSWNvbiAvPlxuICAgICAgICA8L2E+XG5cbiAgICAgICAgPGRpdiB0dz1cIm10LTUgZmxleCB3LWZ1bGwgcHgtMTAgZmxleC1jb2wgaXRlbXMtc3RhcnQganVzdGlmeS1zdGFydCB0ZXh0LXN0YXJ0XCI+XG4gICAgICAgICAgPHAgdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj57dChgT24gbW9iaWxlOmApfTwvcD5cbiAgICAgICAgICA8dWwgdHc9XCJ0ZXh0LXhzIHBsLTggbXQtMiBsaXN0LWRpc2NcIj5cbiAgICAgICAgICAgIDxsaT57dChgWW91IHNob3VsZCBvcGVuIHRoZSBhcHAgaW5zdGVhZGApfTwvbGk+XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiB0dz1cIm10LTUgZmxleCB3LWZ1bGwgcHgtMTAgZmxleC1jb2wgaXRlbXMtc3RhcnQganVzdGlmeS1zdGFydCB0ZXh0LXN0YXJ0XCI+XG4gICAgICAgICAgPHAgdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj57dChgT24gZGVza3RvcDpgKX08L3A+XG4gICAgICAgICAgPHVsIHR3PVwidGV4dC14cyBwbC04IG10LTIgbGlzdC1kaXNjXCI+XG4gICAgICAgICAgICA8bGk+e3QoYEluc3RhbGwgYW5kIHJlZnJlc2ggdGhlIHBhZ2VgKX08L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgdHc9XCJib3JkZXItdCBib3JkZXItdC13aGl0ZS8xMCBtdC01IHctZnVsbFwiIC8+XG5cbiAgICAgICAgPGRpdiB0dz1cImZsZXggc3BhY2UteC0yIGp1c3RpZnktYmV0d2VlbiB3LWZ1bGwgcC01XCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgdHdgdGV4dC13aGl0ZSBmb250LXNlbWlib2xkIHRleHQtYmFzZSB3LWZ1bGwgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHB4LTIgcHktNCBsZWFkaW5nLW5vbmUgdGV4dC14c2AsXG4gICAgICAgICAgICAgIHN0eWxlcy5idXR0b25bdGhlbWVdLFxuICAgICAgICAgICAgXX1cbiAgICAgICAgICAgIG9uQ2xpY2s9e29uR29PbmJvYXJkaW5nfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX1cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweC0yIHB5LTQgbGVhZGluZy1ub25lIHRleHQteHNgLFxuICAgICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgIF19XG4gICAgICAgICAgICBvbkNsaWNrPXtvbkNsb3NlfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHsn4oaQICcgKyB0KGBHbyBiYWNrYCl9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOb3RJbnN0YWxsZWQ7XG4iXX0= */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
var _ref2$4 = process.env.NODE_ENV === "production" ? {
  name: "17wdgc0",
  styles: "display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.25rem"
} : {
  name: "1xcknsk-NotInstalled",
  styles: "display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.25rem;label:NotInstalled;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
var _ref3$4 = process.env.NODE_ENV === "production" ? {
  name: "z2rh5z",
  styles: "display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center"
} : {
  name: "irmgj3-NotInstalled",
  styles: "display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;label:NotInstalled;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
var _ref4$3 = process.env.NODE_ENV === "production" ? {
  name: "709dbi",
  styles: "font-size:1rem;line-height:1.5rem;font-weight:600"
} : {
  name: "5rgvdh-NotInstalled",
  styles: "font-size:1rem;line-height:1.5rem;font-weight:600;label:NotInstalled;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
var _ref5$2 = process.env.NODE_ENV === "production" ? {
  name: "1umxcl3",
  styles: "margin-top:0.75rem;margin-bottom:0.75rem;display:flex;align-items:center;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.5rem * var(--tw-space-x-reverse));margin-left:calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));}font-size:0.75rem;line-height:1rem;text-decoration-line:underline"
} : {
  name: "1rvz9u1-NotInstalled",
  styles: "margin-top:0.75rem;margin-bottom:0.75rem;display:flex;align-items:center;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.5rem * var(--tw-space-x-reverse));margin-left:calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));}font-size:0.75rem;line-height:1rem;text-decoration-line:underline;label:NotInstalled;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
var _ref6$2 = process.env.NODE_ENV === "production" ? {
  name: "exiwz9",
  styles: "margin-top:1.25rem;display:flex;width:100%;flex-direction:column;align-items:flex-start;justify-content:flex-start;padding-left:2.5rem;padding-right:2.5rem;text-align:start"
} : {
  name: "1h18tut-NotInstalled",
  styles: "margin-top:1.25rem;display:flex;width:100%;flex-direction:column;align-items:flex-start;justify-content:flex-start;padding-left:2.5rem;padding-right:2.5rem;text-align:start;label:NotInstalled;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
var _ref7$2 = process.env.NODE_ENV === "production" ? {
  name: "1ide98v",
  styles: "font-size:0.75rem;line-height:1rem;font-weight:600"
} : {
  name: "1lhegsg-NotInstalled",
  styles: "font-size:0.75rem;line-height:1rem;font-weight:600;label:NotInstalled;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
var _ref8$1 = process.env.NODE_ENV === "production" ? {
  name: "1x0nakv",
  styles: "margin-top:0.5rem;list-style-type:disc;padding-left:2rem;font-size:0.75rem;line-height:1rem"
} : {
  name: "1ivf843-NotInstalled",
  styles: "margin-top:0.5rem;list-style-type:disc;padding-left:2rem;font-size:0.75rem;line-height:1rem;label:NotInstalled;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
var _ref9$1 = process.env.NODE_ENV === "production" ? {
  name: "exiwz9",
  styles: "margin-top:1.25rem;display:flex;width:100%;flex-direction:column;align-items:flex-start;justify-content:flex-start;padding-left:2.5rem;padding-right:2.5rem;text-align:start"
} : {
  name: "1h18tut-NotInstalled",
  styles: "margin-top:1.25rem;display:flex;width:100%;flex-direction:column;align-items:flex-start;justify-content:flex-start;padding-left:2.5rem;padding-right:2.5rem;text-align:start;label:NotInstalled;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
var _ref10$1 = process.env.NODE_ENV === "production" ? {
  name: "1ide98v",
  styles: "font-size:0.75rem;line-height:1rem;font-weight:600"
} : {
  name: "1lhegsg-NotInstalled",
  styles: "font-size:0.75rem;line-height:1rem;font-weight:600;label:NotInstalled;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
var _ref11$1 = process.env.NODE_ENV === "production" ? {
  name: "1x0nakv",
  styles: "margin-top:0.5rem;list-style-type:disc;padding-left:2rem;font-size:0.75rem;line-height:1rem"
} : {
  name: "1ivf843-NotInstalled",
  styles: "margin-top:0.5rem;list-style-type:disc;padding-left:2rem;font-size:0.75rem;line-height:1rem;label:NotInstalled;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
var _ref12$1 = process.env.NODE_ENV === "production" ? {
  name: "1htl0ft",
  styles: "margin-top:1.25rem;width:100%;border-top-width:1px;border-top-color:rgb(255 255 255 / 0.1)"
} : {
  name: "1sq3lye-NotInstalled",
  styles: "margin-top:1.25rem;width:100%;border-top-width:1px;border-top-color:rgb(255 255 255 / 0.1);label:NotInstalled;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
var _ref13$1 = process.env.NODE_ENV === "production" ? {
  name: "ibosxi",
  styles: "display:flex;width:100%;justify-content:space-between;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.5rem * var(--tw-space-x-reverse));margin-left:calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));}padding:1.25rem"
} : {
  name: "oxe9l3-NotInstalled",
  styles: "display:flex;width:100%;justify-content:space-between;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.5rem * var(--tw-space-x-reverse));margin-left:calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));}padding:1.25rem;label:NotInstalled;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$4
};
const NotInstalled = ({
  adapter,
  onClose,
  onGoOnboarding
}) => {
  const {
    theme
  } = useUnifiedWalletContext();
  const {
    t
  } = useTranslation();
  return jsx("div", {
    css: _ref$4,
    className: "hideScrollbar"
  }, jsx("div", {
    css: _ref2$4
  }, jsx("img", {
    src: adapter.icon,
    width: 100,
    height: 100
  })), jsx("div", {
    css: _ref3$4
  }, jsx("span", {
    css: _ref4$3
  }, t(`Have you installed`) + ` ${adapter.name}?`), jsx("a", {
    href: adapter.url,
    rel: "noopener noreferrer",
    target: "_blank",
    css: _ref5$2
  }, jsx("span", null, t(`Install`), " ", adapter.name), jsx(ExternalIcon$1, null)), jsx("div", {
    css: _ref6$2
  }, jsx("p", {
    css: _ref7$2
  }, t(`On mobile:`)), jsx("ul", {
    css: _ref8$1
  }, jsx("li", null, t(`You should open the app instead`)))), jsx("div", {
    css: _ref9$1
  }, jsx("p", {
    css: _ref10$1
  }, t(`On desktop:`)), jsx("ul", {
    css: _ref11$1
  }, jsx("li", null, t(`Install and refresh the page`)))), jsx("div", {
    css: _ref12$1
  }), jsx("div", {
    css: _ref13$1
  }, jsx("button", {
    type: "button",
    css: ["width:100%;border-radius:0.5rem;border-width:1px;border-color:rgb(255 255 255 / 0.1);padding-left:0.5rem;padding-right:0.5rem;padding-top:1rem;padding-bottom:1rem;font-size:0.75rem;line-height:1;font-weight:600;--tw-text-opacity:1;color:rgb(255 255 255 / var(--tw-text-opacity));", styles$3.button[theme], process.env.NODE_ENV === "production" ? "" : ";label:NotInstalled;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5vdEluc3RhbGxlZC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBb0VZIiwiZmlsZSI6Ik5vdEluc3RhbGxlZC50c3giLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZGFwdGVyIH0gZnJvbSAnQHNvbGFuYS93YWxsZXQtYWRhcHRlci1iYXNlJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IEV4dGVybmFsSWNvbiBmcm9tICcuLi9pY29ucy9FeHRlcm5hbEljb24nO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay83MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgYnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bIzMxMzMzQl0gdGV4dC13aGl0ZSBob3ZlcjpiZy1ibGFja2BdLFxuICAgIGRhcms6IFt0d2BiZy1bIzMxMzMzQl0gaG92ZXI6YmctYmxhY2svMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctYmxhY2sgaG92ZXI6YmctYmxhY2svNTBgXSxcbiAgfSxcbn07XG5cbmNvbnN0IE5vdEluc3RhbGxlZDogUmVhY3QuRkM8eyBhZGFwdGVyOiBBZGFwdGVyOyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBvbkdvT25ib2FyZGluZzogKCkgPT4gdm9pZCB9PiA9ICh7XG4gIGFkYXB0ZXIsXG4gIG9uQ2xvc2UsXG4gIG9uR29PbmJvYXJkaW5nLFxufSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YGR1cmF0aW9uLTUwMCBhbmltYXRlLWZhZGUtaW4gb3ZlcmZsb3cteS1zY3JvbGxgXX0gY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiPlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHAtNVwiPlxuICAgICAgICA8aW1nIHNyYz17YWRhcHRlci5pY29ufSB3aWR0aD17MTAwfSBoZWlnaHQ9ezEwMH0gLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBIYXZlIHlvdSBpbnN0YWxsZWRgKSArIGAgJHthZGFwdGVyLm5hbWV9P2B9PC9zcGFuPlxuXG4gICAgICAgIDxhXG4gICAgICAgICAgaHJlZj17YWRhcHRlci51cmx9XG4gICAgICAgICAgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiXG4gICAgICAgICAgdGFyZ2V0PVwiX2JsYW5rXCJcbiAgICAgICAgICB0dz1cInRleHQteHMgZmxleCBteS0zIGl0ZW1zLWNlbnRlciBzcGFjZS14LTIgdW5kZXJsaW5lXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAge3QoYEluc3RhbGxgKX0ge2FkYXB0ZXIubmFtZX1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPEV4dGVybmFsSWNvbiAvPlxuICAgICAgICA8L2E+XG5cbiAgICAgICAgPGRpdiB0dz1cIm10LTUgZmxleCB3LWZ1bGwgcHgtMTAgZmxleC1jb2wgaXRlbXMtc3RhcnQganVzdGlmeS1zdGFydCB0ZXh0LXN0YXJ0XCI+XG4gICAgICAgICAgPHAgdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj57dChgT24gbW9iaWxlOmApfTwvcD5cbiAgICAgICAgICA8dWwgdHc9XCJ0ZXh0LXhzIHBsLTggbXQtMiBsaXN0LWRpc2NcIj5cbiAgICAgICAgICAgIDxsaT57dChgWW91IHNob3VsZCBvcGVuIHRoZSBhcHAgaW5zdGVhZGApfTwvbGk+XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiB0dz1cIm10LTUgZmxleCB3LWZ1bGwgcHgtMTAgZmxleC1jb2wgaXRlbXMtc3RhcnQganVzdGlmeS1zdGFydCB0ZXh0LXN0YXJ0XCI+XG4gICAgICAgICAgPHAgdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj57dChgT24gZGVza3RvcDpgKX08L3A+XG4gICAgICAgICAgPHVsIHR3PVwidGV4dC14cyBwbC04IG10LTIgbGlzdC1kaXNjXCI+XG4gICAgICAgICAgICA8bGk+e3QoYEluc3RhbGwgYW5kIHJlZnJlc2ggdGhlIHBhZ2VgKX08L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgdHc9XCJib3JkZXItdCBib3JkZXItdC13aGl0ZS8xMCBtdC01IHctZnVsbFwiIC8+XG5cbiAgICAgICAgPGRpdiB0dz1cImZsZXggc3BhY2UteC0yIGp1c3RpZnktYmV0d2VlbiB3LWZ1bGwgcC01XCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgdHdgdGV4dC13aGl0ZSBmb250LXNlbWlib2xkIHRleHQtYmFzZSB3LWZ1bGwgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHB4LTIgcHktNCBsZWFkaW5nLW5vbmUgdGV4dC14c2AsXG4gICAgICAgICAgICAgIHN0eWxlcy5idXR0b25bdGhlbWVdLFxuICAgICAgICAgICAgXX1cbiAgICAgICAgICAgIG9uQ2xpY2s9e29uR29PbmJvYXJkaW5nfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX1cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweC0yIHB5LTQgbGVhZGluZy1ub25lIHRleHQteHNgLFxuICAgICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgIF19XG4gICAgICAgICAgICBvbkNsaWNrPXtvbkNsb3NlfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHsn4oaQICcgKyB0KGBHbyBiYWNrYCl9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOb3RJbnN0YWxsZWQ7XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:NotInstalled;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5vdEluc3RhbGxlZC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBb0VZIiwiZmlsZSI6Ik5vdEluc3RhbGxlZC50c3giLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZGFwdGVyIH0gZnJvbSAnQHNvbGFuYS93YWxsZXQtYWRhcHRlci1iYXNlJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IEV4dGVybmFsSWNvbiBmcm9tICcuLi9pY29ucy9FeHRlcm5hbEljb24nO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay83MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgYnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bIzMxMzMzQl0gdGV4dC13aGl0ZSBob3ZlcjpiZy1ibGFja2BdLFxuICAgIGRhcms6IFt0d2BiZy1bIzMxMzMzQl0gaG92ZXI6YmctYmxhY2svMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctYmxhY2sgaG92ZXI6YmctYmxhY2svNTBgXSxcbiAgfSxcbn07XG5cbmNvbnN0IE5vdEluc3RhbGxlZDogUmVhY3QuRkM8eyBhZGFwdGVyOiBBZGFwdGVyOyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBvbkdvT25ib2FyZGluZzogKCkgPT4gdm9pZCB9PiA9ICh7XG4gIGFkYXB0ZXIsXG4gIG9uQ2xvc2UsXG4gIG9uR29PbmJvYXJkaW5nLFxufSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YGR1cmF0aW9uLTUwMCBhbmltYXRlLWZhZGUtaW4gb3ZlcmZsb3cteS1zY3JvbGxgXX0gY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiPlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHAtNVwiPlxuICAgICAgICA8aW1nIHNyYz17YWRhcHRlci5pY29ufSB3aWR0aD17MTAwfSBoZWlnaHQ9ezEwMH0gLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBIYXZlIHlvdSBpbnN0YWxsZWRgKSArIGAgJHthZGFwdGVyLm5hbWV9P2B9PC9zcGFuPlxuXG4gICAgICAgIDxhXG4gICAgICAgICAgaHJlZj17YWRhcHRlci51cmx9XG4gICAgICAgICAgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiXG4gICAgICAgICAgdGFyZ2V0PVwiX2JsYW5rXCJcbiAgICAgICAgICB0dz1cInRleHQteHMgZmxleCBteS0zIGl0ZW1zLWNlbnRlciBzcGFjZS14LTIgdW5kZXJsaW5lXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAge3QoYEluc3RhbGxgKX0ge2FkYXB0ZXIubmFtZX1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPEV4dGVybmFsSWNvbiAvPlxuICAgICAgICA8L2E+XG5cbiAgICAgICAgPGRpdiB0dz1cIm10LTUgZmxleCB3LWZ1bGwgcHgtMTAgZmxleC1jb2wgaXRlbXMtc3RhcnQganVzdGlmeS1zdGFydCB0ZXh0LXN0YXJ0XCI+XG4gICAgICAgICAgPHAgdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj57dChgT24gbW9iaWxlOmApfTwvcD5cbiAgICAgICAgICA8dWwgdHc9XCJ0ZXh0LXhzIHBsLTggbXQtMiBsaXN0LWRpc2NcIj5cbiAgICAgICAgICAgIDxsaT57dChgWW91IHNob3VsZCBvcGVuIHRoZSBhcHAgaW5zdGVhZGApfTwvbGk+XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiB0dz1cIm10LTUgZmxleCB3LWZ1bGwgcHgtMTAgZmxleC1jb2wgaXRlbXMtc3RhcnQganVzdGlmeS1zdGFydCB0ZXh0LXN0YXJ0XCI+XG4gICAgICAgICAgPHAgdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj57dChgT24gZGVza3RvcDpgKX08L3A+XG4gICAgICAgICAgPHVsIHR3PVwidGV4dC14cyBwbC04IG10LTIgbGlzdC1kaXNjXCI+XG4gICAgICAgICAgICA8bGk+e3QoYEluc3RhbGwgYW5kIHJlZnJlc2ggdGhlIHBhZ2VgKX08L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgdHc9XCJib3JkZXItdCBib3JkZXItdC13aGl0ZS8xMCBtdC01IHctZnVsbFwiIC8+XG5cbiAgICAgICAgPGRpdiB0dz1cImZsZXggc3BhY2UteC0yIGp1c3RpZnktYmV0d2VlbiB3LWZ1bGwgcC01XCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgdHdgdGV4dC13aGl0ZSBmb250LXNlbWlib2xkIHRleHQtYmFzZSB3LWZ1bGwgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHB4LTIgcHktNCBsZWFkaW5nLW5vbmUgdGV4dC14c2AsXG4gICAgICAgICAgICAgIHN0eWxlcy5idXR0b25bdGhlbWVdLFxuICAgICAgICAgICAgXX1cbiAgICAgICAgICAgIG9uQ2xpY2s9e29uR29PbmJvYXJkaW5nfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX1cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweC0yIHB5LTQgbGVhZGluZy1ub25lIHRleHQteHNgLFxuICAgICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgIF19XG4gICAgICAgICAgICBvbkNsaWNrPXtvbkNsb3NlfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHsn4oaQICcgKyB0KGBHbyBiYWNrYCl9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOb3RJbnN0YWxsZWQ7XG4iXX0= */"],
    onClick: onGoOnboarding
  }, t(`I don't have a wallet`)), jsx("button", {
    type: "button",
    css: ["width:100%;border-radius:0.5rem;border-width:1px;border-color:rgb(255 255 255 / 0.1);padding-left:0.5rem;padding-right:0.5rem;padding-top:1rem;padding-bottom:1rem;font-size:0.75rem;line-height:1;font-weight:600;--tw-text-opacity:1;color:rgb(255 255 255 / var(--tw-text-opacity));", styles$3.button[theme], process.env.NODE_ENV === "production" ? "" : ";label:NotInstalled;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5vdEluc3RhbGxlZC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBK0VZIiwiZmlsZSI6Ik5vdEluc3RhbGxlZC50c3giLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZGFwdGVyIH0gZnJvbSAnQHNvbGFuYS93YWxsZXQtYWRhcHRlci1iYXNlJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IEV4dGVybmFsSWNvbiBmcm9tICcuLi9pY29ucy9FeHRlcm5hbEljb24nO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay83MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgYnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bIzMxMzMzQl0gdGV4dC13aGl0ZSBob3ZlcjpiZy1ibGFja2BdLFxuICAgIGRhcms6IFt0d2BiZy1bIzMxMzMzQl0gaG92ZXI6YmctYmxhY2svMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctYmxhY2sgaG92ZXI6YmctYmxhY2svNTBgXSxcbiAgfSxcbn07XG5cbmNvbnN0IE5vdEluc3RhbGxlZDogUmVhY3QuRkM8eyBhZGFwdGVyOiBBZGFwdGVyOyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBvbkdvT25ib2FyZGluZzogKCkgPT4gdm9pZCB9PiA9ICh7XG4gIGFkYXB0ZXIsXG4gIG9uQ2xvc2UsXG4gIG9uR29PbmJvYXJkaW5nLFxufSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YGR1cmF0aW9uLTUwMCBhbmltYXRlLWZhZGUtaW4gb3ZlcmZsb3cteS1zY3JvbGxgXX0gY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiPlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHAtNVwiPlxuICAgICAgICA8aW1nIHNyYz17YWRhcHRlci5pY29ufSB3aWR0aD17MTAwfSBoZWlnaHQ9ezEwMH0gLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBIYXZlIHlvdSBpbnN0YWxsZWRgKSArIGAgJHthZGFwdGVyLm5hbWV9P2B9PC9zcGFuPlxuXG4gICAgICAgIDxhXG4gICAgICAgICAgaHJlZj17YWRhcHRlci51cmx9XG4gICAgICAgICAgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiXG4gICAgICAgICAgdGFyZ2V0PVwiX2JsYW5rXCJcbiAgICAgICAgICB0dz1cInRleHQteHMgZmxleCBteS0zIGl0ZW1zLWNlbnRlciBzcGFjZS14LTIgdW5kZXJsaW5lXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAge3QoYEluc3RhbGxgKX0ge2FkYXB0ZXIubmFtZX1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPEV4dGVybmFsSWNvbiAvPlxuICAgICAgICA8L2E+XG5cbiAgICAgICAgPGRpdiB0dz1cIm10LTUgZmxleCB3LWZ1bGwgcHgtMTAgZmxleC1jb2wgaXRlbXMtc3RhcnQganVzdGlmeS1zdGFydCB0ZXh0LXN0YXJ0XCI+XG4gICAgICAgICAgPHAgdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj57dChgT24gbW9iaWxlOmApfTwvcD5cbiAgICAgICAgICA8dWwgdHc9XCJ0ZXh0LXhzIHBsLTggbXQtMiBsaXN0LWRpc2NcIj5cbiAgICAgICAgICAgIDxsaT57dChgWW91IHNob3VsZCBvcGVuIHRoZSBhcHAgaW5zdGVhZGApfTwvbGk+XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiB0dz1cIm10LTUgZmxleCB3LWZ1bGwgcHgtMTAgZmxleC1jb2wgaXRlbXMtc3RhcnQganVzdGlmeS1zdGFydCB0ZXh0LXN0YXJ0XCI+XG4gICAgICAgICAgPHAgdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj57dChgT24gZGVza3RvcDpgKX08L3A+XG4gICAgICAgICAgPHVsIHR3PVwidGV4dC14cyBwbC04IG10LTIgbGlzdC1kaXNjXCI+XG4gICAgICAgICAgICA8bGk+e3QoYEluc3RhbGwgYW5kIHJlZnJlc2ggdGhlIHBhZ2VgKX08L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgdHc9XCJib3JkZXItdCBib3JkZXItdC13aGl0ZS8xMCBtdC01IHctZnVsbFwiIC8+XG5cbiAgICAgICAgPGRpdiB0dz1cImZsZXggc3BhY2UteC0yIGp1c3RpZnktYmV0d2VlbiB3LWZ1bGwgcC01XCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgdHdgdGV4dC13aGl0ZSBmb250LXNlbWlib2xkIHRleHQtYmFzZSB3LWZ1bGwgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHB4LTIgcHktNCBsZWFkaW5nLW5vbmUgdGV4dC14c2AsXG4gICAgICAgICAgICAgIHN0eWxlcy5idXR0b25bdGhlbWVdLFxuICAgICAgICAgICAgXX1cbiAgICAgICAgICAgIG9uQ2xpY2s9e29uR29PbmJvYXJkaW5nfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX1cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweC0yIHB5LTQgbGVhZGluZy1ub25lIHRleHQteHNgLFxuICAgICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgIF19XG4gICAgICAgICAgICBvbkNsaWNrPXtvbkNsb3NlfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHsn4oaQICcgKyB0KGBHbyBiYWNrYCl9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOb3RJbnN0YWxsZWQ7XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:NotInstalled;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5vdEluc3RhbGxlZC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBK0VZIiwiZmlsZSI6Ik5vdEluc3RhbGxlZC50c3giLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZGFwdGVyIH0gZnJvbSAnQHNvbGFuYS93YWxsZXQtYWRhcHRlci1iYXNlJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IEV4dGVybmFsSWNvbiBmcm9tICcuLi9pY29ucy9FeHRlcm5hbEljb24nO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay83MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgYnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bIzMxMzMzQl0gdGV4dC13aGl0ZSBob3ZlcjpiZy1ibGFja2BdLFxuICAgIGRhcms6IFt0d2BiZy1bIzMxMzMzQl0gaG92ZXI6YmctYmxhY2svMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctYmxhY2sgaG92ZXI6YmctYmxhY2svNTBgXSxcbiAgfSxcbn07XG5cbmNvbnN0IE5vdEluc3RhbGxlZDogUmVhY3QuRkM8eyBhZGFwdGVyOiBBZGFwdGVyOyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBvbkdvT25ib2FyZGluZzogKCkgPT4gdm9pZCB9PiA9ICh7XG4gIGFkYXB0ZXIsXG4gIG9uQ2xvc2UsXG4gIG9uR29PbmJvYXJkaW5nLFxufSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YGR1cmF0aW9uLTUwMCBhbmltYXRlLWZhZGUtaW4gb3ZlcmZsb3cteS1zY3JvbGxgXX0gY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiPlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHAtNVwiPlxuICAgICAgICA8aW1nIHNyYz17YWRhcHRlci5pY29ufSB3aWR0aD17MTAwfSBoZWlnaHQ9ezEwMH0gLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBIYXZlIHlvdSBpbnN0YWxsZWRgKSArIGAgJHthZGFwdGVyLm5hbWV9P2B9PC9zcGFuPlxuXG4gICAgICAgIDxhXG4gICAgICAgICAgaHJlZj17YWRhcHRlci51cmx9XG4gICAgICAgICAgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiXG4gICAgICAgICAgdGFyZ2V0PVwiX2JsYW5rXCJcbiAgICAgICAgICB0dz1cInRleHQteHMgZmxleCBteS0zIGl0ZW1zLWNlbnRlciBzcGFjZS14LTIgdW5kZXJsaW5lXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAge3QoYEluc3RhbGxgKX0ge2FkYXB0ZXIubmFtZX1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPEV4dGVybmFsSWNvbiAvPlxuICAgICAgICA8L2E+XG5cbiAgICAgICAgPGRpdiB0dz1cIm10LTUgZmxleCB3LWZ1bGwgcHgtMTAgZmxleC1jb2wgaXRlbXMtc3RhcnQganVzdGlmeS1zdGFydCB0ZXh0LXN0YXJ0XCI+XG4gICAgICAgICAgPHAgdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj57dChgT24gbW9iaWxlOmApfTwvcD5cbiAgICAgICAgICA8dWwgdHc9XCJ0ZXh0LXhzIHBsLTggbXQtMiBsaXN0LWRpc2NcIj5cbiAgICAgICAgICAgIDxsaT57dChgWW91IHNob3VsZCBvcGVuIHRoZSBhcHAgaW5zdGVhZGApfTwvbGk+XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiB0dz1cIm10LTUgZmxleCB3LWZ1bGwgcHgtMTAgZmxleC1jb2wgaXRlbXMtc3RhcnQganVzdGlmeS1zdGFydCB0ZXh0LXN0YXJ0XCI+XG4gICAgICAgICAgPHAgdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj57dChgT24gZGVza3RvcDpgKX08L3A+XG4gICAgICAgICAgPHVsIHR3PVwidGV4dC14cyBwbC04IG10LTIgbGlzdC1kaXNjXCI+XG4gICAgICAgICAgICA8bGk+e3QoYEluc3RhbGwgYW5kIHJlZnJlc2ggdGhlIHBhZ2VgKX08L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgdHc9XCJib3JkZXItdCBib3JkZXItdC13aGl0ZS8xMCBtdC01IHctZnVsbFwiIC8+XG5cbiAgICAgICAgPGRpdiB0dz1cImZsZXggc3BhY2UteC0yIGp1c3RpZnktYmV0d2VlbiB3LWZ1bGwgcC01XCI+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgdHdgdGV4dC13aGl0ZSBmb250LXNlbWlib2xkIHRleHQtYmFzZSB3LWZ1bGwgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHB4LTIgcHktNCBsZWFkaW5nLW5vbmUgdGV4dC14c2AsXG4gICAgICAgICAgICAgIHN0eWxlcy5idXR0b25bdGhlbWVdLFxuICAgICAgICAgICAgXX1cbiAgICAgICAgICAgIG9uQ2xpY2s9e29uR29PbmJvYXJkaW5nfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX1cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweC0yIHB5LTQgbGVhZGluZy1ub25lIHRleHQteHNgLFxuICAgICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgIF19XG4gICAgICAgICAgICBvbkNsaWNrPXtvbkNsb3NlfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHsn4oaQICcgKyB0KGBHbyBiYWNrYCl9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOb3RJbnN0YWxsZWQ7XG4iXX0= */"],
    onClick: onClose
  }, '← ' + t(`Go back`)))));
};
var NotInstalled$1 = NotInstalled;

const WRAPPED_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const HARDCODED_WALLET_STANDARDS = [{
  id: 'Backpack',
  name: 'Backpack',
  url: 'https://www.backpack.app/',
  icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAbvSURBVHgB7Z1dUtxGEMf/LZH3fU0V4PUJQg4QVj5BnBOAT2BzAsMJAicwPoHJCRDrAxifgLVxVV73ObDqdEtsjKn4C8+0NDv9e7AxprRC85uvnp4RYYW5qKpxCVTcYKsgfiDfGjMwIsZIvh7d/lkmzAiYy5fzhultyZhdlagf1vU5VhjCiiGFXq01zYSJdqWgx/hB5AHN5I/6iuilyFBjxVgZAdqCZ34ORoVIqAzSOhxsvq6PsSIkL4A281LwL2IW/F1UhLKgRz/X9QyJUyBhuuae31gWviLjiPF1wxeX29vPkTjJtgAftrd3GHSMnmHw4eZ0uodESVKAoRT+kpQlSE6Ats/XZv/ONK5vZHC49+B1fYjESG4MUDKfYmCFr0ic4fmHqtpCYiQlgA66QsztIzFi5j+RGMl0AXebfgn0aOTuvGG8owIarZsXOj3ronlRuEYnn84CJLo4Lgi/QL/H/LHmy/RwI6GA0RoS4acFHi8kGieFXS/QhmijFfQXmH3uPy5lSkoLbIkYlfyzhuM4juM4juM4juMMj6TzATQ4JH9tlRqFk8BM2aV9RWHB9K5kzK/KLui0KqliSQmgBa4BIS54cpMD0OeawFye3jk19JdKkWq62OAFkEIfrTXNUxBV1okf38Ot3MGjlFqHwQrQZvQ22Cfw7xjg6t8XkZaBGzpKIXdwcAJojZeCP5SC30HipJBEOigBZLn3qdzSPlKr8V9hyEmkgxCgj8zefuD9jen0AAOidwE0i6ZhfjXgRI+gDK016DUjqE3ubPhNLoWvaDLJouHToaSP9SbA0DJ7LekyiviNPgP0TC9dQM6FfxeZ7eyuT6cv0RPmAmjTx11uXx/MiegEDd425cfcwWV+H4O3+uiO+pTAVIA2uMN8av6QiWr5TQ++JVlTc/tEiF3jOMScZGC43kME0VSA95PJhWXhM+Gt1Phn98nStZa1r9mB2SDQPqefjhayfnDfFG2J5882z84eynVM5u3thlONhRhj0gLc5PRfwAw62JjW+wjE5Xa1L0VkshO4kXt/EPDev4ZJCyBRvlcwggjHG4EfYHc9OoIBBWy3mEUX4H1V7Ur7ZvILaT8qy7FRduleF9jXc4RggOUWs/gtANs0nYquvMXaMaTXlQHlE1ggayLvf5OKY0DUMYDWfmpsBjZa+9enOmiLy+VkcmqxaNW2ZgX9GnsLXNQWoGj4KYzQ2g8LyG5WUDR4hshEE6CN+AFmg5lFiRMYcI0uKRQGyIAwegWKJkBjYO8tzq12C7efQ7CK2I00MomIxOsCiCcwQhaW3sEQ6W7sPi/yIDqKAHp8m2nIF7COoc9ghQw4NU8SkYgiQCmLKXCCUSziPc84XYBh83/DSiWR3qUo2tT4ONdGYDTub73cSzD/PNt0rojdQHAByoXxw0E7XfoFhsjnRduD+DnWIkkXXACJl1cwRoMmf3cbRaOjLRzDXnKZVj9GBIILUJBtbVzyj9HAU19AgR6I9VzDtwCgMXpAo2Yxp0v/Ybi49ennJtIFEPMY/TCKHTvv+aTSUQzBgwrQ92YHbQVi3UN3GAVZhrf/jzECE1SAq/7n4yOJ074KPSBcJoii598vxgwrqAByg70HZJZbr0JJ0G5XZz5Z1e1rYccA5TAicqEk0O5ECl/3LvYys7mLTLHHCEzS7wz6Esv3+nyYTF58rwha63XAl8PG1aCnhesWq6EdOcKM3WvmXRHh+Gvv/tNVTJlJPC4a3RVEK72+sCSZ4+J/FBVhTUS43J7gJqFjrnl33A3sxtCa3nAWhX6bbAT4hJugCsNZ2TGA8224AJnjAmSOC5A5LkDmuACZ4wJkjguQOS5A5rgAmeMCZI4LkDkuQOa4AJnjAmSOC5A5LkDmuACZ4wJkjguQOWEFYJvz85xwBBWgKM1P68oKKsI/36ACdC9nsDlWPTsIJ5t1Hfw01OBjgI1p/YwLegIibw0CwESz9gUYZ2d/wHEcx3Ecx3Ecx3Ecx3HuS5QjfdrXxTHv3JzEkd2xKwHR9xPNuKGjzdf1MSIQXAA9XUsuuw8nKPpK3PWzs+AvrgwqgP1LojOjoEf3fRv6Zy+JgBSLOGfaOx1NE/6o+rCrgeT9fWp4SljmuACZ4wJkjguQOS5A5rgAmeMCZI4LkDkuQOa4AJnjAmSOC5A5LkDmuACZ4wJkjguQOS5A5rgAmeMCZI4LkDkuQOa4AJnj5wRmTlABqHQBohKhggUVYAEEP8fO+UiMgziDCvCwrnU3aw0nOATMQu8LVIIPAq+JdAerdwWBaQ/fjEBwAaQVmMnN7sEJCB3EqP3tlRGJy6qqmPkFMcZw7sucmfZiHQ6hRBNgSXdaCHbA7KeFfBvz9pxlxtl1gcN2XBWRfwHK959XFRG6AgAAAABJRU5ErkJggg=='
}, {
  id: 'Phantom',
  name: 'Phantom',
  url: 'https://phantom.app/',
  icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiB2aWV3Qm94PSIwIDAgMTA4IDEwOCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9IiNBQjlGRjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni41MjY3IDY5LjkyMjlDNDIuMDA1NCA3Ni44NTA5IDM0LjQyOTIgODUuNjE4MiAyNC4zNDggODUuNjE4MkMxOS41ODI0IDg1LjYxODIgMTUgODMuNjU2MyAxNSA3NS4xMzQyQzE1IDUzLjQzMDUgNDQuNjMyNiAxOS44MzI3IDcyLjEyNjggMTkuODMyN0M4Ny43NjggMTkuODMyNyA5NCAzMC42ODQ2IDk0IDQzLjAwNzlDOTQgNTguODI1OCA4My43MzU1IDc2LjkxMjIgNzMuNTMyMSA3Ni45MTIyQzcwLjI5MzkgNzYuOTEyMiA2OC43MDUzIDc1LjEzNDIgNjguNzA1MyA3Mi4zMTRDNjguNzA1MyA3MS41NzgzIDY4LjgyNzUgNzAuNzgxMiA2OS4wNzE5IDY5LjkyMjlDNjUuNTg5MyA3NS44Njk5IDU4Ljg2ODUgODEuMzg3OCA1Mi41NzU0IDgxLjM4NzhDNDcuOTkzIDgxLjM4NzggNDUuNjcxMyA3OC41MDYzIDQ1LjY3MTMgNzQuNDU5OEM0NS42NzEzIDcyLjk4ODQgNDUuOTc2OCA3MS40NTU2IDQ2LjUyNjcgNjkuOTIyOVpNODMuNjc2MSA0Mi41Nzk0QzgzLjY3NjEgNDYuMTcwNCA4MS41NTc1IDQ3Ljk2NTggNzkuMTg3NSA0Ny45NjU4Qzc2Ljc4MTYgNDcuOTY1OCA3NC42OTg5IDQ2LjE3MDQgNzQuNjk4OSA0Mi41Nzk0Qzc0LjY5ODkgMzguOTg4NSA3Ni43ODE2IDM3LjE5MzEgNzkuMTg3NSAzNy4xOTMxQzgxLjU1NzUgMzcuMTkzMSA4My42NzYxIDM4Ljk4ODUgODMuNjc2MSA0Mi41Nzk0Wk03MC4yMTAzIDQyLjU3OTVDNzAuMjEwMyA0Ni4xNzA0IDY4LjA5MTYgNDcuOTY1OCA2NS43MjE2IDQ3Ljk2NThDNjMuMzE1NyA0Ny45NjU4IDYxLjIzMyA0Ni4xNzA0IDYxLjIzMyA0Mi41Nzk1QzYxLjIzMyAzOC45ODg1IDYzLjMxNTcgMzcuMTkzMSA2NS43MjE2IDM3LjE5MzFDNjguMDkxNiAzNy4xOTMxIDcwLjIxMDMgMzguOTg4NSA3MC4yMTAzIDQyLjU3OTVaIiBmaWxsPSIjRkZGREY4Ii8+Cjwvc3ZnPg=='
}, {
  id: 'Solflare',
  name: 'Solflare',
  url: 'https://solflare.com/',
  icon: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgNTAgNTAiIHdpZHRoPSI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGxpbmVhckdyYWRpZW50IGlkPSJhIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNmZmMxMGIiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmYjNmMmUiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iYiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSI2LjQ3ODM1IiB4Mj0iMzQuOTEwNyIgeGxpbms6aHJlZj0iI2EiIHkxPSI3LjkyIiB5Mj0iMzMuNjU5MyIvPjxyYWRpYWxHcmFkaWVudCBpZD0iYyIgY3g9IjAiIGN5PSIwIiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDQuOTkyMTg4MzIgMTIuMDYzODc5NjMgLTEyLjE4MTEzNjU1IDUuMDQwNzEwNzQgMjIuNTIwMiAyMC42MTgzKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHI9IjEiIHhsaW5rOmhyZWY9IiNhIi8+PHBhdGggZD0ibTI1LjE3MDggNDcuOTEwNGMuNTI1IDAgLjk1MDcuNDIxLjk1MDcuOTQwM3MtLjQyNTcuOTQwMi0uOTUwNy45NDAyLS45NTA3LS40MjA5LS45NTA3LS45NDAyLjQyNTctLjk0MDMuOTUwNy0uOTQwM3ptLTEuMDMyOC00NC45MTU2NWMuNDY0Ni4wMzgzNi44Mzk4LjM5MDQuOTAyNy44NDY4MWwxLjEzMDcgOC4yMTU3NGMuMzc5OCAyLjcxNDMgMy42NTM1IDMuODkwNCA1LjY3NDMgMi4wNDU5bDExLjMyOTEtMTAuMzExNThjLjI3MzMtLjI0ODczLjY5ODktLjIzMTQ5Ljk1MDcuMDM4NTEuMjMwOS4yNDc3Mi4yMzc5LjYyNjk3LjAxNjEuODgyNzdsLTkuODc5MSAxMS4zOTU4Yy0xLjgxODcgMi4wOTQyLS40NzY4IDUuMzY0MyAyLjI5NTYgNS41OTc4bDguNzE2OC44NDAzYy40MzQxLjA0MTguNzUxNy40MjM0LjcwOTMuODUyNC0uMDM0OS4zNTM3LS4zMDc0LjYzOTUtLjY2MjguNjk0OWwtOS4xNTk0IDEuNDMwMmMtMi42NTkzLjM2MjUtMy44NjM2IDMuNTExNy0yLjEzMzkgNS41NTc2bDMuMjIgMy43OTYxYy4yNTk0LjMwNTguMjE4OC43NjE1LS4wOTA4IDEuMDE3OC0uMjYyMi4yMTcyLS42NDE5LjIyNTYtLjkxMzguMDIwM2wtMy45Njk0LTIuOTk3OGMtMi4xNDIxLTEuNjEwOS01LjIyOTctLjI0MTctNS40NTYxIDIuNDI0M2wtLjg3NDcgMTAuMzk3NmMtLjAzNjIuNDI5NS0uNDE3OC43NDg3LS44NTI1LjcxMy0uMzY5LS4wMzAzLS42NjcxLS4zMDk3LS43MTcxLS42NzIxbC0xLjM4NzEtMTAuMDQzN2MtLjM3MTctMi43MTQ0LTMuNjQ1NC0zLjg5MDQtNS42NzQzLTIuMDQ1OWwtMTIuMDUxOTUgMTAuOTc0Yy0uMjQ5NDcuMjI3MS0uNjM4MDkuMjExNC0uODY4LS4wMzUtLjIxMDk0LS4yMjYyLS4yMTczNS0uNTcyNC0uMDE0OTMtLjgwNmwxMC41MTgxOC0xMi4xMzg1YzEuODE4Ny0yLjA5NDIuNDg0OS01LjM2NDQtMi4yODc2LTUuNTk3OGwtOC43MTg3Mi0uODQwNWMtLjQzNDEzLS4wNDE4LS43NTE3Mi0uNDIzNS0uNzA5MzYtLjg1MjQuMDM0OTMtLjM1MzcuMzA3MzktLjYzOTQuNjYyNy0uNjk1bDkuMTUzMzgtMS40Mjk5YzIuNjU5NC0uMzYyNSAzLjg3MTgtMy41MTE3IDIuMTQyMS01LjU1NzZsLTIuMTkyLTIuNTg0MWMtLjMyMTctLjM3OTItLjI3MTMtLjk0NDMuMTEyNi0xLjI2MjEuMzI1My0uMjY5NC43OTYzLS4yNzk3IDEuMTMzNC0uMDI0OWwyLjY5MTggMi4wMzQ3YzIuMTQyMSAxLjYxMDkgNS4yMjk3LjI0MTcgNS40NTYxLTIuNDI0M2wuNzI0MS04LjU1OTk4Yy4wNDU3LS41NDA4LjUyNjUtLjk0MjU3IDEuMDczOS0uODk3Mzd6bS0yMy4xODczMyAyMC40Mzk2NWMuNTI1MDQgMCAuOTUwNjcuNDIxLjk1MDY3Ljk0MDNzLS40MjU2My45NDAzLS45NTA2Ny45NDAzYy0uNTI1MDQxIDAtLjk1MDY3LS40MjEtLjk1MDY3LS45NDAzcy40MjU2MjktLjk0MDMuOTUwNjctLjk0MDN6bTQ3LjY3OTczLS45NTQ3Yy41MjUgMCAuOTUwNy40MjEuOTUwNy45NDAzcy0uNDI1Ny45NDAyLS45NTA3Ljk0MDItLjk1MDctLjQyMDktLjk1MDctLjk0MDIuNDI1Ny0uOTQwMy45NTA3LS45NDAzem0tMjQuNjI5Ni0yMi40Nzk3Yy41MjUgMCAuOTUwNi40MjA5NzMuOTUwNi45NDAyNyAwIC41MTkzLS40MjU2Ljk0MDI3LS45NTA2Ljk0MDI3LS41MjUxIDAtLjk1MDctLjQyMDk3LS45NTA3LS45NDAyNyAwLS41MTkyOTcuNDI1Ni0uOTQwMjcuOTUwNy0uOTQwMjd6IiBmaWxsPSJ1cmwoI2IpIi8+PHBhdGggZD0ibTI0LjU3MSAzMi43NzkyYzQuOTU5NiAwIDguOTgwMi0zLjk3NjUgOC45ODAyLTguODgxOSAwLTQuOTA1My00LjAyMDYtOC44ODE5LTguOTgwMi04Ljg4MTlzLTguOTgwMiAzLjk3NjYtOC45ODAyIDguODgxOWMwIDQuOTA1NCA0LjAyMDYgOC44ODE5IDguOTgwMiA4Ljg4MTl6IiBmaWxsPSJ1cmwoI2MpIi8+PC9zdmc+'
}, {
  id: 'Coinbase Wallet',
  name: 'Coinbase Wallet',
  url: 'https://www.coinbase.com/wallet',
  icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8Y2lyY2xlIGN4PSI1MTIiIGN5PSI1MTIiIHI9IjUxMiIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE1MiA1MTJDMTUyIDcxMC44MjMgMzEzLjE3NyA4NzIgNTEyIDg3MkM3MTAuODIzIDg3MiA4NzIgNzEwLjgyMyA4NzIgNTEyQzg3MiAzMTMuMTc3IDcxMC44MjMgMTUyIDUxMiAxNTJDMzEzLjE3NyAxNTIgMTUyIDMxMy4xNzcgMTUyIDUxMlpNNDIwIDM5NkM0MDYuNzQ1IDM5NiAzOTYgNDA2Ljc0NSAzOTYgNDIwVjYwNEMzOTYgNjE3LjI1NSA0MDYuNzQ1IDYyOCA0MjAgNjI4SDYwNEM2MTcuMjU1IDYyOCA2MjggNjE3LjI1NSA2MjggNjA0VjQyMEM2MjggNDA2Ljc0NSA2MTcuMjU1IDM5NiA2MDQgMzk2SDQyMFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='
}, {
  id: 'OKX Wallet',
  name: 'OKX Wallet',
  url: 'https://www.okx.com/web3',
  icon: 'https://station.jup.ag/img/wallet/glow.png'
}];

function _EMOTION_STRINGIFIED_CSS_ERROR__$3() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const styles$2 = {
  subtitle: {
    light: [{
      "color": "rgb(0 0 0 / 0.7)"
    }],
    dark: [{
      "color": "rgb(255 255 255 / 0.5)"
    }],
    jupiter: [{
      "color": "rgb(255 255 255 / 0.5)"
    }]
  },
  button: {
    light: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(49 51 59 / var(--tw-bg-opacity))",
      "--tw-text-opacity": "1",
      "color": "rgb(255 255 255 / var(--tw-text-opacity))",
      ":hover": {
        "--tw-bg-opacity": "1",
        "backgroundColor": "rgb(0 0 0 / var(--tw-bg-opacity))"
      }
    }],
    dark: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(49 51 59 / var(--tw-bg-opacity))",
      ":hover": {
        "backgroundColor": "rgb(0 0 0 / 0.3)"
      }
    }],
    jupiter: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(0 0 0 / var(--tw-bg-opacity))",
      ":hover": {
        "backgroundColor": "rgb(0 0 0 / 0.5)"
      }
    }]
  },
  walletButton: {
    light: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(249 250 251 / var(--tw-bg-opacity))",
      ":hover": {
        "backgroundColor": "rgb(0 0 0 / 0.05)"
      }
    }],
    dark: [{
      "borderWidth": "1px",
      "borderColor": "rgb(255 255 255 / 0.1)",
      "backgroundColor": "rgb(255 255 255 / 0.1)",
      "--tw-shadow": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      "--tw-shadow-colored": "0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color)",
      "boxShadow": "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)",
      ":hover": {
        "backgroundColor": "rgb(255 255 255 / 0.2)"
      }
    }],
    jupiter: [{
      "borderWidth": "1px",
      "borderColor": "rgb(255 255 255 / 0.1)",
      "backgroundColor": "rgb(255 255 255 / 0.05)",
      "--tw-shadow": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      "--tw-shadow-colored": "0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color)",
      "boxShadow": "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)",
      ":hover": {
        "backgroundColor": "rgb(255 255 255 / 0.2)"
      }
    }]
  },
  externalIcon: {
    light: [{
      "color": "rgb(0 0 0 / 0.3)"
    }],
    dark: [{
      "color": "rgb(255 255 255 / 0.3)"
    }],
    jupiter: [{
      "color": "rgb(255 255 255 / 0.3)"
    }]
  },
  pillBadge: {
    light: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(134 239 172 / var(--tw-bg-opacity))"
    }],
    dark: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(22 163 74 / var(--tw-bg-opacity))"
    }],
    jupiter: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(22 163 74 / var(--tw-bg-opacity))"
    }]
  }
};
var _ref$3 = process.env.NODE_ENV === "production" ? {
  name: "tfnfo2",
  styles: "display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2.5rem"
} : {
  name: "1jb9ul5-OnboardingIntro",
  styles: "display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2.5rem;label:OnboardingIntro;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$3
};
var _ref2$3 = process.env.NODE_ENV === "production" ? {
  name: "1u83koa",
  styles: "margin-top:1rem;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center"
} : {
  name: "1xegtr4-OnboardingIntro",
  styles: "margin-top:1rem;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;label:OnboardingIntro;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$3
};
var _ref3$3 = process.env.NODE_ENV === "production" ? {
  name: "b3sgxl",
  styles: "font-size:1.125rem;line-height:1.75rem;font-weight:600"
} : {
  name: "1efuzdh-OnboardingIntro",
  styles: "font-size:1.125rem;line-height:1.75rem;font-weight:600;label:OnboardingIntro;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$3
};
var _ref4$2 = process.env.NODE_ENV === "production" ? {
  name: "1aejh3u",
  styles: "margin-top:1.5rem;width:100%"
} : {
  name: "1pzwn1m-OnboardingIntro",
  styles: "margin-top:1.5rem;width:100%;label:OnboardingIntro;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$3
};
const OnboardingIntro = ({
  flow,
  setFlow,
  onClose,
  showBack
}) => {
  const {
    theme
  } = useUnifiedWalletContext();
  const {
    t
  } = useTranslation();
  return jsx("div", {
    css: _ref$3
  }, jsx("img", {
    src: 'https://unified.jup.ag/new_user_onboarding.png',
    width: 160,
    height: 160
  }), jsx("div", {
    css: _ref2$3
  }, jsx("span", {
    css: _ref3$3
  }, t(`New here?`)), jsx("span", {
    css: ["margin-top:0.75rem;font-size:0.875rem;line-height:1.25rem;", styles$2.subtitle[theme], process.env.NODE_ENV === "production" ? "" : ";label:OnboardingIntro;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWtEaUMiLCJmaWxlIjoiT25ib2FyZGluZy50c3giLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgSEFSRENPREVEX1dBTExFVF9TVEFOREFSRFMgfSBmcm9tICcuLi8uLi9taXNjL2NvbnN0YW50cyc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IEV4dGVybmFsSWNvbiBmcm9tICcuLi9pY29ucy9FeHRlcm5hbEljb24nO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay83MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgYnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bIzMxMzMzQl0gdGV4dC13aGl0ZSBob3ZlcjpiZy1ibGFja2BdLFxuICAgIGRhcms6IFt0d2BiZy1bIzMxMzMzQl0gaG92ZXI6YmctYmxhY2svMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctYmxhY2sgaG92ZXI6YmctYmxhY2svNTBgXSxcbiAgfSxcbiAgd2FsbGV0QnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bI0Y5RkFGQl0gaG92ZXI6YmctYmxhY2svNWBdLFxuICAgIGRhcms6IFt0d2BiZy13aGl0ZS8xMCBob3ZlcjpiZy13aGl0ZS8yMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHNoYWRvdy1sZ2BdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gIH0sXG4gIGV4dGVybmFsSWNvbjoge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay8zMGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzMwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgfSxcbiAgcGlsbEJhZGdlOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmVlbi0zMDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyZWVuLTYwMGBdLFxuICB9XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0ludHJvOiBSZWFjdC5GQzx7XG4gIGZsb3c6IElPbmJvYXJkaW5nRmxvdztcbiAgc2V0RmxvdzogKGZsb3c6IElPbmJvYXJkaW5nRmxvdykgPT4gdm9pZDtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbiAgc2hvd0JhY2s6IGJvb2xlYW47XG59PiA9ICh7IGZsb3csIHNldEZsb3csIG9uQ2xvc2UsIHNob3dCYWNrIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHAtMTBcIj5cbiAgICAgIDxpbWcgc3JjPXsnaHR0cHM6Ly91bmlmaWVkLmp1cC5hZy9uZXdfdXNlcl9vbmJvYXJkaW5nLnBuZyd9IHdpZHRoPXsxNjB9IGhlaWdodD17MTYwfSAvPlxuXG4gICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGp1c3RpZnktY2VudGVyIGl0ZW1zLWNlbnRlciB0ZXh0LWNlbnRlclwiPlxuICAgICAgICA8c3BhbiB0dz1cInRleHQtbGcgZm9udC1zZW1pYm9sZFwiPnt0KGBOZXcgaGVyZT9gKX08L3NwYW4+XG4gICAgICAgIDxzcGFuIHR3PVwibXQtMyB0ZXh0LXNtIFwiIGNzcz17W3N0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICB7dChgV2VsY29tZSB0byBTb2xhbmFGTSEgQ3JlYXRlIGEgY3J5cHRvIHdhbGxldCB0byBnZXQgc3RhcnRlZCFgKX1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC02IHctZnVsbFwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXdoaXRlIGZvbnQtc2VtaWJvbGQgdGV4dC1iYXNlIHctZnVsbCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcHktNSBsZWFkaW5nLW5vbmVgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRGbG93KCdHZXQgV2FsbGV0Jyl9XG4gICAgICAgID5cbiAgICAgICAgICB7dChgR2V0IFN0YXJ0ZWRgKX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIHtzaG93QmFjayAmJiAoXG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgICAgb25DbGljaz17KCkgPT4gb25DbG9zZSgpfVxuICAgICAgICA+XG4gICAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdHZXRXYWxsZXRzOiBSZWFjdC5GQzx7IGZsb3c6IElPbmJvYXJkaW5nRmxvdzsgc2V0RmxvdzogKGZsb3c6IElPbmJvYXJkaW5nRmxvdykgPT4gdm9pZCB9PiA9ICh7XG4gIGZsb3csXG4gIHNldEZsb3csXG59KSA9PiB7XG4gIGNvbnN0IHsgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgdHc9XCJmbGV4IGZsZXgtY29sIGp1c3RpZnktY2VudGVyIHB5LTMgcHgtMTBcIj5cbiAgICAgIDxzcGFuIHR3PVwidGV4dC1iYXNlIGZvbnQtc2VtaWJvbGRcIj57dChgUG9wdWxhciB3YWxsZXRzIHRvIGdldCBzdGFydGVkYCl9PC9zcGFuPlxuICAgICAgPGRpdiB0dz1cIm10LTQgdy1mdWxsIHNwYWNlLXktMlwiPlxuICAgICAgICB7SEFSRENPREVEX1dBTExFVF9TVEFOREFSRFMubWFwKChpdGVtLCBpZHgpID0+IHtcbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGFcbiAgICAgICAgICAgICAgaHJlZj17aXRlbS51cmx9XG4gICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIlxuICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEJ1dHRvblt0aGVtZV0sXG4gICAgICAgICAgICAgIF19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxpbWcgc3JjPXtpdGVtLmljb259IHdpZHRoPXsyMH0gaGVpZ2h0PXsyMH0gYWx0PXtpdGVtLm5hbWV9IC8+XG4gICAgICAgICAgICAgIDxzcGFuPntpdGVtLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICB7aWR4ID09PSAwICYmIDxkaXYgY3NzPXtbdHdgcm91bmRlZC1mdWxsIHB4LTIgdGV4dC14c2AsIHN0eWxlcy5waWxsQmFkZ2VbdGhlbWVdXX0+UmVjb21tZW5kZWQ8L2Rpdj59XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgKTtcbiAgICAgICAgfSl9XG5cbiAgICAgICAgPGFcbiAgICAgICAgICBocmVmPXsnaHR0cHM6Ly9zdGF0aW9uLmp1cC5hZy9wYXJ0bmVycz9jYXRlZ29yeT1XYWxsZXRzJ31cbiAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgcHgtNSBweS00IGZsZXggc3BhY2UteC00IHctZnVsbCByb3VuZGVkLWxnIHRleHQtc20gZm9udC1zZW1pYm9sZCBpdGVtcy1jZW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLndhbGxldEJ1dHRvblt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgZmlsbC1jdXJyZW50IHctNSBoLTUgZmxleCBpdGVtcy1jZW50ZXIgcC0wLjVgLCBzdHlsZXMuZXh0ZXJuYWxJY29uW3RoZW1lXV19PlxuICAgICAgICAgICAgPEV4dGVybmFsSWNvbiB3aWR0aD17MTZ9IGhlaWdodD17MTZ9IC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHNwYW4+e3QoYE1vcmUgd2FsbGV0c2ApfTwvc3Bhbj5cbiAgICAgICAgPC9hPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxzcGFuIGNzcz17W3R3YG10LTMgdGV4dC1jZW50ZXIgdGV4dC14c2AsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT57dChgT25jZSBpbnN0YWxsZWQsIHJlZnJlc2ggdGhpcyBwYWdlYCl9PC9zcGFuPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY3NzPXtbdHdgbXQtMyB0ZXh0LXhzIHRleHQtd2hpdGUvNTAgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRGbG93KCdPbmJvYXJkaW5nJyl9XG4gICAgICA+XG4gICAgICAgIHsn4oaQICcgKyB0KGBHbyBiYWNrYCl9XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCB0eXBlIElPbmJvYXJkaW5nRmxvdyA9ICdPbmJvYXJkaW5nJyB8ICdHZXQgV2FsbGV0JztcbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nRmxvdyA9ICh7IG9uQ2xvc2UsIHNob3dCYWNrIH06IHsgb25DbG9zZTogKCkgPT4gdm9pZDsgc2hvd0JhY2s6IGJvb2xlYW4gfSkgPT4ge1xuICBjb25zdCBbZmxvdywgc2V0Rmxvd10gPSB1c2VTdGF0ZTxJT25ib2FyZGluZ0Zsb3c+KCdPbmJvYXJkaW5nJyk7XG4gIGNvbnN0IFthbmltYXRlT3V0LCBzZXRBbmltYXRlT3V0XSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgY29uc3Qgc2V0Rmxvd0FuaW1hdGVkID0gKGZsb3c6IElPbmJvYXJkaW5nRmxvdykgPT4ge1xuICAgIHNldEFuaW1hdGVPdXQodHJ1ZSk7XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnRlbnRSZWYuY3VycmVudD8uc2Nyb2xsVG8oMCwgMCk7XG4gICAgICBzZXRBbmltYXRlT3V0KGZhbHNlKTtcbiAgICAgIHNldEZsb3coZmxvdyk7XG4gICAgfSwgMjAwKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W3R3YGR1cmF0aW9uLTUwMCBhbmltYXRlLWZhZGUtaW4gb3ZlcmZsb3cteS1zY3JvbGxgLCBhbmltYXRlT3V0ID8gdHdgYW5pbWF0ZS1mYWRlLW91dCBvcGFjaXR5LTBgIDogJyddfVxuICAgICAgY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiXG4gICAgPlxuICAgICAge2Zsb3cgPT09ICdPbmJvYXJkaW5nJyA/IChcbiAgICAgICAgPE9uYm9hcmRpbmdJbnRybyBzaG93QmFjaz17c2hvd0JhY2t9IGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgICkgOiBudWxsfVxuICAgICAge2Zsb3cgPT09ICdHZXQgV2FsbGV0JyA/IDxPbmJvYXJkaW5nR2V0V2FsbGV0cyBmbG93PXtmbG93fSBzZXRGbG93PXtzZXRGbG93QW5pbWF0ZWR9IC8+IDogbnVsbH1cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:OnboardingIntro;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWtEaUMiLCJmaWxlIjoiT25ib2FyZGluZy50c3giLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgSEFSRENPREVEX1dBTExFVF9TVEFOREFSRFMgfSBmcm9tICcuLi8uLi9taXNjL2NvbnN0YW50cyc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IEV4dGVybmFsSWNvbiBmcm9tICcuLi9pY29ucy9FeHRlcm5hbEljb24nO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay83MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgYnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bIzMxMzMzQl0gdGV4dC13aGl0ZSBob3ZlcjpiZy1ibGFja2BdLFxuICAgIGRhcms6IFt0d2BiZy1bIzMxMzMzQl0gaG92ZXI6YmctYmxhY2svMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctYmxhY2sgaG92ZXI6YmctYmxhY2svNTBgXSxcbiAgfSxcbiAgd2FsbGV0QnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bI0Y5RkFGQl0gaG92ZXI6YmctYmxhY2svNWBdLFxuICAgIGRhcms6IFt0d2BiZy13aGl0ZS8xMCBob3ZlcjpiZy13aGl0ZS8yMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHNoYWRvdy1sZ2BdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gIH0sXG4gIGV4dGVybmFsSWNvbjoge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay8zMGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzMwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgfSxcbiAgcGlsbEJhZGdlOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmVlbi0zMDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyZWVuLTYwMGBdLFxuICB9XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0ludHJvOiBSZWFjdC5GQzx7XG4gIGZsb3c6IElPbmJvYXJkaW5nRmxvdztcbiAgc2V0RmxvdzogKGZsb3c6IElPbmJvYXJkaW5nRmxvdykgPT4gdm9pZDtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbiAgc2hvd0JhY2s6IGJvb2xlYW47XG59PiA9ICh7IGZsb3csIHNldEZsb3csIG9uQ2xvc2UsIHNob3dCYWNrIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHAtMTBcIj5cbiAgICAgIDxpbWcgc3JjPXsnaHR0cHM6Ly91bmlmaWVkLmp1cC5hZy9uZXdfdXNlcl9vbmJvYXJkaW5nLnBuZyd9IHdpZHRoPXsxNjB9IGhlaWdodD17MTYwfSAvPlxuXG4gICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGp1c3RpZnktY2VudGVyIGl0ZW1zLWNlbnRlciB0ZXh0LWNlbnRlclwiPlxuICAgICAgICA8c3BhbiB0dz1cInRleHQtbGcgZm9udC1zZW1pYm9sZFwiPnt0KGBOZXcgaGVyZT9gKX08L3NwYW4+XG4gICAgICAgIDxzcGFuIHR3PVwibXQtMyB0ZXh0LXNtIFwiIGNzcz17W3N0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICB7dChgV2VsY29tZSB0byBTb2xhbmFGTSEgQ3JlYXRlIGEgY3J5cHRvIHdhbGxldCB0byBnZXQgc3RhcnRlZCFgKX1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC02IHctZnVsbFwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXdoaXRlIGZvbnQtc2VtaWJvbGQgdGV4dC1iYXNlIHctZnVsbCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcHktNSBsZWFkaW5nLW5vbmVgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRGbG93KCdHZXQgV2FsbGV0Jyl9XG4gICAgICAgID5cbiAgICAgICAgICB7dChgR2V0IFN0YXJ0ZWRgKX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIHtzaG93QmFjayAmJiAoXG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgICAgb25DbGljaz17KCkgPT4gb25DbG9zZSgpfVxuICAgICAgICA+XG4gICAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdHZXRXYWxsZXRzOiBSZWFjdC5GQzx7IGZsb3c6IElPbmJvYXJkaW5nRmxvdzsgc2V0RmxvdzogKGZsb3c6IElPbmJvYXJkaW5nRmxvdykgPT4gdm9pZCB9PiA9ICh7XG4gIGZsb3csXG4gIHNldEZsb3csXG59KSA9PiB7XG4gIGNvbnN0IHsgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgdHc9XCJmbGV4IGZsZXgtY29sIGp1c3RpZnktY2VudGVyIHB5LTMgcHgtMTBcIj5cbiAgICAgIDxzcGFuIHR3PVwidGV4dC1iYXNlIGZvbnQtc2VtaWJvbGRcIj57dChgUG9wdWxhciB3YWxsZXRzIHRvIGdldCBzdGFydGVkYCl9PC9zcGFuPlxuICAgICAgPGRpdiB0dz1cIm10LTQgdy1mdWxsIHNwYWNlLXktMlwiPlxuICAgICAgICB7SEFSRENPREVEX1dBTExFVF9TVEFOREFSRFMubWFwKChpdGVtLCBpZHgpID0+IHtcbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGFcbiAgICAgICAgICAgICAgaHJlZj17aXRlbS51cmx9XG4gICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIlxuICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEJ1dHRvblt0aGVtZV0sXG4gICAgICAgICAgICAgIF19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxpbWcgc3JjPXtpdGVtLmljb259IHdpZHRoPXsyMH0gaGVpZ2h0PXsyMH0gYWx0PXtpdGVtLm5hbWV9IC8+XG4gICAgICAgICAgICAgIDxzcGFuPntpdGVtLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICB7aWR4ID09PSAwICYmIDxkaXYgY3NzPXtbdHdgcm91bmRlZC1mdWxsIHB4LTIgdGV4dC14c2AsIHN0eWxlcy5waWxsQmFkZ2VbdGhlbWVdXX0+UmVjb21tZW5kZWQ8L2Rpdj59XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgKTtcbiAgICAgICAgfSl9XG5cbiAgICAgICAgPGFcbiAgICAgICAgICBocmVmPXsnaHR0cHM6Ly9zdGF0aW9uLmp1cC5hZy9wYXJ0bmVycz9jYXRlZ29yeT1XYWxsZXRzJ31cbiAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgcHgtNSBweS00IGZsZXggc3BhY2UteC00IHctZnVsbCByb3VuZGVkLWxnIHRleHQtc20gZm9udC1zZW1pYm9sZCBpdGVtcy1jZW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLndhbGxldEJ1dHRvblt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgZmlsbC1jdXJyZW50IHctNSBoLTUgZmxleCBpdGVtcy1jZW50ZXIgcC0wLjVgLCBzdHlsZXMuZXh0ZXJuYWxJY29uW3RoZW1lXV19PlxuICAgICAgICAgICAgPEV4dGVybmFsSWNvbiB3aWR0aD17MTZ9IGhlaWdodD17MTZ9IC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHNwYW4+e3QoYE1vcmUgd2FsbGV0c2ApfTwvc3Bhbj5cbiAgICAgICAgPC9hPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxzcGFuIGNzcz17W3R3YG10LTMgdGV4dC1jZW50ZXIgdGV4dC14c2AsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT57dChgT25jZSBpbnN0YWxsZWQsIHJlZnJlc2ggdGhpcyBwYWdlYCl9PC9zcGFuPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY3NzPXtbdHdgbXQtMyB0ZXh0LXhzIHRleHQtd2hpdGUvNTAgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRGbG93KCdPbmJvYXJkaW5nJyl9XG4gICAgICA+XG4gICAgICAgIHsn4oaQICcgKyB0KGBHbyBiYWNrYCl9XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCB0eXBlIElPbmJvYXJkaW5nRmxvdyA9ICdPbmJvYXJkaW5nJyB8ICdHZXQgV2FsbGV0JztcbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nRmxvdyA9ICh7IG9uQ2xvc2UsIHNob3dCYWNrIH06IHsgb25DbG9zZTogKCkgPT4gdm9pZDsgc2hvd0JhY2s6IGJvb2xlYW4gfSkgPT4ge1xuICBjb25zdCBbZmxvdywgc2V0Rmxvd10gPSB1c2VTdGF0ZTxJT25ib2FyZGluZ0Zsb3c+KCdPbmJvYXJkaW5nJyk7XG4gIGNvbnN0IFthbmltYXRlT3V0LCBzZXRBbmltYXRlT3V0XSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgY29uc3Qgc2V0Rmxvd0FuaW1hdGVkID0gKGZsb3c6IElPbmJvYXJkaW5nRmxvdykgPT4ge1xuICAgIHNldEFuaW1hdGVPdXQodHJ1ZSk7XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnRlbnRSZWYuY3VycmVudD8uc2Nyb2xsVG8oMCwgMCk7XG4gICAgICBzZXRBbmltYXRlT3V0KGZhbHNlKTtcbiAgICAgIHNldEZsb3coZmxvdyk7XG4gICAgfSwgMjAwKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W3R3YGR1cmF0aW9uLTUwMCBhbmltYXRlLWZhZGUtaW4gb3ZlcmZsb3cteS1zY3JvbGxgLCBhbmltYXRlT3V0ID8gdHdgYW5pbWF0ZS1mYWRlLW91dCBvcGFjaXR5LTBgIDogJyddfVxuICAgICAgY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiXG4gICAgPlxuICAgICAge2Zsb3cgPT09ICdPbmJvYXJkaW5nJyA/IChcbiAgICAgICAgPE9uYm9hcmRpbmdJbnRybyBzaG93QmFjaz17c2hvd0JhY2t9IGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgICkgOiBudWxsfVxuICAgICAge2Zsb3cgPT09ICdHZXQgV2FsbGV0JyA/IDxPbmJvYXJkaW5nR2V0V2FsbGV0cyBmbG93PXtmbG93fSBzZXRGbG93PXtzZXRGbG93QW5pbWF0ZWR9IC8+IDogbnVsbH1cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG4iXX0= */"]
  }, t(`Welcome to SolanaFM! Create a crypto wallet to get started!`))), jsx("div", {
    css: _ref4$2
  }, jsx("button", {
    type: "button",
    css: ["width:100%;border-radius:0.5rem;border-width:1px;border-color:rgb(255 255 255 / 0.1);padding-top:1.25rem;padding-bottom:1.25rem;font-size:1rem;line-height:1;font-weight:600;--tw-text-opacity:1;color:rgb(255 255 255 / var(--tw-text-opacity));", styles$2.button[theme], process.env.NODE_ENV === "production" ? "" : ";label:OnboardingIntro;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTBEVSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:OnboardingIntro;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTBEVSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */"],
    onClick: () => setFlow('Get Wallet')
  }, t(`Get Started`))), showBack && jsx("button", {
    type: "button",
    css: ["margin-top:0.75rem;font-size:0.75rem;line-height:1rem;font-weight:600;color:rgb(255 255 255 / 0.5);", styles$2.subtitle[theme], process.env.NODE_ENV === "production" ? "" : ";label:OnboardingIntro;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXNFVSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:OnboardingIntro;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXNFVSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */"],
    onClick: () => onClose()
  }, '← ' + t(`Go back`)));
};
var _ref5$1 = process.env.NODE_ENV === "production" ? {
  name: "1hxjivg",
  styles: "display:flex;flex-direction:column;justify-content:center;padding-left:2.5rem;padding-right:2.5rem;padding-top:0.75rem;padding-bottom:0.75rem"
} : {
  name: "1yquh8a-OnboardingGetWallets",
  styles: "display:flex;flex-direction:column;justify-content:center;padding-left:2.5rem;padding-right:2.5rem;padding-top:0.75rem;padding-bottom:0.75rem;label:OnboardingGetWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$3
};
var _ref6$1 = process.env.NODE_ENV === "production" ? {
  name: "709dbi",
  styles: "font-size:1rem;line-height:1.5rem;font-weight:600"
} : {
  name: "1b4as19-OnboardingGetWallets",
  styles: "font-size:1rem;line-height:1.5rem;font-weight:600;label:OnboardingGetWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$3
};
var _ref7$1 = process.env.NODE_ENV === "production" ? {
  name: "vgb2l1",
  styles: "margin-top:1rem;width:100%;> :not([hidden]) ~ :not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse));}"
} : {
  name: "r6mwf6-OnboardingGetWallets",
  styles: "margin-top:1rem;width:100%;> :not([hidden]) ~ :not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse));};label:OnboardingGetWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$3
};
const OnboardingGetWallets = ({
  flow,
  setFlow
}) => {
  const {
    theme
  } = useUnifiedWalletContext();
  const {
    t
  } = useTranslation();
  return jsx("div", {
    css: _ref5$1
  }, jsx("span", {
    css: _ref6$1
  }, t(`Popular wallets to get started`)), jsx("div", {
    css: _ref7$1
  }, HARDCODED_WALLET_STANDARDS.map((item, idx) => {
    return jsx("a", {
      href: item.url,
      key: idx,
      target: "_blank",
      css: ["display:flex;width:100%;align-items:center;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(1rem * var(--tw-space-x-reverse));margin-left:calc(1rem * calc(1 - var(--tw-space-x-reverse)));}border-radius:0.5rem;padding-left:1.25rem;padding-right:1.25rem;padding-top:1rem;padding-bottom:1rem;font-size:0.875rem;line-height:1.25rem;font-weight:600;", styles$2.walletButton[theme], process.env.NODE_ENV === "production" ? "" : ";label:OnboardingGetWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWlHYyIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:OnboardingGetWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWlHYyIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */"]
    }, jsx("img", {
      src: item.icon,
      width: 20,
      height: 20,
      alt: item.name
    }), jsx("span", null, item.name), idx === 0 && jsx("div", {
      css: ["border-radius:9999px;padding-left:0.5rem;padding-right:0.5rem;font-size:0.75rem;line-height:1rem;", styles$2.pillBadge[theme], process.env.NODE_ENV === "production" ? "" : ";label:OnboardingGetWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXdHaUMiLCJmaWxlIjoiT25ib2FyZGluZy50c3giLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgSEFSRENPREVEX1dBTExFVF9TVEFOREFSRFMgfSBmcm9tICcuLi8uLi9taXNjL2NvbnN0YW50cyc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IEV4dGVybmFsSWNvbiBmcm9tICcuLi9pY29ucy9FeHRlcm5hbEljb24nO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay83MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgYnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bIzMxMzMzQl0gdGV4dC13aGl0ZSBob3ZlcjpiZy1ibGFja2BdLFxuICAgIGRhcms6IFt0d2BiZy1bIzMxMzMzQl0gaG92ZXI6YmctYmxhY2svMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctYmxhY2sgaG92ZXI6YmctYmxhY2svNTBgXSxcbiAgfSxcbiAgd2FsbGV0QnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bI0Y5RkFGQl0gaG92ZXI6YmctYmxhY2svNWBdLFxuICAgIGRhcms6IFt0d2BiZy13aGl0ZS8xMCBob3ZlcjpiZy13aGl0ZS8yMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHNoYWRvdy1sZ2BdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gIH0sXG4gIGV4dGVybmFsSWNvbjoge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay8zMGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzMwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgfSxcbiAgcGlsbEJhZGdlOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmVlbi0zMDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyZWVuLTYwMGBdLFxuICB9XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0ludHJvOiBSZWFjdC5GQzx7XG4gIGZsb3c6IElPbmJvYXJkaW5nRmxvdztcbiAgc2V0RmxvdzogKGZsb3c6IElPbmJvYXJkaW5nRmxvdykgPT4gdm9pZDtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbiAgc2hvd0JhY2s6IGJvb2xlYW47XG59PiA9ICh7IGZsb3csIHNldEZsb3csIG9uQ2xvc2UsIHNob3dCYWNrIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHAtMTBcIj5cbiAgICAgIDxpbWcgc3JjPXsnaHR0cHM6Ly91bmlmaWVkLmp1cC5hZy9uZXdfdXNlcl9vbmJvYXJkaW5nLnBuZyd9IHdpZHRoPXsxNjB9IGhlaWdodD17MTYwfSAvPlxuXG4gICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGp1c3RpZnktY2VudGVyIGl0ZW1zLWNlbnRlciB0ZXh0LWNlbnRlclwiPlxuICAgICAgICA8c3BhbiB0dz1cInRleHQtbGcgZm9udC1zZW1pYm9sZFwiPnt0KGBOZXcgaGVyZT9gKX08L3NwYW4+XG4gICAgICAgIDxzcGFuIHR3PVwibXQtMyB0ZXh0LXNtIFwiIGNzcz17W3N0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICB7dChgV2VsY29tZSB0byBTb2xhbmFGTSEgQ3JlYXRlIGEgY3J5cHRvIHdhbGxldCB0byBnZXQgc3RhcnRlZCFgKX1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC02IHctZnVsbFwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXdoaXRlIGZvbnQtc2VtaWJvbGQgdGV4dC1iYXNlIHctZnVsbCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcHktNSBsZWFkaW5nLW5vbmVgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRGbG93KCdHZXQgV2FsbGV0Jyl9XG4gICAgICAgID5cbiAgICAgICAgICB7dChgR2V0IFN0YXJ0ZWRgKX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIHtzaG93QmFjayAmJiAoXG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgICAgb25DbGljaz17KCkgPT4gb25DbG9zZSgpfVxuICAgICAgICA+XG4gICAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdHZXRXYWxsZXRzOiBSZWFjdC5GQzx7IGZsb3c6IElPbmJvYXJkaW5nRmxvdzsgc2V0RmxvdzogKGZsb3c6IElPbmJvYXJkaW5nRmxvdykgPT4gdm9pZCB9PiA9ICh7XG4gIGZsb3csXG4gIHNldEZsb3csXG59KSA9PiB7XG4gIGNvbnN0IHsgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgdHc9XCJmbGV4IGZsZXgtY29sIGp1c3RpZnktY2VudGVyIHB5LTMgcHgtMTBcIj5cbiAgICAgIDxzcGFuIHR3PVwidGV4dC1iYXNlIGZvbnQtc2VtaWJvbGRcIj57dChgUG9wdWxhciB3YWxsZXRzIHRvIGdldCBzdGFydGVkYCl9PC9zcGFuPlxuICAgICAgPGRpdiB0dz1cIm10LTQgdy1mdWxsIHNwYWNlLXktMlwiPlxuICAgICAgICB7SEFSRENPREVEX1dBTExFVF9TVEFOREFSRFMubWFwKChpdGVtLCBpZHgpID0+IHtcbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGFcbiAgICAgICAgICAgICAgaHJlZj17aXRlbS51cmx9XG4gICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIlxuICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEJ1dHRvblt0aGVtZV0sXG4gICAgICAgICAgICAgIF19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxpbWcgc3JjPXtpdGVtLmljb259IHdpZHRoPXsyMH0gaGVpZ2h0PXsyMH0gYWx0PXtpdGVtLm5hbWV9IC8+XG4gICAgICAgICAgICAgIDxzcGFuPntpdGVtLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICB7aWR4ID09PSAwICYmIDxkaXYgY3NzPXtbdHdgcm91bmRlZC1mdWxsIHB4LTIgdGV4dC14c2AsIHN0eWxlcy5waWxsQmFkZ2VbdGhlbWVdXX0+UmVjb21tZW5kZWQ8L2Rpdj59XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgKTtcbiAgICAgICAgfSl9XG5cbiAgICAgICAgPGFcbiAgICAgICAgICBocmVmPXsnaHR0cHM6Ly9zdGF0aW9uLmp1cC5hZy9wYXJ0bmVycz9jYXRlZ29yeT1XYWxsZXRzJ31cbiAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgcHgtNSBweS00IGZsZXggc3BhY2UteC00IHctZnVsbCByb3VuZGVkLWxnIHRleHQtc20gZm9udC1zZW1pYm9sZCBpdGVtcy1jZW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLndhbGxldEJ1dHRvblt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgZmlsbC1jdXJyZW50IHctNSBoLTUgZmxleCBpdGVtcy1jZW50ZXIgcC0wLjVgLCBzdHlsZXMuZXh0ZXJuYWxJY29uW3RoZW1lXV19PlxuICAgICAgICAgICAgPEV4dGVybmFsSWNvbiB3aWR0aD17MTZ9IGhlaWdodD17MTZ9IC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHNwYW4+e3QoYE1vcmUgd2FsbGV0c2ApfTwvc3Bhbj5cbiAgICAgICAgPC9hPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxzcGFuIGNzcz17W3R3YG10LTMgdGV4dC1jZW50ZXIgdGV4dC14c2AsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT57dChgT25jZSBpbnN0YWxsZWQsIHJlZnJlc2ggdGhpcyBwYWdlYCl9PC9zcGFuPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY3NzPXtbdHdgbXQtMyB0ZXh0LXhzIHRleHQtd2hpdGUvNTAgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRGbG93KCdPbmJvYXJkaW5nJyl9XG4gICAgICA+XG4gICAgICAgIHsn4oaQICcgKyB0KGBHbyBiYWNrYCl9XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCB0eXBlIElPbmJvYXJkaW5nRmxvdyA9ICdPbmJvYXJkaW5nJyB8ICdHZXQgV2FsbGV0JztcbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nRmxvdyA9ICh7IG9uQ2xvc2UsIHNob3dCYWNrIH06IHsgb25DbG9zZTogKCkgPT4gdm9pZDsgc2hvd0JhY2s6IGJvb2xlYW4gfSkgPT4ge1xuICBjb25zdCBbZmxvdywgc2V0Rmxvd10gPSB1c2VTdGF0ZTxJT25ib2FyZGluZ0Zsb3c+KCdPbmJvYXJkaW5nJyk7XG4gIGNvbnN0IFthbmltYXRlT3V0LCBzZXRBbmltYXRlT3V0XSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgY29uc3Qgc2V0Rmxvd0FuaW1hdGVkID0gKGZsb3c6IElPbmJvYXJkaW5nRmxvdykgPT4ge1xuICAgIHNldEFuaW1hdGVPdXQodHJ1ZSk7XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnRlbnRSZWYuY3VycmVudD8uc2Nyb2xsVG8oMCwgMCk7XG4gICAgICBzZXRBbmltYXRlT3V0KGZhbHNlKTtcbiAgICAgIHNldEZsb3coZmxvdyk7XG4gICAgfSwgMjAwKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W3R3YGR1cmF0aW9uLTUwMCBhbmltYXRlLWZhZGUtaW4gb3ZlcmZsb3cteS1zY3JvbGxgLCBhbmltYXRlT3V0ID8gdHdgYW5pbWF0ZS1mYWRlLW91dCBvcGFjaXR5LTBgIDogJyddfVxuICAgICAgY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiXG4gICAgPlxuICAgICAge2Zsb3cgPT09ICdPbmJvYXJkaW5nJyA/IChcbiAgICAgICAgPE9uYm9hcmRpbmdJbnRybyBzaG93QmFjaz17c2hvd0JhY2t9IGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgICkgOiBudWxsfVxuICAgICAge2Zsb3cgPT09ICdHZXQgV2FsbGV0JyA/IDxPbmJvYXJkaW5nR2V0V2FsbGV0cyBmbG93PXtmbG93fSBzZXRGbG93PXtzZXRGbG93QW5pbWF0ZWR9IC8+IDogbnVsbH1cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:OnboardingGetWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXdHaUMiLCJmaWxlIjoiT25ib2FyZGluZy50c3giLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgSEFSRENPREVEX1dBTExFVF9TVEFOREFSRFMgfSBmcm9tICcuLi8uLi9taXNjL2NvbnN0YW50cyc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IEV4dGVybmFsSWNvbiBmcm9tICcuLi9pY29ucy9FeHRlcm5hbEljb24nO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay83MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgYnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bIzMxMzMzQl0gdGV4dC13aGl0ZSBob3ZlcjpiZy1ibGFja2BdLFxuICAgIGRhcms6IFt0d2BiZy1bIzMxMzMzQl0gaG92ZXI6YmctYmxhY2svMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctYmxhY2sgaG92ZXI6YmctYmxhY2svNTBgXSxcbiAgfSxcbiAgd2FsbGV0QnV0dG9uOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1bI0Y5RkFGQl0gaG92ZXI6YmctYmxhY2svNWBdLFxuICAgIGRhcms6IFt0d2BiZy13aGl0ZS8xMCBob3ZlcjpiZy13aGl0ZS8yMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHNoYWRvdy1sZ2BdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gIH0sXG4gIGV4dGVybmFsSWNvbjoge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay8zMGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzMwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgfSxcbiAgcGlsbEJhZGdlOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmVlbi0zMDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyZWVuLTYwMGBdLFxuICB9XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0ludHJvOiBSZWFjdC5GQzx7XG4gIGZsb3c6IElPbmJvYXJkaW5nRmxvdztcbiAgc2V0RmxvdzogKGZsb3c6IElPbmJvYXJkaW5nRmxvdykgPT4gdm9pZDtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbiAgc2hvd0JhY2s6IGJvb2xlYW47XG59PiA9ICh7IGZsb3csIHNldEZsb3csIG9uQ2xvc2UsIHNob3dCYWNrIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHAtMTBcIj5cbiAgICAgIDxpbWcgc3JjPXsnaHR0cHM6Ly91bmlmaWVkLmp1cC5hZy9uZXdfdXNlcl9vbmJvYXJkaW5nLnBuZyd9IHdpZHRoPXsxNjB9IGhlaWdodD17MTYwfSAvPlxuXG4gICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGp1c3RpZnktY2VudGVyIGl0ZW1zLWNlbnRlciB0ZXh0LWNlbnRlclwiPlxuICAgICAgICA8c3BhbiB0dz1cInRleHQtbGcgZm9udC1zZW1pYm9sZFwiPnt0KGBOZXcgaGVyZT9gKX08L3NwYW4+XG4gICAgICAgIDxzcGFuIHR3PVwibXQtMyB0ZXh0LXNtIFwiIGNzcz17W3N0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICB7dChgV2VsY29tZSB0byBTb2xhbmFGTSEgQ3JlYXRlIGEgY3J5cHRvIHdhbGxldCB0byBnZXQgc3RhcnRlZCFgKX1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC02IHctZnVsbFwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXdoaXRlIGZvbnQtc2VtaWJvbGQgdGV4dC1iYXNlIHctZnVsbCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcHktNSBsZWFkaW5nLW5vbmVgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRGbG93KCdHZXQgV2FsbGV0Jyl9XG4gICAgICAgID5cbiAgICAgICAgICB7dChgR2V0IFN0YXJ0ZWRgKX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICAgIHtzaG93QmFjayAmJiAoXG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgICAgb25DbGljaz17KCkgPT4gb25DbG9zZSgpfVxuICAgICAgICA+XG4gICAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgICAgPC9idXR0b24+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdHZXRXYWxsZXRzOiBSZWFjdC5GQzx7IGZsb3c6IElPbmJvYXJkaW5nRmxvdzsgc2V0RmxvdzogKGZsb3c6IElPbmJvYXJkaW5nRmxvdykgPT4gdm9pZCB9PiA9ICh7XG4gIGZsb3csXG4gIHNldEZsb3csXG59KSA9PiB7XG4gIGNvbnN0IHsgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgdHc9XCJmbGV4IGZsZXgtY29sIGp1c3RpZnktY2VudGVyIHB5LTMgcHgtMTBcIj5cbiAgICAgIDxzcGFuIHR3PVwidGV4dC1iYXNlIGZvbnQtc2VtaWJvbGRcIj57dChgUG9wdWxhciB3YWxsZXRzIHRvIGdldCBzdGFydGVkYCl9PC9zcGFuPlxuICAgICAgPGRpdiB0dz1cIm10LTQgdy1mdWxsIHNwYWNlLXktMlwiPlxuICAgICAgICB7SEFSRENPREVEX1dBTExFVF9TVEFOREFSRFMubWFwKChpdGVtLCBpZHgpID0+IHtcbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGFcbiAgICAgICAgICAgICAgaHJlZj17aXRlbS51cmx9XG4gICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIlxuICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEJ1dHRvblt0aGVtZV0sXG4gICAgICAgICAgICAgIF19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxpbWcgc3JjPXtpdGVtLmljb259IHdpZHRoPXsyMH0gaGVpZ2h0PXsyMH0gYWx0PXtpdGVtLm5hbWV9IC8+XG4gICAgICAgICAgICAgIDxzcGFuPntpdGVtLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICB7aWR4ID09PSAwICYmIDxkaXYgY3NzPXtbdHdgcm91bmRlZC1mdWxsIHB4LTIgdGV4dC14c2AsIHN0eWxlcy5waWxsQmFkZ2VbdGhlbWVdXX0+UmVjb21tZW5kZWQ8L2Rpdj59XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgKTtcbiAgICAgICAgfSl9XG5cbiAgICAgICAgPGFcbiAgICAgICAgICBocmVmPXsnaHR0cHM6Ly9zdGF0aW9uLmp1cC5hZy9wYXJ0bmVycz9jYXRlZ29yeT1XYWxsZXRzJ31cbiAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgcHgtNSBweS00IGZsZXggc3BhY2UteC00IHctZnVsbCByb3VuZGVkLWxnIHRleHQtc20gZm9udC1zZW1pYm9sZCBpdGVtcy1jZW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLndhbGxldEJ1dHRvblt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgZmlsbC1jdXJyZW50IHctNSBoLTUgZmxleCBpdGVtcy1jZW50ZXIgcC0wLjVgLCBzdHlsZXMuZXh0ZXJuYWxJY29uW3RoZW1lXV19PlxuICAgICAgICAgICAgPEV4dGVybmFsSWNvbiB3aWR0aD17MTZ9IGhlaWdodD17MTZ9IC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHNwYW4+e3QoYE1vcmUgd2FsbGV0c2ApfTwvc3Bhbj5cbiAgICAgICAgPC9hPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxzcGFuIGNzcz17W3R3YG10LTMgdGV4dC1jZW50ZXIgdGV4dC14c2AsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT57dChgT25jZSBpbnN0YWxsZWQsIHJlZnJlc2ggdGhpcyBwYWdlYCl9PC9zcGFuPlxuICAgICAgPGJ1dHRvblxuICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgY3NzPXtbdHdgbXQtMyB0ZXh0LXhzIHRleHQtd2hpdGUvNTAgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRGbG93KCdPbmJvYXJkaW5nJyl9XG4gICAgICA+XG4gICAgICAgIHsn4oaQICcgKyB0KGBHbyBiYWNrYCl9XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCB0eXBlIElPbmJvYXJkaW5nRmxvdyA9ICdPbmJvYXJkaW5nJyB8ICdHZXQgV2FsbGV0JztcbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nRmxvdyA9ICh7IG9uQ2xvc2UsIHNob3dCYWNrIH06IHsgb25DbG9zZTogKCkgPT4gdm9pZDsgc2hvd0JhY2s6IGJvb2xlYW4gfSkgPT4ge1xuICBjb25zdCBbZmxvdywgc2V0Rmxvd10gPSB1c2VTdGF0ZTxJT25ib2FyZGluZ0Zsb3c+KCdPbmJvYXJkaW5nJyk7XG4gIGNvbnN0IFthbmltYXRlT3V0LCBzZXRBbmltYXRlT3V0XSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgY29uc3Qgc2V0Rmxvd0FuaW1hdGVkID0gKGZsb3c6IElPbmJvYXJkaW5nRmxvdykgPT4ge1xuICAgIHNldEFuaW1hdGVPdXQodHJ1ZSk7XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnRlbnRSZWYuY3VycmVudD8uc2Nyb2xsVG8oMCwgMCk7XG4gICAgICBzZXRBbmltYXRlT3V0KGZhbHNlKTtcbiAgICAgIHNldEZsb3coZmxvdyk7XG4gICAgfSwgMjAwKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W3R3YGR1cmF0aW9uLTUwMCBhbmltYXRlLWZhZGUtaW4gb3ZlcmZsb3cteS1zY3JvbGxgLCBhbmltYXRlT3V0ID8gdHdgYW5pbWF0ZS1mYWRlLW91dCBvcGFjaXR5LTBgIDogJyddfVxuICAgICAgY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiXG4gICAgPlxuICAgICAge2Zsb3cgPT09ICdPbmJvYXJkaW5nJyA/IChcbiAgICAgICAgPE9uYm9hcmRpbmdJbnRybyBzaG93QmFjaz17c2hvd0JhY2t9IGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgICkgOiBudWxsfVxuICAgICAge2Zsb3cgPT09ICdHZXQgV2FsbGV0JyA/IDxPbmJvYXJkaW5nR2V0V2FsbGV0cyBmbG93PXtmbG93fSBzZXRGbG93PXtzZXRGbG93QW5pbWF0ZWR9IC8+IDogbnVsbH1cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG4iXX0= */"]
    }, "Recommended"));
  }), jsx("a", {
    href: 'https://station.jup.ag/partners?category=Wallets',
    target: "_blank",
    css: ["display:flex;width:100%;align-items:center;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(1rem * var(--tw-space-x-reverse));margin-left:calc(1rem * calc(1 - var(--tw-space-x-reverse)));}border-radius:0.5rem;padding-left:1.25rem;padding-right:1.25rem;padding-top:1rem;padding-bottom:1rem;font-size:0.875rem;line-height:1.25rem;font-weight:600;", styles$2.walletButton[theme], process.env.NODE_ENV === "production" ? "" : ";label:OnboardingGetWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWdIVSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:OnboardingGetWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWdIVSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */"]
  }, jsx("div", {
    css: ["display:flex;height:1.25rem;width:1.25rem;align-items:center;fill:currentColor;padding:0.125rem;", styles$2.externalIcon[theme], process.env.NODE_ENV === "production" ? "" : ";label:OnboardingGetWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXFIZSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:OnboardingGetWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXFIZSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */"]
  }, jsx(ExternalIcon$1, {
    width: 16,
    height: 16
  })), jsx("span", null, t(`More wallets`)))), jsx("span", {
    css: ["margin-top:0.75rem;text-align:center;font-size:0.75rem;line-height:1rem;", styles$2.subtitle[theme], process.env.NODE_ENV === "production" ? "" : ";label:OnboardingGetWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTRIWSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:OnboardingGetWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTRIWSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */"]
  }, t(`Once installed, refresh this page`)), jsx("button", {
    type: "button",
    css: ["margin-top:0.75rem;font-size:0.75rem;line-height:1rem;font-weight:600;color:rgb(255 255 255 / 0.5);", styles$2.subtitle[theme], process.env.NODE_ENV === "production" ? "" : ";label:OnboardingGetWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQStIUSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:OnboardingGetWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQStIUSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */"],
    onClick: () => setFlow('Onboarding')
  }, '← ' + t(`Go back`)));
};
const OnboardingFlow = ({
  onClose,
  showBack
}) => {
  const [flow, setFlow] = useState('Onboarding');
  const [animateOut, setAnimateOut] = useState(false);
  const contentRef = useRef(null);
  const setFlowAnimated = flow => {
    setAnimateOut(true);
    setTimeout(() => {
      contentRef.current?.scrollTo(0, 0);
      setAnimateOut(false);
      setFlow(flow);
    }, 200);
  };
  return jsx("div", {
    ref: contentRef,
    css: ["@keyframes fade-in{0%{opacity:0.2;}100%{opacity:1;}}animation:fade-in 0.15s ease-in-out;overflow-y:scroll;transition-duration:500ms;", animateOut ? {
      "@keyframes fade-out": {
        "0%": {
          "opacity": "1"
        },
        "100%": {
          "opacity": "0"
        }
      },
      "animation": "fade-out 0.15s ease-out",
      "opacity": "0"
    } : '', process.env.NODE_ENV === "production" ? "" : ";label:OnboardingFlow;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTJKTSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:OnboardingFlow;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk9uYm9hcmRpbmcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTJKTSIsImZpbGUiOiJPbmJvYXJkaW5nLnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUyB9IGZyb20gJy4uLy4uL21pc2MvY29uc3RhbnRzJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgRXh0ZXJuYWxJY29uIGZyb20gJy4uL2ljb25zL0V4dGVybmFsSWNvbic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRDb250ZXh0JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVHJhbnNsYXRpb25Qcm92aWRlcic7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzcwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBidXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlIGhvdmVyOmJnLWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSBob3ZlcjpiZy1ibGFjay8zMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ibGFjayBob3ZlcjpiZy1ibGFjay81MGBdLFxuICB9LFxuICB3YWxsZXRCdXR0b246IHtcbiAgICBsaWdodDogW3R3YGJnLVsjRjlGQUZCXSBob3ZlcjpiZy1ibGFjay81YF0sXG4gICAgZGFyazogW3R3YGJnLXdoaXRlLzEwIGhvdmVyOmJnLXdoaXRlLzIwIGJvcmRlciBib3JkZXItd2hpdGUvMTAgc2hhZG93LWxnYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMjAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBzaGFkb3ctbGdgXSxcbiAgfSxcbiAgZXh0ZXJuYWxJY29uOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzMwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvMzBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS8zMGBdLFxuICB9LFxuICBwaWxsQmFkZ2U6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyZWVuLTMwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmVlbi02MDBgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JlZW4tNjAwYF0sXG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBPbmJvYXJkaW5nSW50cm86IFJlYWN0LkZDPHtcbiAgZmxvdzogSU9uYm9hcmRpbmdGbG93O1xuICBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkO1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xuICBzaG93QmFjazogYm9vbGVhbjtcbn0+ID0gKHsgZmxvdywgc2V0Rmxvdywgb25DbG9zZSwgc2hvd0JhY2sgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgcC0xMFwiPlxuICAgICAgPGltZyBzcmM9eydodHRwczovL3VuaWZpZWQuanVwLmFnL25ld191c2VyX29uYm9hcmRpbmcucG5nJ30gd2lkdGg9ezE2MH0gaGVpZ2h0PXsxNjB9IC8+XG5cbiAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHRleHQtY2VudGVyXCI+XG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC1sZyBmb250LXNlbWlib2xkXCI+e3QoYE5ldyBoZXJlP2ApfTwvc3Bhbj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC0zIHRleHQtc20gXCIgY3NzPXtbc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIHt0KGBXZWxjb21lIHRvIFNvbGFuYUZNISBDcmVhdGUgYSBjcnlwdG8gd2FsbGV0IHRvIGdldCBzdGFydGVkIWApfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiB0dz1cIm10LTYgdy1mdWxsXCI+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIHR3YHRleHQtd2hpdGUgZm9udC1zZW1pYm9sZCB0ZXh0LWJhc2Ugdy1mdWxsIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCBweS01IGxlYWRpbmctbm9uZWAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ0dldCBXYWxsZXQnKX1cbiAgICAgICAgPlxuICAgICAgICAgIHt0KGBHZXQgU3RhcnRlZGApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICAge3Nob3dCYWNrICYmIChcbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNzcz17W3R3YG10LTMgdGV4dC14cyB0ZXh0LXdoaXRlLzUwIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvbkNsb3NlKCl9XG4gICAgICAgID5cbiAgICAgICAgICB7J+KGkCAnICsgdChgR28gYmFja2ApfVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgT25ib2FyZGluZ0dldFdhbGxldHM6IFJlYWN0LkZDPHsgZmxvdzogSU9uYm9hcmRpbmdGbG93OyBzZXRGbG93OiAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB2b2lkIH0+ID0gKHtcbiAgZmxvdyxcbiAgc2V0Rmxvdyxcbn0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXIgcHktMyBweC0xMFwiPlxuICAgICAgPHNwYW4gdHc9XCJ0ZXh0LWJhc2UgZm9udC1zZW1pYm9sZFwiPnt0KGBQb3B1bGFyIHdhbGxldHMgdG8gZ2V0IHN0YXJ0ZWRgKX08L3NwYW4+XG4gICAgICA8ZGl2IHR3PVwibXQtNCB3LWZ1bGwgc3BhY2UteS0yXCI+XG4gICAgICAgIHtIQVJEQ09ERURfV0FMTEVUX1NUQU5EQVJEUy5tYXAoKGl0ZW0sIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8YVxuICAgICAgICAgICAgICBocmVmPXtpdGVtLnVybH1cbiAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgIHR3YHB4LTUgcHktNCBmbGV4IHNwYWNlLXgtNCB3LWZ1bGwgcm91bmRlZC1sZyB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgaXRlbXMtY2VudGVyYCxcbiAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGltZyBzcmM9e2l0ZW0uaWNvbn0gd2lkdGg9ezIwfSBoZWlnaHQ9ezIwfSBhbHQ9e2l0ZW0ubmFtZX0gLz5cbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgIHtpZHggPT09IDAgJiYgPGRpdiBjc3M9e1t0d2Byb3VuZGVkLWZ1bGwgcHgtMiB0ZXh0LXhzYCwgc3R5bGVzLnBpbGxCYWRnZVt0aGVtZV1dfT5SZWNvbW1lbmRlZDwvZGl2Pn1cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cblxuICAgICAgICA8YVxuICAgICAgICAgIGhyZWY9eydodHRwczovL3N0YXRpb24uanVwLmFnL3BhcnRuZXJzP2NhdGVnb3J5PVdhbGxldHMnfVxuICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2BweC01IHB5LTQgZmxleCBzcGFjZS14LTQgdy1mdWxsIHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LXNlbWlib2xkIGl0ZW1zLWNlbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMud2FsbGV0QnV0dG9uW3RoZW1lXSxcbiAgICAgICAgICBdfVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2BmaWxsLWN1cnJlbnQgdy01IGgtNSBmbGV4IGl0ZW1zLWNlbnRlciBwLTAuNWAsIHN0eWxlcy5leHRlcm5hbEljb25bdGhlbWVdXX0+XG4gICAgICAgICAgICA8RXh0ZXJuYWxJY29uIHdpZHRoPXsxNn0gaGVpZ2h0PXsxNn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8L2E+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPHNwYW4gY3NzPXtbdHdgbXQtMyB0ZXh0LWNlbnRlciB0ZXh0LXhzYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19Pnt0KGBPbmNlIGluc3RhbGxlZCwgcmVmcmVzaCB0aGlzIHBhZ2VgKX08L3NwYW4+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICBjc3M9e1t0d2BtdC0zIHRleHQteHMgdGV4dC13aGl0ZS81MCBmb250LXNlbWlib2xkYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19XG4gICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZsb3coJ09uYm9hcmRpbmcnKX1cbiAgICAgID5cbiAgICAgICAgeyfihpAgJyArIHQoYEdvIGJhY2tgKX1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IHR5cGUgSU9uYm9hcmRpbmdGbG93ID0gJ09uYm9hcmRpbmcnIHwgJ0dldCBXYWxsZXQnO1xuZXhwb3J0IGNvbnN0IE9uYm9hcmRpbmdGbG93ID0gKHsgb25DbG9zZSwgc2hvd0JhY2sgfTogeyBvbkNsb3NlOiAoKSA9PiB2b2lkOyBzaG93QmFjazogYm9vbGVhbiB9KSA9PiB7XG4gIGNvbnN0IFtmbG93LCBzZXRGbG93XSA9IHVzZVN0YXRlPElPbmJvYXJkaW5nRmxvdz4oJ09uYm9hcmRpbmcnKTtcbiAgY29uc3QgW2FuaW1hdGVPdXQsIHNldEFuaW1hdGVPdXRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICBjb25zdCBzZXRGbG93QW5pbWF0ZWQgPSAoZmxvdzogSU9uYm9hcmRpbmdGbG93KSA9PiB7XG4gICAgc2V0QW5pbWF0ZU91dCh0cnVlKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29udGVudFJlZi5jdXJyZW50Py5zY3JvbGxUbygwLCAwKTtcbiAgICAgIHNldEFuaW1hdGVPdXQoZmFsc2UpO1xuICAgICAgc2V0RmxvdyhmbG93KTtcbiAgICB9LCAyMDApO1xuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbdHdgZHVyYXRpb24tNTAwIGFuaW1hdGUtZmFkZS1pbiBvdmVyZmxvdy15LXNjcm9sbGAsIGFuaW1hdGVPdXQgPyB0d2BhbmltYXRlLWZhZGUtb3V0IG9wYWNpdHktMGAgOiAnJ119XG4gICAgICBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCJcbiAgICA+XG4gICAgICB7ZmxvdyA9PT0gJ09uYm9hcmRpbmcnID8gKFxuICAgICAgICA8T25ib2FyZGluZ0ludHJvIHNob3dCYWNrPXtzaG93QmFja30gZmxvdz17Zmxvd30gc2V0Rmxvdz17c2V0Rmxvd0FuaW1hdGVkfSBvbkNsb3NlPXtvbkNsb3NlfSAvPlxuICAgICAgKSA6IG51bGx9XG4gICAgICB7ZmxvdyA9PT0gJ0dldCBXYWxsZXQnID8gPE9uYm9hcmRpbmdHZXRXYWxsZXRzIGZsb3c9e2Zsb3d9IHNldEZsb3c9e3NldEZsb3dBbmltYXRlZH0gLz4gOiBudWxsfVxuICAgIDwvZGl2PlxuICApO1xufTtcbiJdfQ== */"],
    className: "hideScrollbar"
  }, flow === 'Onboarding' ? jsx(OnboardingIntro, {
    showBack: showBack,
    flow: flow,
    setFlow: setFlowAnimated,
    onClose: onClose
  }) : null, flow === 'Get Wallet' ? jsx(OnboardingGetWallets, {
    flow: flow,
    setFlow: setFlowAnimated
  }) : null);
};

function _EMOTION_STRINGIFIED_CSS_ERROR__$2() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const styles$1 = {
  container: {
    light: [{
      "--tw-bg-opacity": "1 !important",
      "backgroundColor": "rgb(255 255 255 / var(--tw-bg-opacity)) !important",
      "--tw-text-opacity": "1",
      "color": "rgb(0 0 0 / var(--tw-text-opacity))",
      "--tw-shadow": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      "--tw-shadow-colored": "0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color)",
      "boxShadow": "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)"
    }],
    dark: [{
      "borderWidth": "1px",
      "borderColor": "rgb(255 255 255 / 0.1)",
      "--tw-bg-opacity": "1 !important",
      "backgroundColor": "rgb(58 59 67 / var(--tw-bg-opacity)) !important",
      "--tw-text-opacity": "1",
      "color": "rgb(255 255 255 / var(--tw-text-opacity))"
    }],
    jupiter: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(49 62 76 / var(--tw-bg-opacity))",
      "--tw-text-opacity": "1",
      "color": "rgb(255 255 255 / var(--tw-text-opacity))"
    }]
  },
  shades: {
    light: [{
      "pointerEvents": "none",
      "backgroundImage": "linear-gradient(to top, var(--tw-gradient-stops))",
      "--tw-gradient-from": "#ffffff var(--tw-gradient-from-position)",
      "--tw-gradient-to": "transparent var(--tw-gradient-to-position)",
      "--tw-gradient-stops": "var(--tw-gradient-from), var(--tw-gradient-to)"
    }],
    dark: [{
      "pointerEvents": "none",
      "backgroundImage": "linear-gradient(to top, var(--tw-gradient-stops))",
      "--tw-gradient-from": "#3A3B43 var(--tw-gradient-from-position)",
      "--tw-gradient-to": "transparent var(--tw-gradient-to-position)",
      "--tw-gradient-stops": "var(--tw-gradient-from), var(--tw-gradient-to)"
    }],
    jupiter: [{
      "pointerEvents": "none",
      "backgroundImage": "linear-gradient(to top, var(--tw-gradient-stops))",
      "--tw-gradient-from": "rgb(49, 62, 76) var(--tw-gradient-from-position)",
      "--tw-gradient-to": "transparent var(--tw-gradient-to-position)",
      "--tw-gradient-stops": "var(--tw-gradient-from), var(--tw-gradient-to)"
    }]
  },
  walletItem: {
    light: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(249 250 251 / var(--tw-bg-opacity))",
      ":hover": {
        "borderColor": "rgb(0 0 0 / 0.1)",
        "--tw-shadow": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "--tw-shadow-colored": "0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color)",
        "boxShadow": "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)"
      }
    }],
    dark: [{
      ":hover": {
        "backgroundColor": "rgb(255 255 255 / 0.1)",
        "--tw-shadow": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        "--tw-shadow-colored": "0 25px 50px -12px var(--tw-shadow-color)",
        "boxShadow": "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)"
      }
    }],
    jupiter: [{
      ":hover": {
        "backgroundColor": "rgb(255 255 255 / 0.1)",
        "--tw-shadow": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        "--tw-shadow-colored": "0 25px 50px -12px var(--tw-shadow-color)",
        "boxShadow": "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)"
      }
    }]
  },
  subtitle: {
    light: [{
      "color": "rgb(0 0 0 / 0.5)"
    }],
    dark: [{
      "color": "rgb(255 255 255 / 0.5)"
    }],
    jupiter: [{
      "color": "rgb(255 255 255 / 0.5)"
    }]
  },
  header: {
    light: [{
      "borderBottomWidth": "1px"
    }],
    dark: [],
    jupiter: []
  },
  buttonText: {
    light: [{
      "--tw-text-opacity": "1",
      "color": "rgb(31 41 55 / var(--tw-text-opacity))"
    }],
    dark: [{
      "color": "rgb(255 255 255 / 0.8)"
    }],
    jupiter: [{
      "color": "rgb(255 255 255 / 0.8)"
    }]
  }
};
var _ref$2 = process.env.NODE_ENV === "production" ? {
  name: "16ceglb",
  styles: "font-weight:600"
} : {
  name: "11haoy6-Header",
  styles: "font-weight:600;label:Header;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref2$2 = process.env.NODE_ENV === "production" ? {
  name: "1o7lixs",
  styles: "position:absolute;right:1rem;top:1rem"
} : {
  name: "1rhst5f-Header",
  styles: "position:absolute;right:1rem;top:1rem;label:Header;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
const Header = ({
  onClose
}) => {
  const {
    theme
  } = useUnifiedWalletContext();
  const {
    t
  } = useTranslation();
  return jsx("div", {
    css: ["display:flex;justify-content:space-between;padding-left:1.25rem;padding-right:1.25rem;padding-top:1.5rem;padding-bottom:1.5rem;line-height:1;", styles$1.header[theme], process.env.NODE_ENV === "production" ? "" : ";label:Header;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUEwRFMiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuXG5pbXBvcnQgeyBXYWxsZXRJY29uLCBXYWxsZXRMaXN0SXRlbSB9IGZyb20gJy4vV2FsbGV0TGlzdEl0ZW0nO1xuXG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5cbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2hldnJvbkRvd25JY29uIGZyb20gJy4uLy4uL2ljb25zL0NoZXZyb25Eb3duSWNvbic7XG5pbXBvcnQgQ2hldnJvblVwSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uVXBJY29uJztcbmltcG9ydCBDbG9zZUljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2xvc2VJY29uJztcbmltcG9ydCB7IGlzTW9iaWxlLCB1c2VPdXRzaWRlQ2xpY2sgfSBmcm9tICcuLi8uLi9taXNjL3V0aWxzJztcbmltcG9ydCBOb3RJbnN0YWxsZWQgZnJvbSAnLi9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuL09uYm9hcmRpbmcnO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBsaWdodDogW3R3YHRleHQtYmxhY2sgIWJnLXdoaXRlIHNoYWRvdy14bGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlICFiZy1bIzNBM0I0M10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlIGJnLVtyZ2IoNDksIDYyLCA3NildYF0sXG4gIH0sXG4gIHNoYWRlczoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjZmZmZmZmXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAgZGFyazogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzNBM0I0M10gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tW3JnYig0OSwgNjIsIDc2KV0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICB9LFxuICB3YWxsZXRJdGVtOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmF5LTUwIGhvdmVyOnNoYWRvdy1sZyBob3Zlcjpib3JkZXItYmxhY2svMTBgXSxcbiAgICBkYXJrOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF1cbiAgfVxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gbGVhZGluZy1ub25lYCwgc3R5bGVzLmhlYWRlclt0aGVtZV1dfT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIG10LTFgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYFlvdSBuZWVkIHRvIGNvbm5lY3QgYSBTb2xhbmEgd2FsbGV0LmApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8c3BhbiB0dz1cIm10LTYgdGV4dC14cyBmb250LXNlbWlib2xkXCI+e3QoYFJlY29tbWVuZGVkIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTAgbWItNVwiPlxuICAgICAgICAgIHtsaXN0LnJlY29tbWVuZGVkV2FsbGV0cy5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGxnOmZsZXgtY29sIGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdSZWNvbW1lbmRlZCcgPyB0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdQcmV2aW91c2x5Q29ubmVjdGVkJyA/IHQoYFJlY2VudGx5IHVzZWRgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ0luc3RhbGxlZCcgPyB0KGBJbnN0YWxsZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnVG9wV2FsbGV0JyA/IHQoYFBvcHVsYXIgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0Lm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIGxnOm1heC13LVszMyVdYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1iZXR3ZWVuIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0KGBNb3JlIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICA8ZGl2IHR3PVwiIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ3LVsxMHB4XSBoLVs2cHhdXCI+e2lzT3BlbiA/IDxDaGV2cm9uVXBJY29uIC8+IDogPENoZXZyb25Eb3duSWNvbiAvPn08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLCBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV1dfT5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSl9PlxuICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXYgPlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqLyB9XG4gIHtcbiAgICBpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgIDw+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICA8Lz5cbiAgICApIDogbnVsbFxuICB9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydCYWNrcGFjaycgYXMgV2FsbGV0TmFtZTwnQmFja3BhY2snPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG4gICdTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPixcbl07XG5cbmludGVyZmFjZSBJVW5pZmllZFdhbGxldE1vZGFsIHtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbn1cblxuY29uc3Qgc29ydEJ5UHJlY2VkZW5jZSA9ICh3YWxsZXRQcmVjZWRlbmNlOiBXYWxsZXROYW1lW10pID0+IChhOiBBZGFwdGVyLCBiOiBBZGFwdGVyKSA9PiB7XG4gIGlmICghd2FsbGV0UHJlY2VkZW5jZSkgcmV0dXJuIDA7XG5cbiAgY29uc3QgYUluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGEubmFtZSk7XG4gIGNvbnN0IGJJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihiLm5hbWUpO1xuXG4gIGlmIChhSW5kZXggPT09IC0xICYmIGJJbmRleCA9PT0gLTEpIHJldHVybiAwO1xuICBpZiAoYUluZGV4ID49IDApIHtcbiAgICBpZiAoYkluZGV4ID09PSAtMSkgcmV0dXJuIC0xO1xuICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gIH1cblxuICBpZiAoYkluZGV4ID49IDApIHtcbiAgICBpZiAoYUluZGV4ID09PSAtMSkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGJJbmRleCAtIGFJbmRleDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbmNvbnN0IFVuaWZpZWRXYWxsZXRNb2RhbDogUmVhY3QuRkM8SVVuaWZpZWRXYWxsZXRNb2RhbD4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB3YWxsZXRzIH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgd2FsbGV0UHJlY2VkZW5jZSwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IFtpc09wZW4sIG9uVG9nZ2xlXSA9IHVzZVRvZ2dsZShmYWxzZSk7XG4gIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWQgPSB1c2VQcmV2aW91c2x5Q29ubmVjdGVkKCk7XG5cbiAgY29uc3QgbGlzdDogeyByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTsgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7IGhpZ2hsaWdodDogQWRhcHRlcltdOyBvdGhlcnM6IEFkYXB0ZXJbXSB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gVGhlbiwgSW5zdGFsbGVkLCBUb3AgMywgTG9hZGFibGUsIE5vdERldGVjdGVkXG4gICAgY29uc3QgZmlsdGVyZWRBZGFwdGVycyA9IHdhbGxldHMucmVkdWNlPHtcbiAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIGluc3RhbGxlZDogQWRhcHRlcltdO1xuICAgICAgdG9wMzogQWRhcHRlcltdO1xuICAgICAgbG9hZGFibGU6IEFkYXB0ZXJbXTtcbiAgICAgIG5vdERldGVjdGVkOiBBZGFwdGVyW107XG4gICAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICB9PihcbiAgICAgIChhY2MsIHdhbGxldCkgPT4ge1xuICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9IHdhbGxldC5hZGFwdGVyLm5hbWU7XG5cbiAgICAgICAgaWYgKFJFQ09NTUVOREVEX1dBTExFVFMuc29tZSgod2FsbGV0KSA9PiB3YWxsZXQgPT09IGFkYXB0ZXJOYW1lKSkge1xuICAgICAgICAgIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZpb3VzbHkgY29ubmVjdGVkIHRha2VzIGhpZ2hlc3RcbiAgICAgICAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID0gcHJldmlvdXNseUNvbm5lY3RlZC5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnByZXZpb3VzbHlDb25uZWN0ZWRbcHJldmlvdXNseUNvbm5lY3RlZEluZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBJbnN0YWxsZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgIGFjYy5pbnN0YWxsZWQucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3AgM1xuICAgICAgICBjb25zdCB0b3BXYWxsZXRzSW5kZXggPSBUT1BfV0FMTEVUUy5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRvcFdhbGxldHNJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnRvcDNbdG9wV2FsbGV0c0luZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZGFibGVcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90RGV0ZWN0ZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogW10sXG4gICAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IFtdLFxuICAgICAgICBpbnN0YWxsZWQ6IFtdLFxuICAgICAgICB0b3AzOiBbXSxcbiAgICAgICAgbG9hZGFibGU6IFtdLFxuICAgICAgICBub3REZXRlY3RlZDogW10sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMCwgMyk7XG4gICAgICBsZXQgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGgpKTtcbiAgICAgIG90aGVycyA9IG90aGVycy5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ1ByZXZpb3VzbHlDb25uZWN0ZWQnLFxuICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgIG90aGVycyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBpbnN0YWxsZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAzKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLCBoaWdobGlnaHQ6IFtdLCBvdGhlcnM6IFtdIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHRvcDMsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ1RvcFdhbGxldCcsIGhpZ2hsaWdodDogdG9wMywgb3RoZXJzIH07XG4gIH0sIFt3YWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkXSk7XG5cbiAgY29uc3QgY29udGVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIHVzZU91dHNpZGVDbGljayhjb250ZW50UmVmLCBvbkNsb3NlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W1xuICAgICAgICB0d2BtYXgtdy1tZCB3LWZ1bGwgcmVsYXRpdmUgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC14bCBtYXgtaC1bOTB2aF0gbGc6bWF4LWgtWzU3NnB4XSB0cmFuc2l0aW9uLWhlaWdodCBkdXJhdGlvbi01MDAgZWFzZS1pbi1vdXQgYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxkaXYgdHc9XCJib3JkZXItdC1bMXB4XSBib3JkZXItd2hpdGUvMTBcIiAvPlxuICAgICAgPExpc3RPZldhbGxldHMgbGlzdD17bGlzdH0gb25Ub2dnbGU9e29uVG9nZ2xlfSBpc09wZW49e2lzT3Blbn0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVuaWZpZWRXYWxsZXRNb2RhbDtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:Header;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUEwRFMiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuXG5pbXBvcnQgeyBXYWxsZXRJY29uLCBXYWxsZXRMaXN0SXRlbSB9IGZyb20gJy4vV2FsbGV0TGlzdEl0ZW0nO1xuXG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5cbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2hldnJvbkRvd25JY29uIGZyb20gJy4uLy4uL2ljb25zL0NoZXZyb25Eb3duSWNvbic7XG5pbXBvcnQgQ2hldnJvblVwSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uVXBJY29uJztcbmltcG9ydCBDbG9zZUljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2xvc2VJY29uJztcbmltcG9ydCB7IGlzTW9iaWxlLCB1c2VPdXRzaWRlQ2xpY2sgfSBmcm9tICcuLi8uLi9taXNjL3V0aWxzJztcbmltcG9ydCBOb3RJbnN0YWxsZWQgZnJvbSAnLi9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuL09uYm9hcmRpbmcnO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBsaWdodDogW3R3YHRleHQtYmxhY2sgIWJnLXdoaXRlIHNoYWRvdy14bGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlICFiZy1bIzNBM0I0M10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlIGJnLVtyZ2IoNDksIDYyLCA3NildYF0sXG4gIH0sXG4gIHNoYWRlczoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjZmZmZmZmXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAgZGFyazogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzNBM0I0M10gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tW3JnYig0OSwgNjIsIDc2KV0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICB9LFxuICB3YWxsZXRJdGVtOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmF5LTUwIGhvdmVyOnNoYWRvdy1sZyBob3Zlcjpib3JkZXItYmxhY2svMTBgXSxcbiAgICBkYXJrOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF1cbiAgfVxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gbGVhZGluZy1ub25lYCwgc3R5bGVzLmhlYWRlclt0aGVtZV1dfT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIG10LTFgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYFlvdSBuZWVkIHRvIGNvbm5lY3QgYSBTb2xhbmEgd2FsbGV0LmApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8c3BhbiB0dz1cIm10LTYgdGV4dC14cyBmb250LXNlbWlib2xkXCI+e3QoYFJlY29tbWVuZGVkIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTAgbWItNVwiPlxuICAgICAgICAgIHtsaXN0LnJlY29tbWVuZGVkV2FsbGV0cy5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGxnOmZsZXgtY29sIGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdSZWNvbW1lbmRlZCcgPyB0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdQcmV2aW91c2x5Q29ubmVjdGVkJyA/IHQoYFJlY2VudGx5IHVzZWRgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ0luc3RhbGxlZCcgPyB0KGBJbnN0YWxsZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnVG9wV2FsbGV0JyA/IHQoYFBvcHVsYXIgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0Lm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIGxnOm1heC13LVszMyVdYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1iZXR3ZWVuIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0KGBNb3JlIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICA8ZGl2IHR3PVwiIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ3LVsxMHB4XSBoLVs2cHhdXCI+e2lzT3BlbiA/IDxDaGV2cm9uVXBJY29uIC8+IDogPENoZXZyb25Eb3duSWNvbiAvPn08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLCBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV1dfT5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSl9PlxuICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXYgPlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqLyB9XG4gIHtcbiAgICBpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgIDw+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICA8Lz5cbiAgICApIDogbnVsbFxuICB9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydCYWNrcGFjaycgYXMgV2FsbGV0TmFtZTwnQmFja3BhY2snPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG4gICdTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPixcbl07XG5cbmludGVyZmFjZSBJVW5pZmllZFdhbGxldE1vZGFsIHtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbn1cblxuY29uc3Qgc29ydEJ5UHJlY2VkZW5jZSA9ICh3YWxsZXRQcmVjZWRlbmNlOiBXYWxsZXROYW1lW10pID0+IChhOiBBZGFwdGVyLCBiOiBBZGFwdGVyKSA9PiB7XG4gIGlmICghd2FsbGV0UHJlY2VkZW5jZSkgcmV0dXJuIDA7XG5cbiAgY29uc3QgYUluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGEubmFtZSk7XG4gIGNvbnN0IGJJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihiLm5hbWUpO1xuXG4gIGlmIChhSW5kZXggPT09IC0xICYmIGJJbmRleCA9PT0gLTEpIHJldHVybiAwO1xuICBpZiAoYUluZGV4ID49IDApIHtcbiAgICBpZiAoYkluZGV4ID09PSAtMSkgcmV0dXJuIC0xO1xuICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gIH1cblxuICBpZiAoYkluZGV4ID49IDApIHtcbiAgICBpZiAoYUluZGV4ID09PSAtMSkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGJJbmRleCAtIGFJbmRleDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbmNvbnN0IFVuaWZpZWRXYWxsZXRNb2RhbDogUmVhY3QuRkM8SVVuaWZpZWRXYWxsZXRNb2RhbD4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB3YWxsZXRzIH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgd2FsbGV0UHJlY2VkZW5jZSwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IFtpc09wZW4sIG9uVG9nZ2xlXSA9IHVzZVRvZ2dsZShmYWxzZSk7XG4gIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWQgPSB1c2VQcmV2aW91c2x5Q29ubmVjdGVkKCk7XG5cbiAgY29uc3QgbGlzdDogeyByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTsgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7IGhpZ2hsaWdodDogQWRhcHRlcltdOyBvdGhlcnM6IEFkYXB0ZXJbXSB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gVGhlbiwgSW5zdGFsbGVkLCBUb3AgMywgTG9hZGFibGUsIE5vdERldGVjdGVkXG4gICAgY29uc3QgZmlsdGVyZWRBZGFwdGVycyA9IHdhbGxldHMucmVkdWNlPHtcbiAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIGluc3RhbGxlZDogQWRhcHRlcltdO1xuICAgICAgdG9wMzogQWRhcHRlcltdO1xuICAgICAgbG9hZGFibGU6IEFkYXB0ZXJbXTtcbiAgICAgIG5vdERldGVjdGVkOiBBZGFwdGVyW107XG4gICAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICB9PihcbiAgICAgIChhY2MsIHdhbGxldCkgPT4ge1xuICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9IHdhbGxldC5hZGFwdGVyLm5hbWU7XG5cbiAgICAgICAgaWYgKFJFQ09NTUVOREVEX1dBTExFVFMuc29tZSgod2FsbGV0KSA9PiB3YWxsZXQgPT09IGFkYXB0ZXJOYW1lKSkge1xuICAgICAgICAgIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZpb3VzbHkgY29ubmVjdGVkIHRha2VzIGhpZ2hlc3RcbiAgICAgICAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID0gcHJldmlvdXNseUNvbm5lY3RlZC5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnByZXZpb3VzbHlDb25uZWN0ZWRbcHJldmlvdXNseUNvbm5lY3RlZEluZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBJbnN0YWxsZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgIGFjYy5pbnN0YWxsZWQucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3AgM1xuICAgICAgICBjb25zdCB0b3BXYWxsZXRzSW5kZXggPSBUT1BfV0FMTEVUUy5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRvcFdhbGxldHNJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnRvcDNbdG9wV2FsbGV0c0luZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZGFibGVcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90RGV0ZWN0ZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogW10sXG4gICAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IFtdLFxuICAgICAgICBpbnN0YWxsZWQ6IFtdLFxuICAgICAgICB0b3AzOiBbXSxcbiAgICAgICAgbG9hZGFibGU6IFtdLFxuICAgICAgICBub3REZXRlY3RlZDogW10sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMCwgMyk7XG4gICAgICBsZXQgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGgpKTtcbiAgICAgIG90aGVycyA9IG90aGVycy5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ1ByZXZpb3VzbHlDb25uZWN0ZWQnLFxuICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgIG90aGVycyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBpbnN0YWxsZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAzKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLCBoaWdobGlnaHQ6IFtdLCBvdGhlcnM6IFtdIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHRvcDMsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ1RvcFdhbGxldCcsIGhpZ2hsaWdodDogdG9wMywgb3RoZXJzIH07XG4gIH0sIFt3YWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkXSk7XG5cbiAgY29uc3QgY29udGVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIHVzZU91dHNpZGVDbGljayhjb250ZW50UmVmLCBvbkNsb3NlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W1xuICAgICAgICB0d2BtYXgtdy1tZCB3LWZ1bGwgcmVsYXRpdmUgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC14bCBtYXgtaC1bOTB2aF0gbGc6bWF4LWgtWzU3NnB4XSB0cmFuc2l0aW9uLWhlaWdodCBkdXJhdGlvbi01MDAgZWFzZS1pbi1vdXQgYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxkaXYgdHc9XCJib3JkZXItdC1bMXB4XSBib3JkZXItd2hpdGUvMTBcIiAvPlxuICAgICAgPExpc3RPZldhbGxldHMgbGlzdD17bGlzdH0gb25Ub2dnbGU9e29uVG9nZ2xlfSBpc09wZW49e2lzT3Blbn0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVuaWZpZWRXYWxsZXRNb2RhbDtcbiJdfQ== */"]
  }, jsx("div", null, jsx("div", {
    css: _ref$2
  }, jsx("span", null, t(`Connect Wallet`))), jsx("div", {
    css: ["margin-top:0.25rem;font-size:0.75rem;line-height:1rem;", styles$1.subtitle[theme], process.env.NODE_ENV === "production" ? "" : ";label:Header;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUErRGEiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuXG5pbXBvcnQgeyBXYWxsZXRJY29uLCBXYWxsZXRMaXN0SXRlbSB9IGZyb20gJy4vV2FsbGV0TGlzdEl0ZW0nO1xuXG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5cbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2hldnJvbkRvd25JY29uIGZyb20gJy4uLy4uL2ljb25zL0NoZXZyb25Eb3duSWNvbic7XG5pbXBvcnQgQ2hldnJvblVwSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uVXBJY29uJztcbmltcG9ydCBDbG9zZUljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2xvc2VJY29uJztcbmltcG9ydCB7IGlzTW9iaWxlLCB1c2VPdXRzaWRlQ2xpY2sgfSBmcm9tICcuLi8uLi9taXNjL3V0aWxzJztcbmltcG9ydCBOb3RJbnN0YWxsZWQgZnJvbSAnLi9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuL09uYm9hcmRpbmcnO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBsaWdodDogW3R3YHRleHQtYmxhY2sgIWJnLXdoaXRlIHNoYWRvdy14bGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlICFiZy1bIzNBM0I0M10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlIGJnLVtyZ2IoNDksIDYyLCA3NildYF0sXG4gIH0sXG4gIHNoYWRlczoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjZmZmZmZmXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAgZGFyazogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzNBM0I0M10gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tW3JnYig0OSwgNjIsIDc2KV0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICB9LFxuICB3YWxsZXRJdGVtOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmF5LTUwIGhvdmVyOnNoYWRvdy1sZyBob3Zlcjpib3JkZXItYmxhY2svMTBgXSxcbiAgICBkYXJrOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF1cbiAgfVxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gbGVhZGluZy1ub25lYCwgc3R5bGVzLmhlYWRlclt0aGVtZV1dfT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIG10LTFgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYFlvdSBuZWVkIHRvIGNvbm5lY3QgYSBTb2xhbmEgd2FsbGV0LmApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8c3BhbiB0dz1cIm10LTYgdGV4dC14cyBmb250LXNlbWlib2xkXCI+e3QoYFJlY29tbWVuZGVkIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTAgbWItNVwiPlxuICAgICAgICAgIHtsaXN0LnJlY29tbWVuZGVkV2FsbGV0cy5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGxnOmZsZXgtY29sIGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdSZWNvbW1lbmRlZCcgPyB0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdQcmV2aW91c2x5Q29ubmVjdGVkJyA/IHQoYFJlY2VudGx5IHVzZWRgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ0luc3RhbGxlZCcgPyB0KGBJbnN0YWxsZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnVG9wV2FsbGV0JyA/IHQoYFBvcHVsYXIgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0Lm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIGxnOm1heC13LVszMyVdYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1iZXR3ZWVuIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0KGBNb3JlIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICA8ZGl2IHR3PVwiIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ3LVsxMHB4XSBoLVs2cHhdXCI+e2lzT3BlbiA/IDxDaGV2cm9uVXBJY29uIC8+IDogPENoZXZyb25Eb3duSWNvbiAvPn08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLCBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV1dfT5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSl9PlxuICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXYgPlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqLyB9XG4gIHtcbiAgICBpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgIDw+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICA8Lz5cbiAgICApIDogbnVsbFxuICB9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydCYWNrcGFjaycgYXMgV2FsbGV0TmFtZTwnQmFja3BhY2snPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG4gICdTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPixcbl07XG5cbmludGVyZmFjZSBJVW5pZmllZFdhbGxldE1vZGFsIHtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbn1cblxuY29uc3Qgc29ydEJ5UHJlY2VkZW5jZSA9ICh3YWxsZXRQcmVjZWRlbmNlOiBXYWxsZXROYW1lW10pID0+IChhOiBBZGFwdGVyLCBiOiBBZGFwdGVyKSA9PiB7XG4gIGlmICghd2FsbGV0UHJlY2VkZW5jZSkgcmV0dXJuIDA7XG5cbiAgY29uc3QgYUluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGEubmFtZSk7XG4gIGNvbnN0IGJJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihiLm5hbWUpO1xuXG4gIGlmIChhSW5kZXggPT09IC0xICYmIGJJbmRleCA9PT0gLTEpIHJldHVybiAwO1xuICBpZiAoYUluZGV4ID49IDApIHtcbiAgICBpZiAoYkluZGV4ID09PSAtMSkgcmV0dXJuIC0xO1xuICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gIH1cblxuICBpZiAoYkluZGV4ID49IDApIHtcbiAgICBpZiAoYUluZGV4ID09PSAtMSkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGJJbmRleCAtIGFJbmRleDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbmNvbnN0IFVuaWZpZWRXYWxsZXRNb2RhbDogUmVhY3QuRkM8SVVuaWZpZWRXYWxsZXRNb2RhbD4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB3YWxsZXRzIH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgd2FsbGV0UHJlY2VkZW5jZSwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IFtpc09wZW4sIG9uVG9nZ2xlXSA9IHVzZVRvZ2dsZShmYWxzZSk7XG4gIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWQgPSB1c2VQcmV2aW91c2x5Q29ubmVjdGVkKCk7XG5cbiAgY29uc3QgbGlzdDogeyByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTsgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7IGhpZ2hsaWdodDogQWRhcHRlcltdOyBvdGhlcnM6IEFkYXB0ZXJbXSB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gVGhlbiwgSW5zdGFsbGVkLCBUb3AgMywgTG9hZGFibGUsIE5vdERldGVjdGVkXG4gICAgY29uc3QgZmlsdGVyZWRBZGFwdGVycyA9IHdhbGxldHMucmVkdWNlPHtcbiAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIGluc3RhbGxlZDogQWRhcHRlcltdO1xuICAgICAgdG9wMzogQWRhcHRlcltdO1xuICAgICAgbG9hZGFibGU6IEFkYXB0ZXJbXTtcbiAgICAgIG5vdERldGVjdGVkOiBBZGFwdGVyW107XG4gICAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICB9PihcbiAgICAgIChhY2MsIHdhbGxldCkgPT4ge1xuICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9IHdhbGxldC5hZGFwdGVyLm5hbWU7XG5cbiAgICAgICAgaWYgKFJFQ09NTUVOREVEX1dBTExFVFMuc29tZSgod2FsbGV0KSA9PiB3YWxsZXQgPT09IGFkYXB0ZXJOYW1lKSkge1xuICAgICAgICAgIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZpb3VzbHkgY29ubmVjdGVkIHRha2VzIGhpZ2hlc3RcbiAgICAgICAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID0gcHJldmlvdXNseUNvbm5lY3RlZC5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnByZXZpb3VzbHlDb25uZWN0ZWRbcHJldmlvdXNseUNvbm5lY3RlZEluZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBJbnN0YWxsZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgIGFjYy5pbnN0YWxsZWQucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3AgM1xuICAgICAgICBjb25zdCB0b3BXYWxsZXRzSW5kZXggPSBUT1BfV0FMTEVUUy5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRvcFdhbGxldHNJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnRvcDNbdG9wV2FsbGV0c0luZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZGFibGVcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90RGV0ZWN0ZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogW10sXG4gICAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IFtdLFxuICAgICAgICBpbnN0YWxsZWQ6IFtdLFxuICAgICAgICB0b3AzOiBbXSxcbiAgICAgICAgbG9hZGFibGU6IFtdLFxuICAgICAgICBub3REZXRlY3RlZDogW10sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMCwgMyk7XG4gICAgICBsZXQgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGgpKTtcbiAgICAgIG90aGVycyA9IG90aGVycy5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ1ByZXZpb3VzbHlDb25uZWN0ZWQnLFxuICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgIG90aGVycyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBpbnN0YWxsZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAzKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLCBoaWdobGlnaHQ6IFtdLCBvdGhlcnM6IFtdIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHRvcDMsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ1RvcFdhbGxldCcsIGhpZ2hsaWdodDogdG9wMywgb3RoZXJzIH07XG4gIH0sIFt3YWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkXSk7XG5cbiAgY29uc3QgY29udGVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIHVzZU91dHNpZGVDbGljayhjb250ZW50UmVmLCBvbkNsb3NlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W1xuICAgICAgICB0d2BtYXgtdy1tZCB3LWZ1bGwgcmVsYXRpdmUgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC14bCBtYXgtaC1bOTB2aF0gbGc6bWF4LWgtWzU3NnB4XSB0cmFuc2l0aW9uLWhlaWdodCBkdXJhdGlvbi01MDAgZWFzZS1pbi1vdXQgYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxkaXYgdHc9XCJib3JkZXItdC1bMXB4XSBib3JkZXItd2hpdGUvMTBcIiAvPlxuICAgICAgPExpc3RPZldhbGxldHMgbGlzdD17bGlzdH0gb25Ub2dnbGU9e29uVG9nZ2xlfSBpc09wZW49e2lzT3Blbn0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVuaWZpZWRXYWxsZXRNb2RhbDtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:Header;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUErRGEiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuXG5pbXBvcnQgeyBXYWxsZXRJY29uLCBXYWxsZXRMaXN0SXRlbSB9IGZyb20gJy4vV2FsbGV0TGlzdEl0ZW0nO1xuXG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5cbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2hldnJvbkRvd25JY29uIGZyb20gJy4uLy4uL2ljb25zL0NoZXZyb25Eb3duSWNvbic7XG5pbXBvcnQgQ2hldnJvblVwSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uVXBJY29uJztcbmltcG9ydCBDbG9zZUljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2xvc2VJY29uJztcbmltcG9ydCB7IGlzTW9iaWxlLCB1c2VPdXRzaWRlQ2xpY2sgfSBmcm9tICcuLi8uLi9taXNjL3V0aWxzJztcbmltcG9ydCBOb3RJbnN0YWxsZWQgZnJvbSAnLi9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuL09uYm9hcmRpbmcnO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBsaWdodDogW3R3YHRleHQtYmxhY2sgIWJnLXdoaXRlIHNoYWRvdy14bGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlICFiZy1bIzNBM0I0M10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlIGJnLVtyZ2IoNDksIDYyLCA3NildYF0sXG4gIH0sXG4gIHNoYWRlczoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjZmZmZmZmXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAgZGFyazogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzNBM0I0M10gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tW3JnYig0OSwgNjIsIDc2KV0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICB9LFxuICB3YWxsZXRJdGVtOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmF5LTUwIGhvdmVyOnNoYWRvdy1sZyBob3Zlcjpib3JkZXItYmxhY2svMTBgXSxcbiAgICBkYXJrOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF1cbiAgfVxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gbGVhZGluZy1ub25lYCwgc3R5bGVzLmhlYWRlclt0aGVtZV1dfT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIG10LTFgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYFlvdSBuZWVkIHRvIGNvbm5lY3QgYSBTb2xhbmEgd2FsbGV0LmApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8c3BhbiB0dz1cIm10LTYgdGV4dC14cyBmb250LXNlbWlib2xkXCI+e3QoYFJlY29tbWVuZGVkIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTAgbWItNVwiPlxuICAgICAgICAgIHtsaXN0LnJlY29tbWVuZGVkV2FsbGV0cy5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGxnOmZsZXgtY29sIGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdSZWNvbW1lbmRlZCcgPyB0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdQcmV2aW91c2x5Q29ubmVjdGVkJyA/IHQoYFJlY2VudGx5IHVzZWRgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ0luc3RhbGxlZCcgPyB0KGBJbnN0YWxsZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnVG9wV2FsbGV0JyA/IHQoYFBvcHVsYXIgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0Lm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIGxnOm1heC13LVszMyVdYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1iZXR3ZWVuIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0KGBNb3JlIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICA8ZGl2IHR3PVwiIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ3LVsxMHB4XSBoLVs2cHhdXCI+e2lzT3BlbiA/IDxDaGV2cm9uVXBJY29uIC8+IDogPENoZXZyb25Eb3duSWNvbiAvPn08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLCBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV1dfT5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSl9PlxuICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXYgPlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqLyB9XG4gIHtcbiAgICBpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgIDw+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICA8Lz5cbiAgICApIDogbnVsbFxuICB9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydCYWNrcGFjaycgYXMgV2FsbGV0TmFtZTwnQmFja3BhY2snPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG4gICdTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPixcbl07XG5cbmludGVyZmFjZSBJVW5pZmllZFdhbGxldE1vZGFsIHtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbn1cblxuY29uc3Qgc29ydEJ5UHJlY2VkZW5jZSA9ICh3YWxsZXRQcmVjZWRlbmNlOiBXYWxsZXROYW1lW10pID0+IChhOiBBZGFwdGVyLCBiOiBBZGFwdGVyKSA9PiB7XG4gIGlmICghd2FsbGV0UHJlY2VkZW5jZSkgcmV0dXJuIDA7XG5cbiAgY29uc3QgYUluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGEubmFtZSk7XG4gIGNvbnN0IGJJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihiLm5hbWUpO1xuXG4gIGlmIChhSW5kZXggPT09IC0xICYmIGJJbmRleCA9PT0gLTEpIHJldHVybiAwO1xuICBpZiAoYUluZGV4ID49IDApIHtcbiAgICBpZiAoYkluZGV4ID09PSAtMSkgcmV0dXJuIC0xO1xuICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gIH1cblxuICBpZiAoYkluZGV4ID49IDApIHtcbiAgICBpZiAoYUluZGV4ID09PSAtMSkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGJJbmRleCAtIGFJbmRleDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbmNvbnN0IFVuaWZpZWRXYWxsZXRNb2RhbDogUmVhY3QuRkM8SVVuaWZpZWRXYWxsZXRNb2RhbD4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB3YWxsZXRzIH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgd2FsbGV0UHJlY2VkZW5jZSwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IFtpc09wZW4sIG9uVG9nZ2xlXSA9IHVzZVRvZ2dsZShmYWxzZSk7XG4gIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWQgPSB1c2VQcmV2aW91c2x5Q29ubmVjdGVkKCk7XG5cbiAgY29uc3QgbGlzdDogeyByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTsgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7IGhpZ2hsaWdodDogQWRhcHRlcltdOyBvdGhlcnM6IEFkYXB0ZXJbXSB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gVGhlbiwgSW5zdGFsbGVkLCBUb3AgMywgTG9hZGFibGUsIE5vdERldGVjdGVkXG4gICAgY29uc3QgZmlsdGVyZWRBZGFwdGVycyA9IHdhbGxldHMucmVkdWNlPHtcbiAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIGluc3RhbGxlZDogQWRhcHRlcltdO1xuICAgICAgdG9wMzogQWRhcHRlcltdO1xuICAgICAgbG9hZGFibGU6IEFkYXB0ZXJbXTtcbiAgICAgIG5vdERldGVjdGVkOiBBZGFwdGVyW107XG4gICAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICB9PihcbiAgICAgIChhY2MsIHdhbGxldCkgPT4ge1xuICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9IHdhbGxldC5hZGFwdGVyLm5hbWU7XG5cbiAgICAgICAgaWYgKFJFQ09NTUVOREVEX1dBTExFVFMuc29tZSgod2FsbGV0KSA9PiB3YWxsZXQgPT09IGFkYXB0ZXJOYW1lKSkge1xuICAgICAgICAgIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZpb3VzbHkgY29ubmVjdGVkIHRha2VzIGhpZ2hlc3RcbiAgICAgICAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID0gcHJldmlvdXNseUNvbm5lY3RlZC5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnByZXZpb3VzbHlDb25uZWN0ZWRbcHJldmlvdXNseUNvbm5lY3RlZEluZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBJbnN0YWxsZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgIGFjYy5pbnN0YWxsZWQucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3AgM1xuICAgICAgICBjb25zdCB0b3BXYWxsZXRzSW5kZXggPSBUT1BfV0FMTEVUUy5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRvcFdhbGxldHNJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnRvcDNbdG9wV2FsbGV0c0luZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZGFibGVcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90RGV0ZWN0ZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogW10sXG4gICAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IFtdLFxuICAgICAgICBpbnN0YWxsZWQ6IFtdLFxuICAgICAgICB0b3AzOiBbXSxcbiAgICAgICAgbG9hZGFibGU6IFtdLFxuICAgICAgICBub3REZXRlY3RlZDogW10sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMCwgMyk7XG4gICAgICBsZXQgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGgpKTtcbiAgICAgIG90aGVycyA9IG90aGVycy5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ1ByZXZpb3VzbHlDb25uZWN0ZWQnLFxuICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgIG90aGVycyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBpbnN0YWxsZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAzKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLCBoaWdobGlnaHQ6IFtdLCBvdGhlcnM6IFtdIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHRvcDMsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ1RvcFdhbGxldCcsIGhpZ2hsaWdodDogdG9wMywgb3RoZXJzIH07XG4gIH0sIFt3YWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkXSk7XG5cbiAgY29uc3QgY29udGVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIHVzZU91dHNpZGVDbGljayhjb250ZW50UmVmLCBvbkNsb3NlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W1xuICAgICAgICB0d2BtYXgtdy1tZCB3LWZ1bGwgcmVsYXRpdmUgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC14bCBtYXgtaC1bOTB2aF0gbGc6bWF4LWgtWzU3NnB4XSB0cmFuc2l0aW9uLWhlaWdodCBkdXJhdGlvbi01MDAgZWFzZS1pbi1vdXQgYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxkaXYgdHc9XCJib3JkZXItdC1bMXB4XSBib3JkZXItd2hpdGUvMTBcIiAvPlxuICAgICAgPExpc3RPZldhbGxldHMgbGlzdD17bGlzdH0gb25Ub2dnbGU9e29uVG9nZ2xlfSBpc09wZW49e2lzT3Blbn0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVuaWZpZWRXYWxsZXRNb2RhbDtcbiJdfQ== */"]
  }, jsx("span", null, t(`You need to connect a Solana wallet.`)))), jsx("button", {
    css: _ref2$2,
    onClick: onClose
  }, jsx(CloseIcon$1, {
    width: 12,
    height: 12
  })));
};
var _ref3$2 = process.env.NODE_ENV === "production" ? {
  name: "1rigx3j",
  styles: "margin-top:1rem;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:0.5rem;padding-bottom:1rem"
} : {
  name: "1i8hhfs-renderWalletList",
  styles: "margin-top:1rem;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:0.5rem;padding-bottom:1rem;label:renderWalletList;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref4$1 = process.env.NODE_ENV === "production" ? {
  name: "eojnhe",
  styles: "margin-top:1.5rem;font-size:0.75rem;line-height:1rem;font-weight:600"
} : {
  name: "151fd2x-ListOfWallets",
  styles: "margin-top:1.5rem;font-size:0.75rem;line-height:1rem;font-weight:600;label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref5 = process.env.NODE_ENV === "production" ? {
  name: "1jmgjtg",
  styles: "margin-bottom:1.25rem;margin-top:1rem;display:flex;flex-direction:column;> :not([hidden]) ~ :not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse));}@media (min-width: 1024px){flex-direction:row;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.5rem * var(--tw-space-x-reverse));margin-left:calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));--tw-space-y-reverse:0;margin-top:calc(0px * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0px * var(--tw-space-y-reverse));}}"
} : {
  name: "770ug0-ListOfWallets",
  styles: "margin-bottom:1.25rem;margin-top:1rem;display:flex;flex-direction:column;> :not([hidden]) ~ :not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse));}@media (min-width: 1024px){flex-direction:row;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.5rem * var(--tw-space-x-reverse));margin-left:calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));--tw-space-y-reverse:0;margin-top:calc(0px * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0px * var(--tw-space-y-reverse));}};label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref6 = process.env.NODE_ENV === "production" ? {
  name: "1l38ei2",
  styles: "margin-left:1rem;font-size:0.75rem;line-height:1rem;font-weight:600;@media (min-width: 1024px){margin-left:0px;margin-top:0.75rem;}"
} : {
  name: "lkuctx-ListOfWallets",
  styles: "margin-left:1rem;font-size:0.75rem;line-height:1rem;font-weight:600;@media (min-width: 1024px){margin-left:0px;margin-top:0.75rem;};label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref7 = process.env.NODE_ENV === "production" ? {
  name: "eojnhe",
  styles: "margin-top:1.5rem;font-size:0.75rem;line-height:1rem;font-weight:600"
} : {
  name: "151fd2x-ListOfWallets",
  styles: "margin-top:1.5rem;font-size:0.75rem;line-height:1rem;font-weight:600;label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref8 = process.env.NODE_ENV === "production" ? {
  name: "18u6ey2",
  styles: "margin-top:1rem;display:flex;flex-direction:column;> :not([hidden]) ~ :not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse));}@media (min-width: 1024px){flex-direction:row;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.5rem * var(--tw-space-x-reverse));margin-left:calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));--tw-space-y-reverse:0;margin-top:calc(0px * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0px * var(--tw-space-y-reverse));}}"
} : {
  name: "qgikbw-ListOfWallets",
  styles: "margin-top:1rem;display:flex;flex-direction:column;> :not([hidden]) ~ :not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse));}@media (min-width: 1024px){flex-direction:row;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.5rem * var(--tw-space-x-reverse));margin-left:calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));--tw-space-y-reverse:0;margin-top:calc(0px * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0px * var(--tw-space-y-reverse));}};label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref9 = process.env.NODE_ENV === "production" ? {
  name: "1l38ei2",
  styles: "margin-left:1rem;font-size:0.75rem;line-height:1rem;font-weight:600;@media (min-width: 1024px){margin-left:0px;margin-top:0.75rem;}"
} : {
  name: "lkuctx-ListOfWallets",
  styles: "margin-left:1rem;font-size:0.75rem;line-height:1rem;font-weight:600;@media (min-width: 1024px){margin-left:0px;margin-top:0.75rem;};label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref10 = process.env.NODE_ENV === "production" ? {
  name: "ms0594",
  styles: "margin-bottom:-0.5rem;margin-top:1rem;cursor:pointer;font-size:0.75rem;line-height:1rem;font-weight:600;color:rgb(255 255 255 / 0.8);text-decoration-line:underline"
} : {
  name: "102cyhe-ListOfWallets",
  styles: "margin-bottom:-0.5rem;margin-top:1rem;cursor:pointer;font-size:0.75rem;line-height:1rem;font-weight:600;color:rgb(255 255 255 / 0.8);text-decoration-line:underline;label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref11 = process.env.NODE_ENV === "production" ? {
  name: "vambv7",
  styles: "margin-top:1.25rem;display:flex;cursor:pointer;justify-content:space-between"
} : {
  name: "1fnv6a8-ListOfWallets",
  styles: "margin-top:1.25rem;display:flex;cursor:pointer;justify-content:space-between;label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref12 = process.env.NODE_ENV === "production" ? {
  name: "1ide98v",
  styles: "font-size:0.75rem;line-height:1rem;font-weight:600"
} : {
  name: "tdoa3r-ListOfWallets",
  styles: "font-size:0.75rem;line-height:1rem;font-weight:600;label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref13 = process.env.NODE_ENV === "production" ? {
  name: "s5xdrg",
  styles: "display:flex;align-items:center"
} : {
  name: "1886g4p-ListOfWallets",
  styles: "display:flex;align-items:center;label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref14 = process.env.NODE_ENV === "production" ? {
  name: "f47xmg",
  styles: "height:6px;width:10px"
} : {
  name: "2o4mx0-ListOfWallets",
  styles: "height:6px;width:10px;label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
const ListOfWallets = ({
  list,
  onToggle,
  isOpen
}) => {
  const {
    handleConnectClick,
    walletlistExplanation,
    walletAttachments,
    theme
  } = useUnifiedWalletContext();
  const {
    t
  } = useTranslation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotInstalled, setShowNotInstalled] = useState(false);
  const onClickWallet = React.useCallback((event, adapter) => {
    if (adapter.readyState === WalletReadyState.NotDetected) {
      setShowNotInstalled(adapter);
      return;
    }
    handleConnectClick(event, adapter);
  }, []);
  const renderWalletList = useMemo(() => jsx("div", null, jsx("div", {
    css: _ref3$2,
    translate: "no"
  }, list.others.map((adapter, index) => {
    return jsx("ul", {
      key: index
    }, jsx(WalletListItem, {
      handleClick: e => onClickWallet(e, adapter),
      wallet: adapter
    }));
  })), list.highlightedBy !== 'Onboarding' && walletlistExplanation ? jsx("div", {
    css: ["font-size:0.75rem;line-height:1rem;font-weight:600;text-decoration-line:underline;", list.others.length > 6 ? {
      "marginBottom": "2rem"
    } : '', process.env.NODE_ENV === "production" ? "" : ";label:renderWalletList;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUErR2UiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuXG5pbXBvcnQgeyBXYWxsZXRJY29uLCBXYWxsZXRMaXN0SXRlbSB9IGZyb20gJy4vV2FsbGV0TGlzdEl0ZW0nO1xuXG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5cbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2hldnJvbkRvd25JY29uIGZyb20gJy4uLy4uL2ljb25zL0NoZXZyb25Eb3duSWNvbic7XG5pbXBvcnQgQ2hldnJvblVwSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uVXBJY29uJztcbmltcG9ydCBDbG9zZUljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2xvc2VJY29uJztcbmltcG9ydCB7IGlzTW9iaWxlLCB1c2VPdXRzaWRlQ2xpY2sgfSBmcm9tICcuLi8uLi9taXNjL3V0aWxzJztcbmltcG9ydCBOb3RJbnN0YWxsZWQgZnJvbSAnLi9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuL09uYm9hcmRpbmcnO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBsaWdodDogW3R3YHRleHQtYmxhY2sgIWJnLXdoaXRlIHNoYWRvdy14bGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlICFiZy1bIzNBM0I0M10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlIGJnLVtyZ2IoNDksIDYyLCA3NildYF0sXG4gIH0sXG4gIHNoYWRlczoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjZmZmZmZmXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAgZGFyazogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzNBM0I0M10gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tW3JnYig0OSwgNjIsIDc2KV0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICB9LFxuICB3YWxsZXRJdGVtOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmF5LTUwIGhvdmVyOnNoYWRvdy1sZyBob3Zlcjpib3JkZXItYmxhY2svMTBgXSxcbiAgICBkYXJrOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF1cbiAgfVxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gbGVhZGluZy1ub25lYCwgc3R5bGVzLmhlYWRlclt0aGVtZV1dfT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIG10LTFgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYFlvdSBuZWVkIHRvIGNvbm5lY3QgYSBTb2xhbmEgd2FsbGV0LmApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8c3BhbiB0dz1cIm10LTYgdGV4dC14cyBmb250LXNlbWlib2xkXCI+e3QoYFJlY29tbWVuZGVkIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTAgbWItNVwiPlxuICAgICAgICAgIHtsaXN0LnJlY29tbWVuZGVkV2FsbGV0cy5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGxnOmZsZXgtY29sIGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdSZWNvbW1lbmRlZCcgPyB0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdQcmV2aW91c2x5Q29ubmVjdGVkJyA/IHQoYFJlY2VudGx5IHVzZWRgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ0luc3RhbGxlZCcgPyB0KGBJbnN0YWxsZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnVG9wV2FsbGV0JyA/IHQoYFBvcHVsYXIgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0Lm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIGxnOm1heC13LVszMyVdYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1iZXR3ZWVuIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0KGBNb3JlIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICA8ZGl2IHR3PVwiIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ3LVsxMHB4XSBoLVs2cHhdXCI+e2lzT3BlbiA/IDxDaGV2cm9uVXBJY29uIC8+IDogPENoZXZyb25Eb3duSWNvbiAvPn08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLCBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV1dfT5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSl9PlxuICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXYgPlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqLyB9XG4gIHtcbiAgICBpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgIDw+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICA8Lz5cbiAgICApIDogbnVsbFxuICB9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydCYWNrcGFjaycgYXMgV2FsbGV0TmFtZTwnQmFja3BhY2snPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG4gICdTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPixcbl07XG5cbmludGVyZmFjZSBJVW5pZmllZFdhbGxldE1vZGFsIHtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbn1cblxuY29uc3Qgc29ydEJ5UHJlY2VkZW5jZSA9ICh3YWxsZXRQcmVjZWRlbmNlOiBXYWxsZXROYW1lW10pID0+IChhOiBBZGFwdGVyLCBiOiBBZGFwdGVyKSA9PiB7XG4gIGlmICghd2FsbGV0UHJlY2VkZW5jZSkgcmV0dXJuIDA7XG5cbiAgY29uc3QgYUluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGEubmFtZSk7XG4gIGNvbnN0IGJJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihiLm5hbWUpO1xuXG4gIGlmIChhSW5kZXggPT09IC0xICYmIGJJbmRleCA9PT0gLTEpIHJldHVybiAwO1xuICBpZiAoYUluZGV4ID49IDApIHtcbiAgICBpZiAoYkluZGV4ID09PSAtMSkgcmV0dXJuIC0xO1xuICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gIH1cblxuICBpZiAoYkluZGV4ID49IDApIHtcbiAgICBpZiAoYUluZGV4ID09PSAtMSkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGJJbmRleCAtIGFJbmRleDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbmNvbnN0IFVuaWZpZWRXYWxsZXRNb2RhbDogUmVhY3QuRkM8SVVuaWZpZWRXYWxsZXRNb2RhbD4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB3YWxsZXRzIH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgd2FsbGV0UHJlY2VkZW5jZSwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IFtpc09wZW4sIG9uVG9nZ2xlXSA9IHVzZVRvZ2dsZShmYWxzZSk7XG4gIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWQgPSB1c2VQcmV2aW91c2x5Q29ubmVjdGVkKCk7XG5cbiAgY29uc3QgbGlzdDogeyByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTsgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7IGhpZ2hsaWdodDogQWRhcHRlcltdOyBvdGhlcnM6IEFkYXB0ZXJbXSB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gVGhlbiwgSW5zdGFsbGVkLCBUb3AgMywgTG9hZGFibGUsIE5vdERldGVjdGVkXG4gICAgY29uc3QgZmlsdGVyZWRBZGFwdGVycyA9IHdhbGxldHMucmVkdWNlPHtcbiAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIGluc3RhbGxlZDogQWRhcHRlcltdO1xuICAgICAgdG9wMzogQWRhcHRlcltdO1xuICAgICAgbG9hZGFibGU6IEFkYXB0ZXJbXTtcbiAgICAgIG5vdERldGVjdGVkOiBBZGFwdGVyW107XG4gICAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICB9PihcbiAgICAgIChhY2MsIHdhbGxldCkgPT4ge1xuICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9IHdhbGxldC5hZGFwdGVyLm5hbWU7XG5cbiAgICAgICAgaWYgKFJFQ09NTUVOREVEX1dBTExFVFMuc29tZSgod2FsbGV0KSA9PiB3YWxsZXQgPT09IGFkYXB0ZXJOYW1lKSkge1xuICAgICAgICAgIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZpb3VzbHkgY29ubmVjdGVkIHRha2VzIGhpZ2hlc3RcbiAgICAgICAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID0gcHJldmlvdXNseUNvbm5lY3RlZC5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnByZXZpb3VzbHlDb25uZWN0ZWRbcHJldmlvdXNseUNvbm5lY3RlZEluZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBJbnN0YWxsZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgIGFjYy5pbnN0YWxsZWQucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3AgM1xuICAgICAgICBjb25zdCB0b3BXYWxsZXRzSW5kZXggPSBUT1BfV0FMTEVUUy5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRvcFdhbGxldHNJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnRvcDNbdG9wV2FsbGV0c0luZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZGFibGVcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90RGV0ZWN0ZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogW10sXG4gICAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IFtdLFxuICAgICAgICBpbnN0YWxsZWQ6IFtdLFxuICAgICAgICB0b3AzOiBbXSxcbiAgICAgICAgbG9hZGFibGU6IFtdLFxuICAgICAgICBub3REZXRlY3RlZDogW10sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMCwgMyk7XG4gICAgICBsZXQgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGgpKTtcbiAgICAgIG90aGVycyA9IG90aGVycy5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ1ByZXZpb3VzbHlDb25uZWN0ZWQnLFxuICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgIG90aGVycyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBpbnN0YWxsZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAzKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLCBoaWdobGlnaHQ6IFtdLCBvdGhlcnM6IFtdIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHRvcDMsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ1RvcFdhbGxldCcsIGhpZ2hsaWdodDogdG9wMywgb3RoZXJzIH07XG4gIH0sIFt3YWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkXSk7XG5cbiAgY29uc3QgY29udGVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIHVzZU91dHNpZGVDbGljayhjb250ZW50UmVmLCBvbkNsb3NlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W1xuICAgICAgICB0d2BtYXgtdy1tZCB3LWZ1bGwgcmVsYXRpdmUgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC14bCBtYXgtaC1bOTB2aF0gbGc6bWF4LWgtWzU3NnB4XSB0cmFuc2l0aW9uLWhlaWdodCBkdXJhdGlvbi01MDAgZWFzZS1pbi1vdXQgYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxkaXYgdHc9XCJib3JkZXItdC1bMXB4XSBib3JkZXItd2hpdGUvMTBcIiAvPlxuICAgICAgPExpc3RPZldhbGxldHMgbGlzdD17bGlzdH0gb25Ub2dnbGU9e29uVG9nZ2xlfSBpc09wZW49e2lzT3Blbn0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVuaWZpZWRXYWxsZXRNb2RhbDtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:renderWalletList;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUErR2UiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuXG5pbXBvcnQgeyBXYWxsZXRJY29uLCBXYWxsZXRMaXN0SXRlbSB9IGZyb20gJy4vV2FsbGV0TGlzdEl0ZW0nO1xuXG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5cbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2hldnJvbkRvd25JY29uIGZyb20gJy4uLy4uL2ljb25zL0NoZXZyb25Eb3duSWNvbic7XG5pbXBvcnQgQ2hldnJvblVwSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uVXBJY29uJztcbmltcG9ydCBDbG9zZUljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2xvc2VJY29uJztcbmltcG9ydCB7IGlzTW9iaWxlLCB1c2VPdXRzaWRlQ2xpY2sgfSBmcm9tICcuLi8uLi9taXNjL3V0aWxzJztcbmltcG9ydCBOb3RJbnN0YWxsZWQgZnJvbSAnLi9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuL09uYm9hcmRpbmcnO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBsaWdodDogW3R3YHRleHQtYmxhY2sgIWJnLXdoaXRlIHNoYWRvdy14bGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlICFiZy1bIzNBM0I0M10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlIGJnLVtyZ2IoNDksIDYyLCA3NildYF0sXG4gIH0sXG4gIHNoYWRlczoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjZmZmZmZmXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAgZGFyazogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzNBM0I0M10gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tW3JnYig0OSwgNjIsIDc2KV0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICB9LFxuICB3YWxsZXRJdGVtOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmF5LTUwIGhvdmVyOnNoYWRvdy1sZyBob3Zlcjpib3JkZXItYmxhY2svMTBgXSxcbiAgICBkYXJrOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF1cbiAgfVxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gbGVhZGluZy1ub25lYCwgc3R5bGVzLmhlYWRlclt0aGVtZV1dfT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIG10LTFgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYFlvdSBuZWVkIHRvIGNvbm5lY3QgYSBTb2xhbmEgd2FsbGV0LmApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8c3BhbiB0dz1cIm10LTYgdGV4dC14cyBmb250LXNlbWlib2xkXCI+e3QoYFJlY29tbWVuZGVkIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTAgbWItNVwiPlxuICAgICAgICAgIHtsaXN0LnJlY29tbWVuZGVkV2FsbGV0cy5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGxnOmZsZXgtY29sIGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdSZWNvbW1lbmRlZCcgPyB0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdQcmV2aW91c2x5Q29ubmVjdGVkJyA/IHQoYFJlY2VudGx5IHVzZWRgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ0luc3RhbGxlZCcgPyB0KGBJbnN0YWxsZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnVG9wV2FsbGV0JyA/IHQoYFBvcHVsYXIgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0Lm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIGxnOm1heC13LVszMyVdYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1iZXR3ZWVuIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0KGBNb3JlIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICA8ZGl2IHR3PVwiIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ3LVsxMHB4XSBoLVs2cHhdXCI+e2lzT3BlbiA/IDxDaGV2cm9uVXBJY29uIC8+IDogPENoZXZyb25Eb3duSWNvbiAvPn08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLCBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV1dfT5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSl9PlxuICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXYgPlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqLyB9XG4gIHtcbiAgICBpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgIDw+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICA8Lz5cbiAgICApIDogbnVsbFxuICB9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydCYWNrcGFjaycgYXMgV2FsbGV0TmFtZTwnQmFja3BhY2snPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG4gICdTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPixcbl07XG5cbmludGVyZmFjZSBJVW5pZmllZFdhbGxldE1vZGFsIHtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbn1cblxuY29uc3Qgc29ydEJ5UHJlY2VkZW5jZSA9ICh3YWxsZXRQcmVjZWRlbmNlOiBXYWxsZXROYW1lW10pID0+IChhOiBBZGFwdGVyLCBiOiBBZGFwdGVyKSA9PiB7XG4gIGlmICghd2FsbGV0UHJlY2VkZW5jZSkgcmV0dXJuIDA7XG5cbiAgY29uc3QgYUluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGEubmFtZSk7XG4gIGNvbnN0IGJJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihiLm5hbWUpO1xuXG4gIGlmIChhSW5kZXggPT09IC0xICYmIGJJbmRleCA9PT0gLTEpIHJldHVybiAwO1xuICBpZiAoYUluZGV4ID49IDApIHtcbiAgICBpZiAoYkluZGV4ID09PSAtMSkgcmV0dXJuIC0xO1xuICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gIH1cblxuICBpZiAoYkluZGV4ID49IDApIHtcbiAgICBpZiAoYUluZGV4ID09PSAtMSkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGJJbmRleCAtIGFJbmRleDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbmNvbnN0IFVuaWZpZWRXYWxsZXRNb2RhbDogUmVhY3QuRkM8SVVuaWZpZWRXYWxsZXRNb2RhbD4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB3YWxsZXRzIH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgd2FsbGV0UHJlY2VkZW5jZSwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IFtpc09wZW4sIG9uVG9nZ2xlXSA9IHVzZVRvZ2dsZShmYWxzZSk7XG4gIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWQgPSB1c2VQcmV2aW91c2x5Q29ubmVjdGVkKCk7XG5cbiAgY29uc3QgbGlzdDogeyByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTsgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7IGhpZ2hsaWdodDogQWRhcHRlcltdOyBvdGhlcnM6IEFkYXB0ZXJbXSB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gVGhlbiwgSW5zdGFsbGVkLCBUb3AgMywgTG9hZGFibGUsIE5vdERldGVjdGVkXG4gICAgY29uc3QgZmlsdGVyZWRBZGFwdGVycyA9IHdhbGxldHMucmVkdWNlPHtcbiAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIGluc3RhbGxlZDogQWRhcHRlcltdO1xuICAgICAgdG9wMzogQWRhcHRlcltdO1xuICAgICAgbG9hZGFibGU6IEFkYXB0ZXJbXTtcbiAgICAgIG5vdERldGVjdGVkOiBBZGFwdGVyW107XG4gICAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICB9PihcbiAgICAgIChhY2MsIHdhbGxldCkgPT4ge1xuICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9IHdhbGxldC5hZGFwdGVyLm5hbWU7XG5cbiAgICAgICAgaWYgKFJFQ09NTUVOREVEX1dBTExFVFMuc29tZSgod2FsbGV0KSA9PiB3YWxsZXQgPT09IGFkYXB0ZXJOYW1lKSkge1xuICAgICAgICAgIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZpb3VzbHkgY29ubmVjdGVkIHRha2VzIGhpZ2hlc3RcbiAgICAgICAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID0gcHJldmlvdXNseUNvbm5lY3RlZC5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnByZXZpb3VzbHlDb25uZWN0ZWRbcHJldmlvdXNseUNvbm5lY3RlZEluZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBJbnN0YWxsZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgIGFjYy5pbnN0YWxsZWQucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3AgM1xuICAgICAgICBjb25zdCB0b3BXYWxsZXRzSW5kZXggPSBUT1BfV0FMTEVUUy5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRvcFdhbGxldHNJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnRvcDNbdG9wV2FsbGV0c0luZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZGFibGVcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90RGV0ZWN0ZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogW10sXG4gICAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IFtdLFxuICAgICAgICBpbnN0YWxsZWQ6IFtdLFxuICAgICAgICB0b3AzOiBbXSxcbiAgICAgICAgbG9hZGFibGU6IFtdLFxuICAgICAgICBub3REZXRlY3RlZDogW10sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMCwgMyk7XG4gICAgICBsZXQgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGgpKTtcbiAgICAgIG90aGVycyA9IG90aGVycy5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ1ByZXZpb3VzbHlDb25uZWN0ZWQnLFxuICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgIG90aGVycyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBpbnN0YWxsZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAzKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLCBoaWdobGlnaHQ6IFtdLCBvdGhlcnM6IFtdIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHRvcDMsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ1RvcFdhbGxldCcsIGhpZ2hsaWdodDogdG9wMywgb3RoZXJzIH07XG4gIH0sIFt3YWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkXSk7XG5cbiAgY29uc3QgY29udGVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIHVzZU91dHNpZGVDbGljayhjb250ZW50UmVmLCBvbkNsb3NlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W1xuICAgICAgICB0d2BtYXgtdy1tZCB3LWZ1bGwgcmVsYXRpdmUgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC14bCBtYXgtaC1bOTB2aF0gbGc6bWF4LWgtWzU3NnB4XSB0cmFuc2l0aW9uLWhlaWdodCBkdXJhdGlvbi01MDAgZWFzZS1pbi1vdXQgYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxkaXYgdHc9XCJib3JkZXItdC1bMXB4XSBib3JkZXItd2hpdGUvMTBcIiAvPlxuICAgICAgPExpc3RPZldhbGxldHMgbGlzdD17bGlzdH0gb25Ub2dnbGU9e29uVG9nZ2xlfSBpc09wZW49e2lzT3Blbn0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVuaWZpZWRXYWxsZXRNb2RhbDtcbiJdfQ== */"]
  }, jsx("a", {
    href: walletlistExplanation.href,
    target: "_blank",
    rel: "noopener noreferrer"
  }, jsx("span", null, t(`Can't find your wallet?`)))) : null), [handleConnectClick, list.others]);
  const hasNoWallets = useMemo(() => {
    return list.highlight.length === 0 && list.others.length === 0;
  }, [list]);
  useEffect(() => {
    if (hasNoWallets) {
      setShowOnboarding(true);
    }
  }, [hasNoWallets]);
  if (showOnboarding) {
    return jsx(OnboardingFlow, {
      showBack: !hasNoWallets,
      onClose: () => setShowOnboarding(false)
    });
  }
  if (showNotInstalled) {
    return jsx(NotInstalled$1, {
      adapter: showNotInstalled,
      onClose: () => setShowNotInstalled(false),
      onGoOnboarding: () => {
        setShowOnboarding(true);
        setShowNotInstalled(false);
      }
    });
  }
  return jsx(React.Fragment, null, jsx("div", {
    className: "hideScrollbar",
    css: ["position:relative;height:100%;overflow-y:auto;padding-left:1.25rem;padding-right:1.25rem;padding-bottom:2rem;padding-top:0.75rem;", isOpen && {
      "marginBottom": "1.75rem"
    }, process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1SnFDIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcblxuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcblxuaW1wb3J0IENvbGxhcHNlIGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQ29sbGFwc2UnO1xuXG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENoZXZyb25Eb3duSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uRG93bkljb24nO1xuaW1wb3J0IENoZXZyb25VcEljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2hldnJvblVwSWNvbic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4vTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi9PbmJvYXJkaW5nJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrICFiZy13aGl0ZSBzaGFkb3cteGxgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZSAhYmctWyMzQTNCNDNdIGJvcmRlciBib3JkZXItd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGcgaG92ZXI6Ym9yZGVyLWJsYWNrLzEwYF0sXG4gICAgZGFyazogW3R3YGhvdmVyOnNoYWRvdy0yeGwgaG92ZXI6Ymctd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdXG4gIH1cbn07XG5cbmNvbnN0IEhlYWRlcjogUmVhY3QuRkM8eyBvbkNsb3NlOiAoKSA9PiB2b2lkIH0+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY3NzPXtbdHdgcHgtNSBweS02IGZsZXgganVzdGlmeS1iZXR3ZWVuIGxlYWRpbmctbm9uZWAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIDxzcGFuPnt0KGBDb25uZWN0IFdhbGxldGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBtdC0xYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIDxzcGFuPnt0KGBZb3UgbmVlZCB0byBjb25uZWN0IGEgU29sYW5hIHdhbGxldC5gKX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxidXR0b24gdHc9XCJhYnNvbHV0ZSB0b3AtNCByaWdodC00XCIgb25DbGljaz17b25DbG9zZX0+XG4gICAgICAgIDxDbG9zZUljb24gd2lkdGg9ezEyfSBoZWlnaHQ9ezEyfSAvPlxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5jb25zdCBMaXN0T2ZXYWxsZXRzOiBSZWFjdC5GQzx7XG4gIGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfTtcbiAgb25Ub2dnbGU6IChuZXh0VmFsdWU/OiBhbnkpID0+IHZvaWQ7XG4gIGlzT3BlbjogYm9vbGVhbjtcbn0+ID0gKHsgbGlzdCwgb25Ub2dnbGUsIGlzT3BlbiB9KSA9PiB7XG4gIGNvbnN0IHsgaGFuZGxlQ29ubmVjdENsaWNrLCB3YWxsZXRsaXN0RXhwbGFuYXRpb24sIHdhbGxldEF0dGFjaG1lbnRzLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCBbc2hvd09uYm9hcmRpbmcsIHNldFNob3dPbmJvYXJkaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3Nob3dOb3RJbnN0YWxsZWQsIHNldFNob3dOb3RJbnN0YWxsZWRdID0gdXNlU3RhdGU8QWRhcHRlciB8IGZhbHNlPihmYWxzZSk7XG5cbiAgY29uc3Qgb25DbGlja1dhbGxldCA9IFJlYWN0LnVzZUNhbGxiYWNrKChldmVudDogUmVhY3QuTW91c2VFdmVudDxIVE1MRWxlbWVudCwgTW91c2VFdmVudD4sIGFkYXB0ZXI6IEFkYXB0ZXIpID0+IHtcbiAgICBpZiAoYWRhcHRlci5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICBzZXRTaG93Tm90SW5zdGFsbGVkKGFkYXB0ZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoYW5kbGVDb25uZWN0Q2xpY2soZXZlbnQsIGFkYXB0ZXIpO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgcmVuZGVyV2FsbGV0TGlzdCA9IHVzZU1lbW8oXG4gICAgKCkgPT4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiB0dz1cIm10LTQgZ3JpZCBnYXAtMiBncmlkLWNvbHMtMiBwYi00XCIgdHJhbnNsYXRlPVwibm9cIj5cbiAgICAgICAgICB7bGlzdC5vdGhlcnMubWFwKChhZGFwdGVyLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPHVsIGtleT17aW5kZXh9PlxuICAgICAgICAgICAgICAgIDxXYWxsZXRMaXN0SXRlbSBoYW5kbGVDbGljaz17KGUpID0+IG9uQ2xpY2tXYWxsZXQoZSwgYWRhcHRlcil9IHdhbGxldD17YWRhcHRlcn0gLz5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ICE9PSAnT25ib2FyZGluZycgJiYgd2FsbGV0bGlzdEV4cGxhbmF0aW9uID8gKFxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBmb250LXNlbWlib2xkIHVuZGVybGluZWAsIGxpc3Qub3RoZXJzLmxlbmd0aCA+IDYgPyB0d2BtYi04YCA6ICcnXX0+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgPC9kaXY+XG4gICAgKSxcbiAgICBbaGFuZGxlQ29ubmVjdENsaWNrLCBsaXN0Lm90aGVyc10sXG4gICk7XG5cbiAgY29uc3QgaGFzTm9XYWxsZXRzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgcmV0dXJuIGxpc3QuaGlnaGxpZ2h0Lmxlbmd0aCA9PT0gMCAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDA7XG4gIH0sIFtsaXN0XSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaGFzTm9XYWxsZXRzKSB7XG4gICAgICBzZXRTaG93T25ib2FyZGluZyh0cnVlKTtcbiAgICB9XG4gIH0sIFtoYXNOb1dhbGxldHNdKTtcblxuICBpZiAoc2hvd09uYm9hcmRpbmcpIHtcbiAgICByZXR1cm4gPE9uYm9hcmRpbmdGbG93IHNob3dCYWNrPXshaGFzTm9XYWxsZXRzfSBvbkNsb3NlPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyhmYWxzZSl9IC8+O1xuICB9XG5cbiAgaWYgKHNob3dOb3RJbnN0YWxsZWQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPE5vdEluc3RhbGxlZFxuICAgICAgICBhZGFwdGVyPXtzaG93Tm90SW5zdGFsbGVkfVxuICAgICAgICBvbkNsb3NlPXsoKSA9PiBzZXRTaG93Tm90SW5zdGFsbGVkKGZhbHNlKX1cbiAgICAgICAgb25Hb09uYm9hcmRpbmc9eygpID0+IHtcbiAgICAgICAgICBzZXRTaG93T25ib2FyZGluZyh0cnVlKTtcbiAgICAgICAgICBzZXRTaG93Tm90SW5zdGFsbGVkKGZhbHNlKTtcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiIGNzcz17W3R3YGgtZnVsbCBvdmVyZmxvdy15LWF1dG8gcHQtMyBwYi04IHB4LTUgcmVsYXRpdmVgLCBpc09wZW4gJiYgdHdgbWItN2BdfT5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPnt0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wIG1iLTVcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14cyBtbC00IGxnOm1sLTAgbGc6bXQtM1wiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzcGFuIHR3PVwibXQtNiB0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnUmVjb21tZW5kZWQnID8gdChgUmVjb21tZW5kZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnUHJldmlvdXNseUNvbm5lY3RlZCcgPyB0KGBSZWNlbnRseSB1c2VkYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdJbnN0YWxsZWQnID8gdChgSW5zdGFsbGVkIHdhbGxldHNgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ1RvcFdhbGxldCcgPyB0KGBQb3B1bGFyIHdhbGxldHNgKSA6IG51bGx9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPGRpdiB0dz1cIm10LTQgZmxleCBmbGV4LWNvbCBsZzpmbGV4LXJvdyBsZzpzcGFjZS14LTIgc3BhY2UteS0yIGxnOnNwYWNlLXktMFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggbGc6ZmxleC1jb2wgaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSBsZzptYXgtdy1bMzMlXWAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14cyBtbC00IGxnOm1sLTAgbGc6bXQtM1wiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktYmV0d2VlbiBjdXJzb3ItcG9pbnRlclwiIG9uQ2xpY2s9e29uVG9nZ2xlfT5cbiAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICAgICAgPGRpdiB0dz1cIiBmbGV4IGl0ZW1zLWNlbnRlclwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwidy1bMTBweF0gaC1bNnB4XVwiPntpc09wZW4gPyA8Q2hldnJvblVwSWNvbiAvPiA6IDxDaGV2cm9uRG93bkljb24gLz59PC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Q29sbGFwc2UgaGVpZ2h0PXswfSBtYXhIZWlnaHQ9eydhdXRvJ30gZXhwYW5kZWQ9e2lzT3Blbn0+XG4gICAgICAgICAgICAgIHtyZW5kZXJXYWxsZXRMaXN0fVxuICAgICAgICAgICAgPC9Db2xsYXBzZT5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyYCwgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdXX0+XG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2ID5cblxuICAgICAgey8qIEJvdHRvbSBTaGFkZXMgKi8gfVxuICB7XG4gICAgaXNPcGVuICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA+IDYgPyAoXG4gICAgICA8PlxuICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgPC8+XG4gICAgKSA6IG51bGxcbiAgfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuICAnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBVbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHsgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107IGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZOyBoaWdobGlnaHQ6IEFkYXB0ZXJbXTsgb3RoZXJzOiBBZGFwdGVyW10gfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkpIHtcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMyk7XG4gICAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGgpKTtcblxuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnSW5zdGFsbGVkJywgaGlnaGxpZ2h0LCBvdGhlcnMgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5sb2FkYWJsZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0czogZmlsdGVyZWRBZGFwdGVycy5yZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdPbmJvYXJkaW5nJywgaGlnaGxpZ2h0OiBbXSwgb3RoZXJzOiBbXSB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgbWF4LWgtWzkwdmhdIGxnOm1heC1oLVs1NzZweF0gdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0IGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8ZGl2IHR3PVwiYm9yZGVyLXQtWzFweF0gYm9yZGVyLXdoaXRlLzEwXCIgLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBVbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1SnFDIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcblxuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcblxuaW1wb3J0IENvbGxhcHNlIGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQ29sbGFwc2UnO1xuXG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENoZXZyb25Eb3duSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uRG93bkljb24nO1xuaW1wb3J0IENoZXZyb25VcEljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2hldnJvblVwSWNvbic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4vTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi9PbmJvYXJkaW5nJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrICFiZy13aGl0ZSBzaGFkb3cteGxgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZSAhYmctWyMzQTNCNDNdIGJvcmRlciBib3JkZXItd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGcgaG92ZXI6Ym9yZGVyLWJsYWNrLzEwYF0sXG4gICAgZGFyazogW3R3YGhvdmVyOnNoYWRvdy0yeGwgaG92ZXI6Ymctd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdXG4gIH1cbn07XG5cbmNvbnN0IEhlYWRlcjogUmVhY3QuRkM8eyBvbkNsb3NlOiAoKSA9PiB2b2lkIH0+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY3NzPXtbdHdgcHgtNSBweS02IGZsZXgganVzdGlmeS1iZXR3ZWVuIGxlYWRpbmctbm9uZWAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIDxzcGFuPnt0KGBDb25uZWN0IFdhbGxldGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBtdC0xYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIDxzcGFuPnt0KGBZb3UgbmVlZCB0byBjb25uZWN0IGEgU29sYW5hIHdhbGxldC5gKX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxidXR0b24gdHc9XCJhYnNvbHV0ZSB0b3AtNCByaWdodC00XCIgb25DbGljaz17b25DbG9zZX0+XG4gICAgICAgIDxDbG9zZUljb24gd2lkdGg9ezEyfSBoZWlnaHQ9ezEyfSAvPlxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5jb25zdCBMaXN0T2ZXYWxsZXRzOiBSZWFjdC5GQzx7XG4gIGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfTtcbiAgb25Ub2dnbGU6IChuZXh0VmFsdWU/OiBhbnkpID0+IHZvaWQ7XG4gIGlzT3BlbjogYm9vbGVhbjtcbn0+ID0gKHsgbGlzdCwgb25Ub2dnbGUsIGlzT3BlbiB9KSA9PiB7XG4gIGNvbnN0IHsgaGFuZGxlQ29ubmVjdENsaWNrLCB3YWxsZXRsaXN0RXhwbGFuYXRpb24sIHdhbGxldEF0dGFjaG1lbnRzLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCBbc2hvd09uYm9hcmRpbmcsIHNldFNob3dPbmJvYXJkaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3Nob3dOb3RJbnN0YWxsZWQsIHNldFNob3dOb3RJbnN0YWxsZWRdID0gdXNlU3RhdGU8QWRhcHRlciB8IGZhbHNlPihmYWxzZSk7XG5cbiAgY29uc3Qgb25DbGlja1dhbGxldCA9IFJlYWN0LnVzZUNhbGxiYWNrKChldmVudDogUmVhY3QuTW91c2VFdmVudDxIVE1MRWxlbWVudCwgTW91c2VFdmVudD4sIGFkYXB0ZXI6IEFkYXB0ZXIpID0+IHtcbiAgICBpZiAoYWRhcHRlci5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICBzZXRTaG93Tm90SW5zdGFsbGVkKGFkYXB0ZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoYW5kbGVDb25uZWN0Q2xpY2soZXZlbnQsIGFkYXB0ZXIpO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgcmVuZGVyV2FsbGV0TGlzdCA9IHVzZU1lbW8oXG4gICAgKCkgPT4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiB0dz1cIm10LTQgZ3JpZCBnYXAtMiBncmlkLWNvbHMtMiBwYi00XCIgdHJhbnNsYXRlPVwibm9cIj5cbiAgICAgICAgICB7bGlzdC5vdGhlcnMubWFwKChhZGFwdGVyLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPHVsIGtleT17aW5kZXh9PlxuICAgICAgICAgICAgICAgIDxXYWxsZXRMaXN0SXRlbSBoYW5kbGVDbGljaz17KGUpID0+IG9uQ2xpY2tXYWxsZXQoZSwgYWRhcHRlcil9IHdhbGxldD17YWRhcHRlcn0gLz5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ICE9PSAnT25ib2FyZGluZycgJiYgd2FsbGV0bGlzdEV4cGxhbmF0aW9uID8gKFxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBmb250LXNlbWlib2xkIHVuZGVybGluZWAsIGxpc3Qub3RoZXJzLmxlbmd0aCA+IDYgPyB0d2BtYi04YCA6ICcnXX0+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgPC9kaXY+XG4gICAgKSxcbiAgICBbaGFuZGxlQ29ubmVjdENsaWNrLCBsaXN0Lm90aGVyc10sXG4gICk7XG5cbiAgY29uc3QgaGFzTm9XYWxsZXRzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgcmV0dXJuIGxpc3QuaGlnaGxpZ2h0Lmxlbmd0aCA9PT0gMCAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDA7XG4gIH0sIFtsaXN0XSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaGFzTm9XYWxsZXRzKSB7XG4gICAgICBzZXRTaG93T25ib2FyZGluZyh0cnVlKTtcbiAgICB9XG4gIH0sIFtoYXNOb1dhbGxldHNdKTtcblxuICBpZiAoc2hvd09uYm9hcmRpbmcpIHtcbiAgICByZXR1cm4gPE9uYm9hcmRpbmdGbG93IHNob3dCYWNrPXshaGFzTm9XYWxsZXRzfSBvbkNsb3NlPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyhmYWxzZSl9IC8+O1xuICB9XG5cbiAgaWYgKHNob3dOb3RJbnN0YWxsZWQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPE5vdEluc3RhbGxlZFxuICAgICAgICBhZGFwdGVyPXtzaG93Tm90SW5zdGFsbGVkfVxuICAgICAgICBvbkNsb3NlPXsoKSA9PiBzZXRTaG93Tm90SW5zdGFsbGVkKGZhbHNlKX1cbiAgICAgICAgb25Hb09uYm9hcmRpbmc9eygpID0+IHtcbiAgICAgICAgICBzZXRTaG93T25ib2FyZGluZyh0cnVlKTtcbiAgICAgICAgICBzZXRTaG93Tm90SW5zdGFsbGVkKGZhbHNlKTtcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiIGNzcz17W3R3YGgtZnVsbCBvdmVyZmxvdy15LWF1dG8gcHQtMyBwYi04IHB4LTUgcmVsYXRpdmVgLCBpc09wZW4gJiYgdHdgbWItN2BdfT5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPnt0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wIG1iLTVcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14cyBtbC00IGxnOm1sLTAgbGc6bXQtM1wiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzcGFuIHR3PVwibXQtNiB0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnUmVjb21tZW5kZWQnID8gdChgUmVjb21tZW5kZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnUHJldmlvdXNseUNvbm5lY3RlZCcgPyB0KGBSZWNlbnRseSB1c2VkYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdJbnN0YWxsZWQnID8gdChgSW5zdGFsbGVkIHdhbGxldHNgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ1RvcFdhbGxldCcgPyB0KGBQb3B1bGFyIHdhbGxldHNgKSA6IG51bGx9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPGRpdiB0dz1cIm10LTQgZmxleCBmbGV4LWNvbCBsZzpmbGV4LXJvdyBsZzpzcGFjZS14LTIgc3BhY2UteS0yIGxnOnNwYWNlLXktMFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggbGc6ZmxleC1jb2wgaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSBsZzptYXgtdy1bMzMlXWAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14cyBtbC00IGxnOm1sLTAgbGc6bXQtM1wiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktYmV0d2VlbiBjdXJzb3ItcG9pbnRlclwiIG9uQ2xpY2s9e29uVG9nZ2xlfT5cbiAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICAgICAgPGRpdiB0dz1cIiBmbGV4IGl0ZW1zLWNlbnRlclwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwidy1bMTBweF0gaC1bNnB4XVwiPntpc09wZW4gPyA8Q2hldnJvblVwSWNvbiAvPiA6IDxDaGV2cm9uRG93bkljb24gLz59PC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Q29sbGFwc2UgaGVpZ2h0PXswfSBtYXhIZWlnaHQ9eydhdXRvJ30gZXhwYW5kZWQ9e2lzT3Blbn0+XG4gICAgICAgICAgICAgIHtyZW5kZXJXYWxsZXRMaXN0fVxuICAgICAgICAgICAgPC9Db2xsYXBzZT5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyYCwgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdXX0+XG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2ID5cblxuICAgICAgey8qIEJvdHRvbSBTaGFkZXMgKi8gfVxuICB7XG4gICAgaXNPcGVuICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA+IDYgPyAoXG4gICAgICA8PlxuICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgPC8+XG4gICAgKSA6IG51bGxcbiAgfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuICAnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBVbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHsgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107IGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZOyBoaWdobGlnaHQ6IEFkYXB0ZXJbXTsgb3RoZXJzOiBBZGFwdGVyW10gfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkpIHtcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMyk7XG4gICAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGgpKTtcblxuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnSW5zdGFsbGVkJywgaGlnaGxpZ2h0LCBvdGhlcnMgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5sb2FkYWJsZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0czogZmlsdGVyZWRBZGFwdGVycy5yZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdPbmJvYXJkaW5nJywgaGlnaGxpZ2h0OiBbXSwgb3RoZXJzOiBbXSB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgbWF4LWgtWzkwdmhdIGxnOm1heC1oLVs1NzZweF0gdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0IGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8ZGl2IHR3PVwiYm9yZGVyLXQtWzFweF0gYm9yZGVyLXdoaXRlLzEwXCIgLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBVbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */"]
  }, jsx("span", {
    css: _ref4$1
  }, t(`Recommended wallets`)), jsx("div", {
    css: _ref5
  }, list.recommendedWallets.map((adapter, idx) => {
    const attachment = walletAttachments ? walletAttachments[adapter.name]?.attachment : null;
    const adapterName = (() => {
      if (adapter.name === SolanaMobileWalletAdapterWalletName) return t(`Mobile`);
      return adapter.name;
    })();
    return jsx("div", {
      key: idx,
      onClick: event => onClickWallet(event, adapter),
      css: ["display:flex;width:100%;flex:1 1 0%;cursor:pointer;align-items:center;border-radius:0.5rem;border-width:1px;border-color:rgb(255 255 255 / 0.1);padding-left:1rem;padding-right:1rem;padding-top:1rem;padding-bottom:1rem;@media (min-width: 1024px){flex-direction:column;justify-content:center;padding-left:0.5rem;padding-right:0.5rem;}transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;:hover{--tw-backdrop-blur:blur(24px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);}", styles$1.walletItem[theme], process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFxS2dCIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcblxuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcblxuaW1wb3J0IENvbGxhcHNlIGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQ29sbGFwc2UnO1xuXG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENoZXZyb25Eb3duSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uRG93bkljb24nO1xuaW1wb3J0IENoZXZyb25VcEljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2hldnJvblVwSWNvbic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4vTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi9PbmJvYXJkaW5nJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrICFiZy13aGl0ZSBzaGFkb3cteGxgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZSAhYmctWyMzQTNCNDNdIGJvcmRlciBib3JkZXItd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGcgaG92ZXI6Ym9yZGVyLWJsYWNrLzEwYF0sXG4gICAgZGFyazogW3R3YGhvdmVyOnNoYWRvdy0yeGwgaG92ZXI6Ymctd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdXG4gIH1cbn07XG5cbmNvbnN0IEhlYWRlcjogUmVhY3QuRkM8eyBvbkNsb3NlOiAoKSA9PiB2b2lkIH0+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY3NzPXtbdHdgcHgtNSBweS02IGZsZXgganVzdGlmeS1iZXR3ZWVuIGxlYWRpbmctbm9uZWAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIDxzcGFuPnt0KGBDb25uZWN0IFdhbGxldGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBtdC0xYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIDxzcGFuPnt0KGBZb3UgbmVlZCB0byBjb25uZWN0IGEgU29sYW5hIHdhbGxldC5gKX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxidXR0b24gdHc9XCJhYnNvbHV0ZSB0b3AtNCByaWdodC00XCIgb25DbGljaz17b25DbG9zZX0+XG4gICAgICAgIDxDbG9zZUljb24gd2lkdGg9ezEyfSBoZWlnaHQ9ezEyfSAvPlxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5jb25zdCBMaXN0T2ZXYWxsZXRzOiBSZWFjdC5GQzx7XG4gIGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfTtcbiAgb25Ub2dnbGU6IChuZXh0VmFsdWU/OiBhbnkpID0+IHZvaWQ7XG4gIGlzT3BlbjogYm9vbGVhbjtcbn0+ID0gKHsgbGlzdCwgb25Ub2dnbGUsIGlzT3BlbiB9KSA9PiB7XG4gIGNvbnN0IHsgaGFuZGxlQ29ubmVjdENsaWNrLCB3YWxsZXRsaXN0RXhwbGFuYXRpb24sIHdhbGxldEF0dGFjaG1lbnRzLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCBbc2hvd09uYm9hcmRpbmcsIHNldFNob3dPbmJvYXJkaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3Nob3dOb3RJbnN0YWxsZWQsIHNldFNob3dOb3RJbnN0YWxsZWRdID0gdXNlU3RhdGU8QWRhcHRlciB8IGZhbHNlPihmYWxzZSk7XG5cbiAgY29uc3Qgb25DbGlja1dhbGxldCA9IFJlYWN0LnVzZUNhbGxiYWNrKChldmVudDogUmVhY3QuTW91c2VFdmVudDxIVE1MRWxlbWVudCwgTW91c2VFdmVudD4sIGFkYXB0ZXI6IEFkYXB0ZXIpID0+IHtcbiAgICBpZiAoYWRhcHRlci5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICBzZXRTaG93Tm90SW5zdGFsbGVkKGFkYXB0ZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoYW5kbGVDb25uZWN0Q2xpY2soZXZlbnQsIGFkYXB0ZXIpO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgcmVuZGVyV2FsbGV0TGlzdCA9IHVzZU1lbW8oXG4gICAgKCkgPT4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiB0dz1cIm10LTQgZ3JpZCBnYXAtMiBncmlkLWNvbHMtMiBwYi00XCIgdHJhbnNsYXRlPVwibm9cIj5cbiAgICAgICAgICB7bGlzdC5vdGhlcnMubWFwKChhZGFwdGVyLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPHVsIGtleT17aW5kZXh9PlxuICAgICAgICAgICAgICAgIDxXYWxsZXRMaXN0SXRlbSBoYW5kbGVDbGljaz17KGUpID0+IG9uQ2xpY2tXYWxsZXQoZSwgYWRhcHRlcil9IHdhbGxldD17YWRhcHRlcn0gLz5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ICE9PSAnT25ib2FyZGluZycgJiYgd2FsbGV0bGlzdEV4cGxhbmF0aW9uID8gKFxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBmb250LXNlbWlib2xkIHVuZGVybGluZWAsIGxpc3Qub3RoZXJzLmxlbmd0aCA+IDYgPyB0d2BtYi04YCA6ICcnXX0+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgPC9kaXY+XG4gICAgKSxcbiAgICBbaGFuZGxlQ29ubmVjdENsaWNrLCBsaXN0Lm90aGVyc10sXG4gICk7XG5cbiAgY29uc3QgaGFzTm9XYWxsZXRzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgcmV0dXJuIGxpc3QuaGlnaGxpZ2h0Lmxlbmd0aCA9PT0gMCAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDA7XG4gIH0sIFtsaXN0XSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaGFzTm9XYWxsZXRzKSB7XG4gICAgICBzZXRTaG93T25ib2FyZGluZyh0cnVlKTtcbiAgICB9XG4gIH0sIFtoYXNOb1dhbGxldHNdKTtcblxuICBpZiAoc2hvd09uYm9hcmRpbmcpIHtcbiAgICByZXR1cm4gPE9uYm9hcmRpbmdGbG93IHNob3dCYWNrPXshaGFzTm9XYWxsZXRzfSBvbkNsb3NlPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyhmYWxzZSl9IC8+O1xuICB9XG5cbiAgaWYgKHNob3dOb3RJbnN0YWxsZWQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPE5vdEluc3RhbGxlZFxuICAgICAgICBhZGFwdGVyPXtzaG93Tm90SW5zdGFsbGVkfVxuICAgICAgICBvbkNsb3NlPXsoKSA9PiBzZXRTaG93Tm90SW5zdGFsbGVkKGZhbHNlKX1cbiAgICAgICAgb25Hb09uYm9hcmRpbmc9eygpID0+IHtcbiAgICAgICAgICBzZXRTaG93T25ib2FyZGluZyh0cnVlKTtcbiAgICAgICAgICBzZXRTaG93Tm90SW5zdGFsbGVkKGZhbHNlKTtcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiIGNzcz17W3R3YGgtZnVsbCBvdmVyZmxvdy15LWF1dG8gcHQtMyBwYi04IHB4LTUgcmVsYXRpdmVgLCBpc09wZW4gJiYgdHdgbWItN2BdfT5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPnt0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wIG1iLTVcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14cyBtbC00IGxnOm1sLTAgbGc6bXQtM1wiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzcGFuIHR3PVwibXQtNiB0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnUmVjb21tZW5kZWQnID8gdChgUmVjb21tZW5kZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnUHJldmlvdXNseUNvbm5lY3RlZCcgPyB0KGBSZWNlbnRseSB1c2VkYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdJbnN0YWxsZWQnID8gdChgSW5zdGFsbGVkIHdhbGxldHNgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ1RvcFdhbGxldCcgPyB0KGBQb3B1bGFyIHdhbGxldHNgKSA6IG51bGx9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPGRpdiB0dz1cIm10LTQgZmxleCBmbGV4LWNvbCBsZzpmbGV4LXJvdyBsZzpzcGFjZS14LTIgc3BhY2UteS0yIGxnOnNwYWNlLXktMFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggbGc6ZmxleC1jb2wgaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSBsZzptYXgtdy1bMzMlXWAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14cyBtbC00IGxnOm1sLTAgbGc6bXQtM1wiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktYmV0d2VlbiBjdXJzb3ItcG9pbnRlclwiIG9uQ2xpY2s9e29uVG9nZ2xlfT5cbiAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICAgICAgPGRpdiB0dz1cIiBmbGV4IGl0ZW1zLWNlbnRlclwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwidy1bMTBweF0gaC1bNnB4XVwiPntpc09wZW4gPyA8Q2hldnJvblVwSWNvbiAvPiA6IDxDaGV2cm9uRG93bkljb24gLz59PC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Q29sbGFwc2UgaGVpZ2h0PXswfSBtYXhIZWlnaHQ9eydhdXRvJ30gZXhwYW5kZWQ9e2lzT3Blbn0+XG4gICAgICAgICAgICAgIHtyZW5kZXJXYWxsZXRMaXN0fVxuICAgICAgICAgICAgPC9Db2xsYXBzZT5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyYCwgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdXX0+XG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2ID5cblxuICAgICAgey8qIEJvdHRvbSBTaGFkZXMgKi8gfVxuICB7XG4gICAgaXNPcGVuICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA+IDYgPyAoXG4gICAgICA8PlxuICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgPC8+XG4gICAgKSA6IG51bGxcbiAgfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuICAnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBVbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHsgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107IGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZOyBoaWdobGlnaHQ6IEFkYXB0ZXJbXTsgb3RoZXJzOiBBZGFwdGVyW10gfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkpIHtcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMyk7XG4gICAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGgpKTtcblxuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnSW5zdGFsbGVkJywgaGlnaGxpZ2h0LCBvdGhlcnMgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5sb2FkYWJsZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0czogZmlsdGVyZWRBZGFwdGVycy5yZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdPbmJvYXJkaW5nJywgaGlnaGxpZ2h0OiBbXSwgb3RoZXJzOiBbXSB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgbWF4LWgtWzkwdmhdIGxnOm1heC1oLVs1NzZweF0gdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0IGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8ZGl2IHR3PVwiYm9yZGVyLXQtWzFweF0gYm9yZGVyLXdoaXRlLzEwXCIgLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBVbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFxS2dCIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcblxuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcblxuaW1wb3J0IENvbGxhcHNlIGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQ29sbGFwc2UnO1xuXG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENoZXZyb25Eb3duSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uRG93bkljb24nO1xuaW1wb3J0IENoZXZyb25VcEljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2hldnJvblVwSWNvbic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4vTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi9PbmJvYXJkaW5nJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrICFiZy13aGl0ZSBzaGFkb3cteGxgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZSAhYmctWyMzQTNCNDNdIGJvcmRlciBib3JkZXItd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGcgaG92ZXI6Ym9yZGVyLWJsYWNrLzEwYF0sXG4gICAgZGFyazogW3R3YGhvdmVyOnNoYWRvdy0yeGwgaG92ZXI6Ymctd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdXG4gIH1cbn07XG5cbmNvbnN0IEhlYWRlcjogUmVhY3QuRkM8eyBvbkNsb3NlOiAoKSA9PiB2b2lkIH0+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY3NzPXtbdHdgcHgtNSBweS02IGZsZXgganVzdGlmeS1iZXR3ZWVuIGxlYWRpbmctbm9uZWAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIDxzcGFuPnt0KGBDb25uZWN0IFdhbGxldGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBtdC0xYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIDxzcGFuPnt0KGBZb3UgbmVlZCB0byBjb25uZWN0IGEgU29sYW5hIHdhbGxldC5gKX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxidXR0b24gdHc9XCJhYnNvbHV0ZSB0b3AtNCByaWdodC00XCIgb25DbGljaz17b25DbG9zZX0+XG4gICAgICAgIDxDbG9zZUljb24gd2lkdGg9ezEyfSBoZWlnaHQ9ezEyfSAvPlxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5jb25zdCBMaXN0T2ZXYWxsZXRzOiBSZWFjdC5GQzx7XG4gIGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfTtcbiAgb25Ub2dnbGU6IChuZXh0VmFsdWU/OiBhbnkpID0+IHZvaWQ7XG4gIGlzT3BlbjogYm9vbGVhbjtcbn0+ID0gKHsgbGlzdCwgb25Ub2dnbGUsIGlzT3BlbiB9KSA9PiB7XG4gIGNvbnN0IHsgaGFuZGxlQ29ubmVjdENsaWNrLCB3YWxsZXRsaXN0RXhwbGFuYXRpb24sIHdhbGxldEF0dGFjaG1lbnRzLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCBbc2hvd09uYm9hcmRpbmcsIHNldFNob3dPbmJvYXJkaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3Nob3dOb3RJbnN0YWxsZWQsIHNldFNob3dOb3RJbnN0YWxsZWRdID0gdXNlU3RhdGU8QWRhcHRlciB8IGZhbHNlPihmYWxzZSk7XG5cbiAgY29uc3Qgb25DbGlja1dhbGxldCA9IFJlYWN0LnVzZUNhbGxiYWNrKChldmVudDogUmVhY3QuTW91c2VFdmVudDxIVE1MRWxlbWVudCwgTW91c2VFdmVudD4sIGFkYXB0ZXI6IEFkYXB0ZXIpID0+IHtcbiAgICBpZiAoYWRhcHRlci5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICBzZXRTaG93Tm90SW5zdGFsbGVkKGFkYXB0ZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoYW5kbGVDb25uZWN0Q2xpY2soZXZlbnQsIGFkYXB0ZXIpO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgcmVuZGVyV2FsbGV0TGlzdCA9IHVzZU1lbW8oXG4gICAgKCkgPT4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiB0dz1cIm10LTQgZ3JpZCBnYXAtMiBncmlkLWNvbHMtMiBwYi00XCIgdHJhbnNsYXRlPVwibm9cIj5cbiAgICAgICAgICB7bGlzdC5vdGhlcnMubWFwKChhZGFwdGVyLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPHVsIGtleT17aW5kZXh9PlxuICAgICAgICAgICAgICAgIDxXYWxsZXRMaXN0SXRlbSBoYW5kbGVDbGljaz17KGUpID0+IG9uQ2xpY2tXYWxsZXQoZSwgYWRhcHRlcil9IHdhbGxldD17YWRhcHRlcn0gLz5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ICE9PSAnT25ib2FyZGluZycgJiYgd2FsbGV0bGlzdEV4cGxhbmF0aW9uID8gKFxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBmb250LXNlbWlib2xkIHVuZGVybGluZWAsIGxpc3Qub3RoZXJzLmxlbmd0aCA+IDYgPyB0d2BtYi04YCA6ICcnXX0+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgPC9kaXY+XG4gICAgKSxcbiAgICBbaGFuZGxlQ29ubmVjdENsaWNrLCBsaXN0Lm90aGVyc10sXG4gICk7XG5cbiAgY29uc3QgaGFzTm9XYWxsZXRzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgcmV0dXJuIGxpc3QuaGlnaGxpZ2h0Lmxlbmd0aCA9PT0gMCAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDA7XG4gIH0sIFtsaXN0XSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaGFzTm9XYWxsZXRzKSB7XG4gICAgICBzZXRTaG93T25ib2FyZGluZyh0cnVlKTtcbiAgICB9XG4gIH0sIFtoYXNOb1dhbGxldHNdKTtcblxuICBpZiAoc2hvd09uYm9hcmRpbmcpIHtcbiAgICByZXR1cm4gPE9uYm9hcmRpbmdGbG93IHNob3dCYWNrPXshaGFzTm9XYWxsZXRzfSBvbkNsb3NlPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyhmYWxzZSl9IC8+O1xuICB9XG5cbiAgaWYgKHNob3dOb3RJbnN0YWxsZWQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPE5vdEluc3RhbGxlZFxuICAgICAgICBhZGFwdGVyPXtzaG93Tm90SW5zdGFsbGVkfVxuICAgICAgICBvbkNsb3NlPXsoKSA9PiBzZXRTaG93Tm90SW5zdGFsbGVkKGZhbHNlKX1cbiAgICAgICAgb25Hb09uYm9hcmRpbmc9eygpID0+IHtcbiAgICAgICAgICBzZXRTaG93T25ib2FyZGluZyh0cnVlKTtcbiAgICAgICAgICBzZXRTaG93Tm90SW5zdGFsbGVkKGZhbHNlKTtcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiIGNzcz17W3R3YGgtZnVsbCBvdmVyZmxvdy15LWF1dG8gcHQtMyBwYi04IHB4LTUgcmVsYXRpdmVgLCBpc09wZW4gJiYgdHdgbWItN2BdfT5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPnt0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wIG1iLTVcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14cyBtbC00IGxnOm1sLTAgbGc6bXQtM1wiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzcGFuIHR3PVwibXQtNiB0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnUmVjb21tZW5kZWQnID8gdChgUmVjb21tZW5kZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnUHJldmlvdXNseUNvbm5lY3RlZCcgPyB0KGBSZWNlbnRseSB1c2VkYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdJbnN0YWxsZWQnID8gdChgSW5zdGFsbGVkIHdhbGxldHNgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ1RvcFdhbGxldCcgPyB0KGBQb3B1bGFyIHdhbGxldHNgKSA6IG51bGx9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPGRpdiB0dz1cIm10LTQgZmxleCBmbGV4LWNvbCBsZzpmbGV4LXJvdyBsZzpzcGFjZS14LTIgc3BhY2UteS0yIGxnOnNwYWNlLXktMFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggbGc6ZmxleC1jb2wgaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSBsZzptYXgtdy1bMzMlXWAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14cyBtbC00IGxnOm1sLTAgbGc6bXQtM1wiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktYmV0d2VlbiBjdXJzb3ItcG9pbnRlclwiIG9uQ2xpY2s9e29uVG9nZ2xlfT5cbiAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICAgICAgPGRpdiB0dz1cIiBmbGV4IGl0ZW1zLWNlbnRlclwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwidy1bMTBweF0gaC1bNnB4XVwiPntpc09wZW4gPyA8Q2hldnJvblVwSWNvbiAvPiA6IDxDaGV2cm9uRG93bkljb24gLz59PC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Q29sbGFwc2UgaGVpZ2h0PXswfSBtYXhIZWlnaHQ9eydhdXRvJ30gZXhwYW5kZWQ9e2lzT3Blbn0+XG4gICAgICAgICAgICAgIHtyZW5kZXJXYWxsZXRMaXN0fVxuICAgICAgICAgICAgPC9Db2xsYXBzZT5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyYCwgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdXX0+XG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2ID5cblxuICAgICAgey8qIEJvdHRvbSBTaGFkZXMgKi8gfVxuICB7XG4gICAgaXNPcGVuICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA+IDYgPyAoXG4gICAgICA8PlxuICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgPC8+XG4gICAgKSA6IG51bGxcbiAgfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuICAnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBVbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHsgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107IGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZOyBoaWdobGlnaHQ6IEFkYXB0ZXJbXTsgb3RoZXJzOiBBZGFwdGVyW10gfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkpIHtcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMyk7XG4gICAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGgpKTtcblxuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnSW5zdGFsbGVkJywgaGlnaGxpZ2h0LCBvdGhlcnMgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5sb2FkYWJsZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0czogZmlsdGVyZWRBZGFwdGVycy5yZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdPbmJvYXJkaW5nJywgaGlnaGxpZ2h0OiBbXSwgb3RoZXJzOiBbXSB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgbWF4LWgtWzkwdmhdIGxnOm1heC1oLVs1NzZweF0gdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0IGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8ZGl2IHR3PVwiYm9yZGVyLXQtWzFweF0gYm9yZGVyLXdoaXRlLzEwXCIgLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBVbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */"]
    }, isMobile() ? jsx(WalletIcon, {
      wallet: adapter,
      width: 24,
      height: 24
    }) : jsx(WalletIcon, {
      wallet: adapter,
      width: 30,
      height: 30
    }), jsx("span", {
      css: _ref6
    }, adapterName), attachment ? jsx("div", null, attachment) : null);
  })), jsx("span", {
    css: _ref7
  }, list.highlightedBy === 'Recommended' ? t(`Recommended wallets`) : null, list.highlightedBy === 'PreviouslyConnected' ? t(`Recently used`) : null, list.highlightedBy === 'Installed' ? t(`Installed wallets`) : null, list.highlightedBy === 'TopWallet' ? t(`Popular wallets`) : null), jsx("div", {
    css: _ref8
  }, list.highlight.map((adapter, idx) => {
    const adapterName = (() => {
      if (adapter.name === SolanaMobileWalletAdapterWalletName) return t(`Mobile`);
      return adapter.name;
    })();
    const attachment = walletAttachments ? walletAttachments[adapter.name]?.attachment : null;
    return jsx("div", {
      key: idx,
      onClick: event => onClickWallet(event, adapter),
      css: ["display:flex;flex:1 1 0%;cursor:pointer;align-items:center;border-radius:0.5rem;border-width:1px;border-color:rgb(255 255 255 / 0.1);padding-left:1rem;padding-right:1rem;padding-top:1rem;padding-bottom:1rem;@media (min-width: 1024px){max-width:33%;flex-direction:column;justify-content:center;padding-left:0.5rem;padding-right:0.5rem;}transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;:hover{--tw-backdrop-blur:blur(24px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);}", styles$1.walletItem[theme], process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF5TWdCIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcblxuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcblxuaW1wb3J0IENvbGxhcHNlIGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQ29sbGFwc2UnO1xuXG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENoZXZyb25Eb3duSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uRG93bkljb24nO1xuaW1wb3J0IENoZXZyb25VcEljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2hldnJvblVwSWNvbic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4vTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi9PbmJvYXJkaW5nJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrICFiZy13aGl0ZSBzaGFkb3cteGxgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZSAhYmctWyMzQTNCNDNdIGJvcmRlciBib3JkZXItd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGcgaG92ZXI6Ym9yZGVyLWJsYWNrLzEwYF0sXG4gICAgZGFyazogW3R3YGhvdmVyOnNoYWRvdy0yeGwgaG92ZXI6Ymctd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdXG4gIH1cbn07XG5cbmNvbnN0IEhlYWRlcjogUmVhY3QuRkM8eyBvbkNsb3NlOiAoKSA9PiB2b2lkIH0+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY3NzPXtbdHdgcHgtNSBweS02IGZsZXgganVzdGlmeS1iZXR3ZWVuIGxlYWRpbmctbm9uZWAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIDxzcGFuPnt0KGBDb25uZWN0IFdhbGxldGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBtdC0xYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIDxzcGFuPnt0KGBZb3UgbmVlZCB0byBjb25uZWN0IGEgU29sYW5hIHdhbGxldC5gKX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxidXR0b24gdHc9XCJhYnNvbHV0ZSB0b3AtNCByaWdodC00XCIgb25DbGljaz17b25DbG9zZX0+XG4gICAgICAgIDxDbG9zZUljb24gd2lkdGg9ezEyfSBoZWlnaHQ9ezEyfSAvPlxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5jb25zdCBMaXN0T2ZXYWxsZXRzOiBSZWFjdC5GQzx7XG4gIGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfTtcbiAgb25Ub2dnbGU6IChuZXh0VmFsdWU/OiBhbnkpID0+IHZvaWQ7XG4gIGlzT3BlbjogYm9vbGVhbjtcbn0+ID0gKHsgbGlzdCwgb25Ub2dnbGUsIGlzT3BlbiB9KSA9PiB7XG4gIGNvbnN0IHsgaGFuZGxlQ29ubmVjdENsaWNrLCB3YWxsZXRsaXN0RXhwbGFuYXRpb24sIHdhbGxldEF0dGFjaG1lbnRzLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCBbc2hvd09uYm9hcmRpbmcsIHNldFNob3dPbmJvYXJkaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3Nob3dOb3RJbnN0YWxsZWQsIHNldFNob3dOb3RJbnN0YWxsZWRdID0gdXNlU3RhdGU8QWRhcHRlciB8IGZhbHNlPihmYWxzZSk7XG5cbiAgY29uc3Qgb25DbGlja1dhbGxldCA9IFJlYWN0LnVzZUNhbGxiYWNrKChldmVudDogUmVhY3QuTW91c2VFdmVudDxIVE1MRWxlbWVudCwgTW91c2VFdmVudD4sIGFkYXB0ZXI6IEFkYXB0ZXIpID0+IHtcbiAgICBpZiAoYWRhcHRlci5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICBzZXRTaG93Tm90SW5zdGFsbGVkKGFkYXB0ZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoYW5kbGVDb25uZWN0Q2xpY2soZXZlbnQsIGFkYXB0ZXIpO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgcmVuZGVyV2FsbGV0TGlzdCA9IHVzZU1lbW8oXG4gICAgKCkgPT4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiB0dz1cIm10LTQgZ3JpZCBnYXAtMiBncmlkLWNvbHMtMiBwYi00XCIgdHJhbnNsYXRlPVwibm9cIj5cbiAgICAgICAgICB7bGlzdC5vdGhlcnMubWFwKChhZGFwdGVyLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPHVsIGtleT17aW5kZXh9PlxuICAgICAgICAgICAgICAgIDxXYWxsZXRMaXN0SXRlbSBoYW5kbGVDbGljaz17KGUpID0+IG9uQ2xpY2tXYWxsZXQoZSwgYWRhcHRlcil9IHdhbGxldD17YWRhcHRlcn0gLz5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ICE9PSAnT25ib2FyZGluZycgJiYgd2FsbGV0bGlzdEV4cGxhbmF0aW9uID8gKFxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBmb250LXNlbWlib2xkIHVuZGVybGluZWAsIGxpc3Qub3RoZXJzLmxlbmd0aCA+IDYgPyB0d2BtYi04YCA6ICcnXX0+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgPC9kaXY+XG4gICAgKSxcbiAgICBbaGFuZGxlQ29ubmVjdENsaWNrLCBsaXN0Lm90aGVyc10sXG4gICk7XG5cbiAgY29uc3QgaGFzTm9XYWxsZXRzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgcmV0dXJuIGxpc3QuaGlnaGxpZ2h0Lmxlbmd0aCA9PT0gMCAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDA7XG4gIH0sIFtsaXN0XSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaGFzTm9XYWxsZXRzKSB7XG4gICAgICBzZXRTaG93T25ib2FyZGluZyh0cnVlKTtcbiAgICB9XG4gIH0sIFtoYXNOb1dhbGxldHNdKTtcblxuICBpZiAoc2hvd09uYm9hcmRpbmcpIHtcbiAgICByZXR1cm4gPE9uYm9hcmRpbmdGbG93IHNob3dCYWNrPXshaGFzTm9XYWxsZXRzfSBvbkNsb3NlPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyhmYWxzZSl9IC8+O1xuICB9XG5cbiAgaWYgKHNob3dOb3RJbnN0YWxsZWQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPE5vdEluc3RhbGxlZFxuICAgICAgICBhZGFwdGVyPXtzaG93Tm90SW5zdGFsbGVkfVxuICAgICAgICBvbkNsb3NlPXsoKSA9PiBzZXRTaG93Tm90SW5zdGFsbGVkKGZhbHNlKX1cbiAgICAgICAgb25Hb09uYm9hcmRpbmc9eygpID0+IHtcbiAgICAgICAgICBzZXRTaG93T25ib2FyZGluZyh0cnVlKTtcbiAgICAgICAgICBzZXRTaG93Tm90SW5zdGFsbGVkKGZhbHNlKTtcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiIGNzcz17W3R3YGgtZnVsbCBvdmVyZmxvdy15LWF1dG8gcHQtMyBwYi04IHB4LTUgcmVsYXRpdmVgLCBpc09wZW4gJiYgdHdgbWItN2BdfT5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPnt0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wIG1iLTVcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14cyBtbC00IGxnOm1sLTAgbGc6bXQtM1wiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzcGFuIHR3PVwibXQtNiB0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnUmVjb21tZW5kZWQnID8gdChgUmVjb21tZW5kZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnUHJldmlvdXNseUNvbm5lY3RlZCcgPyB0KGBSZWNlbnRseSB1c2VkYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdJbnN0YWxsZWQnID8gdChgSW5zdGFsbGVkIHdhbGxldHNgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ1RvcFdhbGxldCcgPyB0KGBQb3B1bGFyIHdhbGxldHNgKSA6IG51bGx9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPGRpdiB0dz1cIm10LTQgZmxleCBmbGV4LWNvbCBsZzpmbGV4LXJvdyBsZzpzcGFjZS14LTIgc3BhY2UteS0yIGxnOnNwYWNlLXktMFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggbGc6ZmxleC1jb2wgaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSBsZzptYXgtdy1bMzMlXWAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14cyBtbC00IGxnOm1sLTAgbGc6bXQtM1wiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktYmV0d2VlbiBjdXJzb3ItcG9pbnRlclwiIG9uQ2xpY2s9e29uVG9nZ2xlfT5cbiAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICAgICAgPGRpdiB0dz1cIiBmbGV4IGl0ZW1zLWNlbnRlclwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwidy1bMTBweF0gaC1bNnB4XVwiPntpc09wZW4gPyA8Q2hldnJvblVwSWNvbiAvPiA6IDxDaGV2cm9uRG93bkljb24gLz59PC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Q29sbGFwc2UgaGVpZ2h0PXswfSBtYXhIZWlnaHQ9eydhdXRvJ30gZXhwYW5kZWQ9e2lzT3Blbn0+XG4gICAgICAgICAgICAgIHtyZW5kZXJXYWxsZXRMaXN0fVxuICAgICAgICAgICAgPC9Db2xsYXBzZT5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyYCwgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdXX0+XG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2ID5cblxuICAgICAgey8qIEJvdHRvbSBTaGFkZXMgKi8gfVxuICB7XG4gICAgaXNPcGVuICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA+IDYgPyAoXG4gICAgICA8PlxuICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgPC8+XG4gICAgKSA6IG51bGxcbiAgfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuICAnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBVbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHsgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107IGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZOyBoaWdobGlnaHQ6IEFkYXB0ZXJbXTsgb3RoZXJzOiBBZGFwdGVyW10gfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkpIHtcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMyk7XG4gICAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGgpKTtcblxuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnSW5zdGFsbGVkJywgaGlnaGxpZ2h0LCBvdGhlcnMgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5sb2FkYWJsZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0czogZmlsdGVyZWRBZGFwdGVycy5yZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdPbmJvYXJkaW5nJywgaGlnaGxpZ2h0OiBbXSwgb3RoZXJzOiBbXSB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgbWF4LWgtWzkwdmhdIGxnOm1heC1oLVs1NzZweF0gdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0IGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8ZGl2IHR3PVwiYm9yZGVyLXQtWzFweF0gYm9yZGVyLXdoaXRlLzEwXCIgLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBVbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF5TWdCIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcblxuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcblxuaW1wb3J0IENvbGxhcHNlIGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQ29sbGFwc2UnO1xuXG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENoZXZyb25Eb3duSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uRG93bkljb24nO1xuaW1wb3J0IENoZXZyb25VcEljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2hldnJvblVwSWNvbic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4vTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi9PbmJvYXJkaW5nJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrICFiZy13aGl0ZSBzaGFkb3cteGxgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZSAhYmctWyMzQTNCNDNdIGJvcmRlciBib3JkZXItd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGcgaG92ZXI6Ym9yZGVyLWJsYWNrLzEwYF0sXG4gICAgZGFyazogW3R3YGhvdmVyOnNoYWRvdy0yeGwgaG92ZXI6Ymctd2hpdGUvMTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdXG4gIH1cbn07XG5cbmNvbnN0IEhlYWRlcjogUmVhY3QuRkM8eyBvbkNsb3NlOiAoKSA9PiB2b2lkIH0+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY3NzPXtbdHdgcHgtNSBweS02IGZsZXgganVzdGlmeS1iZXR3ZWVuIGxlYWRpbmctbm9uZWAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIDxzcGFuPnt0KGBDb25uZWN0IFdhbGxldGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBtdC0xYCwgc3R5bGVzLnN1YnRpdGxlW3RoZW1lXV19PlxuICAgICAgICAgIDxzcGFuPnt0KGBZb3UgbmVlZCB0byBjb25uZWN0IGEgU29sYW5hIHdhbGxldC5gKX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxidXR0b24gdHc9XCJhYnNvbHV0ZSB0b3AtNCByaWdodC00XCIgb25DbGljaz17b25DbG9zZX0+XG4gICAgICAgIDxDbG9zZUljb24gd2lkdGg9ezEyfSBoZWlnaHQ9ezEyfSAvPlxuICAgICAgPC9idXR0b24+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5jb25zdCBMaXN0T2ZXYWxsZXRzOiBSZWFjdC5GQzx7XG4gIGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfTtcbiAgb25Ub2dnbGU6IChuZXh0VmFsdWU/OiBhbnkpID0+IHZvaWQ7XG4gIGlzT3BlbjogYm9vbGVhbjtcbn0+ID0gKHsgbGlzdCwgb25Ub2dnbGUsIGlzT3BlbiB9KSA9PiB7XG4gIGNvbnN0IHsgaGFuZGxlQ29ubmVjdENsaWNrLCB3YWxsZXRsaXN0RXhwbGFuYXRpb24sIHdhbGxldEF0dGFjaG1lbnRzLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuICBjb25zdCBbc2hvd09uYm9hcmRpbmcsIHNldFNob3dPbmJvYXJkaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3Nob3dOb3RJbnN0YWxsZWQsIHNldFNob3dOb3RJbnN0YWxsZWRdID0gdXNlU3RhdGU8QWRhcHRlciB8IGZhbHNlPihmYWxzZSk7XG5cbiAgY29uc3Qgb25DbGlja1dhbGxldCA9IFJlYWN0LnVzZUNhbGxiYWNrKChldmVudDogUmVhY3QuTW91c2VFdmVudDxIVE1MRWxlbWVudCwgTW91c2VFdmVudD4sIGFkYXB0ZXI6IEFkYXB0ZXIpID0+IHtcbiAgICBpZiAoYWRhcHRlci5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICBzZXRTaG93Tm90SW5zdGFsbGVkKGFkYXB0ZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBoYW5kbGVDb25uZWN0Q2xpY2soZXZlbnQsIGFkYXB0ZXIpO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgcmVuZGVyV2FsbGV0TGlzdCA9IHVzZU1lbW8oXG4gICAgKCkgPT4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiB0dz1cIm10LTQgZ3JpZCBnYXAtMiBncmlkLWNvbHMtMiBwYi00XCIgdHJhbnNsYXRlPVwibm9cIj5cbiAgICAgICAgICB7bGlzdC5vdGhlcnMubWFwKChhZGFwdGVyLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPHVsIGtleT17aW5kZXh9PlxuICAgICAgICAgICAgICAgIDxXYWxsZXRMaXN0SXRlbSBoYW5kbGVDbGljaz17KGUpID0+IG9uQ2xpY2tXYWxsZXQoZSwgYWRhcHRlcil9IHdhbGxldD17YWRhcHRlcn0gLz5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ICE9PSAnT25ib2FyZGluZycgJiYgd2FsbGV0bGlzdEV4cGxhbmF0aW9uID8gKFxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBmb250LXNlbWlib2xkIHVuZGVybGluZWAsIGxpc3Qub3RoZXJzLmxlbmd0aCA+IDYgPyB0d2BtYi04YCA6ICcnXX0+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgPC9kaXY+XG4gICAgKSxcbiAgICBbaGFuZGxlQ29ubmVjdENsaWNrLCBsaXN0Lm90aGVyc10sXG4gICk7XG5cbiAgY29uc3QgaGFzTm9XYWxsZXRzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgcmV0dXJuIGxpc3QuaGlnaGxpZ2h0Lmxlbmd0aCA9PT0gMCAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDA7XG4gIH0sIFtsaXN0XSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoaGFzTm9XYWxsZXRzKSB7XG4gICAgICBzZXRTaG93T25ib2FyZGluZyh0cnVlKTtcbiAgICB9XG4gIH0sIFtoYXNOb1dhbGxldHNdKTtcblxuICBpZiAoc2hvd09uYm9hcmRpbmcpIHtcbiAgICByZXR1cm4gPE9uYm9hcmRpbmdGbG93IHNob3dCYWNrPXshaGFzTm9XYWxsZXRzfSBvbkNsb3NlPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyhmYWxzZSl9IC8+O1xuICB9XG5cbiAgaWYgKHNob3dOb3RJbnN0YWxsZWQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPE5vdEluc3RhbGxlZFxuICAgICAgICBhZGFwdGVyPXtzaG93Tm90SW5zdGFsbGVkfVxuICAgICAgICBvbkNsb3NlPXsoKSA9PiBzZXRTaG93Tm90SW5zdGFsbGVkKGZhbHNlKX1cbiAgICAgICAgb25Hb09uYm9hcmRpbmc9eygpID0+IHtcbiAgICAgICAgICBzZXRTaG93T25ib2FyZGluZyh0cnVlKTtcbiAgICAgICAgICBzZXRTaG93Tm90SW5zdGFsbGVkKGZhbHNlKTtcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaGlkZVNjcm9sbGJhclwiIGNzcz17W3R3YGgtZnVsbCBvdmVyZmxvdy15LWF1dG8gcHQtMyBwYi04IHB4LTUgcmVsYXRpdmVgLCBpc09wZW4gJiYgdHdgbWItN2BdfT5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPnt0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wIG1iLTVcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14cyBtbC00IGxnOm1sLTAgbGc6bXQtM1wiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxzcGFuIHR3PVwibXQtNiB0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnUmVjb21tZW5kZWQnID8gdChgUmVjb21tZW5kZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnUHJldmlvdXNseUNvbm5lY3RlZCcgPyB0KGBSZWNlbnRseSB1c2VkYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdJbnN0YWxsZWQnID8gdChgSW5zdGFsbGVkIHdhbGxldHNgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ1RvcFdhbGxldCcgPyB0KGBQb3B1bGFyIHdhbGxldHNgKSA6IG51bGx9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPGRpdiB0dz1cIm10LTQgZmxleCBmbGV4LWNvbCBsZzpmbGV4LXJvdyBsZzpzcGFjZS14LTIgc3BhY2UteS0yIGxnOnNwYWNlLXktMFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggbGc6ZmxleC1jb2wgaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSBsZzptYXgtdy1bMzMlXWAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14cyBtbC00IGxnOm1sLTAgbGc6bXQtM1wiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktYmV0d2VlbiBjdXJzb3ItcG9pbnRlclwiIG9uQ2xpY2s9e29uVG9nZ2xlfT5cbiAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSB3YWxsZXRzYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG5cbiAgICAgICAgICAgICAgPGRpdiB0dz1cIiBmbGV4IGl0ZW1zLWNlbnRlclwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwidy1bMTBweF0gaC1bNnB4XVwiPntpc09wZW4gPyA8Q2hldnJvblVwSWNvbiAvPiA6IDxDaGV2cm9uRG93bkljb24gLz59PC9zcGFuPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Q29sbGFwc2UgaGVpZ2h0PXswfSBtYXhIZWlnaHQ9eydhdXRvJ30gZXhwYW5kZWQ9e2lzT3Blbn0+XG4gICAgICAgICAgICAgIHtyZW5kZXJXYWxsZXRMaXN0fVxuICAgICAgICAgICAgPC9Db2xsYXBzZT5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyYCwgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdXX0+XG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2ID5cblxuICAgICAgey8qIEJvdHRvbSBTaGFkZXMgKi8gfVxuICB7XG4gICAgaXNPcGVuICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA+IDYgPyAoXG4gICAgICA8PlxuICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgPC8+XG4gICAgKSA6IG51bGxcbiAgfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuICAnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBVbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHsgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107IGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZOyBoaWdobGlnaHQ6IEFkYXB0ZXJbXTsgb3RoZXJzOiBBZGFwdGVyW10gfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkpIHtcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMyk7XG4gICAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGgpKTtcblxuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnSW5zdGFsbGVkJywgaGlnaGxpZ2h0LCBvdGhlcnMgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5sb2FkYWJsZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0czogZmlsdGVyZWRBZGFwdGVycy5yZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdPbmJvYXJkaW5nJywgaGlnaGxpZ2h0OiBbXSwgb3RoZXJzOiBbXSB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgbWF4LWgtWzkwdmhdIGxnOm1heC1oLVs1NzZweF0gdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0IGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8ZGl2IHR3PVwiYm9yZGVyLXQtWzFweF0gYm9yZGVyLXdoaXRlLzEwXCIgLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBVbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */"]
    }, isMobile() ? jsx(WalletIcon, {
      wallet: adapter,
      width: 24,
      height: 24
    }) : jsx(WalletIcon, {
      wallet: adapter,
      width: 30,
      height: 30
    }), jsx("span", {
      css: _ref9
    }, adapterName), attachment ? jsx("div", null, attachment) : null);
  })), walletlistExplanation && list.others.length === 0 ? jsx("div", {
    css: _ref10
  }, jsx("a", {
    href: walletlistExplanation.href,
    target: "_blank",
    rel: "noopener noreferrer"
  }, jsx("span", null, t(`Can't find your wallet?`)))) : null, list.others.length > 0 ? jsx(React.Fragment, null, jsx("div", {
    css: _ref11,
    onClick: onToggle
  }, jsx("span", {
    css: _ref12
  }, jsx("span", null, t(`More wallets`))), jsx("div", {
    css: _ref13
  }, jsx("span", {
    css: _ref14
  }, isOpen ? jsx(ChevronUpIcon$1, null) : jsx(ChevronDownIcon$1, null)))), jsx(Collapse$1, {
    height: 0,
    maxHeight: 'auto',
    expanded: isOpen
  }, renderWalletList)) : null, jsx("div", {
    css: ["margin-bottom:-0.5rem;margin-top:1rem;cursor:pointer;font-size:0.75rem;line-height:1rem;font-weight:600;text-decoration-line:underline;", styles$1.buttonText[theme], process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFvUGEiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuXG5pbXBvcnQgeyBXYWxsZXRJY29uLCBXYWxsZXRMaXN0SXRlbSB9IGZyb20gJy4vV2FsbGV0TGlzdEl0ZW0nO1xuXG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5cbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2hldnJvbkRvd25JY29uIGZyb20gJy4uLy4uL2ljb25zL0NoZXZyb25Eb3duSWNvbic7XG5pbXBvcnQgQ2hldnJvblVwSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uVXBJY29uJztcbmltcG9ydCBDbG9zZUljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2xvc2VJY29uJztcbmltcG9ydCB7IGlzTW9iaWxlLCB1c2VPdXRzaWRlQ2xpY2sgfSBmcm9tICcuLi8uLi9taXNjL3V0aWxzJztcbmltcG9ydCBOb3RJbnN0YWxsZWQgZnJvbSAnLi9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuL09uYm9hcmRpbmcnO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBsaWdodDogW3R3YHRleHQtYmxhY2sgIWJnLXdoaXRlIHNoYWRvdy14bGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlICFiZy1bIzNBM0I0M10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlIGJnLVtyZ2IoNDksIDYyLCA3NildYF0sXG4gIH0sXG4gIHNoYWRlczoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjZmZmZmZmXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAgZGFyazogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzNBM0I0M10gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tW3JnYig0OSwgNjIsIDc2KV0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICB9LFxuICB3YWxsZXRJdGVtOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmF5LTUwIGhvdmVyOnNoYWRvdy1sZyBob3Zlcjpib3JkZXItYmxhY2svMTBgXSxcbiAgICBkYXJrOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF1cbiAgfVxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gbGVhZGluZy1ub25lYCwgc3R5bGVzLmhlYWRlclt0aGVtZV1dfT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIG10LTFgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYFlvdSBuZWVkIHRvIGNvbm5lY3QgYSBTb2xhbmEgd2FsbGV0LmApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8c3BhbiB0dz1cIm10LTYgdGV4dC14cyBmb250LXNlbWlib2xkXCI+e3QoYFJlY29tbWVuZGVkIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTAgbWItNVwiPlxuICAgICAgICAgIHtsaXN0LnJlY29tbWVuZGVkV2FsbGV0cy5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGxnOmZsZXgtY29sIGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdSZWNvbW1lbmRlZCcgPyB0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdQcmV2aW91c2x5Q29ubmVjdGVkJyA/IHQoYFJlY2VudGx5IHVzZWRgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ0luc3RhbGxlZCcgPyB0KGBJbnN0YWxsZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnVG9wV2FsbGV0JyA/IHQoYFBvcHVsYXIgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0Lm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIGxnOm1heC13LVszMyVdYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1iZXR3ZWVuIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0KGBNb3JlIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICA8ZGl2IHR3PVwiIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ3LVsxMHB4XSBoLVs2cHhdXCI+e2lzT3BlbiA/IDxDaGV2cm9uVXBJY29uIC8+IDogPENoZXZyb25Eb3duSWNvbiAvPn08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLCBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV1dfT5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSl9PlxuICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXYgPlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqLyB9XG4gIHtcbiAgICBpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgIDw+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICA8Lz5cbiAgICApIDogbnVsbFxuICB9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydCYWNrcGFjaycgYXMgV2FsbGV0TmFtZTwnQmFja3BhY2snPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG4gICdTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPixcbl07XG5cbmludGVyZmFjZSBJVW5pZmllZFdhbGxldE1vZGFsIHtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbn1cblxuY29uc3Qgc29ydEJ5UHJlY2VkZW5jZSA9ICh3YWxsZXRQcmVjZWRlbmNlOiBXYWxsZXROYW1lW10pID0+IChhOiBBZGFwdGVyLCBiOiBBZGFwdGVyKSA9PiB7XG4gIGlmICghd2FsbGV0UHJlY2VkZW5jZSkgcmV0dXJuIDA7XG5cbiAgY29uc3QgYUluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGEubmFtZSk7XG4gIGNvbnN0IGJJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihiLm5hbWUpO1xuXG4gIGlmIChhSW5kZXggPT09IC0xICYmIGJJbmRleCA9PT0gLTEpIHJldHVybiAwO1xuICBpZiAoYUluZGV4ID49IDApIHtcbiAgICBpZiAoYkluZGV4ID09PSAtMSkgcmV0dXJuIC0xO1xuICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gIH1cblxuICBpZiAoYkluZGV4ID49IDApIHtcbiAgICBpZiAoYUluZGV4ID09PSAtMSkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGJJbmRleCAtIGFJbmRleDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbmNvbnN0IFVuaWZpZWRXYWxsZXRNb2RhbDogUmVhY3QuRkM8SVVuaWZpZWRXYWxsZXRNb2RhbD4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB3YWxsZXRzIH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgd2FsbGV0UHJlY2VkZW5jZSwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IFtpc09wZW4sIG9uVG9nZ2xlXSA9IHVzZVRvZ2dsZShmYWxzZSk7XG4gIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWQgPSB1c2VQcmV2aW91c2x5Q29ubmVjdGVkKCk7XG5cbiAgY29uc3QgbGlzdDogeyByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTsgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7IGhpZ2hsaWdodDogQWRhcHRlcltdOyBvdGhlcnM6IEFkYXB0ZXJbXSB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gVGhlbiwgSW5zdGFsbGVkLCBUb3AgMywgTG9hZGFibGUsIE5vdERldGVjdGVkXG4gICAgY29uc3QgZmlsdGVyZWRBZGFwdGVycyA9IHdhbGxldHMucmVkdWNlPHtcbiAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIGluc3RhbGxlZDogQWRhcHRlcltdO1xuICAgICAgdG9wMzogQWRhcHRlcltdO1xuICAgICAgbG9hZGFibGU6IEFkYXB0ZXJbXTtcbiAgICAgIG5vdERldGVjdGVkOiBBZGFwdGVyW107XG4gICAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICB9PihcbiAgICAgIChhY2MsIHdhbGxldCkgPT4ge1xuICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9IHdhbGxldC5hZGFwdGVyLm5hbWU7XG5cbiAgICAgICAgaWYgKFJFQ09NTUVOREVEX1dBTExFVFMuc29tZSgod2FsbGV0KSA9PiB3YWxsZXQgPT09IGFkYXB0ZXJOYW1lKSkge1xuICAgICAgICAgIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZpb3VzbHkgY29ubmVjdGVkIHRha2VzIGhpZ2hlc3RcbiAgICAgICAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID0gcHJldmlvdXNseUNvbm5lY3RlZC5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnByZXZpb3VzbHlDb25uZWN0ZWRbcHJldmlvdXNseUNvbm5lY3RlZEluZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBJbnN0YWxsZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgIGFjYy5pbnN0YWxsZWQucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3AgM1xuICAgICAgICBjb25zdCB0b3BXYWxsZXRzSW5kZXggPSBUT1BfV0FMTEVUUy5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRvcFdhbGxldHNJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnRvcDNbdG9wV2FsbGV0c0luZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZGFibGVcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90RGV0ZWN0ZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogW10sXG4gICAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IFtdLFxuICAgICAgICBpbnN0YWxsZWQ6IFtdLFxuICAgICAgICB0b3AzOiBbXSxcbiAgICAgICAgbG9hZGFibGU6IFtdLFxuICAgICAgICBub3REZXRlY3RlZDogW10sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMCwgMyk7XG4gICAgICBsZXQgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGgpKTtcbiAgICAgIG90aGVycyA9IG90aGVycy5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ1ByZXZpb3VzbHlDb25uZWN0ZWQnLFxuICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgIG90aGVycyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBpbnN0YWxsZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAzKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLCBoaWdobGlnaHQ6IFtdLCBvdGhlcnM6IFtdIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHRvcDMsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ1RvcFdhbGxldCcsIGhpZ2hsaWdodDogdG9wMywgb3RoZXJzIH07XG4gIH0sIFt3YWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkXSk7XG5cbiAgY29uc3QgY29udGVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIHVzZU91dHNpZGVDbGljayhjb250ZW50UmVmLCBvbkNsb3NlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W1xuICAgICAgICB0d2BtYXgtdy1tZCB3LWZ1bGwgcmVsYXRpdmUgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC14bCBtYXgtaC1bOTB2aF0gbGc6bWF4LWgtWzU3NnB4XSB0cmFuc2l0aW9uLWhlaWdodCBkdXJhdGlvbi01MDAgZWFzZS1pbi1vdXQgYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxkaXYgdHc9XCJib3JkZXItdC1bMXB4XSBib3JkZXItd2hpdGUvMTBcIiAvPlxuICAgICAgPExpc3RPZldhbGxldHMgbGlzdD17bGlzdH0gb25Ub2dnbGU9e29uVG9nZ2xlfSBpc09wZW49e2lzT3Blbn0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVuaWZpZWRXYWxsZXRNb2RhbDtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFvUGEiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuXG5pbXBvcnQgeyBXYWxsZXRJY29uLCBXYWxsZXRMaXN0SXRlbSB9IGZyb20gJy4vV2FsbGV0TGlzdEl0ZW0nO1xuXG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5cbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2hldnJvbkRvd25JY29uIGZyb20gJy4uLy4uL2ljb25zL0NoZXZyb25Eb3duSWNvbic7XG5pbXBvcnQgQ2hldnJvblVwSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uVXBJY29uJztcbmltcG9ydCBDbG9zZUljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2xvc2VJY29uJztcbmltcG9ydCB7IGlzTW9iaWxlLCB1c2VPdXRzaWRlQ2xpY2sgfSBmcm9tICcuLi8uLi9taXNjL3V0aWxzJztcbmltcG9ydCBOb3RJbnN0YWxsZWQgZnJvbSAnLi9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuL09uYm9hcmRpbmcnO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBsaWdodDogW3R3YHRleHQtYmxhY2sgIWJnLXdoaXRlIHNoYWRvdy14bGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlICFiZy1bIzNBM0I0M10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlIGJnLVtyZ2IoNDksIDYyLCA3NildYF0sXG4gIH0sXG4gIHNoYWRlczoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjZmZmZmZmXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAgZGFyazogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzNBM0I0M10gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tW3JnYig0OSwgNjIsIDc2KV0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICB9LFxuICB3YWxsZXRJdGVtOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmF5LTUwIGhvdmVyOnNoYWRvdy1sZyBob3Zlcjpib3JkZXItYmxhY2svMTBgXSxcbiAgICBkYXJrOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF1cbiAgfVxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gbGVhZGluZy1ub25lYCwgc3R5bGVzLmhlYWRlclt0aGVtZV1dfT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIG10LTFgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYFlvdSBuZWVkIHRvIGNvbm5lY3QgYSBTb2xhbmEgd2FsbGV0LmApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8c3BhbiB0dz1cIm10LTYgdGV4dC14cyBmb250LXNlbWlib2xkXCI+e3QoYFJlY29tbWVuZGVkIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTAgbWItNVwiPlxuICAgICAgICAgIHtsaXN0LnJlY29tbWVuZGVkV2FsbGV0cy5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGxnOmZsZXgtY29sIGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdSZWNvbW1lbmRlZCcgPyB0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdQcmV2aW91c2x5Q29ubmVjdGVkJyA/IHQoYFJlY2VudGx5IHVzZWRgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ0luc3RhbGxlZCcgPyB0KGBJbnN0YWxsZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnVG9wV2FsbGV0JyA/IHQoYFBvcHVsYXIgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0Lm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIGxnOm1heC13LVszMyVdYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1iZXR3ZWVuIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0KGBNb3JlIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICA8ZGl2IHR3PVwiIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ3LVsxMHB4XSBoLVs2cHhdXCI+e2lzT3BlbiA/IDxDaGV2cm9uVXBJY29uIC8+IDogPENoZXZyb25Eb3duSWNvbiAvPn08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLCBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV1dfT5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSl9PlxuICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXYgPlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqLyB9XG4gIHtcbiAgICBpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgIDw+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICA8Lz5cbiAgICApIDogbnVsbFxuICB9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydCYWNrcGFjaycgYXMgV2FsbGV0TmFtZTwnQmFja3BhY2snPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG4gICdTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPixcbl07XG5cbmludGVyZmFjZSBJVW5pZmllZFdhbGxldE1vZGFsIHtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbn1cblxuY29uc3Qgc29ydEJ5UHJlY2VkZW5jZSA9ICh3YWxsZXRQcmVjZWRlbmNlOiBXYWxsZXROYW1lW10pID0+IChhOiBBZGFwdGVyLCBiOiBBZGFwdGVyKSA9PiB7XG4gIGlmICghd2FsbGV0UHJlY2VkZW5jZSkgcmV0dXJuIDA7XG5cbiAgY29uc3QgYUluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGEubmFtZSk7XG4gIGNvbnN0IGJJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihiLm5hbWUpO1xuXG4gIGlmIChhSW5kZXggPT09IC0xICYmIGJJbmRleCA9PT0gLTEpIHJldHVybiAwO1xuICBpZiAoYUluZGV4ID49IDApIHtcbiAgICBpZiAoYkluZGV4ID09PSAtMSkgcmV0dXJuIC0xO1xuICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gIH1cblxuICBpZiAoYkluZGV4ID49IDApIHtcbiAgICBpZiAoYUluZGV4ID09PSAtMSkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGJJbmRleCAtIGFJbmRleDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbmNvbnN0IFVuaWZpZWRXYWxsZXRNb2RhbDogUmVhY3QuRkM8SVVuaWZpZWRXYWxsZXRNb2RhbD4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB3YWxsZXRzIH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgd2FsbGV0UHJlY2VkZW5jZSwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IFtpc09wZW4sIG9uVG9nZ2xlXSA9IHVzZVRvZ2dsZShmYWxzZSk7XG4gIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWQgPSB1c2VQcmV2aW91c2x5Q29ubmVjdGVkKCk7XG5cbiAgY29uc3QgbGlzdDogeyByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTsgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7IGhpZ2hsaWdodDogQWRhcHRlcltdOyBvdGhlcnM6IEFkYXB0ZXJbXSB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gVGhlbiwgSW5zdGFsbGVkLCBUb3AgMywgTG9hZGFibGUsIE5vdERldGVjdGVkXG4gICAgY29uc3QgZmlsdGVyZWRBZGFwdGVycyA9IHdhbGxldHMucmVkdWNlPHtcbiAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIGluc3RhbGxlZDogQWRhcHRlcltdO1xuICAgICAgdG9wMzogQWRhcHRlcltdO1xuICAgICAgbG9hZGFibGU6IEFkYXB0ZXJbXTtcbiAgICAgIG5vdERldGVjdGVkOiBBZGFwdGVyW107XG4gICAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICB9PihcbiAgICAgIChhY2MsIHdhbGxldCkgPT4ge1xuICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9IHdhbGxldC5hZGFwdGVyLm5hbWU7XG5cbiAgICAgICAgaWYgKFJFQ09NTUVOREVEX1dBTExFVFMuc29tZSgod2FsbGV0KSA9PiB3YWxsZXQgPT09IGFkYXB0ZXJOYW1lKSkge1xuICAgICAgICAgIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZpb3VzbHkgY29ubmVjdGVkIHRha2VzIGhpZ2hlc3RcbiAgICAgICAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID0gcHJldmlvdXNseUNvbm5lY3RlZC5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnByZXZpb3VzbHlDb25uZWN0ZWRbcHJldmlvdXNseUNvbm5lY3RlZEluZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBJbnN0YWxsZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgIGFjYy5pbnN0YWxsZWQucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3AgM1xuICAgICAgICBjb25zdCB0b3BXYWxsZXRzSW5kZXggPSBUT1BfV0FMTEVUUy5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRvcFdhbGxldHNJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnRvcDNbdG9wV2FsbGV0c0luZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZGFibGVcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90RGV0ZWN0ZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogW10sXG4gICAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IFtdLFxuICAgICAgICBpbnN0YWxsZWQ6IFtdLFxuICAgICAgICB0b3AzOiBbXSxcbiAgICAgICAgbG9hZGFibGU6IFtdLFxuICAgICAgICBub3REZXRlY3RlZDogW10sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMCwgMyk7XG4gICAgICBsZXQgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGgpKTtcbiAgICAgIG90aGVycyA9IG90aGVycy5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ1ByZXZpb3VzbHlDb25uZWN0ZWQnLFxuICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgIG90aGVycyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBpbnN0YWxsZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAzKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLCBoaWdobGlnaHQ6IFtdLCBvdGhlcnM6IFtdIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHRvcDMsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ1RvcFdhbGxldCcsIGhpZ2hsaWdodDogdG9wMywgb3RoZXJzIH07XG4gIH0sIFt3YWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkXSk7XG5cbiAgY29uc3QgY29udGVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIHVzZU91dHNpZGVDbGljayhjb250ZW50UmVmLCBvbkNsb3NlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W1xuICAgICAgICB0d2BtYXgtdy1tZCB3LWZ1bGwgcmVsYXRpdmUgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC14bCBtYXgtaC1bOTB2aF0gbGc6bWF4LWgtWzU3NnB4XSB0cmFuc2l0aW9uLWhlaWdodCBkdXJhdGlvbi01MDAgZWFzZS1pbi1vdXQgYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxkaXYgdHc9XCJib3JkZXItdC1bMXB4XSBib3JkZXItd2hpdGUvMTBcIiAvPlxuICAgICAgPExpc3RPZldhbGxldHMgbGlzdD17bGlzdH0gb25Ub2dnbGU9e29uVG9nZ2xlfSBpc09wZW49e2lzT3Blbn0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVuaWZpZWRXYWxsZXRNb2RhbDtcbiJdfQ== */"]
  }, jsx("button", {
    type: "button",
    onClick: () => setShowOnboarding(true)
  }, jsx("span", null, t(`I don't have a wallet`))))), isOpen && list.others.length > 6 ? jsx(React.Fragment, null, jsx("div", {
    css: ["position:absolute;bottom:1.75rem;left:0px;z-index:50;display:block;height:5rem;width:100%;", styles$1.shades[theme], process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUErUGEiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuXG5pbXBvcnQgeyBXYWxsZXRJY29uLCBXYWxsZXRMaXN0SXRlbSB9IGZyb20gJy4vV2FsbGV0TGlzdEl0ZW0nO1xuXG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5cbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2hldnJvbkRvd25JY29uIGZyb20gJy4uLy4uL2ljb25zL0NoZXZyb25Eb3duSWNvbic7XG5pbXBvcnQgQ2hldnJvblVwSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uVXBJY29uJztcbmltcG9ydCBDbG9zZUljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2xvc2VJY29uJztcbmltcG9ydCB7IGlzTW9iaWxlLCB1c2VPdXRzaWRlQ2xpY2sgfSBmcm9tICcuLi8uLi9taXNjL3V0aWxzJztcbmltcG9ydCBOb3RJbnN0YWxsZWQgZnJvbSAnLi9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuL09uYm9hcmRpbmcnO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBsaWdodDogW3R3YHRleHQtYmxhY2sgIWJnLXdoaXRlIHNoYWRvdy14bGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlICFiZy1bIzNBM0I0M10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlIGJnLVtyZ2IoNDksIDYyLCA3NildYF0sXG4gIH0sXG4gIHNoYWRlczoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjZmZmZmZmXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAgZGFyazogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzNBM0I0M10gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tW3JnYig0OSwgNjIsIDc2KV0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICB9LFxuICB3YWxsZXRJdGVtOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmF5LTUwIGhvdmVyOnNoYWRvdy1sZyBob3Zlcjpib3JkZXItYmxhY2svMTBgXSxcbiAgICBkYXJrOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF1cbiAgfVxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gbGVhZGluZy1ub25lYCwgc3R5bGVzLmhlYWRlclt0aGVtZV1dfT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIG10LTFgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYFlvdSBuZWVkIHRvIGNvbm5lY3QgYSBTb2xhbmEgd2FsbGV0LmApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8c3BhbiB0dz1cIm10LTYgdGV4dC14cyBmb250LXNlbWlib2xkXCI+e3QoYFJlY29tbWVuZGVkIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTAgbWItNVwiPlxuICAgICAgICAgIHtsaXN0LnJlY29tbWVuZGVkV2FsbGV0cy5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGxnOmZsZXgtY29sIGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdSZWNvbW1lbmRlZCcgPyB0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdQcmV2aW91c2x5Q29ubmVjdGVkJyA/IHQoYFJlY2VudGx5IHVzZWRgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ0luc3RhbGxlZCcgPyB0KGBJbnN0YWxsZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnVG9wV2FsbGV0JyA/IHQoYFBvcHVsYXIgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0Lm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIGxnOm1heC13LVszMyVdYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1iZXR3ZWVuIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0KGBNb3JlIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICA8ZGl2IHR3PVwiIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ3LVsxMHB4XSBoLVs2cHhdXCI+e2lzT3BlbiA/IDxDaGV2cm9uVXBJY29uIC8+IDogPENoZXZyb25Eb3duSWNvbiAvPn08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLCBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV1dfT5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSl9PlxuICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXYgPlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqLyB9XG4gIHtcbiAgICBpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgIDw+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICA8Lz5cbiAgICApIDogbnVsbFxuICB9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydCYWNrcGFjaycgYXMgV2FsbGV0TmFtZTwnQmFja3BhY2snPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG4gICdTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPixcbl07XG5cbmludGVyZmFjZSBJVW5pZmllZFdhbGxldE1vZGFsIHtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbn1cblxuY29uc3Qgc29ydEJ5UHJlY2VkZW5jZSA9ICh3YWxsZXRQcmVjZWRlbmNlOiBXYWxsZXROYW1lW10pID0+IChhOiBBZGFwdGVyLCBiOiBBZGFwdGVyKSA9PiB7XG4gIGlmICghd2FsbGV0UHJlY2VkZW5jZSkgcmV0dXJuIDA7XG5cbiAgY29uc3QgYUluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGEubmFtZSk7XG4gIGNvbnN0IGJJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihiLm5hbWUpO1xuXG4gIGlmIChhSW5kZXggPT09IC0xICYmIGJJbmRleCA9PT0gLTEpIHJldHVybiAwO1xuICBpZiAoYUluZGV4ID49IDApIHtcbiAgICBpZiAoYkluZGV4ID09PSAtMSkgcmV0dXJuIC0xO1xuICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gIH1cblxuICBpZiAoYkluZGV4ID49IDApIHtcbiAgICBpZiAoYUluZGV4ID09PSAtMSkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGJJbmRleCAtIGFJbmRleDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbmNvbnN0IFVuaWZpZWRXYWxsZXRNb2RhbDogUmVhY3QuRkM8SVVuaWZpZWRXYWxsZXRNb2RhbD4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB3YWxsZXRzIH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgd2FsbGV0UHJlY2VkZW5jZSwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IFtpc09wZW4sIG9uVG9nZ2xlXSA9IHVzZVRvZ2dsZShmYWxzZSk7XG4gIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWQgPSB1c2VQcmV2aW91c2x5Q29ubmVjdGVkKCk7XG5cbiAgY29uc3QgbGlzdDogeyByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTsgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7IGhpZ2hsaWdodDogQWRhcHRlcltdOyBvdGhlcnM6IEFkYXB0ZXJbXSB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gVGhlbiwgSW5zdGFsbGVkLCBUb3AgMywgTG9hZGFibGUsIE5vdERldGVjdGVkXG4gICAgY29uc3QgZmlsdGVyZWRBZGFwdGVycyA9IHdhbGxldHMucmVkdWNlPHtcbiAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIGluc3RhbGxlZDogQWRhcHRlcltdO1xuICAgICAgdG9wMzogQWRhcHRlcltdO1xuICAgICAgbG9hZGFibGU6IEFkYXB0ZXJbXTtcbiAgICAgIG5vdERldGVjdGVkOiBBZGFwdGVyW107XG4gICAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICB9PihcbiAgICAgIChhY2MsIHdhbGxldCkgPT4ge1xuICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9IHdhbGxldC5hZGFwdGVyLm5hbWU7XG5cbiAgICAgICAgaWYgKFJFQ09NTUVOREVEX1dBTExFVFMuc29tZSgod2FsbGV0KSA9PiB3YWxsZXQgPT09IGFkYXB0ZXJOYW1lKSkge1xuICAgICAgICAgIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZpb3VzbHkgY29ubmVjdGVkIHRha2VzIGhpZ2hlc3RcbiAgICAgICAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID0gcHJldmlvdXNseUNvbm5lY3RlZC5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnByZXZpb3VzbHlDb25uZWN0ZWRbcHJldmlvdXNseUNvbm5lY3RlZEluZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBJbnN0YWxsZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgIGFjYy5pbnN0YWxsZWQucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3AgM1xuICAgICAgICBjb25zdCB0b3BXYWxsZXRzSW5kZXggPSBUT1BfV0FMTEVUUy5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRvcFdhbGxldHNJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnRvcDNbdG9wV2FsbGV0c0luZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZGFibGVcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90RGV0ZWN0ZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogW10sXG4gICAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IFtdLFxuICAgICAgICBpbnN0YWxsZWQ6IFtdLFxuICAgICAgICB0b3AzOiBbXSxcbiAgICAgICAgbG9hZGFibGU6IFtdLFxuICAgICAgICBub3REZXRlY3RlZDogW10sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMCwgMyk7XG4gICAgICBsZXQgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGgpKTtcbiAgICAgIG90aGVycyA9IG90aGVycy5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ1ByZXZpb3VzbHlDb25uZWN0ZWQnLFxuICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgIG90aGVycyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBpbnN0YWxsZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAzKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLCBoaWdobGlnaHQ6IFtdLCBvdGhlcnM6IFtdIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHRvcDMsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ1RvcFdhbGxldCcsIGhpZ2hsaWdodDogdG9wMywgb3RoZXJzIH07XG4gIH0sIFt3YWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkXSk7XG5cbiAgY29uc3QgY29udGVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIHVzZU91dHNpZGVDbGljayhjb250ZW50UmVmLCBvbkNsb3NlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W1xuICAgICAgICB0d2BtYXgtdy1tZCB3LWZ1bGwgcmVsYXRpdmUgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC14bCBtYXgtaC1bOTB2aF0gbGc6bWF4LWgtWzU3NnB4XSB0cmFuc2l0aW9uLWhlaWdodCBkdXJhdGlvbi01MDAgZWFzZS1pbi1vdXQgYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxkaXYgdHc9XCJib3JkZXItdC1bMXB4XSBib3JkZXItd2hpdGUvMTBcIiAvPlxuICAgICAgPExpc3RPZldhbGxldHMgbGlzdD17bGlzdH0gb25Ub2dnbGU9e29uVG9nZ2xlfSBpc09wZW49e2lzT3Blbn0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVuaWZpZWRXYWxsZXRNb2RhbDtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUErUGEiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuXG5pbXBvcnQgeyBXYWxsZXRJY29uLCBXYWxsZXRMaXN0SXRlbSB9IGZyb20gJy4vV2FsbGV0TGlzdEl0ZW0nO1xuXG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5cbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2hldnJvbkRvd25JY29uIGZyb20gJy4uLy4uL2ljb25zL0NoZXZyb25Eb3duSWNvbic7XG5pbXBvcnQgQ2hldnJvblVwSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uVXBJY29uJztcbmltcG9ydCBDbG9zZUljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2xvc2VJY29uJztcbmltcG9ydCB7IGlzTW9iaWxlLCB1c2VPdXRzaWRlQ2xpY2sgfSBmcm9tICcuLi8uLi9taXNjL3V0aWxzJztcbmltcG9ydCBOb3RJbnN0YWxsZWQgZnJvbSAnLi9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuL09uYm9hcmRpbmcnO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBsaWdodDogW3R3YHRleHQtYmxhY2sgIWJnLXdoaXRlIHNoYWRvdy14bGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlICFiZy1bIzNBM0I0M10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlIGJnLVtyZ2IoNDksIDYyLCA3NildYF0sXG4gIH0sXG4gIHNoYWRlczoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjZmZmZmZmXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAgZGFyazogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzNBM0I0M10gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tW3JnYig0OSwgNjIsIDc2KV0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICB9LFxuICB3YWxsZXRJdGVtOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmF5LTUwIGhvdmVyOnNoYWRvdy1sZyBob3Zlcjpib3JkZXItYmxhY2svMTBgXSxcbiAgICBkYXJrOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF1cbiAgfVxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gbGVhZGluZy1ub25lYCwgc3R5bGVzLmhlYWRlclt0aGVtZV1dfT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIG10LTFgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYFlvdSBuZWVkIHRvIGNvbm5lY3QgYSBTb2xhbmEgd2FsbGV0LmApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8c3BhbiB0dz1cIm10LTYgdGV4dC14cyBmb250LXNlbWlib2xkXCI+e3QoYFJlY29tbWVuZGVkIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTAgbWItNVwiPlxuICAgICAgICAgIHtsaXN0LnJlY29tbWVuZGVkV2FsbGV0cy5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGxnOmZsZXgtY29sIGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdSZWNvbW1lbmRlZCcgPyB0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdQcmV2aW91c2x5Q29ubmVjdGVkJyA/IHQoYFJlY2VudGx5IHVzZWRgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ0luc3RhbGxlZCcgPyB0KGBJbnN0YWxsZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnVG9wV2FsbGV0JyA/IHQoYFBvcHVsYXIgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0Lm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIGxnOm1heC13LVszMyVdYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1iZXR3ZWVuIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0KGBNb3JlIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICA8ZGl2IHR3PVwiIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ3LVsxMHB4XSBoLVs2cHhdXCI+e2lzT3BlbiA/IDxDaGV2cm9uVXBJY29uIC8+IDogPENoZXZyb25Eb3duSWNvbiAvPn08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLCBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV1dfT5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSl9PlxuICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXYgPlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqLyB9XG4gIHtcbiAgICBpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgIDw+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICA8Lz5cbiAgICApIDogbnVsbFxuICB9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydCYWNrcGFjaycgYXMgV2FsbGV0TmFtZTwnQmFja3BhY2snPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG4gICdTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPixcbl07XG5cbmludGVyZmFjZSBJVW5pZmllZFdhbGxldE1vZGFsIHtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbn1cblxuY29uc3Qgc29ydEJ5UHJlY2VkZW5jZSA9ICh3YWxsZXRQcmVjZWRlbmNlOiBXYWxsZXROYW1lW10pID0+IChhOiBBZGFwdGVyLCBiOiBBZGFwdGVyKSA9PiB7XG4gIGlmICghd2FsbGV0UHJlY2VkZW5jZSkgcmV0dXJuIDA7XG5cbiAgY29uc3QgYUluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGEubmFtZSk7XG4gIGNvbnN0IGJJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihiLm5hbWUpO1xuXG4gIGlmIChhSW5kZXggPT09IC0xICYmIGJJbmRleCA9PT0gLTEpIHJldHVybiAwO1xuICBpZiAoYUluZGV4ID49IDApIHtcbiAgICBpZiAoYkluZGV4ID09PSAtMSkgcmV0dXJuIC0xO1xuICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gIH1cblxuICBpZiAoYkluZGV4ID49IDApIHtcbiAgICBpZiAoYUluZGV4ID09PSAtMSkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGJJbmRleCAtIGFJbmRleDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbmNvbnN0IFVuaWZpZWRXYWxsZXRNb2RhbDogUmVhY3QuRkM8SVVuaWZpZWRXYWxsZXRNb2RhbD4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB3YWxsZXRzIH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgd2FsbGV0UHJlY2VkZW5jZSwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IFtpc09wZW4sIG9uVG9nZ2xlXSA9IHVzZVRvZ2dsZShmYWxzZSk7XG4gIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWQgPSB1c2VQcmV2aW91c2x5Q29ubmVjdGVkKCk7XG5cbiAgY29uc3QgbGlzdDogeyByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTsgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7IGhpZ2hsaWdodDogQWRhcHRlcltdOyBvdGhlcnM6IEFkYXB0ZXJbXSB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gVGhlbiwgSW5zdGFsbGVkLCBUb3AgMywgTG9hZGFibGUsIE5vdERldGVjdGVkXG4gICAgY29uc3QgZmlsdGVyZWRBZGFwdGVycyA9IHdhbGxldHMucmVkdWNlPHtcbiAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIGluc3RhbGxlZDogQWRhcHRlcltdO1xuICAgICAgdG9wMzogQWRhcHRlcltdO1xuICAgICAgbG9hZGFibGU6IEFkYXB0ZXJbXTtcbiAgICAgIG5vdERldGVjdGVkOiBBZGFwdGVyW107XG4gICAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICB9PihcbiAgICAgIChhY2MsIHdhbGxldCkgPT4ge1xuICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9IHdhbGxldC5hZGFwdGVyLm5hbWU7XG5cbiAgICAgICAgaWYgKFJFQ09NTUVOREVEX1dBTExFVFMuc29tZSgod2FsbGV0KSA9PiB3YWxsZXQgPT09IGFkYXB0ZXJOYW1lKSkge1xuICAgICAgICAgIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZpb3VzbHkgY29ubmVjdGVkIHRha2VzIGhpZ2hlc3RcbiAgICAgICAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID0gcHJldmlvdXNseUNvbm5lY3RlZC5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnByZXZpb3VzbHlDb25uZWN0ZWRbcHJldmlvdXNseUNvbm5lY3RlZEluZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBJbnN0YWxsZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgIGFjYy5pbnN0YWxsZWQucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3AgM1xuICAgICAgICBjb25zdCB0b3BXYWxsZXRzSW5kZXggPSBUT1BfV0FMTEVUUy5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRvcFdhbGxldHNJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnRvcDNbdG9wV2FsbGV0c0luZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZGFibGVcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90RGV0ZWN0ZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogW10sXG4gICAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IFtdLFxuICAgICAgICBpbnN0YWxsZWQ6IFtdLFxuICAgICAgICB0b3AzOiBbXSxcbiAgICAgICAgbG9hZGFibGU6IFtdLFxuICAgICAgICBub3REZXRlY3RlZDogW10sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMCwgMyk7XG4gICAgICBsZXQgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGgpKTtcbiAgICAgIG90aGVycyA9IG90aGVycy5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ1ByZXZpb3VzbHlDb25uZWN0ZWQnLFxuICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgIG90aGVycyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBpbnN0YWxsZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAzKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLCBoaWdobGlnaHQ6IFtdLCBvdGhlcnM6IFtdIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHRvcDMsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ1RvcFdhbGxldCcsIGhpZ2hsaWdodDogdG9wMywgb3RoZXJzIH07XG4gIH0sIFt3YWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkXSk7XG5cbiAgY29uc3QgY29udGVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIHVzZU91dHNpZGVDbGljayhjb250ZW50UmVmLCBvbkNsb3NlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W1xuICAgICAgICB0d2BtYXgtdy1tZCB3LWZ1bGwgcmVsYXRpdmUgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC14bCBtYXgtaC1bOTB2aF0gbGc6bWF4LWgtWzU3NnB4XSB0cmFuc2l0aW9uLWhlaWdodCBkdXJhdGlvbi01MDAgZWFzZS1pbi1vdXQgYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxkaXYgdHc9XCJib3JkZXItdC1bMXB4XSBib3JkZXItd2hpdGUvMTBcIiAvPlxuICAgICAgPExpc3RPZldhbGxldHMgbGlzdD17bGlzdH0gb25Ub2dnbGU9e29uVG9nZ2xlfSBpc09wZW49e2lzT3Blbn0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVuaWZpZWRXYWxsZXRNb2RhbDtcbiJdfQ== */"]
  })) : null);
};
const PRIORITISE = {
  [WalletReadyState.Installed]: 1,
  [WalletReadyState.Loadable]: 2,
  [WalletReadyState.NotDetected]: 3,
  [WalletReadyState.Unsupported]: 3
};
const RECOMMENDED_WALLETS = ['Backpack'];
const TOP_WALLETS = ['Phantom', 'Solflare'];
const sortByPrecedence = walletPrecedence => (a, b) => {
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
var _ref15 = process.env.NODE_ENV === "production" ? {
  name: "1ng0ss1",
  styles: "border-top-width:1px;border-color:rgb(255 255 255 / 0.1)"
} : {
  name: "p5dhf-UnifiedWalletModal",
  styles: "border-top-width:1px;border-color:rgb(255 255 255 / 0.1);label:UnifiedWalletModal;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
const UnifiedWalletModal = ({
  onClose
}) => {
  const {
    wallets
  } = useUnifiedWallet();
  const {
    walletPrecedence,
    theme
  } = useUnifiedWalletContext();
  const [isOpen, onToggle] = useToggle$1(false);
  const previouslyConnected = usePreviouslyConnected();
  const list = useMemo(() => {
    // Then, Installed, Top 3, Loadable, NotDetected
    const filteredAdapters = wallets.reduce((acc, wallet) => {
      const adapterName = wallet.adapter.name;
      if (RECOMMENDED_WALLETS.some(wallet => wallet === adapterName)) {
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
    }, {
      recommendedWallets: [],
      previouslyConnected: [],
      installed: [],
      top3: [],
      loadable: [],
      notDetected: []
    });
    if (filteredAdapters.previouslyConnected.length > 0) {
      const {
        recommendedWallets,
        previouslyConnected,
        ...rest
      } = filteredAdapters;
      const highlight = filteredAdapters.previouslyConnected.slice(0, 3);
      let others = Object.values(rest).flat().sort((a, b) => PRIORITISE[a.readyState] - PRIORITISE[b.readyState]).sort(sortByPrecedence(walletPrecedence || []));
      others.unshift(...filteredAdapters.previouslyConnected.slice(3, filteredAdapters.previouslyConnected.length));
      others = others.filter(Boolean);
      return {
        recommendedWallets,
        highlightedBy: 'PreviouslyConnected',
        highlight,
        others
      };
    }
    if (filteredAdapters.installed.length > 0) {
      const {
        recommendedWallets,
        installed,
        ...rest
      } = filteredAdapters;
      const highlight = filteredAdapters.installed.slice(0, 3);
      const others = Object.values(rest).flat().sort((a, b) => PRIORITISE[a.readyState] - PRIORITISE[b.readyState]).sort(sortByPrecedence(walletPrecedence || []));
      others.unshift(...filteredAdapters.installed.slice(3, filteredAdapters.installed.length));
      return {
        recommendedWallets,
        highlightedBy: 'Installed',
        highlight,
        others
      };
    }
    if (filteredAdapters.loadable.length === 0) {
      return {
        recommendedWallets: filteredAdapters.recommendedWallets,
        highlightedBy: 'Onboarding',
        highlight: [],
        others: []
      };
    }
    const {
      recommendedWallets,
      top3,
      ...rest
    } = filteredAdapters;
    const others = Object.values(rest).flat().sort((a, b) => PRIORITISE[a.readyState] - PRIORITISE[b.readyState]).sort(sortByPrecedence(walletPrecedence || []));
    return {
      recommendedWallets,
      highlightedBy: 'TopWallet',
      highlight: top3,
      others
    };
  }, [wallets, previouslyConnected]);
  const contentRef = useRef(null);
  useOutsideClick(contentRef, onClose);
  return jsx("div", {
    ref: contentRef,
    css: ["position:relative;display:flex;max-height:90vh;width:100%;max-width:28rem;flex-direction:column;overflow:hidden;border-radius:0.75rem;transition-property:height;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:500ms;@media (min-width: 1024px){max-height:576px;}", styles$1.container[theme], process.env.NODE_ENV === "production" ? "" : ";label:UnifiedWalletModal;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFvYU0iLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuXG5pbXBvcnQgeyBXYWxsZXRJY29uLCBXYWxsZXRMaXN0SXRlbSB9IGZyb20gJy4vV2FsbGV0TGlzdEl0ZW0nO1xuXG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5cbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2hldnJvbkRvd25JY29uIGZyb20gJy4uLy4uL2ljb25zL0NoZXZyb25Eb3duSWNvbic7XG5pbXBvcnQgQ2hldnJvblVwSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uVXBJY29uJztcbmltcG9ydCBDbG9zZUljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2xvc2VJY29uJztcbmltcG9ydCB7IGlzTW9iaWxlLCB1c2VPdXRzaWRlQ2xpY2sgfSBmcm9tICcuLi8uLi9taXNjL3V0aWxzJztcbmltcG9ydCBOb3RJbnN0YWxsZWQgZnJvbSAnLi9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuL09uYm9hcmRpbmcnO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBsaWdodDogW3R3YHRleHQtYmxhY2sgIWJnLXdoaXRlIHNoYWRvdy14bGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlICFiZy1bIzNBM0I0M10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlIGJnLVtyZ2IoNDksIDYyLCA3NildYF0sXG4gIH0sXG4gIHNoYWRlczoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjZmZmZmZmXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAgZGFyazogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzNBM0I0M10gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tW3JnYig0OSwgNjIsIDc2KV0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICB9LFxuICB3YWxsZXRJdGVtOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmF5LTUwIGhvdmVyOnNoYWRvdy1sZyBob3Zlcjpib3JkZXItYmxhY2svMTBgXSxcbiAgICBkYXJrOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF1cbiAgfVxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gbGVhZGluZy1ub25lYCwgc3R5bGVzLmhlYWRlclt0aGVtZV1dfT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIG10LTFgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYFlvdSBuZWVkIHRvIGNvbm5lY3QgYSBTb2xhbmEgd2FsbGV0LmApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8c3BhbiB0dz1cIm10LTYgdGV4dC14cyBmb250LXNlbWlib2xkXCI+e3QoYFJlY29tbWVuZGVkIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTAgbWItNVwiPlxuICAgICAgICAgIHtsaXN0LnJlY29tbWVuZGVkV2FsbGV0cy5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGxnOmZsZXgtY29sIGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdSZWNvbW1lbmRlZCcgPyB0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdQcmV2aW91c2x5Q29ubmVjdGVkJyA/IHQoYFJlY2VudGx5IHVzZWRgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ0luc3RhbGxlZCcgPyB0KGBJbnN0YWxsZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnVG9wV2FsbGV0JyA/IHQoYFBvcHVsYXIgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0Lm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIGxnOm1heC13LVszMyVdYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1iZXR3ZWVuIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0KGBNb3JlIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICA8ZGl2IHR3PVwiIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ3LVsxMHB4XSBoLVs2cHhdXCI+e2lzT3BlbiA/IDxDaGV2cm9uVXBJY29uIC8+IDogPENoZXZyb25Eb3duSWNvbiAvPn08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLCBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV1dfT5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSl9PlxuICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXYgPlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqLyB9XG4gIHtcbiAgICBpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgIDw+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICA8Lz5cbiAgICApIDogbnVsbFxuICB9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydCYWNrcGFjaycgYXMgV2FsbGV0TmFtZTwnQmFja3BhY2snPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG4gICdTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPixcbl07XG5cbmludGVyZmFjZSBJVW5pZmllZFdhbGxldE1vZGFsIHtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbn1cblxuY29uc3Qgc29ydEJ5UHJlY2VkZW5jZSA9ICh3YWxsZXRQcmVjZWRlbmNlOiBXYWxsZXROYW1lW10pID0+IChhOiBBZGFwdGVyLCBiOiBBZGFwdGVyKSA9PiB7XG4gIGlmICghd2FsbGV0UHJlY2VkZW5jZSkgcmV0dXJuIDA7XG5cbiAgY29uc3QgYUluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGEubmFtZSk7XG4gIGNvbnN0IGJJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihiLm5hbWUpO1xuXG4gIGlmIChhSW5kZXggPT09IC0xICYmIGJJbmRleCA9PT0gLTEpIHJldHVybiAwO1xuICBpZiAoYUluZGV4ID49IDApIHtcbiAgICBpZiAoYkluZGV4ID09PSAtMSkgcmV0dXJuIC0xO1xuICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gIH1cblxuICBpZiAoYkluZGV4ID49IDApIHtcbiAgICBpZiAoYUluZGV4ID09PSAtMSkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGJJbmRleCAtIGFJbmRleDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbmNvbnN0IFVuaWZpZWRXYWxsZXRNb2RhbDogUmVhY3QuRkM8SVVuaWZpZWRXYWxsZXRNb2RhbD4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB3YWxsZXRzIH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgd2FsbGV0UHJlY2VkZW5jZSwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IFtpc09wZW4sIG9uVG9nZ2xlXSA9IHVzZVRvZ2dsZShmYWxzZSk7XG4gIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWQgPSB1c2VQcmV2aW91c2x5Q29ubmVjdGVkKCk7XG5cbiAgY29uc3QgbGlzdDogeyByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTsgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7IGhpZ2hsaWdodDogQWRhcHRlcltdOyBvdGhlcnM6IEFkYXB0ZXJbXSB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gVGhlbiwgSW5zdGFsbGVkLCBUb3AgMywgTG9hZGFibGUsIE5vdERldGVjdGVkXG4gICAgY29uc3QgZmlsdGVyZWRBZGFwdGVycyA9IHdhbGxldHMucmVkdWNlPHtcbiAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIGluc3RhbGxlZDogQWRhcHRlcltdO1xuICAgICAgdG9wMzogQWRhcHRlcltdO1xuICAgICAgbG9hZGFibGU6IEFkYXB0ZXJbXTtcbiAgICAgIG5vdERldGVjdGVkOiBBZGFwdGVyW107XG4gICAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICB9PihcbiAgICAgIChhY2MsIHdhbGxldCkgPT4ge1xuICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9IHdhbGxldC5hZGFwdGVyLm5hbWU7XG5cbiAgICAgICAgaWYgKFJFQ09NTUVOREVEX1dBTExFVFMuc29tZSgod2FsbGV0KSA9PiB3YWxsZXQgPT09IGFkYXB0ZXJOYW1lKSkge1xuICAgICAgICAgIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZpb3VzbHkgY29ubmVjdGVkIHRha2VzIGhpZ2hlc3RcbiAgICAgICAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID0gcHJldmlvdXNseUNvbm5lY3RlZC5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnByZXZpb3VzbHlDb25uZWN0ZWRbcHJldmlvdXNseUNvbm5lY3RlZEluZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBJbnN0YWxsZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgIGFjYy5pbnN0YWxsZWQucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3AgM1xuICAgICAgICBjb25zdCB0b3BXYWxsZXRzSW5kZXggPSBUT1BfV0FMTEVUUy5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRvcFdhbGxldHNJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnRvcDNbdG9wV2FsbGV0c0luZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZGFibGVcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90RGV0ZWN0ZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogW10sXG4gICAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IFtdLFxuICAgICAgICBpbnN0YWxsZWQ6IFtdLFxuICAgICAgICB0b3AzOiBbXSxcbiAgICAgICAgbG9hZGFibGU6IFtdLFxuICAgICAgICBub3REZXRlY3RlZDogW10sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMCwgMyk7XG4gICAgICBsZXQgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGgpKTtcbiAgICAgIG90aGVycyA9IG90aGVycy5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ1ByZXZpb3VzbHlDb25uZWN0ZWQnLFxuICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgIG90aGVycyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBpbnN0YWxsZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAzKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLCBoaWdobGlnaHQ6IFtdLCBvdGhlcnM6IFtdIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHRvcDMsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ1RvcFdhbGxldCcsIGhpZ2hsaWdodDogdG9wMywgb3RoZXJzIH07XG4gIH0sIFt3YWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkXSk7XG5cbiAgY29uc3QgY29udGVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIHVzZU91dHNpZGVDbGljayhjb250ZW50UmVmLCBvbkNsb3NlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W1xuICAgICAgICB0d2BtYXgtdy1tZCB3LWZ1bGwgcmVsYXRpdmUgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC14bCBtYXgtaC1bOTB2aF0gbGc6bWF4LWgtWzU3NnB4XSB0cmFuc2l0aW9uLWhlaWdodCBkdXJhdGlvbi01MDAgZWFzZS1pbi1vdXQgYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxkaXYgdHc9XCJib3JkZXItdC1bMXB4XSBib3JkZXItd2hpdGUvMTBcIiAvPlxuICAgICAgPExpc3RPZldhbGxldHMgbGlzdD17bGlzdH0gb25Ub2dnbGU9e29uVG9nZ2xlfSBpc09wZW49e2lzT3Blbn0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVuaWZpZWRXYWxsZXRNb2RhbDtcbiJdfQ== */", process.env.NODE_ENV === "production" ? "" : ";label:UnifiedWalletModal;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFvYU0iLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuXG5pbXBvcnQgeyBXYWxsZXRJY29uLCBXYWxsZXRMaXN0SXRlbSB9IGZyb20gJy4vV2FsbGV0TGlzdEl0ZW0nO1xuXG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5cbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2hldnJvbkRvd25JY29uIGZyb20gJy4uLy4uL2ljb25zL0NoZXZyb25Eb3duSWNvbic7XG5pbXBvcnQgQ2hldnJvblVwSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DaGV2cm9uVXBJY29uJztcbmltcG9ydCBDbG9zZUljb24gZnJvbSAnLi4vLi4vaWNvbnMvQ2xvc2VJY29uJztcbmltcG9ydCB7IGlzTW9iaWxlLCB1c2VPdXRzaWRlQ2xpY2sgfSBmcm9tICcuLi8uLi9taXNjL3V0aWxzJztcbmltcG9ydCBOb3RJbnN0YWxsZWQgZnJvbSAnLi9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuL09uYm9hcmRpbmcnO1xuXG5jb25zdCBzdHlsZXM6IFJlY29yZDxzdHJpbmcsIHsgW2tleSBpbiBJVW5pZmllZFRoZW1lXTogVHdTdHlsZVtdIH0+ID0ge1xuICBjb250YWluZXI6IHtcbiAgICBsaWdodDogW3R3YHRleHQtYmxhY2sgIWJnLXdoaXRlIHNoYWRvdy14bGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlICFiZy1bIzNBM0I0M10gYm9yZGVyIGJvcmRlci13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlIGJnLVtyZ2IoNDksIDYyLCA3NildYF0sXG4gIH0sXG4gIHNoYWRlczoge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjZmZmZmZmXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAgZGFyazogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bIzNBM0I0M10gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGp1cGl0ZXI6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tW3JnYig0OSwgNjIsIDc2KV0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICB9LFxuICB3YWxsZXRJdGVtOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmF5LTUwIGhvdmVyOnNoYWRvdy1sZyBob3Zlcjpib3JkZXItYmxhY2svMTBgXSxcbiAgICBkYXJrOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF1cbiAgfVxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBqdXN0aWZ5LWJldHdlZW4gbGVhZGluZy1ub25lYCwgc3R5bGVzLmhlYWRlclt0aGVtZV1dfT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJmb250LXNlbWlib2xkXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIG10LTFgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYFlvdSBuZWVkIHRvIGNvbm5lY3QgYSBTb2xhbmEgd2FsbGV0LmApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8c3BhbiB0dz1cIm10LTYgdGV4dC14cyBmb250LXNlbWlib2xkXCI+e3QoYFJlY29tbWVuZGVkIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTAgbWItNVwiPlxuICAgICAgICAgIHtsaXN0LnJlY29tbWVuZGVkV2FsbGV0cy5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGxnOmZsZXgtY29sIGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHNwYW4gdHc9XCJtdC02IHRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdSZWNvbW1lbmRlZCcgPyB0KGBSZWNvbW1lbmRlZCB3YWxsZXRzYCkgOiBudWxsfVxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgPT09ICdQcmV2aW91c2x5Q29ubmVjdGVkJyA/IHQoYFJlY2VudGx5IHVzZWRgKSA6IG51bGx9XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSA9PT0gJ0luc3RhbGxlZCcgPyB0KGBJbnN0YWxsZWQgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHRlZEJ5ID09PSAnVG9wV2FsbGV0JyA/IHQoYFBvcHVsYXIgd2FsbGV0c2ApIDogbnVsbH1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QuaGlnaGxpZ2h0Lm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9ICgoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhZGFwdGVyLm5hbWUgPT09IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lKSByZXR1cm4gdChgTW9iaWxlYCk7XG4gICAgICAgICAgICAgIHJldHVybiBhZGFwdGVyLm5hbWU7XG4gICAgICAgICAgICB9KSgpO1xuXG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBsZzpmbGV4LWNvbCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIGxnOm1heC13LVszMyVdYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhzIG1sLTQgbGc6bWwtMCBsZzptdC0zXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1iZXR3ZWVuIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPnt0KGBNb3JlIHdhbGxldHNgKX08L3NwYW4+XG4gICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICA8ZGl2IHR3PVwiIGZsZXggaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJ3LVsxMHB4XSBoLVs2cHhdXCI+e2lzT3BlbiA/IDxDaGV2cm9uVXBJY29uIC8+IDogPENoZXZyb25Eb3duSWNvbiAvPn08L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLCBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV1dfT5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSl9PlxuICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXYgPlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqLyB9XG4gIHtcbiAgICBpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgIDw+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICA8Lz5cbiAgICApIDogbnVsbFxuICB9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydCYWNrcGFjaycgYXMgV2FsbGV0TmFtZTwnQmFja3BhY2snPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG4gICdTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPixcbl07XG5cbmludGVyZmFjZSBJVW5pZmllZFdhbGxldE1vZGFsIHtcbiAgb25DbG9zZTogKCkgPT4gdm9pZDtcbn1cblxuY29uc3Qgc29ydEJ5UHJlY2VkZW5jZSA9ICh3YWxsZXRQcmVjZWRlbmNlOiBXYWxsZXROYW1lW10pID0+IChhOiBBZGFwdGVyLCBiOiBBZGFwdGVyKSA9PiB7XG4gIGlmICghd2FsbGV0UHJlY2VkZW5jZSkgcmV0dXJuIDA7XG5cbiAgY29uc3QgYUluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGEubmFtZSk7XG4gIGNvbnN0IGJJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihiLm5hbWUpO1xuXG4gIGlmIChhSW5kZXggPT09IC0xICYmIGJJbmRleCA9PT0gLTEpIHJldHVybiAwO1xuICBpZiAoYUluZGV4ID49IDApIHtcbiAgICBpZiAoYkluZGV4ID09PSAtMSkgcmV0dXJuIC0xO1xuICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gIH1cblxuICBpZiAoYkluZGV4ID49IDApIHtcbiAgICBpZiAoYUluZGV4ID09PSAtMSkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGJJbmRleCAtIGFJbmRleDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbmNvbnN0IFVuaWZpZWRXYWxsZXRNb2RhbDogUmVhY3QuRkM8SVVuaWZpZWRXYWxsZXRNb2RhbD4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB3YWxsZXRzIH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgd2FsbGV0UHJlY2VkZW5jZSwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IFtpc09wZW4sIG9uVG9nZ2xlXSA9IHVzZVRvZ2dsZShmYWxzZSk7XG4gIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWQgPSB1c2VQcmV2aW91c2x5Q29ubmVjdGVkKCk7XG5cbiAgY29uc3QgbGlzdDogeyByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTsgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7IGhpZ2hsaWdodDogQWRhcHRlcltdOyBvdGhlcnM6IEFkYXB0ZXJbXSB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgLy8gVGhlbiwgSW5zdGFsbGVkLCBUb3AgMywgTG9hZGFibGUsIE5vdERldGVjdGVkXG4gICAgY29uc3QgZmlsdGVyZWRBZGFwdGVycyA9IHdhbGxldHMucmVkdWNlPHtcbiAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIGluc3RhbGxlZDogQWRhcHRlcltdO1xuICAgICAgdG9wMzogQWRhcHRlcltdO1xuICAgICAgbG9hZGFibGU6IEFkYXB0ZXJbXTtcbiAgICAgIG5vdERldGVjdGVkOiBBZGFwdGVyW107XG4gICAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICB9PihcbiAgICAgIChhY2MsIHdhbGxldCkgPT4ge1xuICAgICAgICBjb25zdCBhZGFwdGVyTmFtZSA9IHdhbGxldC5hZGFwdGVyLm5hbWU7XG5cbiAgICAgICAgaWYgKFJFQ09NTUVOREVEX1dBTExFVFMuc29tZSgod2FsbGV0KSA9PiB3YWxsZXQgPT09IGFkYXB0ZXJOYW1lKSkge1xuICAgICAgICAgIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZpb3VzbHkgY29ubmVjdGVkIHRha2VzIGhpZ2hlc3RcbiAgICAgICAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID0gcHJldmlvdXNseUNvbm5lY3RlZC5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnByZXZpb3VzbHlDb25uZWN0ZWRbcHJldmlvdXNseUNvbm5lY3RlZEluZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlbiBJbnN0YWxsZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZCkge1xuICAgICAgICAgIGFjYy5pbnN0YWxsZWQucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3AgM1xuICAgICAgICBjb25zdCB0b3BXYWxsZXRzSW5kZXggPSBUT1BfV0FMTEVUUy5pbmRleE9mKGFkYXB0ZXJOYW1lKTtcbiAgICAgICAgaWYgKHRvcFdhbGxldHNJbmRleCA+PSAwKSB7XG4gICAgICAgICAgYWNjLnRvcDNbdG9wV2FsbGV0c0luZGV4XSA9IHdhbGxldC5hZGFwdGVyO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9hZGFibGVcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTm90RGV0ZWN0ZWRcbiAgICAgICAgaWYgKHdhbGxldC5yZWFkeVN0YXRlID09PSBXYWxsZXRSZWFkeVN0YXRlLk5vdERldGVjdGVkKSB7XG4gICAgICAgICAgYWNjLmxvYWRhYmxlLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogW10sXG4gICAgICAgIHByZXZpb3VzbHlDb25uZWN0ZWQ6IFtdLFxuICAgICAgICBpbnN0YWxsZWQ6IFtdLFxuICAgICAgICB0b3AzOiBbXSxcbiAgICAgICAgbG9hZGFibGU6IFtdLFxuICAgICAgICBub3REZXRlY3RlZDogW10sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMCwgMyk7XG4gICAgICBsZXQgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGgpKTtcbiAgICAgIG90aGVycyA9IG90aGVycy5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ1ByZXZpb3VzbHlDb25uZWN0ZWQnLFxuICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgIG90aGVycyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCBpbnN0YWxsZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgICBjb25zdCBoaWdobGlnaHQgPSBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAzKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDMsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLCBoaWdobGlnaHQ6IFtdLCBvdGhlcnM6IFtdIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHRvcDMsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG4gICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgLmZsYXQoKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ1RvcFdhbGxldCcsIGhpZ2hsaWdodDogdG9wMywgb3RoZXJzIH07XG4gIH0sIFt3YWxsZXRzLCBwcmV2aW91c2x5Q29ubmVjdGVkXSk7XG5cbiAgY29uc3QgY29udGVudFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIHVzZU91dHNpZGVDbGljayhjb250ZW50UmVmLCBvbkNsb3NlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17Y29udGVudFJlZn1cbiAgICAgIGNzcz17W1xuICAgICAgICB0d2BtYXgtdy1tZCB3LWZ1bGwgcmVsYXRpdmUgZmxleCBmbGV4LWNvbCBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC14bCBtYXgtaC1bOTB2aF0gbGc6bWF4LWgtWzU3NnB4XSB0cmFuc2l0aW9uLWhlaWdodCBkdXJhdGlvbi01MDAgZWFzZS1pbi1vdXQgYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxkaXYgdHc9XCJib3JkZXItdC1bMXB4XSBib3JkZXItd2hpdGUvMTBcIiAvPlxuICAgICAgPExpc3RPZldhbGxldHMgbGlzdD17bGlzdH0gb25Ub2dnbGU9e29uVG9nZ2xlfSBpc09wZW49e2lzT3Blbn0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVuaWZpZWRXYWxsZXRNb2RhbDtcbiJdfQ== */"]
  }, jsx(Header, {
    onClose: onClose
  }), jsx("div", {
    css: _ref15
  }), jsx(ListOfWallets, {
    list: list,
    onToggle: onToggle,
    isOpen: isOpen
  }));
};
var UnifiedWalletModal$1 = UnifiedWalletModal;

const UnifiedWalletValueProvider = ({
  children
}) => {
  const defaultWalletContext = useWallet();
  const value = useMemo(() => {
    return {
      ...defaultWalletContext,
      connect: async () => {
        try {
          return await defaultWalletContext.connect();
        } catch (error) {
          // when wallet is not installed
        }
      }
    };
  }, [defaultWalletContext]);
  return jsx(UnifiedWalletValueContext.Provider, {
    value: value
  }, children);
};
const UnifiedWalletContextProvider = ({
  config,
  children
}) => {
  const {
    publicKey,
    wallet,
    select,
    connect
  } = useUnifiedWallet();
  const previousPublicKey = usePrevious(publicKey);
  const previousWallet = usePrevious(wallet);

  // Weird quirks for autoConnect to require select and connect
  const [nonAutoConnectAttempt, setNonAutoConnectAttempt] = useState(false);
  useEffect(() => {
    if (nonAutoConnectAttempt && !config.autoConnect && wallet?.adapter.name) {
      try {
        connect();
      } catch (error) {
        // when wallet is not installed
      }
      setNonAutoConnectAttempt(false);
    }
  }, [nonAutoConnectAttempt, wallet?.adapter.name]);
  const [showModal, setShowModal] = useState(false);
  const handleConnectClick = useCallback(async (event, adapter) => {
    event.preventDefault();
    try {
      setShowModal(false);

      // Connecting
      config.notificationCallback?.onConnecting({
        publicKey: '',
        shortAddress: '',
        walletName: adapter.name,
        metadata: {
          name: adapter.name,
          url: adapter.url,
          icon: adapter.icon,
          supportedTransactionVersions: adapter.supportedTransactionVersions
        }
      });

      // Might throw WalletReadyState.WalletNotReady
      select(adapter.name);

      // Weird quirks for autoConnect to require select and connect
      if (!config.autoConnect) {
        setNonAutoConnectAttempt(true);
      }
      if (adapter.readyState === WalletReadyState.NotDetected) {
        throw WalletReadyState.NotDetected;
      }
    } catch (error) {
      console.log(error);

      // Not Installed
      config.notificationCallback?.onNotInstalled({
        publicKey: '',
        shortAddress: '',
        walletName: adapter.name,
        metadata: {
          name: adapter.name,
          url: adapter.url,
          icon: adapter.icon,
          supportedTransactionVersions: adapter.supportedTransactionVersions
        }
      });
    }
  }, [select, connect, wallet?.adapter.name]);
  useEffect(() => {
    // Disconnected
    if (previousWallet && !wallet) {
      config.notificationCallback?.onDisconnect({
        publicKey: previousPublicKey?.toString() || '',
        shortAddress: shortenAddress(previousPublicKey?.toString() || ''),
        walletName: previousWallet?.adapter.name || '',
        metadata: {
          name: previousWallet?.adapter.name,
          url: previousWallet?.adapter.url,
          icon: previousWallet?.adapter.icon,
          supportedTransactionVersions: previousWallet?.adapter.supportedTransactionVersions
        }
      });
      return;
    }

    // Connected
    if (publicKey && wallet) {
      config.notificationCallback?.onConnect({
        publicKey: publicKey.toString(),
        shortAddress: shortenAddress(publicKey.toString()),
        walletName: wallet.adapter.name,
        metadata: {
          name: wallet.adapter.name,
          url: wallet.adapter.url,
          icon: wallet.adapter.icon,
          supportedTransactionVersions: wallet.adapter.supportedTransactionVersions
        }
      });
      return;
    }
  }, [wallet, publicKey, previousWallet]);
  return jsx(UnifiedWalletContext.Provider, {
    value: {
      walletPrecedence: config.walletPrecedence || [],
      handleConnectClick,
      showModal,
      setShowModal,
      walletlistExplanation: config.walletlistExplanation,
      theme: config.theme || 'light',
      walletAttachments: config.walletAttachments || {}
    }
  }, jsx(ModalDialog$1, {
    open: showModal,
    onClose: () => setShowModal(false)
  }, jsx(UnifiedWalletModal$1, {
    onClose: () => setShowModal(false)
  })), children);
};
const UnifiedWalletProvider = ({
  wallets,
  config,
  children
}) => {
  return jsx(TranslationProvider, {
    lang: config.lang
  }, jsx(WalletConnectionProvider$1, {
    wallets: wallets,
    config: config
  }, jsx(UnifiedWalletValueProvider, null, jsx(UnifiedWalletContextProvider, {
    config: config
  }, children))));
};

var bn = {exports: {}};

bn.exports;

(function (module) {
	(function (module, exports) {

	  // Utils
	  function assert (val, msg) {
	    if (!val) throw new Error(msg || 'Assertion failed');
	  }

	  // Could use `inherits` module, but don't want to move from single file
	  // architecture yet.
	  function inherits (ctor, superCtor) {
	    ctor.super_ = superCtor;
	    var TempCtor = function () {};
	    TempCtor.prototype = superCtor.prototype;
	    ctor.prototype = new TempCtor();
	    ctor.prototype.constructor = ctor;
	  }

	  // BN

	  function BN (number, base, endian) {
	    if (BN.isBN(number)) {
	      return number;
	    }

	    this.negative = 0;
	    this.words = null;
	    this.length = 0;

	    // Reduction context
	    this.red = null;

	    if (number !== null) {
	      if (base === 'le' || base === 'be') {
	        endian = base;
	        base = 10;
	      }

	      this._init(number || 0, base || 10, endian || 'be');
	    }
	  }
	  if (typeof module === 'object') {
	    module.exports = BN;
	  } else {
	    exports.BN = BN;
	  }

	  BN.BN = BN;
	  BN.wordSize = 26;

	  var Buffer;
	  try {
	    if (typeof window !== 'undefined' && typeof window.Buffer !== 'undefined') {
	      Buffer = window.Buffer;
	    } else {
	      Buffer = require('buffer').Buffer;
	    }
	  } catch (e) {
	  }

	  BN.isBN = function isBN (num) {
	    if (num instanceof BN) {
	      return true;
	    }

	    return num !== null && typeof num === 'object' &&
	      num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
	  };

	  BN.max = function max (left, right) {
	    if (left.cmp(right) > 0) return left;
	    return right;
	  };

	  BN.min = function min (left, right) {
	    if (left.cmp(right) < 0) return left;
	    return right;
	  };

	  BN.prototype._init = function init (number, base, endian) {
	    if (typeof number === 'number') {
	      return this._initNumber(number, base, endian);
	    }

	    if (typeof number === 'object') {
	      return this._initArray(number, base, endian);
	    }

	    if (base === 'hex') {
	      base = 16;
	    }
	    assert(base === (base | 0) && base >= 2 && base <= 36);

	    number = number.toString().replace(/\s+/g, '');
	    var start = 0;
	    if (number[0] === '-') {
	      start++;
	      this.negative = 1;
	    }

	    if (start < number.length) {
	      if (base === 16) {
	        this._parseHex(number, start, endian);
	      } else {
	        this._parseBase(number, base, start);
	        if (endian === 'le') {
	          this._initArray(this.toArray(), base, endian);
	        }
	      }
	    }
	  };

	  BN.prototype._initNumber = function _initNumber (number, base, endian) {
	    if (number < 0) {
	      this.negative = 1;
	      number = -number;
	    }
	    if (number < 0x4000000) {
	      this.words = [number & 0x3ffffff];
	      this.length = 1;
	    } else if (number < 0x10000000000000) {
	      this.words = [
	        number & 0x3ffffff,
	        (number / 0x4000000) & 0x3ffffff
	      ];
	      this.length = 2;
	    } else {
	      assert(number < 0x20000000000000); // 2 ^ 53 (unsafe)
	      this.words = [
	        number & 0x3ffffff,
	        (number / 0x4000000) & 0x3ffffff,
	        1
	      ];
	      this.length = 3;
	    }

	    if (endian !== 'le') return;

	    // Reverse the bytes
	    this._initArray(this.toArray(), base, endian);
	  };

	  BN.prototype._initArray = function _initArray (number, base, endian) {
	    // Perhaps a Uint8Array
	    assert(typeof number.length === 'number');
	    if (number.length <= 0) {
	      this.words = [0];
	      this.length = 1;
	      return this;
	    }

	    this.length = Math.ceil(number.length / 3);
	    this.words = new Array(this.length);
	    for (var i = 0; i < this.length; i++) {
	      this.words[i] = 0;
	    }

	    var j, w;
	    var off = 0;
	    if (endian === 'be') {
	      for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
	        w = number[i] | (number[i - 1] << 8) | (number[i - 2] << 16);
	        this.words[j] |= (w << off) & 0x3ffffff;
	        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
	        off += 24;
	        if (off >= 26) {
	          off -= 26;
	          j++;
	        }
	      }
	    } else if (endian === 'le') {
	      for (i = 0, j = 0; i < number.length; i += 3) {
	        w = number[i] | (number[i + 1] << 8) | (number[i + 2] << 16);
	        this.words[j] |= (w << off) & 0x3ffffff;
	        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
	        off += 24;
	        if (off >= 26) {
	          off -= 26;
	          j++;
	        }
	      }
	    }
	    return this._strip();
	  };

	  function parseHex4Bits (string, index) {
	    var c = string.charCodeAt(index);
	    // '0' - '9'
	    if (c >= 48 && c <= 57) {
	      return c - 48;
	    // 'A' - 'F'
	    } else if (c >= 65 && c <= 70) {
	      return c - 55;
	    // 'a' - 'f'
	    } else if (c >= 97 && c <= 102) {
	      return c - 87;
	    } else {
	      assert(false, 'Invalid character in ' + string);
	    }
	  }

	  function parseHexByte (string, lowerBound, index) {
	    var r = parseHex4Bits(string, index);
	    if (index - 1 >= lowerBound) {
	      r |= parseHex4Bits(string, index - 1) << 4;
	    }
	    return r;
	  }

	  BN.prototype._parseHex = function _parseHex (number, start, endian) {
	    // Create possibly bigger array to ensure that it fits the number
	    this.length = Math.ceil((number.length - start) / 6);
	    this.words = new Array(this.length);
	    for (var i = 0; i < this.length; i++) {
	      this.words[i] = 0;
	    }

	    // 24-bits chunks
	    var off = 0;
	    var j = 0;

	    var w;
	    if (endian === 'be') {
	      for (i = number.length - 1; i >= start; i -= 2) {
	        w = parseHexByte(number, start, i) << off;
	        this.words[j] |= w & 0x3ffffff;
	        if (off >= 18) {
	          off -= 18;
	          j += 1;
	          this.words[j] |= w >>> 26;
	        } else {
	          off += 8;
	        }
	      }
	    } else {
	      var parseLength = number.length - start;
	      for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
	        w = parseHexByte(number, start, i) << off;
	        this.words[j] |= w & 0x3ffffff;
	        if (off >= 18) {
	          off -= 18;
	          j += 1;
	          this.words[j] |= w >>> 26;
	        } else {
	          off += 8;
	        }
	      }
	    }

	    this._strip();
	  };

	  function parseBase (str, start, end, mul) {
	    var r = 0;
	    var b = 0;
	    var len = Math.min(str.length, end);
	    for (var i = start; i < len; i++) {
	      var c = str.charCodeAt(i) - 48;

	      r *= mul;

	      // 'a'
	      if (c >= 49) {
	        b = c - 49 + 0xa;

	      // 'A'
	      } else if (c >= 17) {
	        b = c - 17 + 0xa;

	      // '0' - '9'
	      } else {
	        b = c;
	      }
	      assert(c >= 0 && b < mul, 'Invalid character');
	      r += b;
	    }
	    return r;
	  }

	  BN.prototype._parseBase = function _parseBase (number, base, start) {
	    // Initialize as zero
	    this.words = [0];
	    this.length = 1;

	    // Find length of limb in base
	    for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
	      limbLen++;
	    }
	    limbLen--;
	    limbPow = (limbPow / base) | 0;

	    var total = number.length - start;
	    var mod = total % limbLen;
	    var end = Math.min(total, total - mod) + start;

	    var word = 0;
	    for (var i = start; i < end; i += limbLen) {
	      word = parseBase(number, i, i + limbLen, base);

	      this.imuln(limbPow);
	      if (this.words[0] + word < 0x4000000) {
	        this.words[0] += word;
	      } else {
	        this._iaddn(word);
	      }
	    }

	    if (mod !== 0) {
	      var pow = 1;
	      word = parseBase(number, i, number.length, base);

	      for (i = 0; i < mod; i++) {
	        pow *= base;
	      }

	      this.imuln(pow);
	      if (this.words[0] + word < 0x4000000) {
	        this.words[0] += word;
	      } else {
	        this._iaddn(word);
	      }
	    }

	    this._strip();
	  };

	  BN.prototype.copy = function copy (dest) {
	    dest.words = new Array(this.length);
	    for (var i = 0; i < this.length; i++) {
	      dest.words[i] = this.words[i];
	    }
	    dest.length = this.length;
	    dest.negative = this.negative;
	    dest.red = this.red;
	  };

	  function move (dest, src) {
	    dest.words = src.words;
	    dest.length = src.length;
	    dest.negative = src.negative;
	    dest.red = src.red;
	  }

	  BN.prototype._move = function _move (dest) {
	    move(dest, this);
	  };

	  BN.prototype.clone = function clone () {
	    var r = new BN(null);
	    this.copy(r);
	    return r;
	  };

	  BN.prototype._expand = function _expand (size) {
	    while (this.length < size) {
	      this.words[this.length++] = 0;
	    }
	    return this;
	  };

	  // Remove leading `0` from `this`
	  BN.prototype._strip = function strip () {
	    while (this.length > 1 && this.words[this.length - 1] === 0) {
	      this.length--;
	    }
	    return this._normSign();
	  };

	  BN.prototype._normSign = function _normSign () {
	    // -0 = 0
	    if (this.length === 1 && this.words[0] === 0) {
	      this.negative = 0;
	    }
	    return this;
	  };

	  // Check Symbol.for because not everywhere where Symbol defined
	  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#Browser_compatibility
	  if (typeof Symbol !== 'undefined' && typeof Symbol.for === 'function') {
	    try {
	      BN.prototype[Symbol.for('nodejs.util.inspect.custom')] = inspect;
	    } catch (e) {
	      BN.prototype.inspect = inspect;
	    }
	  } else {
	    BN.prototype.inspect = inspect;
	  }

	  function inspect () {
	    return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
	  }

	  /*

	  var zeros = [];
	  var groupSizes = [];
	  var groupBases = [];

	  var s = '';
	  var i = -1;
	  while (++i < BN.wordSize) {
	    zeros[i] = s;
	    s += '0';
	  }
	  groupSizes[0] = 0;
	  groupSizes[1] = 0;
	  groupBases[0] = 0;
	  groupBases[1] = 0;
	  var base = 2 - 1;
	  while (++base < 36 + 1) {
	    var groupSize = 0;
	    var groupBase = 1;
	    while (groupBase < (1 << BN.wordSize) / base) {
	      groupBase *= base;
	      groupSize += 1;
	    }
	    groupSizes[base] = groupSize;
	    groupBases[base] = groupBase;
	  }

	  */

	  var zeros = [
	    '',
	    '0',
	    '00',
	    '000',
	    '0000',
	    '00000',
	    '000000',
	    '0000000',
	    '00000000',
	    '000000000',
	    '0000000000',
	    '00000000000',
	    '000000000000',
	    '0000000000000',
	    '00000000000000',
	    '000000000000000',
	    '0000000000000000',
	    '00000000000000000',
	    '000000000000000000',
	    '0000000000000000000',
	    '00000000000000000000',
	    '000000000000000000000',
	    '0000000000000000000000',
	    '00000000000000000000000',
	    '000000000000000000000000',
	    '0000000000000000000000000'
	  ];

	  var groupSizes = [
	    0, 0,
	    25, 16, 12, 11, 10, 9, 8,
	    8, 7, 7, 7, 7, 6, 6,
	    6, 6, 6, 6, 6, 5, 5,
	    5, 5, 5, 5, 5, 5, 5,
	    5, 5, 5, 5, 5, 5, 5
	  ];

	  var groupBases = [
	    0, 0,
	    33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216,
	    43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625,
	    16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632,
	    6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149,
	    24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176
	  ];

	  BN.prototype.toString = function toString (base, padding) {
	    base = base || 10;
	    padding = padding | 0 || 1;

	    var out;
	    if (base === 16 || base === 'hex') {
	      out = '';
	      var off = 0;
	      var carry = 0;
	      for (var i = 0; i < this.length; i++) {
	        var w = this.words[i];
	        var word = (((w << off) | carry) & 0xffffff).toString(16);
	        carry = (w >>> (24 - off)) & 0xffffff;
	        off += 2;
	        if (off >= 26) {
	          off -= 26;
	          i--;
	        }
	        if (carry !== 0 || i !== this.length - 1) {
	          out = zeros[6 - word.length] + word + out;
	        } else {
	          out = word + out;
	        }
	      }
	      if (carry !== 0) {
	        out = carry.toString(16) + out;
	      }
	      while (out.length % padding !== 0) {
	        out = '0' + out;
	      }
	      if (this.negative !== 0) {
	        out = '-' + out;
	      }
	      return out;
	    }

	    if (base === (base | 0) && base >= 2 && base <= 36) {
	      // var groupSize = Math.floor(BN.wordSize * Math.LN2 / Math.log(base));
	      var groupSize = groupSizes[base];
	      // var groupBase = Math.pow(base, groupSize);
	      var groupBase = groupBases[base];
	      out = '';
	      var c = this.clone();
	      c.negative = 0;
	      while (!c.isZero()) {
	        var r = c.modrn(groupBase).toString(base);
	        c = c.idivn(groupBase);

	        if (!c.isZero()) {
	          out = zeros[groupSize - r.length] + r + out;
	        } else {
	          out = r + out;
	        }
	      }
	      if (this.isZero()) {
	        out = '0' + out;
	      }
	      while (out.length % padding !== 0) {
	        out = '0' + out;
	      }
	      if (this.negative !== 0) {
	        out = '-' + out;
	      }
	      return out;
	    }

	    assert(false, 'Base should be between 2 and 36');
	  };

	  BN.prototype.toNumber = function toNumber () {
	    var ret = this.words[0];
	    if (this.length === 2) {
	      ret += this.words[1] * 0x4000000;
	    } else if (this.length === 3 && this.words[2] === 0x01) {
	      // NOTE: at this stage it is known that the top bit is set
	      ret += 0x10000000000000 + (this.words[1] * 0x4000000);
	    } else if (this.length > 2) {
	      assert(false, 'Number can only safely store up to 53 bits');
	    }
	    return (this.negative !== 0) ? -ret : ret;
	  };

	  BN.prototype.toJSON = function toJSON () {
	    return this.toString(16, 2);
	  };

	  if (Buffer) {
	    BN.prototype.toBuffer = function toBuffer (endian, length) {
	      return this.toArrayLike(Buffer, endian, length);
	    };
	  }

	  BN.prototype.toArray = function toArray (endian, length) {
	    return this.toArrayLike(Array, endian, length);
	  };

	  var allocate = function allocate (ArrayType, size) {
	    if (ArrayType.allocUnsafe) {
	      return ArrayType.allocUnsafe(size);
	    }
	    return new ArrayType(size);
	  };

	  BN.prototype.toArrayLike = function toArrayLike (ArrayType, endian, length) {
	    this._strip();

	    var byteLength = this.byteLength();
	    var reqLength = length || Math.max(1, byteLength);
	    assert(byteLength <= reqLength, 'byte array longer than desired length');
	    assert(reqLength > 0, 'Requested array length <= 0');

	    var res = allocate(ArrayType, reqLength);
	    var postfix = endian === 'le' ? 'LE' : 'BE';
	    this['_toArrayLike' + postfix](res, byteLength);
	    return res;
	  };

	  BN.prototype._toArrayLikeLE = function _toArrayLikeLE (res, byteLength) {
	    var position = 0;
	    var carry = 0;

	    for (var i = 0, shift = 0; i < this.length; i++) {
	      var word = (this.words[i] << shift) | carry;

	      res[position++] = word & 0xff;
	      if (position < res.length) {
	        res[position++] = (word >> 8) & 0xff;
	      }
	      if (position < res.length) {
	        res[position++] = (word >> 16) & 0xff;
	      }

	      if (shift === 6) {
	        if (position < res.length) {
	          res[position++] = (word >> 24) & 0xff;
	        }
	        carry = 0;
	        shift = 0;
	      } else {
	        carry = word >>> 24;
	        shift += 2;
	      }
	    }

	    if (position < res.length) {
	      res[position++] = carry;

	      while (position < res.length) {
	        res[position++] = 0;
	      }
	    }
	  };

	  BN.prototype._toArrayLikeBE = function _toArrayLikeBE (res, byteLength) {
	    var position = res.length - 1;
	    var carry = 0;

	    for (var i = 0, shift = 0; i < this.length; i++) {
	      var word = (this.words[i] << shift) | carry;

	      res[position--] = word & 0xff;
	      if (position >= 0) {
	        res[position--] = (word >> 8) & 0xff;
	      }
	      if (position >= 0) {
	        res[position--] = (word >> 16) & 0xff;
	      }

	      if (shift === 6) {
	        if (position >= 0) {
	          res[position--] = (word >> 24) & 0xff;
	        }
	        carry = 0;
	        shift = 0;
	      } else {
	        carry = word >>> 24;
	        shift += 2;
	      }
	    }

	    if (position >= 0) {
	      res[position--] = carry;

	      while (position >= 0) {
	        res[position--] = 0;
	      }
	    }
	  };

	  if (Math.clz32) {
	    BN.prototype._countBits = function _countBits (w) {
	      return 32 - Math.clz32(w);
	    };
	  } else {
	    BN.prototype._countBits = function _countBits (w) {
	      var t = w;
	      var r = 0;
	      if (t >= 0x1000) {
	        r += 13;
	        t >>>= 13;
	      }
	      if (t >= 0x40) {
	        r += 7;
	        t >>>= 7;
	      }
	      if (t >= 0x8) {
	        r += 4;
	        t >>>= 4;
	      }
	      if (t >= 0x02) {
	        r += 2;
	        t >>>= 2;
	      }
	      return r + t;
	    };
	  }

	  BN.prototype._zeroBits = function _zeroBits (w) {
	    // Short-cut
	    if (w === 0) return 26;

	    var t = w;
	    var r = 0;
	    if ((t & 0x1fff) === 0) {
	      r += 13;
	      t >>>= 13;
	    }
	    if ((t & 0x7f) === 0) {
	      r += 7;
	      t >>>= 7;
	    }
	    if ((t & 0xf) === 0) {
	      r += 4;
	      t >>>= 4;
	    }
	    if ((t & 0x3) === 0) {
	      r += 2;
	      t >>>= 2;
	    }
	    if ((t & 0x1) === 0) {
	      r++;
	    }
	    return r;
	  };

	  // Return number of used bits in a BN
	  BN.prototype.bitLength = function bitLength () {
	    var w = this.words[this.length - 1];
	    var hi = this._countBits(w);
	    return (this.length - 1) * 26 + hi;
	  };

	  function toBitArray (num) {
	    var w = new Array(num.bitLength());

	    for (var bit = 0; bit < w.length; bit++) {
	      var off = (bit / 26) | 0;
	      var wbit = bit % 26;

	      w[bit] = (num.words[off] >>> wbit) & 0x01;
	    }

	    return w;
	  }

	  // Number of trailing zero bits
	  BN.prototype.zeroBits = function zeroBits () {
	    if (this.isZero()) return 0;

	    var r = 0;
	    for (var i = 0; i < this.length; i++) {
	      var b = this._zeroBits(this.words[i]);
	      r += b;
	      if (b !== 26) break;
	    }
	    return r;
	  };

	  BN.prototype.byteLength = function byteLength () {
	    return Math.ceil(this.bitLength() / 8);
	  };

	  BN.prototype.toTwos = function toTwos (width) {
	    if (this.negative !== 0) {
	      return this.abs().inotn(width).iaddn(1);
	    }
	    return this.clone();
	  };

	  BN.prototype.fromTwos = function fromTwos (width) {
	    if (this.testn(width - 1)) {
	      return this.notn(width).iaddn(1).ineg();
	    }
	    return this.clone();
	  };

	  BN.prototype.isNeg = function isNeg () {
	    return this.negative !== 0;
	  };

	  // Return negative clone of `this`
	  BN.prototype.neg = function neg () {
	    return this.clone().ineg();
	  };

	  BN.prototype.ineg = function ineg () {
	    if (!this.isZero()) {
	      this.negative ^= 1;
	    }

	    return this;
	  };

	  // Or `num` with `this` in-place
	  BN.prototype.iuor = function iuor (num) {
	    while (this.length < num.length) {
	      this.words[this.length++] = 0;
	    }

	    for (var i = 0; i < num.length; i++) {
	      this.words[i] = this.words[i] | num.words[i];
	    }

	    return this._strip();
	  };

	  BN.prototype.ior = function ior (num) {
	    assert((this.negative | num.negative) === 0);
	    return this.iuor(num);
	  };

	  // Or `num` with `this`
	  BN.prototype.or = function or (num) {
	    if (this.length > num.length) return this.clone().ior(num);
	    return num.clone().ior(this);
	  };

	  BN.prototype.uor = function uor (num) {
	    if (this.length > num.length) return this.clone().iuor(num);
	    return num.clone().iuor(this);
	  };

	  // And `num` with `this` in-place
	  BN.prototype.iuand = function iuand (num) {
	    // b = min-length(num, this)
	    var b;
	    if (this.length > num.length) {
	      b = num;
	    } else {
	      b = this;
	    }

	    for (var i = 0; i < b.length; i++) {
	      this.words[i] = this.words[i] & num.words[i];
	    }

	    this.length = b.length;

	    return this._strip();
	  };

	  BN.prototype.iand = function iand (num) {
	    assert((this.negative | num.negative) === 0);
	    return this.iuand(num);
	  };

	  // And `num` with `this`
	  BN.prototype.and = function and (num) {
	    if (this.length > num.length) return this.clone().iand(num);
	    return num.clone().iand(this);
	  };

	  BN.prototype.uand = function uand (num) {
	    if (this.length > num.length) return this.clone().iuand(num);
	    return num.clone().iuand(this);
	  };

	  // Xor `num` with `this` in-place
	  BN.prototype.iuxor = function iuxor (num) {
	    // a.length > b.length
	    var a;
	    var b;
	    if (this.length > num.length) {
	      a = this;
	      b = num;
	    } else {
	      a = num;
	      b = this;
	    }

	    for (var i = 0; i < b.length; i++) {
	      this.words[i] = a.words[i] ^ b.words[i];
	    }

	    if (this !== a) {
	      for (; i < a.length; i++) {
	        this.words[i] = a.words[i];
	      }
	    }

	    this.length = a.length;

	    return this._strip();
	  };

	  BN.prototype.ixor = function ixor (num) {
	    assert((this.negative | num.negative) === 0);
	    return this.iuxor(num);
	  };

	  // Xor `num` with `this`
	  BN.prototype.xor = function xor (num) {
	    if (this.length > num.length) return this.clone().ixor(num);
	    return num.clone().ixor(this);
	  };

	  BN.prototype.uxor = function uxor (num) {
	    if (this.length > num.length) return this.clone().iuxor(num);
	    return num.clone().iuxor(this);
	  };

	  // Not ``this`` with ``width`` bitwidth
	  BN.prototype.inotn = function inotn (width) {
	    assert(typeof width === 'number' && width >= 0);

	    var bytesNeeded = Math.ceil(width / 26) | 0;
	    var bitsLeft = width % 26;

	    // Extend the buffer with leading zeroes
	    this._expand(bytesNeeded);

	    if (bitsLeft > 0) {
	      bytesNeeded--;
	    }

	    // Handle complete words
	    for (var i = 0; i < bytesNeeded; i++) {
	      this.words[i] = ~this.words[i] & 0x3ffffff;
	    }

	    // Handle the residue
	    if (bitsLeft > 0) {
	      this.words[i] = ~this.words[i] & (0x3ffffff >> (26 - bitsLeft));
	    }

	    // And remove leading zeroes
	    return this._strip();
	  };

	  BN.prototype.notn = function notn (width) {
	    return this.clone().inotn(width);
	  };

	  // Set `bit` of `this`
	  BN.prototype.setn = function setn (bit, val) {
	    assert(typeof bit === 'number' && bit >= 0);

	    var off = (bit / 26) | 0;
	    var wbit = bit % 26;

	    this._expand(off + 1);

	    if (val) {
	      this.words[off] = this.words[off] | (1 << wbit);
	    } else {
	      this.words[off] = this.words[off] & ~(1 << wbit);
	    }

	    return this._strip();
	  };

	  // Add `num` to `this` in-place
	  BN.prototype.iadd = function iadd (num) {
	    var r;

	    // negative + positive
	    if (this.negative !== 0 && num.negative === 0) {
	      this.negative = 0;
	      r = this.isub(num);
	      this.negative ^= 1;
	      return this._normSign();

	    // positive + negative
	    } else if (this.negative === 0 && num.negative !== 0) {
	      num.negative = 0;
	      r = this.isub(num);
	      num.negative = 1;
	      return r._normSign();
	    }

	    // a.length > b.length
	    var a, b;
	    if (this.length > num.length) {
	      a = this;
	      b = num;
	    } else {
	      a = num;
	      b = this;
	    }

	    var carry = 0;
	    for (var i = 0; i < b.length; i++) {
	      r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
	      this.words[i] = r & 0x3ffffff;
	      carry = r >>> 26;
	    }
	    for (; carry !== 0 && i < a.length; i++) {
	      r = (a.words[i] | 0) + carry;
	      this.words[i] = r & 0x3ffffff;
	      carry = r >>> 26;
	    }

	    this.length = a.length;
	    if (carry !== 0) {
	      this.words[this.length] = carry;
	      this.length++;
	    // Copy the rest of the words
	    } else if (a !== this) {
	      for (; i < a.length; i++) {
	        this.words[i] = a.words[i];
	      }
	    }

	    return this;
	  };

	  // Add `num` to `this`
	  BN.prototype.add = function add (num) {
	    var res;
	    if (num.negative !== 0 && this.negative === 0) {
	      num.negative = 0;
	      res = this.sub(num);
	      num.negative ^= 1;
	      return res;
	    } else if (num.negative === 0 && this.negative !== 0) {
	      this.negative = 0;
	      res = num.sub(this);
	      this.negative = 1;
	      return res;
	    }

	    if (this.length > num.length) return this.clone().iadd(num);

	    return num.clone().iadd(this);
	  };

	  // Subtract `num` from `this` in-place
	  BN.prototype.isub = function isub (num) {
	    // this - (-num) = this + num
	    if (num.negative !== 0) {
	      num.negative = 0;
	      var r = this.iadd(num);
	      num.negative = 1;
	      return r._normSign();

	    // -this - num = -(this + num)
	    } else if (this.negative !== 0) {
	      this.negative = 0;
	      this.iadd(num);
	      this.negative = 1;
	      return this._normSign();
	    }

	    // At this point both numbers are positive
	    var cmp = this.cmp(num);

	    // Optimization - zeroify
	    if (cmp === 0) {
	      this.negative = 0;
	      this.length = 1;
	      this.words[0] = 0;
	      return this;
	    }

	    // a > b
	    var a, b;
	    if (cmp > 0) {
	      a = this;
	      b = num;
	    } else {
	      a = num;
	      b = this;
	    }

	    var carry = 0;
	    for (var i = 0; i < b.length; i++) {
	      r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
	      carry = r >> 26;
	      this.words[i] = r & 0x3ffffff;
	    }
	    for (; carry !== 0 && i < a.length; i++) {
	      r = (a.words[i] | 0) + carry;
	      carry = r >> 26;
	      this.words[i] = r & 0x3ffffff;
	    }

	    // Copy rest of the words
	    if (carry === 0 && i < a.length && a !== this) {
	      for (; i < a.length; i++) {
	        this.words[i] = a.words[i];
	      }
	    }

	    this.length = Math.max(this.length, i);

	    if (a !== this) {
	      this.negative = 1;
	    }

	    return this._strip();
	  };

	  // Subtract `num` from `this`
	  BN.prototype.sub = function sub (num) {
	    return this.clone().isub(num);
	  };

	  function smallMulTo (self, num, out) {
	    out.negative = num.negative ^ self.negative;
	    var len = (self.length + num.length) | 0;
	    out.length = len;
	    len = (len - 1) | 0;

	    // Peel one iteration (compiler can't do it, because of code complexity)
	    var a = self.words[0] | 0;
	    var b = num.words[0] | 0;
	    var r = a * b;

	    var lo = r & 0x3ffffff;
	    var carry = (r / 0x4000000) | 0;
	    out.words[0] = lo;

	    for (var k = 1; k < len; k++) {
	      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
	      // note that ncarry could be >= 0x3ffffff
	      var ncarry = carry >>> 26;
	      var rword = carry & 0x3ffffff;
	      var maxJ = Math.min(k, num.length - 1);
	      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
	        var i = (k - j) | 0;
	        a = self.words[i] | 0;
	        b = num.words[j] | 0;
	        r = a * b + rword;
	        ncarry += (r / 0x4000000) | 0;
	        rword = r & 0x3ffffff;
	      }
	      out.words[k] = rword | 0;
	      carry = ncarry | 0;
	    }
	    if (carry !== 0) {
	      out.words[k] = carry | 0;
	    } else {
	      out.length--;
	    }

	    return out._strip();
	  }

	  // TODO(indutny): it may be reasonable to omit it for users who don't need
	  // to work with 256-bit numbers, otherwise it gives 20% improvement for 256-bit
	  // multiplication (like elliptic secp256k1).
	  var comb10MulTo = function comb10MulTo (self, num, out) {
	    var a = self.words;
	    var b = num.words;
	    var o = out.words;
	    var c = 0;
	    var lo;
	    var mid;
	    var hi;
	    var a0 = a[0] | 0;
	    var al0 = a0 & 0x1fff;
	    var ah0 = a0 >>> 13;
	    var a1 = a[1] | 0;
	    var al1 = a1 & 0x1fff;
	    var ah1 = a1 >>> 13;
	    var a2 = a[2] | 0;
	    var al2 = a2 & 0x1fff;
	    var ah2 = a2 >>> 13;
	    var a3 = a[3] | 0;
	    var al3 = a3 & 0x1fff;
	    var ah3 = a3 >>> 13;
	    var a4 = a[4] | 0;
	    var al4 = a4 & 0x1fff;
	    var ah4 = a4 >>> 13;
	    var a5 = a[5] | 0;
	    var al5 = a5 & 0x1fff;
	    var ah5 = a5 >>> 13;
	    var a6 = a[6] | 0;
	    var al6 = a6 & 0x1fff;
	    var ah6 = a6 >>> 13;
	    var a7 = a[7] | 0;
	    var al7 = a7 & 0x1fff;
	    var ah7 = a7 >>> 13;
	    var a8 = a[8] | 0;
	    var al8 = a8 & 0x1fff;
	    var ah8 = a8 >>> 13;
	    var a9 = a[9] | 0;
	    var al9 = a9 & 0x1fff;
	    var ah9 = a9 >>> 13;
	    var b0 = b[0] | 0;
	    var bl0 = b0 & 0x1fff;
	    var bh0 = b0 >>> 13;
	    var b1 = b[1] | 0;
	    var bl1 = b1 & 0x1fff;
	    var bh1 = b1 >>> 13;
	    var b2 = b[2] | 0;
	    var bl2 = b2 & 0x1fff;
	    var bh2 = b2 >>> 13;
	    var b3 = b[3] | 0;
	    var bl3 = b3 & 0x1fff;
	    var bh3 = b3 >>> 13;
	    var b4 = b[4] | 0;
	    var bl4 = b4 & 0x1fff;
	    var bh4 = b4 >>> 13;
	    var b5 = b[5] | 0;
	    var bl5 = b5 & 0x1fff;
	    var bh5 = b5 >>> 13;
	    var b6 = b[6] | 0;
	    var bl6 = b6 & 0x1fff;
	    var bh6 = b6 >>> 13;
	    var b7 = b[7] | 0;
	    var bl7 = b7 & 0x1fff;
	    var bh7 = b7 >>> 13;
	    var b8 = b[8] | 0;
	    var bl8 = b8 & 0x1fff;
	    var bh8 = b8 >>> 13;
	    var b9 = b[9] | 0;
	    var bl9 = b9 & 0x1fff;
	    var bh9 = b9 >>> 13;

	    out.negative = self.negative ^ num.negative;
	    out.length = 19;
	    /* k = 0 */
	    lo = Math.imul(al0, bl0);
	    mid = Math.imul(al0, bh0);
	    mid = (mid + Math.imul(ah0, bl0)) | 0;
	    hi = Math.imul(ah0, bh0);
	    var w0 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w0 >>> 26)) | 0;
	    w0 &= 0x3ffffff;
	    /* k = 1 */
	    lo = Math.imul(al1, bl0);
	    mid = Math.imul(al1, bh0);
	    mid = (mid + Math.imul(ah1, bl0)) | 0;
	    hi = Math.imul(ah1, bh0);
	    lo = (lo + Math.imul(al0, bl1)) | 0;
	    mid = (mid + Math.imul(al0, bh1)) | 0;
	    mid = (mid + Math.imul(ah0, bl1)) | 0;
	    hi = (hi + Math.imul(ah0, bh1)) | 0;
	    var w1 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w1 >>> 26)) | 0;
	    w1 &= 0x3ffffff;
	    /* k = 2 */
	    lo = Math.imul(al2, bl0);
	    mid = Math.imul(al2, bh0);
	    mid = (mid + Math.imul(ah2, bl0)) | 0;
	    hi = Math.imul(ah2, bh0);
	    lo = (lo + Math.imul(al1, bl1)) | 0;
	    mid = (mid + Math.imul(al1, bh1)) | 0;
	    mid = (mid + Math.imul(ah1, bl1)) | 0;
	    hi = (hi + Math.imul(ah1, bh1)) | 0;
	    lo = (lo + Math.imul(al0, bl2)) | 0;
	    mid = (mid + Math.imul(al0, bh2)) | 0;
	    mid = (mid + Math.imul(ah0, bl2)) | 0;
	    hi = (hi + Math.imul(ah0, bh2)) | 0;
	    var w2 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w2 >>> 26)) | 0;
	    w2 &= 0x3ffffff;
	    /* k = 3 */
	    lo = Math.imul(al3, bl0);
	    mid = Math.imul(al3, bh0);
	    mid = (mid + Math.imul(ah3, bl0)) | 0;
	    hi = Math.imul(ah3, bh0);
	    lo = (lo + Math.imul(al2, bl1)) | 0;
	    mid = (mid + Math.imul(al2, bh1)) | 0;
	    mid = (mid + Math.imul(ah2, bl1)) | 0;
	    hi = (hi + Math.imul(ah2, bh1)) | 0;
	    lo = (lo + Math.imul(al1, bl2)) | 0;
	    mid = (mid + Math.imul(al1, bh2)) | 0;
	    mid = (mid + Math.imul(ah1, bl2)) | 0;
	    hi = (hi + Math.imul(ah1, bh2)) | 0;
	    lo = (lo + Math.imul(al0, bl3)) | 0;
	    mid = (mid + Math.imul(al0, bh3)) | 0;
	    mid = (mid + Math.imul(ah0, bl3)) | 0;
	    hi = (hi + Math.imul(ah0, bh3)) | 0;
	    var w3 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w3 >>> 26)) | 0;
	    w3 &= 0x3ffffff;
	    /* k = 4 */
	    lo = Math.imul(al4, bl0);
	    mid = Math.imul(al4, bh0);
	    mid = (mid + Math.imul(ah4, bl0)) | 0;
	    hi = Math.imul(ah4, bh0);
	    lo = (lo + Math.imul(al3, bl1)) | 0;
	    mid = (mid + Math.imul(al3, bh1)) | 0;
	    mid = (mid + Math.imul(ah3, bl1)) | 0;
	    hi = (hi + Math.imul(ah3, bh1)) | 0;
	    lo = (lo + Math.imul(al2, bl2)) | 0;
	    mid = (mid + Math.imul(al2, bh2)) | 0;
	    mid = (mid + Math.imul(ah2, bl2)) | 0;
	    hi = (hi + Math.imul(ah2, bh2)) | 0;
	    lo = (lo + Math.imul(al1, bl3)) | 0;
	    mid = (mid + Math.imul(al1, bh3)) | 0;
	    mid = (mid + Math.imul(ah1, bl3)) | 0;
	    hi = (hi + Math.imul(ah1, bh3)) | 0;
	    lo = (lo + Math.imul(al0, bl4)) | 0;
	    mid = (mid + Math.imul(al0, bh4)) | 0;
	    mid = (mid + Math.imul(ah0, bl4)) | 0;
	    hi = (hi + Math.imul(ah0, bh4)) | 0;
	    var w4 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w4 >>> 26)) | 0;
	    w4 &= 0x3ffffff;
	    /* k = 5 */
	    lo = Math.imul(al5, bl0);
	    mid = Math.imul(al5, bh0);
	    mid = (mid + Math.imul(ah5, bl0)) | 0;
	    hi = Math.imul(ah5, bh0);
	    lo = (lo + Math.imul(al4, bl1)) | 0;
	    mid = (mid + Math.imul(al4, bh1)) | 0;
	    mid = (mid + Math.imul(ah4, bl1)) | 0;
	    hi = (hi + Math.imul(ah4, bh1)) | 0;
	    lo = (lo + Math.imul(al3, bl2)) | 0;
	    mid = (mid + Math.imul(al3, bh2)) | 0;
	    mid = (mid + Math.imul(ah3, bl2)) | 0;
	    hi = (hi + Math.imul(ah3, bh2)) | 0;
	    lo = (lo + Math.imul(al2, bl3)) | 0;
	    mid = (mid + Math.imul(al2, bh3)) | 0;
	    mid = (mid + Math.imul(ah2, bl3)) | 0;
	    hi = (hi + Math.imul(ah2, bh3)) | 0;
	    lo = (lo + Math.imul(al1, bl4)) | 0;
	    mid = (mid + Math.imul(al1, bh4)) | 0;
	    mid = (mid + Math.imul(ah1, bl4)) | 0;
	    hi = (hi + Math.imul(ah1, bh4)) | 0;
	    lo = (lo + Math.imul(al0, bl5)) | 0;
	    mid = (mid + Math.imul(al0, bh5)) | 0;
	    mid = (mid + Math.imul(ah0, bl5)) | 0;
	    hi = (hi + Math.imul(ah0, bh5)) | 0;
	    var w5 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w5 >>> 26)) | 0;
	    w5 &= 0x3ffffff;
	    /* k = 6 */
	    lo = Math.imul(al6, bl0);
	    mid = Math.imul(al6, bh0);
	    mid = (mid + Math.imul(ah6, bl0)) | 0;
	    hi = Math.imul(ah6, bh0);
	    lo = (lo + Math.imul(al5, bl1)) | 0;
	    mid = (mid + Math.imul(al5, bh1)) | 0;
	    mid = (mid + Math.imul(ah5, bl1)) | 0;
	    hi = (hi + Math.imul(ah5, bh1)) | 0;
	    lo = (lo + Math.imul(al4, bl2)) | 0;
	    mid = (mid + Math.imul(al4, bh2)) | 0;
	    mid = (mid + Math.imul(ah4, bl2)) | 0;
	    hi = (hi + Math.imul(ah4, bh2)) | 0;
	    lo = (lo + Math.imul(al3, bl3)) | 0;
	    mid = (mid + Math.imul(al3, bh3)) | 0;
	    mid = (mid + Math.imul(ah3, bl3)) | 0;
	    hi = (hi + Math.imul(ah3, bh3)) | 0;
	    lo = (lo + Math.imul(al2, bl4)) | 0;
	    mid = (mid + Math.imul(al2, bh4)) | 0;
	    mid = (mid + Math.imul(ah2, bl4)) | 0;
	    hi = (hi + Math.imul(ah2, bh4)) | 0;
	    lo = (lo + Math.imul(al1, bl5)) | 0;
	    mid = (mid + Math.imul(al1, bh5)) | 0;
	    mid = (mid + Math.imul(ah1, bl5)) | 0;
	    hi = (hi + Math.imul(ah1, bh5)) | 0;
	    lo = (lo + Math.imul(al0, bl6)) | 0;
	    mid = (mid + Math.imul(al0, bh6)) | 0;
	    mid = (mid + Math.imul(ah0, bl6)) | 0;
	    hi = (hi + Math.imul(ah0, bh6)) | 0;
	    var w6 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w6 >>> 26)) | 0;
	    w6 &= 0x3ffffff;
	    /* k = 7 */
	    lo = Math.imul(al7, bl0);
	    mid = Math.imul(al7, bh0);
	    mid = (mid + Math.imul(ah7, bl0)) | 0;
	    hi = Math.imul(ah7, bh0);
	    lo = (lo + Math.imul(al6, bl1)) | 0;
	    mid = (mid + Math.imul(al6, bh1)) | 0;
	    mid = (mid + Math.imul(ah6, bl1)) | 0;
	    hi = (hi + Math.imul(ah6, bh1)) | 0;
	    lo = (lo + Math.imul(al5, bl2)) | 0;
	    mid = (mid + Math.imul(al5, bh2)) | 0;
	    mid = (mid + Math.imul(ah5, bl2)) | 0;
	    hi = (hi + Math.imul(ah5, bh2)) | 0;
	    lo = (lo + Math.imul(al4, bl3)) | 0;
	    mid = (mid + Math.imul(al4, bh3)) | 0;
	    mid = (mid + Math.imul(ah4, bl3)) | 0;
	    hi = (hi + Math.imul(ah4, bh3)) | 0;
	    lo = (lo + Math.imul(al3, bl4)) | 0;
	    mid = (mid + Math.imul(al3, bh4)) | 0;
	    mid = (mid + Math.imul(ah3, bl4)) | 0;
	    hi = (hi + Math.imul(ah3, bh4)) | 0;
	    lo = (lo + Math.imul(al2, bl5)) | 0;
	    mid = (mid + Math.imul(al2, bh5)) | 0;
	    mid = (mid + Math.imul(ah2, bl5)) | 0;
	    hi = (hi + Math.imul(ah2, bh5)) | 0;
	    lo = (lo + Math.imul(al1, bl6)) | 0;
	    mid = (mid + Math.imul(al1, bh6)) | 0;
	    mid = (mid + Math.imul(ah1, bl6)) | 0;
	    hi = (hi + Math.imul(ah1, bh6)) | 0;
	    lo = (lo + Math.imul(al0, bl7)) | 0;
	    mid = (mid + Math.imul(al0, bh7)) | 0;
	    mid = (mid + Math.imul(ah0, bl7)) | 0;
	    hi = (hi + Math.imul(ah0, bh7)) | 0;
	    var w7 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w7 >>> 26)) | 0;
	    w7 &= 0x3ffffff;
	    /* k = 8 */
	    lo = Math.imul(al8, bl0);
	    mid = Math.imul(al8, bh0);
	    mid = (mid + Math.imul(ah8, bl0)) | 0;
	    hi = Math.imul(ah8, bh0);
	    lo = (lo + Math.imul(al7, bl1)) | 0;
	    mid = (mid + Math.imul(al7, bh1)) | 0;
	    mid = (mid + Math.imul(ah7, bl1)) | 0;
	    hi = (hi + Math.imul(ah7, bh1)) | 0;
	    lo = (lo + Math.imul(al6, bl2)) | 0;
	    mid = (mid + Math.imul(al6, bh2)) | 0;
	    mid = (mid + Math.imul(ah6, bl2)) | 0;
	    hi = (hi + Math.imul(ah6, bh2)) | 0;
	    lo = (lo + Math.imul(al5, bl3)) | 0;
	    mid = (mid + Math.imul(al5, bh3)) | 0;
	    mid = (mid + Math.imul(ah5, bl3)) | 0;
	    hi = (hi + Math.imul(ah5, bh3)) | 0;
	    lo = (lo + Math.imul(al4, bl4)) | 0;
	    mid = (mid + Math.imul(al4, bh4)) | 0;
	    mid = (mid + Math.imul(ah4, bl4)) | 0;
	    hi = (hi + Math.imul(ah4, bh4)) | 0;
	    lo = (lo + Math.imul(al3, bl5)) | 0;
	    mid = (mid + Math.imul(al3, bh5)) | 0;
	    mid = (mid + Math.imul(ah3, bl5)) | 0;
	    hi = (hi + Math.imul(ah3, bh5)) | 0;
	    lo = (lo + Math.imul(al2, bl6)) | 0;
	    mid = (mid + Math.imul(al2, bh6)) | 0;
	    mid = (mid + Math.imul(ah2, bl6)) | 0;
	    hi = (hi + Math.imul(ah2, bh6)) | 0;
	    lo = (lo + Math.imul(al1, bl7)) | 0;
	    mid = (mid + Math.imul(al1, bh7)) | 0;
	    mid = (mid + Math.imul(ah1, bl7)) | 0;
	    hi = (hi + Math.imul(ah1, bh7)) | 0;
	    lo = (lo + Math.imul(al0, bl8)) | 0;
	    mid = (mid + Math.imul(al0, bh8)) | 0;
	    mid = (mid + Math.imul(ah0, bl8)) | 0;
	    hi = (hi + Math.imul(ah0, bh8)) | 0;
	    var w8 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w8 >>> 26)) | 0;
	    w8 &= 0x3ffffff;
	    /* k = 9 */
	    lo = Math.imul(al9, bl0);
	    mid = Math.imul(al9, bh0);
	    mid = (mid + Math.imul(ah9, bl0)) | 0;
	    hi = Math.imul(ah9, bh0);
	    lo = (lo + Math.imul(al8, bl1)) | 0;
	    mid = (mid + Math.imul(al8, bh1)) | 0;
	    mid = (mid + Math.imul(ah8, bl1)) | 0;
	    hi = (hi + Math.imul(ah8, bh1)) | 0;
	    lo = (lo + Math.imul(al7, bl2)) | 0;
	    mid = (mid + Math.imul(al7, bh2)) | 0;
	    mid = (mid + Math.imul(ah7, bl2)) | 0;
	    hi = (hi + Math.imul(ah7, bh2)) | 0;
	    lo = (lo + Math.imul(al6, bl3)) | 0;
	    mid = (mid + Math.imul(al6, bh3)) | 0;
	    mid = (mid + Math.imul(ah6, bl3)) | 0;
	    hi = (hi + Math.imul(ah6, bh3)) | 0;
	    lo = (lo + Math.imul(al5, bl4)) | 0;
	    mid = (mid + Math.imul(al5, bh4)) | 0;
	    mid = (mid + Math.imul(ah5, bl4)) | 0;
	    hi = (hi + Math.imul(ah5, bh4)) | 0;
	    lo = (lo + Math.imul(al4, bl5)) | 0;
	    mid = (mid + Math.imul(al4, bh5)) | 0;
	    mid = (mid + Math.imul(ah4, bl5)) | 0;
	    hi = (hi + Math.imul(ah4, bh5)) | 0;
	    lo = (lo + Math.imul(al3, bl6)) | 0;
	    mid = (mid + Math.imul(al3, bh6)) | 0;
	    mid = (mid + Math.imul(ah3, bl6)) | 0;
	    hi = (hi + Math.imul(ah3, bh6)) | 0;
	    lo = (lo + Math.imul(al2, bl7)) | 0;
	    mid = (mid + Math.imul(al2, bh7)) | 0;
	    mid = (mid + Math.imul(ah2, bl7)) | 0;
	    hi = (hi + Math.imul(ah2, bh7)) | 0;
	    lo = (lo + Math.imul(al1, bl8)) | 0;
	    mid = (mid + Math.imul(al1, bh8)) | 0;
	    mid = (mid + Math.imul(ah1, bl8)) | 0;
	    hi = (hi + Math.imul(ah1, bh8)) | 0;
	    lo = (lo + Math.imul(al0, bl9)) | 0;
	    mid = (mid + Math.imul(al0, bh9)) | 0;
	    mid = (mid + Math.imul(ah0, bl9)) | 0;
	    hi = (hi + Math.imul(ah0, bh9)) | 0;
	    var w9 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w9 >>> 26)) | 0;
	    w9 &= 0x3ffffff;
	    /* k = 10 */
	    lo = Math.imul(al9, bl1);
	    mid = Math.imul(al9, bh1);
	    mid = (mid + Math.imul(ah9, bl1)) | 0;
	    hi = Math.imul(ah9, bh1);
	    lo = (lo + Math.imul(al8, bl2)) | 0;
	    mid = (mid + Math.imul(al8, bh2)) | 0;
	    mid = (mid + Math.imul(ah8, bl2)) | 0;
	    hi = (hi + Math.imul(ah8, bh2)) | 0;
	    lo = (lo + Math.imul(al7, bl3)) | 0;
	    mid = (mid + Math.imul(al7, bh3)) | 0;
	    mid = (mid + Math.imul(ah7, bl3)) | 0;
	    hi = (hi + Math.imul(ah7, bh3)) | 0;
	    lo = (lo + Math.imul(al6, bl4)) | 0;
	    mid = (mid + Math.imul(al6, bh4)) | 0;
	    mid = (mid + Math.imul(ah6, bl4)) | 0;
	    hi = (hi + Math.imul(ah6, bh4)) | 0;
	    lo = (lo + Math.imul(al5, bl5)) | 0;
	    mid = (mid + Math.imul(al5, bh5)) | 0;
	    mid = (mid + Math.imul(ah5, bl5)) | 0;
	    hi = (hi + Math.imul(ah5, bh5)) | 0;
	    lo = (lo + Math.imul(al4, bl6)) | 0;
	    mid = (mid + Math.imul(al4, bh6)) | 0;
	    mid = (mid + Math.imul(ah4, bl6)) | 0;
	    hi = (hi + Math.imul(ah4, bh6)) | 0;
	    lo = (lo + Math.imul(al3, bl7)) | 0;
	    mid = (mid + Math.imul(al3, bh7)) | 0;
	    mid = (mid + Math.imul(ah3, bl7)) | 0;
	    hi = (hi + Math.imul(ah3, bh7)) | 0;
	    lo = (lo + Math.imul(al2, bl8)) | 0;
	    mid = (mid + Math.imul(al2, bh8)) | 0;
	    mid = (mid + Math.imul(ah2, bl8)) | 0;
	    hi = (hi + Math.imul(ah2, bh8)) | 0;
	    lo = (lo + Math.imul(al1, bl9)) | 0;
	    mid = (mid + Math.imul(al1, bh9)) | 0;
	    mid = (mid + Math.imul(ah1, bl9)) | 0;
	    hi = (hi + Math.imul(ah1, bh9)) | 0;
	    var w10 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w10 >>> 26)) | 0;
	    w10 &= 0x3ffffff;
	    /* k = 11 */
	    lo = Math.imul(al9, bl2);
	    mid = Math.imul(al9, bh2);
	    mid = (mid + Math.imul(ah9, bl2)) | 0;
	    hi = Math.imul(ah9, bh2);
	    lo = (lo + Math.imul(al8, bl3)) | 0;
	    mid = (mid + Math.imul(al8, bh3)) | 0;
	    mid = (mid + Math.imul(ah8, bl3)) | 0;
	    hi = (hi + Math.imul(ah8, bh3)) | 0;
	    lo = (lo + Math.imul(al7, bl4)) | 0;
	    mid = (mid + Math.imul(al7, bh4)) | 0;
	    mid = (mid + Math.imul(ah7, bl4)) | 0;
	    hi = (hi + Math.imul(ah7, bh4)) | 0;
	    lo = (lo + Math.imul(al6, bl5)) | 0;
	    mid = (mid + Math.imul(al6, bh5)) | 0;
	    mid = (mid + Math.imul(ah6, bl5)) | 0;
	    hi = (hi + Math.imul(ah6, bh5)) | 0;
	    lo = (lo + Math.imul(al5, bl6)) | 0;
	    mid = (mid + Math.imul(al5, bh6)) | 0;
	    mid = (mid + Math.imul(ah5, bl6)) | 0;
	    hi = (hi + Math.imul(ah5, bh6)) | 0;
	    lo = (lo + Math.imul(al4, bl7)) | 0;
	    mid = (mid + Math.imul(al4, bh7)) | 0;
	    mid = (mid + Math.imul(ah4, bl7)) | 0;
	    hi = (hi + Math.imul(ah4, bh7)) | 0;
	    lo = (lo + Math.imul(al3, bl8)) | 0;
	    mid = (mid + Math.imul(al3, bh8)) | 0;
	    mid = (mid + Math.imul(ah3, bl8)) | 0;
	    hi = (hi + Math.imul(ah3, bh8)) | 0;
	    lo = (lo + Math.imul(al2, bl9)) | 0;
	    mid = (mid + Math.imul(al2, bh9)) | 0;
	    mid = (mid + Math.imul(ah2, bl9)) | 0;
	    hi = (hi + Math.imul(ah2, bh9)) | 0;
	    var w11 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w11 >>> 26)) | 0;
	    w11 &= 0x3ffffff;
	    /* k = 12 */
	    lo = Math.imul(al9, bl3);
	    mid = Math.imul(al9, bh3);
	    mid = (mid + Math.imul(ah9, bl3)) | 0;
	    hi = Math.imul(ah9, bh3);
	    lo = (lo + Math.imul(al8, bl4)) | 0;
	    mid = (mid + Math.imul(al8, bh4)) | 0;
	    mid = (mid + Math.imul(ah8, bl4)) | 0;
	    hi = (hi + Math.imul(ah8, bh4)) | 0;
	    lo = (lo + Math.imul(al7, bl5)) | 0;
	    mid = (mid + Math.imul(al7, bh5)) | 0;
	    mid = (mid + Math.imul(ah7, bl5)) | 0;
	    hi = (hi + Math.imul(ah7, bh5)) | 0;
	    lo = (lo + Math.imul(al6, bl6)) | 0;
	    mid = (mid + Math.imul(al6, bh6)) | 0;
	    mid = (mid + Math.imul(ah6, bl6)) | 0;
	    hi = (hi + Math.imul(ah6, bh6)) | 0;
	    lo = (lo + Math.imul(al5, bl7)) | 0;
	    mid = (mid + Math.imul(al5, bh7)) | 0;
	    mid = (mid + Math.imul(ah5, bl7)) | 0;
	    hi = (hi + Math.imul(ah5, bh7)) | 0;
	    lo = (lo + Math.imul(al4, bl8)) | 0;
	    mid = (mid + Math.imul(al4, bh8)) | 0;
	    mid = (mid + Math.imul(ah4, bl8)) | 0;
	    hi = (hi + Math.imul(ah4, bh8)) | 0;
	    lo = (lo + Math.imul(al3, bl9)) | 0;
	    mid = (mid + Math.imul(al3, bh9)) | 0;
	    mid = (mid + Math.imul(ah3, bl9)) | 0;
	    hi = (hi + Math.imul(ah3, bh9)) | 0;
	    var w12 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w12 >>> 26)) | 0;
	    w12 &= 0x3ffffff;
	    /* k = 13 */
	    lo = Math.imul(al9, bl4);
	    mid = Math.imul(al9, bh4);
	    mid = (mid + Math.imul(ah9, bl4)) | 0;
	    hi = Math.imul(ah9, bh4);
	    lo = (lo + Math.imul(al8, bl5)) | 0;
	    mid = (mid + Math.imul(al8, bh5)) | 0;
	    mid = (mid + Math.imul(ah8, bl5)) | 0;
	    hi = (hi + Math.imul(ah8, bh5)) | 0;
	    lo = (lo + Math.imul(al7, bl6)) | 0;
	    mid = (mid + Math.imul(al7, bh6)) | 0;
	    mid = (mid + Math.imul(ah7, bl6)) | 0;
	    hi = (hi + Math.imul(ah7, bh6)) | 0;
	    lo = (lo + Math.imul(al6, bl7)) | 0;
	    mid = (mid + Math.imul(al6, bh7)) | 0;
	    mid = (mid + Math.imul(ah6, bl7)) | 0;
	    hi = (hi + Math.imul(ah6, bh7)) | 0;
	    lo = (lo + Math.imul(al5, bl8)) | 0;
	    mid = (mid + Math.imul(al5, bh8)) | 0;
	    mid = (mid + Math.imul(ah5, bl8)) | 0;
	    hi = (hi + Math.imul(ah5, bh8)) | 0;
	    lo = (lo + Math.imul(al4, bl9)) | 0;
	    mid = (mid + Math.imul(al4, bh9)) | 0;
	    mid = (mid + Math.imul(ah4, bl9)) | 0;
	    hi = (hi + Math.imul(ah4, bh9)) | 0;
	    var w13 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w13 >>> 26)) | 0;
	    w13 &= 0x3ffffff;
	    /* k = 14 */
	    lo = Math.imul(al9, bl5);
	    mid = Math.imul(al9, bh5);
	    mid = (mid + Math.imul(ah9, bl5)) | 0;
	    hi = Math.imul(ah9, bh5);
	    lo = (lo + Math.imul(al8, bl6)) | 0;
	    mid = (mid + Math.imul(al8, bh6)) | 0;
	    mid = (mid + Math.imul(ah8, bl6)) | 0;
	    hi = (hi + Math.imul(ah8, bh6)) | 0;
	    lo = (lo + Math.imul(al7, bl7)) | 0;
	    mid = (mid + Math.imul(al7, bh7)) | 0;
	    mid = (mid + Math.imul(ah7, bl7)) | 0;
	    hi = (hi + Math.imul(ah7, bh7)) | 0;
	    lo = (lo + Math.imul(al6, bl8)) | 0;
	    mid = (mid + Math.imul(al6, bh8)) | 0;
	    mid = (mid + Math.imul(ah6, bl8)) | 0;
	    hi = (hi + Math.imul(ah6, bh8)) | 0;
	    lo = (lo + Math.imul(al5, bl9)) | 0;
	    mid = (mid + Math.imul(al5, bh9)) | 0;
	    mid = (mid + Math.imul(ah5, bl9)) | 0;
	    hi = (hi + Math.imul(ah5, bh9)) | 0;
	    var w14 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w14 >>> 26)) | 0;
	    w14 &= 0x3ffffff;
	    /* k = 15 */
	    lo = Math.imul(al9, bl6);
	    mid = Math.imul(al9, bh6);
	    mid = (mid + Math.imul(ah9, bl6)) | 0;
	    hi = Math.imul(ah9, bh6);
	    lo = (lo + Math.imul(al8, bl7)) | 0;
	    mid = (mid + Math.imul(al8, bh7)) | 0;
	    mid = (mid + Math.imul(ah8, bl7)) | 0;
	    hi = (hi + Math.imul(ah8, bh7)) | 0;
	    lo = (lo + Math.imul(al7, bl8)) | 0;
	    mid = (mid + Math.imul(al7, bh8)) | 0;
	    mid = (mid + Math.imul(ah7, bl8)) | 0;
	    hi = (hi + Math.imul(ah7, bh8)) | 0;
	    lo = (lo + Math.imul(al6, bl9)) | 0;
	    mid = (mid + Math.imul(al6, bh9)) | 0;
	    mid = (mid + Math.imul(ah6, bl9)) | 0;
	    hi = (hi + Math.imul(ah6, bh9)) | 0;
	    var w15 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w15 >>> 26)) | 0;
	    w15 &= 0x3ffffff;
	    /* k = 16 */
	    lo = Math.imul(al9, bl7);
	    mid = Math.imul(al9, bh7);
	    mid = (mid + Math.imul(ah9, bl7)) | 0;
	    hi = Math.imul(ah9, bh7);
	    lo = (lo + Math.imul(al8, bl8)) | 0;
	    mid = (mid + Math.imul(al8, bh8)) | 0;
	    mid = (mid + Math.imul(ah8, bl8)) | 0;
	    hi = (hi + Math.imul(ah8, bh8)) | 0;
	    lo = (lo + Math.imul(al7, bl9)) | 0;
	    mid = (mid + Math.imul(al7, bh9)) | 0;
	    mid = (mid + Math.imul(ah7, bl9)) | 0;
	    hi = (hi + Math.imul(ah7, bh9)) | 0;
	    var w16 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w16 >>> 26)) | 0;
	    w16 &= 0x3ffffff;
	    /* k = 17 */
	    lo = Math.imul(al9, bl8);
	    mid = Math.imul(al9, bh8);
	    mid = (mid + Math.imul(ah9, bl8)) | 0;
	    hi = Math.imul(ah9, bh8);
	    lo = (lo + Math.imul(al8, bl9)) | 0;
	    mid = (mid + Math.imul(al8, bh9)) | 0;
	    mid = (mid + Math.imul(ah8, bl9)) | 0;
	    hi = (hi + Math.imul(ah8, bh9)) | 0;
	    var w17 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w17 >>> 26)) | 0;
	    w17 &= 0x3ffffff;
	    /* k = 18 */
	    lo = Math.imul(al9, bl9);
	    mid = Math.imul(al9, bh9);
	    mid = (mid + Math.imul(ah9, bl9)) | 0;
	    hi = Math.imul(ah9, bh9);
	    var w18 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
	    c = (((hi + (mid >>> 13)) | 0) + (w18 >>> 26)) | 0;
	    w18 &= 0x3ffffff;
	    o[0] = w0;
	    o[1] = w1;
	    o[2] = w2;
	    o[3] = w3;
	    o[4] = w4;
	    o[5] = w5;
	    o[6] = w6;
	    o[7] = w7;
	    o[8] = w8;
	    o[9] = w9;
	    o[10] = w10;
	    o[11] = w11;
	    o[12] = w12;
	    o[13] = w13;
	    o[14] = w14;
	    o[15] = w15;
	    o[16] = w16;
	    o[17] = w17;
	    o[18] = w18;
	    if (c !== 0) {
	      o[19] = c;
	      out.length++;
	    }
	    return out;
	  };

	  // Polyfill comb
	  if (!Math.imul) {
	    comb10MulTo = smallMulTo;
	  }

	  function bigMulTo (self, num, out) {
	    out.negative = num.negative ^ self.negative;
	    out.length = self.length + num.length;

	    var carry = 0;
	    var hncarry = 0;
	    for (var k = 0; k < out.length - 1; k++) {
	      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
	      // note that ncarry could be >= 0x3ffffff
	      var ncarry = hncarry;
	      hncarry = 0;
	      var rword = carry & 0x3ffffff;
	      var maxJ = Math.min(k, num.length - 1);
	      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
	        var i = k - j;
	        var a = self.words[i] | 0;
	        var b = num.words[j] | 0;
	        var r = a * b;

	        var lo = r & 0x3ffffff;
	        ncarry = (ncarry + ((r / 0x4000000) | 0)) | 0;
	        lo = (lo + rword) | 0;
	        rword = lo & 0x3ffffff;
	        ncarry = (ncarry + (lo >>> 26)) | 0;

	        hncarry += ncarry >>> 26;
	        ncarry &= 0x3ffffff;
	      }
	      out.words[k] = rword;
	      carry = ncarry;
	      ncarry = hncarry;
	    }
	    if (carry !== 0) {
	      out.words[k] = carry;
	    } else {
	      out.length--;
	    }

	    return out._strip();
	  }

	  function jumboMulTo (self, num, out) {
	    // Temporary disable, see https://github.com/indutny/bn.js/issues/211
	    // var fftm = new FFTM();
	    // return fftm.mulp(self, num, out);
	    return bigMulTo(self, num, out);
	  }

	  BN.prototype.mulTo = function mulTo (num, out) {
	    var res;
	    var len = this.length + num.length;
	    if (this.length === 10 && num.length === 10) {
	      res = comb10MulTo(this, num, out);
	    } else if (len < 63) {
	      res = smallMulTo(this, num, out);
	    } else if (len < 1024) {
	      res = bigMulTo(this, num, out);
	    } else {
	      res = jumboMulTo(this, num, out);
	    }

	    return res;
	  };

	  // Multiply `this` by `num`
	  BN.prototype.mul = function mul (num) {
	    var out = new BN(null);
	    out.words = new Array(this.length + num.length);
	    return this.mulTo(num, out);
	  };

	  // Multiply employing FFT
	  BN.prototype.mulf = function mulf (num) {
	    var out = new BN(null);
	    out.words = new Array(this.length + num.length);
	    return jumboMulTo(this, num, out);
	  };

	  // In-place Multiplication
	  BN.prototype.imul = function imul (num) {
	    return this.clone().mulTo(num, this);
	  };

	  BN.prototype.imuln = function imuln (num) {
	    var isNegNum = num < 0;
	    if (isNegNum) num = -num;

	    assert(typeof num === 'number');
	    assert(num < 0x4000000);

	    // Carry
	    var carry = 0;
	    for (var i = 0; i < this.length; i++) {
	      var w = (this.words[i] | 0) * num;
	      var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
	      carry >>= 26;
	      carry += (w / 0x4000000) | 0;
	      // NOTE: lo is 27bit maximum
	      carry += lo >>> 26;
	      this.words[i] = lo & 0x3ffffff;
	    }

	    if (carry !== 0) {
	      this.words[i] = carry;
	      this.length++;
	    }

	    return isNegNum ? this.ineg() : this;
	  };

	  BN.prototype.muln = function muln (num) {
	    return this.clone().imuln(num);
	  };

	  // `this` * `this`
	  BN.prototype.sqr = function sqr () {
	    return this.mul(this);
	  };

	  // `this` * `this` in-place
	  BN.prototype.isqr = function isqr () {
	    return this.imul(this.clone());
	  };

	  // Math.pow(`this`, `num`)
	  BN.prototype.pow = function pow (num) {
	    var w = toBitArray(num);
	    if (w.length === 0) return new BN(1);

	    // Skip leading zeroes
	    var res = this;
	    for (var i = 0; i < w.length; i++, res = res.sqr()) {
	      if (w[i] !== 0) break;
	    }

	    if (++i < w.length) {
	      for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
	        if (w[i] === 0) continue;

	        res = res.mul(q);
	      }
	    }

	    return res;
	  };

	  // Shift-left in-place
	  BN.prototype.iushln = function iushln (bits) {
	    assert(typeof bits === 'number' && bits >= 0);
	    var r = bits % 26;
	    var s = (bits - r) / 26;
	    var carryMask = (0x3ffffff >>> (26 - r)) << (26 - r);
	    var i;

	    if (r !== 0) {
	      var carry = 0;

	      for (i = 0; i < this.length; i++) {
	        var newCarry = this.words[i] & carryMask;
	        var c = ((this.words[i] | 0) - newCarry) << r;
	        this.words[i] = c | carry;
	        carry = newCarry >>> (26 - r);
	      }

	      if (carry) {
	        this.words[i] = carry;
	        this.length++;
	      }
	    }

	    if (s !== 0) {
	      for (i = this.length - 1; i >= 0; i--) {
	        this.words[i + s] = this.words[i];
	      }

	      for (i = 0; i < s; i++) {
	        this.words[i] = 0;
	      }

	      this.length += s;
	    }

	    return this._strip();
	  };

	  BN.prototype.ishln = function ishln (bits) {
	    // TODO(indutny): implement me
	    assert(this.negative === 0);
	    return this.iushln(bits);
	  };

	  // Shift-right in-place
	  // NOTE: `hint` is a lowest bit before trailing zeroes
	  // NOTE: if `extended` is present - it will be filled with destroyed bits
	  BN.prototype.iushrn = function iushrn (bits, hint, extended) {
	    assert(typeof bits === 'number' && bits >= 0);
	    var h;
	    if (hint) {
	      h = (hint - (hint % 26)) / 26;
	    } else {
	      h = 0;
	    }

	    var r = bits % 26;
	    var s = Math.min((bits - r) / 26, this.length);
	    var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
	    var maskedWords = extended;

	    h -= s;
	    h = Math.max(0, h);

	    // Extended mode, copy masked part
	    if (maskedWords) {
	      for (var i = 0; i < s; i++) {
	        maskedWords.words[i] = this.words[i];
	      }
	      maskedWords.length = s;
	    }

	    if (s === 0) ; else if (this.length > s) {
	      this.length -= s;
	      for (i = 0; i < this.length; i++) {
	        this.words[i] = this.words[i + s];
	      }
	    } else {
	      this.words[0] = 0;
	      this.length = 1;
	    }

	    var carry = 0;
	    for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
	      var word = this.words[i] | 0;
	      this.words[i] = (carry << (26 - r)) | (word >>> r);
	      carry = word & mask;
	    }

	    // Push carried bits as a mask
	    if (maskedWords && carry !== 0) {
	      maskedWords.words[maskedWords.length++] = carry;
	    }

	    if (this.length === 0) {
	      this.words[0] = 0;
	      this.length = 1;
	    }

	    return this._strip();
	  };

	  BN.prototype.ishrn = function ishrn (bits, hint, extended) {
	    // TODO(indutny): implement me
	    assert(this.negative === 0);
	    return this.iushrn(bits, hint, extended);
	  };

	  // Shift-left
	  BN.prototype.shln = function shln (bits) {
	    return this.clone().ishln(bits);
	  };

	  BN.prototype.ushln = function ushln (bits) {
	    return this.clone().iushln(bits);
	  };

	  // Shift-right
	  BN.prototype.shrn = function shrn (bits) {
	    return this.clone().ishrn(bits);
	  };

	  BN.prototype.ushrn = function ushrn (bits) {
	    return this.clone().iushrn(bits);
	  };

	  // Test if n bit is set
	  BN.prototype.testn = function testn (bit) {
	    assert(typeof bit === 'number' && bit >= 0);
	    var r = bit % 26;
	    var s = (bit - r) / 26;
	    var q = 1 << r;

	    // Fast case: bit is much higher than all existing words
	    if (this.length <= s) return false;

	    // Check bit and return
	    var w = this.words[s];

	    return !!(w & q);
	  };

	  // Return only lowers bits of number (in-place)
	  BN.prototype.imaskn = function imaskn (bits) {
	    assert(typeof bits === 'number' && bits >= 0);
	    var r = bits % 26;
	    var s = (bits - r) / 26;

	    assert(this.negative === 0, 'imaskn works only with positive numbers');

	    if (this.length <= s) {
	      return this;
	    }

	    if (r !== 0) {
	      s++;
	    }
	    this.length = Math.min(s, this.length);

	    if (r !== 0) {
	      var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
	      this.words[this.length - 1] &= mask;
	    }

	    return this._strip();
	  };

	  // Return only lowers bits of number
	  BN.prototype.maskn = function maskn (bits) {
	    return this.clone().imaskn(bits);
	  };

	  // Add plain number `num` to `this`
	  BN.prototype.iaddn = function iaddn (num) {
	    assert(typeof num === 'number');
	    assert(num < 0x4000000);
	    if (num < 0) return this.isubn(-num);

	    // Possible sign change
	    if (this.negative !== 0) {
	      if (this.length === 1 && (this.words[0] | 0) <= num) {
	        this.words[0] = num - (this.words[0] | 0);
	        this.negative = 0;
	        return this;
	      }

	      this.negative = 0;
	      this.isubn(num);
	      this.negative = 1;
	      return this;
	    }

	    // Add without checks
	    return this._iaddn(num);
	  };

	  BN.prototype._iaddn = function _iaddn (num) {
	    this.words[0] += num;

	    // Carry
	    for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
	      this.words[i] -= 0x4000000;
	      if (i === this.length - 1) {
	        this.words[i + 1] = 1;
	      } else {
	        this.words[i + 1]++;
	      }
	    }
	    this.length = Math.max(this.length, i + 1);

	    return this;
	  };

	  // Subtract plain number `num` from `this`
	  BN.prototype.isubn = function isubn (num) {
	    assert(typeof num === 'number');
	    assert(num < 0x4000000);
	    if (num < 0) return this.iaddn(-num);

	    if (this.negative !== 0) {
	      this.negative = 0;
	      this.iaddn(num);
	      this.negative = 1;
	      return this;
	    }

	    this.words[0] -= num;

	    if (this.length === 1 && this.words[0] < 0) {
	      this.words[0] = -this.words[0];
	      this.negative = 1;
	    } else {
	      // Carry
	      for (var i = 0; i < this.length && this.words[i] < 0; i++) {
	        this.words[i] += 0x4000000;
	        this.words[i + 1] -= 1;
	      }
	    }

	    return this._strip();
	  };

	  BN.prototype.addn = function addn (num) {
	    return this.clone().iaddn(num);
	  };

	  BN.prototype.subn = function subn (num) {
	    return this.clone().isubn(num);
	  };

	  BN.prototype.iabs = function iabs () {
	    this.negative = 0;

	    return this;
	  };

	  BN.prototype.abs = function abs () {
	    return this.clone().iabs();
	  };

	  BN.prototype._ishlnsubmul = function _ishlnsubmul (num, mul, shift) {
	    var len = num.length + shift;
	    var i;

	    this._expand(len);

	    var w;
	    var carry = 0;
	    for (i = 0; i < num.length; i++) {
	      w = (this.words[i + shift] | 0) + carry;
	      var right = (num.words[i] | 0) * mul;
	      w -= right & 0x3ffffff;
	      carry = (w >> 26) - ((right / 0x4000000) | 0);
	      this.words[i + shift] = w & 0x3ffffff;
	    }
	    for (; i < this.length - shift; i++) {
	      w = (this.words[i + shift] | 0) + carry;
	      carry = w >> 26;
	      this.words[i + shift] = w & 0x3ffffff;
	    }

	    if (carry === 0) return this._strip();

	    // Subtraction overflow
	    assert(carry === -1);
	    carry = 0;
	    for (i = 0; i < this.length; i++) {
	      w = -(this.words[i] | 0) + carry;
	      carry = w >> 26;
	      this.words[i] = w & 0x3ffffff;
	    }
	    this.negative = 1;

	    return this._strip();
	  };

	  BN.prototype._wordDiv = function _wordDiv (num, mode) {
	    var shift = this.length - num.length;

	    var a = this.clone();
	    var b = num;

	    // Normalize
	    var bhi = b.words[b.length - 1] | 0;
	    var bhiBits = this._countBits(bhi);
	    shift = 26 - bhiBits;
	    if (shift !== 0) {
	      b = b.ushln(shift);
	      a.iushln(shift);
	      bhi = b.words[b.length - 1] | 0;
	    }

	    // Initialize quotient
	    var m = a.length - b.length;
	    var q;

	    if (mode !== 'mod') {
	      q = new BN(null);
	      q.length = m + 1;
	      q.words = new Array(q.length);
	      for (var i = 0; i < q.length; i++) {
	        q.words[i] = 0;
	      }
	    }

	    var diff = a.clone()._ishlnsubmul(b, 1, m);
	    if (diff.negative === 0) {
	      a = diff;
	      if (q) {
	        q.words[m] = 1;
	      }
	    }

	    for (var j = m - 1; j >= 0; j--) {
	      var qj = (a.words[b.length + j] | 0) * 0x4000000 +
	        (a.words[b.length + j - 1] | 0);

	      // NOTE: (qj / bhi) is (0x3ffffff * 0x4000000 + 0x3ffffff) / 0x2000000 max
	      // (0x7ffffff)
	      qj = Math.min((qj / bhi) | 0, 0x3ffffff);

	      a._ishlnsubmul(b, qj, j);
	      while (a.negative !== 0) {
	        qj--;
	        a.negative = 0;
	        a._ishlnsubmul(b, 1, j);
	        if (!a.isZero()) {
	          a.negative ^= 1;
	        }
	      }
	      if (q) {
	        q.words[j] = qj;
	      }
	    }
	    if (q) {
	      q._strip();
	    }
	    a._strip();

	    // Denormalize
	    if (mode !== 'div' && shift !== 0) {
	      a.iushrn(shift);
	    }

	    return {
	      div: q || null,
	      mod: a
	    };
	  };

	  // NOTE: 1) `mode` can be set to `mod` to request mod only,
	  //       to `div` to request div only, or be absent to
	  //       request both div & mod
	  //       2) `positive` is true if unsigned mod is requested
	  BN.prototype.divmod = function divmod (num, mode, positive) {
	    assert(!num.isZero());

	    if (this.isZero()) {
	      return {
	        div: new BN(0),
	        mod: new BN(0)
	      };
	    }

	    var div, mod, res;
	    if (this.negative !== 0 && num.negative === 0) {
	      res = this.neg().divmod(num, mode);

	      if (mode !== 'mod') {
	        div = res.div.neg();
	      }

	      if (mode !== 'div') {
	        mod = res.mod.neg();
	        if (positive && mod.negative !== 0) {
	          mod.iadd(num);
	        }
	      }

	      return {
	        div: div,
	        mod: mod
	      };
	    }

	    if (this.negative === 0 && num.negative !== 0) {
	      res = this.divmod(num.neg(), mode);

	      if (mode !== 'mod') {
	        div = res.div.neg();
	      }

	      return {
	        div: div,
	        mod: res.mod
	      };
	    }

	    if ((this.negative & num.negative) !== 0) {
	      res = this.neg().divmod(num.neg(), mode);

	      if (mode !== 'div') {
	        mod = res.mod.neg();
	        if (positive && mod.negative !== 0) {
	          mod.isub(num);
	        }
	      }

	      return {
	        div: res.div,
	        mod: mod
	      };
	    }

	    // Both numbers are positive at this point

	    // Strip both numbers to approximate shift value
	    if (num.length > this.length || this.cmp(num) < 0) {
	      return {
	        div: new BN(0),
	        mod: this
	      };
	    }

	    // Very short reduction
	    if (num.length === 1) {
	      if (mode === 'div') {
	        return {
	          div: this.divn(num.words[0]),
	          mod: null
	        };
	      }

	      if (mode === 'mod') {
	        return {
	          div: null,
	          mod: new BN(this.modrn(num.words[0]))
	        };
	      }

	      return {
	        div: this.divn(num.words[0]),
	        mod: new BN(this.modrn(num.words[0]))
	      };
	    }

	    return this._wordDiv(num, mode);
	  };

	  // Find `this` / `num`
	  BN.prototype.div = function div (num) {
	    return this.divmod(num, 'div', false).div;
	  };

	  // Find `this` % `num`
	  BN.prototype.mod = function mod (num) {
	    return this.divmod(num, 'mod', false).mod;
	  };

	  BN.prototype.umod = function umod (num) {
	    return this.divmod(num, 'mod', true).mod;
	  };

	  // Find Round(`this` / `num`)
	  BN.prototype.divRound = function divRound (num) {
	    var dm = this.divmod(num);

	    // Fast case - exact division
	    if (dm.mod.isZero()) return dm.div;

	    var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;

	    var half = num.ushrn(1);
	    var r2 = num.andln(1);
	    var cmp = mod.cmp(half);

	    // Round down
	    if (cmp < 0 || (r2 === 1 && cmp === 0)) return dm.div;

	    // Round up
	    return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
	  };

	  BN.prototype.modrn = function modrn (num) {
	    var isNegNum = num < 0;
	    if (isNegNum) num = -num;

	    assert(num <= 0x3ffffff);
	    var p = (1 << 26) % num;

	    var acc = 0;
	    for (var i = this.length - 1; i >= 0; i--) {
	      acc = (p * acc + (this.words[i] | 0)) % num;
	    }

	    return isNegNum ? -acc : acc;
	  };

	  // WARNING: DEPRECATED
	  BN.prototype.modn = function modn (num) {
	    return this.modrn(num);
	  };

	  // In-place division by number
	  BN.prototype.idivn = function idivn (num) {
	    var isNegNum = num < 0;
	    if (isNegNum) num = -num;

	    assert(num <= 0x3ffffff);

	    var carry = 0;
	    for (var i = this.length - 1; i >= 0; i--) {
	      var w = (this.words[i] | 0) + carry * 0x4000000;
	      this.words[i] = (w / num) | 0;
	      carry = w % num;
	    }

	    this._strip();
	    return isNegNum ? this.ineg() : this;
	  };

	  BN.prototype.divn = function divn (num) {
	    return this.clone().idivn(num);
	  };

	  BN.prototype.egcd = function egcd (p) {
	    assert(p.negative === 0);
	    assert(!p.isZero());

	    var x = this;
	    var y = p.clone();

	    if (x.negative !== 0) {
	      x = x.umod(p);
	    } else {
	      x = x.clone();
	    }

	    // A * x + B * y = x
	    var A = new BN(1);
	    var B = new BN(0);

	    // C * x + D * y = y
	    var C = new BN(0);
	    var D = new BN(1);

	    var g = 0;

	    while (x.isEven() && y.isEven()) {
	      x.iushrn(1);
	      y.iushrn(1);
	      ++g;
	    }

	    var yp = y.clone();
	    var xp = x.clone();

	    while (!x.isZero()) {
	      for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
	      if (i > 0) {
	        x.iushrn(i);
	        while (i-- > 0) {
	          if (A.isOdd() || B.isOdd()) {
	            A.iadd(yp);
	            B.isub(xp);
	          }

	          A.iushrn(1);
	          B.iushrn(1);
	        }
	      }

	      for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
	      if (j > 0) {
	        y.iushrn(j);
	        while (j-- > 0) {
	          if (C.isOdd() || D.isOdd()) {
	            C.iadd(yp);
	            D.isub(xp);
	          }

	          C.iushrn(1);
	          D.iushrn(1);
	        }
	      }

	      if (x.cmp(y) >= 0) {
	        x.isub(y);
	        A.isub(C);
	        B.isub(D);
	      } else {
	        y.isub(x);
	        C.isub(A);
	        D.isub(B);
	      }
	    }

	    return {
	      a: C,
	      b: D,
	      gcd: y.iushln(g)
	    };
	  };

	  // This is reduced incarnation of the binary EEA
	  // above, designated to invert members of the
	  // _prime_ fields F(p) at a maximal speed
	  BN.prototype._invmp = function _invmp (p) {
	    assert(p.negative === 0);
	    assert(!p.isZero());

	    var a = this;
	    var b = p.clone();

	    if (a.negative !== 0) {
	      a = a.umod(p);
	    } else {
	      a = a.clone();
	    }

	    var x1 = new BN(1);
	    var x2 = new BN(0);

	    var delta = b.clone();

	    while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
	      for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
	      if (i > 0) {
	        a.iushrn(i);
	        while (i-- > 0) {
	          if (x1.isOdd()) {
	            x1.iadd(delta);
	          }

	          x1.iushrn(1);
	        }
	      }

	      for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
	      if (j > 0) {
	        b.iushrn(j);
	        while (j-- > 0) {
	          if (x2.isOdd()) {
	            x2.iadd(delta);
	          }

	          x2.iushrn(1);
	        }
	      }

	      if (a.cmp(b) >= 0) {
	        a.isub(b);
	        x1.isub(x2);
	      } else {
	        b.isub(a);
	        x2.isub(x1);
	      }
	    }

	    var res;
	    if (a.cmpn(1) === 0) {
	      res = x1;
	    } else {
	      res = x2;
	    }

	    if (res.cmpn(0) < 0) {
	      res.iadd(p);
	    }

	    return res;
	  };

	  BN.prototype.gcd = function gcd (num) {
	    if (this.isZero()) return num.abs();
	    if (num.isZero()) return this.abs();

	    var a = this.clone();
	    var b = num.clone();
	    a.negative = 0;
	    b.negative = 0;

	    // Remove common factor of two
	    for (var shift = 0; a.isEven() && b.isEven(); shift++) {
	      a.iushrn(1);
	      b.iushrn(1);
	    }

	    do {
	      while (a.isEven()) {
	        a.iushrn(1);
	      }
	      while (b.isEven()) {
	        b.iushrn(1);
	      }

	      var r = a.cmp(b);
	      if (r < 0) {
	        // Swap `a` and `b` to make `a` always bigger than `b`
	        var t = a;
	        a = b;
	        b = t;
	      } else if (r === 0 || b.cmpn(1) === 0) {
	        break;
	      }

	      a.isub(b);
	    } while (true);

	    return b.iushln(shift);
	  };

	  // Invert number in the field F(num)
	  BN.prototype.invm = function invm (num) {
	    return this.egcd(num).a.umod(num);
	  };

	  BN.prototype.isEven = function isEven () {
	    return (this.words[0] & 1) === 0;
	  };

	  BN.prototype.isOdd = function isOdd () {
	    return (this.words[0] & 1) === 1;
	  };

	  // And first word and num
	  BN.prototype.andln = function andln (num) {
	    return this.words[0] & num;
	  };

	  // Increment at the bit position in-line
	  BN.prototype.bincn = function bincn (bit) {
	    assert(typeof bit === 'number');
	    var r = bit % 26;
	    var s = (bit - r) / 26;
	    var q = 1 << r;

	    // Fast case: bit is much higher than all existing words
	    if (this.length <= s) {
	      this._expand(s + 1);
	      this.words[s] |= q;
	      return this;
	    }

	    // Add bit and propagate, if needed
	    var carry = q;
	    for (var i = s; carry !== 0 && i < this.length; i++) {
	      var w = this.words[i] | 0;
	      w += carry;
	      carry = w >>> 26;
	      w &= 0x3ffffff;
	      this.words[i] = w;
	    }
	    if (carry !== 0) {
	      this.words[i] = carry;
	      this.length++;
	    }
	    return this;
	  };

	  BN.prototype.isZero = function isZero () {
	    return this.length === 1 && this.words[0] === 0;
	  };

	  BN.prototype.cmpn = function cmpn (num) {
	    var negative = num < 0;

	    if (this.negative !== 0 && !negative) return -1;
	    if (this.negative === 0 && negative) return 1;

	    this._strip();

	    var res;
	    if (this.length > 1) {
	      res = 1;
	    } else {
	      if (negative) {
	        num = -num;
	      }

	      assert(num <= 0x3ffffff, 'Number is too big');

	      var w = this.words[0] | 0;
	      res = w === num ? 0 : w < num ? -1 : 1;
	    }
	    if (this.negative !== 0) return -res | 0;
	    return res;
	  };

	  // Compare two numbers and return:
	  // 1 - if `this` > `num`
	  // 0 - if `this` == `num`
	  // -1 - if `this` < `num`
	  BN.prototype.cmp = function cmp (num) {
	    if (this.negative !== 0 && num.negative === 0) return -1;
	    if (this.negative === 0 && num.negative !== 0) return 1;

	    var res = this.ucmp(num);
	    if (this.negative !== 0) return -res | 0;
	    return res;
	  };

	  // Unsigned comparison
	  BN.prototype.ucmp = function ucmp (num) {
	    // At this point both numbers have the same sign
	    if (this.length > num.length) return 1;
	    if (this.length < num.length) return -1;

	    var res = 0;
	    for (var i = this.length - 1; i >= 0; i--) {
	      var a = this.words[i] | 0;
	      var b = num.words[i] | 0;

	      if (a === b) continue;
	      if (a < b) {
	        res = -1;
	      } else if (a > b) {
	        res = 1;
	      }
	      break;
	    }
	    return res;
	  };

	  BN.prototype.gtn = function gtn (num) {
	    return this.cmpn(num) === 1;
	  };

	  BN.prototype.gt = function gt (num) {
	    return this.cmp(num) === 1;
	  };

	  BN.prototype.gten = function gten (num) {
	    return this.cmpn(num) >= 0;
	  };

	  BN.prototype.gte = function gte (num) {
	    return this.cmp(num) >= 0;
	  };

	  BN.prototype.ltn = function ltn (num) {
	    return this.cmpn(num) === -1;
	  };

	  BN.prototype.lt = function lt (num) {
	    return this.cmp(num) === -1;
	  };

	  BN.prototype.lten = function lten (num) {
	    return this.cmpn(num) <= 0;
	  };

	  BN.prototype.lte = function lte (num) {
	    return this.cmp(num) <= 0;
	  };

	  BN.prototype.eqn = function eqn (num) {
	    return this.cmpn(num) === 0;
	  };

	  BN.prototype.eq = function eq (num) {
	    return this.cmp(num) === 0;
	  };

	  //
	  // A reduce context, could be using montgomery or something better, depending
	  // on the `m` itself.
	  //
	  BN.red = function red (num) {
	    return new Red(num);
	  };

	  BN.prototype.toRed = function toRed (ctx) {
	    assert(!this.red, 'Already a number in reduction context');
	    assert(this.negative === 0, 'red works only with positives');
	    return ctx.convertTo(this)._forceRed(ctx);
	  };

	  BN.prototype.fromRed = function fromRed () {
	    assert(this.red, 'fromRed works only with numbers in reduction context');
	    return this.red.convertFrom(this);
	  };

	  BN.prototype._forceRed = function _forceRed (ctx) {
	    this.red = ctx;
	    return this;
	  };

	  BN.prototype.forceRed = function forceRed (ctx) {
	    assert(!this.red, 'Already a number in reduction context');
	    return this._forceRed(ctx);
	  };

	  BN.prototype.redAdd = function redAdd (num) {
	    assert(this.red, 'redAdd works only with red numbers');
	    return this.red.add(this, num);
	  };

	  BN.prototype.redIAdd = function redIAdd (num) {
	    assert(this.red, 'redIAdd works only with red numbers');
	    return this.red.iadd(this, num);
	  };

	  BN.prototype.redSub = function redSub (num) {
	    assert(this.red, 'redSub works only with red numbers');
	    return this.red.sub(this, num);
	  };

	  BN.prototype.redISub = function redISub (num) {
	    assert(this.red, 'redISub works only with red numbers');
	    return this.red.isub(this, num);
	  };

	  BN.prototype.redShl = function redShl (num) {
	    assert(this.red, 'redShl works only with red numbers');
	    return this.red.shl(this, num);
	  };

	  BN.prototype.redMul = function redMul (num) {
	    assert(this.red, 'redMul works only with red numbers');
	    this.red._verify2(this, num);
	    return this.red.mul(this, num);
	  };

	  BN.prototype.redIMul = function redIMul (num) {
	    assert(this.red, 'redMul works only with red numbers');
	    this.red._verify2(this, num);
	    return this.red.imul(this, num);
	  };

	  BN.prototype.redSqr = function redSqr () {
	    assert(this.red, 'redSqr works only with red numbers');
	    this.red._verify1(this);
	    return this.red.sqr(this);
	  };

	  BN.prototype.redISqr = function redISqr () {
	    assert(this.red, 'redISqr works only with red numbers');
	    this.red._verify1(this);
	    return this.red.isqr(this);
	  };

	  // Square root over p
	  BN.prototype.redSqrt = function redSqrt () {
	    assert(this.red, 'redSqrt works only with red numbers');
	    this.red._verify1(this);
	    return this.red.sqrt(this);
	  };

	  BN.prototype.redInvm = function redInvm () {
	    assert(this.red, 'redInvm works only with red numbers');
	    this.red._verify1(this);
	    return this.red.invm(this);
	  };

	  // Return negative clone of `this` % `red modulo`
	  BN.prototype.redNeg = function redNeg () {
	    assert(this.red, 'redNeg works only with red numbers');
	    this.red._verify1(this);
	    return this.red.neg(this);
	  };

	  BN.prototype.redPow = function redPow (num) {
	    assert(this.red && !num.red, 'redPow(normalNum)');
	    this.red._verify1(this);
	    return this.red.pow(this, num);
	  };

	  // Prime numbers with efficient reduction
	  var primes = {
	    k256: null,
	    p224: null,
	    p192: null,
	    p25519: null
	  };

	  // Pseudo-Mersenne prime
	  function MPrime (name, p) {
	    // P = 2 ^ N - K
	    this.name = name;
	    this.p = new BN(p, 16);
	    this.n = this.p.bitLength();
	    this.k = new BN(1).iushln(this.n).isub(this.p);

	    this.tmp = this._tmp();
	  }

	  MPrime.prototype._tmp = function _tmp () {
	    var tmp = new BN(null);
	    tmp.words = new Array(Math.ceil(this.n / 13));
	    return tmp;
	  };

	  MPrime.prototype.ireduce = function ireduce (num) {
	    // Assumes that `num` is less than `P^2`
	    // num = HI * (2 ^ N - K) + HI * K + LO = HI * K + LO (mod P)
	    var r = num;
	    var rlen;

	    do {
	      this.split(r, this.tmp);
	      r = this.imulK(r);
	      r = r.iadd(this.tmp);
	      rlen = r.bitLength();
	    } while (rlen > this.n);

	    var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
	    if (cmp === 0) {
	      r.words[0] = 0;
	      r.length = 1;
	    } else if (cmp > 0) {
	      r.isub(this.p);
	    } else {
	      if (r.strip !== undefined) {
	        // r is a BN v4 instance
	        r.strip();
	      } else {
	        // r is a BN v5 instance
	        r._strip();
	      }
	    }

	    return r;
	  };

	  MPrime.prototype.split = function split (input, out) {
	    input.iushrn(this.n, 0, out);
	  };

	  MPrime.prototype.imulK = function imulK (num) {
	    return num.imul(this.k);
	  };

	  function K256 () {
	    MPrime.call(
	      this,
	      'k256',
	      'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
	  }
	  inherits(K256, MPrime);

	  K256.prototype.split = function split (input, output) {
	    // 256 = 9 * 26 + 22
	    var mask = 0x3fffff;

	    var outLen = Math.min(input.length, 9);
	    for (var i = 0; i < outLen; i++) {
	      output.words[i] = input.words[i];
	    }
	    output.length = outLen;

	    if (input.length <= 9) {
	      input.words[0] = 0;
	      input.length = 1;
	      return;
	    }

	    // Shift by 9 limbs
	    var prev = input.words[9];
	    output.words[output.length++] = prev & mask;

	    for (i = 10; i < input.length; i++) {
	      var next = input.words[i] | 0;
	      input.words[i - 10] = ((next & mask) << 4) | (prev >>> 22);
	      prev = next;
	    }
	    prev >>>= 22;
	    input.words[i - 10] = prev;
	    if (prev === 0 && input.length > 10) {
	      input.length -= 10;
	    } else {
	      input.length -= 9;
	    }
	  };

	  K256.prototype.imulK = function imulK (num) {
	    // K = 0x1000003d1 = [ 0x40, 0x3d1 ]
	    num.words[num.length] = 0;
	    num.words[num.length + 1] = 0;
	    num.length += 2;

	    // bounded at: 0x40 * 0x3ffffff + 0x3d0 = 0x100000390
	    var lo = 0;
	    for (var i = 0; i < num.length; i++) {
	      var w = num.words[i] | 0;
	      lo += w * 0x3d1;
	      num.words[i] = lo & 0x3ffffff;
	      lo = w * 0x40 + ((lo / 0x4000000) | 0);
	    }

	    // Fast length reduction
	    if (num.words[num.length - 1] === 0) {
	      num.length--;
	      if (num.words[num.length - 1] === 0) {
	        num.length--;
	      }
	    }
	    return num;
	  };

	  function P224 () {
	    MPrime.call(
	      this,
	      'p224',
	      'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
	  }
	  inherits(P224, MPrime);

	  function P192 () {
	    MPrime.call(
	      this,
	      'p192',
	      'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
	  }
	  inherits(P192, MPrime);

	  function P25519 () {
	    // 2 ^ 255 - 19
	    MPrime.call(
	      this,
	      '25519',
	      '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
	  }
	  inherits(P25519, MPrime);

	  P25519.prototype.imulK = function imulK (num) {
	    // K = 0x13
	    var carry = 0;
	    for (var i = 0; i < num.length; i++) {
	      var hi = (num.words[i] | 0) * 0x13 + carry;
	      var lo = hi & 0x3ffffff;
	      hi >>>= 26;

	      num.words[i] = lo;
	      carry = hi;
	    }
	    if (carry !== 0) {
	      num.words[num.length++] = carry;
	    }
	    return num;
	  };

	  // Exported mostly for testing purposes, use plain name instead
	  BN._prime = function prime (name) {
	    // Cached version of prime
	    if (primes[name]) return primes[name];

	    var prime;
	    if (name === 'k256') {
	      prime = new K256();
	    } else if (name === 'p224') {
	      prime = new P224();
	    } else if (name === 'p192') {
	      prime = new P192();
	    } else if (name === 'p25519') {
	      prime = new P25519();
	    } else {
	      throw new Error('Unknown prime ' + name);
	    }
	    primes[name] = prime;

	    return prime;
	  };

	  //
	  // Base reduction engine
	  //
	  function Red (m) {
	    if (typeof m === 'string') {
	      var prime = BN._prime(m);
	      this.m = prime.p;
	      this.prime = prime;
	    } else {
	      assert(m.gtn(1), 'modulus must be greater than 1');
	      this.m = m;
	      this.prime = null;
	    }
	  }

	  Red.prototype._verify1 = function _verify1 (a) {
	    assert(a.negative === 0, 'red works only with positives');
	    assert(a.red, 'red works only with red numbers');
	  };

	  Red.prototype._verify2 = function _verify2 (a, b) {
	    assert((a.negative | b.negative) === 0, 'red works only with positives');
	    assert(a.red && a.red === b.red,
	      'red works only with red numbers');
	  };

	  Red.prototype.imod = function imod (a) {
	    if (this.prime) return this.prime.ireduce(a)._forceRed(this);

	    move(a, a.umod(this.m)._forceRed(this));
	    return a;
	  };

	  Red.prototype.neg = function neg (a) {
	    if (a.isZero()) {
	      return a.clone();
	    }

	    return this.m.sub(a)._forceRed(this);
	  };

	  Red.prototype.add = function add (a, b) {
	    this._verify2(a, b);

	    var res = a.add(b);
	    if (res.cmp(this.m) >= 0) {
	      res.isub(this.m);
	    }
	    return res._forceRed(this);
	  };

	  Red.prototype.iadd = function iadd (a, b) {
	    this._verify2(a, b);

	    var res = a.iadd(b);
	    if (res.cmp(this.m) >= 0) {
	      res.isub(this.m);
	    }
	    return res;
	  };

	  Red.prototype.sub = function sub (a, b) {
	    this._verify2(a, b);

	    var res = a.sub(b);
	    if (res.cmpn(0) < 0) {
	      res.iadd(this.m);
	    }
	    return res._forceRed(this);
	  };

	  Red.prototype.isub = function isub (a, b) {
	    this._verify2(a, b);

	    var res = a.isub(b);
	    if (res.cmpn(0) < 0) {
	      res.iadd(this.m);
	    }
	    return res;
	  };

	  Red.prototype.shl = function shl (a, num) {
	    this._verify1(a);
	    return this.imod(a.ushln(num));
	  };

	  Red.prototype.imul = function imul (a, b) {
	    this._verify2(a, b);
	    return this.imod(a.imul(b));
	  };

	  Red.prototype.mul = function mul (a, b) {
	    this._verify2(a, b);
	    return this.imod(a.mul(b));
	  };

	  Red.prototype.isqr = function isqr (a) {
	    return this.imul(a, a.clone());
	  };

	  Red.prototype.sqr = function sqr (a) {
	    return this.mul(a, a);
	  };

	  Red.prototype.sqrt = function sqrt (a) {
	    if (a.isZero()) return a.clone();

	    var mod3 = this.m.andln(3);
	    assert(mod3 % 2 === 1);

	    // Fast case
	    if (mod3 === 3) {
	      var pow = this.m.add(new BN(1)).iushrn(2);
	      return this.pow(a, pow);
	    }

	    // Tonelli-Shanks algorithm (Totally unoptimized and slow)
	    //
	    // Find Q and S, that Q * 2 ^ S = (P - 1)
	    var q = this.m.subn(1);
	    var s = 0;
	    while (!q.isZero() && q.andln(1) === 0) {
	      s++;
	      q.iushrn(1);
	    }
	    assert(!q.isZero());

	    var one = new BN(1).toRed(this);
	    var nOne = one.redNeg();

	    // Find quadratic non-residue
	    // NOTE: Max is such because of generalized Riemann hypothesis.
	    var lpow = this.m.subn(1).iushrn(1);
	    var z = this.m.bitLength();
	    z = new BN(2 * z * z).toRed(this);

	    while (this.pow(z, lpow).cmp(nOne) !== 0) {
	      z.redIAdd(nOne);
	    }

	    var c = this.pow(z, q);
	    var r = this.pow(a, q.addn(1).iushrn(1));
	    var t = this.pow(a, q);
	    var m = s;
	    while (t.cmp(one) !== 0) {
	      var tmp = t;
	      for (var i = 0; tmp.cmp(one) !== 0; i++) {
	        tmp = tmp.redSqr();
	      }
	      assert(i < m);
	      var b = this.pow(c, new BN(1).iushln(m - i - 1));

	      r = r.redMul(b);
	      c = b.redSqr();
	      t = t.redMul(c);
	      m = i;
	    }

	    return r;
	  };

	  Red.prototype.invm = function invm (a) {
	    var inv = a._invmp(this.m);
	    if (inv.negative !== 0) {
	      inv.negative = 0;
	      return this.imod(inv).redNeg();
	    } else {
	      return this.imod(inv);
	    }
	  };

	  Red.prototype.pow = function pow (a, num) {
	    if (num.isZero()) return new BN(1).toRed(this);
	    if (num.cmpn(1) === 0) return a.clone();

	    var windowSize = 4;
	    var wnd = new Array(1 << windowSize);
	    wnd[0] = new BN(1).toRed(this);
	    wnd[1] = a;
	    for (var i = 2; i < wnd.length; i++) {
	      wnd[i] = this.mul(wnd[i - 1], a);
	    }

	    var res = wnd[0];
	    var current = 0;
	    var currentLen = 0;
	    var start = num.bitLength() % 26;
	    if (start === 0) {
	      start = 26;
	    }

	    for (i = num.length - 1; i >= 0; i--) {
	      var word = num.words[i];
	      for (var j = start - 1; j >= 0; j--) {
	        var bit = (word >> j) & 1;
	        if (res !== wnd[0]) {
	          res = this.sqr(res);
	        }

	        if (bit === 0 && current === 0) {
	          currentLen = 0;
	          continue;
	        }

	        current <<= 1;
	        current |= bit;
	        currentLen++;
	        if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;

	        res = this.mul(res, wnd[current]);
	        currentLen = 0;
	        current = 0;
	      }
	      start = 26;
	    }

	    return res;
	  };

	  Red.prototype.convertTo = function convertTo (num) {
	    var r = num.umod(this.m);

	    return r === num ? r.clone() : r;
	  };

	  Red.prototype.convertFrom = function convertFrom (num) {
	    var res = num.clone();
	    res.red = null;
	    return res;
	  };

	  //
	  // Montgomery method engine
	  //

	  BN.mont = function mont (num) {
	    return new Mont(num);
	  };

	  function Mont (m) {
	    Red.call(this, m);

	    this.shift = this.m.bitLength();
	    if (this.shift % 26 !== 0) {
	      this.shift += 26 - (this.shift % 26);
	    }

	    this.r = new BN(1).iushln(this.shift);
	    this.r2 = this.imod(this.r.sqr());
	    this.rinv = this.r._invmp(this.m);

	    this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
	    this.minv = this.minv.umod(this.r);
	    this.minv = this.r.sub(this.minv);
	  }
	  inherits(Mont, Red);

	  Mont.prototype.convertTo = function convertTo (num) {
	    return this.imod(num.ushln(this.shift));
	  };

	  Mont.prototype.convertFrom = function convertFrom (num) {
	    var r = this.imod(num.mul(this.rinv));
	    r.red = null;
	    return r;
	  };

	  Mont.prototype.imul = function imul (a, b) {
	    if (a.isZero() || b.isZero()) {
	      a.words[0] = 0;
	      a.length = 1;
	      return a;
	    }

	    var t = a.imul(b);
	    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
	    var u = t.isub(c).iushrn(this.shift);
	    var res = u;

	    if (u.cmp(this.m) >= 0) {
	      res = u.isub(this.m);
	    } else if (u.cmpn(0) < 0) {
	      res = u.iadd(this.m);
	    }

	    return res._forceRed(this);
	  };

	  Mont.prototype.mul = function mul (a, b) {
	    if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);

	    var t = a.mul(b);
	    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
	    var u = t.isub(c).iushrn(this.shift);
	    var res = u;
	    if (u.cmp(this.m) >= 0) {
	      res = u.isub(this.m);
	    } else if (u.cmpn(0) < 0) {
	      res = u.iadd(this.m);
	    }

	    return res._forceRed(this);
	  };

	  Mont.prototype.invm = function invm (a) {
	    // (AR)^-1 * R^2 = (A^-1 * R^-1) * R^2 = A^-1 * R
	    var res = this.imod(a._invmp(this.m).mul(this.r2));
	    return res._forceRed(this);
	  };
	})(module, commonjsGlobal); 
} (bn));

bn.exports;

const AccountContext = /*#__PURE__*/React.createContext({
  accounts: {},
  loading: true,
  refresh: () => {}
});
const useAccounts = () => {
  return useContext(AccountContext);
};

function _EMOTION_STRINGIFIED_CSS_ERROR__$1() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
var _ref$1 = process.env.NODE_ENV === "production" ? {
  name: "44x61g",
  styles: "display:flex;height:1.75rem;cursor:pointer;align-items:center;border-radius:1rem;--tw-bg-opacity:1;background-color:rgb(25 27 31 / var(--tw-bg-opacity));padding-left:0.75rem;padding-right:0.75rem;padding-top:0.5rem;padding-bottom:0.5rem"
} : {
  name: "qvr9d9-CurrentUserBadge",
  styles: "display:flex;height:1.75rem;cursor:pointer;align-items:center;border-radius:1rem;--tw-bg-opacity:1;background-color:rgb(25 27 31 / var(--tw-bg-opacity));padding-left:0.75rem;padding-right:0.75rem;padding-top:0.5rem;padding-bottom:0.5rem;label:CurrentUserBadge;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$1
};
var _ref2$1 = process.env.NODE_ENV === "production" ? {
  name: "2bsh0s",
  styles: "display:flex;height:1rem;width:1rem;align-items:center;justify-content:center;border-radius:9999px;--tw-bg-opacity:1;background-color:rgb(25 27 31 / var(--tw-bg-opacity));@media (prefers-color-scheme: dark){background-color:rgb(255 255 255 / 0.1);}"
} : {
  name: "j647sl-CurrentUserBadge",
  styles: "display:flex;height:1rem;width:1rem;align-items:center;justify-content:center;border-radius:9999px;--tw-bg-opacity:1;background-color:rgb(25 27 31 / var(--tw-bg-opacity));@media (prefers-color-scheme: dark){background-color:rgb(255 255 255 / 0.1);};label:CurrentUserBadge;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$1
};
var _ref3$1 = process.env.NODE_ENV === "production" ? {
  name: "uaob3j",
  styles: "margin-left:0.5rem"
} : {
  name: "1s78bgv-CurrentUserBadge",
  styles: "margin-left:0.5rem;label:CurrentUserBadge;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$1
};
var _ref4 = process.env.NODE_ENV === "production" ? {
  name: "1wslo7y",
  styles: "font-size:0.75rem;line-height:1rem;--tw-text-opacity:1;color:rgb(255 255 255 / var(--tw-text-opacity))"
} : {
  name: "1xg1vmn-CurrentUserBadge",
  styles: "font-size:0.75rem;line-height:1rem;--tw-text-opacity:1;color:rgb(255 255 255 / var(--tw-text-opacity));label:CurrentUserBadge;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$1
};
const CurrentUserBadge = ({
  onClick,
  className
}) => {
  const {
    wallet,
    publicKey
  } = useWallet();
  const {
    accounts
  } = useAccounts();
  useMemo(() => {
    if (accounts[WRAPPED_SOL_MINT.toString()]) {
      return accounts[WRAPPED_SOL_MINT.toString()].balance;
    }
    return 0;
  }, [publicKey, accounts]);
  if (!wallet || !publicKey) {
    return null;
  }
  return jsx("div", {
    onClick: onClick,
    css: _ref$1,
    className: className
  }, jsx("div", {
    css: _ref2$1,
    style: {
      position: 'relative'
    }
  }, jsx("img", {
    alt: "Wallet logo",
    width: 16,
    height: 16,
    src: wallet?.adapter?.icon
  })), jsx("div", {
    css: _ref3$1
  }, jsx("div", {
    css: _ref4
  }, shortenAddress(`${publicKey}`))));
};

function _EMOTION_STRINGIFIED_CSS_ERROR__() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const styles = {
  container: {
    light: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(255 255 255 / var(--tw-bg-opacity))",
      "--tw-text-opacity": "1",
      "color": "rgb(0 0 0 / var(--tw-text-opacity))"
    }],
    dark: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(49 51 59 / var(--tw-bg-opacity))",
      "--tw-text-opacity": "1",
      "color": "rgb(255 255 255 / var(--tw-text-opacity))"
    }],
    jupiter: [{
      "backgroundColor": "rgba(28, 41, 54, 1)",
      "--tw-text-opacity": "1",
      "color": "rgb(255 255 255 / var(--tw-text-opacity))"
    }]
  }
};
var _ref = process.env.NODE_ENV === "production" ? {
  name: "ozibme",
  styles: "font-size:0.75rem;line-height:1rem"
} : {
  name: "2vg9f0-content",
  styles: "font-size:0.75rem;line-height:1rem;label:content;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
};
var _ref2 = process.env.NODE_ENV === "production" ? {
  name: "1t9sqkg",
  styles: "display:block;@media (min-width: 768px){display:none;}"
} : {
  name: "156klhd-content",
  styles: "display:block;@media (min-width: 768px){display:none;};label:content;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
};
var _ref3 = process.env.NODE_ENV === "production" ? {
  name: "v1ygcs",
  styles: "display:none;@media (min-width: 768px){display:block;}"
} : {
  name: "1tly61e-content",
  styles: "display:none;@media (min-width: 768px){display:block;};label:content;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__
};
const UnifiedWalletButton = ({
  overrideContent,
  buttonClassName: className,
  currentUserClassName
}) => {
  const {
    setShowModal,
    theme
  } = useUnifiedWalletContext();
  const {
    disconnect,
    connect,
    connecting,
    wallet
  } = useUnifiedWallet();
  const {
    t
  } = useTranslation();
  const content = jsx(React.Fragment, null, connecting && jsx("span", {
    css: _ref
  }, jsx("span", null, t(`Connecting...`))), !connecting && jsx("span", {
    css: _ref2
  }, jsx("span", null, t(`Connect`))), !connecting && jsx("span", {
    css: _ref3
  }, jsx("span", null, t(`Connect Wallet`))));
  const handleClick = useCallback(async () => {
    try {
      if (wallet?.adapter?.name === SolanaMobileWalletAdapterWalletName) {
        await connect();
        return;
      } else {
        setShowModal(true);
      }
    } catch (error) {
      if (error instanceof Error && error.message === MWA_NOT_FOUND_ERROR) {
        setShowModal(true);
      }
    }
  }, [wallet, connect]);
  return jsx(React.Fragment, null, !wallet?.adapter.connected ? jsx("div", {
    css: [overrideContent ? undefined : {
      "width": "auto",
      "cursor": "pointer",
      "borderRadius": "0.5rem",
      "paddingLeft": "1.25rem",
      "paddingRight": "1.25rem",
      "paddingTop": "0.75rem",
      "paddingBottom": "0.75rem",
      "textAlign": "center",
      "fontSize": "0.75rem",
      "lineHeight": "1rem",
      "fontWeight": "600"
    }, styles.container[theme], process.env.NODE_ENV === "production" ? "" : ";label:UnifiedWalletButton;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFvRVUiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlQ2FsbGJhY2sgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuXG5pbXBvcnQgeyBDdXJyZW50VXNlckJhZGdlIH0gZnJvbSAnLi4vQ3VycmVudFVzZXJCYWRnZSc7XG5pbXBvcnQgeyB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCwgdXNlVW5pZmllZFdhbGxldCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRQcm92aWRlcic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCBNV0FfTk9UX0ZPVU5EX0VSUk9SIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy13aGl0ZSB0ZXh0LWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXYzLWJnIHRleHQtd2hpdGVgXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBVbmlmaWVkV2FsbGV0QnV0dG9uOiBSZWFjdC5GQzx7XG4gIG92ZXJyaWRlQ29udGVudD86IFJlYWN0Tm9kZTtcbiAgYnV0dG9uQ2xhc3NOYW1lPzogc3RyaW5nO1xuICBjdXJyZW50VXNlckNsYXNzTmFtZT86IHN0cmluZztcbn0+ID0gKHsgb3ZlcnJpZGVDb250ZW50LCBidXR0b25DbGFzc05hbWU6IGNsYXNzTmFtZSwgY3VycmVudFVzZXJDbGFzc05hbWUgfSkgPT4ge1xuICBjb25zdCB7IHNldFNob3dNb2RhbCwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgZGlzY29ubmVjdCwgY29ubmVjdCwgY29ubmVjdGluZywgd2FsbGV0IH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICBjb25zdCBjb250ZW50ID0gKFxuICAgIDw+XG4gICAgICB7Y29ubmVjdGluZyAmJiAoXG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC14c1wiPlxuICAgICAgICAgIDxzcGFuPnt0KGBDb25uZWN0aW5nLi4uYCl9PC9zcGFuPlxuICAgICAgICA8L3NwYW4+XG4gICAgICApfVxuICAgICAgey8qIE1vYmlsZSAqL31cbiAgICAgIHshY29ubmVjdGluZyAmJiAoXG4gICAgICAgIDxzcGFuIHR3PVwiYmxvY2sgbWQ6aGlkZGVuXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3RgKX08L3NwYW4+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICl9XG4gICAgICB7LyogRGVza3RvcCAqL31cbiAgICAgIHshY29ubmVjdGluZyAmJiAoXG4gICAgICAgIDxzcGFuIHR3PVwiaGlkZGVuIG1kOmJsb2NrXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L3NwYW4+XG4gICAgICApfVxuICAgIDwvPlxuICApO1xuXG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAod2FsbGV0Py5hZGFwdGVyPy5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkge1xuICAgICAgICBhd2FpdCBjb25uZWN0KCk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0U2hvd01vZGFsKHRydWUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5tZXNzYWdlID09PSBNV0FfTk9UX0ZPVU5EX0VSUk9SKSB7XG4gICAgICAgIHNldFNob3dNb2RhbCh0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIFt3YWxsZXQsIGNvbm5lY3RdKTtcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICB7IXdhbGxldD8uYWRhcHRlci5jb25uZWN0ZWQgPyAoXG4gICAgICAgIDxkaXZcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIG92ZXJyaWRlQ29udGVudCA/IHVuZGVmaW5lZCA6IHR3YHJvdW5kZWQtbGcgdGV4dC14cyBweS0zIHB4LTUgZm9udC1zZW1pYm9sZCBjdXJzb3ItcG9pbnRlciB0ZXh0LWNlbnRlciB3LWF1dG9gLFxuICAgICAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZX1cbiAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVDbGlja31cbiAgICAgICAgPlxuICAgICAgICAgIHtvdmVycmlkZUNvbnRlbnQgfHwgY29udGVudH1cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogKFxuICAgICAgICA8Q3VycmVudFVzZXJCYWRnZSBvbkNsaWNrPXtkaXNjb25uZWN0fSBjbGFzc05hbWU9e2N1cnJlbnRVc2VyQ2xhc3NOYW1lfSAvPlxuICAgICAgKX1cbiAgICA8Lz5cbiAgKTtcbn07XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:UnifiedWalletButton;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFvRVUiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlQ2FsbGJhY2sgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuXG5pbXBvcnQgeyBDdXJyZW50VXNlckJhZGdlIH0gZnJvbSAnLi4vQ3VycmVudFVzZXJCYWRnZSc7XG5pbXBvcnQgeyB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCwgdXNlVW5pZmllZFdhbGxldCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1VuaWZpZWRXYWxsZXRQcm92aWRlcic7XG5pbXBvcnQgeyBJVW5pZmllZFRoZW1lLCBNV0FfTk9UX0ZPVU5EX0VSUk9SIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy13aGl0ZSB0ZXh0LWJsYWNrYF0sXG4gICAgZGFyazogW3R3YGJnLVsjMzEzMzNCXSB0ZXh0LXdoaXRlYF0sXG4gICAganVwaXRlcjogW3R3YGJnLXYzLWJnIHRleHQtd2hpdGVgXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBVbmlmaWVkV2FsbGV0QnV0dG9uOiBSZWFjdC5GQzx7XG4gIG92ZXJyaWRlQ29udGVudD86IFJlYWN0Tm9kZTtcbiAgYnV0dG9uQ2xhc3NOYW1lPzogc3RyaW5nO1xuICBjdXJyZW50VXNlckNsYXNzTmFtZT86IHN0cmluZztcbn0+ID0gKHsgb3ZlcnJpZGVDb250ZW50LCBidXR0b25DbGFzc05hbWU6IGNsYXNzTmFtZSwgY3VycmVudFVzZXJDbGFzc05hbWUgfSkgPT4ge1xuICBjb25zdCB7IHNldFNob3dNb2RhbCwgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgZGlzY29ubmVjdCwgY29ubmVjdCwgY29ubmVjdGluZywgd2FsbGV0IH0gPSB1c2VVbmlmaWVkV2FsbGV0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICBjb25zdCBjb250ZW50ID0gKFxuICAgIDw+XG4gICAgICB7Y29ubmVjdGluZyAmJiAoXG4gICAgICAgIDxzcGFuIHR3PVwidGV4dC14c1wiPlxuICAgICAgICAgIDxzcGFuPnt0KGBDb25uZWN0aW5nLi4uYCl9PC9zcGFuPlxuICAgICAgICA8L3NwYW4+XG4gICAgICApfVxuICAgICAgey8qIE1vYmlsZSAqL31cbiAgICAgIHshY29ubmVjdGluZyAmJiAoXG4gICAgICAgIDxzcGFuIHR3PVwiYmxvY2sgbWQ6aGlkZGVuXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3RgKX08L3NwYW4+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICl9XG4gICAgICB7LyogRGVza3RvcCAqL31cbiAgICAgIHshY29ubmVjdGluZyAmJiAoXG4gICAgICAgIDxzcGFuIHR3PVwiaGlkZGVuIG1kOmJsb2NrXCI+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgV2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICA8L3NwYW4+XG4gICAgICApfVxuICAgIDwvPlxuICApO1xuXG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAod2FsbGV0Py5hZGFwdGVyPy5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkge1xuICAgICAgICBhd2FpdCBjb25uZWN0KCk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0U2hvd01vZGFsKHRydWUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5tZXNzYWdlID09PSBNV0FfTk9UX0ZPVU5EX0VSUk9SKSB7XG4gICAgICAgIHNldFNob3dNb2RhbCh0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIFt3YWxsZXQsIGNvbm5lY3RdKTtcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICB7IXdhbGxldD8uYWRhcHRlci5jb25uZWN0ZWQgPyAoXG4gICAgICAgIDxkaXZcbiAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgIG92ZXJyaWRlQ29udGVudCA/IHVuZGVmaW5lZCA6IHR3YHJvdW5kZWQtbGcgdGV4dC14cyBweS0zIHB4LTUgZm9udC1zZW1pYm9sZCBjdXJzb3ItcG9pbnRlciB0ZXh0LWNlbnRlciB3LWF1dG9gLFxuICAgICAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZX1cbiAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVDbGlja31cbiAgICAgICAgPlxuICAgICAgICAgIHtvdmVycmlkZUNvbnRlbnQgfHwgY29udGVudH1cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogKFxuICAgICAgICA8Q3VycmVudFVzZXJCYWRnZSBvbkNsaWNrPXtkaXNjb25uZWN0fSBjbGFzc05hbWU9e2N1cnJlbnRVc2VyQ2xhc3NOYW1lfSAvPlxuICAgICAgKX1cbiAgICA8Lz5cbiAgKTtcbn07XG4iXX0= */"],
    className: className,
    onClick: handleClick
  }, overrideContent || content) : jsx(CurrentUserBadge, {
    onClick: disconnect,
    className: currentUserClassName
  }));
};

export { HardcodedWalletStandardAdapter, UnifiedWalletButton, UnifiedWalletProvider, useUnifiedWallet, useUnifiedWalletContext };
//# sourceMappingURL=components.esm.js.map
