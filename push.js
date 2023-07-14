import { Server } from "https://js.sabae.cc/Server.js";
import fs from './node_fs.mjs'
import util from './util.mjs'

const PORT = parseInt(Deno.env.get('PORT')) || 8006

const encodeIP = function (ip) {
  return ip.replace(/\.|:/g, '_')
}
const log = function (remoteAddr, name, json) {
  //json.ip = getEncodedIP(req)
  json.ip = encodeIP(remoteAddr);
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
    let name = d['施設名'] || d['店舗名'] || d['集約名']
    if (!name) {
      for (const n of d) {
        name = n;
        break;
      }
    }
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

const registData = (data, remoteAddr) => {
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
        log(remoteAddr, 'update', data)
        return { res: 'ok', id: id, lastUpdate: data.lastUpdate };
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
  log(remoteAddr, 'regist', data);

  return { res: 'ok', id: id, pass: newpass, lastUpdate: data.lastUpdate };
};

const getPageByID = (url) => {
  // id毎のページ
  const idx = parseInt(url.substring(1))
  if (!(idx > 0)) {
    return null;
  }
  let n = url.indexOf('.')
  const ext = n < 0 ? 'html' : url.substring(n + 1)
  // console.log(idx, url, ext)
  n = n < 0 ? n.length : n
  const ids = url.substring(1, n).split(',')

  if (ext === 'html') {
    const data = []
    for (const id of ids) {
      try {
        const d = getDataJSON(id)
        if (d) {
          data.push(d)
        }
      } catch (e) {
      }
    }

    const headers = { 'Content-Type': 'text/html; charset=utf-8' };
    if (data.length === 0) {
      return { headers, body: 'data not found' };
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
    return { headers, body: template };
  } else if (ext == "raw.json") {
    const id = ids[0];
    const d = getDataJSON(id);
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8',
    };
    return { headers, body: JSON.stringify(d) };
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
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8',
    };
    if (data.length === 1) {
      return { headers, body: JSON.stringify(data[0]) };
    } else {
      return { headers, body: JSON.stringify(data) };
    }
  } else if (ext === 'csv') {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/csv; charset=utf-8',
    };
    return { headers, body: util.addBOM(util.encodeCSV(util.json2csv(data))) }
  }
  return { headers: {}, body: 'data not found' };
};

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

class PushOpenDataServer extends Server {
  async api(path, req, remoteAddr) { // to override
    const res = registData(req, remoteAddr);
    return res;
  }
  // not found
  async handleNotFound(req) { // to override
    if (req.path == "/favicon.ico") {
      return new Response();
    }
    //console.log(req.path);
    const data = getPageByID(req.path);
    if (data) {
      return new Response(data.body, { status: 200, headers: data.headers });
    }

    const sid = req.path.substring(1);
    if (sid) {
      //res.header('Access-Control-Allow-Origin', '*')
      //res.header('Content-Type', 'application/json; charset=utf-8')
      const id = parseInt(sid);
      try {
        let json = null;
        if (id > 0) {
          json = getDataJSON(id);
        } else {
          json = getList();
        }
        return new Response(JSON.stringify(json), {
          status: 200,
          headers: new Headers({
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Accept", // must
            //"Access-Control-Allow-Methods": "PUT, DELETE, PATCH",
          })
        });
      } catch (e) {
      }
    }

    const err = new TextEncoder().encode("not found");
    return new Response(err);
  }
};
new PushOpenDataServer(PORT);

/*
  const res = {}
  const h = new Headers()
  res.header = (name, value) => h.set(name, value)
  res.send = (body) => res.body = body
  req.query = parseQuery(req.url)

  handleGet(req, res)
  req.respond({ body: res.body, headers: h })
}
*/
