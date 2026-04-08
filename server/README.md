# Server

Cloudflare Workers + D1 service for the mini-program content API.

## Local commands

- `npm run test:server`
- `npm run server:dev`
- `npm run server:d1:migrate:local`

## Before remote deploy

1. Run `wrangler d1 create swiftie-mini`
2. Copy the returned database ID into [server/wrangler.jsonc](/Users/bytedance/projects/swiftie-mini/server/wrangler.jsonc)
3. Run `npm run server:d1:migrate:remote`
