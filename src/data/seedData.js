/**
 * ApexGrid — Initial Seed Data (Mirrors database/seed.sql)
 * Covers Australia (Melbourne / Victoria) and Malaysia (Sepang / Kuching / Klang Valley)
 */

export const INITIAL_SEED_DATA = {
  users: [
    {
      id: 1,
      name: 'Jacob Pillai',
      email: 'admin@apexgrid.com',
      password: 'Password123!',
      role: 'admin',
      oauth_provider: 'google',
      oauth_id: 'google_oauth_105986053',
      vehicle: '2023 Honda Civic Type R (FL5)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
      region: 'Australia',
      bio: 'Platform Administrator & Motorsport Enthusiast based between Melbourne and Sarawak.',
      created_at: '2026-08-01 09:00:00'
    },
    {
      id: 2,
      name: 'Syed Rahman',
      email: 'organizer@apexgrid.com',
      password: 'Password123!',
      role: 'organizer',
      oauth_provider: 'github',
      oauth_id: 'github_oauth_syed',
      vehicle: '2022 Porsche 911 GT3 (992)',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80',
      region: 'Australia',
      bio: 'Track Director at VicTimeAttack & Melbourne JDM Collective.',
      created_at: '2026-08-02 10:15:00'
    },
    {
      id: 3,
      name: 'Naveed Khan',
      email: 'naveed@apexgrid.com',
      password: 'Password123!',
      role: 'organizer',
      oauth_provider: 'google',
      oauth_id: 'google_oauth_naveed',
      vehicle: '2020 Nissan GT-R NISMO (R35)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
      region: 'Malaysia',
      bio: 'Lead Coordinator for Sepang Night Attack & Borneo Touge Club.',
      created_at: '2026-08-03 11:30:00'
    },
    {
      id: 4,
      name: 'Gibson Tan',
      email: 'member@apexgrid.com',
      password: 'Password123!',
      role: 'member',
      oauth_provider: 'discord',
      oauth_id: 'discord_oauth_gibson',
      vehicle: '2023 Toyota GR86 Track Spec',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
      region: 'Australia',
      bio: 'GR86 Track build owner. Regular at Sandown and Winton open pit lane days.',
      created_at: '2026-08-05 14:20:00'
    },
    {
      id: 5,
      name: 'Chloe Vance',
      email: 'chloe@apexgrid.com',
      password: 'Password123!',
      role: 'member',
      oauth_provider: null,
      oauth_id: null,
      vehicle: '2001 Nissan Silvia Spec-R (S15)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
      region: 'Australia',
      bio: 'S15 Silvia drift build & motorsport photographer.',
      created_at: '2026-08-08 16:45:00'
    },
    {
      id: 6,
      name: 'Amirul Hakim',
      email: 'amirul@apexgrid.com',
      password: 'Password123!',
      role: 'member',
      oauth_provider: 'google',
      oauth_id: 'google_oauth_amirul',
      vehicle: '2024 Honda Civic Type R (FL5)',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80',
      region: 'Malaysia',
      bio: 'Civic Type R FL5 driver based in Kuala Lumpur & Kuching.',
      created_at: '2026-08-10 19:00:00'
    }
  ],

  categories: [
    { id: 1, name: 'Track Day', slug: 'track-day', badge_color: 'danger', icon: 'bi-flag-fill' },
    { id: 2, name: 'Drift', slug: 'drift', badge_color: 'warning', icon: 'bi-wind' },
    { id: 3, name: 'Meet', slug: 'meet', badge_color: 'info', icon: 'bi-people-fill' },
    { id: 4, name: 'Drag', slug: 'drag', badge_color: 'primary', icon: 'bi-lightning-charge-fill' },
    { id: 5, name: 'Cruise', slug: 'cruise', badge_color: 'success', icon: 'bi-signpost-split-fill' },
    { id: 6, name: 'Show', slug: 'show', badge_color: 'secondary', icon: 'bi-trophy-fill' }
  ],

  clubs: [
    {
      id: 1,
      name: 'VicTimeAttack Motorsport',
      description:
        "Victoria's premier open-pitlane time attack and driver training organization. Hosting CAMS/Motorsport Australia sanctioned sprint days at Sandown, Winton, and Phillip Island.",
      logo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80',
      region: 'Australia',
      city: 'Melbourne, VIC',
      founded_year: 2018,
      owner_id: 2,
      created_at: '2026-08-05 10:00:00'
    },
    {
      id: 2,
      name: 'Docklands JDM & Euro Collective',
      description:
        'Monthly curated late-night static meets, dockside photo sessions, and cars & coffee gatherings across Greater Melbourne.',
      logo: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&auto=format&fit=crop&q=80',
      region: 'Australia',
      city: 'Docklands, VIC',
      founded_year: 2021,
      owner_id: 2,
      created_at: '2026-08-06 12:00:00'
    },
    {
      id: 3,
      name: 'Calder Drift Syndicate',
      description:
        'Grassroots and pro-am drift practice nights, tandem battles, and skidpan clinics held under the lights at Calder Park Thunderdome.',
      logo: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=400&auto=format&fit=crop&q=80',
      region: 'Australia',
      city: 'Calder Park, VIC',
      founded_year: 2019,
      owner_id: 2,
      created_at: '2026-08-07 15:00:00'
    },
    {
      id: 4,
      name: 'Sepang Night Attack MY',
      description:
        'Official grassroots & semi-pro track night organizer at Sepang International Circuit. Full GP track floodlit sessions with transponder timing.',
      logo: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&auto=format&fit=crop&q=80',
      region: 'Malaysia',
      city: 'Sepang, Selangor',
      founded_year: 2017,
      owner_id: 3,
      created_at: '2026-08-08 11:00:00'
    },
    {
      id: 5,
      name: 'Borneo Touge & Kuching Street Club',
      description:
        "Sarawak's largest automotive community connecting JDM, Euro, and local performance builds for Kuching night meets, Borneo cruises, and autocross.",
      logo: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&auto=format&fit=crop&q=80',
      region: 'Malaysia',
      city: 'Kuching, Sarawak',
      founded_year: 2020,
      owner_id: 3,
      created_at: '2026-08-09 14:00:00'
    },
    {
      id: 6,
      name: 'Klang Valley Midnight Runners',
      description:
        'Curated highland breakfast runs, Glenmarie industrial showoffs, and rolling photography cruises across Selangor and Pahang.',
      logo: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&auto=format&fit=crop&q=80',
      region: 'Malaysia',
      city: 'Shah Alam, Selangor',
      founded_year: 2022,
      owner_id: 3,
      created_at: '2026-08-10 16:00:00'
    }
  ],

  events: [
    {
      id: 1,
      title: 'Sandown Twilight Time Attack — Round 4',
      description:
        'Push your personal best at Sandown International Motor Raceway. Includes Dorian lap timing, 4 speed-grouped 20-minute sessions, garages included, and professional trackside marshals. Snell/ECE approved helmet and neck-to-wrist-to-ankle non-flammable clothing mandatory.',
      category_id: 1,
      club_id: 1,
      organizer_id: 2,
      region: 'Australia',
      venue: 'Sandown International Raceway',
      address: '591-659 Princes Hwy, Springvale VIC 3171 (Gate 2 Pit Paddock Entry)',
      organizer_contact: 'Syed Rahman — track@victimeattack.com.au | +61 412 889 102',
      latitude: -37.9506,
      longitude: 145.1647,
      start_datetime: '2026-10-24 13:00:00',
      end_datetime: '2026-10-24 18:30:00',
      price: 245.0,
      capacity: 60,
      image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900&auto=format&fit=crop&q=80',
      status: 'upcoming',
      created_at: '2026-09-15 10:00:00'
    },
    {
      id: 2,
      title: 'Calder Park Friday Night Drift Matsuri',
      description:
        'Under-lights drift practice and tandem trains on the Calder Park National layout and wet skidpan. Open to beginner, intermediate, and advanced groups. Tire changing van on-site all night.',
      category_id: 2,
      club_id: 3,
      organizer_id: 2,
      region: 'Australia',
      venue: 'Calder Park Motorsport Complex',
      address: '377 Calder Fwy, Calder Park VIC 3037 (Thunderdome Pit Gate B)',
      organizer_contact: 'Calder Drift Desk — drift@caldersyndicate.com.au | +61 409 331 440',
      latitude: -37.6714,
      longitude: 144.7536,
      start_datetime: '2026-10-30 18:00:00',
      end_datetime: '2026-10-30 23:00:00',
      price: 165.0,
      capacity: 50,
      image: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=900&auto=format&fit=crop&q=80',
      status: 'upcoming',
      created_at: '2026-09-18 11:00:00'
    },
    {
      id: 3,
      title: 'Docklands Underground JDM & Euro Night Meet',
      description:
        'Strictly static behavior—no revving, no burnouts, family-friendly atmosphere. Over 120 curated bays for 90s JDM legends, Euro touring builds, and time-attack street cars. Coffee & food trucks on site.',
      category_id: 3,
      club_id: 2,
      organizer_id: 2,
      region: 'Australia',
      venue: 'Harbour Town Rooftop Carpark, Docklands',
      address: 'Level 4 East Deck, 440 Docklands Dr, Docklands VIC 3008',
      organizer_contact: 'Docklands Meet Marshals — meets@docklandsjdm.org | +61 421 774 019',
      latitude: -37.8136,
      longitude: 144.9385,
      start_datetime: '2026-11-01 19:30:00',
      end_datetime: '2026-11-01 22:30:00',
      price: 0.0,
      capacity: 120,
      image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=900&auto=format&fit=crop&q=80',
      status: 'upcoming',
      created_at: '2026-09-20 14:00:00'
    },
    {
      id: 4,
      title: 'Sepang Full Circuit Floodlit Track Night',
      description:
        'Experience all 15 corners of the 5.543km Sepang International Circuit under FIA-grade floodlights. 3 hours of open pitlane running, official transponder timing included, and pit garage allocation.',
      category_id: 1,
      club_id: 4,
      organizer_id: 3,
      region: 'Malaysia',
      venue: 'Sepang International Circuit (North Paddock)',
      address: 'Jalan Pekeliling, 64000 KLIA, Selangor, Malaysia (Pit Garage 5-18)',
      organizer_contact: 'Naveed Khan — paddock@sepangnightattack.my | +60 12-384 9910',
      latitude: 2.7608,
      longitude: 101.7383,
      start_datetime: '2026-10-28 20:00:00',
      end_datetime: '2026-10-28 23:30:00',
      price: 180.0,
      capacity: 70,
      image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=900&auto=format&fit=crop&q=80',
      status: 'upcoming',
      created_at: '2026-09-22 09:00:00'
    },
    {
      id: 5,
      title: 'Kuching Waterfront & Borneo Touge Night Meet',
      description:
        "Sarawak's premier monthly gathering for JDM, stance, rally, and street builds. Live DJ set, automotive photography rig setups, and club bay displays overlooking Kuching South.",
      category_id: 3,
      club_id: 5,
      organizer_id: 3,
      region: 'Malaysia',
      venue: 'MBKS Community Square Precinct, Kuching',
      address: 'Jalan Padungan South Carpark Zone C, 93100 Kuching, Sarawak',
      organizer_contact: 'Borneo Touge Committee — events@borneotouge.my | +60 16-882 4105',
      latitude: 1.5533,
      longitude: 110.3592,
      start_datetime: '2026-11-06 20:00:00',
      end_datetime: '2026-11-06 23:30:00',
      price: 0.0,
      capacity: 150,
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&auto=format&fit=crop&q=80',
      status: 'upcoming',
      created_at: '2026-09-25 13:00:00'
    },
    {
      id: 6,
      title: 'Winton 300km Endurance & Sprint Festival',
      description:
        'Full-day country track outing at Winton Motor Raceway ("The Action Track"). Morning driver briefing at 8:00 AM sharp, followed by 6 timed sprint sessions across technical corners.',
      category_id: 1,
      club_id: 1,
      organizer_id: 2,
      region: 'Australia',
      venue: 'Winton Motor Raceway',
      address: '41 Fox St, Winton VIC 3673 (Main Competitors Gate)',
      organizer_contact: 'Syed Rahman — track@victimeattack.com.au | +61 412 889 102',
      latitude: -36.5067,
      longitude: 146.0914,
      start_datetime: '2026-11-14 08:00:00',
      end_datetime: '2026-11-14 16:30:00',
      price: 210.0,
      capacity: 55,
      image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=900&auto=format&fit=crop&q=80',
      status: 'upcoming',
      created_at: '2026-09-27 10:00:00'
    },
    {
      id: 7,
      title: 'Genting Highlands Dawn Touge & Breakfast Run',
      description:
        'Early morning convoy departing BHPetrol Gombak Tol at 6:15 AM sharp, ascending via Karak & Gohtong Jaya with two-way radio coordination and reserved mountain parking.',
      category_id: 5,
      club_id: 6,
      organizer_id: 3,
      region: 'Malaysia',
      venue: 'Gohtong Jaya Lookout & Genting Mid-Hill',
      address: 'BHPetrol Karak Highway Assembly Bay -> Gohtong Jaya Terrace Lot B, 69000 Pahang',
      organizer_contact: 'Klang Valley Convoy Lead — convoy@kvmidnight.my | +60 17-291 6604',
      latitude: 3.4036,
      longitude: 101.7711,
      start_datetime: '2026-11-08 06:00:00',
      end_datetime: '2026-11-08 10:30:00',
      price: 15.0,
      capacity: 45,
      image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=900&auto=format&fit=crop&q=80',
      status: 'upcoming',
      created_at: '2026-09-28 15:00:00'
    },
    {
      id: 8,
      title: 'Calder Park 1/4 Mile Street Drag Wars',
      description:
        'Test your 60-foot launch and quarter-mile trap speed on a prepped drag strip with full Christmas tree timing slips. Street radial and AWD/RWD/FWD brackets.',
      category_id: 4,
      club_id: 3,
      organizer_id: 2,
      region: 'Australia',
      venue: 'Calder Park Drag Strip',
      address: '377 Calder Fwy, Calder Park VIC 3037 (Drag Staging Lanes 1-6)',
      organizer_contact: 'Calder Drag Timing — drags@caldersyndicate.com.au | +61 409 331 440',
      latitude: -37.6745,
      longitude: 144.756,
      start_datetime: '2026-11-20 17:30:00',
      end_datetime: '2026-11-20 22:30:00',
      price: 95.0,
      capacity: 80,
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&auto=format&fit=crop&q=80',
      status: 'upcoming',
      created_at: '2026-10-01 11:00:00'
    },
    {
      id: 9,
      title: 'Glenmarie Concours & Custom Build Showcase',
      description:
        "Indoor/outdoor automotive lifestyle exhibition featuring judged categories: Best Engine Bay, Best Track Build, Best Classic Restomod, and People's Choice.",
      category_id: 6,
      club_id: 6,
      organizer_id: 3,
      region: 'Malaysia',
      venue: 'UOA Business Park Atrium, Glenmarie',
      address: '1 Jalan Pengaturcara U1/51A, Kawasan Perindustrian Temasya, 40150 Shah Alam',
      organizer_contact: 'Glenmarie Show Desk — show@kvmidnight.my | +60 17-291 6604',
      latitude: 3.0882,
      longitude: 101.5851,
      start_datetime: '2026-11-22 10:00:00',
      end_datetime: '2026-11-22 18:00:00',
      price: 25.0,
      capacity: 100,
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&auto=format&fit=crop&q=80',
      status: 'upcoming',
      created_at: '2026-10-03 12:00:00'
    },
    {
      id: 10,
      title: 'Great Ocean Road Sunrise Coastal Cruise',
      description:
        'Iconic Victorian coastal drive starting from Torquay Foreshore through Lorne to Apollo Bay. Grouped into 3 pace groups with photography stops along the cliffs.',
      category_id: 5,
      club_id: 2,
      organizer_id: 2,
      region: 'Australia',
      venue: 'Torquay Foreshore -> Apollo Bay',
      address: 'Torquay Surf Beach Carpark North, The Esplanade, Torquay VIC 3228',
      organizer_contact: 'Docklands Cruise Lead — cruise@docklandsjdm.org | +61 421 774 019',
      latitude: -38.3325,
      longitude: 144.3264,
      start_datetime: '2026-11-28 06:30:00',
      end_datetime: '2026-11-28 13:00:00',
      price: 0.0,
      capacity: 60,
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=900&auto=format&fit=crop&q=80',
      status: 'upcoming',
      created_at: '2026-10-05 09:30:00'
    },
    {
      id: 11,
      title: 'Phillip Island GP Circuit Spring Sprint (Past Event)',
      description:
        'Completed high-speed sprint day at the world-famous Phillip Island Grand Prix Circuit. Thank you to all 58 drivers who set clean lap times across Gardner Straight and Lukey Heights!',
      category_id: 1,
      club_id: 1,
      organizer_id: 2,
      region: 'Australia',
      venue: 'Phillip Island Grand Prix Circuit',
      address: '381 Back Beach Rd, Ventnor VIC 3922 (Main Paddock Garages)',
      organizer_contact: 'Syed Rahman — track@victimeattack.com.au | +61 412 889 102',
      latitude: -38.506,
      longitude: 145.234,
      start_datetime: '2026-09-26 08:30:00',
      end_datetime: '2026-09-26 17:00:00',
      price: 295.0,
      capacity: 60,
      image: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=900&auto=format&fit=crop&q=80',
      status: 'completed',
      created_at: '2026-08-20 10:00:00'
    },
    {
      id: 12,
      title: 'Kuching Autocross & Gymkhana Challenge Rd 2 (Past Event)',
      description:
        'Completed precision cone-course gymkhana battle in Kuching. Timed twin-lane knockouts with FWD, RWD, and Open AWD podium trophies.',
      category_id: 2,
      club_id: 5,
      organizer_id: 3,
      region: 'Malaysia',
      venue: 'Sarawak Stadium South Tarmac Arena',
      address: 'Jalan Stadium, Petra Jaya, 93050 Kuching, Sarawak',
      organizer_contact: 'Borneo Touge Committee — events@borneotouge.my | +60 16-882 4105',
      latitude: 1.5882,
      longitude: 110.3598,
      start_datetime: '2026-10-04 09:00:00',
      end_datetime: '2026-10-04 17:00:00',
      price: 60.0,
      capacity: 45,
      image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=900&auto=format&fit=crop&q=80',
      status: 'completed',
      created_at: '2026-09-01 08:00:00'
    }
  ],

  rsvps: [
    { id: 1, event_id: 1, user_id: 4, status: 'going', created_at: '2026-10-01 10:15:00' },
    { id: 2, event_id: 1, user_id: 5, status: 'going', created_at: '2026-10-02 14:20:00' },
    { id: 3, event_id: 1, user_id: 1, status: 'going', created_at: '2026-10-03 09:10:00' },
    { id: 4, event_id: 2, user_id: 5, status: 'going', created_at: '2026-10-04 18:00:00' },
    { id: 5, event_id: 2, user_id: 4, status: 'interested', created_at: '2026-10-05 11:30:00' },
    { id: 6, event_id: 3, user_id: 4, status: 'going', created_at: '2026-10-06 20:00:00' },
    { id: 7, event_id: 3, user_id: 5, status: 'going', created_at: '2026-10-07 21:00:00' },
    { id: 8, event_id: 4, user_id: 6, status: 'going', created_at: '2026-10-08 12:45:00' },
    { id: 9, event_id: 4, user_id: 1, status: 'interested', created_at: '2026-10-09 15:20:00' },
    { id: 10, event_id: 5, user_id: 6, status: 'going', created_at: '2026-10-10 16:00:00' },
    { id: 11, event_id: 5, user_id: 1, status: 'going', created_at: '2026-10-11 19:15:00' },
    { id: 12, event_id: 7, user_id: 6, status: 'going', created_at: '2026-10-12 08:30:00' },
    { id: 13, event_id: 11, user_id: 4, status: 'going', created_at: '2026-09-10 11:00:00' },
    { id: 14, event_id: 11, user_id: 5, status: 'going', created_at: '2026-09-12 13:00:00' },
    { id: 15, event_id: 12, user_id: 6, status: 'going', created_at: '2026-09-18 10:00:00' }
  ],

  event_likes: [
    { id: 1, event_id: 1, user_id: 4, created_at: '2026-10-01 10:16:00' },
    { id: 2, event_id: 1, user_id: 5, created_at: '2026-10-02 14:21:00' },
    { id: 3, event_id: 1, user_id: 6, created_at: '2026-10-03 16:00:00' },
    { id: 4, event_id: 2, user_id: 5, created_at: '2026-10-04 18:05:00' },
    { id: 5, event_id: 3, user_id: 4, created_at: '2026-10-06 20:05:00' },
    { id: 6, event_id: 4, user_id: 6, created_at: '2026-10-08 12:46:00' },
    { id: 7, event_id: 5, user_id: 6, created_at: '2026-10-10 16:02:00' },
    { id: 8, event_id: 5, user_id: 1, created_at: '2026-10-11 19:16:00' },
    { id: 9, event_id: 11, user_id: 4, created_at: '2026-09-27 09:00:00' },
    { id: 10, event_id: 11, user_id: 5, created_at: '2026-09-27 10:00:00' },
    { id: 11, event_id: 12, user_id: 6, created_at: '2026-10-05 11:00:00' }
  ],

  comments: [
    {
      id: 1,
      event_id: 11,
      user_id: 4,
      body: 'Incredible organization by VicTimeAttack! Grouping by lap time meant zero traffic through Lukey Heights and managed a new PB of 1:46.8 in the GR86.',
      rating: 5,
      created_at: '2026-09-27 11:30:00'
    },
    {
      id: 2,
      event_id: 11,
      user_id: 5,
      body: 'Great track time and super helpful flag marshals. Pit lane flow was smooth all day—only wish coffee van stayed after 3 PM!',
      rating: 4,
      created_at: '2026-09-27 15:45:00'
    },
    {
      id: 3,
      event_id: 12,
      user_id: 6,
      body: 'Best gymkhana layout we have had in Kuching this year. Technical slalom and super friendly technical scrutineering crew.',
      rating: 5,
      created_at: '2026-10-05 14:15:00'
    },
    {
      id: 4,
      event_id: 1,
      user_id: 4,
      body: 'Locked in my spot for Group B! Anyone else convoying down Princes Hwy from Clayton around 11:30 AM?',
      rating: null,
      created_at: '2026-10-10 18:20:00'
    },
    {
      id: 5,
      event_id: 4,
      user_id: 6,
      body: "Booked Garage 8 with three FL5 Type Rs—can't wait for cooler night tarmac temperatures at Sepang!",
      rating: null,
      created_at: '2026-10-12 21:10:00'
    }
  ]
}

