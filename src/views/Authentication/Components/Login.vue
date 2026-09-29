<script setup lang="ts">
import { computed, ref } from 'vue'

const email = ref('')
const password = ref('')

const isFormValid = computed(() => email.value.trim() !== '' && password.value.trim() !== '')

const handleSubmit = () => {
  if (!isFormValid.value) return
  console.log('Sign in button clicked with email:', email.value, 'and password:', password.value)
}
</script>

<template>
  <div class="w-full max-w-md rounded-2xl bg-white px-8 py-10 shadow-lg ring-1 ring-slate-900/5">
    <h1 class="text-4xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
    <p class="mt-2 text-base text-slate-600">Sign in to continue to the admin portal.</p>

    <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
      <div>
        <label for="email" class="mb-2 block text-sm font-medium text-slate-800">Email address</label>
        <input id="email" v-model="email" type="email" required placeholder="admin@barangay.gov.ph"
          class="w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
      </div>

      <div>
        <label for="password" class="mb-2 block text-sm font-medium text-slate-800">Password</label>
        <input id="password" v-model="password" type="password" required placeholder="Enter password"
          class="w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
      </div>

      <button type="submit" :disabled="!isFormValid"
        class="mt-6 flex w-full items-center justify-center rounded-md bg-[#0f5d4f] px-3 py-3 text-base font-medium text-white shadow-sm transition hover:bg-[#0e4c40] focus:outline-none focus:ring-2 focus:ring-[#0f5d4f] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500">
        Sign in
      </button>
    </form>

    <div class="mt-4 flex items-start gap-2 text-sm text-slate-500">
      <span
        class="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-400 text-[10px] font-semibold text-slate-700">
        i
      </span>
      <p>
        Invalid credentials will be reported here. MFA code verification appears when enabled.
      </p>
    </div>

    <p class="mt-7 text-center text-sm text-slate-400">
      Need access? Contact your system administrator.
    </p>
  </div>
</template>

<style scoped></style>
