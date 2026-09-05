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
