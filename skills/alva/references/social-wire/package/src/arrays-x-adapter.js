"use strict";

function query(params) {
  const parts = [];
  Object.keys(params || {}).forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => parts.push(key + "=" + encodeURIComponent(String(item))));
    } else {
      parts.push(key + "=" + encodeURIComponent(String(value)));
    }
  });
  return parts.join("&");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value == null ? "" : value).trim();
}

function createArraysXByHandleAdapter(options) {
  const opts = options || {};
  const baseUrl = opts.baseUrl || "https://data-tools.prd.space.id";
  const endpoint = baseUrl.replace(/\/+$/, "") + "/api/v1/social-feeds/x/by-handle";
  const fetchJson = opts.fetchJson;
  const loadSecret = opts.loadSecret;
  const tokenName = opts.tokenName || "ARRAYS_JWT";
  const defaultLimit = Number(opts.limit || 6);
  const postsPerHandle = Number(opts.postsPerHandle || 4);
  const contentType = opts.contentType || "original";

  if (!fetchJson) {
    throw new Error("createArraysXByHandleAdapter requires fetchJson(url, headers)");
  }

  return {
    name: "arrays-x-by-handle",

    async fetch(subjects, runOptions) {
      const run = runOptions || {};
      const fetchedAt = run.fetched_at || new Date().toISOString();
      const jwt = opts.jwt || (loadSecret ? loadSecret(tokenName) : "");
      if (!jwt) throw new Error(tokenName + " secret missing");

      const since = Number(run.since || Math.floor(Date.now() / 1000) - Number(run.lookbackSeconds || 36 * 60 * 60));
      const headers = { Authorization: "Bearer " + jwt };
      const out = [];
      let attempted = 0;
      let failures = 0;

      for (const subject of asArray(subjects)) {
        const handle = asText(subject.handle || subject.twitter_handle || subject.username).replace(/^@+/, "");
        if (!handle) continue;
        attempted += 1;
        try {
          const params = {
            twitter_handle: handle,
            since,
            content_type: contentType,
            limit: Number(run.limit || defaultLimit),
          };
          const url = endpoint + "?" + query(params);
          const body = await fetchJson(url, headers);
          const rows = asArray(body && body.data).slice(0, Number(run.postsPerHandle || postsPerHandle));
          rows.forEach((raw) => {
            out.push({
              raw,
              source: {
                platform: "x",
                handle,
                display_name: subject.display_name || "",
                fetched_at: fetchedAt,
                source_endpoint: endpoint,
                source_query: params,
                source_as_of: fetchedAt,
                author_context: subject.author_context || subject.kol || {},
                domain_context: subject.domain_context || {},
              },
            });
          });
        } catch (err) {
          failures += 1;
          if (run.logger && run.logger.log) {
            run.logger.log("arrays-x-by-handle skipped @" + handle + ": " + (err && err.message ? err.message : err));
          }
        }
      }

      if (attempted > 0 && failures >= attempted) {
        throw new Error("all arrays-x-by-handle lookups failed");
      }
      return out;
    },
  };
}

module.exports = {
  createArraysXByHandleAdapter,
};
