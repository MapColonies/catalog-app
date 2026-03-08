/* eslint-disable */
var body = document.querySelector('body');
var uaParserObj = new UAParser();
var FIRST_ELEM = 0;
var CHROMIUM_ENGINE = 'Blink';
var MINIMUM_SUPPORTED_BROWSER_VERSION = 84;

var userAgentRes = uaParserObj.getResult();
var browserName = userAgentRes.browser.name;
var isEngineChromium = userAgentRes.engine.name == CHROMIUM_ENGINE;
var isBrowserVersionSupported =
    Number(userAgentRes.browser.version.split('.')[FIRST_ELEM]) >= MINIMUM_SUPPORTED_BROWSER_VERSION;

var ERROR_CODES = { 
  BROWSER_NOT_SUPPORTED: 'BROWSER_NOT_SUPPORTED',
  BROWSER_VERSION_TOO_OLD: 'BROWSER_VERSION_TOO_OLD'
}

if (!isEngineChromium || !isBrowserVersionSupported) {
  var err = '';
  if (isEngineChromium) {
    err = ERROR_CODES.BROWSER_VERSION_TOO_OLD;
  } else {
    err = ERROR_CODES.BROWSER_NOT_SUPPORTED;
  }
  window.location.replace("/assets/pages/compatibilityError.html?error=" + err);
}
