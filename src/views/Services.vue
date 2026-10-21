<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Header from './Authentication/Components/Header.vue'
import Sidebar from './Authentication/Components/Sidebar.vue'
import { supabase } from '../lib/supabase'

const serviceTitle = ref('')
const description = ref('')
const scheduleDate = ref('')
const scheduleTime = ref('')
const venue = ref('Barangay Carmen Health Center')
const status = ref('Upcoming')
const requirements = ref<string[]>([])
const newRequirement = ref('')
const scheduledServices = ref<MedicalService[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const loadError = ref('')
const formError = ref('')
const editingServiceId = ref<number | null>(null)
const deletingServiceId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = 7
const totalServices = ref(0)
const totalUpcomingServices = ref(0)
const totalPages = computed(() => Math.ceil(totalServices.value / pageSize))
let activeLoadRequest = 0

type MedicalService = {
    service_id: number
    service_name: string
    description: string | null
    schedule_date: string
    schedule_time: string | null
    location_venue: string
    requirements: string | null
    status: string | null
}

const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
})

const parseScheduleTime = (time: string) => {
    const match = time.trim().match(/^(1[0-2]|[1-9]):([0-5]\d)\s*(AM|PM)$/i)
    if (!match) return null

    const meridiem = match[3]?.toUpperCase()
    if (!meridiem || !match[2]) return null

    let hour = Number(match[1]) % 12
    if (meridiem === 'PM') hour += 12
    return `${String(hour).padStart(2, '0')}:${match[2]}`
}

