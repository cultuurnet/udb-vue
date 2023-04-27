import '@fortawesome/fontawesome-svg-core/styles.css';
import '../../public/js/uitid-widget/index-de59e838.css';

import { config } from '@fortawesome/fontawesome-svg-core';
import NextHead from 'next/head';
import Script from 'next/script';
import PropTypes from 'prop-types';
import { cloneElement } from 'react';
import { Cookies, CookiesProvider } from 'react-cookie';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Hydrate } from 'react-query/hydration';

import { UserContext } from '@/context/UserContext';
import { defaultCookieOptions } from '@/hooks/useCookiesWithOptions';
import { createCookieName, FeatureFlags } from '@/hooks/useFeatureFlag';
import i18n from '@/i18n/index';
import Layout from '@/layouts/index';
import { GlobalStyle } from '@/styles/GlobalStyle';
import { ThemeProvider } from '@/ui/ThemeProvider';

import { AnnouncementModalProvider } from '../context/AnnouncementModalContext';

const cookies = new Cookies();

const widgetConfig = {
  applicationName: 'UiTdatabank',
  uitidProfileUrl: 'https://profile.uitid.be',
  language: 'nl',
  auth0Domain: 'https://account-acc.uitid.be',
  loginUrl: 'http://localhost:3000/api/auth/login',
  logoutUrl: 'http://localhost:3000/api/auth/logout',
  accessTokenCookieName: 'token',
  actions: [
    {
      url: '/dashboard?tab=events&yrdy',
      label: 'Mijn evenementen',
    },
    {
      url: '/dashboard?tab=places',
      label: 'Mijn locaties',
    },
  ],
};

if (typeof window !== 'undefined') {
  window.FeatureFlags = FeatureFlags;

  window.setFeatureFlag = (featureFlagName, value) => {
    cookies.set(createCookieName(featureFlagName), value, defaultCookieOptions);
    window.getCurrentFeatureFlagConfiguration();
  };

  window.getCurrentFeatureFlagConfiguration = () => {
    // eslint-disable-next-line no-console
    console.table(
      Object.entries(FeatureFlags).reduce(
        (acc, [constant, featureFlagName]) => ({
          ...acc,
          [`FeatureFlags.${constant}`]: {
            enabled:
              cookies.get(createCookieName(featureFlagName)) === 'true'
                ? '✅'
                : '🚫',
          },
        }),
        {},
      ),
    );
  };
}

const ContextProvider = ({ providers, children }) => {
  return providers.reverse().reduce((AccumulatedProviders, current) => {
    const [CurrentProvider, currentProps] = Array.isArray(current)
      ? current
      : [current, {}];
    // eslint-disable-next-line react/prop-types
    return (
      <CurrentProvider {...currentProps}>
        {AccumulatedProviders}
      </CurrentProvider>
    );
  }, children);
};

ContextProvider.propTypes = {
  providers: PropTypes.array,
  children: PropTypes.node,
};

config.autoAddCss = false;

const Hotjar = () => {
  return (
    <Script id="hotjar">{`(function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:181435,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}</Script>
  );
};

const Head = () => {
  const { t } = useTranslation();

  return (
    <NextHead>
      <meta
        key="viewport"
        name="viewport"
        content="initial-scale=1.0, width=device-width"
      />
      <title key="title">UiTdatabank</title>
      <meta name="description" content={t('description')} />
    </NextHead>
  );
};

const queryClient = new QueryClient();

const isServer = () => typeof window === 'undefined';

const App = ({ Component, pageProps, children }) => {
  return (
    <>
      <Head />
      <Hotjar />
      <ContextProvider
        providers={[
          UserContext,
          [I18nextProvider, { i18n }],
          ThemeProvider,
          [
            CookiesProvider,
            {
              cookies: isServer()
                ? new Cookies(pageProps.cookies ?? '')
                : undefined,
            },
          ],
          [QueryClientProvider, { client: queryClient }],
          [Hydrate, { state: pageProps?.dehydratedState ?? {} }],
          AnnouncementModalProvider,
        ]}
      >
        <GlobalStyle />
        <ReactQueryDevtools initialIsOpen={false} />
        <Script id="uitid-widget-config" type="application/json">
          {JSON.stringify(widgetConfig)}
        </Script>
        <Script
          src="/js/uitid-widget/index-1a861695.js"
          type="module"
          defer
        ></Script>
        <div id="uitid-widget"></div>
        <Layout>
          {children ? (
            cloneElement(children, { ...children.props, ...pageProps })
          ) : (
            <Component {...pageProps} />
          )}
        </Layout>
      </ContextProvider>
    </>
  );
};

App.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  pageProps: PropTypes.object,
  children: PropTypes.node,
};

export default App;
