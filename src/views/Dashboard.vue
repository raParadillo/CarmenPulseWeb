<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    DoughnutController,
    Filler,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
} from 'chart.js'
import Header from './Authentication/Components/Header.vue'
import Sidebar from './Authentication/Components/Sidebar.vue'
import { supabase } from '../lib/supabase'

const currentUserName = ref('there')
const todayLabel = computed(() => new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
}))
const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
})

const fetchCurrentUserName = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
        console.error('Error fetching current user:', userError)
        return
    }

    if (!user) return

    const { data, error } = await supabase
        .from('users')
        .select('first_name')
        .eq('auth_user_id', user.id)
        .maybeSingle()

    if (error) {
        console.error('Error fetching current user name:', error)
        return
    }

    currentUserName.value = data?.first_name?.trim() || user.email?.split('@')[0] || 'there'
}

const fetchResidentCount = async () => {
    const {count, error } = await supabase
        .from('users')
        .select('user_id', { count: 'exact' })
        .eq('role_id', 2)

    if (error) {
        console.error('Error fetching resident count:', error)
        return 0
    }

    return count ?? 0
}
const fetchDailyNewResidents = async () => {
    const {error, count} = await supabase
        .from('users')
        .select('user_id', { count: 'exact' })
        .eq('role_id', 2)
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .lte('created_at', new Date(new Date().setHours(23, 59, 59, 999)).toISOString())
    
    if (error) {
        console.error('Error fetching daily new residents:', error)
        return 0
    }

    return count ?? 0
}

const fetchTotalAdvisories = async () => {
    const { count, error } = await supabase
        .from('posts')
        .select('post_id', { count: 'exact', head: true })

    if (error) {
        console.error('Error fetching total advisories:', error)
        return 0
    }

    return count ?? 0
}

const fetchTotalMedicalServices = async () => {
    const { count, error } = await supabase
        .from('medical_services')
        .select('service_id', { count: 'exact', head: true })

    if (error) {
        console.error('Error fetching total medical services:', error)
        return 0
    }

    return count ?? 0
}

const fetchUpcomingServices = async () => {
    const { count, error } = await supabase
        .from('medical_services')
        .select('service_id', { count: 'exact', head: true })
        .gte('schedule_date', new Date().toISOString().split('T')[0])

    if (error) {
        console.error('Error fetching upcoming services:', error)
        return 0
    }

    return count ?? 0
}

const fetchFinishedServices = async () => {
    const { count, error } = await supabase
        .from('medical_services')
        .select('service_id', { count: 'exact', head: true })
        .lt('schedule_date', new Date().toISOString().split('T')[0])

    if (error) {
        console.error('Error fetching finished services:', error)
        return 0
    }

    return count ?? 0
}

const fetchRecentServices = async () => {
    const { data, error } = await supabase
        .from('medical_services')
        .select('*')
        .order('service_id', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching recent services:', error)
        return []
    }

    return (data ?? []).map((service) => ({
        service_id: service.service_id,
        service_name: service.service_name ?? 'Unnamed service',
        location_venue: service.location_venue ?? '—',
        schedule_date: service.schedule_date ?? '—',
        created_at: service.created_at ?? '—',
    }))
}

const fetchServicesByLocation = async () => {
    const { data, error } = await supabase
        .from('medical_services')
        .select('location_venue')

    if (error) {
        console.error('Error fetching services by location:', error)
        return { labels: [], values: [] }
    }

    const locationCounts = new Map<string, number>()
    for (const service of data ?? []) {
        const location = service.location_venue ?? 'Unknown'
        locationCounts.set(location, (locationCounts.get(location) ?? 0) + 1)
    }

    const locations = [...locationCounts.entries()]
        .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
        .slice(0, 5)

    return {
        labels: locations.map(([location]) => location),
        values: locations.map(([, count]) => count),
    }
}

type TrendRange = 'all' | 'year' | 'month' | 'week' | 'day'

type TrendBucket = {
    label: string
    start: Date
    end: Date
}


