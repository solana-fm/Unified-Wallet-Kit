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
      "backgroundColor": "rgb(238 240 245 / var(--tw-bg-opacity))",
      "--tw-text-opacity": "1",
      "color": "rgb(41 42 48 / var(--tw-text-opacity))"
    }],
    dark: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(21 24 32 / var(--tw-bg-opacity))",
      "--tw-text-opacity": "1",
      "color": "rgb(229 229 232 / var(--tw-text-opacity))"
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
  walletItem: {
    light: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(249 250 251 / var(--tw-bg-opacity))",
      ":hover": {
        "--tw-shadow": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "--tw-shadow-colored": "0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color)",
        "boxShadow": "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)"
      }
    }],
    dark: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(21 24 32 / var(--tw-bg-opacity))",
      ":hover": {
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
    css: ["display:flex;cursor:pointer;align-items:center;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(1.25rem * var(--tw-space-x-reverse));margin-left:calc(1.25rem * calc(1 - var(--tw-space-x-reverse)));}border-radius:0.5rem;border-width:1px;border-color:rgb(255 255 255 / 0.1);padding:1px;transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;:hover{background-color:rgb(255 255 255 / 0.1);--tw-shadow:0 25px 50px -12px rgb(0 0 0 / 0.25);--tw-shadow-colored:0 25px 50px -12px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);--tw-backdrop-blur:blur(24px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);}--tw-gradient-from:#8057FF var(--tw-gradient-from-position);--tw-gradient-to:#D84E76 var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to);:hover{background-image:linear-gradient(to right, var(--tw-gradient-stops));}", styles$4.container[theme], process.env.NODE_ENV === "production" ? "" : ";label:WalletListItem;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIldhbGxldExpc3RJdGVtLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE0RU0iLCJmaWxlIjoiV2FsbGV0TGlzdEl0ZW0udHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgRGV0YWlsZWRIVE1MUHJvcHMsIEZDLCBJbWdIVE1MQXR0cmlidXRlcywgTW91c2VFdmVudEhhbmRsZXIsIHVzZUNhbGxiYWNrLCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0ICd0d2luLm1hY3JvJztcblxuaW1wb3J0IFVua25vd25JY29uU1ZHIGZyb20gJy4uLy4uL2ljb25zL1Vua25vd25JY29uU1ZHJztcbmltcG9ydCB7IGlzTW9iaWxlIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldEljb25Qcm9wcyBleHRlbmRzIERldGFpbGVkSFRNTFByb3BzPEltZ0hUTUxBdHRyaWJ1dGVzPEhUTUxJbWFnZUVsZW1lbnQ+LCBIVE1MSW1hZ2VFbGVtZW50PiB7XG4gIHdhbGxldDogQWRhcHRlciB8IG51bGw7XG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG59XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YGhvdmVyOnNoYWRvdy0yeGwgaG92ZXI6Ymctd2hpdGUvMTBgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG59O1xuXG5leHBvcnQgY29uc3QgV2FsbGV0SWNvbjogRkM8V2FsbGV0SWNvblByb3BzPiA9ICh7IHdhbGxldCwgd2lkdGggPSAyNCwgaGVpZ2h0ID0gMjQgfSkgPT4ge1xuICBjb25zdCBbaGFzRXJyb3IsIHNldEhhc0Vycm9yXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBvbkVycm9yID0gdXNlQ2FsbGJhY2soKCkgPT4gc2V0SGFzRXJyb3IodHJ1ZSksIFtdKTtcblxuICBpZiAod2FsbGV0ICYmIHdhbGxldC5pY29uICYmICFoYXNFcnJvcikge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHN0eWxlPXt7IG1pbldpZHRoOiB3aWR0aCwgbWluSGVpZ2h0OiBoZWlnaHQgfX0+XG4gICAgICAgIHsvKiAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQG5leHQvbmV4dC9uby1pbWctZWxlbWVudCAqL31cbiAgICAgICAgPGltZ1xuICAgICAgICAgIHdpZHRoPXt3aWR0aH1cbiAgICAgICAgICBoZWlnaHQ9e2hlaWdodH1cbiAgICAgICAgICBzcmM9e3dhbGxldC5pY29ufVxuICAgICAgICAgIGFsdD17YCR7d2FsbGV0Lm5hbWV9IGljb25gfVxuICAgICAgICAgIHR3PVwib2JqZWN0LWNvbnRhaW5cIlxuICAgICAgICAgIG9uRXJyb3I9e29uRXJyb3J9XG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHN0eWxlPXt7IG1pbldpZHRoOiB3aWR0aCwgbWluSGVpZ2h0OiBoZWlnaHQgfX0+XG4gICAgICAgIDxVbmtub3duSWNvblNWRyB3aWR0aD17d2lkdGh9IGhlaWdodD17aGVpZ2h0fSAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufTtcblxuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRMaXN0SXRlbVByb3BzIHtcbiAgaGFuZGxlQ2xpY2s6IE1vdXNlRXZlbnRIYW5kbGVyPEhUTUxMSUVsZW1lbnQ+O1xuICB3YWxsZXQ6IEFkYXB0ZXI7XG59XG5cbmV4cG9ydCBjb25zdCBXYWxsZXRMaXN0SXRlbSA9ICh7IGhhbmRsZUNsaWNrLCB3YWxsZXQgfTogV2FsbGV0TGlzdEl0ZW1Qcm9wcykgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgY29uc3QgYWRhcHRlck5hbWUgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoIXdhbGxldCkgcmV0dXJuICcnO1xuICAgIGlmICh3YWxsZXQubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICByZXR1cm4gd2FsbGV0Lm5hbWU7XG4gIH0sIFt3YWxsZXQ/Lm5hbWVdKTtcblxuICByZXR1cm4gKFxuICAgIDxsaVxuICAgICAgb25DbGljaz17aGFuZGxlQ2xpY2t9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgZmxleCBpdGVtcy1jZW50ZXIgcC1bMXB4XSBzcGFjZS14LTUgY3Vyc29yLXBvaW50ZXIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGhvdmVyOmJnLXdoaXRlLzEwIGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgaG92ZXI6c2hhZG93LTJ4bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxkaXZcbiAgICAgICAgY3NzPXtbXG4gICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsIGdhcC0xYCxcbiAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgIF19XG4gICAgICA+XG4gICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17d2FsbGV0fSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXt3YWxsZXR9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgKX1cbiAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQteHMgb3ZlcmZsb3ctaGlkZGVuIHRleHQtZWxsaXBzaXNcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgPC9saT5cbiAgKTtcbn07XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:WalletListItem;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIldhbGxldExpc3RJdGVtLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE0RU0iLCJmaWxlIjoiV2FsbGV0TGlzdEl0ZW0udHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgRGV0YWlsZWRIVE1MUHJvcHMsIEZDLCBJbWdIVE1MQXR0cmlidXRlcywgTW91c2VFdmVudEhhbmRsZXIsIHVzZUNhbGxiYWNrLCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0ICd0d2luLm1hY3JvJztcblxuaW1wb3J0IFVua25vd25JY29uU1ZHIGZyb20gJy4uLy4uL2ljb25zL1Vua25vd25JY29uU1ZHJztcbmltcG9ydCB7IGlzTW9iaWxlIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldEljb25Qcm9wcyBleHRlbmRzIERldGFpbGVkSFRNTFByb3BzPEltZ0hUTUxBdHRyaWJ1dGVzPEhUTUxJbWFnZUVsZW1lbnQ+LCBIVE1MSW1hZ2VFbGVtZW50PiB7XG4gIHdhbGxldDogQWRhcHRlciB8IG51bGw7XG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG59XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YGhvdmVyOnNoYWRvdy0yeGwgaG92ZXI6Ymctd2hpdGUvMTBgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG59O1xuXG5leHBvcnQgY29uc3QgV2FsbGV0SWNvbjogRkM8V2FsbGV0SWNvblByb3BzPiA9ICh7IHdhbGxldCwgd2lkdGggPSAyNCwgaGVpZ2h0ID0gMjQgfSkgPT4ge1xuICBjb25zdCBbaGFzRXJyb3IsIHNldEhhc0Vycm9yXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBvbkVycm9yID0gdXNlQ2FsbGJhY2soKCkgPT4gc2V0SGFzRXJyb3IodHJ1ZSksIFtdKTtcblxuICBpZiAod2FsbGV0ICYmIHdhbGxldC5pY29uICYmICFoYXNFcnJvcikge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHN0eWxlPXt7IG1pbldpZHRoOiB3aWR0aCwgbWluSGVpZ2h0OiBoZWlnaHQgfX0+XG4gICAgICAgIHsvKiAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQG5leHQvbmV4dC9uby1pbWctZWxlbWVudCAqL31cbiAgICAgICAgPGltZ1xuICAgICAgICAgIHdpZHRoPXt3aWR0aH1cbiAgICAgICAgICBoZWlnaHQ9e2hlaWdodH1cbiAgICAgICAgICBzcmM9e3dhbGxldC5pY29ufVxuICAgICAgICAgIGFsdD17YCR7d2FsbGV0Lm5hbWV9IGljb25gfVxuICAgICAgICAgIHR3PVwib2JqZWN0LWNvbnRhaW5cIlxuICAgICAgICAgIG9uRXJyb3I9e29uRXJyb3J9XG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHN0eWxlPXt7IG1pbldpZHRoOiB3aWR0aCwgbWluSGVpZ2h0OiBoZWlnaHQgfX0+XG4gICAgICAgIDxVbmtub3duSWNvblNWRyB3aWR0aD17d2lkdGh9IGhlaWdodD17aGVpZ2h0fSAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufTtcblxuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRMaXN0SXRlbVByb3BzIHtcbiAgaGFuZGxlQ2xpY2s6IE1vdXNlRXZlbnRIYW5kbGVyPEhUTUxMSUVsZW1lbnQ+O1xuICB3YWxsZXQ6IEFkYXB0ZXI7XG59XG5cbmV4cG9ydCBjb25zdCBXYWxsZXRMaXN0SXRlbSA9ICh7IGhhbmRsZUNsaWNrLCB3YWxsZXQgfTogV2FsbGV0TGlzdEl0ZW1Qcm9wcykgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgY29uc3QgYWRhcHRlck5hbWUgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoIXdhbGxldCkgcmV0dXJuICcnO1xuICAgIGlmICh3YWxsZXQubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICByZXR1cm4gd2FsbGV0Lm5hbWU7XG4gIH0sIFt3YWxsZXQ/Lm5hbWVdKTtcblxuICByZXR1cm4gKFxuICAgIDxsaVxuICAgICAgb25DbGljaz17aGFuZGxlQ2xpY2t9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgZmxleCBpdGVtcy1jZW50ZXIgcC1bMXB4XSBzcGFjZS14LTUgY3Vyc29yLXBvaW50ZXIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGhvdmVyOmJnLXdoaXRlLzEwIGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgaG92ZXI6c2hhZG93LTJ4bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxkaXZcbiAgICAgICAgY3NzPXtbXG4gICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsIGdhcC0xYCxcbiAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgIF19XG4gICAgICA+XG4gICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17d2FsbGV0fSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXt3YWxsZXR9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgKX1cbiAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQteHMgb3ZlcmZsb3ctaGlkZGVuIHRleHQtZWxsaXBzaXNcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgPC9saT5cbiAgKTtcbn07XG4iXX0= */"]
  }, jsx("div", {
    css: ["display:flex;width:100%;flex:1 1 0%;cursor:pointer;align-items:center;gap:0.25rem;border-radius:0.5rem;padding-left:1rem;padding-right:1rem;padding-top:1rem;padding-bottom:1rem;@media (min-width: 1024px){justify-content:center;padding-left:0.5rem;padding-right:0.5rem;}", styles$4.walletItem[theme], process.env.NODE_ENV === "production" ? "" : ";label:WalletListItem;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIldhbGxldExpc3RJdGVtLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFtRlEiLCJmaWxlIjoiV2FsbGV0TGlzdEl0ZW0udHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgRGV0YWlsZWRIVE1MUHJvcHMsIEZDLCBJbWdIVE1MQXR0cmlidXRlcywgTW91c2VFdmVudEhhbmRsZXIsIHVzZUNhbGxiYWNrLCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0ICd0d2luLm1hY3JvJztcblxuaW1wb3J0IFVua25vd25JY29uU1ZHIGZyb20gJy4uLy4uL2ljb25zL1Vua25vd25JY29uU1ZHJztcbmltcG9ydCB7IGlzTW9iaWxlIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldEljb25Qcm9wcyBleHRlbmRzIERldGFpbGVkSFRNTFByb3BzPEltZ0hUTUxBdHRyaWJ1dGVzPEhUTUxJbWFnZUVsZW1lbnQ+LCBIVE1MSW1hZ2VFbGVtZW50PiB7XG4gIHdhbGxldDogQWRhcHRlciB8IG51bGw7XG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG59XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YGhvdmVyOnNoYWRvdy0yeGwgaG92ZXI6Ymctd2hpdGUvMTBgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG59O1xuXG5leHBvcnQgY29uc3QgV2FsbGV0SWNvbjogRkM8V2FsbGV0SWNvblByb3BzPiA9ICh7IHdhbGxldCwgd2lkdGggPSAyNCwgaGVpZ2h0ID0gMjQgfSkgPT4ge1xuICBjb25zdCBbaGFzRXJyb3IsIHNldEhhc0Vycm9yXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBvbkVycm9yID0gdXNlQ2FsbGJhY2soKCkgPT4gc2V0SGFzRXJyb3IodHJ1ZSksIFtdKTtcblxuICBpZiAod2FsbGV0ICYmIHdhbGxldC5pY29uICYmICFoYXNFcnJvcikge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHN0eWxlPXt7IG1pbldpZHRoOiB3aWR0aCwgbWluSGVpZ2h0OiBoZWlnaHQgfX0+XG4gICAgICAgIHsvKiAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQG5leHQvbmV4dC9uby1pbWctZWxlbWVudCAqL31cbiAgICAgICAgPGltZ1xuICAgICAgICAgIHdpZHRoPXt3aWR0aH1cbiAgICAgICAgICBoZWlnaHQ9e2hlaWdodH1cbiAgICAgICAgICBzcmM9e3dhbGxldC5pY29ufVxuICAgICAgICAgIGFsdD17YCR7d2FsbGV0Lm5hbWV9IGljb25gfVxuICAgICAgICAgIHR3PVwib2JqZWN0LWNvbnRhaW5cIlxuICAgICAgICAgIG9uRXJyb3I9e29uRXJyb3J9XG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHN0eWxlPXt7IG1pbldpZHRoOiB3aWR0aCwgbWluSGVpZ2h0OiBoZWlnaHQgfX0+XG4gICAgICAgIDxVbmtub3duSWNvblNWRyB3aWR0aD17d2lkdGh9IGhlaWdodD17aGVpZ2h0fSAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufTtcblxuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRMaXN0SXRlbVByb3BzIHtcbiAgaGFuZGxlQ2xpY2s6IE1vdXNlRXZlbnRIYW5kbGVyPEhUTUxMSUVsZW1lbnQ+O1xuICB3YWxsZXQ6IEFkYXB0ZXI7XG59XG5cbmV4cG9ydCBjb25zdCBXYWxsZXRMaXN0SXRlbSA9ICh7IGhhbmRsZUNsaWNrLCB3YWxsZXQgfTogV2FsbGV0TGlzdEl0ZW1Qcm9wcykgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgY29uc3QgYWRhcHRlck5hbWUgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoIXdhbGxldCkgcmV0dXJuICcnO1xuICAgIGlmICh3YWxsZXQubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICByZXR1cm4gd2FsbGV0Lm5hbWU7XG4gIH0sIFt3YWxsZXQ/Lm5hbWVdKTtcblxuICByZXR1cm4gKFxuICAgIDxsaVxuICAgICAgb25DbGljaz17aGFuZGxlQ2xpY2t9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgZmxleCBpdGVtcy1jZW50ZXIgcC1bMXB4XSBzcGFjZS14LTUgY3Vyc29yLXBvaW50ZXIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGhvdmVyOmJnLXdoaXRlLzEwIGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgaG92ZXI6c2hhZG93LTJ4bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxkaXZcbiAgICAgICAgY3NzPXtbXG4gICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsIGdhcC0xYCxcbiAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgIF19XG4gICAgICA+XG4gICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17d2FsbGV0fSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXt3YWxsZXR9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgKX1cbiAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQteHMgb3ZlcmZsb3ctaGlkZGVuIHRleHQtZWxsaXBzaXNcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgPC9saT5cbiAgKTtcbn07XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:WalletListItem;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIldhbGxldExpc3RJdGVtLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFtRlEiLCJmaWxlIjoiV2FsbGV0TGlzdEl0ZW0udHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgRGV0YWlsZWRIVE1MUHJvcHMsIEZDLCBJbWdIVE1MQXR0cmlidXRlcywgTW91c2VFdmVudEhhbmRsZXIsIHVzZUNhbGxiYWNrLCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0ICd0d2luLm1hY3JvJztcblxuaW1wb3J0IFVua25vd25JY29uU1ZHIGZyb20gJy4uLy4uL2ljb25zL1Vua25vd25JY29uU1ZHJztcbmltcG9ydCB7IGlzTW9iaWxlIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldEljb25Qcm9wcyBleHRlbmRzIERldGFpbGVkSFRNTFByb3BzPEltZ0hUTUxBdHRyaWJ1dGVzPEhUTUxJbWFnZUVsZW1lbnQ+LCBIVE1MSW1hZ2VFbGVtZW50PiB7XG4gIHdhbGxldDogQWRhcHRlciB8IG51bGw7XG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG59XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YGhvdmVyOnNoYWRvdy0yeGwgaG92ZXI6Ymctd2hpdGUvMTBgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG59O1xuXG5leHBvcnQgY29uc3QgV2FsbGV0SWNvbjogRkM8V2FsbGV0SWNvblByb3BzPiA9ICh7IHdhbGxldCwgd2lkdGggPSAyNCwgaGVpZ2h0ID0gMjQgfSkgPT4ge1xuICBjb25zdCBbaGFzRXJyb3IsIHNldEhhc0Vycm9yXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBvbkVycm9yID0gdXNlQ2FsbGJhY2soKCkgPT4gc2V0SGFzRXJyb3IodHJ1ZSksIFtdKTtcblxuICBpZiAod2FsbGV0ICYmIHdhbGxldC5pY29uICYmICFoYXNFcnJvcikge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHN0eWxlPXt7IG1pbldpZHRoOiB3aWR0aCwgbWluSGVpZ2h0OiBoZWlnaHQgfX0+XG4gICAgICAgIHsvKiAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQG5leHQvbmV4dC9uby1pbWctZWxlbWVudCAqL31cbiAgICAgICAgPGltZ1xuICAgICAgICAgIHdpZHRoPXt3aWR0aH1cbiAgICAgICAgICBoZWlnaHQ9e2hlaWdodH1cbiAgICAgICAgICBzcmM9e3dhbGxldC5pY29ufVxuICAgICAgICAgIGFsdD17YCR7d2FsbGV0Lm5hbWV9IGljb25gfVxuICAgICAgICAgIHR3PVwib2JqZWN0LWNvbnRhaW5cIlxuICAgICAgICAgIG9uRXJyb3I9e29uRXJyb3J9XG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHN0eWxlPXt7IG1pbldpZHRoOiB3aWR0aCwgbWluSGVpZ2h0OiBoZWlnaHQgfX0+XG4gICAgICAgIDxVbmtub3duSWNvblNWRyB3aWR0aD17d2lkdGh9IGhlaWdodD17aGVpZ2h0fSAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufTtcblxuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRMaXN0SXRlbVByb3BzIHtcbiAgaGFuZGxlQ2xpY2s6IE1vdXNlRXZlbnRIYW5kbGVyPEhUTUxMSUVsZW1lbnQ+O1xuICB3YWxsZXQ6IEFkYXB0ZXI7XG59XG5cbmV4cG9ydCBjb25zdCBXYWxsZXRMaXN0SXRlbSA9ICh7IGhhbmRsZUNsaWNrLCB3YWxsZXQgfTogV2FsbGV0TGlzdEl0ZW1Qcm9wcykgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgY29uc3QgYWRhcHRlck5hbWUgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoIXdhbGxldCkgcmV0dXJuICcnO1xuICAgIGlmICh3YWxsZXQubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICByZXR1cm4gd2FsbGV0Lm5hbWU7XG4gIH0sIFt3YWxsZXQ/Lm5hbWVdKTtcblxuICByZXR1cm4gKFxuICAgIDxsaVxuICAgICAgb25DbGljaz17aGFuZGxlQ2xpY2t9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgZmxleCBpdGVtcy1jZW50ZXIgcC1bMXB4XSBzcGFjZS14LTUgY3Vyc29yLXBvaW50ZXIgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGhvdmVyOmJnLXdoaXRlLzEwIGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgaG92ZXI6c2hhZG93LTJ4bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxkaXZcbiAgICAgICAgY3NzPXtbXG4gICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsIGdhcC0xYCxcbiAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgIF19XG4gICAgICA+XG4gICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17d2FsbGV0fSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXt3YWxsZXR9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgKX1cbiAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQteHMgb3ZlcmZsb3ctaGlkZGVuIHRleHQtZWxsaXBzaXNcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgPC9saT5cbiAgKTtcbn07XG4iXX0= */"]
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
  }, adapterName)));
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
  id: 'Backpack',
  name: 'Backpack',
  url: 'https://www.backpack.app/',
  icon: 'data:image/png;base64,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'
}, {
  id: 'Phantom',
  name: 'Phantom',
  url: 'https://phantom.app/',
  icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiB2aWV3Qm94PSIwIDAgMTA4IDEwOCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9IiNBQjlGRjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni41MjY3IDY5LjkyMjlDNDIuMDA1NCA3Ni44NTA5IDM0LjQyOTIgODUuNjE4MiAyNC4zNDggODUuNjE4MkMxOS41ODI0IDg1LjYxODIgMTUgODMuNjU2MyAxNSA3NS4xMzQyQzE1IDUzLjQzMDUgNDQuNjMyNiAxOS44MzI3IDcyLjEyNjggMTkuODMyN0M4Ny43NjggMTkuODMyNyA5NCAzMC42ODQ2IDk0IDQzLjAwNzlDOTQgNTguODI1OCA4My43MzU1IDc2LjkxMjIgNzMuNTMyMSA3Ni45MTIyQzcwLjI5MzkgNzYuOTEyMiA2OC43MDUzIDc1LjEzNDIgNjguNzA1MyA3Mi4zMTRDNjguNzA1MyA3MS41NzgzIDY4LjgyNzUgNzAuNzgxMiA2OS4wNzE5IDY5LjkyMjlDNjUuNTg5MyA3NS44Njk5IDU4Ljg2ODUgODEuMzg3OCA1Mi41NzU0IDgxLjM4NzhDNDcuOTkzIDgxLjM4NzggNDUuNjcxMyA3OC41MDYzIDQ1LjY3MTMgNzQuNDU5OEM0NS42NzEzIDcyLjk4ODQgNDUuOTc2OCA3MS40NTU2IDQ2LjUyNjcgNjkuOTIyOVpNODMuNjc2MSA0Mi41Nzk0QzgzLjY3NjEgNDYuMTcwNCA4MS41NTc1IDQ3Ljk2NTggNzkuMTg3NSA0Ny45NjU4Qzc2Ljc4MTYgNDcuOTY1OCA3NC42OTg5IDQ2LjE3MDQgNzQuNjk4OSA0Mi41Nzk0Qzc0LjY5ODkgMzguOTg4NSA3Ni43ODE2IDM3LjE5MzEgNzkuMTg3NSAzNy4xOTMxQzgxLjU1NzUgMzcuMTkzMSA4My42NzYxIDM4Ljk4ODUgODMuNjc2MSA0Mi41Nzk0Wk03MC4yMTAzIDQyLjU3OTVDNzAuMjEwMyA0Ni4xNzA0IDY4LjA5MTYgNDcuOTY1OCA2NS43MjE2IDQ3Ljk2NThDNjMuMzE1NyA0Ny45NjU4IDYxLjIzMyA0Ni4xNzA0IDYxLjIzMyA0Mi41Nzk1QzYxLjIzMyAzOC45ODg1IDYzLjMxNTcgMzcuMTkzMSA2NS43MjE2IDM3LjE5MzFDNjguMDkxNiAzNy4xOTMxIDcwLjIxMDMgMzguOTg4NSA3MC4yMTAzIDQyLjU3OTVaIiBmaWxsPSIjRkZGREY4Ii8+Cjwvc3ZnPg=='
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
      "backgroundColor": "rgb(116 194 103 / var(--tw-bg-opacity))"
    }],
    dark: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(67 112 59 / var(--tw-bg-opacity))"
    }],
    jupiter: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(67 112 59 / var(--tw-bg-opacity))"
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
  name: "1vpfph3",
  styles: "font-size:1.25rem;line-height:1.75rem;font-weight:600"
} : {
  name: "1rp4dmu-OnboardingIntro",
  styles: "font-size:1.25rem;line-height:1.75rem;font-weight:600;label:OnboardingIntro;",
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

const SfmLogo = 'data:image/png;base64,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';

function _EMOTION_STRINGIFIED_CSS_ERROR__$2() { return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop)."; }
const styles$1 = {
  container: {
    light: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(238 240 245 / var(--tw-bg-opacity))",
      "--tw-text-opacity": "1",
      "color": "rgb(41 42 48 / var(--tw-text-opacity))"
    }],
    dark: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(21 24 32 / var(--tw-bg-opacity))",
      "--tw-text-opacity": "1",
      "color": "rgb(229 229 232 / var(--tw-text-opacity))"
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
        "--tw-shadow": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "--tw-shadow-colored": "0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color)",
        "boxShadow": "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)"
      }
    }],
    dark: [{
      "--tw-bg-opacity": "1",
      "backgroundColor": "rgb(21 24 32 / var(--tw-bg-opacity))",
      ":hover": {
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
  name: "zigog8",
  styles: "display:flex;flex-direction:column;align-items:center"
} : {
  name: "jc3yau-Header",
  styles: "display:flex;flex-direction:column;align-items:center;label:Header;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref2$2 = process.env.NODE_ENV === "production" ? {
  name: "a9phyx",
  styles: "margin-top:-2.5rem;font-size:1.5rem;line-height:2rem;font-weight:600"
} : {
  name: "1idopd5-Header",
  styles: "margin-top:-2.5rem;font-size:1.5rem;line-height:2rem;font-weight:600;label:Header;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref3$2 = process.env.NODE_ENV === "production" ? {
  name: "jvdksv",
  styles: "background-image:linear-gradient(to right, var(--tw-gradient-stops));--tw-gradient-from:#8057FF var(--tw-gradient-from-position);--tw-gradient-to:#D84E76 var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to);-webkit-background-clip:text;background-clip:text;color:transparent"
} : {
  name: "3tbkax-Header",
  styles: "background-image:linear-gradient(to right, var(--tw-gradient-stops));--tw-gradient-from:#8057FF var(--tw-gradient-from-position);--tw-gradient-to:#D84E76 var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to);-webkit-background-clip:text;background-clip:text;color:transparent;label:Header;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUEwRGdCIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcbmltcG9ydCB7IFdhbGxldEljb24sIFdhbGxldExpc3RJdGVtIH0gZnJvbSAnLi9XYWxsZXRMaXN0SXRlbSc7XG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENsb3NlSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DbG9zZUljb24nO1xuaW1wb3J0IHsgaXNNb2JpbGUsIHVzZU91dHNpZGVDbGljayB9IGZyb20gJy4uLy4uL21pc2MvdXRpbHMnO1xuaW1wb3J0IE5vdEluc3RhbGxlZCBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi4vVW5pZmllZFdhbGxldE1vZGFsL09uYm9hcmRpbmcnO1xuaW1wb3J0IHsgU2ZtTG9nbyB9IGZyb20gJy4vU2ZtTG9nbyc7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUgYmctW3JnYig0OSwgNjIsIDc2KV1gXSxcbiAgfSxcbiAgc2hhZGVzOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyNmZmZmZmZdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjM0EzQjQzXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bcmdiKDQ5LCA2MiwgNzYpXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gIH0sXG4gIHdhbGxldEl0ZW06IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYXktNTAgaG92ZXI6c2hhZG93LWxnYF0sXG4gICAgZGFyazogW3R3YGJnLWRhcmstNzAwIGhvdmVyOnNoYWRvdy0yeGxgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICB9LFxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBmbGV4LXJvdyBqdXN0aWZ5LWNlbnRlciBgLCBzdHlsZXMuaGVhZGVyW3RoZW1lXV19PlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPXtTZm1Mb2dvfSBhbHQ9XCJsb2dvXCIgLz5cbiAgICAgICAgPGRpdiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14bCAtbXQtMTBcIj5cbiAgICAgICAgICA8c3BhbiBjc3M9e1t0d2B0ZXh0LXRyYW5zcGFyZW50IGJnLWNsaXAtdGV4dCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWBdfT5cbiAgICAgICAgICAgIHt0KGBDb25uZWN0IFdhbGxldGApfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC1zbSBtdC0xIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgYSB3YWxsZXQgdG8gcHJvY2VlZGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lIHRleHQtY2VudGVyYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QucmVjb21tZW5kZWRXYWxsZXRzLm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgICAgICAgICAgIC8vIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQtbGcgbWwtNCBsZzptbC0yXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHthdHRhY2htZW50ID8gPGRpdj57YXR0YWNobWVudH08L2Rpdj4gOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtMiBmbGV4IGZsZXgtY29sIHNwYWNlLXktMiBcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHQubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHAtWzFweF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmFja2Ryb3AtYmx1ci14bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiZy1ncmFkaWVudC10by1yICBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWdyZXktNTAwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3QoYE1vcmUgb3B0aW9uc2ApfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgdGV4dC14cyBmbGV4IGp1c3RpZnktY2VudGVyIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdLFxuICAgICAgICAgIF19XG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyh0cnVlKX0+XG4gICAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqL31cbiAgICAgIHtpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgICA8Lz5cbiAgICAgICkgOiBudWxsfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnQ29pbmJhc2UgV2FsbGV0JyBhcyBXYWxsZXROYW1lPCdDb2luYmFzZSBXYWxsZXQnPixcbiAgJ0JhY2twYWNrJyBhcyBXYWxsZXROYW1lPCdCYWNrcGFjayc+LFxuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuXTtcblxuaW50ZXJmYWNlIElVbmlmaWVkV2FsbGV0TW9kYWwge1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBzb3J0QnlQcmVjZWRlbmNlID0gKHdhbGxldFByZWNlZGVuY2U6IFdhbGxldE5hbWVbXSkgPT4gKGE6IEFkYXB0ZXIsIGI6IEFkYXB0ZXIpID0+IHtcbiAgaWYgKCF3YWxsZXRQcmVjZWRlbmNlKSByZXR1cm4gMDtcblxuICBjb25zdCBhSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYS5uYW1lKTtcbiAgY29uc3QgYkluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGIubmFtZSk7XG5cbiAgaWYgKGFJbmRleCA9PT0gLTEgJiYgYkluZGV4ID09PSAtMSkgcmV0dXJuIDA7XG4gIGlmIChhSW5kZXggPj0gMCkge1xuICAgIGlmIChiSW5kZXggPT09IC0xKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgfVxuXG4gIGlmIChiSW5kZXggPj0gMCkge1xuICAgIGlmIChhSW5kZXggPT09IC0xKSByZXR1cm4gMTtcbiAgICByZXR1cm4gYkluZGV4IC0gYUluZGV4O1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuY29uc3QgU2ZtVW5pZmllZFdhbGxldE1vZGFsOiBSZWFjdC5GQzxJVW5pZmllZFdhbGxldE1vZGFsPiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHdhbGxldHMgfSA9IHVzZVVuaWZpZWRXYWxsZXQoKTtcbiAgY29uc3QgeyB3YWxsZXRQcmVjZWRlbmNlLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgW2lzT3Blbiwgb25Ub2dnbGVdID0gdXNlVG9nZ2xlKGZhbHNlKTtcbiAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZCA9IHVzZVByZXZpb3VzbHlDb25uZWN0ZWQoKTtcblxuICBjb25zdCBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH0gPSB1c2VNZW1vKCgpID0+IHtcbiAgICAvLyBUaGVuLCBJbnN0YWxsZWQsIFRvcCAzLCBMb2FkYWJsZSwgTm90RGV0ZWN0ZWRcbiAgICBjb25zdCBmaWx0ZXJlZEFkYXB0ZXJzID0gd2FsbGV0cy5yZWR1Y2U8e1xuICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogQWRhcHRlcltdO1xuICAgICAgaW5zdGFsbGVkOiBBZGFwdGVyW107XG4gICAgICB0b3AzOiBBZGFwdGVyW107XG4gICAgICBsb2FkYWJsZTogQWRhcHRlcltdO1xuICAgICAgbm90RGV0ZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIH0+KFxuICAgICAgKGFjYywgd2FsbGV0KSA9PiB7XG4gICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gd2FsbGV0LmFkYXB0ZXIubmFtZTtcblxuICAgICAgICBpZiAoUkVDT01NRU5ERURfV0FMTEVUUy5zb21lKCh3YWxsZXQpID0+IHdhbGxldCA9PT0gYWRhcHRlck5hbWUpICYmIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgZHVwbGljYXRlcyBzaW5jZSBDb2luYmFzZSBXYWxsZXQgaGFzIHR3byBhZGFwdGVycyBkdXBsaWNhdGVcbiAgICAgICAgICBpZiAoYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5zb21lKCh3YWxsZXQpID0+IHdhbGxldC5uYW1lID09PSBhZGFwdGVyTmFtZSkpIHJldHVybiBhY2M7XG4gICAgICAgICAgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmlvdXNseSBjb25uZWN0ZWQgdGFrZXMgaGlnaGVzdFxuICAgICAgICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPSBwcmV2aW91c2x5Q29ubmVjdGVkLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAocHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MucHJldmlvdXNseUNvbm5lY3RlZFtwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGVuIEluc3RhbGxlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgYWNjLmluc3RhbGxlZC5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRvcCAzXG4gICAgICAgIGNvbnN0IHRvcFdhbGxldHNJbmRleCA9IFRPUF9XQUxMRVRTLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAodG9wV2FsbGV0c0luZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MudG9wM1t0b3BXYWxsZXRzSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBMb2FkYWJsZVxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTG9hZGFibGUpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBOb3REZXRlY3RlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBbXSxcbiAgICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogW10sXG4gICAgICAgIGluc3RhbGxlZDogW10sXG4gICAgICAgIHRvcDM6IFtdLFxuICAgICAgICBsb2FkYWJsZTogW10sXG4gICAgICAgIG5vdERldGVjdGVkOiBbXSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG5cbiAgICAgIGNvbnN0IGhpZ2hsaWdodCA9IGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgwLCAzKTtcbiAgICAgIGxldCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMywgZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCkpO1xuICAgICAgb3RoZXJzID0gb3RoZXJzLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnUHJldmlvdXNseUNvbm5lY3RlZCcsXG4gICAgICAgIGhpZ2hsaWdodCxcbiAgICAgICAgb3RoZXJzLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIGluc3RhbGxlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc29sZS5sb2cocmVjb21tZW5kZWRXYWxsZXRzKTtcbiAgICAgIC8vIFNvcnQgdGhlIGluc3RhbGxlZCB3YWxsZXRzIGFjY29yZGluZyB0byB0aGUgdG9wIHdhbGxldHMgdGhhdCB3ZSB3YW50IHRvIHNob3cgdG8gdGhlIHVzZXIgZmlyc3RcbiAgICAgIGNvbnN0IGhpZ2hsaWdodDogQWRhcHRlcltdID0gW107XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgaW5zdGFsbGVkIHdhbGxldCBhZGFwdGVycyBhbmQgY2hlY2sgaWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXRzIGxpc3RcbiAgICAgIC8vIElmIHRoZXkgYXJlIGluIHRoZSB0b3Agd2FsbGV0IGxpc3QsIHdlIHdpbGwgYWRkIGl0IHRvIHRoZSBmaWx0ZXJlZCByZWNvbW1lbmRlIHdhbGxldHNcbiAgICAgIFRPUF9XQUxMRVRTLmZvckVhY2goKHRvcFdhbGxldCkgPT4ge1xuICAgICAgICBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5mb3JFYWNoKChpbnN0YWxsZWRXYWxsZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKHRvcFdhbGxldCA9PT0gaW5zdGFsbGVkV2FsbGV0Lm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhbGxldFRvUHVzaCA9IGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgICAgICAgICBoaWdobGlnaHQucHVzaCh3YWxsZXRUb1B1c2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gaGlnaGxpZ2h0LnB1c2goLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMSkpO1xuICAgICAgY29uc29sZS5sb2coaGlnaGxpZ2h0KTtcbiAgICAgIGNvbnNvbGUubG9nKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDAsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLFxuICAgICAgICBoaWdobGlnaHQ6IFtdLFxuICAgICAgICBvdGhlcnM6IFtdLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgdG9wMywgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcbiAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAuZmxhdCgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnVG9wV2FsbGV0JywgaGlnaGxpZ2h0OiB0b3AzLCBvdGhlcnMgfTtcbiAgfSwgW3dhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWRdKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgdXNlT3V0c2lkZUNsaWNrKGNvbnRlbnRSZWYsIG9uQ2xvc2UpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbXG4gICAgICAgIHR3YG1heC13LW1kIHctZnVsbCByZWxhdGl2ZSBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLXhsIHRyYW5zaXRpb24taGVpZ2h0IGR1cmF0aW9uLTUwMCBlYXNlLWluLW91dGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8TGlzdE9mV2FsbGV0cyBsaXN0PXtsaXN0fSBvblRvZ2dsZT17b25Ub2dnbGV9IGlzT3Blbj17aXNPcGVufSAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2ZtVW5pZmllZFdhbGxldE1vZGFsO1xuIl19 */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref4$1 = process.env.NODE_ENV === "production" ? {
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
    css: ["display:flex;flex-direction:row;justify-content:center;padding-left:1.25rem;padding-right:1.25rem;padding-top:1.5rem;padding-bottom:1.5rem;", styles$1.header[theme], process.env.NODE_ENV === "production" ? "" : ";label:Header;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFzRFMiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NvbGxhcHNlJztcbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4uL1VuaWZpZWRXYWxsZXRNb2RhbC9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvT25ib2FyZGluZyc7XG5pbXBvcnQgeyBTZm1Mb2dvIH0gZnJvbSAnLi9TZm1Mb2dvJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1saWdodC0xMDAgdGV4dC1ncmV5LTcwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1kYXJrLTcwMCB0ZXh0LWdyZXktNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF0sXG4gIH0sXG59O1xuXG5jb25zdCBIZWFkZXI6IFJlYWN0LkZDPHsgb25DbG9zZTogKCkgPT4gdm9pZCB9PiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YHB4LTUgcHktNiBmbGV4IGZsZXgtcm93IGp1c3RpZnktY2VudGVyIGAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPGltZyBzcmM9e1NmbUxvZ299IGFsdD1cImxvZ29cIiAvPlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhsIC1tdC0xMFwiPlxuICAgICAgICAgIDxzcGFuIGNzcz17W3R3YHRleHQtdHJhbnNwYXJlbnQgYmctY2xpcC10ZXh0IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYF19PlxuICAgICAgICAgICAge3QoYENvbm5lY3QgV2FsbGV0YCl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXNtIG10LTEgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICA8c3Bhbj57dChgQ29ubmVjdCBhIHdhbGxldCB0byBwcm9jZWVkYCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8YnV0dG9uIHR3PVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNFwiIG9uQ2xpY2s9e29uQ2xvc2V9PlxuICAgICAgICA8Q2xvc2VJY29uIHdpZHRoPXsxMn0gaGVpZ2h0PXsxMn0gLz5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgTGlzdE9mV2FsbGV0czogUmVhY3QuRkM8e1xuICBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH07XG4gIG9uVG9nZ2xlOiAobmV4dFZhbHVlPzogYW55KSA9PiB2b2lkO1xuICBpc09wZW46IGJvb2xlYW47XG59PiA9ICh7IGxpc3QsIG9uVG9nZ2xlLCBpc09wZW4gfSkgPT4ge1xuICBjb25zdCB7IGhhbmRsZUNvbm5lY3RDbGljaywgd2FsbGV0bGlzdEV4cGxhbmF0aW9uLCB3YWxsZXRBdHRhY2htZW50cywgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3Nob3dPbmJvYXJkaW5nLCBzZXRTaG93T25ib2FyZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzaG93Tm90SW5zdGFsbGVkLCBzZXRTaG93Tm90SW5zdGFsbGVkXSA9IHVzZVN0YXRlPEFkYXB0ZXIgfCBmYWxzZT4oZmFsc2UpO1xuXG4gIGNvbnN0IG9uQ2xpY2tXYWxsZXQgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTEVsZW1lbnQsIE1vdXNlRXZlbnQ+LCBhZGFwdGVyOiBBZGFwdGVyKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChhZGFwdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFuZGxlQ29ubmVjdENsaWNrKGV2ZW50LCBhZGFwdGVyKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHJlbmRlcldhbGxldExpc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGdyaWQgZ2FwLTIgZ3JpZC1jb2xzLTIgcGItNFwiIHRyYW5zbGF0ZT1cIm5vXCI+XG4gICAgICAgICAge2xpc3Qub3RoZXJzLm1hcCgoYWRhcHRlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDx1bCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICA8V2FsbGV0TGlzdEl0ZW0gaGFuZGxlQ2xpY2s9eyhlKSA9PiBvbkNsaWNrV2FsbGV0KGUsIGFkYXB0ZXIpfSB3YWxsZXQ9e2FkYXB0ZXJ9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSAhPT0gJ09uYm9hcmRpbmcnICYmIHdhbGxldGxpc3RFeHBsYW5hdGlvbiA/IChcbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YHRleHQteHMgZm9udC1zZW1pYm9sZCB1bmRlcmxpbmUgdGV4dC1jZW50ZXJgLCBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gdHdgbWItOGAgOiAnJ119PlxuICAgICAgICAgICAgPGEgaHJlZj17d2FsbGV0bGlzdEV4cGxhbmF0aW9uLmhyZWZ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoYENhbid0IGZpbmQgeW91ciB3YWxsZXQ/YCl9PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICksXG4gICAgW2hhbmRsZUNvbm5lY3RDbGljaywgbGlzdC5vdGhlcnNdLFxuICApO1xuXG4gIGNvbnN0IGhhc05vV2FsbGV0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0LmhpZ2hsaWdodC5sZW5ndGggPT09IDAgJiYgbGlzdC5vdGhlcnMubGVuZ3RoID09PSAwO1xuICB9LCBbbGlzdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGhhc05vV2FsbGV0cykge1xuICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgfVxuICB9LCBbaGFzTm9XYWxsZXRzXSk7XG5cbiAgaWYgKHNob3dPbmJvYXJkaW5nKSB7XG4gICAgcmV0dXJuIDxPbmJvYXJkaW5nRmxvdyBzaG93QmFjaz17IWhhc05vV2FsbGV0c30gb25DbG9zZT17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcoZmFsc2UpfSAvPjtcbiAgfVxuXG4gIGlmIChzaG93Tm90SW5zdGFsbGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxOb3RJbnN0YWxsZWRcbiAgICAgICAgYWRhcHRlcj17c2hvd05vdEluc3RhbGxlZH1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSl9XG4gICAgICAgIG9uR29PbmJvYXJkaW5nPXsoKSA9PiB7XG4gICAgICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGVTY3JvbGxiYXJcIiBjc3M9e1t0d2BoLWZ1bGwgb3ZlcmZsb3cteS1hdXRvIHB0LTMgcGItOCBweC01IHJlbGF0aXZlYCwgaXNPcGVuICYmIHR3YG1iLTdgXX0+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTBcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BwLVsxcHhdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmctZ3JhZGllbnQtdG8tciBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgLy8gc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC0yIGZsZXggZmxleC1jb2wgc3BhY2UteS0yIFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWAsXG4gICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezMwfSBoZWlnaHQ9ezMwfSAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LWxnIG1sLTQgbGc6bWwtMlwiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXtvblRvZ2dsZX0+XG4gICAgICAgICAgICAgIDxzcGFuIHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtZ3JleS01MDBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSBvcHRpb25zYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPENvbGxhcHNlIGhlaWdodD17MH0gbWF4SGVpZ2h0PXsnYXV0byd9IGV4cGFuZGVkPXtpc09wZW59PlxuICAgICAgICAgICAgICB7cmVuZGVyV2FsbGV0TGlzdH1cbiAgICAgICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICAgICAgPC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXhzIGZsZXgganVzdGlmeS1jZW50ZXIgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHVuZGVybGluZSBjdXJzb3ItcG9pbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBCb3R0b20gU2hhZGVzICovfVxuICAgICAge2lzT3BlbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICAgIDwvPlxuICAgICAgKSA6IG51bGx9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdDb2luYmFzZSBXYWxsZXQnIGFzIFdhbGxldE5hbWU8J0NvaW5iYXNlIFdhbGxldCc+LFxuICAnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz4sXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkgJiYgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIHNpbmNlIENvaW5iYXNlIFdhbGxldCBoYXMgdHdvIGFkYXB0ZXJzIGR1cGxpY2F0ZVxuICAgICAgICAgIGlmIChhY2MucmVjb21tZW5kZWRXYWxsZXRzLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0Lm5hbWUgPT09IGFkYXB0ZXJOYW1lKSkgcmV0dXJuIGFjYztcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zb2xlLmxvZyhyZWNvbW1lbmRlZFdhbGxldHMpO1xuICAgICAgLy8gU29ydCB0aGUgaW5zdGFsbGVkIHdhbGxldHMgYWNjb3JkaW5nIHRvIHRoZSB0b3Agd2FsbGV0cyB0aGF0IHdlIHdhbnQgdG8gc2hvdyB0byB0aGUgdXNlciBmaXJzdFxuICAgICAgY29uc3QgaGlnaGxpZ2h0OiBBZGFwdGVyW10gPSBbXTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBpbnN0YWxsZWQgd2FsbGV0IGFkYXB0ZXJzIGFuZCBjaGVjayBpZiB0aGV5IGFyZSBpbiB0aGUgdG9wIHdhbGxldHMgbGlzdFxuICAgICAgLy8gSWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXQgbGlzdCwgd2Ugd2lsbCBhZGQgaXQgdG8gdGhlIGZpbHRlcmVkIHJlY29tbWVuZGUgd2FsbGV0c1xuICAgICAgVE9QX1dBTExFVFMuZm9yRWFjaCgodG9wV2FsbGV0KSA9PiB7XG4gICAgICAgIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmZvckVhY2goKGluc3RhbGxlZFdhbGxldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBpZiAodG9wV2FsbGV0ID09PSBpbnN0YWxsZWRXYWxsZXQubmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgd2FsbGV0VG9QdXNoID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wdXNoKHdhbGxldFRvUHVzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBoaWdobGlnaHQucHVzaCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAxKSk7XG4gICAgICBjb25zb2xlLmxvZyhoaWdobGlnaHQpO1xuICAgICAgY29uc29sZS5sb2coZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQpO1xuICAgICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoKSk7XG5cbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ0luc3RhbGxlZCcsIGhpZ2hsaWdodCwgb3RoZXJzIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMubG9hZGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IGZpbHRlcmVkQWRhcHRlcnMucmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnT25ib2FyZGluZycsXG4gICAgICAgIGhpZ2hsaWdodDogW10sXG4gICAgICAgIG90aGVyczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0YCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:Header;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFzRFMiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NvbGxhcHNlJztcbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4uL1VuaWZpZWRXYWxsZXRNb2RhbC9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvT25ib2FyZGluZyc7XG5pbXBvcnQgeyBTZm1Mb2dvIH0gZnJvbSAnLi9TZm1Mb2dvJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1saWdodC0xMDAgdGV4dC1ncmV5LTcwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1kYXJrLTcwMCB0ZXh0LWdyZXktNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF0sXG4gIH0sXG59O1xuXG5jb25zdCBIZWFkZXI6IFJlYWN0LkZDPHsgb25DbG9zZTogKCkgPT4gdm9pZCB9PiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YHB4LTUgcHktNiBmbGV4IGZsZXgtcm93IGp1c3RpZnktY2VudGVyIGAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPGltZyBzcmM9e1NmbUxvZ299IGFsdD1cImxvZ29cIiAvPlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhsIC1tdC0xMFwiPlxuICAgICAgICAgIDxzcGFuIGNzcz17W3R3YHRleHQtdHJhbnNwYXJlbnQgYmctY2xpcC10ZXh0IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYF19PlxuICAgICAgICAgICAge3QoYENvbm5lY3QgV2FsbGV0YCl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXNtIG10LTEgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICA8c3Bhbj57dChgQ29ubmVjdCBhIHdhbGxldCB0byBwcm9jZWVkYCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8YnV0dG9uIHR3PVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNFwiIG9uQ2xpY2s9e29uQ2xvc2V9PlxuICAgICAgICA8Q2xvc2VJY29uIHdpZHRoPXsxMn0gaGVpZ2h0PXsxMn0gLz5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgTGlzdE9mV2FsbGV0czogUmVhY3QuRkM8e1xuICBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH07XG4gIG9uVG9nZ2xlOiAobmV4dFZhbHVlPzogYW55KSA9PiB2b2lkO1xuICBpc09wZW46IGJvb2xlYW47XG59PiA9ICh7IGxpc3QsIG9uVG9nZ2xlLCBpc09wZW4gfSkgPT4ge1xuICBjb25zdCB7IGhhbmRsZUNvbm5lY3RDbGljaywgd2FsbGV0bGlzdEV4cGxhbmF0aW9uLCB3YWxsZXRBdHRhY2htZW50cywgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3Nob3dPbmJvYXJkaW5nLCBzZXRTaG93T25ib2FyZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzaG93Tm90SW5zdGFsbGVkLCBzZXRTaG93Tm90SW5zdGFsbGVkXSA9IHVzZVN0YXRlPEFkYXB0ZXIgfCBmYWxzZT4oZmFsc2UpO1xuXG4gIGNvbnN0IG9uQ2xpY2tXYWxsZXQgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTEVsZW1lbnQsIE1vdXNlRXZlbnQ+LCBhZGFwdGVyOiBBZGFwdGVyKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChhZGFwdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFuZGxlQ29ubmVjdENsaWNrKGV2ZW50LCBhZGFwdGVyKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHJlbmRlcldhbGxldExpc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGdyaWQgZ2FwLTIgZ3JpZC1jb2xzLTIgcGItNFwiIHRyYW5zbGF0ZT1cIm5vXCI+XG4gICAgICAgICAge2xpc3Qub3RoZXJzLm1hcCgoYWRhcHRlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDx1bCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICA8V2FsbGV0TGlzdEl0ZW0gaGFuZGxlQ2xpY2s9eyhlKSA9PiBvbkNsaWNrV2FsbGV0KGUsIGFkYXB0ZXIpfSB3YWxsZXQ9e2FkYXB0ZXJ9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSAhPT0gJ09uYm9hcmRpbmcnICYmIHdhbGxldGxpc3RFeHBsYW5hdGlvbiA/IChcbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YHRleHQteHMgZm9udC1zZW1pYm9sZCB1bmRlcmxpbmUgdGV4dC1jZW50ZXJgLCBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gdHdgbWItOGAgOiAnJ119PlxuICAgICAgICAgICAgPGEgaHJlZj17d2FsbGV0bGlzdEV4cGxhbmF0aW9uLmhyZWZ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoYENhbid0IGZpbmQgeW91ciB3YWxsZXQ/YCl9PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICksXG4gICAgW2hhbmRsZUNvbm5lY3RDbGljaywgbGlzdC5vdGhlcnNdLFxuICApO1xuXG4gIGNvbnN0IGhhc05vV2FsbGV0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0LmhpZ2hsaWdodC5sZW5ndGggPT09IDAgJiYgbGlzdC5vdGhlcnMubGVuZ3RoID09PSAwO1xuICB9LCBbbGlzdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGhhc05vV2FsbGV0cykge1xuICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgfVxuICB9LCBbaGFzTm9XYWxsZXRzXSk7XG5cbiAgaWYgKHNob3dPbmJvYXJkaW5nKSB7XG4gICAgcmV0dXJuIDxPbmJvYXJkaW5nRmxvdyBzaG93QmFjaz17IWhhc05vV2FsbGV0c30gb25DbG9zZT17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcoZmFsc2UpfSAvPjtcbiAgfVxuXG4gIGlmIChzaG93Tm90SW5zdGFsbGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxOb3RJbnN0YWxsZWRcbiAgICAgICAgYWRhcHRlcj17c2hvd05vdEluc3RhbGxlZH1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSl9XG4gICAgICAgIG9uR29PbmJvYXJkaW5nPXsoKSA9PiB7XG4gICAgICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGVTY3JvbGxiYXJcIiBjc3M9e1t0d2BoLWZ1bGwgb3ZlcmZsb3cteS1hdXRvIHB0LTMgcGItOCBweC01IHJlbGF0aXZlYCwgaXNPcGVuICYmIHR3YG1iLTdgXX0+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTBcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BwLVsxcHhdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmctZ3JhZGllbnQtdG8tciBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgLy8gc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC0yIGZsZXggZmxleC1jb2wgc3BhY2UteS0yIFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWAsXG4gICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezMwfSBoZWlnaHQ9ezMwfSAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LWxnIG1sLTQgbGc6bWwtMlwiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXtvblRvZ2dsZX0+XG4gICAgICAgICAgICAgIDxzcGFuIHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtZ3JleS01MDBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSBvcHRpb25zYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPENvbGxhcHNlIGhlaWdodD17MH0gbWF4SGVpZ2h0PXsnYXV0byd9IGV4cGFuZGVkPXtpc09wZW59PlxuICAgICAgICAgICAgICB7cmVuZGVyV2FsbGV0TGlzdH1cbiAgICAgICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICAgICAgPC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXhzIGZsZXgganVzdGlmeS1jZW50ZXIgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHVuZGVybGluZSBjdXJzb3ItcG9pbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBCb3R0b20gU2hhZGVzICovfVxuICAgICAge2lzT3BlbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICAgIDwvPlxuICAgICAgKSA6IG51bGx9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdDb2luYmFzZSBXYWxsZXQnIGFzIFdhbGxldE5hbWU8J0NvaW5iYXNlIFdhbGxldCc+LFxuICAnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz4sXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkgJiYgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIHNpbmNlIENvaW5iYXNlIFdhbGxldCBoYXMgdHdvIGFkYXB0ZXJzIGR1cGxpY2F0ZVxuICAgICAgICAgIGlmIChhY2MucmVjb21tZW5kZWRXYWxsZXRzLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0Lm5hbWUgPT09IGFkYXB0ZXJOYW1lKSkgcmV0dXJuIGFjYztcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zb2xlLmxvZyhyZWNvbW1lbmRlZFdhbGxldHMpO1xuICAgICAgLy8gU29ydCB0aGUgaW5zdGFsbGVkIHdhbGxldHMgYWNjb3JkaW5nIHRvIHRoZSB0b3Agd2FsbGV0cyB0aGF0IHdlIHdhbnQgdG8gc2hvdyB0byB0aGUgdXNlciBmaXJzdFxuICAgICAgY29uc3QgaGlnaGxpZ2h0OiBBZGFwdGVyW10gPSBbXTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBpbnN0YWxsZWQgd2FsbGV0IGFkYXB0ZXJzIGFuZCBjaGVjayBpZiB0aGV5IGFyZSBpbiB0aGUgdG9wIHdhbGxldHMgbGlzdFxuICAgICAgLy8gSWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXQgbGlzdCwgd2Ugd2lsbCBhZGQgaXQgdG8gdGhlIGZpbHRlcmVkIHJlY29tbWVuZGUgd2FsbGV0c1xuICAgICAgVE9QX1dBTExFVFMuZm9yRWFjaCgodG9wV2FsbGV0KSA9PiB7XG4gICAgICAgIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmZvckVhY2goKGluc3RhbGxlZFdhbGxldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBpZiAodG9wV2FsbGV0ID09PSBpbnN0YWxsZWRXYWxsZXQubmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgd2FsbGV0VG9QdXNoID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wdXNoKHdhbGxldFRvUHVzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBoaWdobGlnaHQucHVzaCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAxKSk7XG4gICAgICBjb25zb2xlLmxvZyhoaWdobGlnaHQpO1xuICAgICAgY29uc29sZS5sb2coZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQpO1xuICAgICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoKSk7XG5cbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ0luc3RhbGxlZCcsIGhpZ2hsaWdodCwgb3RoZXJzIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMubG9hZGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IGZpbHRlcmVkQWRhcHRlcnMucmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnT25ib2FyZGluZycsXG4gICAgICAgIGhpZ2hsaWdodDogW10sXG4gICAgICAgIG90aGVyczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0YCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */"]
  }, jsx("div", {
    css: _ref$2
  }, jsx("img", {
    src: SfmLogo,
    alt: "logo"
  }), jsx("div", {
    css: _ref2$2
  }, jsx("span", {
    css: _ref3$2
  }, t(`Connect Wallet`))), jsx("div", {
    css: ["margin-top:0.25rem;font-size:0.875rem;line-height:1.25rem;font-weight:600;", styles$1.subtitle[theme], process.env.NODE_ENV === "production" ? "" : ";label:Header;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE4RGEiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NvbGxhcHNlJztcbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4uL1VuaWZpZWRXYWxsZXRNb2RhbC9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvT25ib2FyZGluZyc7XG5pbXBvcnQgeyBTZm1Mb2dvIH0gZnJvbSAnLi9TZm1Mb2dvJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1saWdodC0xMDAgdGV4dC1ncmV5LTcwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1kYXJrLTcwMCB0ZXh0LWdyZXktNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF0sXG4gIH0sXG59O1xuXG5jb25zdCBIZWFkZXI6IFJlYWN0LkZDPHsgb25DbG9zZTogKCkgPT4gdm9pZCB9PiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YHB4LTUgcHktNiBmbGV4IGZsZXgtcm93IGp1c3RpZnktY2VudGVyIGAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPGltZyBzcmM9e1NmbUxvZ299IGFsdD1cImxvZ29cIiAvPlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhsIC1tdC0xMFwiPlxuICAgICAgICAgIDxzcGFuIGNzcz17W3R3YHRleHQtdHJhbnNwYXJlbnQgYmctY2xpcC10ZXh0IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYF19PlxuICAgICAgICAgICAge3QoYENvbm5lY3QgV2FsbGV0YCl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXNtIG10LTEgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICA8c3Bhbj57dChgQ29ubmVjdCBhIHdhbGxldCB0byBwcm9jZWVkYCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8YnV0dG9uIHR3PVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNFwiIG9uQ2xpY2s9e29uQ2xvc2V9PlxuICAgICAgICA8Q2xvc2VJY29uIHdpZHRoPXsxMn0gaGVpZ2h0PXsxMn0gLz5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgTGlzdE9mV2FsbGV0czogUmVhY3QuRkM8e1xuICBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH07XG4gIG9uVG9nZ2xlOiAobmV4dFZhbHVlPzogYW55KSA9PiB2b2lkO1xuICBpc09wZW46IGJvb2xlYW47XG59PiA9ICh7IGxpc3QsIG9uVG9nZ2xlLCBpc09wZW4gfSkgPT4ge1xuICBjb25zdCB7IGhhbmRsZUNvbm5lY3RDbGljaywgd2FsbGV0bGlzdEV4cGxhbmF0aW9uLCB3YWxsZXRBdHRhY2htZW50cywgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3Nob3dPbmJvYXJkaW5nLCBzZXRTaG93T25ib2FyZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzaG93Tm90SW5zdGFsbGVkLCBzZXRTaG93Tm90SW5zdGFsbGVkXSA9IHVzZVN0YXRlPEFkYXB0ZXIgfCBmYWxzZT4oZmFsc2UpO1xuXG4gIGNvbnN0IG9uQ2xpY2tXYWxsZXQgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTEVsZW1lbnQsIE1vdXNlRXZlbnQ+LCBhZGFwdGVyOiBBZGFwdGVyKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChhZGFwdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFuZGxlQ29ubmVjdENsaWNrKGV2ZW50LCBhZGFwdGVyKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHJlbmRlcldhbGxldExpc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGdyaWQgZ2FwLTIgZ3JpZC1jb2xzLTIgcGItNFwiIHRyYW5zbGF0ZT1cIm5vXCI+XG4gICAgICAgICAge2xpc3Qub3RoZXJzLm1hcCgoYWRhcHRlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDx1bCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICA8V2FsbGV0TGlzdEl0ZW0gaGFuZGxlQ2xpY2s9eyhlKSA9PiBvbkNsaWNrV2FsbGV0KGUsIGFkYXB0ZXIpfSB3YWxsZXQ9e2FkYXB0ZXJ9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSAhPT0gJ09uYm9hcmRpbmcnICYmIHdhbGxldGxpc3RFeHBsYW5hdGlvbiA/IChcbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YHRleHQteHMgZm9udC1zZW1pYm9sZCB1bmRlcmxpbmUgdGV4dC1jZW50ZXJgLCBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gdHdgbWItOGAgOiAnJ119PlxuICAgICAgICAgICAgPGEgaHJlZj17d2FsbGV0bGlzdEV4cGxhbmF0aW9uLmhyZWZ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoYENhbid0IGZpbmQgeW91ciB3YWxsZXQ/YCl9PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICksXG4gICAgW2hhbmRsZUNvbm5lY3RDbGljaywgbGlzdC5vdGhlcnNdLFxuICApO1xuXG4gIGNvbnN0IGhhc05vV2FsbGV0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0LmhpZ2hsaWdodC5sZW5ndGggPT09IDAgJiYgbGlzdC5vdGhlcnMubGVuZ3RoID09PSAwO1xuICB9LCBbbGlzdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGhhc05vV2FsbGV0cykge1xuICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgfVxuICB9LCBbaGFzTm9XYWxsZXRzXSk7XG5cbiAgaWYgKHNob3dPbmJvYXJkaW5nKSB7XG4gICAgcmV0dXJuIDxPbmJvYXJkaW5nRmxvdyBzaG93QmFjaz17IWhhc05vV2FsbGV0c30gb25DbG9zZT17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcoZmFsc2UpfSAvPjtcbiAgfVxuXG4gIGlmIChzaG93Tm90SW5zdGFsbGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxOb3RJbnN0YWxsZWRcbiAgICAgICAgYWRhcHRlcj17c2hvd05vdEluc3RhbGxlZH1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSl9XG4gICAgICAgIG9uR29PbmJvYXJkaW5nPXsoKSA9PiB7XG4gICAgICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGVTY3JvbGxiYXJcIiBjc3M9e1t0d2BoLWZ1bGwgb3ZlcmZsb3cteS1hdXRvIHB0LTMgcGItOCBweC01IHJlbGF0aXZlYCwgaXNPcGVuICYmIHR3YG1iLTdgXX0+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTBcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BwLVsxcHhdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmctZ3JhZGllbnQtdG8tciBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgLy8gc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC0yIGZsZXggZmxleC1jb2wgc3BhY2UteS0yIFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWAsXG4gICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezMwfSBoZWlnaHQ9ezMwfSAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LWxnIG1sLTQgbGc6bWwtMlwiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXtvblRvZ2dsZX0+XG4gICAgICAgICAgICAgIDxzcGFuIHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtZ3JleS01MDBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSBvcHRpb25zYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPENvbGxhcHNlIGhlaWdodD17MH0gbWF4SGVpZ2h0PXsnYXV0byd9IGV4cGFuZGVkPXtpc09wZW59PlxuICAgICAgICAgICAgICB7cmVuZGVyV2FsbGV0TGlzdH1cbiAgICAgICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICAgICAgPC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXhzIGZsZXgganVzdGlmeS1jZW50ZXIgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHVuZGVybGluZSBjdXJzb3ItcG9pbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBCb3R0b20gU2hhZGVzICovfVxuICAgICAge2lzT3BlbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICAgIDwvPlxuICAgICAgKSA6IG51bGx9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdDb2luYmFzZSBXYWxsZXQnIGFzIFdhbGxldE5hbWU8J0NvaW5iYXNlIFdhbGxldCc+LFxuICAnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz4sXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkgJiYgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIHNpbmNlIENvaW5iYXNlIFdhbGxldCBoYXMgdHdvIGFkYXB0ZXJzIGR1cGxpY2F0ZVxuICAgICAgICAgIGlmIChhY2MucmVjb21tZW5kZWRXYWxsZXRzLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0Lm5hbWUgPT09IGFkYXB0ZXJOYW1lKSkgcmV0dXJuIGFjYztcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zb2xlLmxvZyhyZWNvbW1lbmRlZFdhbGxldHMpO1xuICAgICAgLy8gU29ydCB0aGUgaW5zdGFsbGVkIHdhbGxldHMgYWNjb3JkaW5nIHRvIHRoZSB0b3Agd2FsbGV0cyB0aGF0IHdlIHdhbnQgdG8gc2hvdyB0byB0aGUgdXNlciBmaXJzdFxuICAgICAgY29uc3QgaGlnaGxpZ2h0OiBBZGFwdGVyW10gPSBbXTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBpbnN0YWxsZWQgd2FsbGV0IGFkYXB0ZXJzIGFuZCBjaGVjayBpZiB0aGV5IGFyZSBpbiB0aGUgdG9wIHdhbGxldHMgbGlzdFxuICAgICAgLy8gSWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXQgbGlzdCwgd2Ugd2lsbCBhZGQgaXQgdG8gdGhlIGZpbHRlcmVkIHJlY29tbWVuZGUgd2FsbGV0c1xuICAgICAgVE9QX1dBTExFVFMuZm9yRWFjaCgodG9wV2FsbGV0KSA9PiB7XG4gICAgICAgIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmZvckVhY2goKGluc3RhbGxlZFdhbGxldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBpZiAodG9wV2FsbGV0ID09PSBpbnN0YWxsZWRXYWxsZXQubmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgd2FsbGV0VG9QdXNoID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wdXNoKHdhbGxldFRvUHVzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBoaWdobGlnaHQucHVzaCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAxKSk7XG4gICAgICBjb25zb2xlLmxvZyhoaWdobGlnaHQpO1xuICAgICAgY29uc29sZS5sb2coZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQpO1xuICAgICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoKSk7XG5cbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ0luc3RhbGxlZCcsIGhpZ2hsaWdodCwgb3RoZXJzIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMubG9hZGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IGZpbHRlcmVkQWRhcHRlcnMucmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnT25ib2FyZGluZycsXG4gICAgICAgIGhpZ2hsaWdodDogW10sXG4gICAgICAgIG90aGVyczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0YCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:Header;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE4RGEiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NvbGxhcHNlJztcbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4uL1VuaWZpZWRXYWxsZXRNb2RhbC9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvT25ib2FyZGluZyc7XG5pbXBvcnQgeyBTZm1Mb2dvIH0gZnJvbSAnLi9TZm1Mb2dvJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1saWdodC0xMDAgdGV4dC1ncmV5LTcwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1kYXJrLTcwMCB0ZXh0LWdyZXktNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF0sXG4gIH0sXG59O1xuXG5jb25zdCBIZWFkZXI6IFJlYWN0LkZDPHsgb25DbG9zZTogKCkgPT4gdm9pZCB9PiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YHB4LTUgcHktNiBmbGV4IGZsZXgtcm93IGp1c3RpZnktY2VudGVyIGAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPGltZyBzcmM9e1NmbUxvZ299IGFsdD1cImxvZ29cIiAvPlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhsIC1tdC0xMFwiPlxuICAgICAgICAgIDxzcGFuIGNzcz17W3R3YHRleHQtdHJhbnNwYXJlbnQgYmctY2xpcC10ZXh0IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYF19PlxuICAgICAgICAgICAge3QoYENvbm5lY3QgV2FsbGV0YCl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXNtIG10LTEgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICA8c3Bhbj57dChgQ29ubmVjdCBhIHdhbGxldCB0byBwcm9jZWVkYCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8YnV0dG9uIHR3PVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNFwiIG9uQ2xpY2s9e29uQ2xvc2V9PlxuICAgICAgICA8Q2xvc2VJY29uIHdpZHRoPXsxMn0gaGVpZ2h0PXsxMn0gLz5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgTGlzdE9mV2FsbGV0czogUmVhY3QuRkM8e1xuICBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH07XG4gIG9uVG9nZ2xlOiAobmV4dFZhbHVlPzogYW55KSA9PiB2b2lkO1xuICBpc09wZW46IGJvb2xlYW47XG59PiA9ICh7IGxpc3QsIG9uVG9nZ2xlLCBpc09wZW4gfSkgPT4ge1xuICBjb25zdCB7IGhhbmRsZUNvbm5lY3RDbGljaywgd2FsbGV0bGlzdEV4cGxhbmF0aW9uLCB3YWxsZXRBdHRhY2htZW50cywgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3Nob3dPbmJvYXJkaW5nLCBzZXRTaG93T25ib2FyZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzaG93Tm90SW5zdGFsbGVkLCBzZXRTaG93Tm90SW5zdGFsbGVkXSA9IHVzZVN0YXRlPEFkYXB0ZXIgfCBmYWxzZT4oZmFsc2UpO1xuXG4gIGNvbnN0IG9uQ2xpY2tXYWxsZXQgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTEVsZW1lbnQsIE1vdXNlRXZlbnQ+LCBhZGFwdGVyOiBBZGFwdGVyKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChhZGFwdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFuZGxlQ29ubmVjdENsaWNrKGV2ZW50LCBhZGFwdGVyKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHJlbmRlcldhbGxldExpc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGdyaWQgZ2FwLTIgZ3JpZC1jb2xzLTIgcGItNFwiIHRyYW5zbGF0ZT1cIm5vXCI+XG4gICAgICAgICAge2xpc3Qub3RoZXJzLm1hcCgoYWRhcHRlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDx1bCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICA8V2FsbGV0TGlzdEl0ZW0gaGFuZGxlQ2xpY2s9eyhlKSA9PiBvbkNsaWNrV2FsbGV0KGUsIGFkYXB0ZXIpfSB3YWxsZXQ9e2FkYXB0ZXJ9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSAhPT0gJ09uYm9hcmRpbmcnICYmIHdhbGxldGxpc3RFeHBsYW5hdGlvbiA/IChcbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YHRleHQteHMgZm9udC1zZW1pYm9sZCB1bmRlcmxpbmUgdGV4dC1jZW50ZXJgLCBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gdHdgbWItOGAgOiAnJ119PlxuICAgICAgICAgICAgPGEgaHJlZj17d2FsbGV0bGlzdEV4cGxhbmF0aW9uLmhyZWZ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoYENhbid0IGZpbmQgeW91ciB3YWxsZXQ/YCl9PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICksXG4gICAgW2hhbmRsZUNvbm5lY3RDbGljaywgbGlzdC5vdGhlcnNdLFxuICApO1xuXG4gIGNvbnN0IGhhc05vV2FsbGV0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0LmhpZ2hsaWdodC5sZW5ndGggPT09IDAgJiYgbGlzdC5vdGhlcnMubGVuZ3RoID09PSAwO1xuICB9LCBbbGlzdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGhhc05vV2FsbGV0cykge1xuICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgfVxuICB9LCBbaGFzTm9XYWxsZXRzXSk7XG5cbiAgaWYgKHNob3dPbmJvYXJkaW5nKSB7XG4gICAgcmV0dXJuIDxPbmJvYXJkaW5nRmxvdyBzaG93QmFjaz17IWhhc05vV2FsbGV0c30gb25DbG9zZT17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcoZmFsc2UpfSAvPjtcbiAgfVxuXG4gIGlmIChzaG93Tm90SW5zdGFsbGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxOb3RJbnN0YWxsZWRcbiAgICAgICAgYWRhcHRlcj17c2hvd05vdEluc3RhbGxlZH1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSl9XG4gICAgICAgIG9uR29PbmJvYXJkaW5nPXsoKSA9PiB7XG4gICAgICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGVTY3JvbGxiYXJcIiBjc3M9e1t0d2BoLWZ1bGwgb3ZlcmZsb3cteS1hdXRvIHB0LTMgcGItOCBweC01IHJlbGF0aXZlYCwgaXNPcGVuICYmIHR3YG1iLTdgXX0+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTBcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BwLVsxcHhdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmctZ3JhZGllbnQtdG8tciBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgLy8gc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC0yIGZsZXggZmxleC1jb2wgc3BhY2UteS0yIFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWAsXG4gICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezMwfSBoZWlnaHQ9ezMwfSAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LWxnIG1sLTQgbGc6bWwtMlwiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXtvblRvZ2dsZX0+XG4gICAgICAgICAgICAgIDxzcGFuIHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtZ3JleS01MDBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSBvcHRpb25zYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPENvbGxhcHNlIGhlaWdodD17MH0gbWF4SGVpZ2h0PXsnYXV0byd9IGV4cGFuZGVkPXtpc09wZW59PlxuICAgICAgICAgICAgICB7cmVuZGVyV2FsbGV0TGlzdH1cbiAgICAgICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICAgICAgPC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXhzIGZsZXgganVzdGlmeS1jZW50ZXIgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHVuZGVybGluZSBjdXJzb3ItcG9pbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBCb3R0b20gU2hhZGVzICovfVxuICAgICAge2lzT3BlbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICAgIDwvPlxuICAgICAgKSA6IG51bGx9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdDb2luYmFzZSBXYWxsZXQnIGFzIFdhbGxldE5hbWU8J0NvaW5iYXNlIFdhbGxldCc+LFxuICAnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz4sXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkgJiYgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIHNpbmNlIENvaW5iYXNlIFdhbGxldCBoYXMgdHdvIGFkYXB0ZXJzIGR1cGxpY2F0ZVxuICAgICAgICAgIGlmIChhY2MucmVjb21tZW5kZWRXYWxsZXRzLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0Lm5hbWUgPT09IGFkYXB0ZXJOYW1lKSkgcmV0dXJuIGFjYztcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zb2xlLmxvZyhyZWNvbW1lbmRlZFdhbGxldHMpO1xuICAgICAgLy8gU29ydCB0aGUgaW5zdGFsbGVkIHdhbGxldHMgYWNjb3JkaW5nIHRvIHRoZSB0b3Agd2FsbGV0cyB0aGF0IHdlIHdhbnQgdG8gc2hvdyB0byB0aGUgdXNlciBmaXJzdFxuICAgICAgY29uc3QgaGlnaGxpZ2h0OiBBZGFwdGVyW10gPSBbXTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBpbnN0YWxsZWQgd2FsbGV0IGFkYXB0ZXJzIGFuZCBjaGVjayBpZiB0aGV5IGFyZSBpbiB0aGUgdG9wIHdhbGxldHMgbGlzdFxuICAgICAgLy8gSWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXQgbGlzdCwgd2Ugd2lsbCBhZGQgaXQgdG8gdGhlIGZpbHRlcmVkIHJlY29tbWVuZGUgd2FsbGV0c1xuICAgICAgVE9QX1dBTExFVFMuZm9yRWFjaCgodG9wV2FsbGV0KSA9PiB7XG4gICAgICAgIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmZvckVhY2goKGluc3RhbGxlZFdhbGxldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBpZiAodG9wV2FsbGV0ID09PSBpbnN0YWxsZWRXYWxsZXQubmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgd2FsbGV0VG9QdXNoID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wdXNoKHdhbGxldFRvUHVzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBoaWdobGlnaHQucHVzaCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAxKSk7XG4gICAgICBjb25zb2xlLmxvZyhoaWdobGlnaHQpO1xuICAgICAgY29uc29sZS5sb2coZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQpO1xuICAgICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoKSk7XG5cbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ0luc3RhbGxlZCcsIGhpZ2hsaWdodCwgb3RoZXJzIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMubG9hZGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IGZpbHRlcmVkQWRhcHRlcnMucmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnT25ib2FyZGluZycsXG4gICAgICAgIGhpZ2hsaWdodDogW10sXG4gICAgICAgIG90aGVyczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0YCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */"]
  }, jsx("span", null, t(`Connect a wallet to proceed`)))), jsx("button", {
    css: _ref4$1,
    onClick: onClose
  }, jsx(CloseIcon$1, {
    width: 12,
    height: 12
  })));
};
var _ref5 = process.env.NODE_ENV === "production" ? {
  name: "1rigx3j",
  styles: "margin-top:1rem;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:0.5rem;padding-bottom:1rem"
} : {
  name: "1i8hhfs-renderWalletList",
  styles: "margin-top:1rem;display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:0.5rem;padding-bottom:1rem;label:renderWalletList;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref6 = process.env.NODE_ENV === "production" ? {
  name: "18u6ey2",
  styles: "margin-top:1rem;display:flex;flex-direction:column;> :not([hidden]) ~ :not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse));}@media (min-width: 1024px){flex-direction:row;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.5rem * var(--tw-space-x-reverse));margin-left:calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));--tw-space-y-reverse:0;margin-top:calc(0px * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0px * var(--tw-space-y-reverse));}}"
} : {
  name: "qgikbw-ListOfWallets",
  styles: "margin-top:1rem;display:flex;flex-direction:column;> :not([hidden]) ~ :not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse));}@media (min-width: 1024px){flex-direction:row;> :not([hidden]) ~ :not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.5rem * var(--tw-space-x-reverse));margin-left:calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));--tw-space-y-reverse:0;margin-top:calc(0px * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0px * var(--tw-space-y-reverse));}};label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref7 = process.env.NODE_ENV === "production" ? {
  name: "n0vm89",
  styles: "display:flex;width:100%;flex:1 1 0%;cursor:pointer;align-items:center;border-radius:0.5rem;border-width:1px;border-color:rgb(255 255 255 / 0.1);padding:1px;@media (min-width: 1024px){justify-content:center;}transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;:hover{--tw-backdrop-blur:blur(24px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);}--tw-gradient-from:#8057FF var(--tw-gradient-from-position);--tw-gradient-to:#D84E76 var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to);:hover{background-image:linear-gradient(to right, var(--tw-gradient-stops));}"
} : {
  name: "r5ygbe-ListOfWallets",
  styles: "display:flex;width:100%;flex:1 1 0%;cursor:pointer;align-items:center;border-radius:0.5rem;border-width:1px;border-color:rgb(255 255 255 / 0.1);padding:1px;@media (min-width: 1024px){justify-content:center;}transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;:hover{--tw-backdrop-blur:blur(24px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);}--tw-gradient-from:#8057FF var(--tw-gradient-from-position);--tw-gradient-to:#D84E76 var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to);:hover{background-image:linear-gradient(to right, var(--tw-gradient-stops));};label:ListOfWallets;",
  map: "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFtS2dCIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcbmltcG9ydCB7IFdhbGxldEljb24sIFdhbGxldExpc3RJdGVtIH0gZnJvbSAnLi9XYWxsZXRMaXN0SXRlbSc7XG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENsb3NlSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DbG9zZUljb24nO1xuaW1wb3J0IHsgaXNNb2JpbGUsIHVzZU91dHNpZGVDbGljayB9IGZyb20gJy4uLy4uL21pc2MvdXRpbHMnO1xuaW1wb3J0IE5vdEluc3RhbGxlZCBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi4vVW5pZmllZFdhbGxldE1vZGFsL09uYm9hcmRpbmcnO1xuaW1wb3J0IHsgU2ZtTG9nbyB9IGZyb20gJy4vU2ZtTG9nbyc7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUgYmctW3JnYig0OSwgNjIsIDc2KV1gXSxcbiAgfSxcbiAgc2hhZGVzOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyNmZmZmZmZdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjM0EzQjQzXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bcmdiKDQ5LCA2MiwgNzYpXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gIH0sXG4gIHdhbGxldEl0ZW06IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYXktNTAgaG92ZXI6c2hhZG93LWxnYF0sXG4gICAgZGFyazogW3R3YGJnLWRhcmstNzAwIGhvdmVyOnNoYWRvdy0yeGxgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICB9LFxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBmbGV4LXJvdyBqdXN0aWZ5LWNlbnRlciBgLCBzdHlsZXMuaGVhZGVyW3RoZW1lXV19PlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPXtTZm1Mb2dvfSBhbHQ9XCJsb2dvXCIgLz5cbiAgICAgICAgPGRpdiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14bCAtbXQtMTBcIj5cbiAgICAgICAgICA8c3BhbiBjc3M9e1t0d2B0ZXh0LXRyYW5zcGFyZW50IGJnLWNsaXAtdGV4dCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWBdfT5cbiAgICAgICAgICAgIHt0KGBDb25uZWN0IFdhbGxldGApfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC1zbSBtdC0xIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgYSB3YWxsZXQgdG8gcHJvY2VlZGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lIHRleHQtY2VudGVyYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QucmVjb21tZW5kZWRXYWxsZXRzLm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgICAgICAgICAgIC8vIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQtbGcgbWwtNCBsZzptbC0yXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHthdHRhY2htZW50ID8gPGRpdj57YXR0YWNobWVudH08L2Rpdj4gOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtMiBmbGV4IGZsZXgtY29sIHNwYWNlLXktMiBcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHQubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHAtWzFweF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmFja2Ryb3AtYmx1ci14bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiZy1ncmFkaWVudC10by1yICBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWdyZXktNTAwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3QoYE1vcmUgb3B0aW9uc2ApfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgdGV4dC14cyBmbGV4IGp1c3RpZnktY2VudGVyIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdLFxuICAgICAgICAgIF19XG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyh0cnVlKX0+XG4gICAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqL31cbiAgICAgIHtpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgICA8Lz5cbiAgICAgICkgOiBudWxsfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnQ29pbmJhc2UgV2FsbGV0JyBhcyBXYWxsZXROYW1lPCdDb2luYmFzZSBXYWxsZXQnPixcbiAgJ0JhY2twYWNrJyBhcyBXYWxsZXROYW1lPCdCYWNrcGFjayc+LFxuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuXTtcblxuaW50ZXJmYWNlIElVbmlmaWVkV2FsbGV0TW9kYWwge1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBzb3J0QnlQcmVjZWRlbmNlID0gKHdhbGxldFByZWNlZGVuY2U6IFdhbGxldE5hbWVbXSkgPT4gKGE6IEFkYXB0ZXIsIGI6IEFkYXB0ZXIpID0+IHtcbiAgaWYgKCF3YWxsZXRQcmVjZWRlbmNlKSByZXR1cm4gMDtcblxuICBjb25zdCBhSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYS5uYW1lKTtcbiAgY29uc3QgYkluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGIubmFtZSk7XG5cbiAgaWYgKGFJbmRleCA9PT0gLTEgJiYgYkluZGV4ID09PSAtMSkgcmV0dXJuIDA7XG4gIGlmIChhSW5kZXggPj0gMCkge1xuICAgIGlmIChiSW5kZXggPT09IC0xKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgfVxuXG4gIGlmIChiSW5kZXggPj0gMCkge1xuICAgIGlmIChhSW5kZXggPT09IC0xKSByZXR1cm4gMTtcbiAgICByZXR1cm4gYkluZGV4IC0gYUluZGV4O1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuY29uc3QgU2ZtVW5pZmllZFdhbGxldE1vZGFsOiBSZWFjdC5GQzxJVW5pZmllZFdhbGxldE1vZGFsPiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHdhbGxldHMgfSA9IHVzZVVuaWZpZWRXYWxsZXQoKTtcbiAgY29uc3QgeyB3YWxsZXRQcmVjZWRlbmNlLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgW2lzT3Blbiwgb25Ub2dnbGVdID0gdXNlVG9nZ2xlKGZhbHNlKTtcbiAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZCA9IHVzZVByZXZpb3VzbHlDb25uZWN0ZWQoKTtcblxuICBjb25zdCBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH0gPSB1c2VNZW1vKCgpID0+IHtcbiAgICAvLyBUaGVuLCBJbnN0YWxsZWQsIFRvcCAzLCBMb2FkYWJsZSwgTm90RGV0ZWN0ZWRcbiAgICBjb25zdCBmaWx0ZXJlZEFkYXB0ZXJzID0gd2FsbGV0cy5yZWR1Y2U8e1xuICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogQWRhcHRlcltdO1xuICAgICAgaW5zdGFsbGVkOiBBZGFwdGVyW107XG4gICAgICB0b3AzOiBBZGFwdGVyW107XG4gICAgICBsb2FkYWJsZTogQWRhcHRlcltdO1xuICAgICAgbm90RGV0ZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIH0+KFxuICAgICAgKGFjYywgd2FsbGV0KSA9PiB7XG4gICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gd2FsbGV0LmFkYXB0ZXIubmFtZTtcblxuICAgICAgICBpZiAoUkVDT01NRU5ERURfV0FMTEVUUy5zb21lKCh3YWxsZXQpID0+IHdhbGxldCA9PT0gYWRhcHRlck5hbWUpICYmIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgZHVwbGljYXRlcyBzaW5jZSBDb2luYmFzZSBXYWxsZXQgaGFzIHR3byBhZGFwdGVycyBkdXBsaWNhdGVcbiAgICAgICAgICBpZiAoYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5zb21lKCh3YWxsZXQpID0+IHdhbGxldC5uYW1lID09PSBhZGFwdGVyTmFtZSkpIHJldHVybiBhY2M7XG4gICAgICAgICAgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmlvdXNseSBjb25uZWN0ZWQgdGFrZXMgaGlnaGVzdFxuICAgICAgICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPSBwcmV2aW91c2x5Q29ubmVjdGVkLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAocHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MucHJldmlvdXNseUNvbm5lY3RlZFtwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGVuIEluc3RhbGxlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgYWNjLmluc3RhbGxlZC5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRvcCAzXG4gICAgICAgIGNvbnN0IHRvcFdhbGxldHNJbmRleCA9IFRPUF9XQUxMRVRTLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAodG9wV2FsbGV0c0luZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MudG9wM1t0b3BXYWxsZXRzSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBMb2FkYWJsZVxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTG9hZGFibGUpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBOb3REZXRlY3RlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBbXSxcbiAgICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogW10sXG4gICAgICAgIGluc3RhbGxlZDogW10sXG4gICAgICAgIHRvcDM6IFtdLFxuICAgICAgICBsb2FkYWJsZTogW10sXG4gICAgICAgIG5vdERldGVjdGVkOiBbXSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG5cbiAgICAgIGNvbnN0IGhpZ2hsaWdodCA9IGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgwLCAzKTtcbiAgICAgIGxldCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMywgZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCkpO1xuICAgICAgb3RoZXJzID0gb3RoZXJzLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnUHJldmlvdXNseUNvbm5lY3RlZCcsXG4gICAgICAgIGhpZ2hsaWdodCxcbiAgICAgICAgb3RoZXJzLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIGluc3RhbGxlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc29sZS5sb2cocmVjb21tZW5kZWRXYWxsZXRzKTtcbiAgICAgIC8vIFNvcnQgdGhlIGluc3RhbGxlZCB3YWxsZXRzIGFjY29yZGluZyB0byB0aGUgdG9wIHdhbGxldHMgdGhhdCB3ZSB3YW50IHRvIHNob3cgdG8gdGhlIHVzZXIgZmlyc3RcbiAgICAgIGNvbnN0IGhpZ2hsaWdodDogQWRhcHRlcltdID0gW107XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgaW5zdGFsbGVkIHdhbGxldCBhZGFwdGVycyBhbmQgY2hlY2sgaWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXRzIGxpc3RcbiAgICAgIC8vIElmIHRoZXkgYXJlIGluIHRoZSB0b3Agd2FsbGV0IGxpc3QsIHdlIHdpbGwgYWRkIGl0IHRvIHRoZSBmaWx0ZXJlZCByZWNvbW1lbmRlIHdhbGxldHNcbiAgICAgIFRPUF9XQUxMRVRTLmZvckVhY2goKHRvcFdhbGxldCkgPT4ge1xuICAgICAgICBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5mb3JFYWNoKChpbnN0YWxsZWRXYWxsZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKHRvcFdhbGxldCA9PT0gaW5zdGFsbGVkV2FsbGV0Lm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhbGxldFRvUHVzaCA9IGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgICAgICAgICBoaWdobGlnaHQucHVzaCh3YWxsZXRUb1B1c2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gaGlnaGxpZ2h0LnB1c2goLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMSkpO1xuICAgICAgY29uc29sZS5sb2coaGlnaGxpZ2h0KTtcbiAgICAgIGNvbnNvbGUubG9nKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDAsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLFxuICAgICAgICBoaWdobGlnaHQ6IFtdLFxuICAgICAgICBvdGhlcnM6IFtdLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgdG9wMywgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcbiAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAuZmxhdCgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnVG9wV2FsbGV0JywgaGlnaGxpZ2h0OiB0b3AzLCBvdGhlcnMgfTtcbiAgfSwgW3dhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWRdKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgdXNlT3V0c2lkZUNsaWNrKGNvbnRlbnRSZWYsIG9uQ2xvc2UpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbXG4gICAgICAgIHR3YG1heC13LW1kIHctZnVsbCByZWxhdGl2ZSBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLXhsIHRyYW5zaXRpb24taGVpZ2h0IGR1cmF0aW9uLTUwMCBlYXNlLWluLW91dGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8TGlzdE9mV2FsbGV0cyBsaXN0PXtsaXN0fSBvblRvZ2dsZT17b25Ub2dnbGV9IGlzT3Blbj17aXNPcGVufSAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2ZtVW5pZmllZFdhbGxldE1vZGFsO1xuIl19 */",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref8 = process.env.NODE_ENV === "production" ? {
  name: "wm7wr2",
  styles: "margin-left:1rem;font-size:1.25rem;line-height:1.75rem;font-weight:600;@media (min-width: 1024px){margin-left:0.5rem;}"
} : {
  name: "1oklruw-ListOfWallets",
  styles: "margin-left:1rem;font-size:1.25rem;line-height:1.75rem;font-weight:600;@media (min-width: 1024px){margin-left:0.5rem;};label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref9 = process.env.NODE_ENV === "production" ? {
  name: "sunj27",
  styles: "margin-top:0.5rem;display:flex;flex-direction:column;> :not([hidden]) ~ :not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse));}"
} : {
  name: "44dc0n-ListOfWallets",
  styles: "margin-top:0.5rem;display:flex;flex-direction:column;> :not([hidden]) ~ :not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse));};label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref10 = process.env.NODE_ENV === "production" ? {
  name: "wm7wr2",
  styles: "margin-left:1rem;font-size:1.25rem;line-height:1.75rem;font-weight:600;@media (min-width: 1024px){margin-left:0.5rem;}"
} : {
  name: "1oklruw-ListOfWallets",
  styles: "margin-left:1rem;font-size:1.25rem;line-height:1.75rem;font-weight:600;@media (min-width: 1024px){margin-left:0.5rem;};label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref11 = process.env.NODE_ENV === "production" ? {
  name: "ms0594",
  styles: "margin-bottom:-0.5rem;margin-top:1rem;cursor:pointer;font-size:0.75rem;line-height:1rem;font-weight:600;color:rgb(255 255 255 / 0.8);text-decoration-line:underline"
} : {
  name: "102cyhe-ListOfWallets",
  styles: "margin-bottom:-0.5rem;margin-top:1rem;cursor:pointer;font-size:0.75rem;line-height:1rem;font-weight:600;color:rgb(255 255 255 / 0.8);text-decoration-line:underline;label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref12 = process.env.NODE_ENV === "production" ? {
  name: "1hzqlhs",
  styles: "margin-top:1.25rem;display:flex;cursor:pointer;justify-content:center"
} : {
  name: "prrvht-ListOfWallets",
  styles: "margin-top:1.25rem;display:flex;cursor:pointer;justify-content:center;label:ListOfWallets;",
  toString: _EMOTION_STRINGIFIED_CSS_ERROR__$2
};
var _ref13 = process.env.NODE_ENV === "production" ? {
  name: "1gyclp5",
  styles: "font-size:0.75rem;line-height:1rem;font-weight:600;--tw-text-opacity:1;color:rgb(94 95 100 / var(--tw-text-opacity))"
} : {
  name: "1a481iv-ListOfWallets",
  styles: "font-size:0.75rem;line-height:1rem;font-weight:600;--tw-text-opacity:1;color:rgb(94 95 100 / var(--tw-text-opacity));label:ListOfWallets;",
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
    css: _ref5,
    translate: "no"
  }, list.others.map((adapter, index) => {
    return jsx("ul", {
      key: index
    }, jsx(WalletListItem, {
      handleClick: e => onClickWallet(e, adapter),
      wallet: adapter
    }));
  })), list.highlightedBy !== 'Onboarding' && walletlistExplanation ? jsx("div", {
    css: ["text-align:center;font-size:0.75rem;line-height:1rem;font-weight:600;text-decoration-line:underline;", list.others.length > 6 ? {
      "marginBottom": "2rem"
    } : '', process.env.NODE_ENV === "production" ? "" : ";label:renderWalletList;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE4R2UiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NvbGxhcHNlJztcbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4uL1VuaWZpZWRXYWxsZXRNb2RhbC9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvT25ib2FyZGluZyc7XG5pbXBvcnQgeyBTZm1Mb2dvIH0gZnJvbSAnLi9TZm1Mb2dvJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1saWdodC0xMDAgdGV4dC1ncmV5LTcwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1kYXJrLTcwMCB0ZXh0LWdyZXktNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF0sXG4gIH0sXG59O1xuXG5jb25zdCBIZWFkZXI6IFJlYWN0LkZDPHsgb25DbG9zZTogKCkgPT4gdm9pZCB9PiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YHB4LTUgcHktNiBmbGV4IGZsZXgtcm93IGp1c3RpZnktY2VudGVyIGAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPGltZyBzcmM9e1NmbUxvZ299IGFsdD1cImxvZ29cIiAvPlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhsIC1tdC0xMFwiPlxuICAgICAgICAgIDxzcGFuIGNzcz17W3R3YHRleHQtdHJhbnNwYXJlbnQgYmctY2xpcC10ZXh0IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYF19PlxuICAgICAgICAgICAge3QoYENvbm5lY3QgV2FsbGV0YCl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXNtIG10LTEgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICA8c3Bhbj57dChgQ29ubmVjdCBhIHdhbGxldCB0byBwcm9jZWVkYCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8YnV0dG9uIHR3PVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNFwiIG9uQ2xpY2s9e29uQ2xvc2V9PlxuICAgICAgICA8Q2xvc2VJY29uIHdpZHRoPXsxMn0gaGVpZ2h0PXsxMn0gLz5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgTGlzdE9mV2FsbGV0czogUmVhY3QuRkM8e1xuICBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH07XG4gIG9uVG9nZ2xlOiAobmV4dFZhbHVlPzogYW55KSA9PiB2b2lkO1xuICBpc09wZW46IGJvb2xlYW47XG59PiA9ICh7IGxpc3QsIG9uVG9nZ2xlLCBpc09wZW4gfSkgPT4ge1xuICBjb25zdCB7IGhhbmRsZUNvbm5lY3RDbGljaywgd2FsbGV0bGlzdEV4cGxhbmF0aW9uLCB3YWxsZXRBdHRhY2htZW50cywgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3Nob3dPbmJvYXJkaW5nLCBzZXRTaG93T25ib2FyZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzaG93Tm90SW5zdGFsbGVkLCBzZXRTaG93Tm90SW5zdGFsbGVkXSA9IHVzZVN0YXRlPEFkYXB0ZXIgfCBmYWxzZT4oZmFsc2UpO1xuXG4gIGNvbnN0IG9uQ2xpY2tXYWxsZXQgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTEVsZW1lbnQsIE1vdXNlRXZlbnQ+LCBhZGFwdGVyOiBBZGFwdGVyKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChhZGFwdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFuZGxlQ29ubmVjdENsaWNrKGV2ZW50LCBhZGFwdGVyKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHJlbmRlcldhbGxldExpc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGdyaWQgZ2FwLTIgZ3JpZC1jb2xzLTIgcGItNFwiIHRyYW5zbGF0ZT1cIm5vXCI+XG4gICAgICAgICAge2xpc3Qub3RoZXJzLm1hcCgoYWRhcHRlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDx1bCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICA8V2FsbGV0TGlzdEl0ZW0gaGFuZGxlQ2xpY2s9eyhlKSA9PiBvbkNsaWNrV2FsbGV0KGUsIGFkYXB0ZXIpfSB3YWxsZXQ9e2FkYXB0ZXJ9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSAhPT0gJ09uYm9hcmRpbmcnICYmIHdhbGxldGxpc3RFeHBsYW5hdGlvbiA/IChcbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YHRleHQteHMgZm9udC1zZW1pYm9sZCB1bmRlcmxpbmUgdGV4dC1jZW50ZXJgLCBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gdHdgbWItOGAgOiAnJ119PlxuICAgICAgICAgICAgPGEgaHJlZj17d2FsbGV0bGlzdEV4cGxhbmF0aW9uLmhyZWZ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoYENhbid0IGZpbmQgeW91ciB3YWxsZXQ/YCl9PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICksXG4gICAgW2hhbmRsZUNvbm5lY3RDbGljaywgbGlzdC5vdGhlcnNdLFxuICApO1xuXG4gIGNvbnN0IGhhc05vV2FsbGV0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0LmhpZ2hsaWdodC5sZW5ndGggPT09IDAgJiYgbGlzdC5vdGhlcnMubGVuZ3RoID09PSAwO1xuICB9LCBbbGlzdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGhhc05vV2FsbGV0cykge1xuICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgfVxuICB9LCBbaGFzTm9XYWxsZXRzXSk7XG5cbiAgaWYgKHNob3dPbmJvYXJkaW5nKSB7XG4gICAgcmV0dXJuIDxPbmJvYXJkaW5nRmxvdyBzaG93QmFjaz17IWhhc05vV2FsbGV0c30gb25DbG9zZT17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcoZmFsc2UpfSAvPjtcbiAgfVxuXG4gIGlmIChzaG93Tm90SW5zdGFsbGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxOb3RJbnN0YWxsZWRcbiAgICAgICAgYWRhcHRlcj17c2hvd05vdEluc3RhbGxlZH1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSl9XG4gICAgICAgIG9uR29PbmJvYXJkaW5nPXsoKSA9PiB7XG4gICAgICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGVTY3JvbGxiYXJcIiBjc3M9e1t0d2BoLWZ1bGwgb3ZlcmZsb3cteS1hdXRvIHB0LTMgcGItOCBweC01IHJlbGF0aXZlYCwgaXNPcGVuICYmIHR3YG1iLTdgXX0+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTBcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BwLVsxcHhdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmctZ3JhZGllbnQtdG8tciBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgLy8gc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC0yIGZsZXggZmxleC1jb2wgc3BhY2UteS0yIFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWAsXG4gICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezMwfSBoZWlnaHQ9ezMwfSAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LWxnIG1sLTQgbGc6bWwtMlwiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXtvblRvZ2dsZX0+XG4gICAgICAgICAgICAgIDxzcGFuIHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtZ3JleS01MDBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSBvcHRpb25zYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPENvbGxhcHNlIGhlaWdodD17MH0gbWF4SGVpZ2h0PXsnYXV0byd9IGV4cGFuZGVkPXtpc09wZW59PlxuICAgICAgICAgICAgICB7cmVuZGVyV2FsbGV0TGlzdH1cbiAgICAgICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICAgICAgPC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXhzIGZsZXgganVzdGlmeS1jZW50ZXIgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHVuZGVybGluZSBjdXJzb3ItcG9pbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBCb3R0b20gU2hhZGVzICovfVxuICAgICAge2lzT3BlbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICAgIDwvPlxuICAgICAgKSA6IG51bGx9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdDb2luYmFzZSBXYWxsZXQnIGFzIFdhbGxldE5hbWU8J0NvaW5iYXNlIFdhbGxldCc+LFxuICAnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz4sXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkgJiYgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIHNpbmNlIENvaW5iYXNlIFdhbGxldCBoYXMgdHdvIGFkYXB0ZXJzIGR1cGxpY2F0ZVxuICAgICAgICAgIGlmIChhY2MucmVjb21tZW5kZWRXYWxsZXRzLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0Lm5hbWUgPT09IGFkYXB0ZXJOYW1lKSkgcmV0dXJuIGFjYztcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zb2xlLmxvZyhyZWNvbW1lbmRlZFdhbGxldHMpO1xuICAgICAgLy8gU29ydCB0aGUgaW5zdGFsbGVkIHdhbGxldHMgYWNjb3JkaW5nIHRvIHRoZSB0b3Agd2FsbGV0cyB0aGF0IHdlIHdhbnQgdG8gc2hvdyB0byB0aGUgdXNlciBmaXJzdFxuICAgICAgY29uc3QgaGlnaGxpZ2h0OiBBZGFwdGVyW10gPSBbXTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBpbnN0YWxsZWQgd2FsbGV0IGFkYXB0ZXJzIGFuZCBjaGVjayBpZiB0aGV5IGFyZSBpbiB0aGUgdG9wIHdhbGxldHMgbGlzdFxuICAgICAgLy8gSWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXQgbGlzdCwgd2Ugd2lsbCBhZGQgaXQgdG8gdGhlIGZpbHRlcmVkIHJlY29tbWVuZGUgd2FsbGV0c1xuICAgICAgVE9QX1dBTExFVFMuZm9yRWFjaCgodG9wV2FsbGV0KSA9PiB7XG4gICAgICAgIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmZvckVhY2goKGluc3RhbGxlZFdhbGxldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBpZiAodG9wV2FsbGV0ID09PSBpbnN0YWxsZWRXYWxsZXQubmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgd2FsbGV0VG9QdXNoID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wdXNoKHdhbGxldFRvUHVzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBoaWdobGlnaHQucHVzaCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAxKSk7XG4gICAgICBjb25zb2xlLmxvZyhoaWdobGlnaHQpO1xuICAgICAgY29uc29sZS5sb2coZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQpO1xuICAgICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoKSk7XG5cbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ0luc3RhbGxlZCcsIGhpZ2hsaWdodCwgb3RoZXJzIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMubG9hZGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IGZpbHRlcmVkQWRhcHRlcnMucmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnT25ib2FyZGluZycsXG4gICAgICAgIGhpZ2hsaWdodDogW10sXG4gICAgICAgIG90aGVyczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0YCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:renderWalletList;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE4R2UiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NvbGxhcHNlJztcbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4uL1VuaWZpZWRXYWxsZXRNb2RhbC9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvT25ib2FyZGluZyc7XG5pbXBvcnQgeyBTZm1Mb2dvIH0gZnJvbSAnLi9TZm1Mb2dvJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1saWdodC0xMDAgdGV4dC1ncmV5LTcwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1kYXJrLTcwMCB0ZXh0LWdyZXktNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF0sXG4gIH0sXG59O1xuXG5jb25zdCBIZWFkZXI6IFJlYWN0LkZDPHsgb25DbG9zZTogKCkgPT4gdm9pZCB9PiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YHB4LTUgcHktNiBmbGV4IGZsZXgtcm93IGp1c3RpZnktY2VudGVyIGAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPGltZyBzcmM9e1NmbUxvZ299IGFsdD1cImxvZ29cIiAvPlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhsIC1tdC0xMFwiPlxuICAgICAgICAgIDxzcGFuIGNzcz17W3R3YHRleHQtdHJhbnNwYXJlbnQgYmctY2xpcC10ZXh0IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYF19PlxuICAgICAgICAgICAge3QoYENvbm5lY3QgV2FsbGV0YCl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXNtIG10LTEgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICA8c3Bhbj57dChgQ29ubmVjdCBhIHdhbGxldCB0byBwcm9jZWVkYCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8YnV0dG9uIHR3PVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNFwiIG9uQ2xpY2s9e29uQ2xvc2V9PlxuICAgICAgICA8Q2xvc2VJY29uIHdpZHRoPXsxMn0gaGVpZ2h0PXsxMn0gLz5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgTGlzdE9mV2FsbGV0czogUmVhY3QuRkM8e1xuICBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH07XG4gIG9uVG9nZ2xlOiAobmV4dFZhbHVlPzogYW55KSA9PiB2b2lkO1xuICBpc09wZW46IGJvb2xlYW47XG59PiA9ICh7IGxpc3QsIG9uVG9nZ2xlLCBpc09wZW4gfSkgPT4ge1xuICBjb25zdCB7IGhhbmRsZUNvbm5lY3RDbGljaywgd2FsbGV0bGlzdEV4cGxhbmF0aW9uLCB3YWxsZXRBdHRhY2htZW50cywgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3Nob3dPbmJvYXJkaW5nLCBzZXRTaG93T25ib2FyZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzaG93Tm90SW5zdGFsbGVkLCBzZXRTaG93Tm90SW5zdGFsbGVkXSA9IHVzZVN0YXRlPEFkYXB0ZXIgfCBmYWxzZT4oZmFsc2UpO1xuXG4gIGNvbnN0IG9uQ2xpY2tXYWxsZXQgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTEVsZW1lbnQsIE1vdXNlRXZlbnQ+LCBhZGFwdGVyOiBBZGFwdGVyKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChhZGFwdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFuZGxlQ29ubmVjdENsaWNrKGV2ZW50LCBhZGFwdGVyKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHJlbmRlcldhbGxldExpc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGdyaWQgZ2FwLTIgZ3JpZC1jb2xzLTIgcGItNFwiIHRyYW5zbGF0ZT1cIm5vXCI+XG4gICAgICAgICAge2xpc3Qub3RoZXJzLm1hcCgoYWRhcHRlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDx1bCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICA8V2FsbGV0TGlzdEl0ZW0gaGFuZGxlQ2xpY2s9eyhlKSA9PiBvbkNsaWNrV2FsbGV0KGUsIGFkYXB0ZXIpfSB3YWxsZXQ9e2FkYXB0ZXJ9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSAhPT0gJ09uYm9hcmRpbmcnICYmIHdhbGxldGxpc3RFeHBsYW5hdGlvbiA/IChcbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YHRleHQteHMgZm9udC1zZW1pYm9sZCB1bmRlcmxpbmUgdGV4dC1jZW50ZXJgLCBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gdHdgbWItOGAgOiAnJ119PlxuICAgICAgICAgICAgPGEgaHJlZj17d2FsbGV0bGlzdEV4cGxhbmF0aW9uLmhyZWZ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoYENhbid0IGZpbmQgeW91ciB3YWxsZXQ/YCl9PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICksXG4gICAgW2hhbmRsZUNvbm5lY3RDbGljaywgbGlzdC5vdGhlcnNdLFxuICApO1xuXG4gIGNvbnN0IGhhc05vV2FsbGV0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0LmhpZ2hsaWdodC5sZW5ndGggPT09IDAgJiYgbGlzdC5vdGhlcnMubGVuZ3RoID09PSAwO1xuICB9LCBbbGlzdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGhhc05vV2FsbGV0cykge1xuICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgfVxuICB9LCBbaGFzTm9XYWxsZXRzXSk7XG5cbiAgaWYgKHNob3dPbmJvYXJkaW5nKSB7XG4gICAgcmV0dXJuIDxPbmJvYXJkaW5nRmxvdyBzaG93QmFjaz17IWhhc05vV2FsbGV0c30gb25DbG9zZT17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcoZmFsc2UpfSAvPjtcbiAgfVxuXG4gIGlmIChzaG93Tm90SW5zdGFsbGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxOb3RJbnN0YWxsZWRcbiAgICAgICAgYWRhcHRlcj17c2hvd05vdEluc3RhbGxlZH1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSl9XG4gICAgICAgIG9uR29PbmJvYXJkaW5nPXsoKSA9PiB7XG4gICAgICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGVTY3JvbGxiYXJcIiBjc3M9e1t0d2BoLWZ1bGwgb3ZlcmZsb3cteS1hdXRvIHB0LTMgcGItOCBweC01IHJlbGF0aXZlYCwgaXNPcGVuICYmIHR3YG1iLTdgXX0+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTBcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BwLVsxcHhdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmctZ3JhZGllbnQtdG8tciBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgLy8gc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC0yIGZsZXggZmxleC1jb2wgc3BhY2UteS0yIFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWAsXG4gICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezMwfSBoZWlnaHQ9ezMwfSAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LWxnIG1sLTQgbGc6bWwtMlwiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXtvblRvZ2dsZX0+XG4gICAgICAgICAgICAgIDxzcGFuIHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtZ3JleS01MDBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSBvcHRpb25zYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPENvbGxhcHNlIGhlaWdodD17MH0gbWF4SGVpZ2h0PXsnYXV0byd9IGV4cGFuZGVkPXtpc09wZW59PlxuICAgICAgICAgICAgICB7cmVuZGVyV2FsbGV0TGlzdH1cbiAgICAgICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICAgICAgPC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXhzIGZsZXgganVzdGlmeS1jZW50ZXIgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHVuZGVybGluZSBjdXJzb3ItcG9pbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBCb3R0b20gU2hhZGVzICovfVxuICAgICAge2lzT3BlbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICAgIDwvPlxuICAgICAgKSA6IG51bGx9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdDb2luYmFzZSBXYWxsZXQnIGFzIFdhbGxldE5hbWU8J0NvaW5iYXNlIFdhbGxldCc+LFxuICAnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz4sXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkgJiYgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIHNpbmNlIENvaW5iYXNlIFdhbGxldCBoYXMgdHdvIGFkYXB0ZXJzIGR1cGxpY2F0ZVxuICAgICAgICAgIGlmIChhY2MucmVjb21tZW5kZWRXYWxsZXRzLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0Lm5hbWUgPT09IGFkYXB0ZXJOYW1lKSkgcmV0dXJuIGFjYztcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zb2xlLmxvZyhyZWNvbW1lbmRlZFdhbGxldHMpO1xuICAgICAgLy8gU29ydCB0aGUgaW5zdGFsbGVkIHdhbGxldHMgYWNjb3JkaW5nIHRvIHRoZSB0b3Agd2FsbGV0cyB0aGF0IHdlIHdhbnQgdG8gc2hvdyB0byB0aGUgdXNlciBmaXJzdFxuICAgICAgY29uc3QgaGlnaGxpZ2h0OiBBZGFwdGVyW10gPSBbXTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBpbnN0YWxsZWQgd2FsbGV0IGFkYXB0ZXJzIGFuZCBjaGVjayBpZiB0aGV5IGFyZSBpbiB0aGUgdG9wIHdhbGxldHMgbGlzdFxuICAgICAgLy8gSWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXQgbGlzdCwgd2Ugd2lsbCBhZGQgaXQgdG8gdGhlIGZpbHRlcmVkIHJlY29tbWVuZGUgd2FsbGV0c1xuICAgICAgVE9QX1dBTExFVFMuZm9yRWFjaCgodG9wV2FsbGV0KSA9PiB7XG4gICAgICAgIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmZvckVhY2goKGluc3RhbGxlZFdhbGxldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBpZiAodG9wV2FsbGV0ID09PSBpbnN0YWxsZWRXYWxsZXQubmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgd2FsbGV0VG9QdXNoID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wdXNoKHdhbGxldFRvUHVzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBoaWdobGlnaHQucHVzaCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAxKSk7XG4gICAgICBjb25zb2xlLmxvZyhoaWdobGlnaHQpO1xuICAgICAgY29uc29sZS5sb2coZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQpO1xuICAgICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoKSk7XG5cbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ0luc3RhbGxlZCcsIGhpZ2hsaWdodCwgb3RoZXJzIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMubG9hZGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IGZpbHRlcmVkQWRhcHRlcnMucmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnT25ib2FyZGluZycsXG4gICAgICAgIGhpZ2hsaWdodDogW10sXG4gICAgICAgIG90aGVyczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0YCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */"]
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
    }, process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFzSnFDIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcbmltcG9ydCB7IFdhbGxldEljb24sIFdhbGxldExpc3RJdGVtIH0gZnJvbSAnLi9XYWxsZXRMaXN0SXRlbSc7XG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENsb3NlSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DbG9zZUljb24nO1xuaW1wb3J0IHsgaXNNb2JpbGUsIHVzZU91dHNpZGVDbGljayB9IGZyb20gJy4uLy4uL21pc2MvdXRpbHMnO1xuaW1wb3J0IE5vdEluc3RhbGxlZCBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi4vVW5pZmllZFdhbGxldE1vZGFsL09uYm9hcmRpbmcnO1xuaW1wb3J0IHsgU2ZtTG9nbyB9IGZyb20gJy4vU2ZtTG9nbyc7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUgYmctW3JnYig0OSwgNjIsIDc2KV1gXSxcbiAgfSxcbiAgc2hhZGVzOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyNmZmZmZmZdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjM0EzQjQzXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bcmdiKDQ5LCA2MiwgNzYpXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gIH0sXG4gIHdhbGxldEl0ZW06IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYXktNTAgaG92ZXI6c2hhZG93LWxnYF0sXG4gICAgZGFyazogW3R3YGJnLWRhcmstNzAwIGhvdmVyOnNoYWRvdy0yeGxgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICB9LFxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBmbGV4LXJvdyBqdXN0aWZ5LWNlbnRlciBgLCBzdHlsZXMuaGVhZGVyW3RoZW1lXV19PlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPXtTZm1Mb2dvfSBhbHQ9XCJsb2dvXCIgLz5cbiAgICAgICAgPGRpdiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14bCAtbXQtMTBcIj5cbiAgICAgICAgICA8c3BhbiBjc3M9e1t0d2B0ZXh0LXRyYW5zcGFyZW50IGJnLWNsaXAtdGV4dCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWBdfT5cbiAgICAgICAgICAgIHt0KGBDb25uZWN0IFdhbGxldGApfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC1zbSBtdC0xIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgYSB3YWxsZXQgdG8gcHJvY2VlZGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lIHRleHQtY2VudGVyYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QucmVjb21tZW5kZWRXYWxsZXRzLm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgICAgICAgICAgIC8vIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQtbGcgbWwtNCBsZzptbC0yXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHthdHRhY2htZW50ID8gPGRpdj57YXR0YWNobWVudH08L2Rpdj4gOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtMiBmbGV4IGZsZXgtY29sIHNwYWNlLXktMiBcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHQubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHAtWzFweF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmFja2Ryb3AtYmx1ci14bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiZy1ncmFkaWVudC10by1yICBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWdyZXktNTAwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3QoYE1vcmUgb3B0aW9uc2ApfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgdGV4dC14cyBmbGV4IGp1c3RpZnktY2VudGVyIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdLFxuICAgICAgICAgIF19XG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyh0cnVlKX0+XG4gICAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqL31cbiAgICAgIHtpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgICA8Lz5cbiAgICAgICkgOiBudWxsfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnQ29pbmJhc2UgV2FsbGV0JyBhcyBXYWxsZXROYW1lPCdDb2luYmFzZSBXYWxsZXQnPixcbiAgJ0JhY2twYWNrJyBhcyBXYWxsZXROYW1lPCdCYWNrcGFjayc+LFxuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuXTtcblxuaW50ZXJmYWNlIElVbmlmaWVkV2FsbGV0TW9kYWwge1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBzb3J0QnlQcmVjZWRlbmNlID0gKHdhbGxldFByZWNlZGVuY2U6IFdhbGxldE5hbWVbXSkgPT4gKGE6IEFkYXB0ZXIsIGI6IEFkYXB0ZXIpID0+IHtcbiAgaWYgKCF3YWxsZXRQcmVjZWRlbmNlKSByZXR1cm4gMDtcblxuICBjb25zdCBhSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYS5uYW1lKTtcbiAgY29uc3QgYkluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGIubmFtZSk7XG5cbiAgaWYgKGFJbmRleCA9PT0gLTEgJiYgYkluZGV4ID09PSAtMSkgcmV0dXJuIDA7XG4gIGlmIChhSW5kZXggPj0gMCkge1xuICAgIGlmIChiSW5kZXggPT09IC0xKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgfVxuXG4gIGlmIChiSW5kZXggPj0gMCkge1xuICAgIGlmIChhSW5kZXggPT09IC0xKSByZXR1cm4gMTtcbiAgICByZXR1cm4gYkluZGV4IC0gYUluZGV4O1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuY29uc3QgU2ZtVW5pZmllZFdhbGxldE1vZGFsOiBSZWFjdC5GQzxJVW5pZmllZFdhbGxldE1vZGFsPiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHdhbGxldHMgfSA9IHVzZVVuaWZpZWRXYWxsZXQoKTtcbiAgY29uc3QgeyB3YWxsZXRQcmVjZWRlbmNlLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgW2lzT3Blbiwgb25Ub2dnbGVdID0gdXNlVG9nZ2xlKGZhbHNlKTtcbiAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZCA9IHVzZVByZXZpb3VzbHlDb25uZWN0ZWQoKTtcblxuICBjb25zdCBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH0gPSB1c2VNZW1vKCgpID0+IHtcbiAgICAvLyBUaGVuLCBJbnN0YWxsZWQsIFRvcCAzLCBMb2FkYWJsZSwgTm90RGV0ZWN0ZWRcbiAgICBjb25zdCBmaWx0ZXJlZEFkYXB0ZXJzID0gd2FsbGV0cy5yZWR1Y2U8e1xuICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogQWRhcHRlcltdO1xuICAgICAgaW5zdGFsbGVkOiBBZGFwdGVyW107XG4gICAgICB0b3AzOiBBZGFwdGVyW107XG4gICAgICBsb2FkYWJsZTogQWRhcHRlcltdO1xuICAgICAgbm90RGV0ZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIH0+KFxuICAgICAgKGFjYywgd2FsbGV0KSA9PiB7XG4gICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gd2FsbGV0LmFkYXB0ZXIubmFtZTtcblxuICAgICAgICBpZiAoUkVDT01NRU5ERURfV0FMTEVUUy5zb21lKCh3YWxsZXQpID0+IHdhbGxldCA9PT0gYWRhcHRlck5hbWUpICYmIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgZHVwbGljYXRlcyBzaW5jZSBDb2luYmFzZSBXYWxsZXQgaGFzIHR3byBhZGFwdGVycyBkdXBsaWNhdGVcbiAgICAgICAgICBpZiAoYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5zb21lKCh3YWxsZXQpID0+IHdhbGxldC5uYW1lID09PSBhZGFwdGVyTmFtZSkpIHJldHVybiBhY2M7XG4gICAgICAgICAgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmlvdXNseSBjb25uZWN0ZWQgdGFrZXMgaGlnaGVzdFxuICAgICAgICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPSBwcmV2aW91c2x5Q29ubmVjdGVkLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAocHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MucHJldmlvdXNseUNvbm5lY3RlZFtwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGVuIEluc3RhbGxlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgYWNjLmluc3RhbGxlZC5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRvcCAzXG4gICAgICAgIGNvbnN0IHRvcFdhbGxldHNJbmRleCA9IFRPUF9XQUxMRVRTLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAodG9wV2FsbGV0c0luZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MudG9wM1t0b3BXYWxsZXRzSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBMb2FkYWJsZVxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTG9hZGFibGUpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBOb3REZXRlY3RlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBbXSxcbiAgICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogW10sXG4gICAgICAgIGluc3RhbGxlZDogW10sXG4gICAgICAgIHRvcDM6IFtdLFxuICAgICAgICBsb2FkYWJsZTogW10sXG4gICAgICAgIG5vdERldGVjdGVkOiBbXSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG5cbiAgICAgIGNvbnN0IGhpZ2hsaWdodCA9IGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgwLCAzKTtcbiAgICAgIGxldCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMywgZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCkpO1xuICAgICAgb3RoZXJzID0gb3RoZXJzLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnUHJldmlvdXNseUNvbm5lY3RlZCcsXG4gICAgICAgIGhpZ2hsaWdodCxcbiAgICAgICAgb3RoZXJzLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIGluc3RhbGxlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc29sZS5sb2cocmVjb21tZW5kZWRXYWxsZXRzKTtcbiAgICAgIC8vIFNvcnQgdGhlIGluc3RhbGxlZCB3YWxsZXRzIGFjY29yZGluZyB0byB0aGUgdG9wIHdhbGxldHMgdGhhdCB3ZSB3YW50IHRvIHNob3cgdG8gdGhlIHVzZXIgZmlyc3RcbiAgICAgIGNvbnN0IGhpZ2hsaWdodDogQWRhcHRlcltdID0gW107XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgaW5zdGFsbGVkIHdhbGxldCBhZGFwdGVycyBhbmQgY2hlY2sgaWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXRzIGxpc3RcbiAgICAgIC8vIElmIHRoZXkgYXJlIGluIHRoZSB0b3Agd2FsbGV0IGxpc3QsIHdlIHdpbGwgYWRkIGl0IHRvIHRoZSBmaWx0ZXJlZCByZWNvbW1lbmRlIHdhbGxldHNcbiAgICAgIFRPUF9XQUxMRVRTLmZvckVhY2goKHRvcFdhbGxldCkgPT4ge1xuICAgICAgICBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5mb3JFYWNoKChpbnN0YWxsZWRXYWxsZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKHRvcFdhbGxldCA9PT0gaW5zdGFsbGVkV2FsbGV0Lm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhbGxldFRvUHVzaCA9IGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgICAgICAgICBoaWdobGlnaHQucHVzaCh3YWxsZXRUb1B1c2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gaGlnaGxpZ2h0LnB1c2goLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMSkpO1xuICAgICAgY29uc29sZS5sb2coaGlnaGxpZ2h0KTtcbiAgICAgIGNvbnNvbGUubG9nKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDAsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLFxuICAgICAgICBoaWdobGlnaHQ6IFtdLFxuICAgICAgICBvdGhlcnM6IFtdLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgdG9wMywgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcbiAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAuZmxhdCgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnVG9wV2FsbGV0JywgaGlnaGxpZ2h0OiB0b3AzLCBvdGhlcnMgfTtcbiAgfSwgW3dhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWRdKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgdXNlT3V0c2lkZUNsaWNrKGNvbnRlbnRSZWYsIG9uQ2xvc2UpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbXG4gICAgICAgIHR3YG1heC13LW1kIHctZnVsbCByZWxhdGl2ZSBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLXhsIHRyYW5zaXRpb24taGVpZ2h0IGR1cmF0aW9uLTUwMCBlYXNlLWluLW91dGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8TGlzdE9mV2FsbGV0cyBsaXN0PXtsaXN0fSBvblRvZ2dsZT17b25Ub2dnbGV9IGlzT3Blbj17aXNPcGVufSAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2ZtVW5pZmllZFdhbGxldE1vZGFsO1xuIl19 */", process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFzSnFDIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcbmltcG9ydCB7IFdhbGxldEljb24sIFdhbGxldExpc3RJdGVtIH0gZnJvbSAnLi9XYWxsZXRMaXN0SXRlbSc7XG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENsb3NlSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DbG9zZUljb24nO1xuaW1wb3J0IHsgaXNNb2JpbGUsIHVzZU91dHNpZGVDbGljayB9IGZyb20gJy4uLy4uL21pc2MvdXRpbHMnO1xuaW1wb3J0IE5vdEluc3RhbGxlZCBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi4vVW5pZmllZFdhbGxldE1vZGFsL09uYm9hcmRpbmcnO1xuaW1wb3J0IHsgU2ZtTG9nbyB9IGZyb20gJy4vU2ZtTG9nbyc7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUgYmctW3JnYig0OSwgNjIsIDc2KV1gXSxcbiAgfSxcbiAgc2hhZGVzOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyNmZmZmZmZdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjM0EzQjQzXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bcmdiKDQ5LCA2MiwgNzYpXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gIH0sXG4gIHdhbGxldEl0ZW06IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYXktNTAgaG92ZXI6c2hhZG93LWxnYF0sXG4gICAgZGFyazogW3R3YGJnLWRhcmstNzAwIGhvdmVyOnNoYWRvdy0yeGxgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICB9LFxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBmbGV4LXJvdyBqdXN0aWZ5LWNlbnRlciBgLCBzdHlsZXMuaGVhZGVyW3RoZW1lXV19PlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPXtTZm1Mb2dvfSBhbHQ9XCJsb2dvXCIgLz5cbiAgICAgICAgPGRpdiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14bCAtbXQtMTBcIj5cbiAgICAgICAgICA8c3BhbiBjc3M9e1t0d2B0ZXh0LXRyYW5zcGFyZW50IGJnLWNsaXAtdGV4dCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWBdfT5cbiAgICAgICAgICAgIHt0KGBDb25uZWN0IFdhbGxldGApfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC1zbSBtdC0xIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgYSB3YWxsZXQgdG8gcHJvY2VlZGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lIHRleHQtY2VudGVyYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QucmVjb21tZW5kZWRXYWxsZXRzLm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgICAgICAgICAgIC8vIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQtbGcgbWwtNCBsZzptbC0yXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHthdHRhY2htZW50ID8gPGRpdj57YXR0YWNobWVudH08L2Rpdj4gOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtMiBmbGV4IGZsZXgtY29sIHNwYWNlLXktMiBcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHQubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHAtWzFweF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmFja2Ryb3AtYmx1ci14bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiZy1ncmFkaWVudC10by1yICBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWdyZXktNTAwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3QoYE1vcmUgb3B0aW9uc2ApfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgdGV4dC14cyBmbGV4IGp1c3RpZnktY2VudGVyIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdLFxuICAgICAgICAgIF19XG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyh0cnVlKX0+XG4gICAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqL31cbiAgICAgIHtpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgICA8Lz5cbiAgICAgICkgOiBudWxsfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnQ29pbmJhc2UgV2FsbGV0JyBhcyBXYWxsZXROYW1lPCdDb2luYmFzZSBXYWxsZXQnPixcbiAgJ0JhY2twYWNrJyBhcyBXYWxsZXROYW1lPCdCYWNrcGFjayc+LFxuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuXTtcblxuaW50ZXJmYWNlIElVbmlmaWVkV2FsbGV0TW9kYWwge1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBzb3J0QnlQcmVjZWRlbmNlID0gKHdhbGxldFByZWNlZGVuY2U6IFdhbGxldE5hbWVbXSkgPT4gKGE6IEFkYXB0ZXIsIGI6IEFkYXB0ZXIpID0+IHtcbiAgaWYgKCF3YWxsZXRQcmVjZWRlbmNlKSByZXR1cm4gMDtcblxuICBjb25zdCBhSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYS5uYW1lKTtcbiAgY29uc3QgYkluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGIubmFtZSk7XG5cbiAgaWYgKGFJbmRleCA9PT0gLTEgJiYgYkluZGV4ID09PSAtMSkgcmV0dXJuIDA7XG4gIGlmIChhSW5kZXggPj0gMCkge1xuICAgIGlmIChiSW5kZXggPT09IC0xKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgfVxuXG4gIGlmIChiSW5kZXggPj0gMCkge1xuICAgIGlmIChhSW5kZXggPT09IC0xKSByZXR1cm4gMTtcbiAgICByZXR1cm4gYkluZGV4IC0gYUluZGV4O1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuY29uc3QgU2ZtVW5pZmllZFdhbGxldE1vZGFsOiBSZWFjdC5GQzxJVW5pZmllZFdhbGxldE1vZGFsPiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHdhbGxldHMgfSA9IHVzZVVuaWZpZWRXYWxsZXQoKTtcbiAgY29uc3QgeyB3YWxsZXRQcmVjZWRlbmNlLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgW2lzT3Blbiwgb25Ub2dnbGVdID0gdXNlVG9nZ2xlKGZhbHNlKTtcbiAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZCA9IHVzZVByZXZpb3VzbHlDb25uZWN0ZWQoKTtcblxuICBjb25zdCBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH0gPSB1c2VNZW1vKCgpID0+IHtcbiAgICAvLyBUaGVuLCBJbnN0YWxsZWQsIFRvcCAzLCBMb2FkYWJsZSwgTm90RGV0ZWN0ZWRcbiAgICBjb25zdCBmaWx0ZXJlZEFkYXB0ZXJzID0gd2FsbGV0cy5yZWR1Y2U8e1xuICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogQWRhcHRlcltdO1xuICAgICAgaW5zdGFsbGVkOiBBZGFwdGVyW107XG4gICAgICB0b3AzOiBBZGFwdGVyW107XG4gICAgICBsb2FkYWJsZTogQWRhcHRlcltdO1xuICAgICAgbm90RGV0ZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIH0+KFxuICAgICAgKGFjYywgd2FsbGV0KSA9PiB7XG4gICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gd2FsbGV0LmFkYXB0ZXIubmFtZTtcblxuICAgICAgICBpZiAoUkVDT01NRU5ERURfV0FMTEVUUy5zb21lKCh3YWxsZXQpID0+IHdhbGxldCA9PT0gYWRhcHRlck5hbWUpICYmIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgZHVwbGljYXRlcyBzaW5jZSBDb2luYmFzZSBXYWxsZXQgaGFzIHR3byBhZGFwdGVycyBkdXBsaWNhdGVcbiAgICAgICAgICBpZiAoYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5zb21lKCh3YWxsZXQpID0+IHdhbGxldC5uYW1lID09PSBhZGFwdGVyTmFtZSkpIHJldHVybiBhY2M7XG4gICAgICAgICAgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmlvdXNseSBjb25uZWN0ZWQgdGFrZXMgaGlnaGVzdFxuICAgICAgICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPSBwcmV2aW91c2x5Q29ubmVjdGVkLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAocHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MucHJldmlvdXNseUNvbm5lY3RlZFtwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGVuIEluc3RhbGxlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgYWNjLmluc3RhbGxlZC5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRvcCAzXG4gICAgICAgIGNvbnN0IHRvcFdhbGxldHNJbmRleCA9IFRPUF9XQUxMRVRTLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAodG9wV2FsbGV0c0luZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MudG9wM1t0b3BXYWxsZXRzSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBMb2FkYWJsZVxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTG9hZGFibGUpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBOb3REZXRlY3RlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBbXSxcbiAgICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogW10sXG4gICAgICAgIGluc3RhbGxlZDogW10sXG4gICAgICAgIHRvcDM6IFtdLFxuICAgICAgICBsb2FkYWJsZTogW10sXG4gICAgICAgIG5vdERldGVjdGVkOiBbXSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG5cbiAgICAgIGNvbnN0IGhpZ2hsaWdodCA9IGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgwLCAzKTtcbiAgICAgIGxldCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMywgZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCkpO1xuICAgICAgb3RoZXJzID0gb3RoZXJzLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnUHJldmlvdXNseUNvbm5lY3RlZCcsXG4gICAgICAgIGhpZ2hsaWdodCxcbiAgICAgICAgb3RoZXJzLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIGluc3RhbGxlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc29sZS5sb2cocmVjb21tZW5kZWRXYWxsZXRzKTtcbiAgICAgIC8vIFNvcnQgdGhlIGluc3RhbGxlZCB3YWxsZXRzIGFjY29yZGluZyB0byB0aGUgdG9wIHdhbGxldHMgdGhhdCB3ZSB3YW50IHRvIHNob3cgdG8gdGhlIHVzZXIgZmlyc3RcbiAgICAgIGNvbnN0IGhpZ2hsaWdodDogQWRhcHRlcltdID0gW107XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgaW5zdGFsbGVkIHdhbGxldCBhZGFwdGVycyBhbmQgY2hlY2sgaWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXRzIGxpc3RcbiAgICAgIC8vIElmIHRoZXkgYXJlIGluIHRoZSB0b3Agd2FsbGV0IGxpc3QsIHdlIHdpbGwgYWRkIGl0IHRvIHRoZSBmaWx0ZXJlZCByZWNvbW1lbmRlIHdhbGxldHNcbiAgICAgIFRPUF9XQUxMRVRTLmZvckVhY2goKHRvcFdhbGxldCkgPT4ge1xuICAgICAgICBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5mb3JFYWNoKChpbnN0YWxsZWRXYWxsZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKHRvcFdhbGxldCA9PT0gaW5zdGFsbGVkV2FsbGV0Lm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhbGxldFRvUHVzaCA9IGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgICAgICAgICBoaWdobGlnaHQucHVzaCh3YWxsZXRUb1B1c2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gaGlnaGxpZ2h0LnB1c2goLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMSkpO1xuICAgICAgY29uc29sZS5sb2coaGlnaGxpZ2h0KTtcbiAgICAgIGNvbnNvbGUubG9nKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDAsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLFxuICAgICAgICBoaWdobGlnaHQ6IFtdLFxuICAgICAgICBvdGhlcnM6IFtdLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgdG9wMywgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcbiAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAuZmxhdCgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnVG9wV2FsbGV0JywgaGlnaGxpZ2h0OiB0b3AzLCBvdGhlcnMgfTtcbiAgfSwgW3dhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWRdKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgdXNlT3V0c2lkZUNsaWNrKGNvbnRlbnRSZWYsIG9uQ2xvc2UpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbXG4gICAgICAgIHR3YG1heC13LW1kIHctZnVsbCByZWxhdGl2ZSBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLXhsIHRyYW5zaXRpb24taGVpZ2h0IGR1cmF0aW9uLTUwMCBlYXNlLWluLW91dGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8TGlzdE9mV2FsbGV0cyBsaXN0PXtsaXN0fSBvblRvZ2dsZT17b25Ub2dnbGV9IGlzT3Blbj17aXNPcGVufSAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2ZtVW5pZmllZFdhbGxldE1vZGFsO1xuIl19 */"]
  }, jsx("div", {
    css: _ref6
  }, list.recommendedWallets.map((adapter, idx) => {
    const attachment = walletAttachments ? walletAttachments[adapter.name]?.attachment : null;
    const adapterName = (() => {
      if (adapter.name === SolanaMobileWalletAdapterWalletName) return t(`Mobile`);
      return adapter.name;
    })();
    return jsx("div", {
      key: idx,
      onClick: event => onClickWallet(event, adapter),
      css: _ref7
    }, jsx("div", {
      css: ["display:flex;width:100%;flex:1 1 0%;cursor:pointer;align-items:center;border-radius:0.5rem;padding-left:1rem;padding-right:1rem;padding-top:1rem;padding-bottom:1rem;@media (min-width: 1024px){justify-content:center;padding-left:0.5rem;padding-right:0.5rem;}", styles$1.walletItem[theme], process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUEyS2tCIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcbmltcG9ydCB7IFdhbGxldEljb24sIFdhbGxldExpc3RJdGVtIH0gZnJvbSAnLi9XYWxsZXRMaXN0SXRlbSc7XG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENsb3NlSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DbG9zZUljb24nO1xuaW1wb3J0IHsgaXNNb2JpbGUsIHVzZU91dHNpZGVDbGljayB9IGZyb20gJy4uLy4uL21pc2MvdXRpbHMnO1xuaW1wb3J0IE5vdEluc3RhbGxlZCBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi4vVW5pZmllZFdhbGxldE1vZGFsL09uYm9hcmRpbmcnO1xuaW1wb3J0IHsgU2ZtTG9nbyB9IGZyb20gJy4vU2ZtTG9nbyc7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUgYmctW3JnYig0OSwgNjIsIDc2KV1gXSxcbiAgfSxcbiAgc2hhZGVzOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyNmZmZmZmZdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjM0EzQjQzXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bcmdiKDQ5LCA2MiwgNzYpXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gIH0sXG4gIHdhbGxldEl0ZW06IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYXktNTAgaG92ZXI6c2hhZG93LWxnYF0sXG4gICAgZGFyazogW3R3YGJnLWRhcmstNzAwIGhvdmVyOnNoYWRvdy0yeGxgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICB9LFxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBmbGV4LXJvdyBqdXN0aWZ5LWNlbnRlciBgLCBzdHlsZXMuaGVhZGVyW3RoZW1lXV19PlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPXtTZm1Mb2dvfSBhbHQ9XCJsb2dvXCIgLz5cbiAgICAgICAgPGRpdiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14bCAtbXQtMTBcIj5cbiAgICAgICAgICA8c3BhbiBjc3M9e1t0d2B0ZXh0LXRyYW5zcGFyZW50IGJnLWNsaXAtdGV4dCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWBdfT5cbiAgICAgICAgICAgIHt0KGBDb25uZWN0IFdhbGxldGApfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC1zbSBtdC0xIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgYSB3YWxsZXQgdG8gcHJvY2VlZGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lIHRleHQtY2VudGVyYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QucmVjb21tZW5kZWRXYWxsZXRzLm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgICAgICAgICAgIC8vIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQtbGcgbWwtNCBsZzptbC0yXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHthdHRhY2htZW50ID8gPGRpdj57YXR0YWNobWVudH08L2Rpdj4gOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtMiBmbGV4IGZsZXgtY29sIHNwYWNlLXktMiBcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHQubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHAtWzFweF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmFja2Ryb3AtYmx1ci14bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiZy1ncmFkaWVudC10by1yICBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWdyZXktNTAwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3QoYE1vcmUgb3B0aW9uc2ApfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgdGV4dC14cyBmbGV4IGp1c3RpZnktY2VudGVyIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdLFxuICAgICAgICAgIF19XG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyh0cnVlKX0+XG4gICAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqL31cbiAgICAgIHtpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgICA8Lz5cbiAgICAgICkgOiBudWxsfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnQ29pbmJhc2UgV2FsbGV0JyBhcyBXYWxsZXROYW1lPCdDb2luYmFzZSBXYWxsZXQnPixcbiAgJ0JhY2twYWNrJyBhcyBXYWxsZXROYW1lPCdCYWNrcGFjayc+LFxuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuXTtcblxuaW50ZXJmYWNlIElVbmlmaWVkV2FsbGV0TW9kYWwge1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBzb3J0QnlQcmVjZWRlbmNlID0gKHdhbGxldFByZWNlZGVuY2U6IFdhbGxldE5hbWVbXSkgPT4gKGE6IEFkYXB0ZXIsIGI6IEFkYXB0ZXIpID0+IHtcbiAgaWYgKCF3YWxsZXRQcmVjZWRlbmNlKSByZXR1cm4gMDtcblxuICBjb25zdCBhSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYS5uYW1lKTtcbiAgY29uc3QgYkluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGIubmFtZSk7XG5cbiAgaWYgKGFJbmRleCA9PT0gLTEgJiYgYkluZGV4ID09PSAtMSkgcmV0dXJuIDA7XG4gIGlmIChhSW5kZXggPj0gMCkge1xuICAgIGlmIChiSW5kZXggPT09IC0xKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgfVxuXG4gIGlmIChiSW5kZXggPj0gMCkge1xuICAgIGlmIChhSW5kZXggPT09IC0xKSByZXR1cm4gMTtcbiAgICByZXR1cm4gYkluZGV4IC0gYUluZGV4O1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuY29uc3QgU2ZtVW5pZmllZFdhbGxldE1vZGFsOiBSZWFjdC5GQzxJVW5pZmllZFdhbGxldE1vZGFsPiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHdhbGxldHMgfSA9IHVzZVVuaWZpZWRXYWxsZXQoKTtcbiAgY29uc3QgeyB3YWxsZXRQcmVjZWRlbmNlLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgW2lzT3Blbiwgb25Ub2dnbGVdID0gdXNlVG9nZ2xlKGZhbHNlKTtcbiAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZCA9IHVzZVByZXZpb3VzbHlDb25uZWN0ZWQoKTtcblxuICBjb25zdCBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH0gPSB1c2VNZW1vKCgpID0+IHtcbiAgICAvLyBUaGVuLCBJbnN0YWxsZWQsIFRvcCAzLCBMb2FkYWJsZSwgTm90RGV0ZWN0ZWRcbiAgICBjb25zdCBmaWx0ZXJlZEFkYXB0ZXJzID0gd2FsbGV0cy5yZWR1Y2U8e1xuICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogQWRhcHRlcltdO1xuICAgICAgaW5zdGFsbGVkOiBBZGFwdGVyW107XG4gICAgICB0b3AzOiBBZGFwdGVyW107XG4gICAgICBsb2FkYWJsZTogQWRhcHRlcltdO1xuICAgICAgbm90RGV0ZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIH0+KFxuICAgICAgKGFjYywgd2FsbGV0KSA9PiB7XG4gICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gd2FsbGV0LmFkYXB0ZXIubmFtZTtcblxuICAgICAgICBpZiAoUkVDT01NRU5ERURfV0FMTEVUUy5zb21lKCh3YWxsZXQpID0+IHdhbGxldCA9PT0gYWRhcHRlck5hbWUpICYmIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgZHVwbGljYXRlcyBzaW5jZSBDb2luYmFzZSBXYWxsZXQgaGFzIHR3byBhZGFwdGVycyBkdXBsaWNhdGVcbiAgICAgICAgICBpZiAoYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5zb21lKCh3YWxsZXQpID0+IHdhbGxldC5uYW1lID09PSBhZGFwdGVyTmFtZSkpIHJldHVybiBhY2M7XG4gICAgICAgICAgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmlvdXNseSBjb25uZWN0ZWQgdGFrZXMgaGlnaGVzdFxuICAgICAgICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPSBwcmV2aW91c2x5Q29ubmVjdGVkLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAocHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MucHJldmlvdXNseUNvbm5lY3RlZFtwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGVuIEluc3RhbGxlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgYWNjLmluc3RhbGxlZC5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRvcCAzXG4gICAgICAgIGNvbnN0IHRvcFdhbGxldHNJbmRleCA9IFRPUF9XQUxMRVRTLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAodG9wV2FsbGV0c0luZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MudG9wM1t0b3BXYWxsZXRzSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBMb2FkYWJsZVxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTG9hZGFibGUpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBOb3REZXRlY3RlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBbXSxcbiAgICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogW10sXG4gICAgICAgIGluc3RhbGxlZDogW10sXG4gICAgICAgIHRvcDM6IFtdLFxuICAgICAgICBsb2FkYWJsZTogW10sXG4gICAgICAgIG5vdERldGVjdGVkOiBbXSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG5cbiAgICAgIGNvbnN0IGhpZ2hsaWdodCA9IGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgwLCAzKTtcbiAgICAgIGxldCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMywgZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCkpO1xuICAgICAgb3RoZXJzID0gb3RoZXJzLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnUHJldmlvdXNseUNvbm5lY3RlZCcsXG4gICAgICAgIGhpZ2hsaWdodCxcbiAgICAgICAgb3RoZXJzLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIGluc3RhbGxlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc29sZS5sb2cocmVjb21tZW5kZWRXYWxsZXRzKTtcbiAgICAgIC8vIFNvcnQgdGhlIGluc3RhbGxlZCB3YWxsZXRzIGFjY29yZGluZyB0byB0aGUgdG9wIHdhbGxldHMgdGhhdCB3ZSB3YW50IHRvIHNob3cgdG8gdGhlIHVzZXIgZmlyc3RcbiAgICAgIGNvbnN0IGhpZ2hsaWdodDogQWRhcHRlcltdID0gW107XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgaW5zdGFsbGVkIHdhbGxldCBhZGFwdGVycyBhbmQgY2hlY2sgaWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXRzIGxpc3RcbiAgICAgIC8vIElmIHRoZXkgYXJlIGluIHRoZSB0b3Agd2FsbGV0IGxpc3QsIHdlIHdpbGwgYWRkIGl0IHRvIHRoZSBmaWx0ZXJlZCByZWNvbW1lbmRlIHdhbGxldHNcbiAgICAgIFRPUF9XQUxMRVRTLmZvckVhY2goKHRvcFdhbGxldCkgPT4ge1xuICAgICAgICBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5mb3JFYWNoKChpbnN0YWxsZWRXYWxsZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKHRvcFdhbGxldCA9PT0gaW5zdGFsbGVkV2FsbGV0Lm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhbGxldFRvUHVzaCA9IGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgICAgICAgICBoaWdobGlnaHQucHVzaCh3YWxsZXRUb1B1c2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gaGlnaGxpZ2h0LnB1c2goLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMSkpO1xuICAgICAgY29uc29sZS5sb2coaGlnaGxpZ2h0KTtcbiAgICAgIGNvbnNvbGUubG9nKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDAsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLFxuICAgICAgICBoaWdobGlnaHQ6IFtdLFxuICAgICAgICBvdGhlcnM6IFtdLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgdG9wMywgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcbiAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAuZmxhdCgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnVG9wV2FsbGV0JywgaGlnaGxpZ2h0OiB0b3AzLCBvdGhlcnMgfTtcbiAgfSwgW3dhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWRdKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgdXNlT3V0c2lkZUNsaWNrKGNvbnRlbnRSZWYsIG9uQ2xvc2UpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbXG4gICAgICAgIHR3YG1heC13LW1kIHctZnVsbCByZWxhdGl2ZSBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLXhsIHRyYW5zaXRpb24taGVpZ2h0IGR1cmF0aW9uLTUwMCBlYXNlLWluLW91dGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8TGlzdE9mV2FsbGV0cyBsaXN0PXtsaXN0fSBvblRvZ2dsZT17b25Ub2dnbGV9IGlzT3Blbj17aXNPcGVufSAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2ZtVW5pZmllZFdhbGxldE1vZGFsO1xuIl19 */", process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUEyS2tCIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcbmltcG9ydCB7IFdhbGxldEljb24sIFdhbGxldExpc3RJdGVtIH0gZnJvbSAnLi9XYWxsZXRMaXN0SXRlbSc7XG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENsb3NlSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DbG9zZUljb24nO1xuaW1wb3J0IHsgaXNNb2JpbGUsIHVzZU91dHNpZGVDbGljayB9IGZyb20gJy4uLy4uL21pc2MvdXRpbHMnO1xuaW1wb3J0IE5vdEluc3RhbGxlZCBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi4vVW5pZmllZFdhbGxldE1vZGFsL09uYm9hcmRpbmcnO1xuaW1wb3J0IHsgU2ZtTG9nbyB9IGZyb20gJy4vU2ZtTG9nbyc7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUgYmctW3JnYig0OSwgNjIsIDc2KV1gXSxcbiAgfSxcbiAgc2hhZGVzOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyNmZmZmZmZdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjM0EzQjQzXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bcmdiKDQ5LCA2MiwgNzYpXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gIH0sXG4gIHdhbGxldEl0ZW06IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYXktNTAgaG92ZXI6c2hhZG93LWxnYF0sXG4gICAgZGFyazogW3R3YGJnLWRhcmstNzAwIGhvdmVyOnNoYWRvdy0yeGxgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICB9LFxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBmbGV4LXJvdyBqdXN0aWZ5LWNlbnRlciBgLCBzdHlsZXMuaGVhZGVyW3RoZW1lXV19PlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPXtTZm1Mb2dvfSBhbHQ9XCJsb2dvXCIgLz5cbiAgICAgICAgPGRpdiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14bCAtbXQtMTBcIj5cbiAgICAgICAgICA8c3BhbiBjc3M9e1t0d2B0ZXh0LXRyYW5zcGFyZW50IGJnLWNsaXAtdGV4dCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWBdfT5cbiAgICAgICAgICAgIHt0KGBDb25uZWN0IFdhbGxldGApfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC1zbSBtdC0xIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgYSB3YWxsZXQgdG8gcHJvY2VlZGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lIHRleHQtY2VudGVyYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QucmVjb21tZW5kZWRXYWxsZXRzLm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgICAgICAgICAgIC8vIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQtbGcgbWwtNCBsZzptbC0yXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHthdHRhY2htZW50ID8gPGRpdj57YXR0YWNobWVudH08L2Rpdj4gOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtMiBmbGV4IGZsZXgtY29sIHNwYWNlLXktMiBcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHQubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHAtWzFweF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmFja2Ryb3AtYmx1ci14bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiZy1ncmFkaWVudC10by1yICBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWdyZXktNTAwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3QoYE1vcmUgb3B0aW9uc2ApfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgdGV4dC14cyBmbGV4IGp1c3RpZnktY2VudGVyIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdLFxuICAgICAgICAgIF19XG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyh0cnVlKX0+XG4gICAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqL31cbiAgICAgIHtpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgICA8Lz5cbiAgICAgICkgOiBudWxsfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnQ29pbmJhc2UgV2FsbGV0JyBhcyBXYWxsZXROYW1lPCdDb2luYmFzZSBXYWxsZXQnPixcbiAgJ0JhY2twYWNrJyBhcyBXYWxsZXROYW1lPCdCYWNrcGFjayc+LFxuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuXTtcblxuaW50ZXJmYWNlIElVbmlmaWVkV2FsbGV0TW9kYWwge1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBzb3J0QnlQcmVjZWRlbmNlID0gKHdhbGxldFByZWNlZGVuY2U6IFdhbGxldE5hbWVbXSkgPT4gKGE6IEFkYXB0ZXIsIGI6IEFkYXB0ZXIpID0+IHtcbiAgaWYgKCF3YWxsZXRQcmVjZWRlbmNlKSByZXR1cm4gMDtcblxuICBjb25zdCBhSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYS5uYW1lKTtcbiAgY29uc3QgYkluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGIubmFtZSk7XG5cbiAgaWYgKGFJbmRleCA9PT0gLTEgJiYgYkluZGV4ID09PSAtMSkgcmV0dXJuIDA7XG4gIGlmIChhSW5kZXggPj0gMCkge1xuICAgIGlmIChiSW5kZXggPT09IC0xKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgfVxuXG4gIGlmIChiSW5kZXggPj0gMCkge1xuICAgIGlmIChhSW5kZXggPT09IC0xKSByZXR1cm4gMTtcbiAgICByZXR1cm4gYkluZGV4IC0gYUluZGV4O1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuY29uc3QgU2ZtVW5pZmllZFdhbGxldE1vZGFsOiBSZWFjdC5GQzxJVW5pZmllZFdhbGxldE1vZGFsPiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHdhbGxldHMgfSA9IHVzZVVuaWZpZWRXYWxsZXQoKTtcbiAgY29uc3QgeyB3YWxsZXRQcmVjZWRlbmNlLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgW2lzT3Blbiwgb25Ub2dnbGVdID0gdXNlVG9nZ2xlKGZhbHNlKTtcbiAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZCA9IHVzZVByZXZpb3VzbHlDb25uZWN0ZWQoKTtcblxuICBjb25zdCBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH0gPSB1c2VNZW1vKCgpID0+IHtcbiAgICAvLyBUaGVuLCBJbnN0YWxsZWQsIFRvcCAzLCBMb2FkYWJsZSwgTm90RGV0ZWN0ZWRcbiAgICBjb25zdCBmaWx0ZXJlZEFkYXB0ZXJzID0gd2FsbGV0cy5yZWR1Y2U8e1xuICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogQWRhcHRlcltdO1xuICAgICAgaW5zdGFsbGVkOiBBZGFwdGVyW107XG4gICAgICB0b3AzOiBBZGFwdGVyW107XG4gICAgICBsb2FkYWJsZTogQWRhcHRlcltdO1xuICAgICAgbm90RGV0ZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIH0+KFxuICAgICAgKGFjYywgd2FsbGV0KSA9PiB7XG4gICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gd2FsbGV0LmFkYXB0ZXIubmFtZTtcblxuICAgICAgICBpZiAoUkVDT01NRU5ERURfV0FMTEVUUy5zb21lKCh3YWxsZXQpID0+IHdhbGxldCA9PT0gYWRhcHRlck5hbWUpICYmIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgZHVwbGljYXRlcyBzaW5jZSBDb2luYmFzZSBXYWxsZXQgaGFzIHR3byBhZGFwdGVycyBkdXBsaWNhdGVcbiAgICAgICAgICBpZiAoYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5zb21lKCh3YWxsZXQpID0+IHdhbGxldC5uYW1lID09PSBhZGFwdGVyTmFtZSkpIHJldHVybiBhY2M7XG4gICAgICAgICAgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmlvdXNseSBjb25uZWN0ZWQgdGFrZXMgaGlnaGVzdFxuICAgICAgICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPSBwcmV2aW91c2x5Q29ubmVjdGVkLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAocHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MucHJldmlvdXNseUNvbm5lY3RlZFtwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGVuIEluc3RhbGxlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgYWNjLmluc3RhbGxlZC5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRvcCAzXG4gICAgICAgIGNvbnN0IHRvcFdhbGxldHNJbmRleCA9IFRPUF9XQUxMRVRTLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAodG9wV2FsbGV0c0luZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MudG9wM1t0b3BXYWxsZXRzSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBMb2FkYWJsZVxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTG9hZGFibGUpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBOb3REZXRlY3RlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBbXSxcbiAgICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogW10sXG4gICAgICAgIGluc3RhbGxlZDogW10sXG4gICAgICAgIHRvcDM6IFtdLFxuICAgICAgICBsb2FkYWJsZTogW10sXG4gICAgICAgIG5vdERldGVjdGVkOiBbXSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG5cbiAgICAgIGNvbnN0IGhpZ2hsaWdodCA9IGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgwLCAzKTtcbiAgICAgIGxldCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMywgZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCkpO1xuICAgICAgb3RoZXJzID0gb3RoZXJzLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnUHJldmlvdXNseUNvbm5lY3RlZCcsXG4gICAgICAgIGhpZ2hsaWdodCxcbiAgICAgICAgb3RoZXJzLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIGluc3RhbGxlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc29sZS5sb2cocmVjb21tZW5kZWRXYWxsZXRzKTtcbiAgICAgIC8vIFNvcnQgdGhlIGluc3RhbGxlZCB3YWxsZXRzIGFjY29yZGluZyB0byB0aGUgdG9wIHdhbGxldHMgdGhhdCB3ZSB3YW50IHRvIHNob3cgdG8gdGhlIHVzZXIgZmlyc3RcbiAgICAgIGNvbnN0IGhpZ2hsaWdodDogQWRhcHRlcltdID0gW107XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgaW5zdGFsbGVkIHdhbGxldCBhZGFwdGVycyBhbmQgY2hlY2sgaWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXRzIGxpc3RcbiAgICAgIC8vIElmIHRoZXkgYXJlIGluIHRoZSB0b3Agd2FsbGV0IGxpc3QsIHdlIHdpbGwgYWRkIGl0IHRvIHRoZSBmaWx0ZXJlZCByZWNvbW1lbmRlIHdhbGxldHNcbiAgICAgIFRPUF9XQUxMRVRTLmZvckVhY2goKHRvcFdhbGxldCkgPT4ge1xuICAgICAgICBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5mb3JFYWNoKChpbnN0YWxsZWRXYWxsZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKHRvcFdhbGxldCA9PT0gaW5zdGFsbGVkV2FsbGV0Lm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhbGxldFRvUHVzaCA9IGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgICAgICAgICBoaWdobGlnaHQucHVzaCh3YWxsZXRUb1B1c2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gaGlnaGxpZ2h0LnB1c2goLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMSkpO1xuICAgICAgY29uc29sZS5sb2coaGlnaGxpZ2h0KTtcbiAgICAgIGNvbnNvbGUubG9nKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDAsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLFxuICAgICAgICBoaWdobGlnaHQ6IFtdLFxuICAgICAgICBvdGhlcnM6IFtdLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgdG9wMywgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcbiAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAuZmxhdCgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnVG9wV2FsbGV0JywgaGlnaGxpZ2h0OiB0b3AzLCBvdGhlcnMgfTtcbiAgfSwgW3dhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWRdKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgdXNlT3V0c2lkZUNsaWNrKGNvbnRlbnRSZWYsIG9uQ2xvc2UpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbXG4gICAgICAgIHR3YG1heC13LW1kIHctZnVsbCByZWxhdGl2ZSBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLXhsIHRyYW5zaXRpb24taGVpZ2h0IGR1cmF0aW9uLTUwMCBlYXNlLWluLW91dGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8TGlzdE9mV2FsbGV0cyBsaXN0PXtsaXN0fSBvblRvZ2dsZT17b25Ub2dnbGV9IGlzT3Blbj17aXNPcGVufSAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2ZtVW5pZmllZFdhbGxldE1vZGFsO1xuIl19 */"]
    }, isMobile() ? jsx(WalletIcon, {
      wallet: adapter,
      width: 24,
      height: 24
    }) : jsx(WalletIcon, {
      wallet: adapter,
      width: 30,
      height: 30
    }), jsx("span", {
      css: _ref8
    }, adapterName), attachment ? jsx("div", null, attachment) : null));
  })), jsx("div", {
    css: _ref9
  }, list.highlight.map((adapter, idx) => {
    const adapterName = (() => {
      if (adapter.name === SolanaMobileWalletAdapterWalletName) return t(`Mobile`);
      return adapter.name;
    })();
    const attachment = walletAttachments ? walletAttachments[adapter.name]?.attachment : null;
    return jsx("div", {
      key: idx,
      onClick: event => onClickWallet(event, adapter),
      css: ["display:flex;width:100%;flex:1 1 0%;cursor:pointer;align-items:center;border-radius:0.5rem;border-width:1px;border-color:rgb(255 255 255 / 0.1);padding:1px;@media (min-width: 1024px){justify-content:center;}transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;:hover{--tw-backdrop-blur:blur(24px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);}--tw-gradient-from:#8057FF var(--tw-gradient-from-position);--tw-gradient-to:#D84E76 var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from), var(--tw-gradient-to);:hover{background-image:linear-gradient(to right, var(--tw-gradient-stops));}", styles$1.walletItem[theme], process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF5TWdCIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcbmltcG9ydCB7IFdhbGxldEljb24sIFdhbGxldExpc3RJdGVtIH0gZnJvbSAnLi9XYWxsZXRMaXN0SXRlbSc7XG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENsb3NlSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DbG9zZUljb24nO1xuaW1wb3J0IHsgaXNNb2JpbGUsIHVzZU91dHNpZGVDbGljayB9IGZyb20gJy4uLy4uL21pc2MvdXRpbHMnO1xuaW1wb3J0IE5vdEluc3RhbGxlZCBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi4vVW5pZmllZFdhbGxldE1vZGFsL09uYm9hcmRpbmcnO1xuaW1wb3J0IHsgU2ZtTG9nbyB9IGZyb20gJy4vU2ZtTG9nbyc7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUgYmctW3JnYig0OSwgNjIsIDc2KV1gXSxcbiAgfSxcbiAgc2hhZGVzOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyNmZmZmZmZdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjM0EzQjQzXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bcmdiKDQ5LCA2MiwgNzYpXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gIH0sXG4gIHdhbGxldEl0ZW06IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYXktNTAgaG92ZXI6c2hhZG93LWxnYF0sXG4gICAgZGFyazogW3R3YGJnLWRhcmstNzAwIGhvdmVyOnNoYWRvdy0yeGxgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICB9LFxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBmbGV4LXJvdyBqdXN0aWZ5LWNlbnRlciBgLCBzdHlsZXMuaGVhZGVyW3RoZW1lXV19PlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPXtTZm1Mb2dvfSBhbHQ9XCJsb2dvXCIgLz5cbiAgICAgICAgPGRpdiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14bCAtbXQtMTBcIj5cbiAgICAgICAgICA8c3BhbiBjc3M9e1t0d2B0ZXh0LXRyYW5zcGFyZW50IGJnLWNsaXAtdGV4dCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWBdfT5cbiAgICAgICAgICAgIHt0KGBDb25uZWN0IFdhbGxldGApfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC1zbSBtdC0xIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgYSB3YWxsZXQgdG8gcHJvY2VlZGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lIHRleHQtY2VudGVyYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QucmVjb21tZW5kZWRXYWxsZXRzLm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgICAgICAgICAgIC8vIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQtbGcgbWwtNCBsZzptbC0yXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHthdHRhY2htZW50ID8gPGRpdj57YXR0YWNobWVudH08L2Rpdj4gOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtMiBmbGV4IGZsZXgtY29sIHNwYWNlLXktMiBcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHQubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHAtWzFweF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmFja2Ryb3AtYmx1ci14bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiZy1ncmFkaWVudC10by1yICBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWdyZXktNTAwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3QoYE1vcmUgb3B0aW9uc2ApfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgdGV4dC14cyBmbGV4IGp1c3RpZnktY2VudGVyIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdLFxuICAgICAgICAgIF19XG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyh0cnVlKX0+XG4gICAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqL31cbiAgICAgIHtpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgICA8Lz5cbiAgICAgICkgOiBudWxsfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnQ29pbmJhc2UgV2FsbGV0JyBhcyBXYWxsZXROYW1lPCdDb2luYmFzZSBXYWxsZXQnPixcbiAgJ0JhY2twYWNrJyBhcyBXYWxsZXROYW1lPCdCYWNrcGFjayc+LFxuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuXTtcblxuaW50ZXJmYWNlIElVbmlmaWVkV2FsbGV0TW9kYWwge1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBzb3J0QnlQcmVjZWRlbmNlID0gKHdhbGxldFByZWNlZGVuY2U6IFdhbGxldE5hbWVbXSkgPT4gKGE6IEFkYXB0ZXIsIGI6IEFkYXB0ZXIpID0+IHtcbiAgaWYgKCF3YWxsZXRQcmVjZWRlbmNlKSByZXR1cm4gMDtcblxuICBjb25zdCBhSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYS5uYW1lKTtcbiAgY29uc3QgYkluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGIubmFtZSk7XG5cbiAgaWYgKGFJbmRleCA9PT0gLTEgJiYgYkluZGV4ID09PSAtMSkgcmV0dXJuIDA7XG4gIGlmIChhSW5kZXggPj0gMCkge1xuICAgIGlmIChiSW5kZXggPT09IC0xKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgfVxuXG4gIGlmIChiSW5kZXggPj0gMCkge1xuICAgIGlmIChhSW5kZXggPT09IC0xKSByZXR1cm4gMTtcbiAgICByZXR1cm4gYkluZGV4IC0gYUluZGV4O1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuY29uc3QgU2ZtVW5pZmllZFdhbGxldE1vZGFsOiBSZWFjdC5GQzxJVW5pZmllZFdhbGxldE1vZGFsPiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHdhbGxldHMgfSA9IHVzZVVuaWZpZWRXYWxsZXQoKTtcbiAgY29uc3QgeyB3YWxsZXRQcmVjZWRlbmNlLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgW2lzT3Blbiwgb25Ub2dnbGVdID0gdXNlVG9nZ2xlKGZhbHNlKTtcbiAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZCA9IHVzZVByZXZpb3VzbHlDb25uZWN0ZWQoKTtcblxuICBjb25zdCBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH0gPSB1c2VNZW1vKCgpID0+IHtcbiAgICAvLyBUaGVuLCBJbnN0YWxsZWQsIFRvcCAzLCBMb2FkYWJsZSwgTm90RGV0ZWN0ZWRcbiAgICBjb25zdCBmaWx0ZXJlZEFkYXB0ZXJzID0gd2FsbGV0cy5yZWR1Y2U8e1xuICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogQWRhcHRlcltdO1xuICAgICAgaW5zdGFsbGVkOiBBZGFwdGVyW107XG4gICAgICB0b3AzOiBBZGFwdGVyW107XG4gICAgICBsb2FkYWJsZTogQWRhcHRlcltdO1xuICAgICAgbm90RGV0ZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIH0+KFxuICAgICAgKGFjYywgd2FsbGV0KSA9PiB7XG4gICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gd2FsbGV0LmFkYXB0ZXIubmFtZTtcblxuICAgICAgICBpZiAoUkVDT01NRU5ERURfV0FMTEVUUy5zb21lKCh3YWxsZXQpID0+IHdhbGxldCA9PT0gYWRhcHRlck5hbWUpICYmIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgZHVwbGljYXRlcyBzaW5jZSBDb2luYmFzZSBXYWxsZXQgaGFzIHR3byBhZGFwdGVycyBkdXBsaWNhdGVcbiAgICAgICAgICBpZiAoYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5zb21lKCh3YWxsZXQpID0+IHdhbGxldC5uYW1lID09PSBhZGFwdGVyTmFtZSkpIHJldHVybiBhY2M7XG4gICAgICAgICAgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmlvdXNseSBjb25uZWN0ZWQgdGFrZXMgaGlnaGVzdFxuICAgICAgICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPSBwcmV2aW91c2x5Q29ubmVjdGVkLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAocHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MucHJldmlvdXNseUNvbm5lY3RlZFtwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGVuIEluc3RhbGxlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgYWNjLmluc3RhbGxlZC5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRvcCAzXG4gICAgICAgIGNvbnN0IHRvcFdhbGxldHNJbmRleCA9IFRPUF9XQUxMRVRTLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAodG9wV2FsbGV0c0luZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MudG9wM1t0b3BXYWxsZXRzSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBMb2FkYWJsZVxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTG9hZGFibGUpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBOb3REZXRlY3RlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBbXSxcbiAgICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogW10sXG4gICAgICAgIGluc3RhbGxlZDogW10sXG4gICAgICAgIHRvcDM6IFtdLFxuICAgICAgICBsb2FkYWJsZTogW10sXG4gICAgICAgIG5vdERldGVjdGVkOiBbXSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG5cbiAgICAgIGNvbnN0IGhpZ2hsaWdodCA9IGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgwLCAzKTtcbiAgICAgIGxldCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMywgZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCkpO1xuICAgICAgb3RoZXJzID0gb3RoZXJzLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnUHJldmlvdXNseUNvbm5lY3RlZCcsXG4gICAgICAgIGhpZ2hsaWdodCxcbiAgICAgICAgb3RoZXJzLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIGluc3RhbGxlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc29sZS5sb2cocmVjb21tZW5kZWRXYWxsZXRzKTtcbiAgICAgIC8vIFNvcnQgdGhlIGluc3RhbGxlZCB3YWxsZXRzIGFjY29yZGluZyB0byB0aGUgdG9wIHdhbGxldHMgdGhhdCB3ZSB3YW50IHRvIHNob3cgdG8gdGhlIHVzZXIgZmlyc3RcbiAgICAgIGNvbnN0IGhpZ2hsaWdodDogQWRhcHRlcltdID0gW107XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgaW5zdGFsbGVkIHdhbGxldCBhZGFwdGVycyBhbmQgY2hlY2sgaWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXRzIGxpc3RcbiAgICAgIC8vIElmIHRoZXkgYXJlIGluIHRoZSB0b3Agd2FsbGV0IGxpc3QsIHdlIHdpbGwgYWRkIGl0IHRvIHRoZSBmaWx0ZXJlZCByZWNvbW1lbmRlIHdhbGxldHNcbiAgICAgIFRPUF9XQUxMRVRTLmZvckVhY2goKHRvcFdhbGxldCkgPT4ge1xuICAgICAgICBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5mb3JFYWNoKChpbnN0YWxsZWRXYWxsZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKHRvcFdhbGxldCA9PT0gaW5zdGFsbGVkV2FsbGV0Lm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhbGxldFRvUHVzaCA9IGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgICAgICAgICBoaWdobGlnaHQucHVzaCh3YWxsZXRUb1B1c2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gaGlnaGxpZ2h0LnB1c2goLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMSkpO1xuICAgICAgY29uc29sZS5sb2coaGlnaGxpZ2h0KTtcbiAgICAgIGNvbnNvbGUubG9nKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDAsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLFxuICAgICAgICBoaWdobGlnaHQ6IFtdLFxuICAgICAgICBvdGhlcnM6IFtdLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgdG9wMywgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcbiAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAuZmxhdCgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnVG9wV2FsbGV0JywgaGlnaGxpZ2h0OiB0b3AzLCBvdGhlcnMgfTtcbiAgfSwgW3dhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWRdKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgdXNlT3V0c2lkZUNsaWNrKGNvbnRlbnRSZWYsIG9uQ2xvc2UpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbXG4gICAgICAgIHR3YG1heC13LW1kIHctZnVsbCByZWxhdGl2ZSBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLXhsIHRyYW5zaXRpb24taGVpZ2h0IGR1cmF0aW9uLTUwMCBlYXNlLWluLW91dGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8TGlzdE9mV2FsbGV0cyBsaXN0PXtsaXN0fSBvblRvZ2dsZT17b25Ub2dnbGV9IGlzT3Blbj17aXNPcGVufSAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2ZtVW5pZmllZFdhbGxldE1vZGFsO1xuIl19 */", process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF5TWdCIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcbmltcG9ydCB7IFdhbGxldEljb24sIFdhbGxldExpc3RJdGVtIH0gZnJvbSAnLi9XYWxsZXRMaXN0SXRlbSc7XG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENsb3NlSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DbG9zZUljb24nO1xuaW1wb3J0IHsgaXNNb2JpbGUsIHVzZU91dHNpZGVDbGljayB9IGZyb20gJy4uLy4uL21pc2MvdXRpbHMnO1xuaW1wb3J0IE5vdEluc3RhbGxlZCBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi4vVW5pZmllZFdhbGxldE1vZGFsL09uYm9hcmRpbmcnO1xuaW1wb3J0IHsgU2ZtTG9nbyB9IGZyb20gJy4vU2ZtTG9nbyc7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUgYmctW3JnYig0OSwgNjIsIDc2KV1gXSxcbiAgfSxcbiAgc2hhZGVzOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyNmZmZmZmZdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjM0EzQjQzXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bcmdiKDQ5LCA2MiwgNzYpXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gIH0sXG4gIHdhbGxldEl0ZW06IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYXktNTAgaG92ZXI6c2hhZG93LWxnYF0sXG4gICAgZGFyazogW3R3YGJnLWRhcmstNzAwIGhvdmVyOnNoYWRvdy0yeGxgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICB9LFxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBmbGV4LXJvdyBqdXN0aWZ5LWNlbnRlciBgLCBzdHlsZXMuaGVhZGVyW3RoZW1lXV19PlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPXtTZm1Mb2dvfSBhbHQ9XCJsb2dvXCIgLz5cbiAgICAgICAgPGRpdiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14bCAtbXQtMTBcIj5cbiAgICAgICAgICA8c3BhbiBjc3M9e1t0d2B0ZXh0LXRyYW5zcGFyZW50IGJnLWNsaXAtdGV4dCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWBdfT5cbiAgICAgICAgICAgIHt0KGBDb25uZWN0IFdhbGxldGApfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC1zbSBtdC0xIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgYSB3YWxsZXQgdG8gcHJvY2VlZGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lIHRleHQtY2VudGVyYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QucmVjb21tZW5kZWRXYWxsZXRzLm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgICAgICAgICAgIC8vIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQtbGcgbWwtNCBsZzptbC0yXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHthdHRhY2htZW50ID8gPGRpdj57YXR0YWNobWVudH08L2Rpdj4gOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtMiBmbGV4IGZsZXgtY29sIHNwYWNlLXktMiBcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHQubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHAtWzFweF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmFja2Ryb3AtYmx1ci14bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiZy1ncmFkaWVudC10by1yICBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWdyZXktNTAwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3QoYE1vcmUgb3B0aW9uc2ApfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgdGV4dC14cyBmbGV4IGp1c3RpZnktY2VudGVyIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdLFxuICAgICAgICAgIF19XG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyh0cnVlKX0+XG4gICAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqL31cbiAgICAgIHtpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgICA8Lz5cbiAgICAgICkgOiBudWxsfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnQ29pbmJhc2UgV2FsbGV0JyBhcyBXYWxsZXROYW1lPCdDb2luYmFzZSBXYWxsZXQnPixcbiAgJ0JhY2twYWNrJyBhcyBXYWxsZXROYW1lPCdCYWNrcGFjayc+LFxuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuXTtcblxuaW50ZXJmYWNlIElVbmlmaWVkV2FsbGV0TW9kYWwge1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBzb3J0QnlQcmVjZWRlbmNlID0gKHdhbGxldFByZWNlZGVuY2U6IFdhbGxldE5hbWVbXSkgPT4gKGE6IEFkYXB0ZXIsIGI6IEFkYXB0ZXIpID0+IHtcbiAgaWYgKCF3YWxsZXRQcmVjZWRlbmNlKSByZXR1cm4gMDtcblxuICBjb25zdCBhSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYS5uYW1lKTtcbiAgY29uc3QgYkluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGIubmFtZSk7XG5cbiAgaWYgKGFJbmRleCA9PT0gLTEgJiYgYkluZGV4ID09PSAtMSkgcmV0dXJuIDA7XG4gIGlmIChhSW5kZXggPj0gMCkge1xuICAgIGlmIChiSW5kZXggPT09IC0xKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgfVxuXG4gIGlmIChiSW5kZXggPj0gMCkge1xuICAgIGlmIChhSW5kZXggPT09IC0xKSByZXR1cm4gMTtcbiAgICByZXR1cm4gYkluZGV4IC0gYUluZGV4O1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuY29uc3QgU2ZtVW5pZmllZFdhbGxldE1vZGFsOiBSZWFjdC5GQzxJVW5pZmllZFdhbGxldE1vZGFsPiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHdhbGxldHMgfSA9IHVzZVVuaWZpZWRXYWxsZXQoKTtcbiAgY29uc3QgeyB3YWxsZXRQcmVjZWRlbmNlLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgW2lzT3Blbiwgb25Ub2dnbGVdID0gdXNlVG9nZ2xlKGZhbHNlKTtcbiAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZCA9IHVzZVByZXZpb3VzbHlDb25uZWN0ZWQoKTtcblxuICBjb25zdCBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH0gPSB1c2VNZW1vKCgpID0+IHtcbiAgICAvLyBUaGVuLCBJbnN0YWxsZWQsIFRvcCAzLCBMb2FkYWJsZSwgTm90RGV0ZWN0ZWRcbiAgICBjb25zdCBmaWx0ZXJlZEFkYXB0ZXJzID0gd2FsbGV0cy5yZWR1Y2U8e1xuICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogQWRhcHRlcltdO1xuICAgICAgaW5zdGFsbGVkOiBBZGFwdGVyW107XG4gICAgICB0b3AzOiBBZGFwdGVyW107XG4gICAgICBsb2FkYWJsZTogQWRhcHRlcltdO1xuICAgICAgbm90RGV0ZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIH0+KFxuICAgICAgKGFjYywgd2FsbGV0KSA9PiB7XG4gICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gd2FsbGV0LmFkYXB0ZXIubmFtZTtcblxuICAgICAgICBpZiAoUkVDT01NRU5ERURfV0FMTEVUUy5zb21lKCh3YWxsZXQpID0+IHdhbGxldCA9PT0gYWRhcHRlck5hbWUpICYmIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgZHVwbGljYXRlcyBzaW5jZSBDb2luYmFzZSBXYWxsZXQgaGFzIHR3byBhZGFwdGVycyBkdXBsaWNhdGVcbiAgICAgICAgICBpZiAoYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5zb21lKCh3YWxsZXQpID0+IHdhbGxldC5uYW1lID09PSBhZGFwdGVyTmFtZSkpIHJldHVybiBhY2M7XG4gICAgICAgICAgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmlvdXNseSBjb25uZWN0ZWQgdGFrZXMgaGlnaGVzdFxuICAgICAgICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPSBwcmV2aW91c2x5Q29ubmVjdGVkLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAocHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MucHJldmlvdXNseUNvbm5lY3RlZFtwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGVuIEluc3RhbGxlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgYWNjLmluc3RhbGxlZC5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRvcCAzXG4gICAgICAgIGNvbnN0IHRvcFdhbGxldHNJbmRleCA9IFRPUF9XQUxMRVRTLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAodG9wV2FsbGV0c0luZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MudG9wM1t0b3BXYWxsZXRzSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBMb2FkYWJsZVxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTG9hZGFibGUpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBOb3REZXRlY3RlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBbXSxcbiAgICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogW10sXG4gICAgICAgIGluc3RhbGxlZDogW10sXG4gICAgICAgIHRvcDM6IFtdLFxuICAgICAgICBsb2FkYWJsZTogW10sXG4gICAgICAgIG5vdERldGVjdGVkOiBbXSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG5cbiAgICAgIGNvbnN0IGhpZ2hsaWdodCA9IGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgwLCAzKTtcbiAgICAgIGxldCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMywgZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCkpO1xuICAgICAgb3RoZXJzID0gb3RoZXJzLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnUHJldmlvdXNseUNvbm5lY3RlZCcsXG4gICAgICAgIGhpZ2hsaWdodCxcbiAgICAgICAgb3RoZXJzLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIGluc3RhbGxlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc29sZS5sb2cocmVjb21tZW5kZWRXYWxsZXRzKTtcbiAgICAgIC8vIFNvcnQgdGhlIGluc3RhbGxlZCB3YWxsZXRzIGFjY29yZGluZyB0byB0aGUgdG9wIHdhbGxldHMgdGhhdCB3ZSB3YW50IHRvIHNob3cgdG8gdGhlIHVzZXIgZmlyc3RcbiAgICAgIGNvbnN0IGhpZ2hsaWdodDogQWRhcHRlcltdID0gW107XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgaW5zdGFsbGVkIHdhbGxldCBhZGFwdGVycyBhbmQgY2hlY2sgaWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXRzIGxpc3RcbiAgICAgIC8vIElmIHRoZXkgYXJlIGluIHRoZSB0b3Agd2FsbGV0IGxpc3QsIHdlIHdpbGwgYWRkIGl0IHRvIHRoZSBmaWx0ZXJlZCByZWNvbW1lbmRlIHdhbGxldHNcbiAgICAgIFRPUF9XQUxMRVRTLmZvckVhY2goKHRvcFdhbGxldCkgPT4ge1xuICAgICAgICBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5mb3JFYWNoKChpbnN0YWxsZWRXYWxsZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKHRvcFdhbGxldCA9PT0gaW5zdGFsbGVkV2FsbGV0Lm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhbGxldFRvUHVzaCA9IGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgICAgICAgICBoaWdobGlnaHQucHVzaCh3YWxsZXRUb1B1c2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gaGlnaGxpZ2h0LnB1c2goLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMSkpO1xuICAgICAgY29uc29sZS5sb2coaGlnaGxpZ2h0KTtcbiAgICAgIGNvbnNvbGUubG9nKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDAsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLFxuICAgICAgICBoaWdobGlnaHQ6IFtdLFxuICAgICAgICBvdGhlcnM6IFtdLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgdG9wMywgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcbiAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAuZmxhdCgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnVG9wV2FsbGV0JywgaGlnaGxpZ2h0OiB0b3AzLCBvdGhlcnMgfTtcbiAgfSwgW3dhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWRdKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgdXNlT3V0c2lkZUNsaWNrKGNvbnRlbnRSZWYsIG9uQ2xvc2UpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbXG4gICAgICAgIHR3YG1heC13LW1kIHctZnVsbCByZWxhdGl2ZSBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLXhsIHRyYW5zaXRpb24taGVpZ2h0IGR1cmF0aW9uLTUwMCBlYXNlLWluLW91dGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8TGlzdE9mV2FsbGV0cyBsaXN0PXtsaXN0fSBvblRvZ2dsZT17b25Ub2dnbGV9IGlzT3Blbj17aXNPcGVufSAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2ZtVW5pZmllZFdhbGxldE1vZGFsO1xuIl19 */"]
    }, jsx("div", {
      css: ["display:flex;width:100%;flex:1 1 0%;cursor:pointer;align-items:center;border-radius:0.5rem;padding-left:1rem;padding-right:1rem;padding-top:1rem;padding-bottom:1rem;@media (min-width: 1024px){justify-content:center;padding-left:0.5rem;padding-right:0.5rem;}", styles$1.walletItem[theme], process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFpTmtCIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcbmltcG9ydCB7IFdhbGxldEljb24sIFdhbGxldExpc3RJdGVtIH0gZnJvbSAnLi9XYWxsZXRMaXN0SXRlbSc7XG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENsb3NlSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DbG9zZUljb24nO1xuaW1wb3J0IHsgaXNNb2JpbGUsIHVzZU91dHNpZGVDbGljayB9IGZyb20gJy4uLy4uL21pc2MvdXRpbHMnO1xuaW1wb3J0IE5vdEluc3RhbGxlZCBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi4vVW5pZmllZFdhbGxldE1vZGFsL09uYm9hcmRpbmcnO1xuaW1wb3J0IHsgU2ZtTG9nbyB9IGZyb20gJy4vU2ZtTG9nbyc7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUgYmctW3JnYig0OSwgNjIsIDc2KV1gXSxcbiAgfSxcbiAgc2hhZGVzOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyNmZmZmZmZdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjM0EzQjQzXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bcmdiKDQ5LCA2MiwgNzYpXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gIH0sXG4gIHdhbGxldEl0ZW06IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYXktNTAgaG92ZXI6c2hhZG93LWxnYF0sXG4gICAgZGFyazogW3R3YGJnLWRhcmstNzAwIGhvdmVyOnNoYWRvdy0yeGxgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICB9LFxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBmbGV4LXJvdyBqdXN0aWZ5LWNlbnRlciBgLCBzdHlsZXMuaGVhZGVyW3RoZW1lXV19PlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPXtTZm1Mb2dvfSBhbHQ9XCJsb2dvXCIgLz5cbiAgICAgICAgPGRpdiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14bCAtbXQtMTBcIj5cbiAgICAgICAgICA8c3BhbiBjc3M9e1t0d2B0ZXh0LXRyYW5zcGFyZW50IGJnLWNsaXAtdGV4dCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWBdfT5cbiAgICAgICAgICAgIHt0KGBDb25uZWN0IFdhbGxldGApfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC1zbSBtdC0xIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgYSB3YWxsZXQgdG8gcHJvY2VlZGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lIHRleHQtY2VudGVyYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QucmVjb21tZW5kZWRXYWxsZXRzLm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgICAgICAgICAgIC8vIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQtbGcgbWwtNCBsZzptbC0yXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHthdHRhY2htZW50ID8gPGRpdj57YXR0YWNobWVudH08L2Rpdj4gOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtMiBmbGV4IGZsZXgtY29sIHNwYWNlLXktMiBcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHQubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHAtWzFweF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmFja2Ryb3AtYmx1ci14bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiZy1ncmFkaWVudC10by1yICBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWdyZXktNTAwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3QoYE1vcmUgb3B0aW9uc2ApfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgdGV4dC14cyBmbGV4IGp1c3RpZnktY2VudGVyIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdLFxuICAgICAgICAgIF19XG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyh0cnVlKX0+XG4gICAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqL31cbiAgICAgIHtpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgICA8Lz5cbiAgICAgICkgOiBudWxsfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnQ29pbmJhc2UgV2FsbGV0JyBhcyBXYWxsZXROYW1lPCdDb2luYmFzZSBXYWxsZXQnPixcbiAgJ0JhY2twYWNrJyBhcyBXYWxsZXROYW1lPCdCYWNrcGFjayc+LFxuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuXTtcblxuaW50ZXJmYWNlIElVbmlmaWVkV2FsbGV0TW9kYWwge1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBzb3J0QnlQcmVjZWRlbmNlID0gKHdhbGxldFByZWNlZGVuY2U6IFdhbGxldE5hbWVbXSkgPT4gKGE6IEFkYXB0ZXIsIGI6IEFkYXB0ZXIpID0+IHtcbiAgaWYgKCF3YWxsZXRQcmVjZWRlbmNlKSByZXR1cm4gMDtcblxuICBjb25zdCBhSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYS5uYW1lKTtcbiAgY29uc3QgYkluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGIubmFtZSk7XG5cbiAgaWYgKGFJbmRleCA9PT0gLTEgJiYgYkluZGV4ID09PSAtMSkgcmV0dXJuIDA7XG4gIGlmIChhSW5kZXggPj0gMCkge1xuICAgIGlmIChiSW5kZXggPT09IC0xKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgfVxuXG4gIGlmIChiSW5kZXggPj0gMCkge1xuICAgIGlmIChhSW5kZXggPT09IC0xKSByZXR1cm4gMTtcbiAgICByZXR1cm4gYkluZGV4IC0gYUluZGV4O1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuY29uc3QgU2ZtVW5pZmllZFdhbGxldE1vZGFsOiBSZWFjdC5GQzxJVW5pZmllZFdhbGxldE1vZGFsPiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHdhbGxldHMgfSA9IHVzZVVuaWZpZWRXYWxsZXQoKTtcbiAgY29uc3QgeyB3YWxsZXRQcmVjZWRlbmNlLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgW2lzT3Blbiwgb25Ub2dnbGVdID0gdXNlVG9nZ2xlKGZhbHNlKTtcbiAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZCA9IHVzZVByZXZpb3VzbHlDb25uZWN0ZWQoKTtcblxuICBjb25zdCBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH0gPSB1c2VNZW1vKCgpID0+IHtcbiAgICAvLyBUaGVuLCBJbnN0YWxsZWQsIFRvcCAzLCBMb2FkYWJsZSwgTm90RGV0ZWN0ZWRcbiAgICBjb25zdCBmaWx0ZXJlZEFkYXB0ZXJzID0gd2FsbGV0cy5yZWR1Y2U8e1xuICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogQWRhcHRlcltdO1xuICAgICAgaW5zdGFsbGVkOiBBZGFwdGVyW107XG4gICAgICB0b3AzOiBBZGFwdGVyW107XG4gICAgICBsb2FkYWJsZTogQWRhcHRlcltdO1xuICAgICAgbm90RGV0ZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIH0+KFxuICAgICAgKGFjYywgd2FsbGV0KSA9PiB7XG4gICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gd2FsbGV0LmFkYXB0ZXIubmFtZTtcblxuICAgICAgICBpZiAoUkVDT01NRU5ERURfV0FMTEVUUy5zb21lKCh3YWxsZXQpID0+IHdhbGxldCA9PT0gYWRhcHRlck5hbWUpICYmIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgZHVwbGljYXRlcyBzaW5jZSBDb2luYmFzZSBXYWxsZXQgaGFzIHR3byBhZGFwdGVycyBkdXBsaWNhdGVcbiAgICAgICAgICBpZiAoYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5zb21lKCh3YWxsZXQpID0+IHdhbGxldC5uYW1lID09PSBhZGFwdGVyTmFtZSkpIHJldHVybiBhY2M7XG4gICAgICAgICAgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmlvdXNseSBjb25uZWN0ZWQgdGFrZXMgaGlnaGVzdFxuICAgICAgICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPSBwcmV2aW91c2x5Q29ubmVjdGVkLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAocHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MucHJldmlvdXNseUNvbm5lY3RlZFtwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGVuIEluc3RhbGxlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgYWNjLmluc3RhbGxlZC5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRvcCAzXG4gICAgICAgIGNvbnN0IHRvcFdhbGxldHNJbmRleCA9IFRPUF9XQUxMRVRTLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAodG9wV2FsbGV0c0luZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MudG9wM1t0b3BXYWxsZXRzSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBMb2FkYWJsZVxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTG9hZGFibGUpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBOb3REZXRlY3RlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBbXSxcbiAgICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogW10sXG4gICAgICAgIGluc3RhbGxlZDogW10sXG4gICAgICAgIHRvcDM6IFtdLFxuICAgICAgICBsb2FkYWJsZTogW10sXG4gICAgICAgIG5vdERldGVjdGVkOiBbXSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG5cbiAgICAgIGNvbnN0IGhpZ2hsaWdodCA9IGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgwLCAzKTtcbiAgICAgIGxldCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMywgZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCkpO1xuICAgICAgb3RoZXJzID0gb3RoZXJzLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnUHJldmlvdXNseUNvbm5lY3RlZCcsXG4gICAgICAgIGhpZ2hsaWdodCxcbiAgICAgICAgb3RoZXJzLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIGluc3RhbGxlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc29sZS5sb2cocmVjb21tZW5kZWRXYWxsZXRzKTtcbiAgICAgIC8vIFNvcnQgdGhlIGluc3RhbGxlZCB3YWxsZXRzIGFjY29yZGluZyB0byB0aGUgdG9wIHdhbGxldHMgdGhhdCB3ZSB3YW50IHRvIHNob3cgdG8gdGhlIHVzZXIgZmlyc3RcbiAgICAgIGNvbnN0IGhpZ2hsaWdodDogQWRhcHRlcltdID0gW107XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgaW5zdGFsbGVkIHdhbGxldCBhZGFwdGVycyBhbmQgY2hlY2sgaWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXRzIGxpc3RcbiAgICAgIC8vIElmIHRoZXkgYXJlIGluIHRoZSB0b3Agd2FsbGV0IGxpc3QsIHdlIHdpbGwgYWRkIGl0IHRvIHRoZSBmaWx0ZXJlZCByZWNvbW1lbmRlIHdhbGxldHNcbiAgICAgIFRPUF9XQUxMRVRTLmZvckVhY2goKHRvcFdhbGxldCkgPT4ge1xuICAgICAgICBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5mb3JFYWNoKChpbnN0YWxsZWRXYWxsZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKHRvcFdhbGxldCA9PT0gaW5zdGFsbGVkV2FsbGV0Lm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhbGxldFRvUHVzaCA9IGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgICAgICAgICBoaWdobGlnaHQucHVzaCh3YWxsZXRUb1B1c2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gaGlnaGxpZ2h0LnB1c2goLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMSkpO1xuICAgICAgY29uc29sZS5sb2coaGlnaGxpZ2h0KTtcbiAgICAgIGNvbnNvbGUubG9nKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDAsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLFxuICAgICAgICBoaWdobGlnaHQ6IFtdLFxuICAgICAgICBvdGhlcnM6IFtdLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgdG9wMywgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcbiAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAuZmxhdCgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnVG9wV2FsbGV0JywgaGlnaGxpZ2h0OiB0b3AzLCBvdGhlcnMgfTtcbiAgfSwgW3dhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWRdKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgdXNlT3V0c2lkZUNsaWNrKGNvbnRlbnRSZWYsIG9uQ2xvc2UpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbXG4gICAgICAgIHR3YG1heC13LW1kIHctZnVsbCByZWxhdGl2ZSBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLXhsIHRyYW5zaXRpb24taGVpZ2h0IGR1cmF0aW9uLTUwMCBlYXNlLWluLW91dGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8TGlzdE9mV2FsbGV0cyBsaXN0PXtsaXN0fSBvblRvZ2dsZT17b25Ub2dnbGV9IGlzT3Blbj17aXNPcGVufSAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2ZtVW5pZmllZFdhbGxldE1vZGFsO1xuIl19 */", process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFpTmtCIiwiZmlsZSI6ImluZGV4LnRzeCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXIsIFdhbGxldE5hbWUsIFdhbGxldFJlYWR5U3RhdGUgfSBmcm9tICdAc29sYW5hL3dhbGxldC1hZGFwdGVyLWJhc2UnO1xuaW1wb3J0IFJlYWN0LCB7IFJlYWN0Tm9kZSwgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlVG9nZ2xlIH0gZnJvbSAncmVhY3QtdXNlJztcbmltcG9ydCB7IFdhbGxldEljb24sIFdhbGxldExpc3RJdGVtIH0gZnJvbSAnLi9XYWxsZXRMaXN0SXRlbSc7XG5pbXBvcnQgQ29sbGFwc2UgZnJvbSAnLi4vLi4vY29tcG9uZW50cy9Db2xsYXBzZSc7XG5pbXBvcnQgeyBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSB9IGZyb20gJ0Bzb2xhbmEtbW9iaWxlL3dhbGxldC1hZGFwdGVyLW1vYmlsZSc7XG5pbXBvcnQgdHcsIHsgVHdTdHlsZSB9IGZyb20gJ3R3aW4ubWFjcm8nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICcuLi8uLi9jb250ZXh0cy9UcmFuc2xhdGlvblByb3ZpZGVyJztcbmltcG9ydCB7IElVbmlmaWVkVGhlbWUsIHVzZVVuaWZpZWRXYWxsZXQsIHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dHMvVW5pZmllZFdhbGxldENvbnRleHQnO1xuaW1wb3J0IHsgdXNlUHJldmlvdXNseUNvbm5lY3RlZCB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1dhbGxldENvbm5lY3Rpb25Qcm92aWRlci9wcmV2aW91c2x5Q29ubmVjdGVkUHJvdmlkZXInO1xuaW1wb3J0IENsb3NlSWNvbiBmcm9tICcuLi8uLi9pY29ucy9DbG9zZUljb24nO1xuaW1wb3J0IHsgaXNNb2JpbGUsIHVzZU91dHNpZGVDbGljayB9IGZyb20gJy4uLy4uL21pc2MvdXRpbHMnO1xuaW1wb3J0IE5vdEluc3RhbGxlZCBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvTm90SW5zdGFsbGVkJztcbmltcG9ydCB7IE9uYm9hcmRpbmdGbG93IH0gZnJvbSAnLi4vVW5pZmllZFdhbGxldE1vZGFsL09uYm9hcmRpbmcnO1xuaW1wb3J0IHsgU2ZtTG9nbyB9IGZyb20gJy4vU2ZtTG9nbyc7XG5cbmNvbnN0IHN0eWxlczogUmVjb3JkPHN0cmluZywgeyBba2V5IGluIElVbmlmaWVkVGhlbWVdOiBUd1N0eWxlW10gfT4gPSB7XG4gIGNvbnRhaW5lcjoge1xuICAgIGxpZ2h0OiBbdHdgYmctbGlnaHQtMTAwIHRleHQtZ3JleS03MDBgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgdGV4dC1ncmV5LTUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUgYmctW3JnYig0OSwgNjIsIDc2KV1gXSxcbiAgfSxcbiAgc2hhZGVzOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyNmZmZmZmZdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBkYXJrOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVsjM0EzQjQzXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gICAganVwaXRlcjogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bcmdiKDQ5LCA2MiwgNzYpXSB0by10cmFuc3BhcmVudCBwb2ludGVyLWV2ZW50cy1ub25lYF0sXG4gIH0sXG4gIHdhbGxldEl0ZW06IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYXktNTAgaG92ZXI6c2hhZG93LWxnYF0sXG4gICAgZGFyazogW3R3YGJnLWRhcmstNzAwIGhvdmVyOnNoYWRvdy0yeGxgXSxcbiAgICBqdXBpdGVyOiBbdHdgaG92ZXI6c2hhZG93LTJ4bCBob3ZlcjpiZy13aGl0ZS8xMGBdLFxuICB9LFxuICBzdWJ0aXRsZToge1xuICAgIGxpZ2h0OiBbdHdgdGV4dC1ibGFjay81MGBdLFxuICAgIGRhcms6IFt0d2B0ZXh0LXdoaXRlLzUwYF0sXG4gICAganVwaXRlcjogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgfSxcbiAgaGVhZGVyOiB7XG4gICAgbGlnaHQ6IFt0d2Bib3JkZXItYmBdLFxuICAgIGRhcms6IFtdLFxuICAgIGp1cGl0ZXI6IFtdLFxuICB9LFxuICBidXR0b25UZXh0OiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWdyYXktODAwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvODBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICB9LFxufTtcblxuY29uc3QgSGVhZGVyOiBSZWFjdC5GQzx7IG9uQ2xvc2U6ICgpID0+IHZvaWQgfT4gPSAoeyBvbkNsb3NlIH0pID0+IHtcbiAgY29uc3QgeyB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgeyB0IH0gPSB1c2VUcmFuc2xhdGlvbigpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjc3M9e1t0d2BweC01IHB5LTYgZmxleCBmbGV4LXJvdyBqdXN0aWZ5LWNlbnRlciBgLCBzdHlsZXMuaGVhZGVyW3RoZW1lXV19PlxuICAgICAgPGRpdiB0dz1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyXCI+XG4gICAgICAgIDxpbWcgc3JjPXtTZm1Mb2dvfSBhbHQ9XCJsb2dvXCIgLz5cbiAgICAgICAgPGRpdiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC14bCAtbXQtMTBcIj5cbiAgICAgICAgICA8c3BhbiBjc3M9e1t0d2B0ZXh0LXRyYW5zcGFyZW50IGJnLWNsaXAtdGV4dCBiZy1ncmFkaWVudC10by1yIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWBdfT5cbiAgICAgICAgICAgIHt0KGBDb25uZWN0IFdhbGxldGApfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY3NzPXtbdHdgdGV4dC1zbSBtdC0xIGZvbnQtc2VtaWJvbGRgLCBzdHlsZXMuc3VidGl0bGVbdGhlbWVdXX0+XG4gICAgICAgICAgPHNwYW4+e3QoYENvbm5lY3QgYSB3YWxsZXQgdG8gcHJvY2VlZGApfTwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGJ1dHRvbiB0dz1cImFic29sdXRlIHRvcC00IHJpZ2h0LTRcIiBvbkNsaWNrPXtvbkNsb3NlfT5cbiAgICAgICAgPENsb3NlSWNvbiB3aWR0aD17MTJ9IGhlaWdodD17MTJ9IC8+XG4gICAgICA8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExpc3RPZldhbGxldHM6IFJlYWN0LkZDPHtcbiAgbGlzdDoge1xuICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIGhpZ2hsaWdodGVkQnk6IEhJR0hMSUdIVEVEX0JZO1xuICAgIGhpZ2hsaWdodDogQWRhcHRlcltdO1xuICAgIG90aGVyczogQWRhcHRlcltdO1xuICB9O1xuICBvblRvZ2dsZTogKG5leHRWYWx1ZT86IGFueSkgPT4gdm9pZDtcbiAgaXNPcGVuOiBib29sZWFuO1xufT4gPSAoeyBsaXN0LCBvblRvZ2dsZSwgaXNPcGVuIH0pID0+IHtcbiAgY29uc3QgeyBoYW5kbGVDb25uZWN0Q2xpY2ssIHdhbGxldGxpc3RFeHBsYW5hdGlvbiwgd2FsbGV0QXR0YWNobWVudHMsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IFtzaG93T25ib2FyZGluZywgc2V0U2hvd09uYm9hcmRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2hvd05vdEluc3RhbGxlZCwgc2V0U2hvd05vdEluc3RhbGxlZF0gPSB1c2VTdGF0ZTxBZGFwdGVyIHwgZmFsc2U+KGZhbHNlKTtcblxuICBjb25zdCBvbkNsaWNrV2FsbGV0ID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2ZW50OiBSZWFjdC5Nb3VzZUV2ZW50PEhUTUxFbGVtZW50LCBNb3VzZUV2ZW50PiwgYWRhcHRlcjogQWRhcHRlcikgPT4ge1xuICAgIGlmIChhZGFwdGVyLnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoYWRhcHRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGhhbmRsZUNvbm5lY3RDbGljayhldmVudCwgYWRhcHRlcik7XG4gIH0sIFtdKTtcblxuICBjb25zdCByZW5kZXJXYWxsZXRMaXN0ID0gdXNlTWVtbyhcbiAgICAoKSA9PiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBncmlkIGdhcC0yIGdyaWQtY29scy0yIHBiLTRcIiB0cmFuc2xhdGU9XCJub1wiPlxuICAgICAgICAgIHtsaXN0Lm90aGVycy5tYXAoKGFkYXB0ZXIsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8dWwga2V5PXtpbmRleH0+XG4gICAgICAgICAgICAgICAgPFdhbGxldExpc3RJdGVtIGhhbmRsZUNsaWNrPXsoZSkgPT4gb25DbGlja1dhbGxldChlLCBhZGFwdGVyKX0gd2FsbGV0PXthZGFwdGVyfSAvPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtsaXN0LmhpZ2hsaWdodGVkQnkgIT09ICdPbmJvYXJkaW5nJyAmJiB3YWxsZXRsaXN0RXhwbGFuYXRpb24gPyAoXG4gICAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgdW5kZXJsaW5lIHRleHQtY2VudGVyYCwgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IHR3YG1iLThgIDogJyddfT5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG4gICAgICA8L2Rpdj5cbiAgICApLFxuICAgIFtoYW5kbGVDb25uZWN0Q2xpY2ssIGxpc3Qub3RoZXJzXSxcbiAgKTtcblxuICBjb25zdCBoYXNOb1dhbGxldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICByZXR1cm4gbGlzdC5oaWdobGlnaHQubGVuZ3RoID09PSAwICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMDtcbiAgfSwgW2xpc3RdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChoYXNOb1dhbGxldHMpIHtcbiAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgIH1cbiAgfSwgW2hhc05vV2FsbGV0c10pO1xuXG4gIGlmIChzaG93T25ib2FyZGluZykge1xuICAgIHJldHVybiA8T25ib2FyZGluZ0Zsb3cgc2hvd0JhY2s9eyFoYXNOb1dhbGxldHN9IG9uQ2xvc2U9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKGZhbHNlKX0gLz47XG4gIH1cblxuICBpZiAoc2hvd05vdEluc3RhbGxlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Tm90SW5zdGFsbGVkXG4gICAgICAgIGFkYXB0ZXI9e3Nob3dOb3RJbnN0YWxsZWR9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpfVxuICAgICAgICBvbkdvT25ib2FyZGluZz17KCkgPT4ge1xuICAgICAgICAgIHNldFNob3dPbmJvYXJkaW5nKHRydWUpO1xuICAgICAgICAgIHNldFNob3dOb3RJbnN0YWxsZWQoZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRlU2Nyb2xsYmFyXCIgY3NzPXtbdHdgaC1mdWxsIG92ZXJmbG93LXktYXV0byBwdC0zIHBiLTggcHgtNSByZWxhdGl2ZWAsIGlzT3BlbiAmJiB0d2BtYi03YF19PlxuICAgICAgICA8ZGl2IHR3PVwibXQtNCBmbGV4IGZsZXgtY29sIGxnOmZsZXgtcm93IGxnOnNwYWNlLXgtMiBzcGFjZS15LTIgbGc6c3BhY2UteS0wXCI+XG4gICAgICAgICAge2xpc3QucmVjb21tZW5kZWRXYWxsZXRzLm1hcCgoYWRhcHRlciwgaWR4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhdHRhY2htZW50ID0gd2FsbGV0QXR0YWNobWVudHMgPyB3YWxsZXRBdHRhY2htZW50c1thZGFwdGVyLm5hbWVdPy5hdHRhY2htZW50IDogbnVsbDtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYCxcbiAgICAgICAgICAgICAgICAgIC8vIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICAgIHR3YHB5LTQgcHgtNCBsZzpweC0yIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlcy53YWxsZXRJdGVtW3RoZW1lXSxcbiAgICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2lzTW9iaWxlKCkgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezI0fSBoZWlnaHQ9ezI0fSAvPlxuICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MzB9IGhlaWdodD17MzB9IC8+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPHNwYW4gdHc9XCJmb250LXNlbWlib2xkIHRleHQtbGcgbWwtNCBsZzptbC0yXCI+e2FkYXB0ZXJOYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIHthdHRhY2htZW50ID8gPGRpdj57YXR0YWNobWVudH08L2Rpdj4gOiBudWxsfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IHR3PVwibXQtMiBmbGV4IGZsZXgtY29sIHNwYWNlLXktMiBcIj5cbiAgICAgICAgICB7bGlzdC5oaWdobGlnaHQubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFkYXB0ZXIubmFtZSA9PT0gU29sYW5hTW9iaWxlV2FsbGV0QWRhcHRlcldhbGxldE5hbWUpIHJldHVybiB0KGBNb2JpbGVgKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGFkYXB0ZXIubmFtZTtcbiAgICAgICAgICAgIH0pKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KGV2ZW50KSA9PiBvbkNsaWNrV2FsbGV0KGV2ZW50LCBhZGFwdGVyKX1cbiAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgIHR3YHAtWzFweF0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmFja2Ryb3AtYmx1ci14bCB0cmFuc2l0aW9uLWFsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiZy1ncmFkaWVudC10by1yICBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAge3dhbGxldGxpc3RFeHBsYW5hdGlvbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgPGRpdiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHRleHQtd2hpdGUvODAgdW5kZXJsaW5lIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICA8YSBocmVmPXt3YWxsZXRsaXN0RXhwbGFuYXRpb24uaHJlZn0gdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgICA8c3Bhbj57dChgQ2FuJ3QgZmluZCB5b3VyIHdhbGxldD9gKX08L3NwYW4+XG4gICAgICAgICAgICA8L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIHtsaXN0Lm90aGVycy5sZW5ndGggPiAwID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8ZGl2IHR3PVwibXQtNSBmbGV4IGp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17b25Ub2dnbGV9PlxuICAgICAgICAgICAgICA8c3BhbiB0dz1cInRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWdyZXktNTAwXCI+XG4gICAgICAgICAgICAgICAgPHNwYW4+e3QoYE1vcmUgb3B0aW9uc2ApfTwvc3Bhbj5cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxDb2xsYXBzZSBoZWlnaHQ9ezB9IG1heEhlaWdodD17J2F1dG8nfSBleHBhbmRlZD17aXNPcGVufT5cbiAgICAgICAgICAgICAge3JlbmRlcldhbGxldExpc3R9XG4gICAgICAgICAgICA8L0NvbGxhcHNlPlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogbnVsbH1cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgdHdgdGV4dC14cyBmbGV4IGp1c3RpZnktY2VudGVyIGZvbnQtc2VtaWJvbGQgbXQtNCAtbWItMiB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJgLFxuICAgICAgICAgICAgc3R5bGVzLmJ1dHRvblRleHRbdGhlbWVdLFxuICAgICAgICAgIF19XG4gICAgICAgID5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiBzZXRTaG93T25ib2FyZGluZyh0cnVlKX0+XG4gICAgICAgICAgICA8c3Bhbj57dChgSSBkb24ndCBoYXZlIGEgd2FsbGV0YCl9PC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7LyogQm90dG9tIFNoYWRlcyAqL31cbiAgICAgIHtpc09wZW4gJiYgbGlzdC5vdGhlcnMubGVuZ3RoID4gNiA/IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YGJsb2NrIHctZnVsbCBoLTIwIGFic29sdXRlIGxlZnQtMCBib3R0b20tNyB6LTUwYCwgc3R5bGVzLnNoYWRlc1t0aGVtZV1dfSAvPlxuICAgICAgICA8Lz5cbiAgICAgICkgOiBudWxsfVxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3QgUFJJT1JJVElTRToge1xuICBbdmFsdWUgaW4gV2FsbGV0UmVhZHlTdGF0ZV06IG51bWJlcjtcbn0gPSB7XG4gIFtXYWxsZXRSZWFkeVN0YXRlLkluc3RhbGxlZF06IDEsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLkxvYWRhYmxlXTogMixcbiAgW1dhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWRdOiAzLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5VbnN1cHBvcnRlZF06IDMsXG59O1xuZXhwb3J0IGludGVyZmFjZSBXYWxsZXRNb2RhbFByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBsb2dvPzogUmVhY3ROb2RlO1xuICBjb250YWluZXI/OiBzdHJpbmc7XG59XG5cbnR5cGUgSElHSExJR0hURURfQlkgPSAnUHJldmlvdXNseUNvbm5lY3RlZCcgfCAnSW5zdGFsbGVkJyB8ICdUb3BXYWxsZXQnIHwgJ09uYm9hcmRpbmcnIHwgJ1JlY29tbWVuZGVkJztcbmNvbnN0IFJFQ09NTUVOREVEX1dBTExFVFM6IFdhbGxldE5hbWVbXSA9IFsnU29sZmxhcmUnIGFzIFdhbGxldE5hbWU8J1NvbGZsYXJlJz5dO1xuXG5jb25zdCBUT1BfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gW1xuICAnQ29pbmJhc2UgV2FsbGV0JyBhcyBXYWxsZXROYW1lPCdDb2luYmFzZSBXYWxsZXQnPixcbiAgJ0JhY2twYWNrJyBhcyBXYWxsZXROYW1lPCdCYWNrcGFjayc+LFxuICAnUGhhbnRvbScgYXMgV2FsbGV0TmFtZTwnUGhhbnRvbSc+LFxuXTtcblxuaW50ZXJmYWNlIElVbmlmaWVkV2FsbGV0TW9kYWwge1xuICBvbkNsb3NlOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBzb3J0QnlQcmVjZWRlbmNlID0gKHdhbGxldFByZWNlZGVuY2U6IFdhbGxldE5hbWVbXSkgPT4gKGE6IEFkYXB0ZXIsIGI6IEFkYXB0ZXIpID0+IHtcbiAgaWYgKCF3YWxsZXRQcmVjZWRlbmNlKSByZXR1cm4gMDtcblxuICBjb25zdCBhSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYS5uYW1lKTtcbiAgY29uc3QgYkluZGV4ID0gd2FsbGV0UHJlY2VkZW5jZS5pbmRleE9mKGIubmFtZSk7XG5cbiAgaWYgKGFJbmRleCA9PT0gLTEgJiYgYkluZGV4ID09PSAtMSkgcmV0dXJuIDA7XG4gIGlmIChhSW5kZXggPj0gMCkge1xuICAgIGlmIChiSW5kZXggPT09IC0xKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgfVxuXG4gIGlmIChiSW5kZXggPj0gMCkge1xuICAgIGlmIChhSW5kZXggPT09IC0xKSByZXR1cm4gMTtcbiAgICByZXR1cm4gYkluZGV4IC0gYUluZGV4O1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuY29uc3QgU2ZtVW5pZmllZFdhbGxldE1vZGFsOiBSZWFjdC5GQzxJVW5pZmllZFdhbGxldE1vZGFsPiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHdhbGxldHMgfSA9IHVzZVVuaWZpZWRXYWxsZXQoKTtcbiAgY29uc3QgeyB3YWxsZXRQcmVjZWRlbmNlLCB0aGVtZSB9ID0gdXNlVW5pZmllZFdhbGxldENvbnRleHQoKTtcbiAgY29uc3QgW2lzT3Blbiwgb25Ub2dnbGVdID0gdXNlVG9nZ2xlKGZhbHNlKTtcbiAgY29uc3QgcHJldmlvdXNseUNvbm5lY3RlZCA9IHVzZVByZXZpb3VzbHlDb25uZWN0ZWQoKTtcblxuICBjb25zdCBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH0gPSB1c2VNZW1vKCgpID0+IHtcbiAgICAvLyBUaGVuLCBJbnN0YWxsZWQsIFRvcCAzLCBMb2FkYWJsZSwgTm90RGV0ZWN0ZWRcbiAgICBjb25zdCBmaWx0ZXJlZEFkYXB0ZXJzID0gd2FsbGV0cy5yZWR1Y2U8e1xuICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogQWRhcHRlcltdO1xuICAgICAgaW5zdGFsbGVkOiBBZGFwdGVyW107XG4gICAgICB0b3AzOiBBZGFwdGVyW107XG4gICAgICBsb2FkYWJsZTogQWRhcHRlcltdO1xuICAgICAgbm90RGV0ZWN0ZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHJlY29tbWVuZGVkV2FsbGV0czogQWRhcHRlcltdO1xuICAgIH0+KFxuICAgICAgKGFjYywgd2FsbGV0KSA9PiB7XG4gICAgICAgIGNvbnN0IGFkYXB0ZXJOYW1lID0gd2FsbGV0LmFkYXB0ZXIubmFtZTtcblxuICAgICAgICBpZiAoUkVDT01NRU5ERURfV0FMTEVUUy5zb21lKCh3YWxsZXQpID0+IHdhbGxldCA9PT0gYWRhcHRlck5hbWUpICYmIGFjYy5yZWNvbW1lbmRlZFdhbGxldHMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgZHVwbGljYXRlcyBzaW5jZSBDb2luYmFzZSBXYWxsZXQgaGFzIHR3byBhZGFwdGVycyBkdXBsaWNhdGVcbiAgICAgICAgICBpZiAoYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5zb21lKCh3YWxsZXQpID0+IHdhbGxldC5uYW1lID09PSBhZGFwdGVyTmFtZSkpIHJldHVybiBhY2M7XG4gICAgICAgICAgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmlvdXNseSBjb25uZWN0ZWQgdGFrZXMgaGlnaGVzdFxuICAgICAgICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPSBwcmV2aW91c2x5Q29ubmVjdGVkLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAocHJldmlvdXNseUNvbm5lY3RlZEluZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MucHJldmlvdXNseUNvbm5lY3RlZFtwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGVuIEluc3RhbGxlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgYWNjLmluc3RhbGxlZC5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRvcCAzXG4gICAgICAgIGNvbnN0IHRvcFdhbGxldHNJbmRleCA9IFRPUF9XQUxMRVRTLmluZGV4T2YoYWRhcHRlck5hbWUpO1xuICAgICAgICBpZiAodG9wV2FsbGV0c0luZGV4ID49IDApIHtcbiAgICAgICAgICBhY2MudG9wM1t0b3BXYWxsZXRzSW5kZXhdID0gd2FsbGV0LmFkYXB0ZXI7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBMb2FkYWJsZVxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTG9hZGFibGUpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICAvLyBOb3REZXRlY3RlZFxuICAgICAgICBpZiAod2FsbGV0LnJlYWR5U3RhdGUgPT09IFdhbGxldFJlYWR5U3RhdGUuTm90RGV0ZWN0ZWQpIHtcbiAgICAgICAgICBhY2MubG9hZGFibGUucHVzaCh3YWxsZXQuYWRhcHRlcik7XG4gICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBbXSxcbiAgICAgICAgcHJldmlvdXNseUNvbm5lY3RlZDogW10sXG4gICAgICAgIGluc3RhbGxlZDogW10sXG4gICAgICAgIHRvcDM6IFtdLFxuICAgICAgICBsb2FkYWJsZTogW10sXG4gICAgICAgIG5vdERldGVjdGVkOiBbXSxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWQsIC4uLnJlc3QgfSA9IGZpbHRlcmVkQWRhcHRlcnM7XG5cbiAgICAgIGNvbnN0IGhpZ2hsaWdodCA9IGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgwLCAzKTtcbiAgICAgIGxldCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAgIC5mbGF0KClcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IFBSSU9SSVRJU0VbYS5yZWFkeVN0YXRlXSAtIFBSSU9SSVRJU0VbYi5yZWFkeVN0YXRlXSlcbiAgICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgICBvdGhlcnMudW5zaGlmdCguLi5maWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQuc2xpY2UoMywgZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLmxlbmd0aCkpO1xuICAgICAgb3RoZXJzID0gb3RoZXJzLmZpbHRlcihCb29sZWFuKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnUHJldmlvdXNseUNvbm5lY3RlZCcsXG4gICAgICAgIGhpZ2hsaWdodCxcbiAgICAgICAgb3RoZXJzLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgeyByZWNvbW1lbmRlZFdhbGxldHMsIGluc3RhbGxlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc29sZS5sb2cocmVjb21tZW5kZWRXYWxsZXRzKTtcbiAgICAgIC8vIFNvcnQgdGhlIGluc3RhbGxlZCB3YWxsZXRzIGFjY29yZGluZyB0byB0aGUgdG9wIHdhbGxldHMgdGhhdCB3ZSB3YW50IHRvIHNob3cgdG8gdGhlIHVzZXIgZmlyc3RcbiAgICAgIGNvbnN0IGhpZ2hsaWdodDogQWRhcHRlcltdID0gW107XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgaW5zdGFsbGVkIHdhbGxldCBhZGFwdGVycyBhbmQgY2hlY2sgaWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXRzIGxpc3RcbiAgICAgIC8vIElmIHRoZXkgYXJlIGluIHRoZSB0b3Agd2FsbGV0IGxpc3QsIHdlIHdpbGwgYWRkIGl0IHRvIHRoZSBmaWx0ZXJlZCByZWNvbW1lbmRlIHdhbGxldHNcbiAgICAgIFRPUF9XQUxMRVRTLmZvckVhY2goKHRvcFdhbGxldCkgPT4ge1xuICAgICAgICBmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5mb3JFYWNoKChpbnN0YWxsZWRXYWxsZXQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgaWYgKHRvcFdhbGxldCA9PT0gaW5zdGFsbGVkV2FsbGV0Lm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHdhbGxldFRvUHVzaCA9IGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgICAgICAgICBoaWdobGlnaHQucHVzaCh3YWxsZXRUb1B1c2gpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gaGlnaGxpZ2h0LnB1c2goLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgMSkpO1xuICAgICAgY29uc29sZS5sb2coaGlnaGxpZ2h0KTtcbiAgICAgIGNvbnNvbGUubG9nKGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkKTtcbiAgICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLnNsaWNlKDAsIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmxlbmd0aCkpO1xuXG4gICAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdJbnN0YWxsZWQnLCBoaWdobGlnaHQsIG90aGVycyB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmxvYWRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBmaWx0ZXJlZEFkYXB0ZXJzLnJlY29tbWVuZGVkV2FsbGV0cyxcbiAgICAgICAgaGlnaGxpZ2h0ZWRCeTogJ09uYm9hcmRpbmcnLFxuICAgICAgICBoaWdobGlnaHQ6IFtdLFxuICAgICAgICBvdGhlcnM6IFtdLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgdG9wMywgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcbiAgICBjb25zdCBvdGhlcnMgPSBPYmplY3QudmFsdWVzKHJlc3QpXG4gICAgICAuZmxhdCgpXG4gICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgLnNvcnQoc29ydEJ5UHJlY2VkZW5jZSh3YWxsZXRQcmVjZWRlbmNlIHx8IFtdKSk7XG4gICAgcmV0dXJuIHsgcmVjb21tZW5kZWRXYWxsZXRzLCBoaWdobGlnaHRlZEJ5OiAnVG9wV2FsbGV0JywgaGlnaGxpZ2h0OiB0b3AzLCBvdGhlcnMgfTtcbiAgfSwgW3dhbGxldHMsIHByZXZpb3VzbHlDb25uZWN0ZWRdKTtcblxuICBjb25zdCBjb250ZW50UmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgdXNlT3V0c2lkZUNsaWNrKGNvbnRlbnRSZWYsIG9uQ2xvc2UpO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXtjb250ZW50UmVmfVxuICAgICAgY3NzPXtbXG4gICAgICAgIHR3YG1heC13LW1kIHctZnVsbCByZWxhdGl2ZSBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLXhsIHRyYW5zaXRpb24taGVpZ2h0IGR1cmF0aW9uLTUwMCBlYXNlLWluLW91dGAsXG4gICAgICAgIHN0eWxlcy5jb250YWluZXJbdGhlbWVdLFxuICAgICAgXX1cbiAgICA+XG4gICAgICA8SGVhZGVyIG9uQ2xvc2U9e29uQ2xvc2V9IC8+XG4gICAgICA8TGlzdE9mV2FsbGV0cyBsaXN0PXtsaXN0fSBvblRvZ2dsZT17b25Ub2dnbGV9IGlzT3Blbj17aXNPcGVufSAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgU2ZtVW5pZmllZFdhbGxldE1vZGFsO1xuIl19 */"]
    }, isMobile() ? jsx(WalletIcon, {
      wallet: adapter,
      width: 24,
      height: 24
    }) : jsx(WalletIcon, {
      wallet: adapter,
      width: 30,
      height: 30
    }), jsx("span", {
      css: _ref10
    }, adapterName), attachment ? jsx("div", null, attachment) : null));
  })), walletlistExplanation && list.others.length === 0 ? jsx("div", {
    css: _ref11
  }, jsx("a", {
    href: walletlistExplanation.href,
    target: "_blank",
    rel: "noopener noreferrer"
  }, jsx("span", null, t(`Can't find your wallet?`)))) : null, list.others.length > 0 ? jsx(React.Fragment, null, jsx("div", {
    css: _ref12,
    onClick: onToggle
  }, jsx("span", {
    css: _ref13
  }, jsx("span", null, t(`More options`)))), jsx(Collapse$1, {
    height: 0,
    maxHeight: 'auto',
    expanded: isOpen
  }, renderWalletList)) : null, jsx("div", {
    css: ["margin-bottom:-0.5rem;margin-top:1rem;display:flex;cursor:pointer;justify-content:center;font-size:0.75rem;line-height:1rem;font-weight:600;text-decoration-line:underline;", styles$1.buttonText[theme], process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF5UFUiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NvbGxhcHNlJztcbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4uL1VuaWZpZWRXYWxsZXRNb2RhbC9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvT25ib2FyZGluZyc7XG5pbXBvcnQgeyBTZm1Mb2dvIH0gZnJvbSAnLi9TZm1Mb2dvJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1saWdodC0xMDAgdGV4dC1ncmV5LTcwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1kYXJrLTcwMCB0ZXh0LWdyZXktNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF0sXG4gIH0sXG59O1xuXG5jb25zdCBIZWFkZXI6IFJlYWN0LkZDPHsgb25DbG9zZTogKCkgPT4gdm9pZCB9PiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YHB4LTUgcHktNiBmbGV4IGZsZXgtcm93IGp1c3RpZnktY2VudGVyIGAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPGltZyBzcmM9e1NmbUxvZ299IGFsdD1cImxvZ29cIiAvPlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhsIC1tdC0xMFwiPlxuICAgICAgICAgIDxzcGFuIGNzcz17W3R3YHRleHQtdHJhbnNwYXJlbnQgYmctY2xpcC10ZXh0IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYF19PlxuICAgICAgICAgICAge3QoYENvbm5lY3QgV2FsbGV0YCl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXNtIG10LTEgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICA8c3Bhbj57dChgQ29ubmVjdCBhIHdhbGxldCB0byBwcm9jZWVkYCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8YnV0dG9uIHR3PVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNFwiIG9uQ2xpY2s9e29uQ2xvc2V9PlxuICAgICAgICA8Q2xvc2VJY29uIHdpZHRoPXsxMn0gaGVpZ2h0PXsxMn0gLz5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgTGlzdE9mV2FsbGV0czogUmVhY3QuRkM8e1xuICBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH07XG4gIG9uVG9nZ2xlOiAobmV4dFZhbHVlPzogYW55KSA9PiB2b2lkO1xuICBpc09wZW46IGJvb2xlYW47XG59PiA9ICh7IGxpc3QsIG9uVG9nZ2xlLCBpc09wZW4gfSkgPT4ge1xuICBjb25zdCB7IGhhbmRsZUNvbm5lY3RDbGljaywgd2FsbGV0bGlzdEV4cGxhbmF0aW9uLCB3YWxsZXRBdHRhY2htZW50cywgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3Nob3dPbmJvYXJkaW5nLCBzZXRTaG93T25ib2FyZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzaG93Tm90SW5zdGFsbGVkLCBzZXRTaG93Tm90SW5zdGFsbGVkXSA9IHVzZVN0YXRlPEFkYXB0ZXIgfCBmYWxzZT4oZmFsc2UpO1xuXG4gIGNvbnN0IG9uQ2xpY2tXYWxsZXQgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTEVsZW1lbnQsIE1vdXNlRXZlbnQ+LCBhZGFwdGVyOiBBZGFwdGVyKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChhZGFwdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFuZGxlQ29ubmVjdENsaWNrKGV2ZW50LCBhZGFwdGVyKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHJlbmRlcldhbGxldExpc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGdyaWQgZ2FwLTIgZ3JpZC1jb2xzLTIgcGItNFwiIHRyYW5zbGF0ZT1cIm5vXCI+XG4gICAgICAgICAge2xpc3Qub3RoZXJzLm1hcCgoYWRhcHRlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDx1bCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICA8V2FsbGV0TGlzdEl0ZW0gaGFuZGxlQ2xpY2s9eyhlKSA9PiBvbkNsaWNrV2FsbGV0KGUsIGFkYXB0ZXIpfSB3YWxsZXQ9e2FkYXB0ZXJ9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSAhPT0gJ09uYm9hcmRpbmcnICYmIHdhbGxldGxpc3RFeHBsYW5hdGlvbiA/IChcbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YHRleHQteHMgZm9udC1zZW1pYm9sZCB1bmRlcmxpbmUgdGV4dC1jZW50ZXJgLCBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gdHdgbWItOGAgOiAnJ119PlxuICAgICAgICAgICAgPGEgaHJlZj17d2FsbGV0bGlzdEV4cGxhbmF0aW9uLmhyZWZ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoYENhbid0IGZpbmQgeW91ciB3YWxsZXQ/YCl9PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICksXG4gICAgW2hhbmRsZUNvbm5lY3RDbGljaywgbGlzdC5vdGhlcnNdLFxuICApO1xuXG4gIGNvbnN0IGhhc05vV2FsbGV0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0LmhpZ2hsaWdodC5sZW5ndGggPT09IDAgJiYgbGlzdC5vdGhlcnMubGVuZ3RoID09PSAwO1xuICB9LCBbbGlzdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGhhc05vV2FsbGV0cykge1xuICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgfVxuICB9LCBbaGFzTm9XYWxsZXRzXSk7XG5cbiAgaWYgKHNob3dPbmJvYXJkaW5nKSB7XG4gICAgcmV0dXJuIDxPbmJvYXJkaW5nRmxvdyBzaG93QmFjaz17IWhhc05vV2FsbGV0c30gb25DbG9zZT17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcoZmFsc2UpfSAvPjtcbiAgfVxuXG4gIGlmIChzaG93Tm90SW5zdGFsbGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxOb3RJbnN0YWxsZWRcbiAgICAgICAgYWRhcHRlcj17c2hvd05vdEluc3RhbGxlZH1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSl9XG4gICAgICAgIG9uR29PbmJvYXJkaW5nPXsoKSA9PiB7XG4gICAgICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGVTY3JvbGxiYXJcIiBjc3M9e1t0d2BoLWZ1bGwgb3ZlcmZsb3cteS1hdXRvIHB0LTMgcGItOCBweC01IHJlbGF0aXZlYCwgaXNPcGVuICYmIHR3YG1iLTdgXX0+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTBcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BwLVsxcHhdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmctZ3JhZGllbnQtdG8tciBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgLy8gc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC0yIGZsZXggZmxleC1jb2wgc3BhY2UteS0yIFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWAsXG4gICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezMwfSBoZWlnaHQ9ezMwfSAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LWxnIG1sLTQgbGc6bWwtMlwiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXtvblRvZ2dsZX0+XG4gICAgICAgICAgICAgIDxzcGFuIHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtZ3JleS01MDBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSBvcHRpb25zYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPENvbGxhcHNlIGhlaWdodD17MH0gbWF4SGVpZ2h0PXsnYXV0byd9IGV4cGFuZGVkPXtpc09wZW59PlxuICAgICAgICAgICAgICB7cmVuZGVyV2FsbGV0TGlzdH1cbiAgICAgICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICAgICAgPC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXhzIGZsZXgganVzdGlmeS1jZW50ZXIgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHVuZGVybGluZSBjdXJzb3ItcG9pbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBCb3R0b20gU2hhZGVzICovfVxuICAgICAge2lzT3BlbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICAgIDwvPlxuICAgICAgKSA6IG51bGx9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdDb2luYmFzZSBXYWxsZXQnIGFzIFdhbGxldE5hbWU8J0NvaW5iYXNlIFdhbGxldCc+LFxuICAnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz4sXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkgJiYgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIHNpbmNlIENvaW5iYXNlIFdhbGxldCBoYXMgdHdvIGFkYXB0ZXJzIGR1cGxpY2F0ZVxuICAgICAgICAgIGlmIChhY2MucmVjb21tZW5kZWRXYWxsZXRzLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0Lm5hbWUgPT09IGFkYXB0ZXJOYW1lKSkgcmV0dXJuIGFjYztcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zb2xlLmxvZyhyZWNvbW1lbmRlZFdhbGxldHMpO1xuICAgICAgLy8gU29ydCB0aGUgaW5zdGFsbGVkIHdhbGxldHMgYWNjb3JkaW5nIHRvIHRoZSB0b3Agd2FsbGV0cyB0aGF0IHdlIHdhbnQgdG8gc2hvdyB0byB0aGUgdXNlciBmaXJzdFxuICAgICAgY29uc3QgaGlnaGxpZ2h0OiBBZGFwdGVyW10gPSBbXTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBpbnN0YWxsZWQgd2FsbGV0IGFkYXB0ZXJzIGFuZCBjaGVjayBpZiB0aGV5IGFyZSBpbiB0aGUgdG9wIHdhbGxldHMgbGlzdFxuICAgICAgLy8gSWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXQgbGlzdCwgd2Ugd2lsbCBhZGQgaXQgdG8gdGhlIGZpbHRlcmVkIHJlY29tbWVuZGUgd2FsbGV0c1xuICAgICAgVE9QX1dBTExFVFMuZm9yRWFjaCgodG9wV2FsbGV0KSA9PiB7XG4gICAgICAgIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmZvckVhY2goKGluc3RhbGxlZFdhbGxldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBpZiAodG9wV2FsbGV0ID09PSBpbnN0YWxsZWRXYWxsZXQubmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgd2FsbGV0VG9QdXNoID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wdXNoKHdhbGxldFRvUHVzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBoaWdobGlnaHQucHVzaCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAxKSk7XG4gICAgICBjb25zb2xlLmxvZyhoaWdobGlnaHQpO1xuICAgICAgY29uc29sZS5sb2coZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQpO1xuICAgICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoKSk7XG5cbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ0luc3RhbGxlZCcsIGhpZ2hsaWdodCwgb3RoZXJzIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMubG9hZGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IGZpbHRlcmVkQWRhcHRlcnMucmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnT25ib2FyZGluZycsXG4gICAgICAgIGhpZ2hsaWdodDogW10sXG4gICAgICAgIG90aGVyczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0YCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF5UFUiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NvbGxhcHNlJztcbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4uL1VuaWZpZWRXYWxsZXRNb2RhbC9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvT25ib2FyZGluZyc7XG5pbXBvcnQgeyBTZm1Mb2dvIH0gZnJvbSAnLi9TZm1Mb2dvJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1saWdodC0xMDAgdGV4dC1ncmV5LTcwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1kYXJrLTcwMCB0ZXh0LWdyZXktNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF0sXG4gIH0sXG59O1xuXG5jb25zdCBIZWFkZXI6IFJlYWN0LkZDPHsgb25DbG9zZTogKCkgPT4gdm9pZCB9PiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YHB4LTUgcHktNiBmbGV4IGZsZXgtcm93IGp1c3RpZnktY2VudGVyIGAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPGltZyBzcmM9e1NmbUxvZ299IGFsdD1cImxvZ29cIiAvPlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhsIC1tdC0xMFwiPlxuICAgICAgICAgIDxzcGFuIGNzcz17W3R3YHRleHQtdHJhbnNwYXJlbnQgYmctY2xpcC10ZXh0IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYF19PlxuICAgICAgICAgICAge3QoYENvbm5lY3QgV2FsbGV0YCl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXNtIG10LTEgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICA8c3Bhbj57dChgQ29ubmVjdCBhIHdhbGxldCB0byBwcm9jZWVkYCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8YnV0dG9uIHR3PVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNFwiIG9uQ2xpY2s9e29uQ2xvc2V9PlxuICAgICAgICA8Q2xvc2VJY29uIHdpZHRoPXsxMn0gaGVpZ2h0PXsxMn0gLz5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgTGlzdE9mV2FsbGV0czogUmVhY3QuRkM8e1xuICBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH07XG4gIG9uVG9nZ2xlOiAobmV4dFZhbHVlPzogYW55KSA9PiB2b2lkO1xuICBpc09wZW46IGJvb2xlYW47XG59PiA9ICh7IGxpc3QsIG9uVG9nZ2xlLCBpc09wZW4gfSkgPT4ge1xuICBjb25zdCB7IGhhbmRsZUNvbm5lY3RDbGljaywgd2FsbGV0bGlzdEV4cGxhbmF0aW9uLCB3YWxsZXRBdHRhY2htZW50cywgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3Nob3dPbmJvYXJkaW5nLCBzZXRTaG93T25ib2FyZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzaG93Tm90SW5zdGFsbGVkLCBzZXRTaG93Tm90SW5zdGFsbGVkXSA9IHVzZVN0YXRlPEFkYXB0ZXIgfCBmYWxzZT4oZmFsc2UpO1xuXG4gIGNvbnN0IG9uQ2xpY2tXYWxsZXQgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTEVsZW1lbnQsIE1vdXNlRXZlbnQ+LCBhZGFwdGVyOiBBZGFwdGVyKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChhZGFwdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFuZGxlQ29ubmVjdENsaWNrKGV2ZW50LCBhZGFwdGVyKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHJlbmRlcldhbGxldExpc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGdyaWQgZ2FwLTIgZ3JpZC1jb2xzLTIgcGItNFwiIHRyYW5zbGF0ZT1cIm5vXCI+XG4gICAgICAgICAge2xpc3Qub3RoZXJzLm1hcCgoYWRhcHRlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDx1bCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICA8V2FsbGV0TGlzdEl0ZW0gaGFuZGxlQ2xpY2s9eyhlKSA9PiBvbkNsaWNrV2FsbGV0KGUsIGFkYXB0ZXIpfSB3YWxsZXQ9e2FkYXB0ZXJ9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSAhPT0gJ09uYm9hcmRpbmcnICYmIHdhbGxldGxpc3RFeHBsYW5hdGlvbiA/IChcbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YHRleHQteHMgZm9udC1zZW1pYm9sZCB1bmRlcmxpbmUgdGV4dC1jZW50ZXJgLCBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gdHdgbWItOGAgOiAnJ119PlxuICAgICAgICAgICAgPGEgaHJlZj17d2FsbGV0bGlzdEV4cGxhbmF0aW9uLmhyZWZ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoYENhbid0IGZpbmQgeW91ciB3YWxsZXQ/YCl9PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICksXG4gICAgW2hhbmRsZUNvbm5lY3RDbGljaywgbGlzdC5vdGhlcnNdLFxuICApO1xuXG4gIGNvbnN0IGhhc05vV2FsbGV0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0LmhpZ2hsaWdodC5sZW5ndGggPT09IDAgJiYgbGlzdC5vdGhlcnMubGVuZ3RoID09PSAwO1xuICB9LCBbbGlzdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGhhc05vV2FsbGV0cykge1xuICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgfVxuICB9LCBbaGFzTm9XYWxsZXRzXSk7XG5cbiAgaWYgKHNob3dPbmJvYXJkaW5nKSB7XG4gICAgcmV0dXJuIDxPbmJvYXJkaW5nRmxvdyBzaG93QmFjaz17IWhhc05vV2FsbGV0c30gb25DbG9zZT17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcoZmFsc2UpfSAvPjtcbiAgfVxuXG4gIGlmIChzaG93Tm90SW5zdGFsbGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxOb3RJbnN0YWxsZWRcbiAgICAgICAgYWRhcHRlcj17c2hvd05vdEluc3RhbGxlZH1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSl9XG4gICAgICAgIG9uR29PbmJvYXJkaW5nPXsoKSA9PiB7XG4gICAgICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGVTY3JvbGxiYXJcIiBjc3M9e1t0d2BoLWZ1bGwgb3ZlcmZsb3cteS1hdXRvIHB0LTMgcGItOCBweC01IHJlbGF0aXZlYCwgaXNPcGVuICYmIHR3YG1iLTdgXX0+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTBcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BwLVsxcHhdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmctZ3JhZGllbnQtdG8tciBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgLy8gc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC0yIGZsZXggZmxleC1jb2wgc3BhY2UteS0yIFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWAsXG4gICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezMwfSBoZWlnaHQ9ezMwfSAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LWxnIG1sLTQgbGc6bWwtMlwiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXtvblRvZ2dsZX0+XG4gICAgICAgICAgICAgIDxzcGFuIHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtZ3JleS01MDBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSBvcHRpb25zYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPENvbGxhcHNlIGhlaWdodD17MH0gbWF4SGVpZ2h0PXsnYXV0byd9IGV4cGFuZGVkPXtpc09wZW59PlxuICAgICAgICAgICAgICB7cmVuZGVyV2FsbGV0TGlzdH1cbiAgICAgICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICAgICAgPC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXhzIGZsZXgganVzdGlmeS1jZW50ZXIgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHVuZGVybGluZSBjdXJzb3ItcG9pbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBCb3R0b20gU2hhZGVzICovfVxuICAgICAge2lzT3BlbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICAgIDwvPlxuICAgICAgKSA6IG51bGx9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdDb2luYmFzZSBXYWxsZXQnIGFzIFdhbGxldE5hbWU8J0NvaW5iYXNlIFdhbGxldCc+LFxuICAnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz4sXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkgJiYgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIHNpbmNlIENvaW5iYXNlIFdhbGxldCBoYXMgdHdvIGFkYXB0ZXJzIGR1cGxpY2F0ZVxuICAgICAgICAgIGlmIChhY2MucmVjb21tZW5kZWRXYWxsZXRzLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0Lm5hbWUgPT09IGFkYXB0ZXJOYW1lKSkgcmV0dXJuIGFjYztcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zb2xlLmxvZyhyZWNvbW1lbmRlZFdhbGxldHMpO1xuICAgICAgLy8gU29ydCB0aGUgaW5zdGFsbGVkIHdhbGxldHMgYWNjb3JkaW5nIHRvIHRoZSB0b3Agd2FsbGV0cyB0aGF0IHdlIHdhbnQgdG8gc2hvdyB0byB0aGUgdXNlciBmaXJzdFxuICAgICAgY29uc3QgaGlnaGxpZ2h0OiBBZGFwdGVyW10gPSBbXTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBpbnN0YWxsZWQgd2FsbGV0IGFkYXB0ZXJzIGFuZCBjaGVjayBpZiB0aGV5IGFyZSBpbiB0aGUgdG9wIHdhbGxldHMgbGlzdFxuICAgICAgLy8gSWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXQgbGlzdCwgd2Ugd2lsbCBhZGQgaXQgdG8gdGhlIGZpbHRlcmVkIHJlY29tbWVuZGUgd2FsbGV0c1xuICAgICAgVE9QX1dBTExFVFMuZm9yRWFjaCgodG9wV2FsbGV0KSA9PiB7XG4gICAgICAgIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmZvckVhY2goKGluc3RhbGxlZFdhbGxldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBpZiAodG9wV2FsbGV0ID09PSBpbnN0YWxsZWRXYWxsZXQubmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgd2FsbGV0VG9QdXNoID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wdXNoKHdhbGxldFRvUHVzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBoaWdobGlnaHQucHVzaCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAxKSk7XG4gICAgICBjb25zb2xlLmxvZyhoaWdobGlnaHQpO1xuICAgICAgY29uc29sZS5sb2coZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQpO1xuICAgICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoKSk7XG5cbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ0luc3RhbGxlZCcsIGhpZ2hsaWdodCwgb3RoZXJzIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMubG9hZGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IGZpbHRlcmVkQWRhcHRlcnMucmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnT25ib2FyZGluZycsXG4gICAgICAgIGhpZ2hsaWdodDogW10sXG4gICAgICAgIG90aGVyczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0YCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */"]
  }, jsx("button", {
    type: "button",
    onClick: () => setShowOnboarding(true)
  }, jsx("span", null, t(`I don't have a wallet`))))), isOpen && list.others.length > 6 ? jsx(React.Fragment, null, jsx("div", {
    css: ["position:absolute;bottom:1.75rem;left:0px;z-index:50;display:block;height:5rem;width:100%;", styles$1.shades[theme], process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1UWUiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NvbGxhcHNlJztcbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4uL1VuaWZpZWRXYWxsZXRNb2RhbC9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvT25ib2FyZGluZyc7XG5pbXBvcnQgeyBTZm1Mb2dvIH0gZnJvbSAnLi9TZm1Mb2dvJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1saWdodC0xMDAgdGV4dC1ncmV5LTcwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1kYXJrLTcwMCB0ZXh0LWdyZXktNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF0sXG4gIH0sXG59O1xuXG5jb25zdCBIZWFkZXI6IFJlYWN0LkZDPHsgb25DbG9zZTogKCkgPT4gdm9pZCB9PiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YHB4LTUgcHktNiBmbGV4IGZsZXgtcm93IGp1c3RpZnktY2VudGVyIGAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPGltZyBzcmM9e1NmbUxvZ299IGFsdD1cImxvZ29cIiAvPlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhsIC1tdC0xMFwiPlxuICAgICAgICAgIDxzcGFuIGNzcz17W3R3YHRleHQtdHJhbnNwYXJlbnQgYmctY2xpcC10ZXh0IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYF19PlxuICAgICAgICAgICAge3QoYENvbm5lY3QgV2FsbGV0YCl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXNtIG10LTEgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICA8c3Bhbj57dChgQ29ubmVjdCBhIHdhbGxldCB0byBwcm9jZWVkYCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8YnV0dG9uIHR3PVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNFwiIG9uQ2xpY2s9e29uQ2xvc2V9PlxuICAgICAgICA8Q2xvc2VJY29uIHdpZHRoPXsxMn0gaGVpZ2h0PXsxMn0gLz5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgTGlzdE9mV2FsbGV0czogUmVhY3QuRkM8e1xuICBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH07XG4gIG9uVG9nZ2xlOiAobmV4dFZhbHVlPzogYW55KSA9PiB2b2lkO1xuICBpc09wZW46IGJvb2xlYW47XG59PiA9ICh7IGxpc3QsIG9uVG9nZ2xlLCBpc09wZW4gfSkgPT4ge1xuICBjb25zdCB7IGhhbmRsZUNvbm5lY3RDbGljaywgd2FsbGV0bGlzdEV4cGxhbmF0aW9uLCB3YWxsZXRBdHRhY2htZW50cywgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3Nob3dPbmJvYXJkaW5nLCBzZXRTaG93T25ib2FyZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzaG93Tm90SW5zdGFsbGVkLCBzZXRTaG93Tm90SW5zdGFsbGVkXSA9IHVzZVN0YXRlPEFkYXB0ZXIgfCBmYWxzZT4oZmFsc2UpO1xuXG4gIGNvbnN0IG9uQ2xpY2tXYWxsZXQgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTEVsZW1lbnQsIE1vdXNlRXZlbnQ+LCBhZGFwdGVyOiBBZGFwdGVyKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChhZGFwdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFuZGxlQ29ubmVjdENsaWNrKGV2ZW50LCBhZGFwdGVyKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHJlbmRlcldhbGxldExpc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGdyaWQgZ2FwLTIgZ3JpZC1jb2xzLTIgcGItNFwiIHRyYW5zbGF0ZT1cIm5vXCI+XG4gICAgICAgICAge2xpc3Qub3RoZXJzLm1hcCgoYWRhcHRlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDx1bCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICA8V2FsbGV0TGlzdEl0ZW0gaGFuZGxlQ2xpY2s9eyhlKSA9PiBvbkNsaWNrV2FsbGV0KGUsIGFkYXB0ZXIpfSB3YWxsZXQ9e2FkYXB0ZXJ9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSAhPT0gJ09uYm9hcmRpbmcnICYmIHdhbGxldGxpc3RFeHBsYW5hdGlvbiA/IChcbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YHRleHQteHMgZm9udC1zZW1pYm9sZCB1bmRlcmxpbmUgdGV4dC1jZW50ZXJgLCBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gdHdgbWItOGAgOiAnJ119PlxuICAgICAgICAgICAgPGEgaHJlZj17d2FsbGV0bGlzdEV4cGxhbmF0aW9uLmhyZWZ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoYENhbid0IGZpbmQgeW91ciB3YWxsZXQ/YCl9PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICksXG4gICAgW2hhbmRsZUNvbm5lY3RDbGljaywgbGlzdC5vdGhlcnNdLFxuICApO1xuXG4gIGNvbnN0IGhhc05vV2FsbGV0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0LmhpZ2hsaWdodC5sZW5ndGggPT09IDAgJiYgbGlzdC5vdGhlcnMubGVuZ3RoID09PSAwO1xuICB9LCBbbGlzdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGhhc05vV2FsbGV0cykge1xuICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgfVxuICB9LCBbaGFzTm9XYWxsZXRzXSk7XG5cbiAgaWYgKHNob3dPbmJvYXJkaW5nKSB7XG4gICAgcmV0dXJuIDxPbmJvYXJkaW5nRmxvdyBzaG93QmFjaz17IWhhc05vV2FsbGV0c30gb25DbG9zZT17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcoZmFsc2UpfSAvPjtcbiAgfVxuXG4gIGlmIChzaG93Tm90SW5zdGFsbGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxOb3RJbnN0YWxsZWRcbiAgICAgICAgYWRhcHRlcj17c2hvd05vdEluc3RhbGxlZH1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSl9XG4gICAgICAgIG9uR29PbmJvYXJkaW5nPXsoKSA9PiB7XG4gICAgICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGVTY3JvbGxiYXJcIiBjc3M9e1t0d2BoLWZ1bGwgb3ZlcmZsb3cteS1hdXRvIHB0LTMgcGItOCBweC01IHJlbGF0aXZlYCwgaXNPcGVuICYmIHR3YG1iLTdgXX0+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTBcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BwLVsxcHhdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmctZ3JhZGllbnQtdG8tciBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgLy8gc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC0yIGZsZXggZmxleC1jb2wgc3BhY2UteS0yIFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWAsXG4gICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezMwfSBoZWlnaHQ9ezMwfSAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LWxnIG1sLTQgbGc6bWwtMlwiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXtvblRvZ2dsZX0+XG4gICAgICAgICAgICAgIDxzcGFuIHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtZ3JleS01MDBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSBvcHRpb25zYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPENvbGxhcHNlIGhlaWdodD17MH0gbWF4SGVpZ2h0PXsnYXV0byd9IGV4cGFuZGVkPXtpc09wZW59PlxuICAgICAgICAgICAgICB7cmVuZGVyV2FsbGV0TGlzdH1cbiAgICAgICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICAgICAgPC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXhzIGZsZXgganVzdGlmeS1jZW50ZXIgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHVuZGVybGluZSBjdXJzb3ItcG9pbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBCb3R0b20gU2hhZGVzICovfVxuICAgICAge2lzT3BlbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICAgIDwvPlxuICAgICAgKSA6IG51bGx9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdDb2luYmFzZSBXYWxsZXQnIGFzIFdhbGxldE5hbWU8J0NvaW5iYXNlIFdhbGxldCc+LFxuICAnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz4sXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkgJiYgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIHNpbmNlIENvaW5iYXNlIFdhbGxldCBoYXMgdHdvIGFkYXB0ZXJzIGR1cGxpY2F0ZVxuICAgICAgICAgIGlmIChhY2MucmVjb21tZW5kZWRXYWxsZXRzLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0Lm5hbWUgPT09IGFkYXB0ZXJOYW1lKSkgcmV0dXJuIGFjYztcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zb2xlLmxvZyhyZWNvbW1lbmRlZFdhbGxldHMpO1xuICAgICAgLy8gU29ydCB0aGUgaW5zdGFsbGVkIHdhbGxldHMgYWNjb3JkaW5nIHRvIHRoZSB0b3Agd2FsbGV0cyB0aGF0IHdlIHdhbnQgdG8gc2hvdyB0byB0aGUgdXNlciBmaXJzdFxuICAgICAgY29uc3QgaGlnaGxpZ2h0OiBBZGFwdGVyW10gPSBbXTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBpbnN0YWxsZWQgd2FsbGV0IGFkYXB0ZXJzIGFuZCBjaGVjayBpZiB0aGV5IGFyZSBpbiB0aGUgdG9wIHdhbGxldHMgbGlzdFxuICAgICAgLy8gSWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXQgbGlzdCwgd2Ugd2lsbCBhZGQgaXQgdG8gdGhlIGZpbHRlcmVkIHJlY29tbWVuZGUgd2FsbGV0c1xuICAgICAgVE9QX1dBTExFVFMuZm9yRWFjaCgodG9wV2FsbGV0KSA9PiB7XG4gICAgICAgIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmZvckVhY2goKGluc3RhbGxlZFdhbGxldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBpZiAodG9wV2FsbGV0ID09PSBpbnN0YWxsZWRXYWxsZXQubmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgd2FsbGV0VG9QdXNoID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wdXNoKHdhbGxldFRvUHVzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBoaWdobGlnaHQucHVzaCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAxKSk7XG4gICAgICBjb25zb2xlLmxvZyhoaWdobGlnaHQpO1xuICAgICAgY29uc29sZS5sb2coZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQpO1xuICAgICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoKSk7XG5cbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ0luc3RhbGxlZCcsIGhpZ2hsaWdodCwgb3RoZXJzIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMubG9hZGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IGZpbHRlcmVkQWRhcHRlcnMucmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnT25ib2FyZGluZycsXG4gICAgICAgIGhpZ2hsaWdodDogW10sXG4gICAgICAgIG90aGVyczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0YCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:ListOfWallets;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1UWUiLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NvbGxhcHNlJztcbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4uL1VuaWZpZWRXYWxsZXRNb2RhbC9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvT25ib2FyZGluZyc7XG5pbXBvcnQgeyBTZm1Mb2dvIH0gZnJvbSAnLi9TZm1Mb2dvJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1saWdodC0xMDAgdGV4dC1ncmV5LTcwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1kYXJrLTcwMCB0ZXh0LWdyZXktNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF0sXG4gIH0sXG59O1xuXG5jb25zdCBIZWFkZXI6IFJlYWN0LkZDPHsgb25DbG9zZTogKCkgPT4gdm9pZCB9PiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YHB4LTUgcHktNiBmbGV4IGZsZXgtcm93IGp1c3RpZnktY2VudGVyIGAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPGltZyBzcmM9e1NmbUxvZ299IGFsdD1cImxvZ29cIiAvPlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhsIC1tdC0xMFwiPlxuICAgICAgICAgIDxzcGFuIGNzcz17W3R3YHRleHQtdHJhbnNwYXJlbnQgYmctY2xpcC10ZXh0IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYF19PlxuICAgICAgICAgICAge3QoYENvbm5lY3QgV2FsbGV0YCl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXNtIG10LTEgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICA8c3Bhbj57dChgQ29ubmVjdCBhIHdhbGxldCB0byBwcm9jZWVkYCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8YnV0dG9uIHR3PVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNFwiIG9uQ2xpY2s9e29uQ2xvc2V9PlxuICAgICAgICA8Q2xvc2VJY29uIHdpZHRoPXsxMn0gaGVpZ2h0PXsxMn0gLz5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgTGlzdE9mV2FsbGV0czogUmVhY3QuRkM8e1xuICBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH07XG4gIG9uVG9nZ2xlOiAobmV4dFZhbHVlPzogYW55KSA9PiB2b2lkO1xuICBpc09wZW46IGJvb2xlYW47XG59PiA9ICh7IGxpc3QsIG9uVG9nZ2xlLCBpc09wZW4gfSkgPT4ge1xuICBjb25zdCB7IGhhbmRsZUNvbm5lY3RDbGljaywgd2FsbGV0bGlzdEV4cGxhbmF0aW9uLCB3YWxsZXRBdHRhY2htZW50cywgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3Nob3dPbmJvYXJkaW5nLCBzZXRTaG93T25ib2FyZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzaG93Tm90SW5zdGFsbGVkLCBzZXRTaG93Tm90SW5zdGFsbGVkXSA9IHVzZVN0YXRlPEFkYXB0ZXIgfCBmYWxzZT4oZmFsc2UpO1xuXG4gIGNvbnN0IG9uQ2xpY2tXYWxsZXQgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTEVsZW1lbnQsIE1vdXNlRXZlbnQ+LCBhZGFwdGVyOiBBZGFwdGVyKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChhZGFwdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFuZGxlQ29ubmVjdENsaWNrKGV2ZW50LCBhZGFwdGVyKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHJlbmRlcldhbGxldExpc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGdyaWQgZ2FwLTIgZ3JpZC1jb2xzLTIgcGItNFwiIHRyYW5zbGF0ZT1cIm5vXCI+XG4gICAgICAgICAge2xpc3Qub3RoZXJzLm1hcCgoYWRhcHRlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDx1bCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICA8V2FsbGV0TGlzdEl0ZW0gaGFuZGxlQ2xpY2s9eyhlKSA9PiBvbkNsaWNrV2FsbGV0KGUsIGFkYXB0ZXIpfSB3YWxsZXQ9e2FkYXB0ZXJ9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSAhPT0gJ09uYm9hcmRpbmcnICYmIHdhbGxldGxpc3RFeHBsYW5hdGlvbiA/IChcbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YHRleHQteHMgZm9udC1zZW1pYm9sZCB1bmRlcmxpbmUgdGV4dC1jZW50ZXJgLCBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gdHdgbWItOGAgOiAnJ119PlxuICAgICAgICAgICAgPGEgaHJlZj17d2FsbGV0bGlzdEV4cGxhbmF0aW9uLmhyZWZ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoYENhbid0IGZpbmQgeW91ciB3YWxsZXQ/YCl9PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICksXG4gICAgW2hhbmRsZUNvbm5lY3RDbGljaywgbGlzdC5vdGhlcnNdLFxuICApO1xuXG4gIGNvbnN0IGhhc05vV2FsbGV0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0LmhpZ2hsaWdodC5sZW5ndGggPT09IDAgJiYgbGlzdC5vdGhlcnMubGVuZ3RoID09PSAwO1xuICB9LCBbbGlzdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGhhc05vV2FsbGV0cykge1xuICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgfVxuICB9LCBbaGFzTm9XYWxsZXRzXSk7XG5cbiAgaWYgKHNob3dPbmJvYXJkaW5nKSB7XG4gICAgcmV0dXJuIDxPbmJvYXJkaW5nRmxvdyBzaG93QmFjaz17IWhhc05vV2FsbGV0c30gb25DbG9zZT17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcoZmFsc2UpfSAvPjtcbiAgfVxuXG4gIGlmIChzaG93Tm90SW5zdGFsbGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxOb3RJbnN0YWxsZWRcbiAgICAgICAgYWRhcHRlcj17c2hvd05vdEluc3RhbGxlZH1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSl9XG4gICAgICAgIG9uR29PbmJvYXJkaW5nPXsoKSA9PiB7XG4gICAgICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGVTY3JvbGxiYXJcIiBjc3M9e1t0d2BoLWZ1bGwgb3ZlcmZsb3cteS1hdXRvIHB0LTMgcGItOCBweC01IHJlbGF0aXZlYCwgaXNPcGVuICYmIHR3YG1iLTdgXX0+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTBcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BwLVsxcHhdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmctZ3JhZGllbnQtdG8tciBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgLy8gc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC0yIGZsZXggZmxleC1jb2wgc3BhY2UteS0yIFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWAsXG4gICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezMwfSBoZWlnaHQ9ezMwfSAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LWxnIG1sLTQgbGc6bWwtMlwiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXtvblRvZ2dsZX0+XG4gICAgICAgICAgICAgIDxzcGFuIHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtZ3JleS01MDBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSBvcHRpb25zYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPENvbGxhcHNlIGhlaWdodD17MH0gbWF4SGVpZ2h0PXsnYXV0byd9IGV4cGFuZGVkPXtpc09wZW59PlxuICAgICAgICAgICAgICB7cmVuZGVyV2FsbGV0TGlzdH1cbiAgICAgICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICAgICAgPC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXhzIGZsZXgganVzdGlmeS1jZW50ZXIgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHVuZGVybGluZSBjdXJzb3ItcG9pbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBCb3R0b20gU2hhZGVzICovfVxuICAgICAge2lzT3BlbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICAgIDwvPlxuICAgICAgKSA6IG51bGx9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdDb2luYmFzZSBXYWxsZXQnIGFzIFdhbGxldE5hbWU8J0NvaW5iYXNlIFdhbGxldCc+LFxuICAnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz4sXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkgJiYgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIHNpbmNlIENvaW5iYXNlIFdhbGxldCBoYXMgdHdvIGFkYXB0ZXJzIGR1cGxpY2F0ZVxuICAgICAgICAgIGlmIChhY2MucmVjb21tZW5kZWRXYWxsZXRzLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0Lm5hbWUgPT09IGFkYXB0ZXJOYW1lKSkgcmV0dXJuIGFjYztcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zb2xlLmxvZyhyZWNvbW1lbmRlZFdhbGxldHMpO1xuICAgICAgLy8gU29ydCB0aGUgaW5zdGFsbGVkIHdhbGxldHMgYWNjb3JkaW5nIHRvIHRoZSB0b3Agd2FsbGV0cyB0aGF0IHdlIHdhbnQgdG8gc2hvdyB0byB0aGUgdXNlciBmaXJzdFxuICAgICAgY29uc3QgaGlnaGxpZ2h0OiBBZGFwdGVyW10gPSBbXTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBpbnN0YWxsZWQgd2FsbGV0IGFkYXB0ZXJzIGFuZCBjaGVjayBpZiB0aGV5IGFyZSBpbiB0aGUgdG9wIHdhbGxldHMgbGlzdFxuICAgICAgLy8gSWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXQgbGlzdCwgd2Ugd2lsbCBhZGQgaXQgdG8gdGhlIGZpbHRlcmVkIHJlY29tbWVuZGUgd2FsbGV0c1xuICAgICAgVE9QX1dBTExFVFMuZm9yRWFjaCgodG9wV2FsbGV0KSA9PiB7XG4gICAgICAgIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmZvckVhY2goKGluc3RhbGxlZFdhbGxldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBpZiAodG9wV2FsbGV0ID09PSBpbnN0YWxsZWRXYWxsZXQubmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgd2FsbGV0VG9QdXNoID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wdXNoKHdhbGxldFRvUHVzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBoaWdobGlnaHQucHVzaCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAxKSk7XG4gICAgICBjb25zb2xlLmxvZyhoaWdobGlnaHQpO1xuICAgICAgY29uc29sZS5sb2coZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQpO1xuICAgICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoKSk7XG5cbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ0luc3RhbGxlZCcsIGhpZ2hsaWdodCwgb3RoZXJzIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMubG9hZGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IGZpbHRlcmVkQWRhcHRlcnMucmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnT25ib2FyZGluZycsXG4gICAgICAgIGhpZ2hsaWdodDogW10sXG4gICAgICAgIG90aGVyczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0YCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */"]
  })) : null);
};
const PRIORITISE = {
  [WalletReadyState.Installed]: 1,
  [WalletReadyState.Loadable]: 2,
  [WalletReadyState.NotDetected]: 3,
  [WalletReadyState.Unsupported]: 3
};
const RECOMMENDED_WALLETS = ['Solflare'];
const TOP_WALLETS = ['Coinbase Wallet', 'Backpack', 'Phantom'];
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
const SfmUnifiedWalletModal = ({
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
      if (RECOMMENDED_WALLETS.some(wallet => wallet === adapterName) && acc.recommendedWallets.length < 1) {
        // Prevent duplicates since Coinbase Wallet has two adapters duplicate
        if (acc.recommendedWallets.some(wallet => wallet.name === adapterName)) return acc;
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
      console.log(recommendedWallets);
      // Sort the installed wallets according to the top wallets that we want to show to the user first
      const highlight = [];

      // Loop through the installed wallet adapters and check if they are in the top wallets list
      // If they are in the top wallet list, we will add it to the filtered recommende wallets
      TOP_WALLETS.forEach(topWallet => {
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
      const others = Object.values(rest).flat().sort((a, b) => PRIORITISE[a.readyState] - PRIORITISE[b.readyState]).sort(sortByPrecedence(walletPrecedence || []));
      others.unshift(...filteredAdapters.installed.slice(0, filteredAdapters.installed.length));
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
    css: ["position:relative;display:flex;width:100%;max-width:28rem;flex-direction:column;overflow:hidden;border-radius:0.75rem;transition-property:height;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:500ms;", styles$1.container[theme], process.env.NODE_ENV === "production" ? "" : ";label:SfmUnifiedWalletModal;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUEwY00iLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NvbGxhcHNlJztcbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4uL1VuaWZpZWRXYWxsZXRNb2RhbC9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvT25ib2FyZGluZyc7XG5pbXBvcnQgeyBTZm1Mb2dvIH0gZnJvbSAnLi9TZm1Mb2dvJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1saWdodC0xMDAgdGV4dC1ncmV5LTcwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1kYXJrLTcwMCB0ZXh0LWdyZXktNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF0sXG4gIH0sXG59O1xuXG5jb25zdCBIZWFkZXI6IFJlYWN0LkZDPHsgb25DbG9zZTogKCkgPT4gdm9pZCB9PiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YHB4LTUgcHktNiBmbGV4IGZsZXgtcm93IGp1c3RpZnktY2VudGVyIGAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPGltZyBzcmM9e1NmbUxvZ299IGFsdD1cImxvZ29cIiAvPlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhsIC1tdC0xMFwiPlxuICAgICAgICAgIDxzcGFuIGNzcz17W3R3YHRleHQtdHJhbnNwYXJlbnQgYmctY2xpcC10ZXh0IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYF19PlxuICAgICAgICAgICAge3QoYENvbm5lY3QgV2FsbGV0YCl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXNtIG10LTEgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICA8c3Bhbj57dChgQ29ubmVjdCBhIHdhbGxldCB0byBwcm9jZWVkYCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8YnV0dG9uIHR3PVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNFwiIG9uQ2xpY2s9e29uQ2xvc2V9PlxuICAgICAgICA8Q2xvc2VJY29uIHdpZHRoPXsxMn0gaGVpZ2h0PXsxMn0gLz5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgTGlzdE9mV2FsbGV0czogUmVhY3QuRkM8e1xuICBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH07XG4gIG9uVG9nZ2xlOiAobmV4dFZhbHVlPzogYW55KSA9PiB2b2lkO1xuICBpc09wZW46IGJvb2xlYW47XG59PiA9ICh7IGxpc3QsIG9uVG9nZ2xlLCBpc09wZW4gfSkgPT4ge1xuICBjb25zdCB7IGhhbmRsZUNvbm5lY3RDbGljaywgd2FsbGV0bGlzdEV4cGxhbmF0aW9uLCB3YWxsZXRBdHRhY2htZW50cywgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3Nob3dPbmJvYXJkaW5nLCBzZXRTaG93T25ib2FyZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzaG93Tm90SW5zdGFsbGVkLCBzZXRTaG93Tm90SW5zdGFsbGVkXSA9IHVzZVN0YXRlPEFkYXB0ZXIgfCBmYWxzZT4oZmFsc2UpO1xuXG4gIGNvbnN0IG9uQ2xpY2tXYWxsZXQgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTEVsZW1lbnQsIE1vdXNlRXZlbnQ+LCBhZGFwdGVyOiBBZGFwdGVyKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChhZGFwdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFuZGxlQ29ubmVjdENsaWNrKGV2ZW50LCBhZGFwdGVyKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHJlbmRlcldhbGxldExpc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGdyaWQgZ2FwLTIgZ3JpZC1jb2xzLTIgcGItNFwiIHRyYW5zbGF0ZT1cIm5vXCI+XG4gICAgICAgICAge2xpc3Qub3RoZXJzLm1hcCgoYWRhcHRlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDx1bCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICA8V2FsbGV0TGlzdEl0ZW0gaGFuZGxlQ2xpY2s9eyhlKSA9PiBvbkNsaWNrV2FsbGV0KGUsIGFkYXB0ZXIpfSB3YWxsZXQ9e2FkYXB0ZXJ9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSAhPT0gJ09uYm9hcmRpbmcnICYmIHdhbGxldGxpc3RFeHBsYW5hdGlvbiA/IChcbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YHRleHQteHMgZm9udC1zZW1pYm9sZCB1bmRlcmxpbmUgdGV4dC1jZW50ZXJgLCBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gdHdgbWItOGAgOiAnJ119PlxuICAgICAgICAgICAgPGEgaHJlZj17d2FsbGV0bGlzdEV4cGxhbmF0aW9uLmhyZWZ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoYENhbid0IGZpbmQgeW91ciB3YWxsZXQ/YCl9PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICksXG4gICAgW2hhbmRsZUNvbm5lY3RDbGljaywgbGlzdC5vdGhlcnNdLFxuICApO1xuXG4gIGNvbnN0IGhhc05vV2FsbGV0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0LmhpZ2hsaWdodC5sZW5ndGggPT09IDAgJiYgbGlzdC5vdGhlcnMubGVuZ3RoID09PSAwO1xuICB9LCBbbGlzdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGhhc05vV2FsbGV0cykge1xuICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgfVxuICB9LCBbaGFzTm9XYWxsZXRzXSk7XG5cbiAgaWYgKHNob3dPbmJvYXJkaW5nKSB7XG4gICAgcmV0dXJuIDxPbmJvYXJkaW5nRmxvdyBzaG93QmFjaz17IWhhc05vV2FsbGV0c30gb25DbG9zZT17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcoZmFsc2UpfSAvPjtcbiAgfVxuXG4gIGlmIChzaG93Tm90SW5zdGFsbGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxOb3RJbnN0YWxsZWRcbiAgICAgICAgYWRhcHRlcj17c2hvd05vdEluc3RhbGxlZH1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSl9XG4gICAgICAgIG9uR29PbmJvYXJkaW5nPXsoKSA9PiB7XG4gICAgICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGVTY3JvbGxiYXJcIiBjc3M9e1t0d2BoLWZ1bGwgb3ZlcmZsb3cteS1hdXRvIHB0LTMgcGItOCBweC01IHJlbGF0aXZlYCwgaXNPcGVuICYmIHR3YG1iLTdgXX0+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTBcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BwLVsxcHhdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmctZ3JhZGllbnQtdG8tciBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgLy8gc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC0yIGZsZXggZmxleC1jb2wgc3BhY2UteS0yIFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWAsXG4gICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezMwfSBoZWlnaHQ9ezMwfSAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LWxnIG1sLTQgbGc6bWwtMlwiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXtvblRvZ2dsZX0+XG4gICAgICAgICAgICAgIDxzcGFuIHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtZ3JleS01MDBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSBvcHRpb25zYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPENvbGxhcHNlIGhlaWdodD17MH0gbWF4SGVpZ2h0PXsnYXV0byd9IGV4cGFuZGVkPXtpc09wZW59PlxuICAgICAgICAgICAgICB7cmVuZGVyV2FsbGV0TGlzdH1cbiAgICAgICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICAgICAgPC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXhzIGZsZXgganVzdGlmeS1jZW50ZXIgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHVuZGVybGluZSBjdXJzb3ItcG9pbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBCb3R0b20gU2hhZGVzICovfVxuICAgICAge2lzT3BlbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICAgIDwvPlxuICAgICAgKSA6IG51bGx9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdDb2luYmFzZSBXYWxsZXQnIGFzIFdhbGxldE5hbWU8J0NvaW5iYXNlIFdhbGxldCc+LFxuICAnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz4sXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkgJiYgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIHNpbmNlIENvaW5iYXNlIFdhbGxldCBoYXMgdHdvIGFkYXB0ZXJzIGR1cGxpY2F0ZVxuICAgICAgICAgIGlmIChhY2MucmVjb21tZW5kZWRXYWxsZXRzLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0Lm5hbWUgPT09IGFkYXB0ZXJOYW1lKSkgcmV0dXJuIGFjYztcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zb2xlLmxvZyhyZWNvbW1lbmRlZFdhbGxldHMpO1xuICAgICAgLy8gU29ydCB0aGUgaW5zdGFsbGVkIHdhbGxldHMgYWNjb3JkaW5nIHRvIHRoZSB0b3Agd2FsbGV0cyB0aGF0IHdlIHdhbnQgdG8gc2hvdyB0byB0aGUgdXNlciBmaXJzdFxuICAgICAgY29uc3QgaGlnaGxpZ2h0OiBBZGFwdGVyW10gPSBbXTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBpbnN0YWxsZWQgd2FsbGV0IGFkYXB0ZXJzIGFuZCBjaGVjayBpZiB0aGV5IGFyZSBpbiB0aGUgdG9wIHdhbGxldHMgbGlzdFxuICAgICAgLy8gSWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXQgbGlzdCwgd2Ugd2lsbCBhZGQgaXQgdG8gdGhlIGZpbHRlcmVkIHJlY29tbWVuZGUgd2FsbGV0c1xuICAgICAgVE9QX1dBTExFVFMuZm9yRWFjaCgodG9wV2FsbGV0KSA9PiB7XG4gICAgICAgIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmZvckVhY2goKGluc3RhbGxlZFdhbGxldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBpZiAodG9wV2FsbGV0ID09PSBpbnN0YWxsZWRXYWxsZXQubmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgd2FsbGV0VG9QdXNoID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wdXNoKHdhbGxldFRvUHVzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBoaWdobGlnaHQucHVzaCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAxKSk7XG4gICAgICBjb25zb2xlLmxvZyhoaWdobGlnaHQpO1xuICAgICAgY29uc29sZS5sb2coZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQpO1xuICAgICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoKSk7XG5cbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ0luc3RhbGxlZCcsIGhpZ2hsaWdodCwgb3RoZXJzIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMubG9hZGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IGZpbHRlcmVkQWRhcHRlcnMucmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnT25ib2FyZGluZycsXG4gICAgICAgIGhpZ2hsaWdodDogW10sXG4gICAgICAgIG90aGVyczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0YCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */", process.env.NODE_ENV === "production" ? "" : ";label:SfmUnifiedWalletModal;", process.env.NODE_ENV === "production" ? "" : "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUEwY00iLCJmaWxlIjoiaW5kZXgudHN4Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRhcHRlciwgV2FsbGV0TmFtZSwgV2FsbGV0UmVhZHlTdGF0ZSB9IGZyb20gJ0Bzb2xhbmEvd2FsbGV0LWFkYXB0ZXItYmFzZSc7XG5pbXBvcnQgUmVhY3QsIHsgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VUb2dnbGUgfSBmcm9tICdyZWFjdC11c2UnO1xuaW1wb3J0IHsgV2FsbGV0SWNvbiwgV2FsbGV0TGlzdEl0ZW0gfSBmcm9tICcuL1dhbGxldExpc3RJdGVtJztcbmltcG9ydCBDb2xsYXBzZSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0NvbGxhcHNlJztcbmltcG9ydCB7IFNvbGFuYU1vYmlsZVdhbGxldEFkYXB0ZXJXYWxsZXROYW1lIH0gZnJvbSAnQHNvbGFuYS1tb2JpbGUvd2FsbGV0LWFkYXB0ZXItbW9iaWxlJztcbmltcG9ydCB0dywgeyBUd1N0eWxlIH0gZnJvbSAndHdpbi5tYWNybyc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJy4uLy4uL2NvbnRleHRzL1RyYW5zbGF0aW9uUHJvdmlkZXInO1xuaW1wb3J0IHsgSVVuaWZpZWRUaGVtZSwgdXNlVW5pZmllZFdhbGxldCwgdXNlVW5pZmllZFdhbGxldENvbnRleHQgfSBmcm9tICcuLi8uLi9jb250ZXh0cy9VbmlmaWVkV2FsbGV0Q29udGV4dCc7XG5pbXBvcnQgeyB1c2VQcmV2aW91c2x5Q29ubmVjdGVkIH0gZnJvbSAnLi4vLi4vY29udGV4dHMvV2FsbGV0Q29ubmVjdGlvblByb3ZpZGVyL3ByZXZpb3VzbHlDb25uZWN0ZWRQcm92aWRlcic7XG5pbXBvcnQgQ2xvc2VJY29uIGZyb20gJy4uLy4uL2ljb25zL0Nsb3NlSWNvbic7XG5pbXBvcnQgeyBpc01vYmlsZSwgdXNlT3V0c2lkZUNsaWNrIH0gZnJvbSAnLi4vLi4vbWlzYy91dGlscyc7XG5pbXBvcnQgTm90SW5zdGFsbGVkIGZyb20gJy4uL1VuaWZpZWRXYWxsZXRNb2RhbC9Ob3RJbnN0YWxsZWQnO1xuaW1wb3J0IHsgT25ib2FyZGluZ0Zsb3cgfSBmcm9tICcuLi9VbmlmaWVkV2FsbGV0TW9kYWwvT25ib2FyZGluZyc7XG5pbXBvcnQgeyBTZm1Mb2dvIH0gZnJvbSAnLi9TZm1Mb2dvJztcblxuY29uc3Qgc3R5bGVzOiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXkgaW4gSVVuaWZpZWRUaGVtZV06IFR3U3R5bGVbXSB9PiA9IHtcbiAgY29udGFpbmVyOiB7XG4gICAgbGlnaHQ6IFt0d2BiZy1saWdodC0xMDAgdGV4dC1ncmV5LTcwMGBdLFxuICAgIGRhcms6IFt0d2BiZy1kYXJrLTcwMCB0ZXh0LWdyZXktNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZSBiZy1bcmdiKDQ5LCA2MiwgNzYpXWBdLFxuICB9LFxuICBzaGFkZXM6IHtcbiAgICBsaWdodDogW3R3YGJnLWdyYWRpZW50LXRvLXQgZnJvbS1bI2ZmZmZmZl0gdG8tdHJhbnNwYXJlbnQgcG9pbnRlci1ldmVudHMtbm9uZWBdLFxuICAgIGRhcms6IFt0d2BiZy1ncmFkaWVudC10by10IGZyb20tWyMzQTNCNDNdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgICBqdXBpdGVyOiBbdHdgYmctZ3JhZGllbnQtdG8tdCBmcm9tLVtyZ2IoNDksIDYyLCA3NildIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVgXSxcbiAgfSxcbiAgd2FsbGV0SXRlbToge1xuICAgIGxpZ2h0OiBbdHdgYmctZ3JheS01MCBob3ZlcjpzaGFkb3ctbGdgXSxcbiAgICBkYXJrOiBbdHdgYmctZGFyay03MDAgaG92ZXI6c2hhZG93LTJ4bGBdLFxuICAgIGp1cGl0ZXI6IFt0d2Bob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOmJnLXdoaXRlLzEwYF0sXG4gIH0sXG4gIHN1YnRpdGxlOiB7XG4gICAgbGlnaHQ6IFt0d2B0ZXh0LWJsYWNrLzUwYF0sXG4gICAgZGFyazogW3R3YHRleHQtd2hpdGUvNTBgXSxcbiAgICBqdXBpdGVyOiBbdHdgdGV4dC13aGl0ZS81MGBdLFxuICB9LFxuICBoZWFkZXI6IHtcbiAgICBsaWdodDogW3R3YGJvcmRlci1iYF0sXG4gICAgZGFyazogW10sXG4gICAganVwaXRlcjogW10sXG4gIH0sXG4gIGJ1dHRvblRleHQ6IHtcbiAgICBsaWdodDogW3R3YHRleHQtZ3JheS04MDBgXSxcbiAgICBkYXJrOiBbdHdgdGV4dC13aGl0ZS84MGBdLFxuICAgIGp1cGl0ZXI6IFt0d2B0ZXh0LXdoaXRlLzgwYF0sXG4gIH0sXG59O1xuXG5jb25zdCBIZWFkZXI6IFJlYWN0LkZDPHsgb25DbG9zZTogKCkgPT4gdm9pZCB9PiA9ICh7IG9uQ2xvc2UgfSkgPT4ge1xuICBjb25zdCB7IHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNzcz17W3R3YHB4LTUgcHktNiBmbGV4IGZsZXgtcm93IGp1c3RpZnktY2VudGVyIGAsIHN0eWxlcy5oZWFkZXJbdGhlbWVdXX0+XG4gICAgICA8ZGl2IHR3PVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgPGltZyBzcmM9e1NmbUxvZ299IGFsdD1cImxvZ29cIiAvPlxuICAgICAgICA8ZGl2IHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LXhsIC1tdC0xMFwiPlxuICAgICAgICAgIDxzcGFuIGNzcz17W3R3YHRleHQtdHJhbnNwYXJlbnQgYmctY2xpcC10ZXh0IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1bIzgwNTdGRl0gdG8tWyNEODRFNzZdYF19PlxuICAgICAgICAgICAge3QoYENvbm5lY3QgV2FsbGV0YCl9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjc3M9e1t0d2B0ZXh0LXNtIG10LTEgZm9udC1zZW1pYm9sZGAsIHN0eWxlcy5zdWJ0aXRsZVt0aGVtZV1dfT5cbiAgICAgICAgICA8c3Bhbj57dChgQ29ubmVjdCBhIHdhbGxldCB0byBwcm9jZWVkYCl9PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8YnV0dG9uIHR3PVwiYWJzb2x1dGUgdG9wLTQgcmlnaHQtNFwiIG9uQ2xpY2s9e29uQ2xvc2V9PlxuICAgICAgICA8Q2xvc2VJY29uIHdpZHRoPXsxMn0gaGVpZ2h0PXsxMn0gLz5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgTGlzdE9mV2FsbGV0czogUmVhY3QuRkM8e1xuICBsaXN0OiB7XG4gICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgaGlnaGxpZ2h0ZWRCeTogSElHSExJR0hURURfQlk7XG4gICAgaGlnaGxpZ2h0OiBBZGFwdGVyW107XG4gICAgb3RoZXJzOiBBZGFwdGVyW107XG4gIH07XG4gIG9uVG9nZ2xlOiAobmV4dFZhbHVlPzogYW55KSA9PiB2b2lkO1xuICBpc09wZW46IGJvb2xlYW47XG59PiA9ICh7IGxpc3QsIG9uVG9nZ2xlLCBpc09wZW4gfSkgPT4ge1xuICBjb25zdCB7IGhhbmRsZUNvbm5lY3RDbGljaywgd2FsbGV0bGlzdEV4cGxhbmF0aW9uLCB3YWxsZXRBdHRhY2htZW50cywgdGhlbWUgfSA9IHVzZVVuaWZpZWRXYWxsZXRDb250ZXh0KCk7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgY29uc3QgW3Nob3dPbmJvYXJkaW5nLCBzZXRTaG93T25ib2FyZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzaG93Tm90SW5zdGFsbGVkLCBzZXRTaG93Tm90SW5zdGFsbGVkXSA9IHVzZVN0YXRlPEFkYXB0ZXIgfCBmYWxzZT4oZmFsc2UpO1xuXG4gIGNvbnN0IG9uQ2xpY2tXYWxsZXQgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZlbnQ6IFJlYWN0Lk1vdXNlRXZlbnQ8SFRNTEVsZW1lbnQsIE1vdXNlRXZlbnQ+LCBhZGFwdGVyOiBBZGFwdGVyKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChhZGFwdGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaGFuZGxlQ29ubmVjdENsaWNrKGV2ZW50LCBhZGFwdGVyKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHJlbmRlcldhbGxldExpc3QgPSB1c2VNZW1vKFxuICAgICgpID0+IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGdyaWQgZ2FwLTIgZ3JpZC1jb2xzLTIgcGItNFwiIHRyYW5zbGF0ZT1cIm5vXCI+XG4gICAgICAgICAge2xpc3Qub3RoZXJzLm1hcCgoYWRhcHRlciwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDx1bCBrZXk9e2luZGV4fT5cbiAgICAgICAgICAgICAgICA8V2FsbGV0TGlzdEl0ZW0gaGFuZGxlQ2xpY2s9eyhlKSA9PiBvbkNsaWNrV2FsbGV0KGUsIGFkYXB0ZXIpfSB3YWxsZXQ9e2FkYXB0ZXJ9IC8+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAge2xpc3QuaGlnaGxpZ2h0ZWRCeSAhPT0gJ09uYm9hcmRpbmcnICYmIHdhbGxldGxpc3RFeHBsYW5hdGlvbiA/IChcbiAgICAgICAgICA8ZGl2IGNzcz17W3R3YHRleHQteHMgZm9udC1zZW1pYm9sZCB1bmRlcmxpbmUgdGV4dC1jZW50ZXJgLCBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gdHdgbWItOGAgOiAnJ119PlxuICAgICAgICAgICAgPGEgaHJlZj17d2FsbGV0bGlzdEV4cGxhbmF0aW9uLmhyZWZ9IHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4+e3QoYENhbid0IGZpbmQgeW91ciB3YWxsZXQ/YCl9PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogbnVsbH1cbiAgICAgIDwvZGl2PlxuICAgICksXG4gICAgW2hhbmRsZUNvbm5lY3RDbGljaywgbGlzdC5vdGhlcnNdLFxuICApO1xuXG4gIGNvbnN0IGhhc05vV2FsbGV0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBsaXN0LmhpZ2hsaWdodC5sZW5ndGggPT09IDAgJiYgbGlzdC5vdGhlcnMubGVuZ3RoID09PSAwO1xuICB9LCBbbGlzdF0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGhhc05vV2FsbGV0cykge1xuICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgfVxuICB9LCBbaGFzTm9XYWxsZXRzXSk7XG5cbiAgaWYgKHNob3dPbmJvYXJkaW5nKSB7XG4gICAgcmV0dXJuIDxPbmJvYXJkaW5nRmxvdyBzaG93QmFjaz17IWhhc05vV2FsbGV0c30gb25DbG9zZT17KCkgPT4gc2V0U2hvd09uYm9hcmRpbmcoZmFsc2UpfSAvPjtcbiAgfVxuXG4gIGlmIChzaG93Tm90SW5zdGFsbGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxOb3RJbnN0YWxsZWRcbiAgICAgICAgYWRhcHRlcj17c2hvd05vdEluc3RhbGxlZH1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSl9XG4gICAgICAgIG9uR29PbmJvYXJkaW5nPXsoKSA9PiB7XG4gICAgICAgICAgc2V0U2hvd09uYm9hcmRpbmcodHJ1ZSk7XG4gICAgICAgICAgc2V0U2hvd05vdEluc3RhbGxlZChmYWxzZSk7XG4gICAgICAgIH19XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImhpZGVTY3JvbGxiYXJcIiBjc3M9e1t0d2BoLWZ1bGwgb3ZlcmZsb3cteS1hdXRvIHB0LTMgcGItOCBweC01IHJlbGF0aXZlYCwgaXNPcGVuICYmIHR3YG1iLTdgXX0+XG4gICAgICAgIDxkaXYgdHc9XCJtdC00IGZsZXggZmxleC1jb2wgbGc6ZmxleC1yb3cgbGc6c3BhY2UteC0yIHNwYWNlLXktMiBsZzpzcGFjZS15LTBcIj5cbiAgICAgICAgICB7bGlzdC5yZWNvbW1lbmRlZFdhbGxldHMubWFwKChhZGFwdGVyLCBpZHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSB3YWxsZXRBdHRhY2htZW50cyA/IHdhbGxldEF0dGFjaG1lbnRzW2FkYXB0ZXIubmFtZV0/LmF0dGFjaG1lbnQgOiBudWxsO1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhldmVudCkgPT4gb25DbGlja1dhbGxldChldmVudCwgYWRhcHRlcil9XG4gICAgICAgICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICAgICAgICB0d2BwLVsxcHhdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJhY2tkcm9wLWJsdXIteGwgdHJhbnNpdGlvbi1hbGxgLFxuICAgICAgICAgICAgICAgICAgdHdgaG92ZXI6YmctZ3JhZGllbnQtdG8tciBmcm9tLVsjODA1N0ZGXSB0by1bI0Q4NEU3Nl1gLFxuICAgICAgICAgICAgICAgICAgLy8gc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICBjc3M9e1tcbiAgICAgICAgICAgICAgICAgICAgdHdgcHktNCBweC00IGxnOnB4LTIgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBsZzpqdXN0aWZ5LWNlbnRlciBjdXJzb3ItcG9pbnRlciBmbGV4LTEgdy1mdWxsYCxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVzLndhbGxldEl0ZW1bdGhlbWVdLFxuICAgICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7aXNNb2JpbGUoKSA/IChcbiAgICAgICAgICAgICAgICAgICAgPFdhbGxldEljb24gd2FsbGV0PXthZGFwdGVyfSB3aWR0aD17MjR9IGhlaWdodD17MjR9IC8+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXszMH0gaGVpZ2h0PXszMH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8c3BhbiB0dz1cImZvbnQtc2VtaWJvbGQgdGV4dC1sZyBtbC00IGxnOm1sLTJcIj57YWRhcHRlck5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAge2F0dGFjaG1lbnQgPyA8ZGl2PnthdHRhY2htZW50fTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgdHc9XCJtdC0yIGZsZXggZmxleC1jb2wgc3BhY2UteS0yIFwiPlxuICAgICAgICAgIHtsaXN0LmhpZ2hsaWdodC5tYXAoKGFkYXB0ZXIsIGlkeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWRhcHRlci5uYW1lID09PSBTb2xhbmFNb2JpbGVXYWxsZXRBZGFwdGVyV2FsbGV0TmFtZSkgcmV0dXJuIHQoYE1vYmlsZWApO1xuICAgICAgICAgICAgICByZXR1cm4gYWRhcHRlci5uYW1lO1xuICAgICAgICAgICAgfSkoKTtcblxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudCA9IHdhbGxldEF0dGFjaG1lbnRzID8gd2FsbGV0QXR0YWNobWVudHNbYWRhcHRlci5uYW1lXT8uYXR0YWNobWVudCA6IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBrZXk9e2lkeH1cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZXZlbnQpID0+IG9uQ2xpY2tXYWxsZXQoZXZlbnQsIGFkYXB0ZXIpfVxuICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgdHdgcC1bMXB4XSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgZmxleCBpdGVtcy1jZW50ZXIgbGc6anVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXIgZmxleC0xIHctZnVsbGAsXG4gICAgICAgICAgICAgICAgICB0d2Bob3ZlcjpiYWNrZHJvcC1ibHVyLXhsIHRyYW5zaXRpb24tYWxsYCxcbiAgICAgICAgICAgICAgICAgIHR3YGhvdmVyOmJnLWdyYWRpZW50LXRvLXIgIGZyb20tWyM4MDU3RkZdIHRvLVsjRDg0RTc2XWAsXG4gICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgXX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNzcz17W1xuICAgICAgICAgICAgICAgICAgICB0d2BweS00IHB4LTQgbGc6cHgtMiByb3VuZGVkLWxnIGZsZXggaXRlbXMtY2VudGVyIGxnOmp1c3RpZnktY2VudGVyIGN1cnNvci1wb2ludGVyIGZsZXgtMSB3LWZ1bGxgLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZXMud2FsbGV0SXRlbVt0aGVtZV0sXG4gICAgICAgICAgICAgICAgICBdfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHtpc01vYmlsZSgpID8gKFxuICAgICAgICAgICAgICAgICAgICA8V2FsbGV0SWNvbiB3YWxsZXQ9e2FkYXB0ZXJ9IHdpZHRoPXsyNH0gaGVpZ2h0PXsyNH0gLz5cbiAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxXYWxsZXRJY29uIHdhbGxldD17YWRhcHRlcn0gd2lkdGg9ezMwfSBoZWlnaHQ9ezMwfSAvPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDxzcGFuIHR3PVwiZm9udC1zZW1pYm9sZCB0ZXh0LWxnIG1sLTQgbGc6bWwtMlwiPnthZGFwdGVyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICB7YXR0YWNobWVudCA/IDxkaXY+e2F0dGFjaG1lbnR9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7d2FsbGV0bGlzdEV4cGxhbmF0aW9uICYmIGxpc3Qub3RoZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIG10LTQgLW1iLTIgdGV4dC13aGl0ZS84MCB1bmRlcmxpbmUgY3Vyc29yLXBvaW50ZXJcIj5cbiAgICAgICAgICAgIDxhIGhyZWY9e3dhbGxldGxpc3RFeHBsYW5hdGlvbi5ocmVmfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxzcGFuPnt0KGBDYW4ndCBmaW5kIHlvdXIgd2FsbGV0P2ApfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IG51bGx9XG5cbiAgICAgICAge2xpc3Qub3RoZXJzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxkaXYgdHc9XCJtdC01IGZsZXgganVzdGlmeS1jZW50ZXIgY3Vyc29yLXBvaW50ZXJcIiBvbkNsaWNrPXtvblRvZ2dsZX0+XG4gICAgICAgICAgICAgIDxzcGFuIHR3PVwidGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtZ3JleS01MDBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj57dChgTW9yZSBvcHRpb25zYCl9PC9zcGFuPlxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPENvbGxhcHNlIGhlaWdodD17MH0gbWF4SGVpZ2h0PXsnYXV0byd9IGV4cGFuZGVkPXtpc09wZW59PlxuICAgICAgICAgICAgICB7cmVuZGVyV2FsbGV0TGlzdH1cbiAgICAgICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICAgICAgPC8+XG4gICAgICAgICkgOiBudWxsfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgY3NzPXtbXG4gICAgICAgICAgICB0d2B0ZXh0LXhzIGZsZXgganVzdGlmeS1jZW50ZXIgZm9udC1zZW1pYm9sZCBtdC00IC1tYi0yIHVuZGVybGluZSBjdXJzb3ItcG9pbnRlcmAsXG4gICAgICAgICAgICBzdHlsZXMuYnV0dG9uVGV4dFt0aGVtZV0sXG4gICAgICAgICAgXX1cbiAgICAgICAgPlxuICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eygpID0+IHNldFNob3dPbmJvYXJkaW5nKHRydWUpfT5cbiAgICAgICAgICAgIDxzcGFuPnt0KGBJIGRvbid0IGhhdmUgYSB3YWxsZXRgKX08L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBCb3R0b20gU2hhZGVzICovfVxuICAgICAge2lzT3BlbiAmJiBsaXN0Lm90aGVycy5sZW5ndGggPiA2ID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY3NzPXtbdHdgYmxvY2sgdy1mdWxsIGgtMjAgYWJzb2x1dGUgbGVmdC0wIGJvdHRvbS03IHotNTBgLCBzdHlsZXMuc2hhZGVzW3RoZW1lXV19IC8+XG4gICAgICAgIDwvPlxuICAgICAgKSA6IG51bGx9XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCBQUklPUklUSVNFOiB7XG4gIFt2YWx1ZSBpbiBXYWxsZXRSZWFkeVN0YXRlXTogbnVtYmVyO1xufSA9IHtcbiAgW1dhbGxldFJlYWR5U3RhdGUuSW5zdGFsbGVkXTogMSxcbiAgW1dhbGxldFJlYWR5U3RhdGUuTG9hZGFibGVdOiAyLFxuICBbV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZF06IDMsXG4gIFtXYWxsZXRSZWFkeVN0YXRlLlVuc3VwcG9ydGVkXTogMyxcbn07XG5leHBvcnQgaW50ZXJmYWNlIFdhbGxldE1vZGFsUHJvcHMge1xuICBjbGFzc05hbWU/OiBzdHJpbmc7XG4gIGxvZ28/OiBSZWFjdE5vZGU7XG4gIGNvbnRhaW5lcj86IHN0cmluZztcbn1cblxudHlwZSBISUdITElHSFRFRF9CWSA9ICdQcmV2aW91c2x5Q29ubmVjdGVkJyB8ICdJbnN0YWxsZWQnIHwgJ1RvcFdhbGxldCcgfCAnT25ib2FyZGluZycgfCAnUmVjb21tZW5kZWQnO1xuY29uc3QgUkVDT01NRU5ERURfV0FMTEVUUzogV2FsbGV0TmFtZVtdID0gWydTb2xmbGFyZScgYXMgV2FsbGV0TmFtZTwnU29sZmxhcmUnPl07XG5cbmNvbnN0IFRPUF9XQUxMRVRTOiBXYWxsZXROYW1lW10gPSBbXG4gICdDb2luYmFzZSBXYWxsZXQnIGFzIFdhbGxldE5hbWU8J0NvaW5iYXNlIFdhbGxldCc+LFxuICAnQmFja3BhY2snIGFzIFdhbGxldE5hbWU8J0JhY2twYWNrJz4sXG4gICdQaGFudG9tJyBhcyBXYWxsZXROYW1lPCdQaGFudG9tJz4sXG5dO1xuXG5pbnRlcmZhY2UgSVVuaWZpZWRXYWxsZXRNb2RhbCB7XG4gIG9uQ2xvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IHNvcnRCeVByZWNlZGVuY2UgPSAod2FsbGV0UHJlY2VkZW5jZTogV2FsbGV0TmFtZVtdKSA9PiAoYTogQWRhcHRlciwgYjogQWRhcHRlcikgPT4ge1xuICBpZiAoIXdhbGxldFByZWNlZGVuY2UpIHJldHVybiAwO1xuXG4gIGNvbnN0IGFJbmRleCA9IHdhbGxldFByZWNlZGVuY2UuaW5kZXhPZihhLm5hbWUpO1xuICBjb25zdCBiSW5kZXggPSB3YWxsZXRQcmVjZWRlbmNlLmluZGV4T2YoYi5uYW1lKTtcblxuICBpZiAoYUluZGV4ID09PSAtMSAmJiBiSW5kZXggPT09IC0xKSByZXR1cm4gMDtcbiAgaWYgKGFJbmRleCA+PSAwKSB7XG4gICAgaWYgKGJJbmRleCA9PT0gLTEpIHJldHVybiAtMTtcbiAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICB9XG5cbiAgaWYgKGJJbmRleCA+PSAwKSB7XG4gICAgaWYgKGFJbmRleCA9PT0gLTEpIHJldHVybiAxO1xuICAgIHJldHVybiBiSW5kZXggLSBhSW5kZXg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5jb25zdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw6IFJlYWN0LkZDPElVbmlmaWVkV2FsbGV0TW9kYWw+ID0gKHsgb25DbG9zZSB9KSA9PiB7XG4gIGNvbnN0IHsgd2FsbGV0cyB9ID0gdXNlVW5pZmllZFdhbGxldCgpO1xuICBjb25zdCB7IHdhbGxldFByZWNlZGVuY2UsIHRoZW1lIH0gPSB1c2VVbmlmaWVkV2FsbGV0Q29udGV4dCgpO1xuICBjb25zdCBbaXNPcGVuLCBvblRvZ2dsZV0gPSB1c2VUb2dnbGUoZmFsc2UpO1xuICBjb25zdCBwcmV2aW91c2x5Q29ubmVjdGVkID0gdXNlUHJldmlvdXNseUNvbm5lY3RlZCgpO1xuXG4gIGNvbnN0IGxpc3Q6IHtcbiAgICByZWNvbW1lbmRlZFdhbGxldHM6IEFkYXB0ZXJbXTtcbiAgICBoaWdobGlnaHRlZEJ5OiBISUdITElHSFRFRF9CWTtcbiAgICBoaWdobGlnaHQ6IEFkYXB0ZXJbXTtcbiAgICBvdGhlcnM6IEFkYXB0ZXJbXTtcbiAgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIC8vIFRoZW4sIEluc3RhbGxlZCwgVG9wIDMsIExvYWRhYmxlLCBOb3REZXRlY3RlZFxuICAgIGNvbnN0IGZpbHRlcmVkQWRhcHRlcnMgPSB3YWxsZXRzLnJlZHVjZTx7XG4gICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBBZGFwdGVyW107XG4gICAgICBpbnN0YWxsZWQ6IEFkYXB0ZXJbXTtcbiAgICAgIHRvcDM6IEFkYXB0ZXJbXTtcbiAgICAgIGxvYWRhYmxlOiBBZGFwdGVyW107XG4gICAgICBub3REZXRlY3RlZDogQWRhcHRlcltdO1xuICAgICAgcmVjb21tZW5kZWRXYWxsZXRzOiBBZGFwdGVyW107XG4gICAgfT4oXG4gICAgICAoYWNjLCB3YWxsZXQpID0+IHtcbiAgICAgICAgY29uc3QgYWRhcHRlck5hbWUgPSB3YWxsZXQuYWRhcHRlci5uYW1lO1xuXG4gICAgICAgIGlmIChSRUNPTU1FTkRFRF9XQUxMRVRTLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0ID09PSBhZGFwdGVyTmFtZSkgJiYgYWNjLnJlY29tbWVuZGVkV2FsbGV0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIHNpbmNlIENvaW5iYXNlIFdhbGxldCBoYXMgdHdvIGFkYXB0ZXJzIGR1cGxpY2F0ZVxuICAgICAgICAgIGlmIChhY2MucmVjb21tZW5kZWRXYWxsZXRzLnNvbWUoKHdhbGxldCkgPT4gd2FsbGV0Lm5hbWUgPT09IGFkYXB0ZXJOYW1lKSkgcmV0dXJuIGFjYztcbiAgICAgICAgICBhY2MucmVjb21tZW5kZWRXYWxsZXRzLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2aW91c2x5IGNvbm5lY3RlZCB0YWtlcyBoaWdoZXN0XG4gICAgICAgIGNvbnN0IHByZXZpb3VzbHlDb25uZWN0ZWRJbmRleCA9IHByZXZpb3VzbHlDb25uZWN0ZWQuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmIChwcmV2aW91c2x5Q29ubmVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy5wcmV2aW91c2x5Q29ubmVjdGVkW3ByZXZpb3VzbHlDb25uZWN0ZWRJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZW4gSW5zdGFsbGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5JbnN0YWxsZWQpIHtcbiAgICAgICAgICBhY2MuaW5zdGFsbGVkLnB1c2god2FsbGV0LmFkYXB0ZXIpO1xuICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVG9wIDNcbiAgICAgICAgY29uc3QgdG9wV2FsbGV0c0luZGV4ID0gVE9QX1dBTExFVFMuaW5kZXhPZihhZGFwdGVyTmFtZSk7XG4gICAgICAgIGlmICh0b3BXYWxsZXRzSW5kZXggPj0gMCkge1xuICAgICAgICAgIGFjYy50b3AzW3RvcFdhbGxldHNJbmRleF0gPSB3YWxsZXQuYWRhcHRlcjtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWRhYmxlXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Mb2FkYWJsZSkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdERldGVjdGVkXG4gICAgICAgIGlmICh3YWxsZXQucmVhZHlTdGF0ZSA9PT0gV2FsbGV0UmVhZHlTdGF0ZS5Ob3REZXRlY3RlZCkge1xuICAgICAgICAgIGFjYy5sb2FkYWJsZS5wdXNoKHdhbGxldC5hZGFwdGVyKTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IFtdLFxuICAgICAgICBwcmV2aW91c2x5Q29ubmVjdGVkOiBbXSxcbiAgICAgICAgaW5zdGFsbGVkOiBbXSxcbiAgICAgICAgdG9wMzogW10sXG4gICAgICAgIGxvYWRhYmxlOiBbXSxcbiAgICAgICAgbm90RGV0ZWN0ZWQ6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZCwgLi4ucmVzdCB9ID0gZmlsdGVyZWRBZGFwdGVycztcblxuICAgICAgY29uc3QgaGlnaGxpZ2h0ID0gZmlsdGVyZWRBZGFwdGVycy5wcmV2aW91c2x5Q29ubmVjdGVkLnNsaWNlKDAsIDMpO1xuICAgICAgbGV0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgICAgLmZsYXQoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gUFJJT1JJVElTRVthLnJlYWR5U3RhdGVdIC0gUFJJT1JJVElTRVtiLnJlYWR5U3RhdGVdKVxuICAgICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICAgIG90aGVycy51bnNoaWZ0KC4uLmZpbHRlcmVkQWRhcHRlcnMucHJldmlvdXNseUNvbm5lY3RlZC5zbGljZSgzLCBmaWx0ZXJlZEFkYXB0ZXJzLnByZXZpb3VzbHlDb25uZWN0ZWQubGVuZ3RoKSk7XG4gICAgICBvdGhlcnMgPSBvdGhlcnMuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHMsXG4gICAgICAgIGhpZ2hsaWdodGVkQnk6ICdQcmV2aW91c2x5Q29ubmVjdGVkJyxcbiAgICAgICAgaGlnaGxpZ2h0LFxuICAgICAgICBvdGhlcnMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB7IHJlY29tbWVuZGVkV2FsbGV0cywgaW5zdGFsbGVkLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuXG4gICAgICBjb25zb2xlLmxvZyhyZWNvbW1lbmRlZFdhbGxldHMpO1xuICAgICAgLy8gU29ydCB0aGUgaW5zdGFsbGVkIHdhbGxldHMgYWNjb3JkaW5nIHRvIHRoZSB0b3Agd2FsbGV0cyB0aGF0IHdlIHdhbnQgdG8gc2hvdyB0byB0aGUgdXNlciBmaXJzdFxuICAgICAgY29uc3QgaGlnaGxpZ2h0OiBBZGFwdGVyW10gPSBbXTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBpbnN0YWxsZWQgd2FsbGV0IGFkYXB0ZXJzIGFuZCBjaGVjayBpZiB0aGV5IGFyZSBpbiB0aGUgdG9wIHdhbGxldHMgbGlzdFxuICAgICAgLy8gSWYgdGhleSBhcmUgaW4gdGhlIHRvcCB3YWxsZXQgbGlzdCwgd2Ugd2lsbCBhZGQgaXQgdG8gdGhlIGZpbHRlcmVkIHJlY29tbWVuZGUgd2FsbGV0c1xuICAgICAgVE9QX1dBTExFVFMuZm9yRWFjaCgodG9wV2FsbGV0KSA9PiB7XG4gICAgICAgIGZpbHRlcmVkQWRhcHRlcnMuaW5zdGFsbGVkLmZvckVhY2goKGluc3RhbGxlZFdhbGxldCwgaW5kZXgpID0+IHtcbiAgICAgICAgICBpZiAodG9wV2FsbGV0ID09PSBpbnN0YWxsZWRXYWxsZXQubmFtZSkge1xuICAgICAgICAgICAgY29uc3Qgd2FsbGV0VG9QdXNoID0gZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wdXNoKHdhbGxldFRvUHVzaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBoaWdobGlnaHQucHVzaCguLi5maWx0ZXJlZEFkYXB0ZXJzLmluc3RhbGxlZC5zbGljZSgwLCAxKSk7XG4gICAgICBjb25zb2xlLmxvZyhoaWdobGlnaHQpO1xuICAgICAgY29uc29sZS5sb2coZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQpO1xuICAgICAgY29uc3Qgb3RoZXJzID0gT2JqZWN0LnZhbHVlcyhyZXN0KVxuICAgICAgICAuZmxhdCgpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAgIC5zb3J0KHNvcnRCeVByZWNlZGVuY2Uod2FsbGV0UHJlY2VkZW5jZSB8fCBbXSkpO1xuICAgICAgb3RoZXJzLnVuc2hpZnQoLi4uZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQuc2xpY2UoMCwgZmlsdGVyZWRBZGFwdGVycy5pbnN0YWxsZWQubGVuZ3RoKSk7XG5cbiAgICAgIHJldHVybiB7IHJlY29tbWVuZGVkV2FsbGV0cywgaGlnaGxpZ2h0ZWRCeTogJ0luc3RhbGxlZCcsIGhpZ2hsaWdodCwgb3RoZXJzIH07XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcmVkQWRhcHRlcnMubG9hZGFibGUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWNvbW1lbmRlZFdhbGxldHM6IGZpbHRlcmVkQWRhcHRlcnMucmVjb21tZW5kZWRXYWxsZXRzLFxuICAgICAgICBoaWdobGlnaHRlZEJ5OiAnT25ib2FyZGluZycsXG4gICAgICAgIGhpZ2hsaWdodDogW10sXG4gICAgICAgIG90aGVyczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgcmVjb21tZW5kZWRXYWxsZXRzLCB0b3AzLCAuLi5yZXN0IH0gPSBmaWx0ZXJlZEFkYXB0ZXJzO1xuICAgIGNvbnN0IG90aGVycyA9IE9iamVjdC52YWx1ZXMocmVzdClcbiAgICAgIC5mbGF0KClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBQUklPUklUSVNFW2EucmVhZHlTdGF0ZV0gLSBQUklPUklUSVNFW2IucmVhZHlTdGF0ZV0pXG4gICAgICAuc29ydChzb3J0QnlQcmVjZWRlbmNlKHdhbGxldFByZWNlZGVuY2UgfHwgW10pKTtcbiAgICByZXR1cm4geyByZWNvbW1lbmRlZFdhbGxldHMsIGhpZ2hsaWdodGVkQnk6ICdUb3BXYWxsZXQnLCBoaWdobGlnaHQ6IHRvcDMsIG90aGVycyB9O1xuICB9LCBbd2FsbGV0cywgcHJldmlvdXNseUNvbm5lY3RlZF0pO1xuXG4gIGNvbnN0IGNvbnRlbnRSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQ+KG51bGwpO1xuICB1c2VPdXRzaWRlQ2xpY2soY29udGVudFJlZiwgb25DbG9zZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICByZWY9e2NvbnRlbnRSZWZ9XG4gICAgICBjc3M9e1tcbiAgICAgICAgdHdgbWF4LXctbWQgdy1mdWxsIHJlbGF0aXZlIGZsZXggZmxleC1jb2wgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1oZWlnaHQgZHVyYXRpb24tNTAwIGVhc2UtaW4tb3V0YCxcbiAgICAgICAgc3R5bGVzLmNvbnRhaW5lclt0aGVtZV0sXG4gICAgICBdfVxuICAgID5cbiAgICAgIDxIZWFkZXIgb25DbG9zZT17b25DbG9zZX0gLz5cbiAgICAgIDxMaXN0T2ZXYWxsZXRzIGxpc3Q9e2xpc3R9IG9uVG9nZ2xlPXtvblRvZ2dsZX0gaXNPcGVuPXtpc09wZW59IC8+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZm1VbmlmaWVkV2FsbGV0TW9kYWw7XG4iXX0= */"]
  }, jsx(Header, {
    onClose: onClose
  }), jsx(ListOfWallets, {
    list: list,
    onToggle: onToggle,
    isOpen: isOpen
  }));
};
var SfmUnifiedWalletModal$1 = SfmUnifiedWalletModal;

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
  }, jsx(SfmUnifiedWalletModal$1, {
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
