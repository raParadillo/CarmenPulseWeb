<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Header from './Authentication/Components/Header.vue'
import Sidebar from './Authentication/Components/Sidebar.vue'
import { supabase } from '../lib/supabase'

// Form inputs
const title = ref('')
const category = ref('General Health')
const body = ref('')
const isPublishing = ref(false)
const publishError = ref('')
const publishSuccess = ref('')

type Advisory = {
    id: number
    userId: number
    title: string
    category: string
    body: string
    postedBy: string
    published: string
}

const pastAdvisories = ref<Advisory[]>([])
const isLoading = ref(true)
const loadError = ref('')
const currentPage = ref(1)
const pageSize = 7
const totalPosts = ref(0)
const editingPost = ref<Advisory | null>(null)
const editTitle = ref('')
const editCategory = ref('General Health')
const editBody = ref('')
const deletingPost = ref<Advisory | null>(null)
const totalPages = computed(() => Math.ceil(totalPosts.value / pageSize))
let activeRequest = 0

const publishAdvisory = async () => {
    publishError.value = ''
    publishSuccess.value = ''

    const postTitle = title.value.trim()
    const postBody = body.value.trim()
    if (!postTitle || !postBody) {
        publishError.value = 'Enter a title and body before publishing.'
        return
    }

    isPublishing.value = true
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
            console.error('Error getting logged-in user:', authError)
            publishError.value = 'Could not verify the logged-in account. Please try again.'
            return
        }
        if (!user) {
            publishError.value = 'You must be logged in to publish an advisory.'
            return
        }

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('user_id')
            .eq('auth_user_id', user.id)
            .maybeSingle()

        if (profileError) {
            console.error('Error fetching logged-in user profile:', profileError)
            publishError.value = 'Could not find the logged-in account profile.'
            return
        }
        if (!profile) {
            publishError.value = 'No user profile is linked to the logged-in account.'
            return
        }

        const { error: insertError } = await supabase
            .from('posts')
            .insert({
                user_id: profile.user_id,
                title: postTitle,
                content: postBody,
                category: category.value,
            })

        if (insertError) {
            console.error('Error publishing advisory:', insertError)
            publishError.value = 'Could not publish the advisory. Please try again.'
            return
        }

        title.value = ''
        category.value = 'General Health'
        body.value = ''
        currentPage.value = 1
        publishSuccess.value = 'Advisory published successfully.'
        await loadAdvisories()
    } catch (error) {
        console.error('Unexpected error while publishing advisory:', error)
        publishError.value = 'An unexpected error occurred while publishing. Please try again.'
    } finally {
        isPublishing.value = false
    }
}

const loadAdvisories = async () => {
    const requestId = ++activeRequest
    isLoading.value = true
    loadError.value = ''

    const start = (currentPage.value - 1) * pageSize
    const { data: posts, count, error: postsError } = await supabase
        .from('posts')
        .select('post_id, user_id, title, content, category, created_at', { count: 'exact' })
        .order('post_id', { ascending: false })
        .range(start, start + pageSize - 1)

    if (requestId !== activeRequest) return

    if (postsError) {
        console.error('Error fetching advisories:', postsError)
        loadError.value = 'Could not load advisories. Please try again.'
        isLoading.value = false
        return
    }

    totalPosts.value = count ?? 0
    const userIds = [...new Set((posts ?? []).map((post) => post.user_id))]
    const { data: users, error: usersError } = userIds.length
        ? await supabase.from('users').select('user_id, last_name').in('user_id', userIds)
        : { data: [], error: null }

    if (requestId !== activeRequest) return

    if (usersError) {
        console.error('Error fetching advisory authors:', usersError)
        loadError.value = 'Advisories loaded, but author names could not be retrieved.'
    }

    const lastNames = new Map((users ?? []).map((user) => [user.user_id, user.last_name]))
    pastAdvisories.value = (posts ?? []).map((post) => ({
        id: post.post_id,
        userId: post.user_id,
        title: post.title,
        category: post.category,
        body: post.content,
        postedBy: lastNames.get(post.user_id)?.trim() || 'Unknown',
        published: post.created_at
            ? new Date(post.created_at).toLocaleDateString()
            : '—',
    }))
    isLoading.value = false
}

