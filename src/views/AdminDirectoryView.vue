<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Header from './Authentication/Components/Header.vue'
import Sidebar from './Authentication/Components/Sidebar.vue'
import { supabase } from '../lib/supabase'

type Administrator = {
    user_id: number
    first_name: string
    last_name: string
    email: string
    contact_number: string | null
    created_at: string
}

const searchQuery = ref('')
const administrators = ref<Administrator[]>([])
const isLoading = ref(true)
const loadError = ref('')
const isExporting = ref(false)
const exportError = ref('')
const showCreateForm = ref(false)
const isCreating = ref(false)
const createError = ref('')
const createSuccess = ref('')
const deletingAdminId = ref<number | null>(null)
const deleteError = ref('')
const deleteSuccess = ref('')
const newAdmin = ref({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    password: '',
})
const currentPage = ref(1)
const pageSize = 7
const exportPageSize = 1000
const totalAdministrators = ref(0)
const totalPages = computed(() => Math.ceil(totalAdministrators.value / pageSize))
let activeRequest = 0

const buildAdministratorsQuery = () => {
    const search = searchQuery.value.trim().replace(/[^\p{L}\p{N}\s@.+-]/gu, '')
    let query = supabase
        .from('users')
        .select('user_id, first_name, last_name, email, contact_number, created_at', { count: 'exact' })
        .eq('role_id', 1)
        .order('created_at', { ascending: false })
        .order('user_id', { ascending: false })

    if (search) {
        query = query.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,contact_number.ilike.%${search}%`,
        )
    }

    return query
}

const loadAdministrators = async () => {
    const requestId = ++activeRequest
    isLoading.value = true
    loadError.value = ''

    const start = (currentPage.value - 1) * pageSize
    const { data, count, error } = await buildAdministratorsQuery()
        .range(start, start + pageSize - 1)

    if (requestId !== activeRequest) return

    if (error) {
        console.error('Error fetching administrators:', error)
        loadError.value = 'Could not load the admin directory. Please try again.'
        isLoading.value = false
        return
    }

    administrators.value = data ?? []
    totalAdministrators.value = count ?? 0
    isLoading.value = false
}

const changePage = (page: number) => {
    if (page < 1 || page > totalPages.value || page === currentPage.value || isLoading.value) return
    currentPage.value = page
    void loadAdministrators()
}

const getFunctionErrorMessage = async (error: unknown, functionName: string) => {
    if (typeof error === 'object' && error !== null && 'context' in error) {
        const context: unknown = error.context
        if (context instanceof Response) {
            try {
                const body: unknown = await context.clone().json()
                if (typeof body === 'object' && body !== null && 'error' in body
                    && typeof body.error === 'string') {
                    return body.error
                }
            } catch {
                return `The account function returned HTTP ${context.status}.`
            }
            return `The account function returned HTTP ${context.status}.`
        }
    }

    if (error instanceof Error) {
        if (error.message.includes('Failed to send a request')) {
            return `Could not reach the ${functionName} Edge Function. Confirm it is deployed to this Supabase project.`
        }
        return error.message
    }

    return 'An unknown Edge Function error occurred.'
}

const deleteAdministrator = async (administrator: Administrator) => {
    if (deletingAdminId.value !== null) return
    const confirmed = window.confirm(
        `Delete administrator ${administrator.first_name} ${administrator.last_name} (${administrator.email})? Their sign-in access will be removed.`,
    )
    if (!confirmed) return

    deleteError.value = ''
    deleteSuccess.value = ''
    deletingAdminId.value = administrator.user_id

    try {
        const { data, error } = await supabase.functions.invoke('delete-admin', {
            body: { userId: administrator.user_id },
        })

        if (error) {
            console.error('Error deleting administrator:', error)
            deleteError.value = await getFunctionErrorMessage(error, 'delete-admin')
            return
        }

        if (administrators.value.length === 1 && currentPage.value > 1) {
            currentPage.value -= 1
        }
        await loadAdministrators()
        deleteSuccess.value = data?.profileRetained
            ? 'Admin sign-in was removed. The user profile remains because other records reference it.'
            : 'Administrator account deleted successfully.'
    } catch (error) {
        console.error('Unexpected error deleting administrator:', error)
        deleteError.value = 'An unexpected error occurred while deleting the administrator.'
    } finally {
        deletingAdminId.value = null
    }
}

const createAdministrator = async () => {
    createError.value = ''
    createSuccess.value = ''

    const firstName = newAdmin.value.firstName.trim()
    const lastName = newAdmin.value.lastName.trim()
    const email = newAdmin.value.email.trim().toLowerCase()
    const contactNumber = newAdmin.value.contactNumber.trim()
    const password = newAdmin.value.password

    if (!firstName || !lastName || !email || !password) {
        createError.value = 'Enter a first name, last name, email, and password.'
        return
    }
    if (firstName.length > 50 || lastName.length > 50 || email.length > 100 || contactNumber.length > 15) {
        createError.value = 'Names must be 50 characters or fewer, email 100, and contact number 15.'
        return
    }
    if (password.length < 8) {
        createError.value = 'Password must be at least 8 characters.'
        return
    }

    isCreating.value = true
    try {
        const { error } = await supabase.functions.invoke('create-admin', {
            body: { firstName, lastName, email, contactNumber: contactNumber || null, password },
        })

        if (error) {
            console.error('Error creating administrator:', error)
            createError.value = await getFunctionErrorMessage(error, 'create-admin')
            return
        }

        newAdmin.value = { firstName: '', lastName: '', email: '', contactNumber: '', password: '' }
        currentPage.value = 1
        await loadAdministrators()
        createSuccess.value = 'Administrator account created successfully.'
    } catch (error) {
        console.error('Unexpected error creating administrator:', error)
        createError.value = 'An unexpected error occurred while creating the administrator.'
    } finally {
        isCreating.value = false
    }
}

const toggleCreateForm = () => {
    showCreateForm.value = !showCreateForm.value
    createError.value = ''
    createSuccess.value = ''
    if (!showCreateForm.value) newAdmin.value.password = ''
}

watch(searchQuery, (_value, _previousValue, onCleanup) => {
    currentPage.value = 1
    const timeout = setTimeout(() => void loadAdministrators(), 250)
    onCleanup(() => clearTimeout(timeout))
})

onMounted(() => {
    void loadAdministrators()
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
    const allAdministrators: Administrator[] = []

    try {
        for (let start = 0; ; start += exportPageSize) {
            const { data, error } = await buildAdministratorsQuery()
                .range(start, start + exportPageSize - 1)

            if (error) {
                console.error('Error exporting admin directory:', error)
                exportError.value = 'Could not export administrators. Please try again.'
                return
            }

            const page = data ?? []
            allAdministrators.push(...page)
            if (page.length < exportPageSize) break
        }

        const columns: (keyof Administrator)[] = [
            'user_id',
            'first_name',
            'last_name',
            'email',
            'contact_number',
            'created_at',
        ]
        const csv = [
            columns.map((column) => csvCell(column)).join(','),
            ...allAdministrators.map((administrator) =>
                columns.map((column) => csvCell(
                    column === 'created_at'
                        ? formatTimestampForCsv(administrator.created_at)
                        : administrator[column],
                )).join(','),
            ),
        ].join('\r\n')
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `admin-directory-${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
        console.error('Unexpected error exporting admin directory:', error)
        exportError.value = 'An unexpected error occurred while exporting administrators.'
    } finally {
        isExporting.value = false
    }
}

const formatDate = (date: string) => new Date(date).toLocaleDateString()
</script>

<template>
    <div class="flex min-h-screen bg-gray-50 font-sans text-gray-800">
        <Sidebar />
        <div class="flex-1 flex flex-col h-screen overflow-y-auto">
            <Header />
            <main class="p-8 space-y-6 max-w-7xl w-full mx-auto">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Admin Directory</h1>
                        <p class="text-sm text-gray-500 mt-0.5">View registered administrator accounts.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                            {{ totalAdministrators }} admins
                        </span>
                        <button @click="exportDirectory" :disabled="isExporting"
                            class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50">
                            {{ isExporting ? 'Exporting…' : 'Export Directory' }}
                        </button>
                        <button @click="toggleCreateForm" :disabled="isCreating"
                            class="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors">
                            {{ showCreateForm ? 'Close form' : 'Create Admin' }}
                        </button>
                    </div>
                </div>
                <p v-if="exportError" role="alert" class="text-xs text-red-600">{{ exportError }}</p>
                <p v-if="createSuccess" role="status" class="text-xs text-emerald-700">{{ createSuccess }}</p>
                <p v-if="deleteSuccess" role="status" class="text-xs text-emerald-700">{{ deleteSuccess }}</p>
                <p v-if="deleteError" role="alert" class="text-xs text-red-600">{{ deleteError }}</p>

                <section class="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                    <form v-if="showCreateForm" @submit.prevent="createAdministrator"
                        class="rounded-lg border border-emerald-100 bg-emerald-50/40 p-5 space-y-4">
                        <div>
                            <h2 class="text-sm font-bold text-gray-900">Create administrator account</h2>
                            <p class="mt-1 text-xs text-gray-500">
                                An initial password is required. Share it securely and ask the new administrator to change it.
                            </p>
                        </div>
                        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div class="space-y-1">
                                <label for="new-admin-first-name" class="text-xs font-semibold text-gray-700">First name</label>
                                <input id="new-admin-first-name" v-model="newAdmin.firstName" maxlength="50" required
                                    autocomplete="given-name"
                                    class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            </div>
                            <div class="space-y-1">
                                <label for="new-admin-last-name" class="text-xs font-semibold text-gray-700">Last name</label>
                                <input id="new-admin-last-name" v-model="newAdmin.lastName" maxlength="50" required
                                    autocomplete="family-name"
                                    class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            </div>
                            <div class="space-y-1">
                                <label for="new-admin-email" class="text-xs font-semibold text-gray-700">Email</label>
                                <input id="new-admin-email" v-model="newAdmin.email" type="email" maxlength="100" required
                                    autocomplete="email"
                                    class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            </div>
                            <div class="space-y-1">
                                <label for="new-admin-contact" class="text-xs font-semibold text-gray-700">Contact number</label>
                                <input id="new-admin-contact" v-model="newAdmin.contactNumber" type="tel" maxlength="15"
                                    autocomplete="tel"
                                    class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            </div>
                            <div class="space-y-1 sm:col-span-2">
                                <label for="new-admin-password" class="text-xs font-semibold text-gray-700">Initial password</label>
                                <input id="new-admin-password" v-model="newAdmin.password" type="password" minlength="8"
                                    required autocomplete="new-password"
                                    class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            </div>
                        </div>
                        <p v-if="createError" role="alert" class="text-xs text-red-600">{{ createError }}</p>
                        <button type="submit" :disabled="isCreating"
                            class="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                            {{ isCreating ? 'Creating account…' : 'Create account' }}
                        </button>
                    </form>

                    <div>
                        <h2 class="text-base font-bold text-gray-900">Administrator list</h2>
                        <p class="text-xs text-gray-400 mt-0.5">Password hashes are never requested or displayed.</p>
                    </div>

                    <div class="space-y-1">
                        <label for="admin-search" class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Search administrators
                        </label>
                        <input id="admin-search" v-model="searchQuery" type="search"
                            placeholder="Search name, email, or contact number"
                            class="w-full md:max-w-md bg-gray-50/50 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800">
                    </div>

                    <div class="overflow-x-auto border border-gray-100 rounded-lg">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th class="py-3 px-4">User ID</th>
                                    <th class="py-3 px-4">First Name</th>
                                    <th class="py-3 px-4">Last Name</th>
                                    <th class="py-3 px-4">Email</th>
                                    <th class="py-3 px-4">Contact Number</th>
                                    <th class="py-3 px-4">Registration Date</th>
                                    <th class="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50 text-xs">
                                <tr v-if="isLoading">
                                    <td colspan="7" class="py-6 text-center text-gray-400">Loading administrators…</td>
                                </tr>
                                <tr v-else-if="loadError">
                                    <td colspan="7" class="py-6 text-center text-red-600">
                                        {{ loadError }}
                                        <button @click="loadAdministrators" class="ml-2 font-semibold underline">Retry</button>
                                    </td>
                                </tr>
                                <tr v-else-if="administrators.length === 0">
                                    <td colspan="7" class="py-6 text-center text-gray-400">No administrators found.</td>
                                </tr>
                                <tr v-for="administrator in administrators" :key="administrator.user_id"
                                    class="hover:bg-gray-50/50 transition-colors">
                                    <td class="py-3.5 px-4">{{ administrator.user_id }}</td>
                                    <td class="py-3.5 px-4 font-bold text-gray-900">{{ administrator.first_name }}</td>
                                    <td class="py-3.5 px-4 font-bold text-gray-900">{{ administrator.last_name }}</td>
                                    <td class="py-3.5 px-4 text-gray-600">{{ administrator.email }}</td>
                                    <td class="py-3.5 px-4 text-gray-600 font-mono">{{ administrator.contact_number || '—' }}</td>
                                    <td class="py-3.5 px-4 text-gray-500">{{ formatDate(administrator.created_at) }}</td>
                                    <td class="py-3.5 px-4 text-right">
                                        <button @click="deleteAdministrator(administrator)"
                                            :disabled="deletingAdminId !== null"
                                            class="font-semibold text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50">
                                            {{ deletingAdminId === administrator.user_id ? 'Deleting…' : 'Delete' }}
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="flex items-center justify-between pt-2">
                        <span class="text-xs text-gray-500">
                            Showing {{ totalAdministrators === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}–{{
                                Math.min(currentPage * pageSize, totalAdministrators)
                            }} of {{ totalAdministrators }} administrators
                        </span>
                        <div class="flex items-center gap-2">
                            <button @click="changePage(currentPage - 1)" :disabled="currentPage <= 1 || isLoading"
                                aria-label="Previous page"
                                class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
                                ←
                            </button>
                            <span class="min-w-16 text-center text-xs text-gray-600">
                                Page {{ totalPages === 0 ? 0 : currentPage }} of {{ totalPages }}
                            </span>
                            <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages || isLoading"
                                aria-label="Next page"
                                class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
                                →
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    </div>
</template>
