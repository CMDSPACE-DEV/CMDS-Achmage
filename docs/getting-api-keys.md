# Getting API keys

CMDS Achmage calls every provider directly from your machine with a key you
supply. There is no CMDS server in the path. Keys live in the plugin's own
`data.json` under `.obsidian/plugins/cmds-achmage/` in your vault.

Subscription sign-ins (Claude Pro/Max, ChatGPT Plus/Pro, Gemini) are handled in
Plan mode and need no API key — see
[Before using Plan mode](../README.md#before-using-plan-mode).

## Where to create a key

| Provider | Console |
|---|---|
| Anthropic | https://console.anthropic.com/settings/keys |
| OpenAI | https://platform.openai.com/api-keys |
| Google Gemini | https://aistudio.google.com/apikey |
| xAI (Grok) | https://console.x.ai |
| DeepSeek | https://platform.deepseek.com/api_keys |
| Mistral | https://console.mistral.ai/api-keys |
| Perplexity | https://www.perplexity.ai/account/api/keys |
| OpenRouter | https://openrouter.ai/keys |
| Ollama | No key. Run Ollama locally and point the provider at its address. |

Every provider entry also accepts a custom base URL, so an OpenAI-compatible
gateway (LM Studio, vLLM, a corporate proxy) can reuse the OpenAI provider type
with its own address.

## Steps

1. Create the key in the provider's console above.
2. Open Settings, go to CMDS Achmage, then Providers, and add a provider.
3. Choose the provider type, paste the key, and save.
4. Go to Models and add or select a model belonging to that provider.

## Known snag: Anthropic CORS on new accounts

A brand-new personal Anthropic account can return a CORS error on the first
call. Creating an organization at
https://console.anthropic.com/settings/organization resolves it, after which the
same key works.

## Keeping keys safe

- Treat a key like a password. Anyone who can read your vault folder can read it.
- If you sync the vault, the key syncs with it unless you exclude
  `.obsidian/plugins/cmds-achmage/data.json`.
- Removing a provider in settings deletes the local copy but does not revoke the
  key. Rotate it in the provider's console if it may have leaked.
