import fs from './node_fs.mjs'
import { serve } from "https://deno.land/std@0.50.0/http/server.ts"
import util from './util.mjs'
import { config } from "https://deno.land/x/dotenv/mod.ts"
//import "https://deno.land/x/dotenv/load.ts"
// console.log(config)
// return

const PORT = parseInt(Deno.env.get('PORT')) || 8006

const getIP = function (req) {
  if (req.headers.get('x-forwarded-for')) {
    return req.headers.get('x-forwarded-for')
  }
  return req.conn.remoteAddr.hostname
  /*
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress
  }
  if (req.connection.socket && req.connection.socket.remoteAddress) {
    return req.connection.socket.remoteAddress
  }
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress
  }
  return '0.0.0.0'
  */
}
const encodeIP = function (ip) {
  return ip.replace(/\.|:/g, '_')
}
const getEncodedIP = function (req) {
  return encodeIP(getIP(req))
}
const log = function (req, name, json) {
  json.ip = getEncodedIP(req)
  fs.appendFileSync('log/' + util.getYMD() + '-' + name + '.log', JSON.stringify(json))
}

const fnid = 'data/id.txt'
const getLastID = function () {
  try {
    return parseInt(fs.readFileSync(fnid, 'utf-8'))
  } catch (e) {
  }
  return 1
}
const getID = function () {
  let id = getLastID()
  id++
  fs.writeFileSync(fnid, id.toString(), 'utf-8')
  return id
}
const getPassCode = function (id) {
  const fix0 = function (n, m) {
    const s = '00000000000' + n
    return s.substring(s.length - m)
  }
  const len = 6
  const n = []
  for (let i = 0; i < len; i++) {
    n.push(fix0(util.rnd(10000), 4))
  }
  id = parseInt(id)
  for (;;) {
    n.push(fix0(id % 10000, 4))
    id = Math.floor(id / 10000)
    if (!id) { break }
  }
  return n.join('-')
}
const decodeID = function (pass) {
  let id = 0
  const n = pass.split('-')
  let m = 1
  for (let i = 6; i < n.length; i++) {
    id = parseInt(n[i]) * m
    m *= 10000
  }
  return id
}

const getList = function () {
  const list = fs.readdirSync('data')
  const res = []
  for (const f of list) {
    if (!f.endsWith('.json')) { continue }
    const d = JSON.parse(fs.readFileSync('data/' + f, 'utf-8'))
    const id = f.substring(0, f.length - 5)
    const name = d['施設名'] || d['店舗名'] || d['集約名']
    res.push({ id: id, type: d.type, name: name, lastUpdate: d.lastUpdate })
  }
  // const key = d => new Date(d.lasatUpdate).getTime()
  const key = d => -parseInt(d.id)
  res.sort((a, b) => key(a) - key(b))
  return res
}

const getDataJSON = function (id) {
  try {
    const json = JSON.parse(fs.readFileSync('data/' + id + '.json', 'utf-8'))
    if (!json.id) { json.id = id }
    return json
  } catch (e) {
  }
  return null
}
const updateDataJSON = function (json) {
  if (!json.id) { return false }
  fs.writeFileSync('data/' + json.id + '.json', JSON.stringify(json), 'utf-8')
}

