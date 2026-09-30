# Bias DM Bot

A dedicated bot: DM it your daily bias, it posts a color-coded boxed embed to your bias channel. Separate from your general DM relay bot, so that one stays free for anything else.

## How to use it (once deployed)
DM the bot, first line is the bias word, rest is your analysis:

```
BULLISH
Hey everyone, I expect bullish price action today. I think market open will have an initial bearish move before making majority of the move in the bullish direction. Will keep everyone posted
```

- `BULLISH` → green box
- `BEARISH` → red box
- `NEUTRAL` → white box

Date and session label ("NY Open | September 30, 2026") are filled in automatically. To use a different session, add it after a pipe on line 1:
```
BULLISH | London Open
...
```

If the first line isn't one of those three words, the bot replies telling you the format instead of posting anything — this bot only does bias posts.

## Setup

### 1. Create the bot
1. discord.com/developers/applications → New Application
2. Bot tab → enable **Message Content Intent** → Reset Token → copy it → `DISCORD_BOT_TOKEN`

### 2. Invite it to a server you're in
OAuth2 → URL Generator → scope `bot` → no extra permissions needed → open the generated link → add to any server you're in (needed so it can DM you).

### 3. Create the webhook for your bias channel
Edit Channel → Integrations → Webhooks → New Webhook → copy the URL → `TARGET_WEBHOOK_URL`.

### 4. Get your Discord user ID
Settings → Advanced → enable Developer Mode → right-click your name → Copy User ID → `ALLOWED_DISCORD_USER_ID`.

### 5. Deploy (same as your other bots — e.g. Railway)
Push this folder to its own GitHub repo, new Railway service from that repo, set these variables in Railway's Variables tab:
- `DISCORD_BOT_TOKEN`
- `TARGET_WEBHOOK_URL`
- `ALLOWED_DISCORD_USER_ID`
- optional: `WEBHOOK_USERNAME`, `WEBHOOK_AVATAR_URL`, `DEFAULT_SESSION_LABEL` (defaults to "NY Open")

Check the logs for `Logged in as ... Waiting for bias DMs...`, then DM it a test bias.
