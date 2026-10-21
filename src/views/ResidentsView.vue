<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Header from './Authentication/Components/Header.vue'
import Sidebar from './Authentication/Components/Sidebar.vue'
import { supabase } from '../lib/supabase'

type Resident = {
    user_id: number
    first_name: string
    last_name: string
    email: string
    contact_number: string | null
    created_at: string
}

const searchQuery = ref('')
const selectedDateFilter = ref('Any date')
const residents = ref<Resident[]>([])
const isLoading = ref(true)
const loadError = ref('')
const isExporting = ref(false)
const exportError = ref('')
const currentPage = ref(1)
const pageSize = 7
const exportPageSize = 1000
const totalResidents = ref(0)
const totalPages = computed(() => Math.ceil(totalResidents.value / pageSize))
let activeRequest = 0

const buildResidentsQuery = () => {
    const search = searchQuery.value.trim().replace(/[^\p{L}\p{N}\s@.+-]/gu, '')
    const days = selectedDateFilter.value === 'Past 7 days'
        ? 7
        : selectedDateFilter.value === 'Past 30 days'
            ? 30
            : null
    const cutoff = days === null ? null : new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    let query = supabase
        .from('users')
        .select('user_id, first_name, last_name, email, contact_number, created_at', { count: 'exact' })
        .eq('role_id', 2)
        .order('created_at', { ascending: false })
        .order('user_id', { ascending: false })

    if (search) {
        query = query.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,contact_number.ilike.%${search}%`,
        )
    }
    if (cutoff) query = query.gte('created_at', cutoff.toISOString())

    return query
}

const loadResidents = async () => {
    const requestId = ++activeRequest
    isLoading.value = true
    loadError.value = ''

    const start = (currentPage.value - 1) * pageSize
    const { data, count, error } = await buildResidentsQuery().range(start, start + pageSize - 1)

    if (requestId !== activeRequest) return

    if (error) {
        console.error('Error fetching residents:', error)
        loadError.value = 'Could not load residents. Please try again.'
        isLoading.value = false
        return
    }

    residents.value = data ?? []
    totalResidents.value = count ?? 0
    isLoading.value = false
}

const changePage = (page: number) => {
    if (page < 1 || page > totalPages.value || page === currentPage.value || isLoading.value) return
    currentPage.value = page
    void loadResidents()
}

const formatDate = (date: string) => new Date(date).toLocaleDateString()

watch([searchQuery, selectedDateFilter], (_values, _previousValues, onCleanup) => {
    currentPage.value = 1
    const timeout = setTimeout(() => void loadResidents(), 250)
    onCleanup(() => clearTimeout(timeout))
})

onMounted(() => {
    void loadResidents()
})

const csvCell = (value: string | number | null) => {
    const text = value === null ? '' : String(value)
    const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
    return `"${safeText.replace(/"/g, '""')}"`
}

const formatTimestampForCsv = (timestamp: string) => {
    const match = timestamp.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/)
    return match ? `${match[1]} ${match[2]}` : timestamp
}

const exportDirectory = async () => {
    if (isExporting.value) return

    isExporting.value = true
    exportError.value = ''
    const allResidents: Resident[] = []

    try {
        for (let start = 0; ; start += exportPageSize) {
            const { data, error } = await buildResidentsQuery()
                .range(start, start + exportPageSize - 1)

            if (error) {
                console.error('Error exporting resident directory:', error)
                exportError.value = 'Could not export residents. Please try again.'
                return
            }

            const page = data ?? []
            allResidents.push(...page)
            if (page.length < exportPageSize) break
        }

        const columns: (keyof Resident)[] = [
            'user_id',
            'first_name',
            'last_name',
            'email',
            'contact_number',
            'created_at',
        ]
        const csv = [
            columns.map((column) => csvCell(column)).join(','),
            ...allResidents.map((resident) =>
                columns.map((column) => csvCell(
                    column === 'created_at'
                        ? formatTimestampForCsv(resident.created_at)
                        : resident[column],
                )).join(','),
            ),
        ].join('\r\n')
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `residents-${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
        console.error('Unexpected error exporting resident directory:', error)
        exportError.value = 'An unexpected error occurred while exporting residents.'
    } finally {
        isExporting.value = false
    }
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
                            {{ totalResidents }} residents
                        </span>
                        <button @click="exportDirectory"
                            :disabled="isExporting"
                            class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer">
                            {{ isExporting ? 'Exporting…' : 'Export Directory' }}
                        </button>
                    </div>
                    <p v-if="exportError" role="alert" class="text-xs text-red-600">{{ exportError }}</p>
                </div>

                <!-- Main Content Card -->
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                    <div>
                        <h3 class="text-base font-bold text-gray-900">Resident list</h3>
                        <p class="text-xs text-gray-400 mt-0.5">Personal information is visible to authorized staff only
                        </p>
                    </div>

                    <!-- Filters Bar -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Search
                                residents</label>
                            <input v-model="searchQuery" type="text" placeholder="Search name or contact number"
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
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
                                    <th class="py-3 px-4">User ID</th>
                                    <th class="py-3 px-4">First Name</th>
                                    <th class="py-3 px-4">Last Name</th>
                                    <th class="py-3 px-4">Email</th>
                                    <th class="py-3 px-4">Contact Number</th>
                                    <th class="py-3 px-4">Registration Date</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50 text-xs">
                                <tr v-if="isLoading">
                                    <td colspan="6" class="py-6 text-center text-gray-400">Loading residents…</td>
                                </tr>
                                <tr v-else-if="loadError">
                                    <td colspan="6" class="py-6 text-center text-red-600">
                                        {{ loadError }}
                                        <button @click="loadResidents" class="ml-2 font-semibold underline">Retry</button>
                                    </td>
                                </tr>
                                <tr v-else-if="residents.length === 0">
                                    <td colspan="6" class="py-6 text-center text-gray-400">No residents found.</td>
                                </tr>
                                <tr v-for="resident in residents" :key="resident.user_id"
                                    class="hover:bg-gray-50/50 transition-colors">
                                    <td class="py-3.5 px-4">{{ resident.user_id }}</td>
                                    <td class="py-3.5 px-4 font-bold text-gray-900">{{ resident.first_name }}</td>
                                    <td class="py-3.5 px-4 font-bold text-gray-900">{{ resident.last_name }}</td>
                                    <td class="py-3.5 px-4 text-gray-600">{{ resident.email }}</td>
                                    <td class="py-3.5 px-4 text-gray-600 font-mono">{{ resident.contact_number || '—' }}</td>
                                    <td class="py-3.5 px-4 text-gray-500">{{ formatDate(resident.created_at) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="flex items-center justify-between pt-2">
                        <span class="text-xs text-gray-500">
                            Showing {{ totalResidents === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}–{{
                                Math.min(currentPage * pageSize, totalResidents)
                            }} of {{ totalResidents }} residents
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

            </main>
        </div>
    </div>
</template>