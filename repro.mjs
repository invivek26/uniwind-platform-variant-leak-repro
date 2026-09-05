// Compiles global.css through uniwind's own native CSS compiler for ios and android
// and prints which platform-variant classes end up in each bundle's stylesheet.
// Expected: the ios bundle holds only ios:* and native:*; android only android:* and native:*.
import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

const dist = path.resolve("node_modules/uniwind/dist/metro")
const probe = path.join(dist, "_probe.mjs")
fs.writeFileSync(
  probe,
  fs
    .readFileSync(path.join(dist, "transformer.mjs"), "utf-8")
    .replace('path.resolve(__dirname, "../../uniwind.css")', 'path.resolve("node_modules/uniwind/uniwind.css")') +
    `
export const run = async (platform) => {
  const cfg = UniwindBundlerConfig.fromMetroConfig({ cssEntryFile: "./global.css" }, platform)
  const code = await compileCSS(cfg)
  return [...code.matchAll(/"((?:ios|android|native):[^"]+)": \\[\\{[^]*?"native": (true|false)/g)].map(m => \`\${m[1]} (platform-tagged=\${m[2]})\`)
}
`,
)
const { run } = await import(pathToFileURL(probe).href)
for (const platform of ["ios", "android"]) {
  console.log(`== ${platform} bundle stylesheet contains:`)
  for (const line of await run(platform)) console.log("  " + line)
}
fs.rmSync(probe)
