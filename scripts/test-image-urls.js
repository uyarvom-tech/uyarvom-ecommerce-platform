#!/usr/bin/env node
// Quick HTTP check on a sample of DB image URLs
const https = require('https')

const urls = [
  'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev/products/UY-KW-CI-TAW-10-PS.jpeg',
  'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev/products/UY-KW-CI-DTAW-12-PS.jpeg',
  'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev/uploads/Cookware.png',
  'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev/uploads/Serveware.png',
  'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev/uploads/Dinnerware.png',
]

function check(url) {
  return new Promise(resolve => {
    https.get(url, res => {
      resolve({ url: url.split('/').slice(-2).join('/'), status: res.statusCode })
      res.resume()
    }).on('error', e => resolve({ url: url.split('/').slice(-2).join('/'), status: 'ERROR: ' + e.message }))
  })
}

Promise.all(urls.map(check)).then(results => {
  results.forEach(r => console.log(r.status === 200 ? '✅' : '❌', r.status, r.url))
})
