<script setup lang="ts">
import Login from './Components/Login.vue'
</script>

<template>
  <main class="grid min-h-screen w-full grid-cols-1 bg-slate-100 text-slate-900 lg:grid-cols-[1.5fr_1fr]">
    
    <div class="flex w-full flex-col justify-between bg-[#0f5d4f] px-8 py-8 text-white sm:px-10 lg:min-h-screen lg:px-12">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-lg shadow-inner ring-1 ring-white/20">
          ♡
        </div>
        <div class="text-xl font-medium text-white">Carmen Pulse Portal</div>
      </div>

      <div class="max-w-xl pb-12 pt-16">
        <p class="mb-6 text-xs font-medium uppercase tracking-[0.25em] text-white/80">
          Community health, connected
        </p>
        <h1 class="text-4xl font-light leading-tight tracking-[-0.04em] text-white md:text-5xl">
          Manage care with clarity and confidence.
        </h1>
        <p class="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
          A secure workspace for Barangay Carmen Health Workers and administrators.
        </p>
      </div>

      <div class="pt-8 text-sm text-white/70">
        Authorized personnel only • Records are protected
      </div>
    </div>

    <div class="flex w-full items-center justify-center bg-slate-100">
      <Login class="scale-80" />
    </div>
  </main>
</template>

<style scoped></style>
