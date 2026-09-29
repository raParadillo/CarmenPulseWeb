<script setup lang="ts">
import Header from './Authentication/Components/Header.vue'
import Sidebar from './Authentication/Components/Sidebar.vue'

// Quick stats data
const stats = [
    { title: 'Residents', value: '2,846', subtext: '+34 this month', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { title: 'Active advisories', value: '12', subtext: '3 urgent', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
    { title: 'Upcoming services', value: '8', subtext: 'Next: Sep 18', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { title: 'Pending questions', value: '17', subtext: '5 new today', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
]

// Recent activity feed
const activities = [
    { user: 'Ana Reyes registered', detail: 'Zone 4 • 8 min ago', type: 'register' },
    { user: 'Joel Mendoza commented', detail: 'Flu vaccination advisory • 24 min ago', type: 'comment' },
    { user: 'Carlo Dizon registered', detail: 'Purok 2 • 1 hr ago', type: 'register' },
    { user: 'Liza Cruz asked a question', detail: 'Maternal care clinic • 2 hrs ago', type: 'comment' },
]

// Schedule
const schedule = [
    '09:00 Prenatal consultation',
    '13:00 Nutrition screening',
    '15:30 Dengue briefing'
]
</script>

<template>
    <div class="flex min-h-screen bg-gray-50 font-sans text-gray-800">
        <!-- Sidebar Component -->
        <Sidebar />

        <!-- Right Side Layout Area -->
        <div class="flex-1 flex flex-col h-screen overflow-y-auto">
            <!-- Top Header Component -->
            <Header />

            <!-- Dashboard Main Body -->
            <main class="p-8 space-y-8 max-w-7xl w-full mx-auto">
                <!-- Greeting & Action Buttons -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Good morning, Maria</h1>
                        <p class="text-sm text-gray-500 mt-0.5">Monday, September 14 • Here's what needs attention
                            today.</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button
                            class="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer">
                            + New Advisory
                        </button>
                        <button
                            class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer">
                            Schedule Event
                        </button>
                    </div>
                </div>

                <!-- 4 Stat Cards Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div v-for="(stat, index) in stats" :key="index"
                        class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-medium text-gray-500">{{ stat.title }}</span>
                            <div
                                class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                                        :d="stat.icon" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-4">
                            <h3 class="text-2xl font-bold text-gray-900">{{ stat.value }}</h3>
                            <p
                                :class="['text-xs mt-1', index === 0 ? 'text-emerald-600 font-medium' : 'text-gray-400']">
                                {{ stat.subtext }}</p>
                        </div>
                    </div>
                </div>

                <!-- Bottom Grid: Recent Activity & Today at a Glance -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 class="text-base font-bold text-gray-900">Recent activity</h3>
                        <p class="text-xs text-gray-400 mt-0.5 mb-6">Latest sign-ups and resident comments</p>

                        <div class="space-y-4">
                            <div v-for="(act, index) in activities" :key="index"
                                class="flex items-start space-x-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                <div
                                    class="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            :d="act.type === 'register' ? 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' : 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z'" />
                                    </svg>
                                </div>
                                <div>
                                    <p class="text-xs font-bold text-gray-900">{{ act.user }}</p>
                                    <p class="text-[11px] text-gray-500 mt-0.5">{{ act.detail }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 class="text-base font-bold text-gray-900 mb-4">Today at a glance</h3>
                        <div class="space-y-3">
                            <div v-for="(item, index) in schedule" :key="index"
                                class="bg-gray-50 hover:bg-emerald-50/50 transition-colors p-3 rounded-lg text-xs font-medium text-gray-700">
                                {{ item }}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>