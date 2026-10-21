<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import Header from './Authentication/Components/Header.vue'
import Sidebar from './Authentication/Components/Sidebar.vue'
import { supabase } from '../lib/supabase'

interface MedicalService {
    service_id: number
    service_name: string
    schedule_date: string
    location_venue: string
}

interface ServiceComment {
    comment_id: number
    service_id: number
    user_id: number
    content: string
    created_at: string
    author: string
    roleId: number
}

const services = ref<MedicalService[]>([])
const serviceSearch = ref('')
const submittedServiceSearch = ref('')
const activeService = ref<MedicalService | null>(null)
const comments = ref<ServiceComment[]>([])
const commentsScroller = ref<HTMLDivElement | null>(null)
const replyText = ref('')
const isLoadingServices = ref(true)
const isLoadingMoreServices = ref(false)
const isLoadingComments = ref(false)
const isLoadingOlderComments = ref(false)
const isSendingReply = ref(false)
const servicesError = ref('')
const loadMoreServicesError = ref('')
const commentsError = ref('')
const olderCommentsError = ref('')
const replyError = ref('')
let activeCommentsRequest = 0
let activeServicesRequest = 0
const servicePageSize = 10
const commentPageSize = 10
const hasMoreServices = ref(true)
const hasOlderComments = ref(false)

const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
})

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return Number.isNaN(date.getTime())
        ? timestamp
        : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

const scrollCommentsToLatest = async () => {
    await nextTick()
    const scroller = commentsScroller.value
    if (scroller) scroller.scrollTop = scroller.scrollHeight
}

const mapCommentsWithAuthors = async (
    commentRows: Array<{
        comment_id: number
        service_id: number
        user_id: number
        content: string
        created_at: string
    }>,
) => {
    const userIds = [...new Set(commentRows.map((comment) => comment.user_id))]
    const { data: users, error: usersError } = userIds.length
        ? await supabase
            .from('users')
            .select('user_id, first_name, last_name, role_id')
            .in('user_id', userIds)
        : { data: [], error: null }

    if (usersError) console.error('Error fetching comment authors:', usersError)

    const usersById = new Map((users ?? []).map((user) => [user.user_id, user]))
    return {
        comments: commentRows.map((comment) => {
            const author = usersById.get(comment.user_id)
            const fullName = [author?.first_name, author?.last_name]
                .filter((name): name is string => Boolean(name?.trim()))
                .join(' ')

            return {
                ...comment,
                author: fullName || 'Community member',
                roleId: author?.role_id ?? 2,
            }
        }),
        authorsError: usersError,
    }
}

const loadComments = async (service: MedicalService) => {
    const requestId = ++activeCommentsRequest
    activeService.value = service
    comments.value = []
    commentsError.value = ''
    olderCommentsError.value = ''
    hasOlderComments.value = false
    isLoadingOlderComments.value = false
    replyError.value = ''
    replyText.value = ''
    isLoadingComments.value = true

    const { data, error } = await supabase
        .from('comments')
        .select('comment_id, service_id, user_id, content, created_at')
        .eq('service_id', service.service_id)
        .order('created_at', { ascending: false })
        .order('comment_id', { ascending: false })
        .range(0, commentPageSize - 1)

    if (requestId !== activeCommentsRequest) return

    if (error) {
        console.error('Error fetching service comments:', error)
        commentsError.value = 'Could not load comments for this service. Please try again.'
        isLoadingComments.value = false
        return
    }

    const commentRows = data ?? []
    const { comments: latestComments, authorsError } = await mapCommentsWithAuthors(commentRows)

    if (requestId !== activeCommentsRequest) return

    if (authorsError) {
        commentsError.value = 'Comments loaded, but author details could not be retrieved.'
    }

    comments.value = latestComments.reverse()
    hasOlderComments.value = commentRows.length === commentPageSize
    isLoadingComments.value = false
    await scrollCommentsToLatest()
}

