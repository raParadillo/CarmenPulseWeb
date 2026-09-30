<script setup lang="ts">
import { ref } from 'vue'
import Header from './Authentication/Components/Header.vue'
import Sidebar from './Authentication/Components/Sidebar.vue'

interface Inquiry {
    id: number
    author: string
    time: string
    question: string
    category: string
    initials: string
}

const inquiries = ref<Inquiry[]>([
    { id: 1, author: 'Ana Reyes', time: '12 min ago', question: 'Can my 3-year-old receive the flu vaccine at Saturday\'s clinic? What should I bring?', category: 'Flu vaccination', initials: 'AR' },
    { id: 2, author: 'Joel Mendoza', time: '36 min ago', question: 'What valid IDs are required for health registration at the barangay hall?', category: 'Health registration', initials: 'JM' },
    { id: 3, author: 'Liza Cruz', time: '2 hrs ago', question: 'Is the prenatal clinic accepting walk-ins for this week, or do I need an appointment?', category: 'Maternal care', initials: 'LC' },
])

// Using the non-null assertion (!) guarantees TypeScript it's defined
const activeInquiry = ref<Inquiry>(inquiries.value[0]!)
const replyText = ref('')

const selectInquiry = (item: Inquiry) => {
    activeInquiry.value = item
    replyText.value = ''
}

const postReply = () => {
    if (!replyText.value.trim()) {
        alert('Please write a response first.')
        return
    }
    alert('Official reply posted successfully!')
    replyText.value = ''
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
                        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Community Inquiries</h1>
                        <p class="text-sm text-gray-500 mt-0.5">Respond officially and keep conversations respectful.
                        </p>
                    </div>
                    <span
                        class="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                        17 pending
                    </span>
                </div>

                <!-- Content Grid: Inbox List (Left) & Conversation Panel (Right) -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    <!-- Left Column: Question Inbox List (cols 5) -->
                    <div class="lg:col-span-5 space-y-3">
                        <div>
                            <h3 class="text-base font-bold text-gray-900">Question inbox</h3>
                            <p class="text-xs text-gray-400 mt-0.5">Select a message to view and respond</p>
                        </div>

                        <div class="space-y-3">
                            <div v-for="item in inquiries" :key="item.id" @click="selectInquiry(item)" :class="[
                                'bg-white rounded-xl border p-4 transition-all cursor-pointer shadow-sm space-y-2',
                                activeInquiry.id === item.id ? 'border-emerald-600 ring-1 ring-emerald-600/20' : 'border-gray-100 hover:border-gray-200'
                            ]">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-bold text-gray-900">{{ item.author }}</span>
                                    <span class="text-[10px] text-gray-400">{{ item.time }}</span>
                                </div>
                                <p class="text-xs text-gray-700 line-clamp-1 font-medium">{{ item.question }}</p>
                                <span
                                    class="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                                    {{ item.category }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Conversation Detail Panel (cols 7) -->
                    <div class="lg:col-span-7 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div>
                            <h3 class="text-base font-bold text-gray-900">Conversation</h3>
                            <p class="text-xs text-gray-400 mt-0.5">{{ activeInquiry.category }} • Asked by {{
                                activeInquiry.author }}</p>
                        </div>

                        <!-- Resident Message Bubble -->
                        <div class="flex items-start space-x-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                            <div
                                class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                                {{ activeInquiry.initials }}
                            </div>
                            <div class="space-y-1">
                                <p class="text-xs font-bold text-gray-900">{{ activeInquiry.author }}</p>
                                <p class="text-xs text-gray-700 leading-relaxed">{{ activeInquiry.question }}</p>
                            </div>
                        </div>

                        <!-- Official Reply Input Box -->
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-gray-700">Official reply</label>
                            <textarea v-model="replyText" rows="4"
                                placeholder="Write a response from the Barangay Health team..."
                                class="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 resize-none"></textarea>
                            <p class="text-[10px] text-gray-400">Your response will appear publicly in the resident
                                mobile app.</p>
                        </div>

                        <!-- Action Buttons Row -->
                        <div class="flex items-center justify-between pt-2">
                            <div class="flex items-center space-x-2">
                                <button
                                    class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer">
                                    Hide
                                </button>
                                <button
                                    class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer">
                                    Flag
                                </button>
                                <button
                                    class="bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer">
                                    Remove
                                </button>
                            </div>

                            <button @click="postReply"
                                class="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer">
                                Post Official Reply
                            </button>
                        </div>

                    </div>

                </div>

            </main>
        </div>
    </div>
</template>