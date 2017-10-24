import Vapi from 'vuex-rest-api'
import normalize from 'json-api-normalizer'
import build from 'redux-object'

const ads = new Vapi({
  baseURL: 'http://localhost:5000',
  state: {
    ads: []
  }
})
  .get({
    action: 'getAds',
    property: 'ads',
    path: '/ads',
    onSuccess: (state, payload) => {
      const data = build(normalize(payload.data), 'ad')
      console.log(data)
      console.log('------')
      debugger
      console.log(build(payload, 'data'))
      state.ads = data
    }
  })
  .getStore()

console.log(ads)

export default ads