const loadOlderComments = async () => {
    const service = activeService.value
    const scroller = commentsScroller.value
    if (!service || !scroller || isLoadingComments.value || isLoadingOlderComments.value || !hasOlderComments.value) return

    const requestId = activeCommentsRequest
    const previousScrollHeight = scroller.scrollHeight
    const previousScrollTop = scroller.scrollTop
    isLoadingOlderComments.value = true
    olderCommentsError.value = ''

    const { data, error } = await supabase
        .from('comments')
        .select('comment_id, service_id, user_id, content, created_at')
        .eq('service_id', service.service_id)
        .order('created_at', { ascending: false })
        .order('comment_id', { ascending: false })
        .range(comments.value.length, comments.value.length + commentPageSize - 1)

    if (requestId !== activeCommentsRequest) return

    if (error) {
        console.error('Error loading older service comments:', error)
        olderCommentsError.value = 'Could not load older comments. Scroll to the top to retry.'
        isLoadingOlderComments.value = false
        return
    }

    const commentRows = data ?? []
    const { comments: olderComments, authorsError } = await mapCommentsWithAuthors(commentRows)

    if (requestId !== activeCommentsRequest) return

    if (authorsError) {
        console.error('Error fetching authors for older comments:', authorsError)
        olderCommentsError.value = 'Older comments loaded, but author details could not be retrieved.'
    }

    comments.value.unshift(...olderComments.reverse())
    hasOlderComments.value = commentRows.length === commentPageSize
    isLoadingOlderComments.value = false

    await nextTick()
    if (commentsScroller.value) {
        commentsScroller.value.scrollTop = previousScrollTop + commentsScroller.value.scrollHeight - previousScrollHeight
    }
}

const handleCommentsScroll = (event: Event) => {
    const element = event.currentTarget
    if (element instanceof HTMLElement && element.scrollTop <= 48) {
        void loadOlderComments()
    }
}

const buildServicesQuery = (search: string) => {
    let query = supabase
        .from('medical_services')
        .select('service_id, service_name, schedule_date, location_venue')

    if (search) {
        const pattern = `%${search}%`
        query = query.or(`service_name.ilike.${pattern},location_venue.ilike.${pattern}`)
    }

    return query
        .order('schedule_date', { ascending: false })
        .order('service_id', { ascending: false })
}

const loadServices = async () => {
    const requestId = ++activeServicesRequest
    isLoadingServices.value = true
    isLoadingMoreServices.value = false
    servicesError.value = ''
    loadMoreServicesError.value = ''
    hasMoreServices.value = true

    const search = serviceSearch.value.trim().replace(/[^\p{L}\p{N}\s.-]/gu, '')
    submittedServiceSearch.value = search
    const { data, error } = await buildServicesQuery(search)
        .range(0, servicePageSize - 1)

    if (requestId !== activeServicesRequest) return

    if (error) {
        console.error('Error fetching services for comments:', error)
        servicesError.value = 'Could not load medical services. Please try again.'
        isLoadingServices.value = false
        return
    }

    services.value = data ?? []
    hasMoreServices.value = services.value.length === servicePageSize
    isLoadingServices.value = false

    if (services.value.length > 0) {
        await loadComments(services.value[0]!)
    } else {
        activeService.value = null
        comments.value = []
    }
}

const loadMoreServices = async () => {
    if (isLoadingServices.value || isLoadingMoreServices.value || !hasMoreServices.value) return

    const requestId = activeServicesRequest
    isLoadingMoreServices.value = true
    loadMoreServicesError.value = ''
    const start = services.value.length
    const { data, error } = await buildServicesQuery(submittedServiceSearch.value)
        .range(start, start + servicePageSize - 1)

    if (requestId !== activeServicesRequest) return

    if (error) {
        console.error('Error loading more medical services:', error)
        loadMoreServicesError.value = 'Could not load more services.'
        isLoadingMoreServices.value = false
        return
    }

    const nextServices = data ?? []
    services.value.push(...nextServices)
    hasMoreServices.value = nextServices.length === servicePageSize
    isLoadingMoreServices.value = false
}

const handleServiceListScroll = (event: Event) => {
    const element = event.currentTarget
    if (!(element instanceof HTMLElement)) return

    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 48) {
        void loadMoreServices()
    }
}

