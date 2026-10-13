# -*- coding: utf-8 -*-
import base64
import binascii
import hashlib
import json
import os
import re
import secrets
import uuid

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from database import DATA_DIR, get_db, init_db
from models import ImageUpload, OrderCreate, ProductCreate, ProductVisitCreate, StatusUpdate, UserLogin, UserRegister, VisitorContact

os.environ["PYTHONUTF8"] = "1"

app = FastAPI(title="Nivora Mart API")
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CLIENT_DIST_DIR = os.environ.get("CLIENT_DIST_DIR", os.path.join(PROJECT_ROOT, "client", "dist"))

ORDER_STATUSES = {"pending", "processing", "shipped", "delivered", "cancelled"}
DELIVERY_TYPES = {"standard", "priority"}
INVOICE_TYPES = {"gst", "standard"}
PAYMENT_METHODS = {"cod", "proforma"}
STANDARD_SHIPPING_AMOUNT = 0

allowed_origins = [origin.strip() for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


def hash_pw(password):
    return hashlib.sha256(password.encode()).hexdigest()


def normalize_email(email):
    return email.strip().lower()


def validate_email(email):
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(status_code=422, detail="Enter a valid email address")


def create_auth_session(conn, user):
    token = secrets.token_urlsafe(32)
    conn.execute("DELETE FROM auth_sessions WHERE expires_at <= CURRENT_TIMESTAMP")
    conn.execute(
        "INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))",
        (hash_pw(token), user["id"]),
    )
    conn.commit()
    return {"id": user["id"], "name": user["name"], "email": user["email"], "phone": user["phone"], "token": token}


def visit_user(conn, authorization):
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Please log in again")
    user = conn.execute(
        "SELECT u.* FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > CURRENT_TIMESTAMP",
        (hash_pw(token),),
    ).fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Please log in again")
    return user


def serialize_product(row):
    product = dict(row)
    try:
        images = json.loads(product.get("images") or "[]")
    except (TypeError, json.JSONDecodeError):
        images = []
    product["images"] = [image for image in images if isinstance(image, str) and image.strip()]
    if not product["images"] and product.get("image"):
        product["images"] = [product["image"]]
    return product


@app.post("/api/uploads")
def upload_image(upload: ImageUpload):
    match = re.fullmatch(r"data:(image/(?:jpeg|png|webp));base64,(.+)", upload.data_url, re.DOTALL)
    if not match:
        raise HTTPException(status_code=422, detail="Upload a JPG, PNG, or WebP image")

    try:
        image_data = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=422, detail="The selected image is invalid")

    if len(image_data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=422, detail="Image must be smaller than 8 MB")

    extensions = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    filename = f"{uuid.uuid4().hex}{extensions[match.group(1)]}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as image_file:
        image_file.write(image_data)
    return {"url": f"/uploads/{filename}"}


@app.post("/api/auth/register")
def register(body: UserRegister):
    email = normalize_email(body.email)
    validate_email(email)
    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (name, email, phone, password) VALUES (?,?,?,?)",
        (body.name.strip(), email, body.phone.strip() if body.phone else None, hash_pw(body.password)),
    )
    conn.commit()
    user_id = cursor.lastrowid
    user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    result = create_auth_session(conn, user)
    conn.close()
    return result


@app.post("/api/auth/login")
def login(body: UserLogin):
    email = normalize_email(body.email)
    validate_email(email)
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email=? AND password=?",
        (email, hash_pw(body.password)),
    ).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")
    result = create_auth_session(conn, user)
    conn.close()
    return result