const createTrendBuckets = (range: TrendRange, registrations: string[]): TrendBucket[] => {
    const now = new Date()
    const buckets: TrendBucket[] = []
    const addBucket = (label: string, start: Date, end: Date) => {
        buckets.push({ label, start, end })
    }

    if (range === 'all') {
        const dates = registrations.map((value) => new Date(value)).filter((date) => !Number.isNaN(date.getTime()))
        if (dates.length === 0) return buckets

        const earliest = dates.reduce((first, date) => date < first ? date : first)
        const cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

        while (cursor < end) {
            const bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
            addBucket(cursor.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }), new Date(cursor), bucketEnd)
            cursor.setMonth(cursor.getMonth() + 1)
        }
    } else if (range === 'year') {
        for (let month = 0; month < 12; month += 1) {
            const start = new Date(now.getFullYear(), month, 1)
            addBucket(start.toLocaleDateString(undefined, { month: 'short' }), start, new Date(now.getFullYear(), month + 1, 1))
        }
    } else if (range === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const cursor = new Date(monthStart)

        while (cursor < monthEnd) {
            const daysUntilSaturday = 6 - cursor.getDay()
            const bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + daysUntilSaturday + 1)
            const end = bucketEnd < monthEnd ? bucketEnd : monthEnd
            const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1)
            addBucket(
                `${cursor.toLocaleDateString(undefined, { month: 'short' })} ${cursor.getDate()}-${lastDay.getDate()}`,
                new Date(cursor),
                end,
            )
            cursor.setTime(end.getTime())
        }
    } else if (range === 'week') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
        for (let day = 0; day < 7; day += 1) {
            const bucketStart = new Date(start.getFullYear(), start.getMonth(), start.getDate() + day)
            const bucketEnd = new Date(bucketStart.getFullYear(), bucketStart.getMonth(), bucketStart.getDate() + 1)
            addBucket(bucketStart.toLocaleDateString(undefined, { weekday: 'short' }), bucketStart, bucketEnd)
        }
    }

    return buckets
}

const fetchRegistrationTrend = async (range: TrendRange) => {
    let registrations: string[] = []

    if (range === 'all') {
        const pageSize = 1000
        for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabase
                .from('users')
                .select('created_at')
                .eq('role_id', 2)
                .order('created_at', { ascending: true })
                .range(offset, offset + pageSize - 1)

            if (error) {
                console.error('Error fetching registration trend:', error)
                return { labels: [], values: [] }
            }

            const page = (data ?? []).map((user) => user.created_at).filter((value): value is string => Boolean(value))
            registrations.push(...page)
            if (page.length < pageSize) break
        }
    } else {
        const now = new Date()
        let start: Date
        let end: Date
        if (range === 'year') {
            start = new Date(now.getFullYear(), 0, 1)
            end = new Date(now.getFullYear() + 1, 0, 1)
        } else if (range === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1)
            end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        } else {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
            end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
        }

        const { data, error } = await supabase
            .from('users')
            .select('created_at')
            .eq('role_id', 2)
            .gte('created_at', start.toISOString())
            .lt('created_at', end.toISOString())

        if (error) {
            console.error('Error fetching registration trend:', error)
            return { labels: [], values: [] }
        }

        registrations = (data ?? []).map((user) => user.created_at).filter((value): value is string => Boolean(value))
    }

    const buckets = createTrendBuckets(range, registrations)
    const values = buckets.map(({ start, end }) =>
        registrations.filter((value) => {
            const createdAt = new Date(value)
            return createdAt >= start && createdAt < end
        }).length,
    )

    return { labels: buckets.map(({ label }) => label), values }
}


const residentCount = ref<number | null>(null)
const dailyNewResidents = ref<number | null>(null)
const totalAdvisories = ref<number | null>(null)
const totalMedicalServices = ref<number | null>(null)
const upcomingServices = ref<number | null>(null)
const finishedServices = ref<number | null>(null)
const recentServices = ref<Array<{
    service_id: number
    service_name: string
    schedule_date: string
    location_venue: string
    created_at: string
}>>([])
const trendRange = ref<TrendRange>('month')
const trendLabels = ref<string[]>([])