const postReply = async () => {
    const content = replyText.value.trim()
    const service = activeService.value
    if (!content || !service || isSendingReply.value) return

    isSendingReply.value = true
    replyError.value = ''

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        console.error('Error verifying signed-in user for service comment:', authError)
        replyError.value = 'Could not verify your signed-in account. Please sign in and try again.'
        isSendingReply.value = false
        return
    }

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('user_id, role_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

    if (profileError || !profile) {
        console.error('Error loading signed-in profile for service comment:', profileError)
        replyError.value = 'Could not find your account profile.'
        isSendingReply.value = false
        return
    }

    if (profile.role_id !== 1) {
        replyError.value = 'Only administrators can post official replies.'
        isSendingReply.value = false
        return
    }

    const { error } = await supabase
        .from('comments')
        .insert({
            service_id: service.service_id,
            user_id: profile.user_id,
            content,
        })

    if (error) {
        console.error('Error posting service comment:', error)
        replyError.value = 'Could not send your reply. Please try again.'
        isSendingReply.value = false
        return
    }

    replyText.value = ''
    await loadComments(service)
    isSendingReply.value = false
}

const serviceCountLabel = computed(() => `${services.value.length} medical ${services.value.length === 1 ? 'service' : 'services'}`)

onMounted(() => {
    void loadServices()
})
</script>