@app.post("/api/product-visits")
def record_product_visit(body: ProductVisitCreate, authorization: str = Header(default=None)):
    conn = get_db()
    try:
        conn.execute("BEGIN IMMEDIATE")
        user = visit_user(conn, authorization)
        user_id = user["id"] if user else None
        existing = conn.execute("SELECT * FROM product_visit_events WHERE visit_key=?", (str(body.visit_key),)).fetchone()
        if existing:
            if (existing["visitor_id"] != str(body.visitor_id) or existing["product_id"] != body.product_id
                    or existing["user_id"] != user_id):
                raise HTTPException(status_code=409, detail="Visit does not match")
            return {"success": True}
        product = conn.execute("SELECT id, name FROM products WHERE id=?", (body.product_id,)).fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        conn.execute(
            """INSERT INTO product_visits
            (visit_key, visitor_id, product_id, product_name, user_id, customer_name, customer_email, customer_phone, source, visitor_identity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(visitor_identity, product_id) DO UPDATE SET
                visit_count=product_visits.visit_count + 1,
                last_visited_at=CURRENT_TIMESTAMP,
                product_name=excluded.product_name,
                customer_name=COALESCE(excluded.customer_name, product_visits.customer_name),
                customer_email=COALESCE(excluded.customer_email, product_visits.customer_email),
                customer_phone=COALESCE(excluded.customer_phone, product_visits.customer_phone),
                source=CASE WHEN excluded.source='account' THEN 'account' ELSE product_visits.source END""",
            (str(body.visit_key), str(body.visitor_id), product["id"], product["name"],
             user["id"] if user else None, user["name"] if user else None,
             user["email"] if user else None, user["phone"] if user else None,
             "account" if user else "guest", f"account:{user_id}" if user else f"guest:{body.visitor_id}"),
        )
        identity = f"account:{user_id}" if user else f"guest:{body.visitor_id}"
        stored = conn.execute("SELECT id FROM product_visits WHERE visitor_identity=? AND product_id=?", (identity, body.product_id)).fetchone()
        conn.execute(
            "INSERT INTO product_visit_events (visit_key, visitor_id, product_id, user_id, visit_id) VALUES (?, ?, ?, ?, ?)",
            (str(body.visit_key), str(body.visitor_id), body.product_id, user_id, stored["id"]),
        )
        conn.commit()
        return {"success": True}
    finally:
        conn.close()


@app.put("/api/product-visits/{visit_key}/contact")
def save_visitor_contact(visit_key: uuid.UUID, body: VisitorContact):
    name = body.name.strip()
    email = normalize_email(body.email or "")
    phone = (body.phone or "").strip()
    if len(name) < 2:
        raise HTTPException(status_code=422, detail="Enter your name")
    if email:
        validate_email(email)
    if phone and (not re.fullmatch(r"\+?[0-9 ()-]+", phone) or not 7 <= len(re.sub(r"\D", "", phone)) <= 15):
        raise HTTPException(status_code=422, detail="Enter a valid phone number")
    if not email and not phone:
        raise HTTPException(status_code=422, detail="Enter an email address or phone number, or choose Skip")
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT visit_id, user_id FROM product_visit_events WHERE visit_key=? AND visitor_id=?",
            (str(visit_key), str(body.visitor_id)),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Visit not found")
        if row["user_id"] is not None:
            raise HTTPException(status_code=409, detail="This visit already uses account details")
        conn.execute(
            "UPDATE product_visits SET customer_name=?, customer_email=?, customer_phone=?, source='shared' WHERE visitor_id=? AND user_id IS NULL",
            (name, email or None, phone or None, str(body.visitor_id)),
        )
        conn.commit()
        return {"success": True}
    finally:
        conn.close()


@app.get("/api/admin/product-visits")
def get_product_visits(search: str = Query(default="", max_length=200), source: str = "all",
                      page: int = Query(default=1, ge=1), page_size: int = Query(default=25, ge=1, le=100)):
    if source not in {"all", "account", "shared", "guest"}:
        raise HTTPException(status_code=422, detail="Select a valid visitor type")
    clauses, params = [], []
    if search.strip():
        clauses.append("(customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ? OR product_name LIKE ?)")
        params.extend([f"%{search.strip()}%"] * 4)
    if source != "all":
        clauses.append("source=?")
        params.append(source)
    where = " WHERE " + " AND ".join(clauses) if clauses else ""
    conn = get_db()
    try:
        total = conn.execute("SELECT COUNT(*) FROM product_visits" + where, params).fetchone()[0]
        rows = conn.execute(
            "SELECT id, product_id, product_name, customer_name, customer_email, customer_phone, source, created_at, last_visited_at, visit_count FROM product_visits"
            + where + " ORDER BY last_visited_at DESC, id DESC LIMIT ? OFFSET ?",
            [*params, page_size, (page - 1) * page_size],
        ).fetchall()
        return {"items": [dict(row) for row in rows], "total": total, "page": page, "page_size": page_size}
    finally:
        conn.close()


@app.get("/api/my-orders")
def my_orders(email: str):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM orders WHERE customer_email=? ORDER BY created_at DESC",
        (email,),
    ).fetchall()
    result = []
    for row in rows:
        order = dict(row)
        items = conn.execute("SELECT * FROM order_items WHERE order_id=?", (order["id"],)).fetchall()
        order["items"] = [dict(item) for item in items]
        result.append(order)
    conn.close()
    return result


