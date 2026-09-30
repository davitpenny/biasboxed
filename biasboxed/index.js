require('dotenv').config();
const { Client, GatewayIntentBits, Partials, ChannelType } = require('discord.js');
const fetch = require('node-fetch');

// ---- Config ----
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const TARGET_WEBHOOK_URL = process.env.TARGET_WEBHOOK_URL;
const ALLOWED_DISCORD_USER_ID = process.env.ALLOWED_DISCORD_USER_ID || null;
const WEBHOOK_USERNAME = process.env.WEBHOOK_USERNAME || undefined;
const WEBHOOK_AVATAR_URL = process.env.WEBHOOK_AVATAR_URL || undefined;
const DEFAULT_SESSION_LABEL = process.env.DEFAULT_SESSION_LABEL || 'NY Open';

// --- Diagnostic logging (safe: never prints actual secret values) ---
console.log('--- Startup diagnostic ---');
console.log('DISCORD_BOT_TOKEN present:', !!DISCORD_BOT_TOKEN, '| length:', DISCORD_BOT_TOKEN ? DISCORD_BOT_TOKEN.length : 0);
console.log('TARGET_WEBHOOK_URL present:', !!TARGET_WEBHOOK_URL, '| length:', TARGET_WEBHOOK_URL ? TARGET_WEBHOOK_URL.length : 0);
console.log('ALLOWED_DISCORD_USER_ID present:', !!ALLOWED_DISCORD_USER_ID);
console.log('--- End diagnostic ---');

if (!DISCORD_BOT_TOKEN || !TARGET_WEBHOOK_URL) {
  console.error('Missing DISCORD_BOT_TOKEN or TARGET_WEBHOOK_URL in environment variables');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}. Waiting for bias DMs...`);
});

// Bias word -> circle emoji + embed color (decimal)
const BIAS_STYLES = {
  BULLISH: { emoji: '🟢', color: 5763719 },   // green
  BEARISH: { emoji: '🔴', color: 15548997 },  // red
  NEUTRAL: { emoji: '⚪', color: 16777215 },  // white
};

function todayLabel() {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

// First line = bias word (optionally "BIAS | Session Label").
// Everything after that = analysis text.
function buildBiasPayload(content) {
  const lines = content.split('\n');
  const firstLine = lines[0].trim();
  const [biasRaw, sessionRaw] = firstLine.split('|').map((s) => s && s.trim());
  const biasKey = biasRaw ? biasRaw.toUpperCase() : '';
  const style = BIAS_STYLES[biasKey];
  if (!style) return null;

  const sessionLabel = sessionRaw || DEFAULT_SESSION_LABEL;
  const analysis = lines.slice(1).join('\n').trim() || '*(no analysis text provided)*';

  return {
    username: WEBHOOK_USERNAME,
    avatar_url: WEBHOOK_AVATAR_URL,
    content: '@everyone',
    allowed_mentions: { parse: ['everyone'] },
    embeds: [
      {
        title: `${sessionLabel} | ${todayLabel()}`,
        description: `**BIAS:** ${style.emoji} ${biasKey}\n\n**Analysis**\n${analysis}`,
        color: style.color,
      },
    ],
  };
}

client.on('messageCreate', async (message) => {
  try {
    if (message.channel.type !== ChannelType.DM) return;
    if (message.author.bot) return;
    if (ALLOWED_DISCORD_USER_ID && message.author.id !== ALLOWED_DISCORD_USER_ID) return;

    const content = message.content || '';
    if (!content) return;

    const payload = buildBiasPayload(content);

    if (!payload) {
      // Not a recognized bias word on line 1 — tell you instead of silently
      // ignoring, since this bot ONLY does bias posts.
      await message.reply(
        'First line must start with BULLISH, BEARISH, or NEUTRAL (optionally "BULLISH | London Open"), followed by your analysis on the next line(s).'
      );
      return;
    }

    await fetch(TARGET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    await message.react('✅').catch(() => {});
  } catch (err) {
    console.error('Error posting bias:', err);
  }
});

client.login(DISCORD_BOT_TOKEN);
