// Set all blacklisted headers as lowercase
const BLACKLISTED = [
  "user-agent", // Prerender sets her own user agent, which we dont want to override
  "host", // This is set to the host of prerender, so its wrong to forward
  "accept", // Let prerender accept everything and handle it
  "accept-encoding", // We dont want to forward deflate or gzip since prerender will break on those
  "connection", // No sudden keepalive stuff
  "accept-charset", // Prerender handles this
  "content-length" // Since we are rewriting lots of the request, we let prerender recalculate this
];

module.exports = {
  // Since prerender does not forward headers, this causes problems for some crawlers looking for
  // e.g. localized content. This plugin ensures the headers sent to prerender are also set in
  // the Chrome instance. Some headers may be blacklisted and will not be forwarded.
  tabCreated(req, _res, next) {
    const customHeaders = Object.entries(req.headers)
      .map(header => {
        const headerKey = header[0];
        const newHeader = {};
        // If blocked, set a empty value
        newHeader[headerKey] = BLACKLISTED.includes(headerKey) ? "" : header[1];
        return newHeader;
      })
      .filter(header => {
        var hasValue = false;
        for (var prop in header) {
          hasValue = !!header[prop];
        }
        return hasValue;
      })
      .reduce((a, b) => Object.assign(a, b), {});

    const headersObject = {
      headers: {
        ...customHeaders,
        "X-Prerender": "1"
      }
    };
    req.prerender.tab.Network.setExtraHTTPHeaders(headersObject);
    next();
  }
};