export const VENUE_PRESETS = [
  {
    label: 'Sandown International Raceway (Melbourne, AU)',
    region: 'Australia',
    venue: 'Sandown International Raceway',
    address: '591-659 Princes Hwy, Springvale VIC 3171',
    latitude: -37.9506,
    longitude: 145.1647
  },
  {
    label: 'Calder Park Motorsport Complex (Melbourne, AU)',
    region: 'Australia',
    venue: 'Calder Park Motorsport Complex',
    address: '377 Calder Fwy, Calder Park VIC 3037',
    latitude: -37.6714,
    longitude: 144.7536
  },
  {
    label: 'Winton Motor Raceway (Benalla, AU)',
    region: 'Australia',
    venue: 'Winton Motor Raceway',
    address: '41 Fox St, Winton VIC 3673',
    latitude: -36.5067,
    longitude: 146.0914
  },
  {
    label: 'Phillip Island Grand Prix Circuit (Ventnor, AU)',
    region: 'Australia',
    venue: 'Phillip Island Grand Prix Circuit',
    address: '381 Back Beach Rd, Ventnor VIC 3922',
    latitude: -38.506,
    longitude: 145.234
  },
  {
    label: 'Sepang International Circuit (Selangor, MY)',
    region: 'Malaysia',
    venue: 'Sepang International Circuit',
    address: 'Jalan Pekeliling, 64000 KLIA, Selangor, Malaysia',
    latitude: 2.7608,
    longitude: 101.7383
  },
  {
    label: 'MBKS Precinct / Kuching South (Sarawak, MY)',
    region: 'Malaysia',
    venue: 'MBKS Community Square Precinct, Kuching',
    address: 'Jalan Padungan South Carpark, 93100 Kuching, Sarawak',
    latitude: 1.5533,
    longitude: 110.3592
  },
  {
    label: 'Gohtong Jaya / Genting Touge Hub (Pahang, MY)',
    region: 'Malaysia',
    venue: 'Gohtong Jaya Lookout & Genting Mid-Hill',
    address: 'Gohtong Jaya Terrace Lot B, 69000 Genting Highlands, Pahang',
    latitude: 3.4036,
    longitude: 101.7711
  }
]

export const REGION_HUBS = {
  All: { name: 'All Regions (AU & MY)', lat: -15.0, lng: 125.0, zoom: 3 },
  Australia: { name: 'Melbourne & Victoria, AU', lat: -37.8136, lng: 144.9631, zoom: 8 },
  Malaysia: { name: 'Malaysia (Sepang & Sarawak)', lat: 2.5, lng: 106.0, zoom: 6 },
  Kuching: { name: 'Kuching, Sarawak, MY', lat: 1.5533, lng: 110.3592, zoom: 12 },
  Sepang: { name: 'Sepang & Klang Valley, MY', lat: 2.95, lng: 101.68, zoom: 10 }
}
