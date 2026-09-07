# -*- coding: utf-8 -*-
import os
import sqlite3
import json
from html import escape
from urllib.parse import quote

BACKEND_DIR = os.path.dirname(__file__)
DATA_DIR = os.environ.get("DATA_DIR", BACKEND_DIR)
if not os.path.isabs(DATA_DIR):
    DATA_DIR = os.path.abspath(os.path.join(BACKEND_DIR, DATA_DIR))
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "bittrif.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_order_columns(cursor):
    existing_columns = {
        row["name"] if isinstance(row, sqlite3.Row) else row[1]
        for row in cursor.execute("PRAGMA table_info(orders)").fetchall()
    }

    required_columns = {
        "company_name": "TEXT",
        "gstin": "TEXT",
        "landmark": "TEXT",
        "state": "TEXT",
        "delivery_type": "TEXT DEFAULT 'standard'",
        "preferred_slot": "TEXT",
        "invoice_type": "TEXT DEFAULT 'gst'",
        "payment_method": "TEXT DEFAULT 'cod'",
        "order_notes": "TEXT",
        "shipping_amount": "REAL DEFAULT 0",
    }

    for column_name, column_type in required_columns.items():
        if column_name not in existing_columns:
            cursor.execute(f"ALTER TABLE orders ADD COLUMN {column_name} {column_type}")


def ensure_product_columns(cursor):
    existing_columns = {
        row["name"] if isinstance(row, sqlite3.Row) else row[1]
        for row in cursor.execute("PRAGMA table_info(products)").fetchall()
    }
    if "images" not in existing_columns:
        cursor.execute("ALTER TABLE products ADD COLUMN images TEXT")
    if "minimum_order_quantity" not in existing_columns:
        cursor.execute("ALTER TABLE products ADD COLUMN minimum_order_quantity INTEGER DEFAULT 1")


