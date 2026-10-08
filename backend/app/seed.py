"""app/seed.py — Idempotent seed script.

Run with:  python -m app.seed   (from the backend/ directory)

Seeds: 6 users, 25 amenities, 15 categories, 50 listings with images,
amenities, 60+ reviews, 15+ bookings, and a few wishlist items.
"""

import sys
import os
from datetime import date, timedelta, datetime, timezone

# Make sure we can import app modules when running as script
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
import app.models  # noqa — ensure all models are registered

from app.models.user import User
from app.models.listing import Listing, ListingImage, Amenity, ListingAmenity, Category
from app.models.booking import Booking
from app.models.review import Review
from app.models.wishlist import WishlistItem

# ─────────────────────────────────────────────────────────────────────────── #
# 1.  HELPERS                                                                  #
# ─────────────────────────────────────────────────────────────────────────── #

def _today() -> date:
    return date.today()

def _d(offset_days: int) -> date:
    """Return a date offset_days from today."""
    return _today() + timedelta(days=offset_days)

# ─────────────────────────────────────────────────────────────────────────── #
# 2.  REFERENCE DATA                                                           #
# ─────────────────────────────────────────────────────────────────────────── #

USERS = [
    # id will be auto-assigned; we seed in order so id=1..6
    dict(name="Priya Sharma",  email="priya@example.com",  avatar_url="https://i.pravatar.cc/150?img=47", role="host",  is_superhost=True,  bio="Superhost with 5 years of experience. Love welcoming guests!", response_rate=98),
    dict(name="James Miller",  email="james@example.com",  avatar_url="https://i.pravatar.cc/150?img=3",  role="host",  is_superhost=False, bio="Property enthusiast based in Bali. Weekend host.", response_rate=85),
    dict(name="Sofia Rossi",   email="sofia@example.com",  avatar_url="https://i.pravatar.cc/150?img=25", role="host",  is_superhost=False, bio="Architect and part-time host. My listings are designed with care.", response_rate=90),
    dict(name="Arjun Mehta",   email="arjun@example.com",  avatar_url="https://i.pravatar.cc/150?img=12", role="guest", is_superhost=False, bio="Frequent traveller. Love unique stays."),
    dict(name="Emily Chen",    email="emily@example.com",  avatar_url="https://i.pravatar.cc/150?img=33", role="guest", is_superhost=False, bio="Foodie and adventure seeker."),
    dict(name="Lucas Martin",  email="lucas@example.com",  avatar_url="https://i.pravatar.cc/150?img=52", role="guest", is_superhost=False, bio="Digital nomad, always looking for great workspaces."),
]

CATEGORIES = [
    dict(name="Amazing views",  icon="mountain",        slug="amazing-views"),
    dict(name="Beachfront",     icon="waves",           slug="beachfront"),
    dict(name="Cabins",         icon="trees",           slug="cabins"),
    dict(name="Tiny homes",     icon="home",            slug="tiny-homes"),
    dict(name="Treehouses",     icon="tree-pine",       slug="treehouses"),
    dict(name="Islands",        icon="palmtree",        slug="islands"),
    dict(name="Farms",          icon="wheat",           slug="farms"),
    dict(name="Design",         icon="layout",          slug="design"),
    dict(name="Luxe",           icon="crown",           slug="luxe"),
    dict(name="Camping",        icon="tent",            slug="camping"),
    dict(name="Countryside",    icon="flower",          slug="countryside"),
    dict(name="Lakefront",      icon="droplets",        slug="lakefront"),
    dict(name="Mansions",       icon="building-2",      slug="mansions"),
    dict(name="Tropical",       icon="sun",             slug="tropical"),
    dict(name="Skiing",         icon="snowflake",       slug="skiing"),
]

AMENITIES = [
    dict(name="WiFi",           icon="wifi",        category="Internet & office"),
    dict(name="Kitchen",        icon="utensils",    category="Kitchen"),
    dict(name="Air conditioning", icon="wind",      category="Heating & cooling"),
    dict(name="Heating",        icon="flame",       category="Heating & cooling"),
    dict(name="Pool",           icon="waves",       category="Outdoors"),
    dict(name="Free parking",   icon="car",         category="Parking"),
    dict(name="Washer",         icon="sparkles",    category="Laundry"),
    dict(name="Dryer",          icon="sparkles",    category="Laundry"),
    dict(name="TV",             icon="tv",          category="Entertainment"),
    dict(name="Hot tub",        icon="bath",        category="Outdoors"),
    dict(name="Gym",            icon="dumbbell",    category="Fitness"),
    dict(name="BBQ grill",      icon="flame",       category="Outdoors"),
    dict(name="Beach access",   icon="waves",       category="Outdoors"),
    dict(name="Ski-in/ski-out", icon="snowflake",   category="Outdoors"),
    dict(name="Fireplace",      icon="flame",       category="Heating & cooling"),
    dict(name="EV charger",     icon="zap",         category="Parking"),
    dict(name="Workspace",      icon="monitor",     category="Internet & office"),
    dict(name="Bathtub",        icon="bath",        category="Bathroom"),
    dict(name="Hair dryer",     icon="wind",        category="Bathroom"),
    dict(name="Smoke alarm",    icon="bell",        category="Safety"),
    dict(name="CO alarm",       icon="bell",        category="Safety"),
    dict(name="First aid kit",  icon="heart",       category="Safety"),
    dict(name="Breakfast",      icon="coffee",      category="Kitchen"),
    dict(name="Pets allowed",   icon="paw-print",   category="Policies"),
    dict(name="Luggage dropoff",icon="package",     category="Policies"),
]

