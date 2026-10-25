<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '../stores/eventStore'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'
import EventCard from '../components/EventCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'

const router = useRouter()
const eventStore = useEventStore()
const authStore = useAuthStore()
const { showToast } = useToast()
const heroImage = `${import.meta.env.BASE_URL}meet-hero.jpg`
const quickSearch = ref('')
const quickRegion = ref('All')
const quickCategory = ref('')
const quickDate = ref('')
const events = ref([])
const eventsTotal = ref(null)
const clubs = ref([])
const loading = ref(true)
const eventsError = ref(false)
const clubsError = ref(false)
const categoriesError = ref(false)
const failedClubImages = ref(new Set())
const pendingLikes = new Set()

const categoryOrder = ['meet', 'show', 'cruise', 'drift', 'track-day', 'drag']
const categories = computed(() => [...eventStore.categories].sort((a, b) => {
  const rank = slug => categoryOrder.includes(slug) ? categoryOrder.indexOf(slug) : categoryOrder.length
  return rank(a.slug) - rank(b.slug)
}))

const categoryDescriptions = {
  meet: 'Park up. Get talking.',
  show: 'Every build has a story.',
  cruise: 'Take the scenic route.',
  drift: 'A little more sideways.',
  'track-day': 'Find your next circuit day.',
  drag: 'Head for the quarter mile.'
}

async function loadEvents() {
  loading.value = true
  eventsError.value = false
  try {
    // Home discovery must not inherit a previous visit's persisted list filters.
    const result = await eventStore.fetchEvents({
      search: '', category: '', region: '', date_from: '', max_price: '',
      status: 'upcoming', sort: 'date', page: 1, limit: 6
    })
    events.value = result.data || []
    eventsTotal.value = Number.isFinite(Number(result.total)) ? Number(result.total) : events.value.length
  } catch {
    eventsError.value = true
  } finally {
    loading.value = false
  }
}

async function loadClubs() {
  clubsError.value = false
  try {
    clubs.value = await eventStore.fetchClubs()
  } catch {
    clubsError.value = true
  }
}

async function loadCategories() {
  categoriesError.value = false
  try {
    await eventStore.fetchCategories()
  } catch {
    categoriesError.value = true
  }
}

function submitHeroSearch() {
  eventStore.resetFilters()
  Object.assign(eventStore.filters, {
    search: quickSearch.value.trim(),
    region: quickRegion.value,
    category: quickCategory.value,
    date_from: quickDate.value,
    status: 'upcoming',
    sort: 'date'
  })
  router.push('/events')
}

function filterByCategory(slug) {
  eventStore.resetFilters()
  eventStore.filters.category = slug
  eventStore.filters.status = 'upcoming'
  router.push('/events')
}

async function handleToggleLike(event) {
  if (!authStore.isAuthenticated) {
    showToast('Sign in to like events.', 'info')
    router.push({ path: '/login', query: { redirect: `/events/${event.id}` } })
    return
  }
  if (pendingLikes.has(event.id)) return
  pendingLikes.add(event.id)
  const wasLiked = Boolean(event.user_liked)
  try {
    await eventStore.toggleLike(event.id, wasLiked)
    event.user_liked = !wasLiked
    event.likes_count = Math.max(0, Number(event.likes_count || 0) + (wasLiked ? -1 : 1))
    showToast(wasLiked ? 'Like removed.' : 'Event liked.', 'success')
  } catch {
    showToast('Could not update your like. Please try again.', 'danger')
  } finally {
    pendingLikes.delete(event.id)
  }
}

onMounted(() => {
  loadEvents()
  loadClubs()
  loadCategories()
})
</script>