Chart.register(
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    DoughnutController,
    Filler,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
)

const barChartCanvas = ref<HTMLCanvasElement | null>(null)
const donutChartCanvas = ref<HTMLCanvasElement | null>(null)
const lineChartCanvas = ref<HTMLCanvasElement | null>(null)
let barChart: Chart | null = null
let donutChart: Chart | null = null
let lineChart: Chart | null = null

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
    },
}

const updateRegistrationTrend = async () => {
    const { labels, values } = await fetchRegistrationTrend(trendRange.value)
    trendLabels.value = labels
    if (!lineChart) return

    lineChart.data.labels = labels
    const dataset = lineChart.data.datasets[0]
    if (dataset) {
        dataset.data = values
        lineChart.update()
    }
}

const onTrendRangeChange = (event: Event) => {
    const selectedRange = (event.target as HTMLSelectElement).value
    if (['all', 'year', 'month', 'week'].includes(selectedRange)) {
        trendRange.value = selectedRange as TrendRange
        void updateRegistrationTrend()
    }
}

onMounted(() => {
    void fetchCurrentUserName()
    fetchResidentCount().then((count) => {
        residentCount.value = count
    })
    fetchDailyNewResidents().then((count) => {
        dailyNewResidents.value = count
    })
    fetchTotalAdvisories().then((count) => {
        totalAdvisories.value = count
        if (donutChart) {
            const dataset = donutChart.data.datasets[0]
            if (dataset) {
                dataset.data = [count, totalMedicalServices.value ?? 0]
                donutChart.update()
            }
        }
    })
    fetchTotalMedicalServices().then((count) => {
        totalMedicalServices.value = count
        if (donutChart) {
            const dataset = donutChart.data.datasets[0]
            if (dataset) {
                dataset.data = [totalAdvisories.value ?? 0, count]
                donutChart.update()
            }
        }
    })
    fetchUpcomingServices().then((count) => {
        upcomingServices.value = count
    })
    fetchFinishedServices().then((count) => {
        finishedServices.value = count
    })
    fetchRecentServices().then((services) => {
        recentServices.value = services
    })
    fetchServicesByLocation().then(({ labels, values }) => {
        if (barChart) {
            barChart.data.labels = labels
            const dataset = barChart.data.datasets[0]
            if (dataset) {
                dataset.data = values
                barChart.update()
            }
        }
    })

    if (barChartCanvas.value) {
        barChart = new Chart(barChartCanvas.value, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Services',
                    data: [],
                    backgroundColor: '#10b981',
                    borderRadius: 6,
                }],
            },
            options: {
                ...chartOptions,
                interaction: {
                    mode: 'index',
                    intersect: true,
                },
                plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                        enabled: true,
                        
                    },
                },
                scales: {
                    x: { display: true, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { precision: 0 } },
                },
            },
        })
    }

    if (donutChartCanvas.value) {
        donutChart = new Chart(donutChartCanvas.value, {
            type: 'doughnut',
            data: {
                labels: ['Advisories', 'Medical services'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#059669', '#f59e0b'],
                    borderWidth: 0,
                }],
            },
            options: {
                ...chartOptions,
                cutout: '60%',
                interaction: {
                    mode: 'nearest',
                    intersect: true,
                },
            }
        })
    }

    if (lineChartCanvas.value) {
        lineChart = new Chart(lineChartCanvas.value, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Registrations',
                    data: [],
                    borderColor: '#059669',
                    backgroundColor: '#d1fae5',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3,
                }],
            },
            options: {
                ...chartOptions,
                scales: {
                    x: { display: true, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { precision: 0 } },
                },
            },
        })
        void updateRegistrationTrend()
    }
})

