import { createRoot } from 'react-dom/client';
import Axios, { Method } from 'axios';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { StoreProvider, rootStore } from './discrete-layer/models/RootStore';
import { SearchResponse } from './discrete-layer/models/discreteLayersStore';
import CONFIG from './common/config';
import { syncHttpClientGql } from './syncHttpClientGql';
import { customizeStoreBehavior } from './customize-store-behavior';

import './index.css';

/* eslint-disable */
const store = rootStore.create(
  {},
  {
    fetch: async (
      url: string,
      method: Method,
      params: Record<string, unknown>
    ) =>
      Axios.request({
        url,
        method,
        data: params,
        baseURL: `${CONFIG.SERVICE_PROTOCOL as string}${
          CONFIG.SERVICE_NAME as string
        }`,
      }).then((res) => res.data as SearchResponse),
    gqlHttpClient: syncHttpClientGql(),
    // gqlHttpClient: createHttpClient("http://localhost:8080/graphql")
  }
);

customizeStoreBehavior(store);

// REMARK IIFE to discard language presentation logic
((): void => {
  const lang = CONFIG.I18N.DEFAULT_LANGUAGE; //navigator.language.split(/[-_]/)[0];  // language without region code

  document.documentElement.lang = lang;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (lang === 'he') {
    document.body.dir = 'rtl';
  }
})();

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <StoreProvider value={store}>
    {/* Problematic. TODO: Investigate why. */}
    {/* <React.StrictMode> */}
    <App />
    {/* </React.StrictMode> */}
  </StoreProvider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
/* eslint-enable */
