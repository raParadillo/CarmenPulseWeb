<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Dynamically compute the page title based on the current route path
const pageTitle = computed(() => {
    switch (route.path) {
        case '/':
            return 'Dashboard'
        case '/advisories':
            return 'Advisories'
        case '/services':
            return 'Services'
        case '/inquiries':
            return 'Inquiries'
        case '/residents':
            return 'Residents'
        default:
            return 'Admin Portal'
    }
})
</script>

<template>
    <header class="bg-white border-b border-gray-200 h-16 px-8 flex items-center justify-between sticky top-0 z-10">
        <!-- Dynamic Page Title -->
        <h2 class="text-lg font-bold text-gray-900">{{ pageTitle }}</h2>

        <!-- Right Side Header Items -->
        <div class="flex items-center space-x-6">
            <!-- Search Bar -->
            <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </span>
                <input type="text" placeholder="Search portal"
                    class="bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C9A3E] w-64">
            </div>

            <!-- Notification Bell -->
            <button class="text-gray-400 hover:text-gray-600 relative cursor-pointer">
                <span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </button>

            <!-- User Profile -->
            <div class="flex items-center space-x-3 border-l border-gray-200 pl-6">
                <div
                    class="w-8 h-8 rounded-full bg-[#4C9A3E]/10 flex items-center justify-center font-bold text-[#4C9A3E] text-xs">
                    MS
                </div>
                <div class="text-left">
                    <p class="text-xs font-bold text-gray-900 leading-tight">Maria Santos</p>
                    <p class="text-[10px] text-gray-400">Administrator</p>
                </div>
            </div>
        </div>
    </header>
</template>