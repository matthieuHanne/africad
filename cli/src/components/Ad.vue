<template>
  <q-card inline style="width: 300px">
    <q-card-media>
      <img src="https://photo2.lacentrale.fr/photo/lc/E1/01/07/E101077991_6.jpg">
    </q-card-media>
    <q-card-title>
      {{ ad.title }}
      <div slot="subtitle">
        Username
      </div>
      <div slot="right" class="row items-center">
        <q-icon name="place" /> Ville
      </div>
    </q-card-title>
    <q-card-separator />
    <q-card-main class="pull-right">
      <q-chip> {{ ad.year }} </q-chip>
      <q-chip> {{ ad.km }} km </q-chip>
      <q-chip> {{ ad.price | currency }} </q-chip>

    </q-card-main>
    <q-card-actions class="pull-right">
      <div>
      </div>
    </q-card-actions>
  </q-card>
</template>

<script>
import {
  QCard,
  QList,
  QItemSide,
  QItemMain,
  QItemTile
} from 'quasar'

export default {
  components: {
    QCard,
    QList,
    QItemSide,
    QItemMain,
    QItemTile
  },
  data () {
    return {}
  },
  props: ['ad']
}
</script>

<style>
</style>
