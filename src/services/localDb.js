/**
 * ApexGrid — Stateful Local Relational Engine (Mirrors api/index.php + MariaDB)
 * Persists all CRUD changes, registrations, RSVPs, likes, comments, and role updates
 * to localStorage ('apexgrid_db_v1') when running locally without PHP/Apache.
 */

import { INITIAL_SEED_DATA } from '../data/seedData'

const DB_STORAGE_KEY = 'apexgrid_db_v1'

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export function getDb() {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.events) && Array.isArray(parsed.users)) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Failed to parse local DB, resetting to seed:', err)
  }
  const initial = clone(INITIAL_SEED_DATA)
  saveDb(initial)
  return initial
}

export function saveDb(db) {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db))
  } catch (err) {
    console.warn('Could not persist local DB:', err)
  }
}

export function resetLocalDb() {
  const initial = clone(INITIAL_SEED_DATA)
  saveDb(initial)
  return initial
}

export function getLocalDbStats() {
  const db = getDb()
  return {
    users: (db.users || []).length,
    events: (db.events || []).length,
    clubs: (db.clubs || []).length,
    categories: (db.categories || []).length,
    rsvps: (db.rsvps || []).length,
    likes: (db.event_likes || []).length,
    comments: (db.comments || []).length
  }
}

export function exportLocalDbJson() {
  const db = getDb()
  const safeUsers = (db.users || []).map(({ password: _, ...u }) => u)
  return JSON.stringify({ ...db, users: safeUsers, exported_at: new Date().toISOString() }, null, 2)
}

/**
 * Haversine distance formula in kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 === null ||
    lon1 === null ||
    lat2 === null ||
    lon2 === null ||
    Number.isNaN(Number(lat1)) ||
    Number.isNaN(Number(lon1))
  ) {
    return null
  }
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

/**
 * Encode/decode lightweight JWT token for local engine
 */
export function createLocalJwt(user) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
    })
  )
  const signature = btoa(`apexgrid_sig_${user.id}_${user.role}`)
  return `${header}.${payload}.${signature}`
}