const formatScheduleTime = (time: string | null) => {
    if (!time) return '—'

    const [hourPart, minute] = time.split(':')
    const hour = Number(hourPart)
    if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !minute) return time

    return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`
}

const verifyAdmin = async () => {
    const { data, error } = await supabase.rpc('is_admin')

    if (error) {
        console.error('Error verifying admin access:', error)
        return { authorized: false, message: 'Could not verify admin access. Please try again.' }
    }

    if (data !== true) {
        return { authorized: false, message: 'Only administrators can manage medical services.' }
    }

    return { authorized: true, message: '' }
}

const loadServices = async () => {
    const requestId = ++activeLoadRequest
    isLoading.value = true
    loadError.value = ''

    const start = (currentPage.value - 1) * pageSize
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
    const [{ data, count, error }, { count: upcomingCount, error: upcomingError }] = await Promise.all([
        supabase
            .from('medical_services')
            .select('service_id, service_name, description, schedule_date, schedule_time, location_venue, requirements, status', { count: 'exact' })
            .order('schedule_date', { ascending: false })
            .order('service_id', { ascending: false })
            .range(start, start + pageSize - 1),
        supabase
            .from('medical_services')
            .select('service_id', { count: 'exact', head: true })
            .eq('status', 'Upcoming')
            .gte('schedule_date', today),
    ])

    if (requestId !== activeLoadRequest) return
    if (error) {
        console.error('Error fetching medical services:', error)
        loadError.value = 'Could not load medical services. Please try again.'
        isLoading.value = false
        return
    }

    if (upcomingError) {
        console.error('Error fetching upcoming medical service count:', upcomingError)
        loadError.value = 'Services loaded, but the upcoming count could not be retrieved.'
    }

    scheduledServices.value = data ?? []
    totalServices.value = count ?? 0
    totalUpcomingServices.value = upcomingCount ?? 0
    isLoading.value = false
}

const changePage = (page: number) => {
    if (page < 1 || page > totalPages.value || page === currentPage.value || isLoading.value) return
    currentPage.value = page
    void loadServices()
}

const addRequirement = () => {
    const newRequirements = newRequirement.value
        .split(/[,\r\n]+/)
        .map((requirement) => requirement.trim())
        .filter(Boolean)
    if (!newRequirements.length) return
    requirements.value.push(...newRequirements)
    newRequirement.value = ''
}

const removeRequirement = (index: number) => {
    requirements.value.splice(index, 1)
}

const resetForm = () => {
    serviceTitle.value = ''
    description.value = ''
    scheduleDate.value = ''
    scheduleTime.value = ''
    venue.value = 'Barangay Carmen Health Center'
    status.value = 'Upcoming'
    requirements.value = []
    newRequirement.value = ''
    editingServiceId.value = null
    formError.value = ''
}

const editService = (service: MedicalService) => {
    editingServiceId.value = service.service_id
    serviceTitle.value = service.service_name
    description.value = service.description ?? ''
    scheduleDate.value = service.schedule_date
    scheduleTime.value = service.schedule_time ? formatScheduleTime(service.schedule_time) : ''
    venue.value = service.location_venue
    status.value = service.status ?? 'Upcoming'
    requirements.value = service.requirements
        ? service.requirements.split(/\s*,\s*|\r?\n/).filter(Boolean)
        : []
    formError.value = ''
}

const saveService = async () => {
    formError.value = ''
    const serviceName = serviceTitle.value.trim()
    const locationVenue = venue.value.trim()
    const parsedScheduleTime = parseScheduleTime(scheduleTime.value)
    if (!serviceName || !scheduleDate.value || !parsedScheduleTime || !locationVenue) {
        formError.value = 'Enter a service name, schedule date, time in h:mm AM/PM format, and venue.'
        return
    }
    if (serviceName.length > 150 || locationVenue.length > 255) {
        formError.value = 'Service name must be 150 characters or fewer and venue must be 255 characters or fewer.'
        return
    }

    isSaving.value = true
    const adminCheck = await verifyAdmin()
    if (!adminCheck.authorized) {
        formError.value = adminCheck.message
        isSaving.value = false
        return
    }

    const fields = {
        service_name: serviceName,
        description: description.value.trim() || null,
        schedule_date: scheduleDate.value,
        schedule_time: parsedScheduleTime,
        location_venue: locationVenue,
        requirements: requirements.value
            .flatMap((requirement) => requirement.split(/[,\r\n]+/))
            .map((requirement) => requirement.trim())
            .filter(Boolean)
            .join(', ') || null,
        status: status.value,
    }

    const isEditing = editingServiceId.value !== null
    if (isEditing) {
        const { error } = await supabase
            .from('medical_services')
            .update(fields)
            .eq('service_id', editingServiceId.value)

        if (error) {
            console.error('Error updating medical service:', error)
            formError.value = 'Could not update the medical service. Please try again.'
            isSaving.value = false
            return
        }
    } else {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('Error verifying current user for service creation:', authError)
            formError.value = 'Could not verify the logged-in account. Please sign in and try again.'
            isSaving.value = false
            return
        }

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('user_id')
            .eq('auth_user_id', user.id)
            .maybeSingle()

        if (profileError || !profile) {
            console.error('Error fetching profile for service creation:', profileError)
            formError.value = 'Could not find the logged-in account profile.'
            isSaving.value = false
            return
        }

        const { error } = await supabase
            .from('medical_services')
            .insert({ ...fields, created_by_user_id: profile.user_id })

        if (error) {
            console.error('Error creating medical service:', error)
            formError.value = 'Could not save the medical service. Please try again.'
            isSaving.value = false
            return
        }
    }

    resetForm()
    if (!isEditing) currentPage.value = 1
    await loadServices()
    isSaving.value = false
}

const updateServiceStatus = async (service: MedicalService, nextStatus: string) => {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.authorized) {
        window.alert(adminCheck.message)
        return
    }

    const { error } = await supabase
        .from('medical_services')
        .update({ status: nextStatus })
        .eq('service_id', service.service_id)

    if (error) {
        console.error('Error updating medical service status:', error)
        window.alert('Could not update the service status. Please try again.')
        return
    }

    service.status = nextStatus
}

const deleteService = async (service: MedicalService) => {
    if (!window.confirm(`Delete "${service.service_name}"? This cannot be undone.`)) return

    deletingServiceId.value = service.service_id
    const adminCheck = await verifyAdmin()
    if (!adminCheck.authorized) {
        window.alert(adminCheck.message)
        deletingServiceId.value = null
        return
    }

    const { error } = await supabase
        .from('medical_services')
        .delete()
        .eq('service_id', service.service_id)

    if (error) {
        console.error('Error deleting medical service:', error)
        window.alert('Could not delete the service. Please try again.')
        deletingServiceId.value = null
        return
    }

    scheduledServices.value = scheduledServices.value.filter(
        (item) => item.service_id !== service.service_id,
    )
    totalServices.value = Math.max(0, totalServices.value - 1)
    if (scheduledServices.value.length === 0 && currentPage.value > 1) {
        currentPage.value -= 1
    }
    await loadServices()
    deletingServiceId.value = null
}

onMounted(() => {
    void loadServices()
})
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
            <main class="p-8 space-y-6 max-w-9xl w-full mx-auto">

                <!-- Page Header Info -->
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Medical Services</h1>
                        <p class="text-sm text-gray-500 mt-0.5">Schedule clinics, programs, and outreach events.</p>
                    </div>
                    <span
                        class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        {{ totalUpcomingServices }} upcoming
                    </span>
                </div>

                <!-- Content Grid: Form (Left) & Table (Right) -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    <!-- Left Column: Service Builder Form -->
                    <div class="lg:col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
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
                            <textarea v-model="description" rows="5" placeholder="Briefly describe this service"
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 resize-y"></textarea>
                        </div>

                        <!-- Schedule Date & Venue Row -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-gray-700">Schedule date</label>
                                <input v-model="scheduleDate" type="date"
                                    class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-gray-700">Schedule time</label>
                                <input v-model="scheduleTime" type="text" placeholder="e.g. 9:00 AM"
                                    aria-label="Schedule time in hours and minutes with AM or PM"
                                    class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                            </div>
                            <div class="space-y-1.5 sm:col-span-2">
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
                            <label class="text-xs font-bold text-gray-700">Requirements</label>
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
                                <input v-model="newRequirement"
                                    placeholder="Add requirements"
                                    class="flex-1 bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 ">
                                <button @click="addRequirement"
                                    class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                    + Add
                                </button>
                            </div>
                        </div>

                        <!-- Save Service Button -->
                        <p v-if="formError" role="alert" class="text-xs text-red-600">{{ formError }}</p>
                        <button @click="saveService" :disabled="isSaving"
                            class="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm transition-colors mt-3 cursor-pointer">
                            {{ isSaving ? 'Saving…' : editingServiceId ? 'Update Service' : 'Save Service' }}
                        </button>
                        <button v-if="editingServiceId !== null" @click="resetForm"
                            class="w-full text-gray-500 hover:text-gray-700 text-xs font-semibold">Stop editing</button>
                    </div>

                    <!-- Right Column: Scheduled Services Table -->
                    <div class="lg:col-span-8 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
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
                                    <tr v-if="isLoading">
                                        <td colspan="5" class="py-8 px-4 text-center text-gray-500">Loading services…</td>
                                    </tr>
                                    <tr v-else-if="loadError">
                                        <td colspan="5" class="py-8 px-4 text-center text-red-600">
                                            {{ loadError }}
                                            <button @click="loadServices" class="ml-2 font-semibold underline">Retry</button>
                                        </td>
                                    </tr>
                                    <tr v-else-if="scheduledServices.length === 0">
                                        <td colspan="5" class="py-8 px-4 text-center text-gray-500">No medical services scheduled yet.</td>
                                    </tr>
                                    <tr v-for="item in scheduledServices" :key="item.service_id"
                                        class="hover:bg-gray-50/50 transition-colors">
                                        <td class="py-3.5 px-4 font-bold text-gray-900">{{ item.service_name }}</td>
                                        <td class="py-3.5 px-4 text-gray-600">
                                            {{ formatDate(item.schedule_date) }}<br>
                                            <span class="text-gray-400">{{ formatScheduleTime(item.schedule_time) }}</span>
                                        </td>
                                        <td class="py-3.5 px-4 text-gray-600">{{ item.location_venue }}</td>
                                        <td class="py-3.5 px-4">
                                            <span :class="[
                                                'inline-block px-2 py-0.5 rounded text-[10px] font-medium',
                                                item.status === 'Upcoming' ? 'text-emerald-700 bg-emerald-50' : '',
                                                item.status === 'Ongoing' ? 'text-blue-700 bg-blue-50' : '',
                                                item.status === 'Completed' ? 'text-gray-600 bg-gray-100' : '',
                                                item.status === 'Cancelled' ? 'text-red-600 bg-red-50' : ''
                                            ]">
                                                {{ item.status ?? 'Upcoming' }}
                                            </span>
                                        </td>
                                        <td class="py-3.5 px-4 text-right font-medium text-emerald-700 space-x-1">
                                            <button @click="editService(item)" class="hover:underline">Edit</button>
                                            <span class="text-gray-300">•</span>
                                            
                                           
                                            <button @click="deleteService(item)" :disabled="deletingServiceId === item.service_id"
                                                class="hover:underline text-red-600 disabled:opacity-50">
                                                {{ deletingServiceId === item.service_id ? 'Deleting…' : 'Delete' }}
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="flex items-center justify-between pt-2">
                            <span class="text-xs text-gray-500">
                                Showing {{ totalServices === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}–{{
                                    Math.min(currentPage * pageSize, totalServices)
                                }} of {{ totalServices }} services
                            </span>
                            <div class="flex items-center gap-2">
                                <button @click="changePage(currentPage - 1)"
                                    :disabled="currentPage <= 1 || isLoading"
                                    aria-label="Previous page"
                                    class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
                                    ←
                                </button>
                                <span class="min-w-16 text-center text-xs text-gray-600">
                                    Page {{ totalPages === 0 ? 0 : currentPage }} of {{ totalPages }}
                                </span>
                                <button @click="changePage(currentPage + 1)"
                                    :disabled="currentPage >= totalPages || isLoading"
                                    aria-label="Next page"
                                    class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
                                    →
                                </button>
                            </div>
                        </div>

                    </div>

                </div>

            </main>
        </div>
    </div>
</template>