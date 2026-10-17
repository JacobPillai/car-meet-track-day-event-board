-- ============================================================================
-- ApexGrid — Car Meet & Track-Day Event Board
-- Database Schema (Compatible with FeeNIX MariaDB 5.5 & MySQL 5.7/8.0)
-- ============================================================================
-- Notes for Swinburne FeeNIX MariaDB 5.5 (feenix-mariadb.swin.edu.au):
-- 1. Indexed VARCHAR columns use VARCHAR(191) to stay under the 767-byte InnoDB key limit.
-- 2. Uses DATETIME instead of multiple TIMESTAMP DEFAULT CURRENT_TIMESTAMP columns
--    to prevent MariaDB 5.5 Error 1293.
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS event_likes;
DROP TABLE IF EXISTS rsvps;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS clubs;
DROP TABLE IF EXISTS users;

-- 1. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('member', 'organizer', 'admin') NOT NULL DEFAULT 'member',
    avatar VARCHAR(255) DEFAULT NULL,
    region VARCHAR(60) NOT NULL DEFAULT 'Australia',
    bio TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- 2. Clubs & Organizers Table
CREATE TABLE clubs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    logo VARCHAR(255) DEFAULT NULL,
    region VARCHAR(60) NOT NULL DEFAULT 'Australia',
    city VARCHAR(100) NOT NULL DEFAULT 'Melbourne, VIC',
    founded_year INT DEFAULT 2020,
    owner_id INT NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_clubs_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- 3. Event Categories Table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    slug VARCHAR(60) NOT NULL UNIQUE,
    badge_color VARCHAR(30) NOT NULL DEFAULT 'danger',
    icon VARCHAR(60) NOT NULL DEFAULT 'bi-speedometer2'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- 4. Events Table
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(191) NOT NULL,
    description TEXT NOT NULL,
    category_id INT NOT NULL,
    club_id INT DEFAULT NULL,
    organizer_id INT NOT NULL,
    region VARCHAR(60) NOT NULL DEFAULT 'Australia',
    venue VARCHAR(191) NOT NULL,
    address VARCHAR(255) NOT NULL,
    organizer_contact VARCHAR(191) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    price DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    capacity INT NOT NULL DEFAULT 100,
    image VARCHAR(255) DEFAULT NULL,
    status ENUM('upcoming', 'completed', 'cancelled') NOT NULL DEFAULT 'upcoming',
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_events_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_events_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- 5. RSVPs Table (Going / Interested)
CREATE TABLE rsvps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('going', 'interested') NOT NULL DEFAULT 'going',
    created_at DATETIME NOT NULL,
    UNIQUE KEY uq_rsvp_event_user (event_id, user_id),
    CONSTRAINT fk_rsvps_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_rsvps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- 6. Event Likes Table
CREATE TABLE event_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at DATETIME NOT NULL,
    UNIQUE KEY uq_like_event_user (event_id, user_id),
    CONSTRAINT fk_likes_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- 7. Comments & Past Event Ratings Table
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    body TEXT NOT NULL,
    rating TINYINT DEFAULT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_comments_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
