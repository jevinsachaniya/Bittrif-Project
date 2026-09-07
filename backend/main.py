# -*- coding: utf-8 -*-
import base64
import binascii
import hashlib
import json
import os
import re
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import get_db, init_db
from models import ImageUpload, OrderCreate, ProductCreate, StatusUpdate, UserLogin, UserRegister

os.environ["PYTHONUTF8"] = "1"

app = FastAPI(title="Bittrif Group API")
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

ORDER_STATUSES = {"pending", "processing", "shipped", "delivered", "cancelled"}
DELIVERY_TYPES = {"standard", "priority"}
INVOICE_TYPES = {"gst", "standard"}
PAYMENT_METHODS = {"cod", "proforma"}
STANDARD_SHIPPING_AMOUNT = 0

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


def hash_pw(password):
    return hashlib.sha256(password.encode()).hexdigest()


def normalize_email(email):
    return email.strip().lower()


def validate_email(email):
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(status_code=422, detail="Enter a valid email address")


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
    conn.close()
    return {"id": user_id, "name": body.name.strip(), "email": email}


@app.post("/api/auth/login")
def login(body: UserLogin):
    email = normalize_email(body.email)
    validate_email(email)
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email=? AND password=?",
        (email, hash_pw(body.password)),
    ).fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_dict = dict(user)
    return {"id": user_dict["id"], "name": user_dict["name"], "email": user_dict["email"]}


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
