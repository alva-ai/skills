const { Feed, feedPath, makeDoc, str } = require("@alva/feed");
const env = require("env");

const FEED_NAME = "kol-market-chat";
const OWNER_ID = "1961440700109172736";
const OWNER_DISPLAY_NAME = "Algostonk";

const CHANNELS = [
  "market-wire",
  "ai-infra",
  "crypto",
  "macro",
  "semis",
];

const feed = new Feed({ path: feedPath(FEED_NAME) });

feed.def("chat", {
  messages: makeDoc("Channel Messages", "Viewer and agent messages posted into predefined channels", [
    str("channel"),
    str("author_type"),
    str("author_name"),
    str("headline"),
    str("headline_i18n_json"),
    str("body"),
    str("body_i18n_json"),
    str("source_url"),
    str("source_handles_json"),
    str("tickers_json"),
    str("meta_json"),
  ]),
});

function asText(value) {
  return String(value == null ? "" : value).trim();
}

function callerLabel(caller) {
  const username = asText(env.callerUsername || env.caller_username);
  if (caller === OWNER_ID) return OWNER_DISPLAY_NAME;
  if (username) return username.replace(/^@+/, "").slice(0, 32);
  return "viewer-" + caller.slice(-6);
}

(async () => {
  const args = env.args || {};
  const caller = asText(env.callerUserId || env.caller_user_id || env.userId);
  const signedIn = !!caller;

  if (args.check) {
    return { signedIn, channels: CHANNELS };
  }

  if (!signedIn) throw new Error("Sign in to post.");

  const channel = asText(args.channel).replace(/^#/, "").toLowerCase();
  if (!CHANNELS.includes(channel)) throw new Error("Unknown channel: " + channel);

  const text = asText(args.text || args.body);
  if (!text) throw new Error("Message text is required.");
  if (text.length > 600) throw new Error("Message too long (" + text.length + " chars); keep it under 600.");

  const now = Date.now();
  const rec = {
    date: now,
    channel,
    author_type: caller === OWNER_ID ? "owner" : "viewer",
    author_name: callerLabel(caller),
    headline: "",
    headline_i18n_json: "{}",
    body: text,
    body_i18n_json: "{}",
    source_url: "",
    source_handles_json: "[]",
    tickers_json: "[]",
    meta_json: JSON.stringify({ posted_via: "udf", public_chat: true }),
  };

  await feed.run(async (ctx) => {
    await ctx.self.ts("chat", "messages").append([rec]);
  });

  return { ok: true, posted: rec };
})();
