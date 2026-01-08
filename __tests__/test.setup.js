import nock from 'nock'
import axios from 'axios'
import debug from 'debug'
import { beforeAll, afterEach } from '@jest/globals'

debug.enable('pageLoader:*')
const log = debug('pageLoader:test')

nock.emitter.on('no match', (req) => {
  log(`[NOCK] No match | Method: ${req.method} | URL: ${req.href || req.path}`)
})

afterEach(() => {
  if (!nock.isDone()) {
    log(`[NOCK] Pending mocks: ${nock.pendingMocks()}`)
  } else {
    log(`[NOCK] Done`)
  }
})

beforeAll(() => {
  axios.interceptors.request.use((req) => {
    log(`[AXIOS] Request | Method: ${req.method?.toUpperCase()} | URL: ${req.url}`)

    return req
  })

  axios.interceptors.response.use(
    (res) => {
      log(`[AXIOS] Response | URL: ${res.config.url} | Status: ${res.status}`)

      return res
    },
    (err) => {
      if (err.config) {
        log(`[AXIOS] Error | URL: ${err.config.url} | MSG: ${err.message}`)
      }

      return Promise.reject(err)
    }
  )
})
