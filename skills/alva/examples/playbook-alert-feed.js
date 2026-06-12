const { Feed, feedPath, makeDoc, str } = require("@alva/feed");

const feed = new Feed({ path: feedPath("playbook-alert-example") });

feed.def("notify", {
  message: makeDoc("Playbook Alert", "Minimal push content for a playbook-facing alert", [
    str("title"),
    str("body"),
  ]),
});

(async () => {
  const now = Date.now();

  await feed.run(async (ctx) => {
    await ctx.self.ts("notify", "message").append([
      {
        date: now,
        title: "Playbook Alert",
        body: "**Playbook alert:** the watch condition fired. Open the playbook to review the latest feed-backed context.",
      },
    ]);
  });
})();
