<template>
  <q-tabs>
    <!-- Tabs - notice slot="title" -->
    <q-tab default slot="title" name="tab-1" icon="directions_car" />
    <q-tab slot="title" name="tab-2" icon="local_shipping" />
    <q-tab slot="title" name="tab-3" icon="motorcycle" />

    <!-- Targets -->
    <q-tab-pane name="tab-1">
      <q-list>
        <q-list-header>Informations principales</q-list-header>
        <!-- Multiple Selection using Toggles -->
        <q-item>
          <q-item-main>
            <q-select
              multiple
              chips
              filter
              float-label="Categories"
              v-model="multiple"
              :options="selectOptions"
              />
          </q-item-main>
        </q-item>

        <!-- Multiple Selection using Toggles -->
        <q-item>
          <q-item-main>
            <q-select
              multiple
              chips
              filter
              float-label="Marques"
              v-model="multiple"
              :options="selectOptions"
              />
          </q-item-main>
        </q-item>

        <!-- Multiple Selection using Toggles -->
        <q-item>
          <q-item-main>
            <q-select
              multiple
              chips
              filter
              float-label="Carburants"
              v-model="multiple"
              :options="selectOptions"
              />
          </q-item-main>
        </q-item>




        <!--

        <q-item tag="label">
          <q-item-side>
            <q-radio v-model="option" val="opt1"></q-radio>
          </q-item-side>
          <q-item-main label="Option 1" />
        </q-item>

        <q-item tag="label">
          <q-item-side>
            <q-radio color="purple" v-model="option" val="opt2"></q-radio>
          </q-item-side>
          <q-item-main>
            <q-item-tile label>Option 2</q-item-tile>
            <q-item-tile sublabel>Allows notifications</q-item-tile>
          </q-item-main>
        </q-item>
        <q-item tag="label">
          <q-item-side>
            <q-radio color="red" v-model="option" val="opt3"></q-radio>
          </q-item-side>
          <q-item-main>
            <q-item-tile label>Option 3</q-item-tile>
            <q-item-tile sublabel lines="3">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</q-item-tile>
          </q-item-main>
        </q-item>
        <q-item-separator />
        <q-list-header>Toggles</q-list-header>
        <q-item tag="label">
          <q-item-main label="Events and reminders" />
          <q-item-side right>
            <q-toggle v-model="checked"></q-toggle>
          </q-item-side>
        </q-item>
        <q-item tag="label" multiline>
          <q-item-main>
            <q-item-tile label>Events and reminders</q-item-tile>
            <q-item-tile sublabel>Lorem ipsum</q-item-tile>
          </q-item-main>
          <q-item-side right>
            <q-toggle v-model="checked" color="purple"></q-toggle>
          </q-item-side>
        </q-item>
        <q-item tag="label" multiline>
          <q-item-main>
            <q-item-tile label>Events and reminders</q-item-tile>
            <q-item-tile sublabel lines="3">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed
              do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              Ut enim ad minim veniam, quis nostrud exercitation ullamco
              laboris nisi ut aliquip ex ea commodo consequat. Duis aute
            </q-item-tile>
          </q-item-main>
          <q-item-side right>
            <q-toggle v-model="checked" color="red"></q-toggle>
          </q-item-side>
        </q-item>
        <q-item-separator />
        <q-list-header>Selects</q-list-header>
        <q-item-separator />
        <q-list-header>Ranges</q-list-header>
        <q-item>
          <q-item-side icon="volume_down" />
          <q-item-main>
            <q-slider v-model="slider" :min="0" :max="50" label />
          </q-item-main>
          <q-item-side right icon="volume_up" />
        </q-item>
        <q-item>
          <q-item-side icon="volume_down" />
          <q-item-main>
            <q-slider v-model="slider" :min="0" :max="50" label />
          </q-item-main>
          <q-item-side right icon="volume_up" />
        </q-item>
        <q-item>
          <q-item-side icon="euro_symbol" />
          <q-item-main>
            <q-range v-model="range" :min="0" :max="50" label />
          </q-item-main>
        </q-item>
        <q-list-header>User controls</q-list-header>
        <q-item>
          <q-item-main>
            <q-select
              multiple
              toggle
              v-model="multipleSelect"
              :options="selectOptions"
              @change="inputChange"
              />
          </q-item-main>
        </q-item>
        <q-item>
          <q-item-main>
            <q-item-tile label>Password</q-item-tile>
            <q-item-tile sublabel>Require password for purchase or use password to restrict purchase</q-item-tile>
          </q-item-main>
        </q-item>
        <q-item-separator />

        <q-item-separator />
        <q-list-header>General</q-list-header>
        <q-item tag="label">
          <q-item-side>
            <q-checkbox v-model="checked" />
          </q-item-side>
          <q-item-main>
            <q-item-tile label>Notifications</q-item-tile>
            <q-item-tile sublabel>Notify me about updates to apps or games that I downloaded</q-item-tile>
          </q-item-main>
        </q-item>
        <q-item tag="label">
          <q-item-side>
            <q-checkbox v-model="checked" />
          </q-item-side>
          <q-item-main>
            <q-item-tile label>Sound</q-item-tile>
            <q-item-tile sublabel>Auto-update apps at anytime. Data charges may apply</q-item-tile>
          </q-item-main>
        </q-item>
        <q-item tag="label">
          <q-item-side>
            <q-checkbox v-model="checked" />
          </q-item-side>
          <q-item-main>
            <q-item-tile label>Auto-add widgets</q-item-tile>
            <q-item-tile sublabel>Automatically add home screen widgets</q-item-tile>
          </q-item-main>
        </q-item>
        -->
      </q-list>
    </q-tab-pane>
    <q-tab-pane name="tab-2">Tab Two</q-tab-pane>
    <q-tab-pane name="tab-3">Tab Three</q-tab-pane>
    <q-tab-pane name="tab-4">Tab Four</q-tab-pane>
    <q-tab-pane name="tab-5">Tab Five</q-tab-pane>
  </q-tabs>
</template>

<script>
import { QTabs, QTab, QTabPan, QBtn } from 'quasar'
// import { mapGetters, mapActions } from 'vuex'

export default {
  components: {
    QTabs,
    QTab,
    QTabPan,
    QBtn
  },
  data () {
    let categories = [
      {
        label: 'Google',
        value: 'goog'
      },
      {
        label: 'Facebook',
        value: 'fb'
      }
    ]
    return {
      // initializing for second tab to be selected by default
      select: 1,
      multiple: [],

      selectedTab: 'tab-2',
      selectOptions: categories
    }
  },
  methods: {
    selectThirdTab () {
      // we select third tab which has `name` set to 'tab-3'
      this.selectedTab = 'tab-3'
    }
  }
}
</script>

<style>
</style>