const changePage = (page: number) => {
    if (page < 1 || page > totalPages.value || page === currentPage.value) return
    currentPage.value = page
    void loadAdvisories()
}

const openEditor = (item: Advisory) => {
    editingPost.value = item
    editTitle.value = item.title
    editCategory.value = item.category
    editBody.value = item.body
}

const saveEdit = async () => {
    if (!editingPost.value || !editTitle.value.trim() || !editBody.value.trim()) return

    const updatedFields = {
        title: editTitle.value.trim(),
        category: editCategory.value,
        content: editBody.value.trim(),
    }
    const { error } = await supabase
        .from('posts')
        .update(updatedFields)
        .eq('post_id', editingPost.value.id)

    if (error) {
        console.error('Error updating advisory:', error)
        window.alert('Could not save the advisory. Please try again.')
        return
    }

    Object.assign(editingPost.value, {
        title: updatedFields.title,
        category: updatedFields.category,
        body: updatedFields.content,
    })
    editingPost.value = null
}

const confirmDelete = async () => {
    if (!deletingPost.value) return

    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('post_id', deletingPost.value.id)

    if (error) {
        console.error('Error deleting advisory:', error)
        window.alert('Could not delete the advisory. Please try again.')
        return
    }

    const wasLastPostOnPage = pastAdvisories.value.length === 1 && currentPage.value > 1
    deletingPost.value = null
    if (wasLastPostOnPage) currentPage.value -= 1
    await loadAdvisories()
}

