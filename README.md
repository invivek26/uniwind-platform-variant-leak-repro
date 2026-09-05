# uniwind platform-variant leak with Tailwind 4.3.3

`ios:` / `android:` / `native:` classes leak into the other platform's bundle: only the **first** class inside each hoisted `@media ios { … }` block keeps its platform tag.

```sh
bun install
node repro.mjs
```

Actual (uniwind 1.12.0 / Pro 1.7.0, `@tailwindcss/node` 4.3.3):

```
== ios bundle stylesheet contains:
  ios:w-4 (platform-tagged=true)
  ios:underline (platform-tagged=false)      <- lost its platform
  android:py-2 (platform-tagged=false)       <- android class shipped to iOS
  native:mt-1 (platform-tagged=true)
  native:mb-2 (platform-tagged=false)
== android bundle stylesheet contains:
  ios:underline (platform-tagged=false)      <- ios class shipped to Android
  android:border-b (platform-tagged=true)
  android:py-2 (platform-tagged=false)
  native:mt-1 (platform-tagged=true)
  native:mb-2 (platform-tagged=false)
```

Expected: ios bundle = `ios:w-4`, `ios:underline`, `native:mt-1`, `native:mb-2`, all tagged; android symmetric.

The class list is in `App.tsx`. `global.css` is just `@import "tailwindcss"; @import "uniwind";`.

## Control: Tailwind 4.3.2 is fine

Same uniwind 1.12.0, forcing Tailwind back to 4.3.2 via `overrides`:

```json
"overrides": { "@tailwindcss/node": "4.3.2", "@tailwindcss/oxide": "4.3.2", "tailwindcss": "4.3.2" }
```

```
== ios bundle stylesheet contains:
  ios:w-4 (platform-tagged=true)
  ios:underline (platform-tagged=true)
  native:mt-1 (platform-tagged=true)
  native:mb-2 (platform-tagged=true)
== android bundle stylesheet contains:
  android:border-b (platform-tagged=true)
  android:py-2 (platform-tagged=true)
  native:mt-1 (platform-tagged=true)
  native:mb-2 (platform-tagged=true)
```

## Why

Tailwind 4.3.3 hoists the variant: 4.3.2 emitted `.ios\:underline { @media ios { … } }` per class, 4.3.3 emits one `@media ios { .ios\:w-4 {…} .ios\:underline {…} }` block. In `processor.ts` the `rule.type === 'media'` branch pushes the media queries once and then resets `declarationConfig` after **each** child rule, so only the first child keeps `platform`; the rest compile as unconditional and pass `addMetaToStylesTemplate`'s platform filter on every bundle.

## Fix (verified against this repro)

```ts
if (rule.type === 'media') {
    const { mediaQueries } = rule.value.query
    const inherited = [...this.declarationConfig.mediaQueries, ...mediaQueries]

    rule.value.rules.forEach(rule => {
        this.declarationConfig = { ...this.getDeclarationConfig(), mediaQueries: [...inherited] }
        this.parseRuleRec(rule)
    })
    this.declarationConfig = this.getDeclarationConfig()

    return
}
```