const handleGet = (req, res) => {
  let url = req.url
  // console.log(req.query.data)
  if (req.query.id) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Content-Type', 'application/json; charset=utf-8')
    const id = parseInt(req.query.id)
    try {
      if (id > 0) {
        const d = getDataJSON(id)
        res.send(JSON.stringify(d))
      } else {
        const list = getList()
        res.send(JSON.stringify(list))
      }
      return
    } catch (e) {
    }
    res.send(JSON.stringify({ err: 'not found' }))
    return
  }
  const d = req.query.data
  if (d) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Content-Type', 'application/json; charset=utf-8')

    const data = JSON.parse(d)
    data.lastUpdate = util.formatYMDHMS()
    const pass = data.パスコード
    delete data.パスコード
    // console.log(data, pass)
    if (pass) {
      const id = decodeID(pass)
      try {
        const chk = fs.readFileSync('data/' + id + '-pass.txt', 'utf-8')
        // console.log(chk)
        if (chk === pass) {
          fs.writeFileSync('data/' + id + '.json', JSON.stringify(data))
          log(req, 'update', data)
          res.send(JSON.stringify({ res: 'ok', id: id, lastUpdate: data.lastUpdate }))
          return
        }
      } catch (e) {
      }
    }

    // console.log(req)
    // console.log(req.body)
    const id = getID()
    data.id = id
    const newpass = getPassCode(id)
    fs.writeFileSync('data/' + id + '-pass.txt', newpass)
    fs.writeFileSync('data/' + id + '.json', JSON.stringify(data))
    log(req, 'regist', data)

    res.send(JSON.stringify({ res: 'ok', id: id, pass: newpass, lastUpdate: data.lastUpdate }))
    return
  }
  const nq = url.indexOf('?')
  if (nq >= 0) { url = url.substring(0, nq) }

  // id毎のページ
  const idx = parseInt(url.substring(1))
  if (idx > 0) {
    let n = url.lastIndexOf('.')
    const ext = n < 0 ? 'html' : url.substring(n + 1)
    // console.log(idx, url, ext)
    n = n < 0 ? n.length : n
    const ids = url.substring(1, n).split(',')

    if (ext === 'html') {
      const data = []
      for (const id of ids) {
        try {
          const d = getDataJSON(id)
          data.push(d)
        } catch (e) {
        }
      }

      res.header('Content-Type', 'text/html; charset=utf-8')
      if (data.length === 0) {
        res.send('data not found')
        return
      }
      const title = data.map(d => d['施設名'] || d['店舗名'] || d['集約名'] || '').join('、')
      const ids2 = data.map(d => d.id).join(',')
      const ss = []
      for (const d of data) {
        ss.push('<table>')
        for (const item in d) {
          let val = d[item]
          if (typeof val === 'string' && (val.startsWith('https://') || val.startsWith('https://'))) {
            val = `<a href='${val}'>${val}</a>`
          }
          ss.push(`<tr><th>${item}</th><td>${val}</td></tr>`)
        }
        ss.push('</table>')
      }
      const sdata = ss.join('\n')
      // console.log(data)
      let template = fs.readFileSync('static/view_template.html', 'utf-8')
      template = template.replace(/\${title}/g, title)
      template = template.replace(/\${id}/g, ids2)
      template = template.replace(/\${data}/g, sdata)
      res.send(template)
      return
    }

    const dataids = []
    const data = []
    const gatherData = function (ids) {
      for (const id of ids) {
        if (dataids.indexOf(id) >= 0) { continue }
        try {
          dataids.push(id)
          const d = getDataJSON(id)
          if (d.type !== 'container') {
            data.push(d)
          } else {
            const ids2 = d.IDs.split(',').map(d => d.trim())
            gatherData(ids2)
          }
        } catch (e) {
        }
      }
    }
    gatherData(ids)

    if (data.length === 0) {
      data.push({ err: 'not found' })
    }
    if (ext === 'json') {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Content-Type', 'application/json; charset=utf-8')
      if (data.length === 1) {
        res.send(JSON.stringify(data[0]))
      } else {
        res.send(JSON.stringify(data))
      }
    } else if (ext === 'csv') {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Content-Type', 'text/csv; charset=utf-8')
      res.send(util.addBOM(util.encodeCSV(util.json2csv(data))))
    } else {
      res.send('data not found')
    }
    return
  }

  if (url === '/' || url.indexOf('..') >= 0) {
    url = '/index.html'
  }
  let ctype = 'text/plain'
  if (url.endsWith('.html')) {
    ctype = 'text/html; charset=utf-8'
  } else if (url.endsWith('.js')) {
    ctype = 'application/javascript'
  } else if (url.endsWith('.mjs')) {
    ctype = 'application/javascript'
  } else if (url.endsWith('.css')) {
    ctype = 'text/css'
  }
  let data = null
  try {
    data = fs.readFileSync('static' + url)
  } catch (e) {
  }
  res.header('Content-Type', ctype)
  res.send(data)
}

const parseQuery = function (url) {
  const n = url.indexOf('?')
  if (n < 0) { return {} }
  const ss = url.substring(n + 1).split('&')
  const res = {}
  for (const s of ss) {
    const n = s.indexOf('=')
    if (n < 0) {
      res[s] = ''
    } else {
      res[s.substring(0, n)] = decodeURIComponent(s.substring(n + 1))
    }
  }
  return res
}

try {
  fs.mkdirSync('data')
} catch (e) {
}
try {
  fs.mkdirSync('log')
} catch (e) {
}

console.log('to access the top')
console.log(`http://localhost:${PORT}/`)
console.log()
console.log('edit .env if you want to change')
console.log()
console.log('https://github.com/code4fukui/push/')

const server = serve({ port: PORT })
for await (const req of server) {
  if (req.url == '/favicon.ico') {
    req.respond({ body: '' })
    continue
  }

  const res = {}
  const h = new Headers()
  res.header = (name, value) => h.set(name, value)
  res.send = (body) => res.body = body
  req.query = parseQuery(req.url)

  handleGet(req, res)
  req.respond({ body: res.body, headers: h })
}


  // data normalize
  /*
  const last = getLastID()
  for (let i = 1; i <= last; i++) {
    const d = getDataJSON(i)
    if (!d) { continue }
    d.臨時開館日 = d.臨時営業日
    delete d.臨時営業日
    console.log(i, d)
    updateDataJSON(d)
  }
  */
