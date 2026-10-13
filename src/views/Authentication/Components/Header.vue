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
    <header class="bg-white border-b border-gray-200 p-5 h-16 px-8 flex items-center justify-between sticky top-0 z-10">
        <!-- Dynamic Page Title -->
        <h2 class="text-lg font-bold text-gray-900">{{ pageTitle }}</h2>

        <!-- Right Side Header Items -->
        <div class="flex items-center space-x-6">
            <!-- Search Bar -->
           

           

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