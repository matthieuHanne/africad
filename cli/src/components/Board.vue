<template>
  <!-- if you want automatic padding use "layout-padding" class -->
  <div class="layout-padding">
    <!-- your content -->
    <q-infinite-scroll :handler="loadMore">
      {{ads}}
      <ad v-for="ad in ads" :ad="ad"></ad>
      <q-spinner-dots slot="message" :size="40"></q-spinner-dots>
    </q-infinite-scroll>
  </div>
</template>

<script>
import Ad from './Ad.vue'
import { mapState, mapActions } from 'vuex'

export default {
  components: { Ad },
  data () {
    return {}
  },
  computed: mapState({
    ads: state => state.ads.ads
  }),
  methods: {
    ...mapActions([
      'loadMore',
      'getAds'
    ]),
    loadMore: function (index, done) {
      // index - called for nth time
      // done - Function to call when you made all necessary updates.
      //        DO NOT forget to call it otherwise your loading message
      //        will continue to be displayed
      // make some Ajax call then call done()
    }
  },
  created () {
    // this.$store.dispatch('getAds')
    this.getAds()
  }
}
</script>

<style>
</style>
