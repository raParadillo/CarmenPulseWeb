<script setup lang="ts">
import { ref } from 'vue'
import Header from './Authentication/Components/Header.vue'
import Sidebar from './Authentication/Components/Sidebar.vue'

// Form state
const serviceTitle = ref('')
const description = ref('')
const dateTime = ref('Sep 18, 9:00 AM')
const venue = ref('Health Center')
const status = ref('Upcoming')

// Requirements list with interactive remove capability
const requirements = ref([
    'Valid ID',
    'Yellow Card'
])
const newRequirement = ref('')

const addRequirement = () => {
    if (!newRequirement.value.trim()) return
    requirements.value.push(newRequirement.value.trim())
    newRequirement.value = ''
}

const removeRequirement = (index: number) => {
    requirements.value.splice(index, 1)
}

// Scheduled services mock list matching the UI
const scheduledServices = ref([
    { title: 'Childhood Immunization', schedule: 'Sep 18 • 9:00 AM', venue: 'Health Center', status: 'Upcoming' },
    { title: 'Prenatal Consultation', schedule: 'Sep 19 • 8:30 AM', venue: 'Room 2', status: 'Upcoming' },
    { title: 'Nutrition Screening', schedule: 'Today • 1:00 PM', venue: 'Covered Court', status: 'Ongoing' },
    { title: 'Senior Wellness Check', schedule: 'Sep 12 • 9:00 AM', venue: 'Health Center', status: 'Completed' },
    { title: 'Dental Mission', schedule: 'Sep 8 • 8:00 AM', venue: 'Elementary School', status: 'Cancelled' },
])

const saveService = () => {
    if (!serviceTitle.value.trim()) {
        alert('Please enter a service title.')
        return
    }

    scheduledServices.value.unshift({
        title: serviceTitle.value,
        schedule: dateTime.value,
        venue: venue.value,
        status: status.value
    })

    // Reset fields
    serviceTitle.value = ''
    description.value = ''
    alert('Medical service successfully scheduled!')
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
                        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Medical Services</h1>
                        <p class="text-sm text-gray-500 mt-0.5">Schedule clinics, programs, and outreach events.</p>
                    </div>
                    <span
                        class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        8 upcoming
                    </span>
                </div>

                <!-- Content Grid: Form (Left) & Table (Right) -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    <!-- Left Column: Service Builder Form -->
                    <div class="lg:col-span-5 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div>
                            <h3 class="text-base font-bold text-gray-900">Service builder</h3>
                            <p class="text-xs text-gray-400 mt-0.5">Add complete details so residents arrive prepared
                            </p>
                        </div>

                        <!-- Service Title -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-gray-700">Service title</label>
                            <input v-model="serviceTitle" type="text" placeholder="e.g. Childhood Immunization Day"
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                        </div>

                        <!-- Description -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-gray-700">Description</label>
                            <textarea v-model="description" rows="3" placeholder="Briefly describe this service"
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 resize-none"></textarea>
                        </div>

                        <!-- Date & Time & Venue Row -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-gray-700">Date & time</label>
                                <input v-model="dateTime" type="text"
                                    class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-gray-700">Venue</label>
                                <input v-model="venue" type="text"
                                    class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                            </div>
                        </div>

                        <!-- Status dropdown -->
                        <div class="space-y-1.5">
                            <label class="text-xs font-bold text-gray-700">Status</label>
                            <select v-model="status"
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                                <option>Upcoming</option>
                                <option>Ongoing</option>
                                <option>Completed</option>
                                <option>Cancelled</option>
                            </select>
                        </div>

                        <!-- Requirements list section -->
                        <div class="space-y-2 pt-1">
                            <label class="text-xs font-bold text-gray-700">Requirements list</label>
                            <div class="space-y-2">
                                <div v-for="(req, index) in requirements" :key="index"
                                    class="flex items-center justify-between bg-gray-50/60 border border-gray-100 px-3 py-2 rounded-lg text-xs">
                                    <span class="text-gray-700 font-medium">• {{ req }}</span>
                                    <button @click="removeRequirement(index)"
                                        class="text-red-500 hover:text-red-700 text-[11px] font-semibold">Remove</button>
                                </div>
                            </div>

                            <!-- Quick add requirement box -->
                            <div class="flex space-x-2 pt-1">
                                <input v-model="newRequirement" @keyup.enter="addRequirement" type="text"
                                    placeholder="Add new requirement"
                                    class="flex-1 bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                                <button @click="addRequirement"
                                    class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                    + Add
                                </button>
                            </div>
                        </div>

                        <!-- Save Service Button -->
                        <button @click="saveService"
                            class="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm transition-colors mt-3 cursor-pointer">
                            Save Service
                        </button>
                    </div>

                    <!-- Right Column: Scheduled Services Table -->
                    <div class="lg:col-span-7 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div>
                            <h3 class="text-base font-bold text-gray-900">Scheduled services</h3>
                            <p class="text-xs text-gray-400 mt-0.5">Upcoming, ongoing, completed, and cancelled events
                            </p>
                        </div>

                        <div class="overflow-x-auto border border-gray-100 rounded-lg">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr
                                        class="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        <th class="py-3 px-4">Service</th>
                                        <th class="py-3 px-4">Schedule</th>
                                        <th class="py-3 px-4">Venue</th>
                                        <th class="py-3 px-4">Status</th>
                                        <th class="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-50 text-xs">
                                    <tr v-for="(item, index) in scheduledServices" :key="index"
                                        class="hover:bg-gray-50/50 transition-colors">
                                        <td class="py-3.5 px-4 font-bold text-gray-900">{{ item.title }}</td>
                                        <td class="py-3.5 px-4 text-gray-600">{{ item.schedule }}</td>
                                        <td class="py-3.5 px-4 text-gray-600">{{ item.venue }}</td>
                                        <td class="py-3.5 px-4">
                                            <span :class="[
                                                'inline-block px-2 py-0.5 rounded text-[10px] font-medium',
                                                item.status === 'Upcoming' ? 'text-emerald-700 bg-emerald-50' : '',
                                                item.status === 'Ongoing' ? 'text-blue-700 bg-blue-50' : '',
                                                item.status === 'Completed' ? 'text-gray-600 bg-gray-100' : '',
                                                item.status === 'Cancelled' ? 'text-red-600 bg-red-50' : ''
                                            ]">
                                                {{ item.status }}
                                            </span>
                                        </td>
                                        <td class="py-3.5 px-4 text-right font-medium text-emerald-700 space-x-1">
                                            <button class="hover:underline">Edit</button>
                                            <span class="text-gray-300">•</span>
                                            <button class="hover:underline text-gray-500">{{ item.status === 'Cancelled'
                                                ? 'Reschedule' : 'Cancel' }}</button>
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