<template>
  <div class="community-home">
    <section class="community-hero" aria-labelledby="home-title">
      <img
        :src="heroImage"
        alt="A silver sports car on a winding road at sunset"
        class="community-hero__image"
        width="1600"
        height="1067"
        fetchpriority="high"
        decoding="async"
      />
      <div class="community-hero__shade" aria-hidden="true"></div>
      <div class="container community-hero__inner">
        <p class="community-eyebrow community-hero__eyebrow">
          For the love of cars <span aria-hidden="true">/</span> Australia &amp; Malaysia
        </p>
        <h1 id="home-title">Good cars.<br />Better<br /><span>company.</span></h1>
        <div class="community-hero__footer">
          <p>Night meets. Weekend drives. New faces.<br />Find your next reason to get out there.</p>
          <a href="#find-events" class="community-button community-button--red">
            Find a meet <i class="bi bi-arrow-down-right" aria-hidden="true"></i>
          </a>
        </div>
        <dl class="community-stats" aria-label="ApexGrid at a glance">
          <div><dt>Upcoming events</dt><dd>{{ eventsTotal ?? '—' }}</dd></div>
          <div><dt>Car clubs</dt><dd>{{ clubs.length || '—' }}</dd></div>
          <div><dt>Scenes</dt><dd>{{ categories.length || '—' }}</dd></div>
        </dl>
        <span class="community-hero__note" aria-hidden="true">Same passion. Different roads.</span>
      </div>
    </section>

    <section id="find-events" class="community-discovery" aria-labelledby="search-title">
      <div class="container">
        <div class="community-search-heading">
          <h2 id="search-title">Make some plans.</h2>
          <router-link to="/explore" class="community-text-link">
            Explore the map <i class="bi bi-arrow-up-right" aria-hidden="true"></i>
          </router-link>
        </div>
        <form class="community-search" role="search" aria-label="Find car events" @submit.prevent="submitHeroSearch">
          <div class="community-search__field community-search__keyword">
            <label for="home-keyword">What are you looking for?</label>
            <input id="home-keyword" v-model="quickSearch" type="search" placeholder="A meet, a venue, a city…" />
          </div>
          <div class="community-search__field">
            <label for="home-region">Where</label>
            <select id="home-region" v-model="quickRegion">
              <option value="All">Australia &amp; Malaysia</option>
              <option value="Australia">Australia</option>
              <option value="Malaysia">Malaysia</option>
            </select>
          </div>
          <div class="community-search__field">
            <label for="home-category">Your scene</label>
            <select id="home-category" v-model="quickCategory">
              <option value="">All event types</option>
              <option v-for="category in categories" :key="category.id" :value="category.slug">{{ category.name }}</option>
            </select>
          </div>
          <div class="community-search__field">
            <label for="home-date">From</label>
            <input id="home-date" v-model="quickDate" type="date" />
          </div>
          <button class="community-button community-button--red" type="submit">
            Find events <i class="bi bi-arrow-right" aria-hidden="true"></i>
          </button>
        </form>
        <p v-if="categoriesError" class="community-inline-message" role="status">
          Event types couldn't load. You can still search by location and date.
          <button type="button" class="community-text-link" @click="loadCategories">Try again</button>
        </p>
      </div>
    </section>

    <section class="container community-section" aria-labelledby="upcoming-title" :aria-busy="loading">
      <div class="community-section-heading">
        <div>
          <p class="community-eyebrow">Your next good weekend</p>
          <h2 id="upcoming-title">Coming up.</h2>
        </div>
        <router-link to="/events" class="community-text-link">
          All events <i class="bi bi-arrow-up-right" aria-hidden="true"></i>
        </router-link>
      </div>
      <div v-if="loading" class="row g-4" role="status">
        <span class="visually-hidden">Loading upcoming events</span>
        <div v-for="n in 3" :key="n" class="col-12 col-md-6 col-xl-4" aria-hidden="true"><SkeletonCard /></div>
      </div>
      <div v-else-if="eventsError" class="community-empty" role="alert">
        <h3>We couldn't load the events.</h3>
        <p>Please try again in a moment.</p>
        <button type="button" class="community-button" @click="loadEvents">Try again <i class="bi bi-arrow-clockwise" aria-hidden="true"></i></button>
      </div>
      <div v-else-if="!events.length" class="community-empty">
        <h3>A little quiet for now.</h3>
        <p>No upcoming events are listed. Explore the full board or get to know the clubs.</p>
        <router-link to="/events" class="community-text-link">Browse the event board <i class="bi bi-arrow-right" aria-hidden="true"></i></router-link>
      </div>
      <div v-else class="row g-4">
        <div v-for="event in events" :key="event.id" class="col-12 col-md-6 col-xl-4">
          <EventCard :event="event" @toggle-like="handleToggleLike" />
        </div>
      </div>
    </section>

    <section v-if="categories.length" class="community-scene-section" aria-labelledby="scene-title">
      <div class="container community-section">
        <div class="community-section-heading">
          <div>
            <p class="community-eyebrow">There's more than one way to belong</p>
            <h2 id="scene-title">Find your scene.</h2>
          </div>
          <p class="community-section-intro">A coffee and a conversation, or a day at the circuit. Start with what you love.</p>
        </div>
        <div class="community-scenes">
          <button v-for="(category, index) in categories" :key="category.id" type="button" class="community-scene" @click="filterByCategory(category.slug)">
            <span class="community-scene__index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="community-scene__content"><strong>{{ category.name }}</strong><span>{{ categoryDescriptions[category.slug] || 'Discover something different.' }}</span></span>
            <i class="bi bi-arrow-up-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </section>

    <section class="container community-section" aria-labelledby="clubs-title">
      <div class="community-section-heading">
        <div>
          <p class="community-eyebrow">The people who bring it together</p>
          <h2 id="clubs-title">Meet the clubs.</h2>
        </div>
        <router-link to="/clubs" class="community-text-link">All clubs <i class="bi bi-arrow-up-right" aria-hidden="true"></i></router-link>
      </div>
      <div v-if="clubsError" class="community-empty" role="alert">
        <p>We couldn't load the clubs.</p>
        <button type="button" class="community-text-link" @click="loadClubs">Try again</button>
      </div>
      <p v-else-if="!clubs.length" class="community-inline-message">Clubs will appear here when they're available.</p>
      <div v-else class="community-clubs">
        <router-link v-for="club in clubs" :key="club.id" :to="`/clubs/${club.id}`" class="community-club">
          <img v-if="club.logo && !failedClubImages.has(club.id)" :src="club.logo" alt="" width="64" height="64" loading="lazy" decoding="async" @error="failedClubImages.add(club.id)" />
          <span v-else class="community-club__initial" aria-hidden="true">{{ (club.name || 'C').charAt(0) }}</span>
          <span class="community-club__text"><span>{{ club.city || club.region }}</span><h3>{{ club.name }}</h3></span>
          <i class="bi bi-arrow-up-right" aria-hidden="true"></i>
        </router-link>
      </div>
    </section>

    <section class="container community-welcome" aria-labelledby="welcome-title">
      <div class="community-welcome__intro">
        <p class="community-eyebrow">New around here?</p>
        <h2 id="welcome-title">Your kind of people.<br />Your kind of plans.</h2>
        <p>You don't need a show car to start exploring. Find something that interests you, check the details, and make a plan.</p>
        <router-link v-if="!authStore.isAuthenticated" to="/register" class="community-button community-button--red">Join the community <i class="bi bi-arrow-up-right" aria-hidden="true"></i></router-link>
        <router-link v-else to="/my-events" class="community-button community-button--red">Your RSVPs &amp; saved events <i class="bi bi-arrow-up-right" aria-hidden="true"></i></router-link>
      </div>
      <ol class="community-welcome__steps">
        <li><span aria-hidden="true">01</span><div><h3>Find your thing</h3><p>Browse by location, date, or the kind of event you enjoy.</p></div></li>
        <li><span aria-hidden="true">02</span><div><h3>Know before you go</h3><p>Check entry requirements and costs. Sign in for the exact address and organizer contact.</p></div></li>
        <li><span aria-hidden="true">03</span><div><h3>Make it a plan</h3><p>RSVP when you're ready, or save the event details for offline access.</p></div></li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.community-home {
  --community-bg: #101110;
  --community-surface: #171917;
  --community-text: #f4f2eb;
  --community-muted: #b3b5ac;
  --community-border: #343731;
  --community-accent: #ff5a1f;
  --community-button: #ff5a1f;
  --apex-bg-surface: var(--community-bg);
  --apex-bg-elevated: var(--community-surface);
  --apex-text-primary: var(--community-text);
  --apex-text-muted: var(--community-muted);
  --apex-border-strong: var(--community-border);
  --apex-red: var(--community-accent);
  background: var(--community-bg);
  color: var(--community-text);
}
:global([data-bs-theme='light']) .community-home {
  --community-bg: #f7f6f2;
  --community-surface: #eeeee7;
  --community-text: #1c211d;
  --community-muted: #575e55;
  --community-border: #cdd0c6;
  --community-accent: #c2410c;
}
.community-eyebrow { display: flex; align-items: center; gap: 0.6rem; margin: 0 0 1rem; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.community-eyebrow::before { content: ''; flex: none; width: 6px; height: 6px; background: var(--community-accent); }
.community-hero { position: relative; isolation: isolate; overflow: hidden; background: #101110; color: #f4f2eb; }
.community-hero__image { position: absolute; inset: 0 0 0 auto; width: 78%; height: 100%; object-fit: cover; object-position: 58% 60%; z-index: -2; }
.community-hero__shade { position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, #101110 3%, rgba(16,17,16,0.8) 23%, rgba(16,17,16,0.08) 72%), linear-gradient(0deg, #101110 0%, rgba(16,17,16,0.05) 65%); }
.community-hero__inner { position: relative; min-height: 680px; padding-top: 3.5rem; padding-bottom: 3rem; display: flex; flex-direction: column; align-items: flex-start; }
.community-hero__eyebrow { color: #e1e2d9; --community-accent: #ff5a1f; }
.community-hero__eyebrow span { margin: 0 0.7rem; color: #ff5a1f; }
.community-hero h1 { margin: 3.1rem 0 2rem; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: clamp(3rem, 6.4vw, 6rem); font-weight: 700; letter-spacing: -0.06em; line-height: 0.95; text-transform: uppercase; }
.community-hero h1 span { color: #ff5a1f; }
.community-hero__footer { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 1.5rem 3rem; margin-top: auto; }
.community-hero__footer p { margin: 0; font-size: 0.95rem; line-height: 1.7; color: #dddcd4; }
.community-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; width: min(100%, 31rem); margin: 2rem 0 0; padding: 0; }
.community-stats > div { position: relative; padding: 0.9rem 1rem; border: 1px solid rgba(244,242,235,0.22); background: rgba(16,17,16,0.62); backdrop-filter: blur(4px); }
.community-stats > div::before, .community-stats > div::after { content: ''; position: absolute; width: 4px; height: 4px; background: #f4f2eb; }
.community-stats > div::before { top: -2px; left: -2px; }
.community-stats > div::after { bottom: -2px; right: -2px; }
.community-stats dd { margin: 0; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; color: #f4f2eb; }
.community-stats dt { order: 2; margin-top: 0.3rem; color: #d7d8cf; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.6rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; }
.community-stats > div { display: flex; flex-direction: column; }
@media (min-width: 1200px) { .community-stats { position: absolute; right: 0.75rem; bottom: 3rem; margin: 0; } .community-hero__note { top: 3.5rem; bottom: auto; } }
.community-hero__note { position: absolute; bottom: 3rem; right: 0.75rem; font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: #d7d8cf; }
.community-button { display: inline-flex; align-items: center; justify-content: space-between; gap: 1.8rem; min-height: 48px; padding: 0.85rem 1.25rem; border: 1px solid var(--community-border); border-radius: 0; background: transparent; color: var(--community-text); font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; }
.community-button--red { background: var(--community-button); border-color: var(--community-button); color: #101110; }
.community-button:hover { background: var(--community-surface); }
.community-button--red:hover { background: #e84a10; border-color: #e84a10; color: #101110; }
.community-text-link { display: inline-flex; align-items: center; gap: 0.8rem; min-height: 44px; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; font-size: 0.85rem; font-weight: 600; text-decoration: none; }
.community-text-link:hover { text-decoration: underline; text-underline-offset: 0.3em; }
.community-discovery { padding: 2.1rem 0 2.5rem; border-bottom: 1px solid var(--community-border); scroll-margin-top: 7rem; }
.community-search-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 1rem; margin-bottom: 1rem; }
.community-search-heading h2 { margin: 0; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; text-transform: uppercase; }
.community-search { display: grid; grid-template-columns: 1.4fr 1.1fr 1fr 1fr auto; gap: 1.2rem; align-items: end; }
.community-search__field { min-width: 0; }
.community-search label { display: block; margin-bottom: 0.55rem; color: var(--community-muted); font-size: 0.75rem; }
.community-search input, .community-search select { width: 100%; min-width: 0; min-height: 48px; padding: 0.65rem 0.65rem; border: 1px solid var(--community-border); border-radius: 0; color: var(--community-text); background: var(--community-bg); font: inherit; font-size: 0.85rem; color-scheme: dark; }
.community-search input::placeholder { color: var(--community-muted); opacity: 1; }
:global([data-bs-theme='light']) .community-search input, :global([data-bs-theme='light']) .community-search select { color-scheme: light; }
.community-section { padding-top: 5rem; padding-bottom: 5rem; }
.community-section-heading { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 1rem 2rem; margin-bottom: 2.2rem; }
.community-section-heading .community-eyebrow { color: var(--community-muted); margin-bottom: 0.65rem; }
.community-section h2, .community-welcome h2 { margin: 0; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: clamp(1.8rem, 3.5vw, 3.1rem); font-weight: 700; letter-spacing: -0.055em; line-height: 1.05; text-transform: uppercase; }
.community-section-intro { max-width: 33ch; margin: 0; color: var(--community-muted); font-size: 0.9rem; line-height: 1.7; }
.community-empty { padding: 2.5rem; border: 1px solid var(--community-border); }
.community-empty h3 { font-size: 1.3rem; }
.community-empty p, .community-inline-message { color: var(--community-muted); font-size: 0.9rem; line-height: 1.7; }
.community-inline-message { margin: 1rem 0 0; }
.community-inline-message button { margin-left: 0.5rem; }
.community-scene-section { --community-bg: #f1efe9; --community-surface: #e6e3da; --community-text: #101110; --community-muted: #4d514b; --community-border: #c9c6bb; --community-accent: #c2410c; background: var(--community-bg); color: var(--community-text); }
:global([data-bs-theme='light']) .community-scene-section { --community-bg: #101110; --community-surface: #1b1d1b; --community-text: #f4f2eb; --community-muted: #b3b5ac; --community-border: #343731; --community-accent: #ff5a1f; }
.community-scenes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.community-scene { display: flex; flex-direction: column; justify-content: space-between; gap: 2.5rem; min-width: 0; min-height: 11rem; padding: 1.25rem; border: 1px solid var(--community-border); color: inherit; background: var(--community-surface); text-align: left; position: relative; }
.community-scene:first-child { background: #ff5a1f; border-color: #ff5a1f; color: #101110; --community-accent: #101110; --community-muted: #101110; }
.community-scene__index { color: var(--community-accent); font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.7rem; font-variant-numeric: tabular-nums; }
.community-scene__index::before { content: '['; }
.community-scene__index::after { content: ']'; }
.community-scene__content { display: flex; flex-direction: column; gap: 0.45rem; }
.community-scene strong { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 1.15rem; font-weight: 700; letter-spacing: -0.03em; text-transform: uppercase; }
.community-scene__content > span { color: var(--community-muted); font-size: 0.8rem; line-height: 1.5; }
.community-scene > i { position: absolute; top: 1.15rem; right: 1.25rem; font-size: 1rem; }
.community-scene:hover { border-color: var(--community-accent); }
.community-scene:hover strong { text-decoration: underline; text-underline-offset: 0.2em; }
.community-clubs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 2.5rem; }
.community-club { display: flex; align-items: center; gap: 1rem; padding: 1.5rem 0; min-width: 0; border-top: 1px solid var(--community-border); color: inherit; text-decoration: none; }
.community-club img, .community-club__initial { flex-shrink: 0; width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
.community-club__initial { display: grid; place-items: center; background: var(--community-surface); font-size: 1.5rem; }
.community-club__text { flex: 1; min-width: 0; }
.community-club__text > span { font-size: 0.7rem; color: var(--community-muted); }
.community-club h3 { margin: 0.3rem 0 0; font-size: 0.95rem; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
.community-club:hover h3 { text-decoration: underline; text-underline-offset: 0.2em; }
.community-welcome { display: grid; grid-template-columns: 1.1fr 1fr; gap: 5rem; padding-top: 3.5rem; padding-bottom: 4rem; border-top: 1px solid var(--community-border); }
.community-welcome__intro > p:not(.community-eyebrow) { max-width: 44ch; margin: 1.5rem 0; color: var(--community-muted); font-size: 0.95rem; line-height: 1.8; }
.community-welcome__steps { margin: 0; padding: 0; list-style: none; }
.community-welcome__steps li { display: flex; gap: 1.5rem; padding: 1.25rem 0; border-bottom: 1px solid var(--community-border); }
.community-welcome__steps li > span { min-width: 3.2rem; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 2rem; font-weight: 700; line-height: 1; letter-spacing: -0.06em; color: var(--community-accent); }
.community-welcome__steps h3 { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.95rem; font-weight: 700; text-transform: uppercase; }
.community-welcome__steps p { margin: 0; color: var(--community-muted); font-size: 0.85rem; line-height: 1.7; }
.community-home :is(a, button, input, select):focus-visible { outline: 2px solid var(--community-accent); outline-offset: 4px; }
.community-hero :is(a, button):focus-visible { outline-color: #fff; }
@media (min-width: 1400px) { .community-hero__inner { min-height: 740px; } }
@media (max-width: 1199.98px) {
  .community-search { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .community-search__keyword { grid-column: span 2; }
  .community-search > button { grid-column: span 2; }
  .community-hero__note { display: none; }
  .community-clubs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 767.98px) {
  .community-hero__inner { min-height: 670px; padding-top: 2rem; padding-bottom: 2rem; }
  .community-hero__image { width: 100%; height: 64%; object-position: 60% center; }
  .community-hero__shade { background: linear-gradient(0deg, #101110 30%, rgba(16,17,16,0) 77%), linear-gradient(180deg, rgba(16,17,16,0.7), transparent 30%); }
  .community-hero__eyebrow { font-size: 0.6rem; letter-spacing: 0.07em; }
  .community-hero__eyebrow span { margin-inline: 0.3rem; }
  .community-hero h1 { margin-top: 13rem; margin-bottom: 1.6rem; font-size: clamp(2.5rem, 10vw, 4.4rem); }
  .community-stats { margin-top: 1.5rem; }
  .community-stats dd { font-size: 1.2rem; }
  .community-hero__footer { gap: 1.25rem; }
  .community-hero__footer p { font-size: 0.85rem; }
  .community-hero__footer .community-button { gap: 2.5rem; }
  .community-search { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
  .community-search__keyword, .community-search > button { grid-column: 1 / -1; }
  .community-search__field:has(#home-date) { grid-column: 1 / -1; }
  .community-section { padding-top: 3rem; padding-bottom: 3rem; }
  .community-section-heading { margin-bottom: 1.5rem; }
  .community-eyebrow { font-size: 0.65rem; }
  .community-scenes { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .community-scene { gap: 1.25rem; min-height: 9rem; padding: 1rem; }
  .community-scene strong { font-size: 0.95rem; }
  .community-scene__content > span { font-size: 0.75rem; line-height: 1.5; }
  .community-clubs { grid-template-columns: minmax(0, 1fr); }
  .community-welcome { grid-template-columns: minmax(0, 1fr); gap: 2rem; padding-top: 2.5rem; padding-bottom: 3rem; }
}
</style>
