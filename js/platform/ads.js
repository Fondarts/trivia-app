// Wrapper simple sobre el plugin de Capacitor (Plugins.Ads)
(function () {
  const getAds = () =>
    (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Ads) || null;

  window.ads = {
    mountBannerOnHome() {
      const Ads = getAds();
      if (Ads) Ads.enableBanner({ show: true });
    },
    unmountBanner() {
      const Ads = getAds();
      if (Ads) Ads.enableBanner({ show: false });
    },
    maybeShowInterstitial(tag) {
      const Ads = getAds();
      if (Ads && tag === 'results') Ads.showInterstitial({});
    }
  };
})();
