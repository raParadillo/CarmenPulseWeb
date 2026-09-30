<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

interface NavItem {
    name: string
    path: string
    icon: string
}

const router = useRouter()

const navItems = ref<NavItem[]>([
    {
        name: 'Dashboard',
        path: '/',
        icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
    },
    {
        name: 'Advisories',
        path: '/advisories',
        icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'
    },
    {
        name: 'Services',
        path: '/services',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    {
        name: 'Inquiries',
        path: '/inquiries',
        icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z'
    },
    {
        name: 'Residents',
        path: '/residents',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    }
])

const handleLogout = () => {
    router.push('/login')
}

</script>

<template>
    <aside
        class="w-64 bg-[#4C9A3E] border-r border-[#438737] flex flex-col justify-between shrink-0 h-screen text-white">
        <!-- Top Brand Logo -->
        <div class="p-6">
            <div class="flex items-center space-x-1.5">
                <span class="text-white font-extrabold text-base tracking-tight">CarmenPulse</span>
                <svg class="w-9 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 100 40">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                        d="M2 20h25l6-12 10 24 10-18 6 12h29" />
                </svg>
            </div>
            <p class="text-[10px] text-white/70 mt-0.5 tracking-wider uppercase">ADMIN PORTAL</p>
        </div>

        <!-- Navigation Links -->
        <nav class="px-4 space-y-1.5 flex-1">
            <router-link v-for="item in navItems" :key="item.path" :to="item.path"
                active-class="bg-white/15 text-white font-bold shadow-sm"
                class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs text-white/80 hover:bg-white/10 hover:text-white transition-all group">
                <svg class="w-4 h-4 text-white/70 group-hover:text-white" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
                </svg>
                <span>{{ item.name }}</span>
            </router-link>
        </nav>

        <!-- Bottom Section: Log Out Button & Footer Version -->
        <div class="p-4 border-t border-[#438737]/60 space-y-3">
            <button @click="handleLogout"
                class="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:bg-red-500/20 hover:text-white transition-all group cursor-pointer">
                <svg class="w-4 h-4 text-white/70 group-hover:text-red-300 transition-colors" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Log Out</span>
            </button>

            <p class="text-[10px] text-white/60 text-center">CarmenPulse • v2.4</p>
        </div>
    </aside>
</template>