/**
 * ApexGrid — Vue Router Configuration & Role-Based Navigation Guards (Syed's Feature)
 * Uses createWebHashHistory() so page refreshes never 404 on Swinburne's Mercury Web Server.
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

import HomeView from '../views/HomeView.vue'
import EventsListView from '../views/EventsListView.vue'
import EventDetailView from '../views/EventDetailView.vue'
import ExploreView from '../views/ExploreView.vue'
import ClubsListView from '../views/ClubsListView.vue'
import ClubDetailView from '../views/ClubDetailView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfileView from '../views/ProfileView.vue'
import MyEventsView from '../views/MyEventsView.vue'
import EventFormView from '../views/EventFormView.vue'
import OrganizerDashboardView from '../views/OrganizerDashboardView.vue'
import AdminPanelView from '../views/AdminPanelView.vue'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Home — ApexGrid Motorsport Event Board', access: 'public' }
  },
  {
    path: '/events',
    name: 'events',
    component: EventsListView,
    meta: { title: 'Browse Events — ApexGrid', access: 'public' }
  },
  {
    path: '/events/new',
    name: 'event-create',
    component: EventFormView,
    meta: {
      title: 'Host New Event — Organizer Portal',
      requiresAuth: true,
      roles: ['organizer', 'admin']
    }
  },
  {
    path: '/events/:id/edit',
    name: 'event-edit',
    component: EventFormView,
    meta: {
      title: 'Edit Event — Organizer Portal',
      requiresAuth: true,
      roles: ['organizer', 'admin']
    }
  },
  {
    path: '/events/:id',
    name: 'event-detail',
    component: EventDetailView,
    meta: { title: 'Event Telemetry & Details — ApexGrid', access: 'public' }
  },
  {
    path: '/explore',
    name: 'explore',
    component: ExploreView,
    meta: { title: 'Interactive Map & Track Calendar — ApexGrid', access: 'public' }
  },
  {
    path: '/clubs',
    name: 'clubs',
    component: ClubsListView,
    meta: { title: 'Clubs & Track Organizers — ApexGrid', access: 'public' }
  },
  {
    path: '/clubs/:id',
    name: 'club-detail',
    component: ClubDetailView,
    meta: { title: 'Club Profile — ApexGrid', access: 'public' }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Sign In — Guest Portal', guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { title: 'Create Account — Guest Portal', guestOnly: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { title: 'Account Settings & Driver Profile — ApexGrid', requiresAuth: true }
  },
  {
    path: '/my-events',
    name: 'my-events',
    component: MyEventsView,
    meta: {
      title: 'My RSVPs, Likes & Offline Saved Events — Member Portal',
      requiresAuth: true
    }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: OrganizerDashboardView,
    meta: {
      title: 'Organizer Analytics & Event Management — Organizer Portal',
      requiresAuth: true,
      roles: ['organizer', 'admin']
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminPanelView,
    meta: {
      title: 'Platform Moderation & Role Control — Admin Portal',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

/**
 * Role-based Navigation Guard (Syed's Advanced Feature)
 */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta && to.meta.title && typeof document !== 'undefined') {
    document.title = to.meta.title
  }

  // 1. Guest-only routes (/login, /register) redirect logged-in users to their role portal
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next(authStore.roleHomeRoute)
  }

  // 2. Protected routes require authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath, notice: 'auth_required' }
    })
  }

  // 3. Role-restricted routes (Organizer / Admin portals)
  if (
    to.meta.roles &&
    Array.isArray(to.meta.roles) &&
    !to.meta.roles.includes(authStore.userRole)
  ) {
    return next({
      path: authStore.roleHomeRoute,
      query: { denied: to.path }
    })
  }

  return next()
})

export default router
