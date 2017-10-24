import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import * as getters from './getters'
import board from './modules/board'
import seeker from './modules/seeker'
import ads from './modules/ads'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  actions,
  getters,
  modules: {
    seeker,
    board,
    ads
  },
  strict: debug
  // plugins: debug ? [createLogger()] : []
})