def product_gallery(name, category_name, position):
    palettes = [
        ("#e9f7ff", "#087fc5", "#082d49"),
        ("#eaf9f4", "#16836a", "#063f37"),
        ("#fff5e7", "#d98425", "#633308"),
        ("#f3efff", "#7458bd", "#2f1b63"),
        ("#fff0f3", "#cc5575", "#67152c"),
    ]
    title = escape(name[:28])
    category = escape(category_name[:24])
    images = []
    for image_number, (background, accent, ink) in enumerate(palettes, start=1):
        offset = 28 + image_number * 8
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">
<rect width="900" height="900" fill="{background}"/>
<circle cx="760" cy="120" r="220" fill="{accent}" opacity=".12"/>
<circle cx="100" cy="810" r="260" fill="{accent}" opacity=".08"/>
<rect x="{offset}" y="{offset}" width="{900 - offset * 2}" height="{900 - offset * 2}" rx="58" fill="white" opacity=".72"/>
<rect x="310" y="205" width="280" height="410" rx="46" fill="{accent}"/>
<rect x="365" y="155" width="170" height="75" rx="20" fill="{ink}"/>
<rect x="345" y="330" width="210" height="155" rx="22" fill="white" opacity=".95"/>
<path d="M390 430c37-72 67-94 121-106-7 70-35 111-102 123" fill="none" stroke="{accent}" stroke-width="18" stroke-linecap="round"/>
<text x="450" y="690" fill="{ink}" font-family="Arial, sans-serif" font-size="28" font-weight="700" text-anchor="middle">{category}</text>
<text x="450" y="738" fill="{ink}" font-family="Arial, sans-serif" font-size="38" font-weight="800" text-anchor="middle">{title}</text>
<text x="450" y="785" fill="{accent}" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="3" text-anchor="middle">BITTRIF GROUP OF COMPANY</text>
</svg>'''
        images.append("data:image/svg+xml;charset=UTF-8," + quote(svg, safe=""))
    return images


def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript(
        """
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT DEFAULT 'box',
            description TEXT
        );
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            original_price REAL,
            image TEXT DEFAULT 'https://placehold.co/400x300',
            category_id INTEGER,
            stock INTEGER DEFAULT 100,
            minimum_order_quantity INTEGER DEFAULT 1,
            unit TEXT DEFAULT 'piece',
            is_featured INTEGER DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT,
            address TEXT NOT NULL,
            city TEXT,
            pincode TEXT,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id INTEGER,
            product_name TEXT,
            quantity INTEGER,
            price REAL,
            FOREIGN KEY (order_id) REFERENCES orders(id)
        );
        """
    )

    ensure_order_columns(c)
    ensure_product_columns(c)
    conn.commit()

    categories = [
        ("Cleaning Products", "sparkles", "Professional-grade cleaning solutions for all surfaces"),
        ("Hotel Amenities", "hotel", "Premium amenities for hotels and hospitality teams"),
        ("Floor Care", "layers", "Complete floor cleaning and maintenance products"),
        ("Bathroom Essentials", "droplets", "Hygiene and bathroom care products"),
        ("Kitchen Cleaning", "utensils", "Degreasers and kitchen hygiene products"),
        ("Laundry Care", "shirt", "Detergents and fabric care solutions"),
        ("Guest Room Essentials", "bed-double", "Room-ready essentials for comfortable guest stays"),
        ("Disposable Supplies", "package", "Single-use supplies for hospitality and food service"),
        ("Hand Hygiene", "hand", "Hand wash, sanitizer, and hygiene dispensers"),
        ("Linen and Bedding", "bed", "Comfortable, durable linen for hospitality operations"),
    ]
    existing_categories = {row[0] for row in c.execute("SELECT name FROM categories").fetchall()}
    c.executemany(
        "INSERT INTO categories (name, icon, description) VALUES (?, ?, ?)",
        [category for category in categories if category[0] not in existing_categories],
    )

    category_ids = {row["name"]: row["id"] for row in c.execute("SELECT id, name FROM categories").fetchall()}
    category_images = {
        "Cleaning Products": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=900&q=80",
        "Hotel Amenities": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80",
        "Floor Care": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80",
        "Bathroom Essentials": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80",
        "Kitchen Cleaning": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=900&q=80",
        "Laundry Care": "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=900&q=80",
        "Guest Room Essentials": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&q=80",
        "Disposable Supplies": "https://images.unsplash.com/photo-1583947582886-f40ec95dd752?w=900&q=80",
        "Hand Hygiene": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900&q=80",
        "Linen and Bedding": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80",
    }
    product_catalog = {
        "Cleaning Products": [
            ("Multi-Surface Cleaner", "Daily cleaner for glass, counters, and hard surfaces.", 185, "500 ml", 180, 1),
            ("Glass and Mirror Cleaner", "Streak-free spray for mirrors, glass, and display surfaces.", 165, "500 ml", 150, 0),
            ("Disinfectant Surface Spray", "Quick-action hygiene spray for high-touch surfaces.", 245, "500 ml", 120, 1),
            ("Toilet Bowl Cleaner", "Thick formula for stains, odour, and bathroom hygiene.", 140, "500 ml", 180, 0),
            ("Furniture Polish Spray", "Shine and protection for wooden furniture and fixtures.", 285, "400 ml", 80, 0),
            ("Air Freshener Spray", "Long-lasting fresh fragrance for rooms and washrooms.", 190, "300 ml", 200, 0),
            ("Fabric Refresher", "Odour-neutralising spray for upholstery, curtains, and linen.", 295, "500 ml", 95, 0),
            ("Drain Cleaner Liquid", "Fast-acting liquid cleaner for blocked drains and pipes.", 225, "1 litre", 75, 0),
            ("Stainless Steel Cleaner", "Polishes steel fixtures without harsh residue.", 275, "500 ml", 60, 0),
            ("Odour Neutraliser", "Professional room odour control concentrate.", 345, "500 ml", 55, 1),
        ],
        "Hotel Amenities": [
            ("Hotel Shampoo Bottle", "Mild shampoo in a guest-ready 30 ml bottle.", 14, "30 ml", 1000, 1),
            ("Hotel Conditioner Bottle", "Nourishing conditioner for guest room amenity kits.", 16, "30 ml", 900, 0),
            ("Hotel Body Wash Bottle", "Refreshing body wash for daily guest use.", 15, "30 ml", 1000, 1),
            ("Hotel Body Lotion Bottle", "Light moisturising lotion in a compact bottle.", 17, "30 ml", 850, 0),
            ("Hotel Soap Bar", "Wrapped vegetable soap bar for hotel bathrooms.", 12, "25 g", 1400, 1),
            ("Dental Kit", "Toothbrush and toothpaste sachet in hygienic packaging.", 22, "set", 900, 0),
            ("Shaving Kit", "Razor and shaving cream sachet for guest convenience.", 27, "set", 700, 0),
            ("Vanity Kit", "Cotton buds, cotton pads, and nail file in a compact pack.", 24, "set", 650, 0),
            ("Sewing Kit", "Travel sewing essentials in a tidy card pack.", 19, "set", 800, 0),
            ("Hotel Slippers", "Soft closed-toe disposable guest slippers.", 38, "pair", 600, 1),
        ],
        "Floor Care": [
            ("Neutral Floor Cleaner", "Low-foam cleaner for regular hard floor maintenance.", 320, "5 litre", 90, 1),
            ("Phenyl Floor Cleaner", "Fresh-scented phenyl for washroom and corridor cleaning.", 210, "5 litre", 130, 0),
            ("Floor Disinfectant Concentrate", "Dilutable disinfectant for commercial floor care.", 475, "5 litre", 70, 1),
            ("Marble Floor Cleaner", "pH-balanced cleaner for marble and natural stone.", 420, "1 litre", 65, 0),
            ("Wooden Floor Cleaner", "Gentle cleaner that maintains finished wood floors.", 385, "1 litre", 60, 0),
            ("Floor Polish", "Protective polish for high-traffic commercial flooring.", 620, "5 litre", 40, 0),
            ("Mop Refill", "Absorbent cotton mop refill for housekeeping trolleys.", 145, "piece", 200, 0),
            ("Microfiber Flat Mop", "Reusable microfiber mop for quick floor cleaning.", 495, "piece", 100, 1),
            ("Wet Floor Sign", "Bright caution sign for safe cleaning operations.", 295, "piece", 50, 0),
            ("Floor Scrubber Pad", "Durable scrubber pad for machine floor cleaning.", 115, "piece", 180, 0),
        ],
        "Bathroom Essentials": [
            ("Liquid Hand Wash", "Gentle hand wash for guest and public washrooms.", 260, "5 litre", 120, 1),
            ("Foaming Hand Wash", "Rich foam hand wash for compatible dispensers.", 325, "5 litre", 95, 0),
            ("Hand Wash Dispenser", "Wall-mount manual dispenser for liquid hand wash.", 450, "500 ml", 75, 0),
            ("Tissue Paper Roll", "Soft two-ply toilet tissue roll for daily use.", 36, "roll", 1200, 1),
            ("Jumbo Tissue Roll", "High-capacity tissue roll for commercial washrooms.", 135, "roll", 500, 0),
            ("Paper Towel Roll", "Absorbent roll for washroom and kitchen dispensers.", 110, "roll", 450, 0),
            ("Bathroom Air Freshener", "Automatic spray refill with a clean floral scent.", 235, "250 ml", 120, 0),
            ("Urinal Screen", "Fragranced urinal screen for odour control.", 78, "piece", 350, 0),
            ("Toilet Brush Set", "Durable brush and holder for bathroom cleaning.", 225, "set", 100, 0),
            ("Bathroom Cleaner Concentrate", "Concentrated cleaner for tiles, fittings, and floors.", 390, "5 litre", 80, 1),
        ],
        "Kitchen Cleaning": [
            ("Dishwash Liquid", "High-strength dishwashing liquid for commercial kitchens.", 365, "5 litre", 110, 1),
            ("Kitchen Degreaser", "Cuts grease from hoods, counters, and cooking equipment.", 440, "5 litre", 90, 1),
            ("Oven and Grill Cleaner", "Heavy-duty cleaner for baked-on kitchen grease.", 315, "1 litre", 75, 0),
            ("Dishwashing Scrub Pad", "Tough green scrub pad for pots and utensils.", 18, "piece", 1000, 0),
            ("Stainless Steel Scrubber", "Long-lasting steel scrubber for kitchen cleaning.", 22, "piece", 900, 0),
            ("Food-Safe Sanitizer", "No-rinse sanitizer suitable for food-contact surfaces.", 520, "5 litre", 55, 1),
            ("Hand Dishwash Gel", "Concentrated gel for manual utensil washing.", 245, "1 litre", 150, 0),
            ("Garbage Bin Cleaner", "Deodorising cleaner for kitchen bins and waste areas.", 280, "1 litre", 100, 0),
            ("Kitchen Towel Roll", "Strong absorbent paper roll for food preparation areas.", 95, "roll", 500, 0),
            ("Rubber Cleaning Gloves", "Reusable protective gloves for kitchen staff.", 135, "pair", 300, 0),
        ],
        "Laundry Care": [
            ("Laundry Detergent Powder", "Commercial detergent powder for everyday linen washing.", 580, "5 kg", 85, 1),
            ("Liquid Laundry Detergent", "Low-residue detergent for machine and hand wash.", 495, "5 litre", 90, 0),
            ("Fabric Softener", "Fresh fragrance softener for towels and bed linen.", 410, "5 litre", 80, 0),
            ("Laundry Bleach", "Whitening bleach for white linen and uniforms.", 365, "5 litre", 70, 0),
            ("Stain Remover", "Targeted treatment for tea, food, and grease stains.", 290, "500 ml", 100, 0),
            ("Laundry Sour", "Final rinse neutraliser for professional laundry cycles.", 455, "5 litre", 50, 0),
            ("Laundry Bag", "Washable bag for organised linen collection.", 225, "piece", 160, 0),
            ("Garment Hanger", "Strong plastic hanger for hotel wardrobes and laundry.", 28, "piece", 750, 0),
            ("Lint Roller", "Refillable roller for uniforms and guest room fabrics.", 160, "piece", 180, 0),
            ("Laundry Starch", "Finishing starch for crisp table linen and uniforms.", 340, "1 litre", 65, 0),
        ],
        "Guest Room Essentials": [
            ("Room Service Tray", "Non-slip serving tray for in-room hospitality service.", 650, "piece", 60, 0),
            ("Electric Kettle", "Compact 1 litre kettle for guest room beverage stations.", 1250, "piece", 40, 1),
            ("Tea and Coffee Sachet Set", "Guest room beverage starter set with cups.", 75, "set", 500, 1),
            ("Room Directory Folder", "Premium folder for hotel information and menus.", 420, "piece", 80, 0),
            ("Do Not Disturb Sign", "Double-sided door sign for guest privacy.", 95, "piece", 300, 0),
            ("Luggage Rack", "Foldable room luggage stand with sturdy straps.", 1450, "piece", 35, 0),
            ("Shoe Shine Mitt", "Compact shoe shine mitt for guest wardrobe service.", 48, "piece", 600, 0),
            ("Shoe Horn", "Durable shoe horn for convenient guest use.", 85, "piece", 350, 0),
            ("Wardrobe Hanger", "Premium wooden-look hanger for hotel rooms.", 110, "piece", 400, 0),
            ("Room Bin", "Compact waste bin for guest rooms and bathrooms.", 425, "piece", 100, 1),
        ],
        "Disposable Supplies": [
            ("Disposable Shower Cap", "Individually packed shower cap for guest bathrooms.", 8, "piece", 2000, 1),
            ("Disposable Comb", "Hygienic wrapped comb for hotel amenity kits.", 6, "piece", 2000, 0),
            ("Disposable Bath Loofah", "Soft mesh loofah for guest-use bath kits.", 18, "piece", 1200, 0),
            ("Disposable Apron", "Lightweight disposable apron for kitchen and cleaning staff.", 14, "piece", 1500, 0),
            ("Disposable Gloves", "Powder-free disposable gloves for hygiene tasks.", 395, "box of 100", 200, 1),
            ("Paper Cup", "Food-grade paper cup for rooms, events, and service areas.", 4, "piece", 5000, 0),
            ("Wooden Stirrer", "Biodegradable beverage stirrer for tea and coffee stations.", 1.5, "piece", 5000, 0),
            ("Garbage Bag Small", "Leak-resistant small waste bag roll.", 120, "roll of 30", 500, 0),
            ("Garbage Bag Large", "Heavy-duty large waste bag roll for housekeeping.", 220, "roll of 20", 400, 0),
            ("Disposable Face Mask", "Three-layer protective face mask for staff use.", 5, "piece", 3000, 0),
        ],
        "Hand Hygiene": [
            ("Alcohol Hand Sanitizer", "Quick-drying 70 percent alcohol hand rub.", 95, "500 ml", 500, 1),
            ("Hand Sanitizer Refill", "Bulk hand sanitizer refill for dispensers.", 395, "5 litre", 100, 1),
            ("Automatic Sanitizer Dispenser", "Touch-free wall dispenser for entrances and lobbies.", 1850, "piece", 30, 0),
            ("Manual Sanitizer Dispenser", "Reliable push dispenser for hygiene stations.", 525, "piece", 80, 0),
            ("Hand Hygiene Stand", "Freestanding dispenser stand for public areas.", 1450, "piece", 40, 0),
            ("Hand Wash Refill Pouch", "Economical hand wash refill for regular use.", 155, "1 litre", 250, 0),
            ("Hand Care Moisturizer", "Non-greasy moisturiser for frequent hand washing.", 185, "250 ml", 130, 0),
            ("Sanitizing Wipes", "Alcohol-based wipes for quick surface and hand cleaning.", 145, "pack of 50", 220, 0),
            ("Hand Dryer", "Compact electric hand dryer for commercial washrooms.", 2650, "piece", 25, 0),
            ("Hygiene Station Kit", "Dispenser, stand, and refill bundle for entry areas.", 2450, "set", 30, 1),
        ],
        "Linen and Bedding": [
            ("White Bath Towel", "Soft absorbent cotton towel for hotel bathrooms.", 320, "piece", 250, 1),
            ("Hand Towel", "Compact cotton hand towel for guest bathrooms.", 125, "piece", 400, 0),
            ("Face Towel", "Soft face towel for room and spa use.", 85, "piece", 500, 0),
            ("King Size Bed Sheet", "Durable white bed sheet for hotel king beds.", 850, "piece", 120, 1),
            ("Queen Size Bed Sheet", "Crisp white bed sheet for hotel queen beds.", 720, "piece", 150, 0),
            ("Pillow Cover", "Matching white cotton pillow cover.", 125, "piece", 400, 0),
            ("Duvet Cover", "Washable duvet cover for premium guest rooms.", 1450, "piece", 80, 0),
            ("Mattress Protector", "Water-resistant protector for longer mattress life.", 1250, "piece", 65, 0),
            ("Bath Mat", "Anti-slip absorbent mat for hotel bathrooms.", 265, "piece", 220, 0),
            ("Laundry Collection Bag", "Heavy-duty linen collection bag for housekeeping.", 385, "piece", 120, 0),
        ],
    }

    existing_products = {row[0] for row in c.execute("SELECT name FROM products").fetchall()}
    products_to_insert = []
    catalog_position = 0
    for category_name, products in product_catalog.items():
        for name, description, price, unit, stock, is_featured in products:
            catalog_position += 1
            gallery = product_gallery(name, category_name, catalog_position)
            if name not in existing_products:
                products_to_insert.append(
                    (name, description, price, round(price * 1.2, 2), gallery[0], json.dumps(gallery), category_ids[category_name], stock, unit, is_featured)
                )
            else:
                c.execute(
                    "UPDATE products SET image=?, images=? WHERE name=? AND (images IS NULL OR images='' OR images LIKE 'https://loremflickr.com/%')",
                    (gallery[0], json.dumps(gallery), name),
                )

    c.executemany(
        """
        INSERT INTO products (name, description, price, original_price, image, images, category_id, stock, unit, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        products_to_insert,
    )

    conn.commit()
    conn.close()
