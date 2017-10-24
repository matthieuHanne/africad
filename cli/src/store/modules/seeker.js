import backend from '../../api/backend'
import * as types from '../mutation-types'

// initial state
const state = {
  types: [{label: 'Google', value: 'goog'}, {label: 'Facebook', value: 'fb'}],
  conditions: [{label: 'Neuve', value: 'new'}, {label: 'Occasion', value: 'occasion'}]
  /*
  category': 'Cruiser',
  make': 'Indian Motorcycle',
  price': '200', // currency should compute from exporter.basedCurrency and exposed convter to currenUser based on his basedCurrency
  location': 'Paris', // currency should compute from exporter.location
  year': '2017',
  mile': '55',

*/
}

// getters
const getters = {
  types: state => state.types
}

// actions
const actions = {
  getAllAds ({ commit }) {
    backend.getAds(ads => {
      commit(types.RECEIVE_ADS, { ads })
    })
  }
}

// mutations
const mutations = {
  [types.RECEIVE_ADS] (state, { ads }) {
    state.all = ads
  }

  /*
  [types.ADD_TO_CART] (state, { id }) {
    state.all.find(p => p.id === id).inventory--
  }
  */
}

export default {
  state,
  getters,
  actions,
  mutations
}
