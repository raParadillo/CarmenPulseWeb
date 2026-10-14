<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../../../lib/supabase'

const route = useRoute()
const currentUserName = ref('Account')
const currentUserInitials = computed(() => currentUserName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase() ?? '')
    .join(''))

const fetchCurrentUserName = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
        console.error('Error fetching current user:', userError)
        return
    }

    if (!user) return

    const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('auth_user_id', user.id)
        .maybeSingle()

    if (error) {
        console.error('Error fetching current user profile:', error)
        return
    }

    const profileName = [data?.first_name, data?.last_name]
        .filter((name): name is string => Boolean(name?.trim()))
        .join(' ')
    currentUserName.value = profileName || user.email?.split('@')[0] || 'Account'
}

onMounted(() => {
    void fetchCurrentUserName()
})

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
                    {{ currentUserInitials }}
                </div>
                <div class="text-left">
                    <p class="text-xs font-bold text-gray-900 leading-tight">{{ currentUserName }}</p>
                    <p class="text-[10px] text-gray-400">Administrator</p>
                </div>
            </div>
        </div>
    </header>
</template>