@app.get("/api/categories")
def get_categories():
    conn = get_db()
    rows = conn.execute("SELECT * FROM categories").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/api/products")
def get_products(category: int = None, search: str = None, featured: bool = None):
    conn = get_db()
    sql = """
        SELECT p.*, c.name as category_name, c.icon as category_icon
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
    """
    params = []
    if category:
        sql += " AND p.category_id = ?"
        params.append(category)
    if search:
        sql += " AND (p.name LIKE ? OR p.description LIKE ?)"
        params.extend([f"%{search.strip()}%", f"%{search.strip()}%"])
    if featured:
        sql += " AND p.is_featured = 1"

    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [serialize_product(row) for row in rows]


@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    conn = get_db()
    row = conn.execute(
        """
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
        """,
        (product_id,),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(row)


@app.post("/api/products")
def create_product(product: ProductCreate):
    conn = get_db()
    if product.original_price is not None and product.original_price < product.price:
        conn.close()
        raise HTTPException(status_code=422, detail="Original price must be greater than or equal to selling price")
    if product.category_id is not None:
        category = conn.execute("SELECT id FROM categories WHERE id=?", (product.category_id,)).fetchone()
        if not category:
            conn.close()
            raise HTTPException(status_code=422, detail="Select a valid category")
    gallery = [image.strip() for image in product.images if image.strip()]
    primary_image = gallery[0] if gallery else product.image
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO products (name, description, price, original_price, image, images, category_id, stock, minimum_order_quantity, unit, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            product.name,
            product.description,
            product.price,
            product.original_price,
            primary_image,
            json.dumps(gallery),
            product.category_id,
            product.stock,
            product.minimum_order_quantity,
            product.unit,
            product.is_featured,
        ),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"id": new_id}


@app.put("/api/products/{product_id}")
def update_product(product_id: int, product: ProductCreate):
    conn = get_db()
    if product.original_price is not None and product.original_price < product.price:
        conn.close()
        raise HTTPException(status_code=422, detail="Original price must be greater than or equal to selling price")
    if product.category_id is not None:
        category = conn.execute("SELECT id FROM categories WHERE id=?", (product.category_id,)).fetchone()
        if not category:
            conn.close()
            raise HTTPException(status_code=422, detail="Select a valid category")
    gallery = [image.strip() for image in product.images if image.strip()]
    primary_image = gallery[0] if gallery else product.image
    cursor = conn.execute(
        """
        UPDATE products
        SET name=?, description=?, price=?, original_price=?, image=?, images=?, category_id=?, stock=?, minimum_order_quantity=?, unit=?, is_featured=?
        WHERE id=?
        """,
        (
            product.name,
            product.description,
            product.price,
            product.original_price,
            primary_image,
            json.dumps(gallery),
            product.category_id,
            product.stock,
            product.minimum_order_quantity,
            product.unit,
            product.is_featured,
            product_id,
        ),
    )
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    conn.commit()
    conn.close()
    return {"success": True}