# ─────────────────────────────────────────────────────────────────────────── #
# 3.  LISTING DATA                                                             #
# ─────────────────────────────────────────────────────────────────────────── #

# (host_idx, category_slug, city, state, country, lat, lng,
#  room_type, property_type, price, cleaning_fee, max_guests,
#  bedrooms, beds, bathrooms, is_fav, title, description,
#  amenity_names[list], image_urls[list])

LISTINGS_DATA = [
    # ───── Goa, India ───── #
    (0, "beachfront", "Goa", "Goa", "India", 15.2993, 74.1240, "entire_home", "Villa",
     8500, 1200, 6, 3, 4, 2.0, True,
     "Oceanfront Villa with Private Pool in North Goa",
     "Wake up to the sound of waves in this stunning beachfront villa. Enjoy a private infinity pool, lush tropical garden, and direct beach access. Perfect for families and groups looking for a luxury Goa experience.",
     ["WiFi", "Pool", "Kitchen", "Air conditioning", "Beach access", "BBQ grill", "Washer", "TV", "Free parking"],
     ["https://images.unsplash.com/photo-1540541338537-1220059af5a4?w=800",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800"]),

    (1, "tropical", "Goa", "Goa", "India", 15.3500, 73.9500, "private_room", "Guesthouse",
     2200, 400, 2, 1, 1, 1.0, False,
     "Cosy Beach Shack Near Calangute — Tropical Vibes",
     "A charming private room in our beach shack just 5 minutes from Calangute beach. Shared pool, hammock garden, and legendary sunsets included.",
     ["WiFi", "Air conditioning", "Breakfast", "Pets allowed", "Beach access"],
     ["https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"]),

    # ───── Manali, India ───── #
    (0, "cabins", "Manali", "Himachal Pradesh", "India", 32.2432, 77.1892, "entire_home", "Cabin",
     4500, 800, 4, 2, 3, 1.5, True,
     "Himalayan Log Cabin with Snow Mountain Views",
     "A hand-crafted cedar log cabin perched at 7,500 ft with breathtaking Himalayan panoramas. The wood-burning fireplace, mountain-spring hot water, and home-cooked breakfast make this the perfect winter escape.",
     ["WiFi", "Fireplace", "Kitchen", "Heating", "Breakfast", "Free parking", "Luggage dropoff"],
     ["https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800",
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800",
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800",
      "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800"]),

    (2, "skiing", "Manali", "Himachal Pradesh", "India", 32.3146, 77.1780, "entire_home", "Chalet",
     6200, 900, 5, 3, 4, 2.0, False,
     "Ski-In Chalet Near Solang Valley",
     "Slope-side chalet with direct ski access. After a day on the powder, warm up by our stone fireplace and enjoy panoramic views of the Beas Valley.",
     ["WiFi", "Fireplace", "Kitchen", "Ski-in/ski-out", "Heating", "Free parking", "Hot tub"],
     ["https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800",
      "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
      "https://images.unsplash.com/photo-1605538032404-d7e5fd3d2f9d?w=800"]),

    # ───── Jaipur, India ───── #
    (0, "design", "Jaipur", "Rajasthan", "India", 26.9124, 75.7873, "entire_home", "Heritage Hotel",
     7000, 1000, 8, 4, 6, 3.0, True,
     "Royal Haveli Suite in the Pink City",
     "Step into Rajasthan royalty. This 200-year-old haveli has been lovingly restored to blend heritage architecture with modern comforts. Rooftop restaurant, inner courtyard with peacocks, and nightly cultural performances.",
     ["WiFi", "Air conditioning", "Kitchen", "Pool", "Breakfast", "TV", "Free parking", "Workspace"],
     ["https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800",
      "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=800",
      "https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=800",
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800"]),

    # ───── Mumbai, India ───── #
    (1, "amazing-views", "Mumbai", "Maharashtra", "India", 19.0760, 72.8777, "entire_home", "Apartment",
     5500, 700, 4, 2, 2, 2.0, False,
     "Bandra Sea-View Penthouse with Infinity Pool",
     "A sleek modern penthouse overlooking the Arabian Sea and Bandstand promenade. Floor-to-ceiling windows, designer furniture, and a rooftop infinity pool shared with just 2 other units.",
     ["WiFi", "Pool", "Air conditioning", "Workspace", "Gym", "Washer", "TV", "Free parking"],
     ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      "https://images.unsplash.com/photo-1502005097973-6a7082348e28?w=800",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800",
      "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800"]),

    # ───── Bali, Indonesia ───── #
    (0, "tropical", "Ubud", "Bali", "Indonesia", -8.5069, 115.2624, "entire_home", "Villa",
     9500, 1500, 6, 3, 4, 3.0, True,
     "Jungle Infinity Villa in the Heart of Ubud",
     "Hidden among rice paddies and jungle, this villa features a 25m infinity pool that seems to pour into the valley. Morning yoga deck, outdoor shower, and a personal chef available on request.",
     ["WiFi", "Pool", "Kitchen", "Air conditioning", "Breakfast", "Gym", "BBQ grill", "Free parking"],
     ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
      "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800",
      "https://images.unsplash.com/photo-1531804226761-74949c2295ab?w=800",
      "https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?w=800",
      "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800"]),

    (1, "beachfront", "Seminyak", "Bali", "Indonesia", -8.6918, 115.1609, "entire_home", "Villa",
     12000, 2000, 8, 4, 6, 4.0, True,
     "5-Star Seminyak Beach Club Villa",
     "Ultra-luxurious beachfront villa with private pool, beach butler, and daily spa credits. Surrounded by Bali's best clubs and restaurants. A truly once-in-a-lifetime experience.",
     ["WiFi", "Pool", "Beach access", "Air conditioning", "Hot tub", "BBQ grill", "TV", "Gym", "Washer"],
     ["https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
      "https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?w=800",
      "https://images.unsplash.com/photo-1540541338537-1220059af5a4?w=800",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"]),

    # ───── Santorini, Greece ───── #
    (2, "amazing-views", "Oia", "South Aegean", "Greece", 36.4618, 25.3753, "entire_home", "Cave House",
     18000, 2500, 2, 1, 1, 1.0, True,
     "Caldera Cave House with Iconic Sunset Views",
     "The most photographed sunset in the world, viewed from your own private terrace. This Cycladic cave house is carved into the volcanic cliffs with a plunge pool overlooking the blue-domed churches.",
     ["WiFi", "Pool", "Air conditioning", "Breakfast", "TV", "Bathtub"],
     ["https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800",
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800",
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800",
      "https://images.unsplash.com/photo-1555408617-dc48e1c48e38?w=800"]),

    (0, "luxe", "Fira", "South Aegean", "Greece", 36.4163, 25.4315, "entire_home", "Villa",
     25000, 4000, 10, 5, 8, 5.0, True,
     "Grand Cliff-top Villa — Santorini's Finest",
     "The crown jewel of Santorini. Five suites, infinity pool, private chef, panoramic caldera views from every room, and a dedicated concierge. For the most discerning travellers.",
     ["WiFi", "Pool", "Air conditioning", "Hot tub", "Gym", "Breakfast", "TV", "Workspace", "Free parking"],
     ["https://images.unsplash.com/photo-1468078809804-4c7b3e60a478?w=800",
      "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800",
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
      "https://images.unsplash.com/photo-1553444836-bc6c8d340d56?w=800",
      "https://images.unsplash.com/photo-1577483389730-c2de4f98cc5b?w=800"]),

    # ───── Paris, France ───── #
    (2, "design", "Paris", "Île-de-France", "France", 48.8566, 2.3522, "entire_home", "Apartment",
     6500, 900, 4, 2, 2, 1.5, False,
     "Haussmann Apartment Steps from the Eiffel Tower",
     "A classic Haussmann-era apartment with original parquet floors, ornate cornices, and a tiny balcony with Eiffel Tower views. Perfectly located in the 7th arrondissement.",
     ["WiFi", "Kitchen", "Washer", "Air conditioning", "TV", "Workspace"],
     ["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800",
      "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800"]),

    (1, "design", "Montmartre", "Île-de-France", "France", 48.8867, 2.3431, "private_room", "Apartment",
     3200, 500, 2, 1, 1, 1.0, False,
     "Artist's Atelier in Montmartre — Steps from Sacré-Cœur",
     "A bohemian retreat in the legendary artist's neighbourhood. Original exposed beams, vintage furnishings, and a studio space perfect for creative inspiration.",
     ["WiFi", "Kitchen", "Heating", "Washer", "TV", "Workspace"],
     ["https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800",
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800",
      "https://images.unsplash.com/photo-1555408617-dc48e1c48e38?w=800",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800",
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800"]),

    # ───── New York, USA ───── #
    (2, "amazing-views", "Manhattan", "New York", "USA", 40.7128, -74.0060, "entire_home", "Apartment",
     14000, 2000, 4, 2, 2, 2.0, True,
     "Central Park Skyline Penthouse — Midtown Manhattan",
     "Wake up to the Manhattan skyline and Central Park from a glass-walled penthouse 45 floors up. State-of-the-art kitchen, designer furnishings, and a private rooftop terrace.",
     ["WiFi", "Kitchen", "Gym", "Air conditioning", "TV", "Workspace", "Washer", "Free parking"],
     ["https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800",
      "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800",
      "https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=800",
      "https://images.unsplash.com/photo-1502005097973-6a7082348e28?w=800"]),

    (0, "design", "Brooklyn", "New York", "USA", 40.6782, -73.9442, "entire_home", "Loft",
     7500, 1200, 3, 1, 2, 1.0, False,
     "Industrial Williamsburg Loft — Design Lover's Dream",
     "A converted warehouse loft with 18-foot ceilings, exposed brick, and original steel beams. Double-height windows flood the space with light. In the heart of Brooklyn's creative scene.",
     ["WiFi", "Kitchen", "Air conditioning", "Washer", "Dryer", "TV", "Workspace", "BBQ grill"],
     ["https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=800",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800"]),

    # ───── Tokyo, Japan ───── #
    (1, "tiny-homes", "Shibuya", "Tokyo", "Japan", 35.6595, 139.7005, "entire_home", "Apartment",
     5500, 800, 2, 1, 1, 1.0, False,
     "Minimalist Shibuya Studio — Urban Zen",
     "A masterpiece of Japanese minimalism right in the heart of Shibuya. Moments from the famous crossing, with a rooftop onsen and traditional wooden interiors.",
     ["WiFi", "Kitchen", "Air conditioning", "Washer", "TV", "Workspace", "Bathtub"],
     ["https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800",
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800",
      "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800"]),

    (2, "design", "Kyoto", "Kyoto", "Japan", 35.0116, 135.7681, "entire_home", "House",
     8000, 1200, 6, 3, 4, 2.5, True,
     "Traditional Machiya Townhouse in Gion District",
     "A 100-year-old wooden machiya townhouse lovingly preserved in Gion. Tatami rooms, a zen garden, and a sunken kotatu — the most authentic Japan experience you'll find.",
     ["WiFi", "Kitchen", "Heating", "Bathtub", "TV", "Breakfast"],
     ["https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800",
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800",
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800"]),

    # ───── Swiss Alps ───── #
    (0, "skiing", "Zermatt", "Valais", "Switzerland", 46.0207, 7.7491, "entire_home", "Chalet",
     22000, 3500, 8, 4, 6, 3.0, True,
     "Ski-In/Ski-Out Chalet — Matterhorn Views",
     "Wake up to the Matterhorn from your bed. Slope-side access, private sauna, wine cellar, and a dedicated ski valet. The definitive Alpine luxury experience.",
     ["WiFi", "Fireplace", "Hot tub", "Ski-in/ski-out", "Kitchen", "Heating", "Free parking", "TV"],
     ["https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800",
      "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800",
      "https://images.unsplash.com/photo-1468078809804-4c7b3e60a478?w=800",
      "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800",
      "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800"]),

    (1, "amazing-views", "Interlaken", "Bern", "Switzerland", 46.6863, 7.8632, "entire_home", "Chalet",
     11000, 1800, 6, 3, 5, 2.0, False,
     "Alpine Chalet with Jungfrau Panorama",
     "Perched above Interlaken with 180° views of the Jungfrau, Eiger, and Mönch. A luxury chalet with a glass-wall living room, outdoor jacuzzi, and premium ski passes included.",
     ["WiFi", "Hot tub", "Fireplace", "Kitchen", "Ski-in/ski-out", "Free parking", "TV", "Heating"],
     ["https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800",
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
      "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800",
      "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800",
      "https://images.unsplash.com/photo-1605538032404-d7e5fd3d2f9d?w=800"]),

    # ───── Malibu, USA ───── #
    (2, "beachfront", "Malibu", "California", "USA", 34.0259, -118.7798, "entire_home", "House",
     35000, 5000, 10, 5, 7, 4.5, True,
     "Carbon Beach Estate — Billionaire's Row",
     "Step onto the sand from your private deck. This 6,000 sqft modern masterpiece sits on Malibu's most exclusive stretch of beach. Film screening room, gym, wine cave, and gourmet kitchen.",
     ["WiFi", "Pool", "Beach access", "Gym", "Kitchen", "Air conditioning", "Hot tub", "BBQ grill", "EV charger", "Free parking"],
     ["https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      "https://images.unsplash.com/photo-1540541338537-1220059af5a4?w=800",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800"]),

    (0, "amazing-views", "Malibu", "California", "USA", 34.0350, -118.8200, "entire_home", "Villa",
     18000, 2800, 6, 3, 4, 3.0, False,
     "Clifftop Villa with Pacific Ocean Views",
     "Perched on a Malibu cliff 200 feet above the Pacific. Dramatic sunsets, a vanishing-edge pool, and an outdoor kitchen perfectly situated for the golden California lifestyle.",
     ["WiFi", "Pool", "Air conditioning", "Kitchen", "BBQ grill", "Free parking", "TV", "Workspace"],
     ["https://images.unsplash.com/photo-1509660933844-6910e12765a0?w=800",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800"]),

    # ───── Treehouses & Unique Stays ───── #
    (1, "treehouses", "Coorg", "Karnataka", "India", 12.3375, 75.8069, "entire_home", "Treehouse",
     5500, 800, 2, 1, 1, 1.0, True,
     "Luxury Treehouse in Coorg Coffee Plantation",
     "Elevated 30 feet in a centuries-old jackfruit tree within a working coffee plantation. Watch mist roll through the valleys from your private deck and fall asleep to jungle sounds.",
     ["WiFi", "Breakfast", "Heating", "Free parking", "Luggage dropoff"],
     ["https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800",
      "https://images.unsplash.com/photo-1582610116397-edb72278f9f2?w=800",
      "https://images.unsplash.com/photo-1526040652367-ac003a0475fe?w=800",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800"]),

    (2, "farms", "Ooty", "Tamil Nadu", "India", 11.4102, 76.6950, "entire_home", "Farmhouse",
     3800, 600, 6, 3, 4, 2.0, False,
     "Heritage Farmhouse in the Nilgiris",
     "A colonial-era farmhouse on a working tea and vegetable farm. Harvest your own breakfast, hike through tea gardens, and enjoy bonfire evenings under the stars.",
     ["WiFi", "Kitchen", "Breakfast", "Free parking", "BBQ grill", "Pets allowed", "Fireplace"],
     ["https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800"]),

    # ───── Lakefront ───── #
    (0, "lakefront", "Nainital", "Uttarakhand", "India", 29.3919, 79.4542, "entire_home", "Cottage",
     4200, 700, 4, 2, 3, 1.5, True,
     "Lakeside Cottage with Boat Dock — Nainital",
     "A picture-perfect stone cottage on the shores of Naini Lake. Your private boat dock lets you row out at sunrise. The surrounding forest is a birdwatcher's paradise.",
     ["WiFi", "Kitchen", "Heating", "Free parking", "Breakfast", "Luggage dropoff"],
     ["https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800",
      "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800",
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800",
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800"]),

    (1, "lakefront", "Udaipur", "Rajasthan", "India", 24.5854, 73.7125, "entire_home", "Palace",
     15000, 2200, 8, 4, 6, 4.0, True,
     "Lake Palace Boutique Hotel — Udaipur",
     "A 300-year-old palace rising from the waters of Lake Pichola. Opulent suites with lake views, boat transfers, and royally inspired cuisine. The most romantic stay in India.",
     ["WiFi", "Pool", "Kitchen", "Air conditioning", "Hot tub", "Breakfast", "TV", "Free parking"],
     ["https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800",
      "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=800",
      "https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=800",
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800"]),

    # ───── Camping & Islands ───── #
    (2, "camping", "Spiti Valley", "Himachal Pradesh", "India", 32.2461, 78.0339, "entire_home", "Glamping Tent",
     2500, 400, 2, 1, 1, 1.0, False,
     "Luxury Glamping at 13,000 ft — Spiti Valley",
     "Canvas pod with real beds, electricity, and a wood stove at altitude. Fall asleep to a Milky Way you've never seen before and wake up surrounded by Tibetan Buddhist monasteries.",
     ["Heating", "Breakfast", "Free parking", "Luggage dropoff"],
     ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
      "https://images.unsplash.com/photo-1478827387698-1527781a4887?w=800",
      "https://images.unsplash.com/photo-1565080123937-3a4b6218e9e4?w=800",
      "https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=800",
      "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800"]),

    (0, "islands", "Lakshadweep", None, "India", 10.5667, 72.6417, "entire_home", "Beach Bungalow",
     20000, 3000, 4, 2, 2, 2.0, True,
     "Private Overwater Bungalow — Lakshadweep",
     "Only accessible by seaplane, this overwater bungalow sits above turquoise lagoons in the most remote island in India. Snorkel, dive, or simply watch sea turtles from your glass-floor room.",
     ["WiFi", "Air conditioning", "Beach access", "Breakfast", "TV", "Luggage dropoff"],
     ["https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800",
      "https://images.unsplash.com/photo-1540541338537-1220059af5a4?w=800",
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"]),

    # ───── More international ───── #
    (1, "design", "Barcelona", "Catalonia", "Spain", 41.3851, 2.1734, "entire_home", "Apartment",
     8000, 1200, 4, 2, 2, 2.0, False,
     "Modernist Apartment near Sagrada Família",
     "A lovingly curated apartment in a century-old Eixample building with original Modernista tilework. Rooftop terrace with views over Barcelona's famous grid.",
     ["WiFi", "Kitchen", "Air conditioning", "Washer", "TV", "Workspace"],
     ["https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800",
      "https://images.unsplash.com/photo-1464790719320-516ecd75af6c?w=800",
      "https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=800",
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800"]),

    (2, "luxe", "Dubai", "Dubai", "UAE", 25.2048, 55.2708, "entire_home", "Penthouse",
     45000, 6000, 6, 3, 4, 3.5, True,
     "Burj View Penthouse — Dubai Downtown",
     "The most iconic view in the world — the Burj Khalifa and Dubai Fountain from your private infinity pool. Ultra-luxury furnishings, private chef, Rolls-Royce airport transfer included.",
     ["WiFi", "Pool", "Gym", "Air conditioning", "Hot tub", "Kitchen", "TV", "Free parking", "EV charger", "Workspace"],
     ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"]),

    (0, "countryside", "Tuscany", "Tuscany", "Italy", 43.7711, 11.2486, "entire_home", "Villa",
     14000, 2000, 10, 5, 7, 4.0, True,
     "Tuscan Stone Villa with Vineyard & Olive Grove",
     "A 500-year-old stone farmhouse in the rolling hills of Chianti. Swim in the saltwater pool, pick grapes during harvest, and enjoy dinner on the terrace as the sun sets over the cypress trees.",
     ["WiFi", "Pool", "Kitchen", "BBQ grill", "Free parking", "Washer", "Dryer", "Pets allowed", "Heating"],
     ["https://images.unsplash.com/photo-1468078809804-4c7b3e60a478?w=800",
      "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800",
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800",
      "https://images.unsplash.com/photo-1555408617-dc48e1c48e38?w=800",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"]),

    (1, "mansions", "Beverly Hills", "California", "USA", 34.0736, -118.4004, "entire_home", "Mansion",
     80000, 10000, 12, 6, 10, 6.0, True,
     "Classic Beverly Hills Estate — Hollywood Hills",
     "An iconic 10,000 sqft estate used in major film productions. Guest house, tennis court, screening room, wine cellar, and a 50ft lap pool surrounded by perfectly manicured gardens.",
     ["WiFi", "Pool", "Gym", "Kitchen", "Air conditioning", "Hot tub", "BBQ grill", "EV charger", "Free parking", "TV", "Workspace"],
     ["https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"]),
]

# ─────────────────────────────────────────────────────────────────────────── #
# 4.  REVIEW COMMENTS                                                          #
# ─────────────────────────────────────────────────────────────────────────── #

REVIEW_COMMENTS = [
    "Absolutely stunning property! Every detail was perfect, from the welcome basket to the impeccable cleanliness. Would love to return.",
    "The views were even better in person. The host was incredibly responsive and helpful throughout our stay.",
    "Such a unique and memorable experience. The property is exactly as described — no surprises.",
    "Perfect location and beautiful space. We had everything we needed and more. Highly recommend!",
    "The host went above and beyond to make our stay special. This place is a hidden gem.",
    "Incredible design and attention to detail. Felt like staying in a boutique hotel.",
    "Great value for money. The photos don't do it justice — it's even better in person.",
    "Peaceful, private, and breathtakingly beautiful. We didn't want to leave.",
    "Everything was spotlessly clean and the amenities were top-notch. Five stars!",
    "An unforgettable stay. The host's local recommendations were fantastic.",
    "Cozy and comfortable with a fantastic location. Perfect for our family trip.",
    "The property had everything we needed for our week-long trip. Would definitely book again.",
    "Simply magical. The sunset views from the terrace made our anniversary trip perfect.",
    "Amazing host, amazing place. Already planning our return visit!",
    "The space is beautiful but very fairly priced for what you get. Exceptional value.",
]


# ─────────────────────────────────────────────────────────────────────────── #
# 5.  SEED FUNCTION                                                            #
# ─────────────────────────────────────────────────────────────────────────── #

def seed(db: Session) -> None:
    print("🌱  Starting seed...")

    # ── Users ──────────────────────────────────────────────────────────── #
    existing_users = db.query(User).count()
    if existing_users == 0:
        users_objs = []
        for u in USERS:
            user = User(**u)
            db.add(user)
            users_objs.append(user)
        db.flush()
        print(f"   ✓  Created {len(users_objs)} users")
    else:
        print(f"   ⏭   Users already seeded ({existing_users} found)")

    users_objs = db.query(User).order_by(User.id).all()

    # ── Categories ─────────────────────────────────────────────────────── #
    existing_cats = db.query(Category).count()
    if existing_cats == 0:
        cat_objs = []
        for c in CATEGORIES:
            cat = Category(**c)
            db.add(cat)
            cat_objs.append(cat)
        db.flush()
        print(f"   ✓  Created {len(cat_objs)} categories")
    else:
        print(f"   ⏭   Categories already seeded ({existing_cats} found)")

    # Build slug → Category map
    cat_map = {c.slug: c for c in db.query(Category).all()}

    # ── Amenities ──────────────────────────────────────────────────────── #
    existing_amen = db.query(Amenity).count()
    if existing_amen == 0:
        amen_objs = []
        for a in AMENITIES:
            amen = Amenity(**a)
            db.add(amen)
            amen_objs.append(amen)
        db.flush()
        print(f"   ✓  Created {len(amen_objs)} amenities")
    else:
        print(f"   ⏭   Amenities already seeded ({existing_amen} found)")

    # Build name → Amenity map
    amen_map = {a.name: a for a in db.query(Amenity).all()}

    # ── Listings ───────────────────────────────────────────────────────── #
    existing_listings = db.query(Listing).count()
    if existing_listings == 0:
        listing_objs = []
        import random
        random.seed(42)

        for row in LISTINGS_DATA:
            (host_idx, cat_slug, city, state, country, lat, lng,
             room_type, prop_type, price, cleaning_fee, max_guests,
             bedrooms, beds, bathrooms, is_fav,
             title, desc, amenity_names, image_urls) = row

            host = users_objs[host_idx]  # hosts are index 0,1,2
            category = cat_map.get(cat_slug)

            # Add some variance to the ratings so they feel real
            rating = round(random.uniform(4.2, 5.0), 2)
            review_count = random.randint(12, 180)

            listing = Listing(
                host_id=host.id,
                title=title,
                description=desc,
                property_type=prop_type,
                category_id=category.id if category else None,
                room_type=room_type,
                city=city,
                state=state,
                country=country,
                latitude=lat,
                longitude=lng,
                price_per_night=price,
                cleaning_fee=cleaning_fee,
                max_guests=max_guests,
                bedrooms=bedrooms,
                beds=beds,
                bathrooms=bathrooms,
                rating_avg=rating,
                review_count=review_count,
                is_guest_favorite=is_fav,
                status="active",
            )
            db.add(listing)
            db.flush()

            # Images
            for i, url in enumerate(image_urls):
                db.add(ListingImage(listing_id=listing.id, url=url, position=i))

            # Amenities
            for name in amenity_names:
                amenity = amen_map.get(name)
                if amenity:
                    db.add(ListingAmenity(listing_id=listing.id, amenity_id=amenity.id))

            listing_objs.append(listing)

        db.flush()
        print(f"   ✓  Created {len(listing_objs)} listings")
    else:
        print(f"   ⏭   Listings already seeded ({existing_listings} found)")
        listing_objs = db.query(Listing).order_by(Listing.id).all()

    # ── Bookings ───────────────────────────────────────────────────────── #
    existing_bookings = db.query(Booking).count()
    if existing_bookings == 0:
        guests = [u for u in users_objs if u.role == "guest"]
        # Build bookings: mix of past, current, upcoming, cancelled
        bookings_spec = [
            # (guest_idx, listing_idx, days_from_today_checkin, nights, status)
            (0, 0,  -90, 5,  "completed"),
            (0, 2,  -60, 3,  "completed"),
            (0, 5,  -30, 7,  "completed"),
            (0, 8,  -15, 4,  "completed"),
            (1, 1,  -45, 6,  "completed"),
            (1, 4,  -20, 3,  "completed"),
            (1, 7,  -10, 2,  "completed"),
            (2, 3,  -70, 5,  "completed"),
            (2, 6,  -35, 4,  "completed"),
            # Current/upcoming confirmed
            (0, 10,   5, 4,  "confirmed"),
            (0, 12,  30, 7,  "confirmed"),
            (1, 0,   10, 3,  "confirmed"),
            (1, 14,  20, 5,  "confirmed"),
            (2, 9,   15, 6,  "confirmed"),
            (2, 11,  45, 8,  "confirmed"),
            (0, 16,  60, 3,  "confirmed"),
            # Cancelled
            (1, 5,  -50, 4,  "cancelled"),
            (2, 2,  -25, 3,  "cancelled"),
        ]

        from app.services.pricing_service import compute_price

        booking_objs = []
        for (g_idx, l_idx, offset, nights, bstatus) in bookings_spec:
            if l_idx >= len(listing_objs):
                continue
            guest = guests[g_idx]
            listing = listing_objs[l_idx]
            check_in = _d(offset)
            check_out = check_in + timedelta(days=nights)

            pricing = compute_price(
                check_in=check_in,
                check_out=check_out,
                nightly_rate=float(listing.price_per_night),
                cleaning_fee=float(listing.cleaning_fee),
            )
            b = Booking(
                listing_id=listing.id,
                guest_id=guest.id,
                check_in=check_in,
                check_out=check_out,
                guests_adults=2,
                guests_children=0,
                guests_infants=0,
                nightly_rate=pricing["nightly_rate"],
                cleaning_fee=pricing["cleaning_fee"],
                service_fee=pricing["service_fee"],
                total_price=pricing["total"],
                status=bstatus,
            )
            db.add(b)
            booking_objs.append(b)

        db.flush()
        print(f"   ✓  Created {len(booking_objs)} bookings")

        # Update completed bookings to status completed
        for b in booking_objs:
            if b.check_out < date.today() and b.status == "confirmed":
                b.status = "completed"
        db.flush()
    else:
        print(f"   ⏭   Bookings already seeded ({existing_bookings} found)")

    # ── Reviews ────────────────────────────────────────────────────────── #
    existing_reviews = db.query(Review).count()
    if existing_reviews == 0:
        import random
        random.seed(99)
        guests = [u for u in users_objs if u.role == "guest"]
        reviews_created = 0

        # Create reviews for the first 20 listings from guests
        for i, listing in enumerate(listing_objs[:20]):
            # 3-4 reviews per listing
            num_reviews = random.randint(3, 4)
            for j in range(num_reviews):
                guest = guests[j % len(guests)]
                rating = round(random.uniform(4.0, 5.0), 1)
                comment = REVIEW_COMMENTS[(i + j) % len(REVIEW_COMMENTS)]
                sub = round(random.uniform(4.0, 5.0), 1)

                r = Review(
                    listing_id=listing.id,
                    author_id=guest.id,
                    booking_id=None,
                    rating=rating,
                    cleanliness=sub,
                    accuracy=round(random.uniform(4.0, 5.0), 1),
                    communication=round(random.uniform(4.0, 5.0), 1),
                    location=round(random.uniform(4.0, 5.0), 1),
                    checkin=round(random.uniform(4.0, 5.0), 1),
                    value=round(random.uniform(3.8, 5.0), 1),
                    comment=comment,
                )
                db.add(r)
                reviews_created += 1

        db.flush()

        # Update listing aggregates for listings that got reviews
        from sqlalchemy import func, select as sa_select
        for listing in listing_objs[:20]:
            agg = db.execute(
                sa_select(func.avg(Review.rating), func.count(Review.id))
                .where(Review.listing_id == listing.id)
            ).one()
            if agg[1] > 0:
                listing.rating_avg = round(float(agg[0]), 2)
                listing.review_count = agg[1]

        print(f"   ✓  Created {reviews_created} reviews")
    else:
        print(f"   ⏭   Reviews already seeded ({existing_reviews} found)")

    # ── Wishlist items ─────────────────────────────────────────────────── #
    existing_wl = db.query(WishlistItem).count()
    if existing_wl == 0:
        guests = [u for u in users_objs if u.role == "guest"]
        # Guest 1 (arjun) saves a few listings
        wishlist_pairs = [(guests[0].id, listing_objs[0].id),
                          (guests[0].id, listing_objs[6].id),
                          (guests[0].id, listing_objs[8].id),
                          (guests[1].id, listing_objs[1].id),
                          (guests[1].id, listing_objs[11].id)]
        for uid, lid in wishlist_pairs:
            db.add(WishlistItem(user_id=uid, listing_id=lid))
        db.flush()
        print(f"   ✓  Created {len(wishlist_pairs)} wishlist items")
    else:
        print(f"   ⏭   Wishlist items already seeded ({existing_wl} found)")

    db.commit()
    print("✅  Seed complete!")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