<template>
    <div class="flex min-h-screen bg-gray-50 font-sans text-gray-800 lg:h-screen lg:min-h-0 lg:overflow-hidden">
        <Sidebar />

        <div class="flex h-screen flex-1 flex-col overflow-y-auto lg:min-h-0 lg:overflow-hidden">
            <Header />

            <main class="mx-auto flex w-full max-w-7xl flex-col space-y-6 p-8 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Service Comments</h1>
                        <p class="text-sm text-gray-500 mt-0.5">Select a medical service to view and reply to its comments.</p>
                    </div>
                    <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        {{ serviceCountLabel }}
                    </span>
                </div>

                <div class="grid grid-cols-1 items-start gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:items-stretch">
                    <section class="space-y-3 lg:col-span-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
                        <div>
                            <h2 class="text-base font-bold text-gray-900">Medical services</h2>
                            <p class="text-xs text-gray-400 mt-0.5">Choose a service to open its conversation</p>
                        </div>

                       
                        <form class="flex gap-2" @submit.prevent="loadServices">
                            <label class="sr-only" for="service-search">Search medical services</label>
                            <input id="service-search" v-model="serviceSearch" type="search"
                                placeholder="Search services or locations…"
                                class="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            <button type="submit" :disabled="isLoadingServices"
                                class="shrink-0 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                                Search
                            </button>
                        </form>

                        <div v-if="isLoadingServices" class="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-400">
                            Loading medical services…
                        </div>
                        <div v-else-if="servicesError" class="rounded-xl border border-red-100 bg-white p-5 text-sm text-red-600">
                            {{ servicesError }}
                            <button @click="loadServices" class="ml-2 font-semibold underline">Retry</button>
                        </div>
                        <div v-else-if="services.length === 0 && !submittedServiceSearch" class="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-400">
                            No medical services found.
                        </div>
                        <div v-else class="space-y-3 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
                            <div v-if="services.length === 0" class="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-400">
                                No services found{{ submittedServiceSearch ? ` for “${submittedServiceSearch}”` : '' }}.
                            </div>
                            <div v-else
                                class="min-h-0 space-y-3 overflow-x-hidden overscroll-y-contain scroll-smooth pr-1"
                                :style="{ height: '40rem', maxHeight: 'calc(100vh - 12rem)', overflowY: 'auto' }"
                                @scroll.passive="handleServiceListScroll">
                                <button v-for="service in services" :key="service.service_id"
                                    @click="loadComments(service)"
                                    :aria-pressed="activeService?.service_id === service.service_id"
                                    :class="[
                                        'w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-colors',
                                        activeService?.service_id === service.service_id
                                            ? 'border-emerald-600 ring-1 ring-emerald-600/20'
                                            : 'border-gray-100 hover:border-emerald-300',
                                    ]">
                                    <span class="block text-sm font-bold text-gray-900">{{ service.service_name }}</span>
                                    <span class="mt-1 block text-xs text-gray-500">{{ formatDate(service.schedule_date) }}</span>
                                    <span class="mt-1 block text-xs text-gray-500">{{ service.location_venue }}</span>
                                </button>
                                <p v-if="isLoadingMoreServices" role="status" class="py-4 text-center text-xs text-gray-400">
                                    Loading more services…
                                </p>
                                <div v-else-if="loadMoreServicesError" role="alert" class="py-4 text-center text-xs text-red-600">
                                    {{ loadMoreServicesError }}
                                    <button @click="loadMoreServices" class="ml-1 font-semibold underline">Retry</button>
                                </div>
                                <p v-else-if="!hasMoreServices" class="py-4 text-center text-xs text-gray-400">
                                    You’ve reached the end of the services.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section class="min-w-0 lg:col-span-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-5">
                        <div>
                            <h2 class="text-base font-bold text-gray-900">Conversation</h2>
                            <p v-if="activeService" class="mt-0.5 text-xs text-gray-400">
                                {{ activeService.service_name }} · {{ activeService.location_venue }}
                            </p>
                            <p v-else class="mt-0.5 text-xs text-gray-400">Choose a medical service to view its comments.</p>
                        </div>

                        <div ref="commentsScroller"
                            class="min-h-64 min-w-0 max-h-[28rem] space-y-4 overflow-x-hidden overflow-y-auto rounded-xl bg-gray-50/60 p-4"
                            @scroll.passive="handleCommentsScroll">
                            <p v-if="isLoadingOlderComments" role="status" class="py-2 text-center text-xs text-gray-400">
                                Loading older comments…
                            </p>
                            <p v-else-if="olderCommentsError" role="alert" class="py-2 text-center text-xs text-amber-700">
                                {{ olderCommentsError }}
                            </p>
                            <div v-if="isLoadingComments" class="py-12 text-center text-sm text-gray-400">
                                Loading comments…
                            </div>
                            <div v-else-if="commentsError" class="py-12 text-center text-sm text-red-600">
                                {{ commentsError }}
                                <button v-if="activeService" @click="loadComments(activeService)" class="ml-2 font-semibold underline">
                                    Retry
                                </button>
                            </div>
                            <div v-else-if="!activeService" class="py-12 text-center text-sm text-gray-400">
                                Select a service to open its conversation.
                            </div>
                            <div v-else-if="comments.length === 0" class="py-12 text-center text-sm text-gray-400">
                                No comments for this service yet.
                            </div>
                            <div v-for="comment in comments" :key="comment.comment_id"
                                class="flex min-w-0 max-w-full" :class="comment.roleId === 1 ? 'justify-end' : 'justify-start'">
                                <div class="min-w-0 max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm"
                                    :style="{ width: 'fit-content', overflowWrap: 'anywhere' }"
                                    :class="comment.roleId === 1
                                        ? 'border-emerald-200 bg-emerald-100 text-emerald-950'
                                        : 'border-gray-200 bg-white text-gray-800'">
                                    <div class="mb-1.5 flex flex-wrap items-center gap-2">
                                        <span class="text-xs font-bold">{{ comment.author }}</span>
                                        <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                            :class="comment.roleId === 1
                                                ? 'bg-emerald-700 text-white'
                                                : 'bg-gray-100 text-gray-600'">
                                            {{ comment.roleId === 1 ? 'BHW Health Staff' : 'Resident' }}
                                        </span>
                                        <span class="ml-auto text-[10px] opacity-60">{{ formatTimestamp(comment.created_at) }}</span>
                                    </div>
                                    <p class="min-w-0 text-sm leading-relaxed whitespace-pre-wrap"
                                        :style="{ overflowWrap: 'anywhere', wordBreak: 'break-word' }">{{ comment.content }}</p>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label for="service-comment-reply" class="text-xs font-bold text-gray-700">Reply as Barangay Health Staff</label>
                            <textarea id="service-comment-reply" v-model="replyText" rows="3"
                                :disabled="!activeService || isLoadingComments"
                                placeholder="Write a reply to comments on this service…"
                                class="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y disabled:bg-gray-50"
                                @keydown.ctrl.enter="postReply"></textarea>
                        </div>
                        <p v-if="replyError" role="alert" class="text-xs text-red-600">{{ replyError }}</p>
                        <div class="flex items-center justify-between gap-3">
                            <p class="text-[10px] text-gray-400">Replies appear in green. Press Ctrl + Enter to send.</p>
                            <button @click="postReply" :disabled="!replyText.trim() || !activeService || isSendingReply"
                                class="shrink-0 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                                {{ isSendingReply ? 'Sending…' : 'Send reply' }}
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    </div>
</template>
