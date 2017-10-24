/**
 * Mocking client-server processing
 */
import axios from 'axios'
import normalize from 'json-api-normalizer'

const API_ROOT = 'http://localhost:5000'

export default {
  getAds (cb) {
    axios.get(API_ROOT + '/ads')
      .then(resp => {
        const data = normalize(resp.data)
        cb(data.ad)
      })
  },

  buyProducts (ads, cb, errorCb) {
    setTimeout(() => {
      // simulate random checkout failure.
      (Math.random() > 0.5 || navigator.userAgent.indexOf('PhantomJS') > -1)
        ? cb()
        : errorCb()
    }, 100)
  }
}
