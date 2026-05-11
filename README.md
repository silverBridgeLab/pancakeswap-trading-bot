# Pancake Copy Companion #1

**Ride the waves DeFi leaders make — without staring at charts all day.**

This project is a calm, TypeScript-first companion for people who want to **learn** how automated “copy trading” ideas map onto [PancakeSwap](https://pancakeswap.finance/)-style routers on **BNB Smart Chain**. It watches recent blocks, spots simple router swaps from addresses you choose, and (by default) **only logs** what a follower wallet *would* do next.

> **Heads up:** This is an education and experimentation repo, not financial advice. On-chain activity involves serious risk (impermanent loss, MEV, rugs, failed txs, tax). Run `dry-run` until you fully understand every line you would change for live trading.

## Why people open this repo

- You are curious how traders **encode** swaps on-chain and how a bot could **react** in near real time.
- You want a **readable** codebase to extend (liquidity checks, custom filters, Telegram pings, your own signing flow).
- You prefer **TypeScript** + strict types so refactors feel safe.

## What you get out of the box

- **Leader detection** on the canonical PancakeSwap V2 router (`0x10ED…4024E`) by decoding common `swapExact*` calls.
- **Proportional sizing** so you can mirror a fraction of a leader’s intent before you wire real execution.
- **`ts-logger-pack`**-friendly logging that stays pleasant in both quiet and verbose modes.
- **`dry-run` by default** so your keys never touch a hot path by accident.

## Quick start (five minutes)

1. **Install** Node.js 20+.
2. **Clone** and install deps:

   ```bash
   cd pancakeswap-copy-trading_bot_1
   npm install
   ```

3. **Copy** the sample env and add a real HTTPS or WSS RPC plus leader addresses you study (not endorse!) for learning:

   ```bash
   cp .env.example .env
   ```

4. **Run** in safe mode:

   ```bash
   npm run dev
   ```

5. When you are ready to compile:

   ```bash
   npm run build && npm start
   ```

## Configuration highlights

| Variable | What it feels like |
| --- | --- |
| `LEADER_ADDRESSES` | The on-chain personalities you are learning from this week. |
| `SIZE_NUMERATOR_BP` / `SIZE_DENOMINATOR_BP` | Your “volume knob” for how bold each mirrored intent is. |
| `EXECUTION_MODE` | `dry-run` whispers the plan; `live-stub` reminds you where to solder your signer. |
| `LOOKBACK_BLOCKS` | How much history we hydrate after a restart so you do not miss late-night moves. |

## Testing

```bash
npm test
```

## Roadmap ideas (make it yours)

- Slippage curves tied to pool depth or volatility oracles.
- Cool-down windows so you are not spammed during arb storms.
- Private RPC + flashbots-style submission research (advanced).

## License

MIT — build kindly, disclose risks, and treat other people’s capital with care.
