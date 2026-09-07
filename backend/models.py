from typing import List, Optional

from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    phone: Optional[str] = None
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=1, max_length=128)


class OrderItem(BaseModel):
    id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=240)
    price: float = Field(ge=0)
    quantity: int = Field(gt=0, le=1000000)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    customer_email: str = Field(min_length=5, max_length=254)
    customer_phone: Optional[str] = Field(default=None, max_length=30)
    company_name: Optional[str] = Field(default=None, max_length=160)
    gstin: Optional[str] = Field(default=None, max_length=20)
    address: str = Field(min_length=8, max_length=500)
    landmark: Optional[str] = Field(default=None, max_length=200)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    pincode: Optional[str] = Field(default=None, max_length=20)
    delivery_type: Optional[str] = "standard"
    preferred_slot: Optional[str] = None
    invoice_type: Optional[str] = "gst"
    payment_method: Optional[str] = "cod"
    order_notes: Optional[str] = Field(default=None, max_length=1000)
    items: List[OrderItem]


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    price: float = Field(gt=0)
    original_price: Optional[float] = Field(default=None, gt=0)
    image: Optional[str] = Field(default="https://placehold.co/400x300", max_length=2000)
    images: List[str] = Field(default_factory=list, max_length=8)
    category_id: Optional[int] = None
    stock: Optional[int] = Field(default=100, ge=0, le=1000000)
    minimum_order_quantity: Optional[int] = Field(default=1, ge=1, le=1000000)
    unit: Optional[str] = Field(default="piece", max_length=100)
    is_featured: Optional[int] = Field(default=0, ge=0, le=1)


class ImageUpload(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    data_url: str = Field(min_length=32, max_length=14000000)


class StatusUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=30)
