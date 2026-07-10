<script setup lang="ts">
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import TranslateArea from '@/components/TranslateArea.vue'
import TMPopup from '@/components/TMPopup.vue'
import CorpusPopup from '@/components/CorpusPopup.vue'
import APIPopup from '@/components/APIPopup.vue'

const showTM = ref(false)
const showCorpus = ref(false)
const showAPI = ref(false)
</script>

<template>
  <div style="height: 100%; display: flex; flex-direction: column;">
    <NavBar
      @open-tm="showTM = true"
      @open-corpus="showCorpus = true"
      @open-api="showAPI = true"
    />
    
    <div style="flex: 1; overflow: hidden;">
      <TranslateArea />
    </div>
    
    <TMPopup v-model:visible="showTM" />
    <CorpusPopup v-model:visible="showCorpus" />
    <APIPopup v-model:visible="showAPI" />
  </div>
</template>

<style scoped>
</style>
