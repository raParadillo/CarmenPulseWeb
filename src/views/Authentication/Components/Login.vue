<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')

const isFormValid = computed(() => email.value.trim() !== '' && password.value.trim() !== '')

const handleSubmit = () => {
  if (!isFormValid.value) return
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#4C9A3E] grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

    <!-- Left Hero Banner Panel -->
    <div class="bg-[#4C9A3E] p-12 lg:p-20 text-white flex flex-col justify-between relative overflow-hidden">
      <!-- Background decorative blur effect -->
      <div class="absolute -left-12 -bottom-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex items-center space-x-2">
        <span class="text-white font-extrabold text-xl tracking-tight">CarmenPulse</span>
        <svg class="w-12 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 100 40">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M2 20h25l6-12 10 24 10-18 6 12h29" />
        </svg>
      </div>

      <div class="my-auto py-10">
        <p class="text-xs uppercase tracking-widest font-semibold text-white/80 mb-3">Community Health, Connected</p>
        <h1 class="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4">
          Manage care with clarity and confidence.
        </h1>
        <p class="text-base text-white/90 leading-relaxed max-w-md">
          A secure workspace for Barangay Health Workers and administrators.
        </p>
      </div>

      <div>
        <p class="text-xs text-white/70">Authorized personnel only • Records are protected</p>
      </div>
    </div>

    <!-- Right Form Panel (Full Height & Width) -->
    <div class="bg-white p-10 lg:p-20 flex flex-col justify-center h-full shadow-2xl">
      <div class="max-w-md w-full mx-auto">
        <h2 class="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
        <p class="mt-2 text-sm text-slate-500">Sign in to continue to the admin portal.</p>

        <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label for="email" class="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700">Email
              address</label>
            <input id="email" v-model="email" type="email" required placeholder="admin@barangay.gov.ph"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#4C9A3E] focus:bg-white focus:ring-2 focus:ring-[#4C9A3E]/20" />
          </div>

          <div>
            <label for="password"
              class="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700">Password</label>
            <input id="password" v-model="password" type="password" required placeholder="••••••••••••"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#4C9A3E] focus:bg-white focus:ring-2 focus:ring-[#4C9A3E]/20" />
          </div>

          <div
            class="flex items-center text-xs text-slate-500 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100/60">
            <span
              class="mr-2 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-[#4C9A3E]">
              i
            </span>
            <p>Invalid credentials will be reported. MFA appears when enabled.</p>
          </div>

          <button type="submit" :disabled="!isFormValid"
            class="w-full flex items-center justify-center rounded-xl bg-[#4C9A3E] px-4 py-4 text-sm font-semibold text-white shadow-md shadow-[#4C9A3E]/20 transition hover:bg-[#438737] focus:outline-none focus:ring-2 focus:ring-[#4C9A3E] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer">
            Sign In
          </button>
        </form>

        <p class="mt-8 text-center text-xs text-slate-400">
          Need access? Contact your system administrator.
        </p>
      </div>
    </div>

  </div>
</template>

<style scoped></style>