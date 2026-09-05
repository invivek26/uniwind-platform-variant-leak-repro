import { compile } from "@tailwindcss/node"
import path from "node:path"
import fs from "node:fs"
const css = fs.readFileSync("global.css", "utf-8")
const c = await compile(css, { base: process.cwd(), onDependency: () => {} })
const out = c.build(["ios:underline", "ios:w-4", "android:border-b", "android:py-2", "native:mt-1", "native:mb-2"])
fs.writeFileSync("out.css", out)
console.log(out.split("\n").filter(l => /@media|\\:/.test(l)).join("\n"))
