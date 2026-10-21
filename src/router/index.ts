import { createRouter, createWebHistory } from "vue-router";
import AdvisoriesView from "../views/AdvisoriesView.vue";
import AdminDirectoryView from "../views/AdminDirectoryView.vue";
import LoginView from '../views/Authentication/Components/Login.vue';
import DashboardView from "../views/Dashboard.vue";
import InquiriesView from "../views/InquiriesView.vue";
import ResidentsView from "../views/ResidentsView.vue";
import ServicesView from "../views/Services.vue";
import { isCurrentUserAdmin } from '../lib/auth'

const routes = [
    { path: '/login', name: 'Login', component: LoginView },
    { path: "/", name: "Dashboard", component: DashboardView },
    { path: "/advisories", name: "Advisories", component: AdvisoriesView },
    { path: "/services", name: "Services", component: ServicesView },
    { path: "/inquiries", name: "Inquiries", component: InquiriesView },
    { path: "/residents", name: "Residents", component: ResidentsView },
    { path: "/admins", name: "Admin Directory", component: AdminDirectoryView },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to) => {
    if (to.path === '/login') {
        if (await isCurrentUserAdmin()) return '/'
        return true
    }

    if (!(await isCurrentUserAdmin())) {
        return '/login'
    }

    return true
})

export default router;