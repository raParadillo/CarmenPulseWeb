<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
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

const fetchResidentCount = async () => {
    const {count, error } = await supabase
        .from('users')
        .select('user_id', { count: 'exact' })
        .eq('role_id', 2)

    if (error) {
        console.error('Error fetching resident count:', error)
        return 0
    }

    return count
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

    return count
}

const residentCount = ref<number | null>(null)
const dailyNewResidents = ref<number | null>(null)


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

onMounted(() => {
    fetchResidentCount().then((count) => {
        residentCount.value = count
    })
    fetchDailyNewResidents().then((count) => {
        dailyNewResidents.value = count
    })

    if (barChartCanvas.value) {
        barChart = new Chart(barChartCanvas.value, {
            type: 'bar',
            data: {
                labels: ['Barangay Hall', 'Covered Court', 'Health Center', 'Purok 2', 'Zone 4'],
                datasets: [{
                    label: 'Services',
                    data: [12, 9, 7, 5, 4],
                    backgroundColor: '#10b981',
                    borderRadius: 6,
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
    }

    if (donutChartCanvas.value) {
        donutChart = new Chart(donutChartCanvas.value, {
            type: 'doughnut',
            data: {
                labels: ['Advisories', 'Inquiries', 'Other'],
                datasets: [{
                    data: [45, 30, 25],
                    backgroundColor: ['#059669', '#f59e0b', '#d1d5db'],
                    borderWidth: 0,
                }],
            },
            options: { ...chartOptions, cutout: '60%' },
        })
    }

    if (lineChartCanvas.value) {
        lineChart = new Chart(lineChartCanvas.value, {
            type: 'line',
            data: {
                labels: ['Sep 8', 'Sep 9', 'Sep 10', 'Sep 11', 'Sep 12', 'Sep 13', 'Sep 14'],
                datasets: [{
                    label: 'Registrations',
                    data: [18, 26, 22, 35, 31, 42, 38],
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

                    <!-- Active Advisories KPI Card -->
                    <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-medium text-gray-500">Active advisories</span>
                            <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <span class="material-symbols-outlined text-[18px]">campaign</span>
                            </div>
                        </div>
                        <div class="mt-4">
                            <h3 class="text-2xl font-bold text-gray-900">12</h3>
                            <p class="text-xs mt-1 text-gray-400">3 urgent</p>
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
                            <h3 class="text-2xl font-bold text-gray-900">8</h3>
                            <p class="text-xs mt-1 text-gray-400">Today: Sep 18, 2026</p>
                        </div>
                    </div>

                    <!-- Pending Questions KPI Card -->
                    <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-medium text-gray-500">Pending questions</span>
                            <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <span class="material-symbols-outlined text-[18px]">question_answer</span>
                            </div>
                        </div>
                        <div class="mt-4">
                            <h3 class="text-2xl font-bold text-gray-900">17</h3>
                            <p class="text-xs mt-1 text-gray-400">5 new today</p>
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
                                <span class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">100 posts</span>
                            </div>
                            <div class="space-y-3 text-xs text-gray-400">
                                <p><span class="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-600"></span>Advisories — 45%</p>
                                <p><span class="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-amber-500"></span>Inquiries — 30%</p>
                                <p><span class="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-gray-300"></span>Other — 25%</p>
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
                                    <select class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-emerald-500" aria-label="Select registration trend date range">
                                        <option>All time</option>
                                        <option>This year</option>
                                        <option>This month</option>
                                        <option>This week</option>
                                        <option>Today</option>
                                    </select>
                                </label>
                                <span class="text-[10px] font-bold tracking-wider text-emerald-600">LINE CHART</span>
                            </div>
                        </div>
                        <div class="relative mt-6 h-48">
                            <canvas ref="lineChartCanvas" aria-label="Resident registration trend line chart"></canvas>
                        </div>
                        <div class="mt-3 flex justify-between text-[10px] text-gray-400">
                            <span>Sep 8</span>
                            <span>Sep 14</span>
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
                                    <th class="px-5 py-3 font-semibold">Date</th>
                                    <th class="px-5 py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="border-t border-gray-50">
                                    <td class="px-5 py-3 font-semibold text-gray-800">Flu vaccination clinic</td>
                                    <td class="px-5 py-3 text-gray-500">Barangay Hall</td>
                                    <td class="px-5 py-3 text-gray-500">Sep 18, 2026</td>
                                    <td class="px-5 py-3"><span class="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">Scheduled</span></td>
                                </tr>
                                <tr class="border-t border-gray-50">
                                    <td class="px-5 py-3 font-semibold text-gray-800">Nutrition screening</td>
                                    <td class="px-5 py-3 text-gray-500">Purok 2</td>
                                    <td class="px-5 py-3 text-gray-500">Sep 16, 2026</td>
                                    <td class="px-5 py-3"><span class="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Completed</span></td>
                                </tr>
                                <tr class="border-t border-gray-50">
                                    <td class="px-5 py-3 font-semibold text-gray-800">Dengue prevention briefing</td>
                                    <td class="px-5 py-3 text-gray-500">Covered Court</td>
                                    <td class="px-5 py-3 text-gray-500">Sep 15, 2026</td>
                                    <td class="px-5 py-3"><span class="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">Pending</span></td>
                                </tr>
                                 <tr class="border-t border-gray-50">
                                    <td class="px-5 py-3 font-semibold text-gray-800">Dengue prevention briefing</td>
                                    <td class="px-5 py-3 text-gray-500">Covered Court</td>
                                    <td class="px-5 py-3 text-gray-500">Sep 15, 2026</td>
                                    <td class="px-5 py-3"><span class="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">Pending</span></td>
                                </tr>
                                 <tr class="border-t border-gray-50">
                                    <td class="px-5 py-3 font-semibold text-gray-800">Dengue prevention briefing</td>
                                    <td class="px-5 py-3 text-gray-500">Covered Court</td>
                                    <td class="px-5 py-3 text-gray-500">Sep 15, 2026</td>
                                    <td class="px-5 py-3"><span class="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">Pending</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

            </main>
        </div>
    </div>
</template>