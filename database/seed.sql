-- ============================================================================
-- ApexGrid — Seed Data (Australia & Malaysia Motorsport Events & Clubs)
-- Default password for all seeded accounts: Password123!
-- ============================================================================

INSERT INTO users (id, name, email, password_hash, role, oauth_provider, oauth_id, vehicle, avatar, region, bio, created_at) VALUES
(1, 'Jacob Pillai', 'admin@apexgrid.com', 'sha256$apexgrid$9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'admin', 'google', 'google_oauth_105986053', '2023 Honda Civic Type R (FL5)', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80', 'Australia', 'Platform Administrator & Motorsport Enthusiast based between Melbourne and Sarawak.', '2026-08-01 09:00:00'),
(2, 'Syed Rahman', 'organizer@apexgrid.com', 'sha256$apexgrid$9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'organizer', 'github', 'github_oauth_syed', '2022 Porsche 911 GT3 (992)', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80', 'Australia', 'Track Director at VicTimeAttack & Melbourne JDM Collective.', '2026-08-02 10:15:00'),
(3, 'Naveed Khan', 'naveed@apexgrid.com', 'sha256$apexgrid$9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'organizer', 'google', 'google_oauth_naveed', '2020 Nissan GT-R NISMO (R35)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80', 'Malaysia', 'Lead Coordinator for Sepang Night Attack & Borneo Touge Club.', '2026-08-03 11:30:00'),
(4, 'Gibson Tan', 'member@apexgrid.com', 'sha256$apexgrid$9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'member', 'discord', 'discord_oauth_gibson', '2023 Toyota GR86 Track Spec', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80', 'Australia', 'GR86 Track build owner. Regular at Sandown and Winton open pit lane days.', '2026-08-05 14:20:00'),
(5, 'Chloe Vance', 'chloe@apexgrid.com', 'sha256$apexgrid$9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'member', NULL, NULL, '2001 Nissan Silvia Spec-R (S15)', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80', 'Australia', 'S15 Silvia drift build & motorsport photographer.', '2026-08-08 16:45:00'),
(6, 'Amirul Hakim', 'amirul@apexgrid.com', 'sha256$apexgrid$9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'member', 'google', 'google_oauth_amirul', '2024 Honda Civic Type R (FL5)', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80', 'Malaysia', 'Civic Type R FL5 driver based in Kuala Lumpur & Kuching.', '2026-08-10 19:00:00');

INSERT INTO categories (id, name, slug, badge_color, icon) VALUES
(1, 'Track Day', 'track-day', 'danger', 'bi-flag-fill'),
(2, 'Drift', 'drift', 'warning', 'bi-wind'),
(3, 'Meet', 'meet', 'info', 'bi-people-fill'),
(4, 'Drag', 'drag', 'primary', 'bi-lightning-charge-fill'),
(5, 'Cruise', 'cruise', 'success', 'bi-signpost-split-fill'),
(6, 'Show', 'show', 'secondary', 'bi-trophy-fill');

INSERT INTO clubs (id, name, description, logo, region, city, founded_year, owner_id, created_at) VALUES
(1, 'VicTimeAttack Motorsport', 'Victoria''s premier open-pitlane time attack and driver training organization. Hosting CAMS/Motorsport Australia sanctioned sprint days at Sandown, Winton, and Phillip Island.', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80', 'Australia', 'Melbourne, VIC', 2018, 2, '2026-08-05 10:00:00'),
(2, 'Docklands JDM & Euro Collective', 'Monthly curated late-night static meets, dockside photo sessions, and cars & coffee gatherings across Greater Melbourne.', 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&auto=format&fit=crop&q=80', 'Australia', 'Docklands, VIC', 2021, 2, '2026-08-06 12:00:00'),
(3, 'Calder Drift Syndicate', 'Grassroots and pro-am drift practice nights, tandem battles, and skidpan clinics held under the lights at Calder Park Thunderdome.', 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=400&auto=format&fit=crop&q=80', 'Australia', 'Calder Park, VIC', 2019, 2, '2026-08-07 15:00:00'),
(4, 'Sepang Night Attack MY', 'Official grassroots & semi-pro track night organizer at Sepang International Circuit. Full GP track floodlit sessions with transponder timing.', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&auto=format&fit=crop&q=80', 'Malaysia', 'Sepang, Selangor', 2017, 3, '2026-08-08 11:00:00'),
(5, 'Borneo Touge & Kuching Street Club', 'Sarawak''s largest automotive community connecting JDM, Euro, and local performance builds for Kuching night meets, Borneo cruises, and autocross.', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&auto=format&fit=crop&q=80', 'Malaysia', 'Kuching, Sarawak', 2020, 3, '2026-08-09 14:00:00'),
(6, 'Klang Valley Midnight Runners', 'Curated highland breakfast runs, Glenmarie industrial showoffs, and rolling photography cruises across Selangor and Pahang.', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&auto=format&fit=crop&q=80', 'Malaysia', 'Shah Alam, Selangor', 2022, 3, '2026-08-10 16:00:00');

INSERT INTO events (id, title, description, category_id, club_id, organizer_id, region, venue, address, organizer_contact, latitude, longitude, start_datetime, end_datetime, price, capacity, image, status, created_at) VALUES
(1, 'Sandown Twilight Time Attack — Round 4', 'Push your personal best at Sandown International Motor Raceway. Includes Dorian lap timing, 4 speed-grouped 20-minute sessions, garages included, and professional trackside marshals. Snell/ECE approved helmet and neck-to-wrist-to-ankle non-flammable clothing mandatory.', 1, 1, 2, 'Australia', 'Sandown International Raceway', '591-659 Princes Hwy, Springvale VIC 3171 (Gate 2 Pit Paddock Entry)', 'Syed Rahman — track@victimeattack.com.au | +61 412 889 102', -37.950600, 145.164700, '2026-10-24 13:00:00', '2026-10-24 18:30:00', 245.00, 60, 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900&auto=format&fit=crop&q=80', 'upcoming', '2026-09-15 10:00:00'),
(2, 'Calder Park Friday Night Drift Matsuri', 'Under-lights drift practice and tandem trains on the Calder Park National layout and wet skidpan. Open to beginner, intermediate, and advanced groups. Tire changing van on-site all night.', 2, 3, 2, 'Australia', 'Calder Park Motorsport Complex', '377 Calder Fwy, Calder Park VIC 3037 (Thunderdome Pit Gate B)', 'Calder Drift Desk — drift@caldersyndicate.com.au | +61 409 331 440', -37.671400, 144.753600, '2026-10-30 18:00:00', '2026-10-30 23:00:00', 165.00, 50, 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=900&auto=format&fit=crop&q=80', 'upcoming', '2026-09-18 11:00:00'),
(3, 'Docklands Underground JDM & Euro Night Meet', 'Strictly static behavior—no revving, no burnouts, family-friendly atmosphere. Over 120 curated bays for 90s JDM legends, Euro touring builds, and time-attack street cars. Coffee & food trucks on site.', 3, 2, 2, 'Australia', 'Harbour Town Rooftop Carpark, Docklands', 'Level 4 East Deck, 440 Docklands Dr, Docklands VIC 3008', 'Docklands Meet Marshals — meets@docklandsjdm.org | +61 421 774 019', -37.813600, 144.938500, '2026-11-01 19:30:00', '2026-11-01 22:30:00', 0.00, 120, 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=900&auto=format&fit=crop&q=80', 'upcoming', '2026-09-20 14:00:00'),
(4, 'Sepang Full Circuit Floodlit Track Night', 'Experience all 15 corners of the 5.543km Sepang International Circuit under FIA-grade floodlights. 3 hours of open pitlane running, official transponder timing included, and pit garage allocation.', 1, 4, 3, 'Malaysia', 'Sepang International Circuit (North Paddock)', 'Jalan Pekeliling, 64000 KLIA, Selangor, Malaysia (Pit Garage 5-18)', 'Naveed Khan — paddock@sepangnightattack.my | +60 12-384 9910', 2.760800, 101.738300, '2026-10-28 20:00:00', '2026-10-28 23:30:00', 180.00, 70, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=900&auto=format&fit=crop&q=80', 'upcoming', '2026-09-22 09:00:00'),
(5, 'Kuching Waterfront & Borneo Touge Night Meet', 'Sarawak''s premier monthly gathering for JDM, stance, rally, and street builds. Live DJ set, automotive photography rig setups, and club bay displays overlooking Kuching South.', 3, 5, 3, 'Malaysia', 'MBKS Community Square Precinct, Kuching', 'Jalan Padungan South Carpark Zone C, 93100 Kuching, Sarawak', 'Borneo Touge Committee — events@borneotouge.my | +60 16-882 4105', 1.553300, 110.359200, '2026-11-06 20:00:00', '2026-11-06 23:30:00', 0.00, 150, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&auto=format&fit=crop&q=80', 'upcoming', '2026-09-25 13:00:00'),
(6, 'Winton 300km Endurance & Sprint Festival', 'Full-day country track outing at Winton Motor Raceway ("The Action Track"). Morning driver briefing at 8:00 AM sharp, followed by 6 timed sprint sessions across technical corners.', 1, 1, 2, 'Australia', 'Winton Motor Raceway', '41 Fox St, Winton VIC 3673 (Main Competitors Gate)', 'Syed Rahman — track@victimeattack.com.au | +61 412 889 102', -36.506700, 146.091400, '2026-11-14 08:00:00', '2026-11-14 16:30:00', 210.00, 55, 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=900&auto=format&fit=crop&q=80', 'upcoming', '2026-09-27 10:00:00'),
(7, 'Genting Highlands Dawn Touge & Breakfast Run', 'Early morning convoy departing BHPetrol Gombak Tol at 6:15 AM sharp, ascending via Karak & Gohtong Jaya with two-way radio coordination and reserved mountain parking.', 5, 6, 3, 'Malaysia', 'Gohtong Jaya Lookout & Genting Mid-Hill', 'BHPetrol Karak Highway Assembly Bay -> Gohtong Jaya Terrace Lot B, 69000 Pahang', 'Klang Valley Convoy Lead — convoy@kvmidnight.my | +60 17-291 6604', 3.403600, 101.771100, '2026-11-08 06:00:00', '2026-11-08 10:30:00', 15.00, 45, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=900&auto=format&fit=crop&q=80', 'upcoming', '2026-09-28 15:00:00'),
(8, 'Calder Park 1/4 Mile Street Drag Wars', 'Test your 60-foot launch and quarter-mile trap speed on a prepped drag strip with full Christmas tree timing slips. Street radial and AWD/RWD/FWD brackets.', 4, 3, 2, 'Australia', 'Calder Park Drag Strip', '377 Calder Fwy, Calder Park VIC 3037 (Drag Staging Lanes 1-6)', 'Calder Drag Timing — drags@caldersyndicate.com.au | +61 409 331 440', -37.674500, 144.756000, '2026-11-20 17:30:00', '2026-11-20 22:30:00', 95.00, 80, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&auto=format&fit=crop&q=80', 'upcoming', '2026-10-01 11:00:00'),
(9, 'Glenmarie Concours & Custom Build Showcase', 'Indoor/outdoor automotive lifestyle exhibition featuring judged categories: Best Engine Bay, Best Track Build, Best Classic Restomod, and People''s Choice.', 6, 6, 3, 'Malaysia', 'UOA Business Park Atrium, Glenmarie', '1 Jalan Pengaturcara U1/51A, Kawasan Perindustrian Temasya, 40150 Shah Alam', 'Glenmarie Show Desk — show@kvmidnight.my | +60 17-291 6604', 3.088200, 101.585100, '2026-11-22 10:00:00', '2026-11-22 18:00:00', 25.00, 100, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&auto=format&fit=crop&q=80', 'upcoming', '2026-10-03 12:00:00'),
(10, 'Great Ocean Road Sunrise Coastal Cruise', 'Iconic Victorian coastal drive starting from Torquay Foreshore through Lorne to Apollo Bay. Grouped into 3 pace groups with photography stops along the cliffs.', 5, 2, 2, 'Australia', 'Torquay Foreshore -> Apollo Bay', 'Torquay Surf Beach Carpark North, The Esplanade, Torquay VIC 3228', 'Docklands Cruise Lead — cruise@docklandsjdm.org | +61 421 774 019', -38.332500, 144.326400, '2026-11-28 06:30:00', '2026-11-28 13:00:00', 0.00, 60, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=900&auto=format&fit=crop&q=80', 'upcoming', '2026-10-05 09:30:00'),
(11, 'Phillip Island GP Circuit Spring Sprint (Past Event)', 'Completed high-speed sprint day at the world-famous Phillip Island Grand Prix Circuit. Thank you to all 58 drivers who set clean lap times across Gardner Straight and Lukey Heights!', 1, 1, 2, 'Australia', 'Phillip Island Grand Prix Circuit', '381 Back Beach Rd, Ventnor VIC 3922 (Main Paddock Garages)', 'Syed Rahman — track@victimeattack.com.au | +61 412 889 102', -38.506000, 145.234000, '2026-09-26 08:30:00', '2026-09-26 17:00:00', 295.00, 60, 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=900&auto=format&fit=crop&q=80', 'completed', '2026-08-20 10:00:00'),
(12, 'Kuching Autocross & Gymkhana Challenge Rd 2 (Past Event)', 'Completed precision cone-course gymkhana battle in Kuching. Timed twin-lane knockouts with FWD, RWD, and Open AWD podium trophies.', 2, 5, 3, 'Malaysia', 'Sarawak Stadium South Tarmac Arena', 'Jalan Stadium, Petra Jaya, 93050 Kuching, Sarawak', 'Borneo Touge Committee — events@borneotouge.my | +60 16-882 4105', 1.588200, 110.359800, '2026-10-04 09:00:00', '2026-10-04 17:00:00', 60.00, 45, 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=900&auto=format&fit=crop&q=80', 'completed', '2026-09-01 08:00:00');

INSERT INTO rsvps (id, event_id, user_id, status, created_at) VALUES
(1, 1, 4, 'going', '2026-10-01 10:15:00'),
(2, 1, 5, 'going', '2026-10-02 14:20:00'),
(3, 1, 1, 'going', '2026-10-03 09:10:00'),
(4, 2, 5, 'going', '2026-10-04 18:00:00'),
(5, 2, 4, 'interested', '2026-10-05 11:30:00'),
(6, 3, 4, 'going', '2026-10-06 20:00:00'),
(7, 3, 5, 'going', '2026-10-07 21:00:00'),
(8, 4, 6, 'going', '2026-10-08 12:45:00'),
(9, 4, 1, 'interested', '2026-10-09 15:20:00'),
(10, 5, 6, 'going', '2026-10-10 16:00:00'),
(11, 5, 1, 'going', '2026-10-11 19:15:00'),
(12, 7, 6, 'going', '2026-10-12 08:30:00'),
(13, 11, 4, 'going', '2026-09-10 11:00:00'),
(14, 11, 5, 'going', '2026-09-12 13:00:00'),
(15, 12, 6, 'going', '2026-09-18 10:00:00');

INSERT INTO event_likes (id, event_id, user_id, created_at) VALUES
(1, 1, 4, '2026-10-01 10:16:00'),
(2, 1, 5, '2026-10-02 14:21:00'),
(3, 1, 6, '2026-10-03 16:00:00'),
(4, 2, 5, '2026-10-04 18:05:00'),
(5, 3, 4, '2026-10-06 20:05:00'),
(6, 4, 6, '2026-10-08 12:46:00'),
(7, 5, 6, '2026-10-10 16:02:00'),
(8, 5, 1, '2026-10-11 19:16:00'),
(9, 11, 4, '2026-09-27 09:00:00'),
(10, 11, 5, '2026-09-27 10:00:00'),
(11, 12, 6, '2026-10-05 11:00:00');

INSERT INTO comments (id, event_id, user_id, body, rating, created_at) VALUES
(1, 11, 4, 'Incredible organization by VicTimeAttack! Grouping by lap time meant zero traffic through Lukey Heights and managed a new PB of 1:46.8 in the GR86.', 5, '2026-09-27 11:30:00'),
(2, 11, 5, 'Great track time and super helpful flag marshals. Pit lane flow was smooth all day—only wish coffee van stayed after 3 PM!', 4, '2026-09-27 15:45:00'),
(3, 12, 6, 'Best gymkhana layout we have had in Kuching this year. Technical slalom and super friendly technical scrutineering crew.', 5, '2026-10-05 14:15:00'),
(4, 1, 4, 'Locked in my spot for Group B! Anyone else convoying down Princes Hwy from Clayton around 11:30 AM?', NULL, '2026-10-10 18:20:00'),
(5, 4, 6, 'Booked Garage 8 with three FL5 Type Rs—can''t wait for cooler night tarmac temperatures at Sepang!', NULL, '2026-10-12 21:10:00');