onMounted(() => {
    void loadAdvisories()
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

                <!-- Page Header info -->
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Health Advisories</h1>
                        <p class="text-sm text-gray-500 mt-0.5">Create timely, trusted updates for residents.</p>
                    </div>
                    <span
                        class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        {{ totalPosts }} total posts
                    </span>
                </div>

                <!-- Content Grid: Form on Left, Table on Right -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    <!-- Left Column: New Advisory Form -->
                    <div class="lg:col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
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
                            <textarea v-model="body" rows="10" placeholder="Write clear health guidance for residents..."
                                class="w-full bg-gray-50/50 border resize-y border-gray-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 resize-none"></textarea>
                        </div>


                        <p v-if="publishError" role="alert" class="text-xs text-red-600">{{ publishError }}</p>
                        <p v-if="publishSuccess" role="status" class="text-xs text-emerald-700">{{ publishSuccess }}</p>
                        <button @click="publishAdvisory" :disabled="isPublishing"
                            class="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm transition-colors mt-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
                            {{ isPublishing ? 'Publishing...' : 'Publish Advisory' }}
                        </button>
                    </div>

                    <!-- Right Column: Past Advisories Table -->
                    <div class="lg:col-span-8 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div>
                            <h3 class="text-base font-bold text-gray-900">Past advisories</h3>
                            <p class="text-xs text-gray-400 mt-0.5">Search, review, and manage published posts</p>
                        </div>

                        <div class="overflow-x-auto border border-gray-100 rounded-lg">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr
                                        class="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        <th class="py-3 px-4">Posted by</th>
                                        <th class="py-3 px-4">Title</th>
                                        <th class="py-3 px-4">Category</th>
                                        <th class="py-3 px-4">Published</th>
                                        <th class="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-50 text-xs">
                                    <tr v-for="item in pastAdvisories" :key="item.id"
                                        class="hover:bg-gray-50/50 transition-colors">
                                        <td class="py-3.5 px-4 text-gray-600">{{ item.postedBy }}</td>
                                        <td class="py-3.5 px-4 font-bold text-gray-900 max-w-[150px] truncate">{{
                                            item.title }}</td>
                                        <td class="py-3.5 px-4 text-gray-600">{{ item.category }}</td>
                                        <td class="py-3.5 px-4 text-gray-500">{{ item.published }}</td>
                                        <td class="py-3.5 px-4 text-right font-medium text-emerald-700 space-x-1">
                                            <button @click="openEditor(item)" class="hover:underline">Edit</button>
                                            <span class="text-gray-300">•</span>
                                            <button @click="deletingPost = item"
                                                class="hover:underline text-red-600">Delete</button>
                                        </td>
                                    </tr>
                                    <tr v-if="isLoading && pastAdvisories.length === 0">
                                        <td colspan="5" class="py-6 text-center text-gray-400">Loading advisories...</td>
                                    </tr>
                                    <tr v-else-if="!isLoading && pastAdvisories.length === 0">
                                        <td colspan="5" class="py-6 text-center text-gray-400">
                                            No advisories found
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p v-if="loadError" role="status" class="text-xs text-amber-700">{{ loadError }}</p>
                        <div class="flex items-center justify-between pt-2">
                            <span class="text-xs text-gray-500">
                                Showing {{ totalPosts === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}–{{
                                    Math.min(currentPage * pageSize, totalPosts)
                                }} of {{ totalPosts }} posts
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
                                <button @click="changePage(currentPage + 1)"
                                    :disabled="currentPage >= totalPages || isLoading" aria-label="Next page"
                                    class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
                                    →
                                </button>
                            </div>
                        </div>

                    </div>

                </div>

            </main>
        </div>

        <div v-if="editingPost" @click="editingPost = null"
            class="fixed inset-0 z-40 bg-gray-900/30 transition-opacity" aria-hidden="true"></div>
        <aside :class="editingPost ? 'translate-x-0' : 'translate-x-full'"
            class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out"
            role="dialog" aria-modal="true" aria-labelledby="edit-advisory-title">
            <div class="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                    <h2 id="edit-advisory-title" class="text-lg font-bold text-gray-900">Edit advisory</h2>
                    <p class="mt-1 text-xs text-gray-500">Update the details for this post.</p>
                </div>
                <button @click="editingPost = null" aria-label="Close editor"
                    class="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100">✕</button>
            </div>
            <div class="flex-1 space-y-5 overflow-y-auto p-6">
                <div class="space-y-1.5">
                    <label for="edit-title" class="text-xs font-bold text-gray-700">Title</label>
                    <input id="edit-title" v-model="editTitle" type="text"
                        class="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                </div>
                <div class="space-y-1.5">
                    <label for="edit-category" class="text-xs font-bold text-gray-700">Category</label>
                    <select id="edit-category" v-model="editCategory"
                        class="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option>General Health</option>
                        <option>Immunization</option>
                        <option>Maternal Care</option>
                        <option>Notice</option>
                    </select>
                </div>
                <div class="space-y-1.5">
                    <label for="edit-body" class="text-xs font-bold text-gray-700">Body</label>
                    <textarea id="edit-body" v-model="editBody" rows="20"
                        class="w-full resize-y rounded-lg border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
                </div>
            </div>
            <div class="flex justify-end gap-3 border-t border-gray-100 p-6">
                <button @click="editingPost = null"
                    class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button @click="saveEdit" :disabled="!editTitle.trim() || !editBody.trim()"
                    class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">Save changes</button>
            </div>
        </aside>

        <div v-if="deletingPost" class="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 p-4"
            role="presentation" @click.self="deletingPost = null">
            <section class="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true"
                aria-labelledby="delete-advisory-title" aria-describedby="delete-advisory-description">
                <h2 id="delete-advisory-title" class="text-base font-bold text-gray-900">Delete this advisory?</h2>
                <p id="delete-advisory-description" class="mt-2 text-sm text-gray-600">
                    “{{ deletingPost.title }}” will be permanently removed. This action cannot be undone.
                </p>
                <div class="mt-6 flex justify-end gap-3">
                    <button @click="deletingPost = null"
                        class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button @click="confirmDelete"
                        class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Delete advisory</button>
                </div>
            </section>
        </div>
    </div>
</template>