onBeforeUnmount(() => {
    barChart?.destroy()
    donutChart?.destroy()
    lineChart?.destroy()
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

            <!-- Dashboard Main Body -->
            <main class="p-8 space-y-8 max-w-7xl w-full mx-auto">
                <!-- Greeting & Action Buttons -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">{{ greeting }}, {{ currentUserName }}</h1>
                        <p class="text-sm text-gray-500 mt-0.5">{{ todayLabel }} • Here's what needs attention today.</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button
                            class="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer">
                            + New Advisory
                        </button>
                        <button
                            class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer">
                            Schedule Service
                        </button>
                    </div>
                </div>

                <!-- 4 Stat Cards Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    <!-- Residents KPI Card -->
                    <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-medium text-gray-500">Residents</span>
                            <div
                                class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <span class="material-symbols-outlined text-[20px]">groups</span>
                            </div>
                        </div>
                        <div class="mt-4">
                            <h3 class="text-2xl font-bold text-gray-900">{{ residentCount ?? '—' }}</h3>
                            <p class="text-xs mt-1 text-gray-400">
                                {{ dailyNewResidents === null ? '—' : dailyNewResidents === 0 ? 'No new residents today' : `+${dailyNewResidents} new today` }}
                            </p>
                        </div>
                    </div>

                    <!-- Total Advisories KPI Card -->
                    <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-medium text-gray-500">Total advisories</span>
                            <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <span class="material-symbols-outlined text-[18px]">campaign</span>
                            </div>
                        </div>
                        <div class="mt-4">
                            <h3 class="text-2xl font-bold text-gray-900">{{ totalAdvisories ?? '—' }}</h3>
                            <p class="text-xs mt-1 text-gray-400">All published advisories</p>
                        </div>
                    </div>

                    <!-- Upcoming Services KPI Card -->
                    <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-medium text-gray-500">Upcoming services</span>
                            <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <span class="material-symbols-outlined text-[18px]">event</span>
                            </div>
                        </div>
                        <div class="mt-4">
                            <h3 class="text-2xl font-bold text-gray-900">{{ upcomingServices ?? '—' }}</h3>
                            <p class="text-xs mt-1 text-gray-400">Based on upcoming applications</p>
                        </div>
                    </div>

                    <!-- Finished Services KPI Card -->
                    <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-medium text-gray-500">Finished services count</span>
                            <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <span class="material-symbols-outlined text-[18px]">check_circle</span>
                            </div>
                        </div>
                        <div class="mt-4">
                            <h3 class="text-2xl font-bold text-gray-900">{{ finishedServices ?? '—' }}</h3>
                            <p class="text-xs mt-1 text-gray-400">Past due services</p>
                        </div>
                    </div>
                </div>

                <!-- START: Frontend-only analytics charts. Remove this block when backend wiring begins. -->
                <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Bar Chart: Medical Services by Location/Venue -->
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div class="flex items-start justify-between">
                            <div>
                                <h3 class="text-base font-bold text-gray-900">Services by location</h3>
                                <p class="text-xs text-gray-400 mt-1">Medical services offered per venue</p>
                            </div>
                            <span class="text-[10px] font-bold tracking-wider text-emerald-600">BAR CHART</span>
                        </div>
                        <div class="relative mt-6 h-48">
                            <canvas ref="barChartCanvas" aria-label="Services by location bar chart"></canvas>
                        </div>
                        <div class="mt-3 flex justify-between text-[10px] text-gray-400">
                            <span>Location/Venue</span>
                            <span>Services</span>
                        </div>
                        
                    </div>
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div class="flex items-start justify-between">
                            <div>
                                <h3 class="text-base font-bold text-gray-900">Posts by category</h3>
                                <p class="text-xs text-gray-400 mt-1">Distribution of advisories and inquiries</p>
                            </div>
                            <span class="text-[10px] font-bold tracking-wider text-emerald-600">DONUT CHART</span>
                        </div>
                        <div class="mt-6 flex min-h-48 items-center justify-center gap-8">
                            <div class="relative h-36 w-36">
                                <canvas ref="donutChartCanvas" aria-label="Posts by category donut chart"></canvas>
                                <span class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                                    {{ (totalAdvisories ?? 0) + (totalMedicalServices ?? 0) }} total
                                </span>
                            </div>
                            <div class="space-y-3 text-xs text-gray-400">
                                <p>
                                    <span class="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
                                    Advisories — {{ totalAdvisories ?? 0 }}
                                    ({{ totalAdvisories !== null && (totalAdvisories + (totalMedicalServices ?? 0)) > 0
                                        ? Math.round((totalAdvisories / (totalAdvisories + (totalMedicalServices ?? 0))) * 100)
                                        : 0 }}%)
                                </p>
                                <p>
                                    <span class="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                                    Medical services — {{ totalMedicalServices ?? 0 }}
                                    ({{ totalMedicalServices !== null && (totalAdvisories ?? 0) + totalMedicalServices > 0
                                        ? Math.round((totalMedicalServices / ((totalAdvisories ?? 0) + totalMedicalServices)) * 100)
                                        : 0 }}%)
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Line Chart: Activity Trend over Time -->
                    <div class="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h3 class="text-base font-bold text-gray-900">Registration trend</h3>
                                <p class="text-xs text-gray-400 mt-1">Resident registrations over time</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <label class="flex items-center gap-2 text-xs font-medium text-gray-500">
                                    <span>Date range</span>
                                    <select :value ="trendRange"@change="onTrendRangeChange" class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-emerald-500" aria-label="Select registration trend date range">
                                        <option value="all">All time (by year)</option>
                                        <option value="year">This year (by month)</option>
                                        <option value="month">This month (by week)</option>
                                        <option value="week">This week (Sunday–Saturday)</option>
                                    </select>
                                </label>
                                <span class="text-[10px] font-bold tracking-wider text-emerald-600">LINE CHART</span>
                            </div>
                        </div>
                        <div class="relative mt-6 h-48">
                            <canvas ref="lineChartCanvas" aria-label="Resident registration trend line chart"></canvas>
                        </div>
                        <div class="mt-3 flex justify-between text-[10px] text-gray-400">
                            <span>{{ trendLabels[0] ?? '' }}</span>
                            <span>{{ trendLabels[trendLabels.length - 1] ?? '' }}</span>
                        </div>
                    </div>

                </section>
                <!-- END: Frontend-only analytics charts. -->

                <!-- Recent Services Table -->
                <section class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div class="p-5">
                        <div>
                            <h3 class="text-base font-bold text-gray-900">Recent services</h3>
                            <p class="mt-1 text-xs text-gray-400">Latest community medical services</p>
                        </div>
                    </div>
                    <div class="max-h-50 overflow-x-auto overflow-y-auto">
                        <table class="w-full min-w-[620px] table-fixed text-left text-xs [&_th]:px-10 [&_td]:px-10">
                            <thead class="sticky top-0 z-10 bg-gray-50 text-gray-500">
                                <tr>
                                    <th class="px-5 py-3 font-semibold">Service</th>
                                    <th class="px-5 py-3 font-semibold">Location</th>
                                    <th class="px-5 py-3 font-semibold">Schedule date</th>
                                    <th class="px-5 py-3 font-semibold">Created at</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="service in recentServices" :key="service.service_id" class="border-t border-gray-50">
                                    <td class="px-5 py-3 font-semibold text-gray-800">{{ service.service_name }}</td>
                                    <td class="px-5 py-3 text-gray-500">{{ service.location_venue }}</td>
                                    <td class="px-5 py-3 text-gray-500">{{ service.schedule_date }}</td>
                                    <td class="px-5 py-3 text-gray-500">{{ service.created_at }}</td>
                                </tr>
                                <tr v-if="recentServices.length === 0" class="border-t border-gray-50">
                                    <td colspan="4" class="px-5 py-6 text-center text-gray-400">No services found</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

            </main>
        </div>
    </div>
</template>