export function decodeLocalJwt(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

function nowSqlString() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * Enrich an event row with joined category, club, organizer, social counts,
 * and apply Guest vs Member visibility rules.
 */
function enrichEvent(event, db, currentUser, refCoords = null) {
  const category = db.categories.find((c) => c.id === Number(event.category_id)) || {
    name: 'Meet',
    slug: 'meet',
    badge_color: 'info',
    icon: 'bi-calendar-event'
  }
  const club = db.clubs.find((cl) => cl.id === Number(event.club_id)) || null
  const organizer = db.users.find((u) => u.id === Number(event.organizer_id)) || null

  const eventRsvps = db.rsvps.filter((r) => Number(r.event_id) === Number(event.id))
  const going_count = eventRsvps.filter((r) => r.status === 'going').length
  const interested_count = eventRsvps.filter((r) => r.status === 'interested').length
  const likes_count = db.event_likes.filter((l) => Number(l.event_id) === Number(event.id)).length
  const eventComments = db.comments.filter((cm) => Number(cm.event_id) === Number(event.id))
  const comments_count = eventComments.length

  const ratedComments = eventComments.filter((cm) => cm.rating && Number(cm.rating) > 0)
  const avg_rating =
    ratedComments.length > 0
      ? Math.round(
          (ratedComments.reduce((acc, cm) => acc + Number(cm.rating), 0) / ratedComments.length) * 10
        ) / 10
      : null

  const isAuth = Boolean(currentUser && currentUser.id)
  const userRsvp = isAuth
    ? eventRsvps.find((r) => Number(r.user_id) === Number(currentUser.id))
    : null
  const userLiked = isAuth
    ? db.event_likes.some(
        (l) => Number(l.event_id) === Number(event.id) && Number(l.user_id) === Number(currentUser.id)
      )
    : false

  const distance_km =
    refCoords && refCoords.lat != null && refCoords.lng != null
      ? calculateDistanceKm(refCoords.lat, refCoords.lng, event.latitude, event.longitude)
      : null

  return {
    ...event,
    id: Number(event.id),
    category_id: Number(event.category_id),
    club_id: event.club_id ? Number(event.club_id) : null,
    organizer_id: Number(event.organizer_id),
    latitude: Number(event.latitude),
    longitude: Number(event.longitude),
    price: Number(event.price),
    capacity: Number(event.capacity),
    category_name: category.name,
    category_slug: category.slug,
    badge_color: category.badge_color,
    category_icon: category.icon,
    club_name: club ? club.name : 'Independent Organizer',
    organizer_name: organizer ? organizer.name : 'Track Marshal',
    going_count,
    interested_count,
    likes_count,
    comments_count,
    avg_rating,
    user_rsvp_status: userRsvp ? userRsvp.status : null,
    user_liked: userLiked,
    distance_km,
    address_locked: !isAuth,
    address: isAuth
      ? event.address
      : 'Members Only — Sign in to unlock exact paddock/street address',
    organizer_contact: isAuth
      ? event.organizer_contact
      : 'Members Only — Sign in to view organizer phone & email'
  }
}

/**
 * Handle REST requests locally with identical response format to api/index.php
 */
export async function handleLocalRequest(method, endpoint, params = {}, body = {}, token = null) {
  const db = getDb()
  const decoded = decodeLocalJwt(token)
  const currentUser = decoded ? db.users.find((u) => u.id === Number(decoded.id)) || decoded : null
  const cleanEndpoint = '/' + String(endpoint || '').replace(/^\/+|\/+$/g, '')
  const upperMethod = String(method || 'GET').toUpperCase()

  const requireAuth = (roles = []) => {
    if (!currentUser) {
      const err = new Error('Authentication required. Please log in.')
      err.status = 401
      throw err
    }
    if (roles.length > 0 && !roles.includes(currentUser.role)) {
      const err = new Error('Forbidden: insufficient role permissions.')
      err.status = 403
      throw err
    }
    return currentUser
  }

  // 1. AUTH
  if (cleanEndpoint === '/auth/register' && upperMethod === 'POST') {
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const role = ['member', 'organizer'].includes(body.role) ? body.role : 'member'
    const region = body.region || 'Australia'

    if (!name || !email || password.length < 8) {
      const err = new Error('Name, valid email, and password (min 8 characters) are required.')
      err.status = 400
      throw err
    }
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      const err = new Error('An account with that email address already exists.')
      err.status = 409
      throw err
    }

    const nextId = db.users.reduce((max, u) => Math.max(max, Number(u.id)), 0) + 1
    const newUser = {
      id: nextId,
      name,
      email,
      password,
      role,
      oauth_provider: null,
      oauth_id: null,
      vehicle: body.vehicle ? String(body.vehicle).trim() : null,
      avatar:
        body.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
      region,
      bio: body.bio || `${role === 'organizer' ? 'Event Organizer' : 'Motorsport Member'} based in ${region}.`,
      created_at: nowSqlString()
    }
    db.users.push(newUser)
    saveDb(db)

    const { password: _, ...safeUser } = newUser
    return { token: createLocalJwt(safeUser), user: safeUser }
  }

  if (cleanEndpoint === '/auth/login' && upperMethod === 'POST') {
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const user = db.users.find((u) => u.email.toLowerCase() === email)

    if (!user || user.password !== password) {
      const err = new Error('Invalid email or password.')
      err.status = 401
      throw err
    }
    const { password: _, ...safeUser } = user
    return { token: createLocalJwt(safeUser), user: safeUser }
  }

  if (cleanEndpoint === '/auth/oauth' && upperMethod === 'POST') {
    const provider = ['google', 'github', 'discord'].includes(
      String(body.provider || '').toLowerCase()
    )
      ? String(body.provider).toLowerCase()
      : 'google'

    let email = String(body.email || '').trim().toLowerCase()
    let name = String(body.name || '').trim()
    let oauthId = String(body.oauth_id || '').trim()
    let avatar = body.avatar || ''

    // Support decoding Google Identity Services id_token if provided
    if (body.id_token && typeof body.id_token === 'string') {
      const parts = body.id_token.split('.')
      if (parts.length === 3) {
        try {
          const decoded = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
          if (!email && decoded.email) email = String(decoded.email).toLowerCase()
          if (!name && decoded.name) name = String(decoded.name)
          if (!oauthId && decoded.sub) oauthId = String(decoded.sub)
          if (!avatar && decoded.picture) avatar = String(decoded.picture)
        } catch {
          // ignore malformed token in fallback
        }
      }
    }

    if (!email || !name) {
      const err = new Error('OAuth provider email and display name are required.')
      err.status = 400
      throw err
    }

    const existingIdx = db.users.findIndex((u) => u.email.toLowerCase() === email)
    if (existingIdx !== -1) {
      db.users[existingIdx] = {
        ...db.users[existingIdx],
        oauth_provider: provider,
        oauth_id: oauthId || db.users[existingIdx].oauth_id || `${provider}_${db.users[existingIdx].id}`
      }
      saveDb(db)
      const { password: _, ...safeUser } = db.users[existingIdx]
      return { token: createLocalJwt(safeUser), user: safeUser, is_new_user: false }
    }

    const nextId = db.users.reduce((max, u) => Math.max(max, Number(u.id)), 0) + 1
    const role = ['member', 'organizer'].includes(body.role) ? body.role : 'member'
    const region = body.region || 'Australia'
    const newUser = {
      id: nextId,
      name,
      email,
      password: 'Password123!',
      role,
      oauth_provider: provider,
      oauth_id: oauthId || `${provider}_${nextId}`,
      vehicle: body.vehicle ? String(body.vehicle).trim() : null,
      avatar:
        avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
      region,
      bio:
        body.bio ||
        `Authenticated via ${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth 2.0 on ApexGrid.`,
      created_at: nowSqlString()
    }
    db.users.push(newUser)
    saveDb(db)
    const { password: _, ...safeUser } = newUser
    return { token: createLocalJwt(safeUser), user: safeUser, is_new_user: true }
  }

  if (cleanEndpoint === '/auth/me' && upperMethod === 'GET') {
    const auth = requireAuth()
    const user = db.users.find((u) => Number(u.id) === Number(auth.id))
    if (!user) {
      const err = new Error('User not found.')
      err.status = 404
      throw err
    }
    const { password: _, ...safeUser } = user
    return { user: safeUser }
  }

  if (cleanEndpoint === '/auth/profile' && upperMethod === 'PUT') {
    const auth = requireAuth()
    const idx = db.users.findIndex((u) => Number(u.id) === Number(auth.id))
    if (idx === -1) {
      const err = new Error('User not found.')
      err.status = 404
      throw err
    }
    db.users[idx] = {
      ...db.users[idx],
      name: body.name ? String(body.name).trim() : db.users[idx].name,
      region: body.region || db.users[idx].region,
      vehicle: body.vehicle !== undefined ? String(body.vehicle || '').trim() : db.users[idx].vehicle,
      bio: body.bio !== undefined ? String(body.bio).trim() : db.users[idx].bio,
      avatar: body.avatar || db.users[idx].avatar
    }
    saveDb(db)
    const { password: _, ...safeUser } = db.users[idx]
    return { user: safeUser, message: 'Profile updated successfully.' }
  }

  // 2. CATEGORIES
  if (cleanEndpoint === '/categories' && upperMethod === 'GET') {
    return { data: db.categories }
  }

  // 3. EVENTS COLLECTION & CRUD
  if (cleanEndpoint === '/events' && upperMethod === 'GET') {
    const search = String(params.search || '').trim().toLowerCase()
    const category = String(params.category || '').trim().toLowerCase()
    const region = String(params.region || '').trim()
    const status = String(params.status || '').trim().toLowerCase()
    const clubId = params.club_id ? Number(params.club_id) : null
    const organizerId = params.organizer_id ? Number(params.organizer_id) : null
    const dateFrom = String(params.date_from || '').trim()
    const maxPrice =
      params.max_price !== undefined && params.max_price !== '' && params.max_price !== null
        ? Number(params.max_price)
        : null
    const sort = String(params.sort || 'date').trim()
    const page = Math.max(1, Number(params.page || 1))
    const limit = Math.max(1, Math.min(100, Number(params.limit || 6)))

    const refCoords =
      params.lat !== undefined && params.lng !== undefined
        ? { lat: Number(params.lat), lng: Number(params.lng) }
        : currentUser && currentUser.region === 'Malaysia'
          ? { lat: 2.7608, lng: 101.7383 }
          : { lat: -37.8136, lng: 144.9631 }

    let items = db.events.map((ev) => enrichEvent(ev, db, currentUser, refCoords))

    if (search) {
      items = items.filter(
        (ev) =>
          ev.title.toLowerCase().includes(search) ||
          ev.venue.toLowerCase().includes(search) ||
          ev.description.toLowerCase().includes(search) ||
          ev.club_name.toLowerCase().includes(search) ||
          ev.region.toLowerCase().includes(search)
      )
    }
    if (category && category !== 'all') {
      items = items.filter(
        (ev) => ev.category_slug === category || String(ev.category_id) === category
      )
    }
    if (region && region.toLowerCase() !== 'all') {
      items = items.filter((ev) => ev.region.toLowerCase() === region.toLowerCase())
    }
    if (status && status !== 'all') {
      items = items.filter((ev) => ev.status.toLowerCase() === status)
    }
    if (clubId) {
      items = items.filter((ev) => Number(ev.club_id) === clubId)
    }
    if (organizerId) {
      items = items.filter((ev) => Number(ev.organizer_id) === organizerId)
    }
    if (dateFrom) {
      items = items.filter((ev) => ev.start_datetime >= `${dateFrom} 00:00:00`)
    }
    if (maxPrice !== null && !Number.isNaN(maxPrice)) {
      items = items.filter((ev) => Number(ev.price) <= maxPrice)
    }

    if (sort === 'popularity') {
      items.sort(
        (a, b) =>
          b.going_count + b.likes_count - (a.going_count + a.likes_count) ||
          a.start_datetime.localeCompare(b.start_datetime)
      )
    } else if (sort === 'distance') {
      items.sort((a, b) => (a.distance_km ?? 99999) - (b.distance_km ?? 99999))
    } else if (sort === 'price_asc') {
      items.sort((a, b) => a.price - b.price || a.start_datetime.localeCompare(b.start_datetime))
    } else if (sort === 'date_desc') {
      items.sort((a, b) => b.start_datetime.localeCompare(a.start_datetime))
    } else {
      items.sort((a, b) => a.start_datetime.localeCompare(b.start_datetime))
    }

    const total = items.length
    const total_pages = Math.max(1, Math.ceil(total / limit))
    const safePage = Math.min(page, total_pages)
    const startIdx = (safePage - 1) * limit
    const paginated = items.slice(startIdx, startIdx + limit)

    return {
      data: paginated,
      page: safePage,
      limit,
      total,
      total_pages
    }
  }

  if (cleanEndpoint === '/events' && upperMethod === 'POST') {
    const auth = requireAuth(['organizer', 'admin'])
    const nextId = db.events.reduce((max, e) => Math.max(max, Number(e.id)), 0) + 1
    const newEvent = {
      id: nextId,
      title: String(body.title || '').trim(),
      description: String(body.description || '').trim(),
      category_id: Number(body.category_id || 1),
      club_id: body.club_id ? Number(body.club_id) : null,
      organizer_id: Number(auth.id),
      region: body.region || 'Australia',
      venue: String(body.venue || '').trim(),
      address: String(body.address || '').trim(),
      organizer_contact:
        String(body.organizer_contact || '').trim() || `${auth.name} — ${auth.email}`,
      latitude: Number(body.latitude ?? -37.8136),
      longitude: Number(body.longitude ?? 144.9631),
      start_datetime: String(body.start_datetime || nowSqlString()).replace('T', ' '),
      end_datetime: String(body.end_datetime || nowSqlString()).replace('T', ' '),
      price: Number(body.price ?? 0),
      capacity: Number(body.capacity ?? 60),
      image:
        body.image ||
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900&auto=format&fit=crop&q=80',
      status: body.status || 'upcoming',
      created_at: nowSqlString()
    }
    db.events.push(newEvent)
    saveDb(db)
    return {
      id: nextId,
      data: enrichEvent(newEvent, db, currentUser),
      message: 'Event created successfully.'
    }
  }

  const eventIdMatch = cleanEndpoint.match(/^\/events\/(\d+)$/)
  if (eventIdMatch) {
    const eventId = Number(eventIdMatch[1])
    const idx = db.events.findIndex((e) => Number(e.id) === eventId)
    if (idx === -1) {
      const err = new Error('Event not found.')
      err.status = 404
      throw err
    }

    if (upperMethod === 'GET') {
      return { data: enrichEvent(db.events[idx], db, currentUser) }
    }

    if (upperMethod === 'PUT') {
      const auth = requireAuth(['organizer', 'admin'])
      if (auth.role !== 'admin' && Number(db.events[idx].organizer_id) !== Number(auth.id)) {
        const err = new Error('You can only edit events that you organized.')
        err.status = 403
        throw err
      }
      db.events[idx] = {
        ...db.events[idx],
        title: body.title !== undefined ? String(body.title).trim() : db.events[idx].title,
        description:
          body.description !== undefined
            ? String(body.description).trim()
            : db.events[idx].description,
        category_id:
          body.category_id !== undefined ? Number(body.category_id) : db.events[idx].category_id,
        club_id:
          body.club_id !== undefined
            ? body.club_id
              ? Number(body.club_id)
              : null
            : db.events[idx].club_id,
        region: body.region !== undefined ? body.region : db.events[idx].region,
        venue: body.venue !== undefined ? String(body.venue).trim() : db.events[idx].venue,
        address:
          body.address !== undefined && !body.address.startsWith('Members Only')
            ? String(body.address).trim()
            : db.events[idx].address,
        organizer_contact:
          body.organizer_contact !== undefined &&
          !body.organizer_contact.startsWith('Members Only')
            ? String(body.organizer_contact).trim()
            : db.events[idx].organizer_contact,
        latitude: body.latitude !== undefined ? Number(body.latitude) : db.events[idx].latitude,
        longitude: body.longitude !== undefined ? Number(body.longitude) : db.events[idx].longitude,
        start_datetime:
          body.start_datetime !== undefined
            ? String(body.start_datetime).replace('T', ' ')
            : db.events[idx].start_datetime,
        end_datetime:
          body.end_datetime !== undefined
            ? String(body.end_datetime).replace('T', ' ')
            : db.events[idx].end_datetime,
        price: body.price !== undefined ? Number(body.price) : db.events[idx].price,
        capacity: body.capacity !== undefined ? Number(body.capacity) : db.events[idx].capacity,
        image: body.image !== undefined ? body.image : db.events[idx].image,
        status: body.status !== undefined ? body.status : db.events[idx].status
      }
      saveDb(db)
      return {
        data: enrichEvent(db.events[idx], db, currentUser),
        message: 'Event updated successfully.'
      }
    }

    if (upperMethod === 'DELETE') {
      const auth = requireAuth(['organizer', 'admin'])
      if (auth.role !== 'admin' && Number(db.events[idx].organizer_id) !== Number(auth.id)) {
        const err = new Error('You can only delete events that you organized.')
        err.status = 403
        throw err
      }
      db.events.splice(idx, 1)
      db.rsvps = db.rsvps.filter((r) => Number(r.event_id) !== eventId)
      db.event_likes = db.event_likes.filter((l) => Number(l.event_id) !== eventId)
      db.comments = db.comments.filter((c) => Number(c.event_id) !== eventId)
      saveDb(db)
      return { message: 'Event deleted successfully.' }
    }
  }

  // 4. RSVPs, LIKES & COMMENTS
  const rsvpMatch = cleanEndpoint.match(/^\/events\/(\d+)\/rsvp$/)
  if (rsvpMatch) {
    const auth = requireAuth()
    const eventId = Number(rsvpMatch[1])
    db.rsvps = db.rsvps.filter(
      (r) => !(Number(r.event_id) === eventId && Number(r.user_id) === Number(auth.id))
    )
    if (upperMethod === 'POST') {
      const status = body.status === 'interested' ? 'interested' : 'going'
      const nextId = db.rsvps.reduce((max, r) => Math.max(max, Number(r.id)), 0) + 1
      db.rsvps.push({
        id: nextId,
        event_id: eventId,
        user_id: Number(auth.id),
        status,
        created_at: nowSqlString()
      })
      saveDb(db)
      return { status, message: `RSVP updated to "${status}".` }
    }
    if (upperMethod === 'DELETE') {
      saveDb(db)
      return { status: null, message: 'RSVP cancelled.' }
    }
  }

  if (cleanEndpoint === '/users/me/rsvps' && upperMethod === 'GET') {
    const auth = requireAuth()
    const userRsvps = db.rsvps.filter((r) => Number(r.user_id) === Number(auth.id))
    const userLikes = db.event_likes.filter((l) => Number(l.user_id) === Number(auth.id))

    const rsvpEvents = userRsvps
      .map((r) => {
        const ev = db.events.find((e) => Number(e.id) === Number(r.event_id))
        return ev ? { ...enrichEvent(ev, db, currentUser), rsvp_status: r.status } : null
      })
      .filter(Boolean)

    const likedEvents = userLikes
      .map((l) => {
        const ev = db.events.find((e) => Number(e.id) === Number(l.event_id))
        return ev ? enrichEvent(ev, db, currentUser) : null
      })
      .filter(Boolean)

    return {
      rsvps: userRsvps,
      likes: userLikes,
      rsvp_events: rsvpEvents,
      liked_events: likedEvents
    }
  }

  const likeMatch = cleanEndpoint.match(/^\/events\/(\d+)\/like$/)
  if (likeMatch) {
    const auth = requireAuth()
    const eventId = Number(likeMatch[1])
    db.event_likes = db.event_likes.filter(
      (l) => !(Number(l.event_id) === eventId && Number(l.user_id) === Number(auth.id))
    )
    if (upperMethod === 'POST') {
      const nextId = db.event_likes.reduce((max, l) => Math.max(max, Number(l.id)), 0) + 1
      db.event_likes.push({
        id: nextId,
        event_id: eventId,
        user_id: Number(auth.id),
        created_at: nowSqlString()
      })
      saveDb(db)
      return { liked: true }
    }
    if (upperMethod === 'DELETE') {
      saveDb(db)
      return { liked: false }
    }
  }

  const commentsMatch = cleanEndpoint.match(/^\/events\/(\d+)\/comments$/)
  if (commentsMatch) {
    const eventId = Number(commentsMatch[1])
    if (upperMethod === 'GET') {
      const rows = db.comments
        .filter((c) => Number(c.event_id) === eventId)
        .map((c) => {
          const u = db.users.find((usr) => Number(usr.id) === Number(c.user_id))
          return {
            ...c,
            user_name: u ? u.name : 'Member',
            user_avatar: u ? u.avatar : '',
            user_role: u ? u.role : 'member'
          }
        })
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
      return { data: rows }
    }

    if (upperMethod === 'POST') {
      const auth = requireAuth()
      const text = String(body.body || '').trim()
      const rating = body.rating ? Math.min(5, Math.max(1, Number(body.rating))) : null
      if (!text) {
        const err = new Error('Comment text cannot be empty.')
        err.status = 400
        throw err
      }
      const nextId = db.comments.reduce((max, c) => Math.max(max, Number(c.id)), 0) + 1
      const newComment = {
        id: nextId,
        event_id: eventId,
        user_id: Number(auth.id),
        body: text,
        rating,
        created_at: nowSqlString()
      }
      db.comments.push(newComment)
      saveDb(db)
      return {
        data: {
          ...newComment,
          user_name: auth.name,
          user_avatar: auth.avatar,
          user_role: auth.role
        },
        message: 'Comment posted.'
      }
    }
  }

  const deleteCommentMatch = cleanEndpoint.match(/^\/comments\/(\d+)$/)
  if (deleteCommentMatch && upperMethod === 'DELETE') {
    const auth = requireAuth()
    const commentId = Number(deleteCommentMatch[1])
    const idx = db.comments.findIndex((c) => Number(c.id) === commentId)
    if (idx !== -1) {
      if (auth.role !== 'admin' && Number(db.comments[idx].user_id) !== Number(auth.id)) {
        const err = new Error('You can only delete your own comments.')
        err.status = 403
        throw err
      }
      db.comments.splice(idx, 1)
      saveDb(db)
    }
    return { message: 'Comment deleted.' }
  }

  // 5. CLUBS
  if (cleanEndpoint === '/clubs' && upperMethod === 'GET') {
    const region = String(params.region || '').trim()
    const search = String(params.search || '').trim().toLowerCase()

    let rows = db.clubs.map((cl) => {
      const owner = db.users.find((u) => Number(u.id) === Number(cl.owner_id))
      const clubEvents = db.events.filter((e) => Number(e.club_id) === Number(cl.id))
      const totalRsvps = clubEvents.reduce((sum, ev) => {
        return (
          sum + db.rsvps.filter((r) => Number(r.event_id) === Number(ev.id) && r.status === 'going').length
        )
      }, 0)
      return {
        ...cl,
        owner_name: owner ? owner.name : 'Club Director',
        events_count: clubEvents.length,
        total_rsvps: totalRsvps
      }
    })

    if (region && region.toLowerCase() !== 'all') {
      rows = rows.filter((cl) => cl.region.toLowerCase() === region.toLowerCase())
    }
    if (search) {
      rows = rows.filter(
        (cl) =>
          cl.name.toLowerCase().includes(search) ||
          cl.city.toLowerCase().includes(search) ||
          cl.description.toLowerCase().includes(search)
      )
    }
    return { data: rows }
  }

  if (cleanEndpoint === '/clubs' && upperMethod === 'POST') {
    const auth = requireAuth(['organizer', 'admin'])
    const nextId = db.clubs.reduce((max, c) => Math.max(max, Number(c.id)), 0) + 1
    const newClub = {
      id: nextId,
      name: String(body.name || '').trim(),
      description: String(body.description || '').trim(),
      logo:
        body.logo ||
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80',
      region: body.region || 'Australia',
      city: body.city || 'Melbourne, VIC',
      founded_year: Number(body.founded_year || 2024),
      owner_id: Number(auth.id),
      created_at: nowSqlString()
    }
    db.clubs.push(newClub)
    saveDb(db)
    return { id: nextId, data: newClub, message: 'Club created successfully.' }
  }

  const clubIdMatch = cleanEndpoint.match(/^\/clubs\/(\d+)$/)
  if (clubIdMatch) {
    const clubId = Number(clubIdMatch[1])
    const idx = db.clubs.findIndex((c) => Number(c.id) === clubId)
    if (idx === -1) {
      const err = new Error('Club not found.')
      err.status = 404
      throw err
    }
    if (upperMethod === 'GET') {
      const cl = db.clubs[idx]
      const owner = db.users.find((u) => Number(u.id) === Number(cl.owner_id))
      const clubEvents = db.events
        .filter((e) => Number(e.club_id) === clubId)
        .map((e) => enrichEvent(e, db, currentUser))
      return {
        data: {
          ...cl,
          owner_name: owner ? owner.name : 'Club Director',
          events: clubEvents
        }
      }
    }
    if (upperMethod === 'PUT') {
      requireAuth(['organizer', 'admin'])
      db.clubs[idx] = {
        ...db.clubs[idx],
        name: body.name || db.clubs[idx].name,
        description: body.description || db.clubs[idx].description,
        logo: body.logo || db.clubs[idx].logo,
        region: body.region || db.clubs[idx].region,
        city: body.city || db.clubs[idx].city,
        founded_year: Number(body.founded_year || db.clubs[idx].founded_year)
      }
      saveDb(db)
      return { data: db.clubs[idx], message: 'Club updated.' }
    }
    if (upperMethod === 'DELETE') {
      requireAuth(['organizer', 'admin'])
      db.clubs.splice(idx, 1)
      saveDb(db)
      return { message: 'Club deleted.' }
    }
  }

  // 6. ORGANIZER ANALYTICS DASHBOARD (/dashboard/stats)
  if (cleanEndpoint === '/dashboard/stats' && upperMethod === 'GET') {
    const auth = requireAuth(['organizer', 'admin'])
    const scopeAll = params.scope === 'all' || auth.role === 'admin'
    const rawEvents = scopeAll
      ? db.events
      : db.events.filter((e) => Number(e.organizer_id) === Number(auth.id))
    const targetEvents = (rawEvents.length > 0 ? rawEvents : db.events).map((e) =>
      enrichEvent(e, db, currentUser)
    )

    // Build RSVPs over time series (by date)
    const timelineMap = {}
    db.rsvps.forEach((r) => {
      const dateKey = String(r.created_at).slice(0, 10)
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { going: 0, interested: 0 }
      }
      if (r.status === 'going') timelineMap[dateKey].going += 1
      else timelineMap[dateKey].interested += 1
    })
    const sortedDates = Object.keys(timelineMap).sort()
    let cumGoing = 0
    let cumInterested = 0
    const rsvpTimeline = sortedDates.map((date) => {
      cumGoing += timelineMap[date].going
      cumInterested += timelineMap[date].interested
      return {
        date,
        going: cumGoing,
        interested: cumInterested,
        daily_total: timelineMap[date].going + timelineMap[date].interested
      }
    })

    // Category distribution
    const categoryBreakdown = db.categories.map((cat) => {
      const catEvents = targetEvents.filter((e) => Number(e.category_id) === Number(cat.id))
      const rsvpSum = catEvents.reduce((s, e) => s + e.going_count + e.interested_count, 0)
      return {
        category: cat.name,
        events_count: catEvents.length,
        rsvps_count: rsvpSum
      }
    })

    return {
      events: targetEvents,
      rsvp_timeline: rsvpTimeline,
      category_breakdown: categoryBreakdown,
      summary: {
        total_events: targetEvents.length,
        total_going: targetEvents.reduce((s, e) => s + e.going_count, 0),
        total_interested: targetEvents.reduce((s, e) => s + e.interested_count, 0),
        total_likes: targetEvents.reduce((s, e) => s + e.likes_count, 0),
        avg_capacity_pct:
          targetEvents.length > 0
            ? Math.round(
                targetEvents.reduce(
                  (s, e) => s + Math.min(100, (e.going_count / Math.max(1, e.capacity)) * 100),
                  0
                ) / targetEvents.length
              )
            : 0
      }
    }
  }

  // 7. ADMIN PANEL ENDPOINTS (/admin/users, /admin/moderation)
  if (cleanEndpoint === '/admin/users' && upperMethod === 'GET') {
    requireAuth(['admin'])
    const users = db.users.map(({ password: _, ...u }) => ({
      ...u,
      events_organized: db.events.filter((e) => Number(e.organizer_id) === Number(u.id)).length,
      rsvps_count: db.rsvps.filter((r) => Number(r.user_id) === Number(u.id)).length,
      comments_count: db.comments.filter((c) => Number(c.user_id) === Number(u.id)).length
    }))
    return { data: users }
  }

  const userRoleMatch = cleanEndpoint.match(/^\/admin\/users\/(\d+)\/role$/)
  if (userRoleMatch && upperMethod === 'PUT') {
    requireAuth(['admin'])
    const userId = Number(userRoleMatch[1])
    const idx = db.users.findIndex((u) => Number(u.id) === userId)
    if (idx !== -1 && ['member', 'organizer', 'admin'].includes(body.role)) {
      db.users[idx].role = body.role
      saveDb(db)
    }
    return { message: 'User role updated.' }
  }

  const deleteUserMatch = cleanEndpoint.match(/^\/admin\/users\/(\d+)$/)
  if (deleteUserMatch && upperMethod === 'DELETE') {
    const auth = requireAuth(['admin'])
    const userId = Number(deleteUserMatch[1])
    if (userId === Number(auth.id)) {
      const err = new Error('Cannot delete your own active admin account.')
      err.status = 400
      throw err
    }
    db.users = db.users.filter((u) => Number(u.id) !== userId)
    db.rsvps = db.rsvps.filter((r) => Number(r.user_id) !== userId)
    db.event_likes = db.event_likes.filter((l) => Number(l.user_id) !== userId)
    db.comments = db.comments.filter((c) => Number(c.user_id) !== userId)
    saveDb(db)
    return { message: 'User removed.' }
  }

  if (cleanEndpoint === '/admin/moderation' && upperMethod === 'GET') {
    requireAuth(['admin'])
    const recentComments = db.comments
      .map((c) => {
        const u = db.users.find((usr) => Number(usr.id) === Number(c.user_id))
        const ev = db.events.find((e) => Number(e.id) === Number(c.event_id))
        return {
          ...c,
          user_name: u ? u.name : 'Unknown User',
          user_email: u ? u.email : '',
          event_title: ev ? ev.title : `Event #${c.event_id}`
        }
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))

    return {
      comments: recentComments,
      stats: {
        users_count: db.users.length,
        events_count: db.events.length,
        clubs_count: db.clubs.length,
        rsvps_count: db.rsvps.length,
        comments_count: db.comments.length
      }
    }
  }

  const err = new Error(`Unhandled API endpoint: ${upperMethod} ${cleanEndpoint}`)
  err.status = 404
  throw err
}
