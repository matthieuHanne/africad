import backend from '../../api/backend'
import * as types from '../mutation-types'

// initial state
const state = {
  all: [],
  filtered: []
}

// getters
const getters = {
  allAds: state => state.all,
  filteredAds: (state, getters, rootState) => {
  }
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
