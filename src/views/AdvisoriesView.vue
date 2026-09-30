<script setup lang="ts">
import { ref } from 'vue'
import Header from './Authentication/Components/Header.vue'
import Sidebar from './Authentication/Components/Sidebar.vue'

// Form inputs
const title = ref('')
const category = ref('General Health')
const body = ref('')
const isUrgent = ref(false)

// Mock list for past advisories table
const pastAdvisories = ref([
    { title: 'Dengue prevention reminder', category: 'General Health', status: 'Active', published: 'Sep 12, 2026' },
    { title: 'Free flu vaccination', category: 'Immunization', status: 'Active', published: 'Sep 10, 2026' },
    { title: 'Prenatal care schedule', category: 'Maternal Care', status: 'Active', published: 'Sep 8, 2026' },
    { title: 'Water interruption notice', category: 'Notice', status: 'Archived', published: 'Sep 2, 2026' },
])

const searchQuery = ref('')
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

                <!-- Page Header info -->
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Health Advisories</h1>
                        <p class="text-sm text-gray-500 mt-0.5">Create timely, trusted updates for residents.</p>
                    </div>
                    <span
                        class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        12 active posts
                    </span>
                </div>

                <!-- Content Grid: Form on Left, Table on Right -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    <!-- Left Column: New Advisory Form -->
                    <div class="lg:col-span-5 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div>
                            <h3 class="text-base font-bold text-gray-900">New advisory</h3>
                            <p class="text-xs text-gray-400 mt-0.5">Posts are visible in the resident mobile app</p>
                        </div>

                        <!-- Title Field -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-gray-700">Title</label>
                            <input v-model="title" type="text" placeholder="Enter advisory title"
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                        </div>

                        <!-- Category Field -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-gray-700">Category</label>
                            <select v-model="category"
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                                <option>General Health</option>
                                <option>Immunization</option>
                                <option>Maternal Care</option>
                                <option>Notice</option>
                            </select>
                        </div>

                        <!-- Body Field -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-gray-700">Body</label>
                            <textarea v-model="body" rows="4" placeholder="Write clear health guidance for residents..."
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 resize-none"></textarea>
                        </div>

                        <!-- Upload Photo Dropzone box -->
                        <div
                            class="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50/50 transition-colors cursor-pointer">
                            <div class="flex flex-col items-center space-y-1">
                                <svg class="w-5 h-5 text-gray-400 mb-1" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p class="text-xs font-medium text-gray-600">Upload photo • PNG or JPG</p>
                                <p class="text-[10px] text-gray-400">Saved securely to Supabase Storage</p>
                            </div>
                        </div>

                        <!-- Emergency Toggle & Button -->
                        <div class="pt-2 flex items-center justify-between">
                            <div>
                                <p class="text-xs font-bold text-gray-900">Emergency / Urgent notification</p>
                                <p class="text-[10px] text-gray-400">Send a priority alert to residents</p>
                            </div>
                            <button @click="isUrgent = !isUrgent"
                                :class="['w-9 h-5 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out', isUrgent ? 'bg-emerald-700' : 'bg-gray-200']">
                                <div
                                    :class="['w-3.5 h-3.5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out', isUrgent ? 'translate-x-4' : 'translate-x-0']">
                                </div>
                            </button>
                        </div>

                        <button
                            class="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm transition-colors mt-2 cursor-pointer">
                            Publish Advisory
                        </button>
                    </div>

                    <!-- Right Column: Past Advisories Table -->
                    <div class="lg:col-span-7 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div>
                            <h3 class="text-base font-bold text-gray-900">Past advisories</h3>
                            <p class="text-xs text-gray-400 mt-0.5">Search, review, and manage published posts</p>
                        </div>

                        <div class="space-y-1">
                            <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Search
                                advisories</label>
                            <input v-model="searchQuery" type="text" placeholder="Search by title or category"
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                        </div>

                        <div class="overflow-x-auto border border-gray-100 rounded-lg">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr
                                        class="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        <th class="py-3 px-4">Title</th>
                                        <th class="py-3 px-4">Category</th>
                                        <th class="py-3 px-4">Status</th>
                                        <th class="py-3 px-4">Published</th>
                                        <th class="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-50 text-xs">
                                    <tr v-for="(item, index) in pastAdvisories" :key="index"
                                        class="hover:bg-gray-50/50 transition-colors">
                                        <td class="py-3.5 px-4 font-bold text-gray-900 max-w-[150px] truncate">{{
                                            item.title }}</td>
                                        <td class="py-3.5 px-4 text-gray-600">{{ item.category }}</td>
                                        <td class="py-3.5 px-4">
                                            <span
                                                :class="['inline-block px-2 py-0.5 rounded text-[10px] font-medium', item.status === 'Active' ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500 bg-gray-100']">
                                                {{ item.status }}
                                            </span>
                                        </td>
                                        <td class="py-3.5 px-4 text-gray-500">{{ item.published }}</td>
                                        <td class="py-3.5 px-4 text-right font-medium text-emerald-700 space-x-1">
                                            <button class="hover:underline">Edit</button>
                                            <span class="text-gray-300">•</span>
                                            <button class="hover:underline text-gray-500">Archive</button>
                                            <span class="text-gray-300">•</span>
                                            <button class="hover:underline text-red-600">Delete</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>

                </div>

            </main>
        </div>
    </div>
</template>