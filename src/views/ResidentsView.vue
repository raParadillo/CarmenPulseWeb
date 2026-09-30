<script setup lang="ts">
import { ref } from 'vue'
import Header from './Authentication/Components/Header.vue'
import Sidebar from './Authentication/Components/Sidebar.vue'

interface Resident {
    id: number
    name: string
    zone: string
    contact: string
    date: string
    status: 'Verified' | 'Pending'
}

const searchQuery = ref('')
const selectedZone = ref('All areas')
const selectedDateFilter = ref('Any date')

const residents = ref<Resident[]>([
    { id: 1, name: 'Ana Reyes', zone: 'Zone 4', contact: '0917 345 8291', date: 'Sep 14, 2026', status: 'Verified' },
    { id: 2, name: 'Carlo Dizon', zone: 'Purok 2', contact: '0998 261 4470', date: 'Sep 14, 2026', status: 'Verified' },
    { id: 3, name: 'Joel Mendoza', zone: 'Zone 1', contact: '0920 884 1193', date: 'Sep 12, 2026', status: 'Verified' },
    { id: 4, name: 'Liza Cruz', zone: 'Purok 5', contact: '0916 720 6632', date: 'Sep 10, 2026', status: 'Pending' },
    { id: 5, name: 'Marites Ramos', zone: 'Zone 3', contact: '0908 114 7820', date: 'Sep 8, 2026', status: 'Verified' },
    { id: 6, name: 'Ramon Flores', zone: 'Purok 2', contact: '0919 557 0921', date: 'Sep 6, 2026', status: 'Verified' },
    { id: 7, name: 'Elena Garcia', zone: 'Zone 6', contact: '0927 409 8331', date: 'Sep 3, 2026', status: 'Pending' },
])

const exportDirectory = () => {
    alert('Exporting resident directory CSV...')
}
</script>

<template>
    <div class="flex min-h-screen bg-gray-50 font-sans text-gray-800">
        <!-- Sidebar Component -->
        <Sidebar />

        <!-- Right Side Layout Area -->
        <div class="flex-1 flex flex-col h-screen overflow-y-auto">
            <!-- Top Header Component -->
            <Header />

            <!-- Main Body -->
            <main class="p-8 space-y-6 max-w-7xl w-full mx-auto">

                <!-- Page Header Info -->
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Resident Directory</h1>
                        <p class="text-sm text-gray-500 mt-0.5">Search and review community health portal registrations.
                        </p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span
                            class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                            2,846 residents
                        </span>
                        <button @click="exportDirectory"
                            class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer">
                            Export Directory
                        </button>
                    </div>
                </div>

                <!-- Main Content Card -->
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                    <div>
                        <h3 class="text-base font-bold text-gray-900">Resident list</h3>
                        <p class="text-xs text-gray-400 mt-0.5">Personal information is visible to authorized staff only
                        </p>
                    </div>

                    <!-- Filters Bar -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="space-y-1">
                            <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Search
                                residents</label>
                            <input v-model="searchQuery" type="text" placeholder="Search name or contact number"
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Zone /
                                Purok</label>
                            <select v-model="selectedZone"
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                                <option>All areas</option>
                                <option>Zone 1</option>
                                <option>Zone 3</option>
                                <option>Zone 4</option>
                                <option>Zone 6</option>
                                <option>Purok 2</option>
                                <option>Purok 5</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label
                                class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Registered</label>
                            <select v-model="selectedDateFilter"
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                                <option>Any date</option>
                                <option>Past 7 days</option>
                                <option>Past 30 days</option>
                            </select>
                        </div>
                    </div>

                    <!-- Residents Table -->
                    <div class="overflow-x-auto border border-gray-100 rounded-lg">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr
                                    class="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th class="py-3 px-4">Name</th>
                                    <th class="py-3 px-4">Zone / Purok</th>
                                    <th class="py-3 px-4">Contact Number</th>
                                    <th class="py-3 px-4">Registration Date</th>
                                    <th class="py-3 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50 text-xs">
                                <tr v-for="resident in residents" :key="resident.id"
                                    class="hover:bg-gray-50/50 transition-colors">
                                    <td class="py-3.5 px-4 font-bold text-gray-900">{{ resident.name }}</td>
                                    <td class="py-3.5 px-4 text-gray-600">{{ resident.zone }}</td>
                                    <td class="py-3.5 px-4 text-gray-600 font-mono">{{ resident.contact }}</td>
                                    <td class="py-3.5 px-4 text-gray-500">{{ resident.date }}</td>
                                    <td class="py-3.5 px-4">
                                        <span
                                            :class="['inline-block px-2.5 py-0.5 rounded text-[10px] font-medium', resident.status === 'Verified' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50']">
                                            {{ resident.status }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination Footer -->
                    <div class="flex items-center justify-between pt-2">
                        <span class="text-xs text-gray-400">Showing 1-7 of 2,846 residents</span>
                        <div class="flex items-center space-x-1.5">
                            <button
                                class="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer">Previous</button>
                            <button
                                class="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm">1</button>
                            <button
                                class="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer">2</button>
                            <button
                                class="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer">3</button>
                            <button
                                class="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer">Next</button>
                        </div>
                    </div>

                </div>

            </main>
        </div>
    </div>
</template>