@app.delete("/api/products/{product_id}")
def delete_product(product_id: int):
    conn = get_db()
    cursor = conn.execute("DELETE FROM products WHERE id=?", (product_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    conn.commit()
    conn.close()
    return {"success": True}


@app.post("/api/orders")
def create_order(order: OrderCreate):
    customer_email = normalize_email(order.customer_email)
    validate_email(customer_email)
    if not order.items or len(order.items) > 50:
        raise HTTPException(status_code=422, detail="An order must contain between 1 and 50 items")
    if order.delivery_type not in DELIVERY_TYPES:
        raise HTTPException(status_code=422, detail="Select a valid delivery type")
    if order.invoice_type not in INVOICE_TYPES:
        raise HTTPException(status_code=422, detail="Select a valid invoice type")
    if order.payment_method not in PAYMENT_METHODS:
        raise HTTPException(status_code=422, detail="Select a valid payment method")

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("BEGIN")
        requested_items = {}
        for item in order.items:
            requested_items[item.id] = requested_items.get(item.id, 0) + item.quantity

        product_ids = tuple(requested_items)
        placeholders = ",".join("?" for _ in product_ids)
        rows = cursor.execute(
            f"SELECT id, name, price, stock, minimum_order_quantity FROM products WHERE id IN ({placeholders})",
            product_ids,
        ).fetchall()
        products = {row["id"]: dict(row) for row in rows}
        if len(products) != len(requested_items):
            raise HTTPException(status_code=422, detail="One or more items are no longer available")

        prepared_items = []
        subtotal = 0
        for product_id, quantity in requested_items.items():
            product = products[product_id]
            minimum_quantity = product.get("minimum_order_quantity") or 1
            if quantity < minimum_quantity:
                raise HTTPException(status_code=422, detail=f"Minimum order quantity for {product['name']} is {minimum_quantity}")
            if product["stock"] < quantity:
                raise HTTPException(status_code=422, detail=f"Only {product['stock']} units of {product['name']} are available")
            prepared_items.append((product, quantity))
            subtotal += product["price"] * quantity

        shipping_amount = STANDARD_SHIPPING_AMOUNT
        total = subtotal + shipping_amount
        user = cursor.execute("SELECT id FROM users WHERE email=?", (customer_email,)).fetchone()
        user_id = user["id"] if user else None

        cursor.execute(
            """
            INSERT INTO orders (
                user_id,
                customer_name,
                customer_email,
                customer_phone,
                company_name,
                gstin,
                address,
                landmark,
                city,
                state,
                pincode,
                delivery_type,
                preferred_slot,
                invoice_type,
                payment_method,
                order_notes,
                shipping_amount,
                total
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                order.customer_name.strip(),
                customer_email,
                order.customer_phone,
                order.company_name,
                order.gstin,
                order.address,
                order.landmark,
                order.city,
                order.state,
                order.pincode,
                order.delivery_type,
                order.preferred_slot,
                order.invoice_type,
                order.payment_method,
                order.order_notes,
                shipping_amount,
                total,
            ),
        )
        order_id = cursor.lastrowid

        for product, quantity in prepared_items:
            cursor.execute(
                """
                INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
                VALUES (?, ?, ?, ?, ?)
                """,
                (order_id, product["id"], product["name"], quantity, product["price"]),
            )
            cursor.execute("UPDATE products SET stock = stock - ? WHERE id = ?", (quantity, product["id"]))

        conn.commit()
        return {"orderId": order_id, "subtotal": subtotal, "shippingAmount": shipping_amount, "total": total}
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Unable to place the order at this time")
    finally:
        conn.close()


@app.get("/api/orders")
def get_orders():
    conn = get_db()
    rows = conn.execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/api/orders/{order_id}")
def get_order(order_id: int):
    conn = get_db()
    order = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    items = conn.execute("SELECT * FROM order_items WHERE order_id=?", (order_id,)).fetchall()
    conn.close()
    result = dict(order)
    result["items"] = [dict(item) for item in items]
    return result


@app.put("/api/orders/{order_id}/status")
def update_order_status(order_id: int, body: StatusUpdate):
    if body.status not in ORDER_STATUSES:
        raise HTTPException(status_code=422, detail="Select a valid order status")
    conn = get_db()
    cursor = conn.execute("UPDATE orders SET status=? WHERE id=?", (body.status, order_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")
    conn.commit()
    conn.close()
    return {"success": True}


@app.get("/api/admin/stats")
def get_stats():
    conn = get_db()
    total_orders = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    total_revenue = conn.execute("SELECT COALESCE(SUM(total), 0) FROM orders").fetchone()[0]
    total_products = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    pending_orders = conn.execute("SELECT COUNT(*) FROM orders WHERE status='pending'").fetchone()[0]
    low_stock_products = conn.execute("SELECT COUNT(*) FROM products WHERE stock BETWEEN 1 AND 10").fetchone()[0]
    out_of_stock_products = conn.execute("SELECT COUNT(*) FROM products WHERE stock = 0").fetchone()[0]
    conn.close()
    return {
        "totalOrders": total_orders,
        "totalRevenue": total_revenue,
        "totalProducts": total_products,
        "pendingOrders": pending_orders,
        "lowStockProducts": low_stock_products,
        "outOfStockProducts": out_of_stock_products,
    }


if os.path.isdir(CLIENT_DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(CLIENT_DIST_DIR, "assets")), name="frontend-assets")

    @app.get("/{path:path}", include_in_schema=False)
    def serve_frontend(path: str):
        requested_file = os.path.join(CLIENT_DIST_DIR, path)
        if path and os.path.isfile(requested_file):
            return FileResponse(requested_file)
        return FileResponse(os.path.join(CLIENT_DIST_DIR, "index.html"))
