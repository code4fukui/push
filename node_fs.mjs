const fs = {}

fs.readFileSync = function (fn) {
  const data = Deno.readFileSync(fn)
  const decoder = new TextDecoder('utf-8')
  const s = decoder.decode(data)
  return s
}
fs.writeFileSync = function (fn, s) {
  const d = new TextEncoder('utf-8').encode(s)
  Deno.writeFileSync(fn, d)
}
fs.appendFileSync = function (fn, s) {
  const d = new TextEncoder('utf-8').encode(s)
  Deno.writeFileSync(fn, d, { append: true })
}
fs.readdirSync = function (dirn) {
  return Deno.readDirSync(dirn)
}
fs.mkdirSync = function (dirn) {
  return Deno.mkdirSync(dirn)
}

export default fs
