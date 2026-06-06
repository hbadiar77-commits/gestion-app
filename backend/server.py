from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date
from enum import Enum
from decimal import Decimal


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Commerce Management API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# =================== ENUMS ===================
class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    MOBILE = "mobile"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class Currency(str, Enum):
    GNF = "GNF"
    USD = "USD" 
    EUR = "EUR"


# =================== CURRENCY MODELS ===================
class CurrencySettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    base_currency: Currency = Currency.GNF
    exchange_rates: Dict[str, float] = {
        "GNF": 1.0,      # Base currency
        "USD": 0.00012,  # 1 GNF = 0.00012 USD
        "EUR": 0.00011   # 1 GNF = 0.00011 EUR
    }
    currency_formats: Dict[str, Dict[str, Any]] = {
        "GNF": {
            "symbol": "GNF",
            "position": "after",
            "decimal_places": 0,
            "thousands_separator": " "
        },
        "USD": {
            "symbol": "$",
            "position": "before", 
            "decimal_places": 2,
            "thousands_separator": ","
        },
        "EUR": {
            "symbol": "€",
            "position": "after",
            "decimal_places": 2,
            "thousands_separator": " "
        }
    }
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CurrencySettingsUpdate(BaseModel):
    base_currency: Optional[Currency] = None
    exchange_rates: Optional[Dict[str, float]] = None


# =================== MODELS ===================

# Supplier Models
class Supplier(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    company: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True
    total_orders: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SupplierCreate(BaseModel):
    name: str
    company: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

# Category Models
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None


# Product Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: float  # Stored in base currency (GNF)
    cost_price: Optional[float] = None
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    stock_quantity: int = 0
    min_stock_level: int = 5
    image_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    cost_price: Optional[float] = None
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    stock_quantity: int = 0
    min_stock_level: int = 5
    image_url: Optional[str] = None
    is_active: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    stock_quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


# Customer Models
class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    total_purchases: float = 0.0  # In base currency
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None


# Order Models
class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float  # In base currency
    total_price: float  # In base currency

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    items: List[OrderItem]
    subtotal: float  # In base currency
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float  # In base currency
    currency: Currency = Currency.GNF
    status: OrderStatus = OrderStatus.PENDING
    payment_method: Optional[PaymentMethod] = None
    payment_status: PaymentStatus = PaymentStatus.PENDING
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    items: List[OrderItem]
    discount_amount: float = 0.0
    payment_method: Optional[PaymentMethod] = None
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    notes: Optional[str] = None


# Stock Movement Models
class StockMovement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    movement_type: str  # "in", "out", "adjustment"
    quantity: int
    reason: str
    reference_id: Optional[str] = None  # order_id if related to sale
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StockMovementCreate(BaseModel):
    product_id: str
    movement_type: str
    quantity: int
    reason: str
    reference_id: Optional[str] = None


# Stats Models
class DashboardStats(BaseModel):
    total_sales_today: float
    total_orders_today: int
    total_customers: int
    total_products: int
    low_stock_products: int
    recent_orders: List[Order]
    top_selling_products: List[Dict[str, Any]]


# =================== CURRENCY ENDPOINTS ===================

@api_router.get("/currency/settings", response_model=CurrencySettings)
async def get_currency_settings():
    settings = await db.currency_settings.find_one()
    if not settings:
        # Create default settings
        default_settings = CurrencySettings()
        await db.currency_settings.insert_one(default_settings.dict())
        return default_settings
    return CurrencySettings(**settings)

@api_router.put("/currency/settings", response_model=CurrencySettings)
async def update_currency_settings(settings_update: CurrencySettingsUpdate):
    existing_settings = await db.currency_settings.find_one()
    if not existing_settings:
        # Create default if doesn't exist
        existing_settings = CurrencySettings().dict()
        await db.currency_settings.insert_one(existing_settings)
    
    update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.currency_settings.update_one({}, {"$set": update_data})
    updated_settings = await db.currency_settings.find_one()
    return CurrencySettings(**updated_settings)

@api_router.get("/currency/convert")
async def convert_currency(amount: float, from_currency: Currency, to_currency: Currency):
    settings = await get_currency_settings()
    
    if from_currency == to_currency:
        return {"amount": amount, "converted_amount": amount, "rate": 1.0}
    
    # Convert to base currency first (GNF)
    if from_currency != Currency.GNF:
        base_amount = amount / settings.exchange_rates[from_currency.value]
    else:
        base_amount = amount
    
    # Convert from base to target currency
    if to_currency != Currency.GNF:
        converted_amount = base_amount * settings.exchange_rates[to_currency.value]
    else:
        converted_amount = base_amount
    
    rate = converted_amount / amount if amount != 0 else 0
    
    return {
        "amount": amount,
        "converted_amount": round(converted_amount, 2),
        "rate": rate,
        "from_currency": from_currency.value,
        "to_currency": to_currency.value
    }


# =================== SUPPLIER ENDPOINTS ===================

@api_router.post("/suppliers", response_model=Supplier)
async def create_supplier(supplier: SupplierCreate):
    supplier_dict = supplier.dict()
    supplier_obj = Supplier(**supplier_dict)
    await db.suppliers.insert_one(supplier_obj.dict())
    return supplier_obj

@api_router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers(
    search: Optional[str] = None,
    is_active: Optional[bool] = None
):
    filter_dict = {}
    
    if is_active is not None:
        filter_dict["is_active"] = is_active
    if search:
        filter_dict["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
            {"contact_person": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    suppliers = await db.suppliers.find(filter_dict).to_list(1000)
    return [Supplier(**supplier) for supplier in suppliers]

@api_router.get("/suppliers/{supplier_id}", response_model=Supplier)
async def get_supplier(supplier_id: str):
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return Supplier(**supplier)

@api_router.put("/suppliers/{supplier_id}", response_model=Supplier)
async def update_supplier(supplier_id: str, supplier_update: SupplierUpdate):
    update_data = {k: v for k, v in supplier_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.suppliers.update_one({"id": supplier_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    updated_supplier = await db.suppliers.find_one({"id": supplier_id})
    return Supplier(**updated_supplier)

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str):
    # Check if supplier has products
    products_count = await db.products.count_documents({"supplier_id": supplier_id})
    if products_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete supplier. {products_count} products are linked to this supplier."
        )
    
    result = await db.suppliers.delete_one({"id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}

@api_router.get("/suppliers/{supplier_id}/products", response_model=List[Product])
async def get_supplier_products(supplier_id: str):
    # Verify supplier exists
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    products = await db.products.find({"supplier_id": supplier_id}).to_list(1000)
    return [Product(**product) for product in products]


# =================== CATEGORY ENDPOINTS ===================

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate):
    category_dict = category.dict()
    category_obj = Category(**category_dict)
    await db.categories.insert_one(category_obj.dict())
    return category_obj

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find().to_list(1000)
    return [Category(**category) for category in categories]

@api_router.get("/categories/{category_id}", response_model=Category)
async def get_category(category_id: str):
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return Category(**category)

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_update: CategoryUpdate):
    update_data = {k: v for k, v in category_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.categories.update_one({"id": category_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    updated_category = await db.categories.find_one({"id": category_id})
    return Category(**updated_category)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}


# =================== PRODUCT ENDPOINTS ===================

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    # Check if SKU or barcode already exists
    if product.sku:
        existing = await db.products.find_one({"sku": product.sku})
        if existing:
            raise HTTPException(status_code=400, detail="SKU already exists")
    
    if product.barcode:
        existing = await db.products.find_one({"barcode": product.barcode})
        if existing:
            raise HTTPException(status_code=400, detail="Barcode already exists")
    
    product_dict = product.dict()
    product_obj = Product(**product_dict)
    await db.products.insert_one(product_obj.dict())
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    low_stock: Optional[bool] = None
):
    filter_dict = {}
    
    if category_id:
        filter_dict["category_id"] = category_id
    if is_active is not None:
        filter_dict["is_active"] = is_active
    if search:
        filter_dict["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
            {"barcode": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(filter_dict).to_list(1000)
    product_list = [Product(**product) for product in products]
    
    if low_stock:
        product_list = [p for p in product_list if p.stock_quantity <= p.min_stock_level]
    
    return product_list

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.get("/products/barcode/{barcode}", response_model=Product)
async def get_product_by_barcode(barcode: str):
    product = await db.products.find_one({"barcode": barcode})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductUpdate):
    update_data = {k: v for k, v in product_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = await db.products.find_one({"id": product_id})
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


# =================== CUSTOMER ENDPOINTS ===================

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate):
    customer_dict = customer.dict()
    customer_obj = Customer(**customer_dict)
    await db.customers.insert_one(customer_obj.dict())
    return customer_obj

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(search: Optional[str] = None):
    filter_dict = {}
    if search:
        filter_dict["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    customers = await db.customers.find(filter_dict).to_list(1000)
    return [Customer(**customer) for customer in customers]

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_update: CustomerUpdate):
    update_data = {k: v for k, v in customer_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.customers.update_one({"id": customer_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    updated_customer = await db.customers.find_one({"id": customer_id})
    return Customer(**updated_customer)

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}


# =================== ORDER ENDPOINTS ===================

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    # Calculate totals
    subtotal = sum(item.total_price for item in order.items)
    tax_amount = subtotal * 0.1  # 10% tax
    total_amount = subtotal + tax_amount - order.discount_amount
    
    order_dict = order.dict()
    order_dict.update({
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "currency": Currency.GNF,  # Default currency
        "status": OrderStatus.PENDING,
        "payment_status": PaymentStatus.PENDING
    })
    
    order_obj = Order(**order_dict)
    await db.orders.insert_one(order_obj.dict())
    
    # Update product stock
    for item in order.items:
        await db.products.update_one(
            {"id": item.product_id},
            {"$inc": {"stock_quantity": -item.quantity}}
        )
        
        # Create stock movement record
        stock_movement = StockMovement(
            product_id=item.product_id,
            movement_type="out",
            quantity=item.quantity,
            reason="Sale",
            reference_id=order_obj.id
        )
        await db.stock_movements.insert_one(stock_movement.dict())
    
    # Update customer total purchases if customer exists
    if order.customer_id:
        await db.customers.update_one(
            {"id": order.customer_id},
            {
                "$inc": {
                    "total_purchases": total_amount
                }
            }
        )
    
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(
    status: Optional[OrderStatus] = None,
    customer_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
):
    filter_dict = {}
    
    if status:
        filter_dict["status"] = status
    if customer_id:
        filter_dict["customer_id"] = customer_id
    if date_from:
        filter_dict["created_at"] = {"$gte": datetime.combine(date_from, datetime.min.time())}
    if date_to:
        if "created_at" in filter_dict:
            filter_dict["created_at"]["$lte"] = datetime.combine(date_to, datetime.max.time())
        else:
            filter_dict["created_at"] = {"$lte": datetime.combine(date_to, datetime.max.time())}
    
    orders = await db.orders.find(filter_dict).sort("created_at", -1).to_list(1000)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**order)

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_update: OrderUpdate):
    update_data = {k: v for k, v in order_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    updated_order = await db.orders.find_one({"id": order_id})
    return Order(**updated_order)


# =================== STOCK ENDPOINTS ===================

@api_router.post("/stock/movements", response_model=StockMovement)
async def create_stock_movement(movement: StockMovementCreate):
    movement_obj = StockMovement(**movement.dict())
    await db.stock_movements.insert_one(movement_obj.dict())
    
    # Update product stock
    multiplier = 1 if movement.movement_type == "in" else -1
    await db.products.update_one(
        {"id": movement.product_id},
        {"$inc": {"stock_quantity": movement.quantity * multiplier}}
    )
    
    return movement_obj

@api_router.get("/stock/movements", response_model=List[StockMovement])
async def get_stock_movements(product_id: Optional[str] = None):
    filter_dict = {}
    if product_id:
        filter_dict["product_id"] = product_id
    
    movements = await db.stock_movements.find(filter_dict).sort("created_at", -1).to_list(1000)
    return [StockMovement(**movement) for movement in movements]

@api_router.get("/stock/low", response_model=List[Product])
async def get_low_stock_products():
    products = await db.products.find({"is_active": True}).to_list(1000)
    low_stock_products = []
    for product_dict in products:
        product = Product(**product_dict)
        if product.stock_quantity <= product.min_stock_level:
            low_stock_products.append(product)
    return low_stock_products


# =================== DASHBOARD ENDPOINTS ===================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())
    
    # Today's sales
    today_orders = await db.orders.find({
        "created_at": {"$gte": today_start, "$lte": today_end},
        "status": {"$ne": "cancelled"}
    }).to_list(1000)
    
    total_sales_today = sum(order.get("total_amount", 0) for order in today_orders)
    total_orders_today = len(today_orders)
    
    # Total counts
    total_customers = await db.customers.count_documents({})
    total_products = await db.products.count_documents({"is_active": True})
    
    # Low stock products
    all_products = await db.products.find({"is_active": True}).to_list(1000)
    low_stock_count = sum(1 for p in all_products if p.get("stock_quantity", 0) <= p.get("min_stock_level", 5))
    
    # Recent orders
    recent_orders_data = await db.orders.find().sort("created_at", -1).limit(5).to_list(5)
    recent_orders = [Order(**order) for order in recent_orders_data]
    
    # Top selling products — aggregate quantities sold across all completed orders
    completed_orders = await db.orders.find({"status": "completed"}).to_list(10000)
    product_sales: Dict[str, Dict[str, Any]] = {}
    for order in completed_orders:
        for item in order.get("items", []):
            pid = item.get("product_id", "")
            if pid not in product_sales:
                product_sales[pid] = {
                    "product_id": pid,
                    "product_name": item.get("product_name", ""),
                    "total_quantity": 0,
                    "total_revenue": 0.0,
                }
            product_sales[pid]["total_quantity"] += item.get("quantity", 0)
            product_sales[pid]["total_revenue"] += item.get("total_price", 0.0)
    top_selling_products = sorted(
        product_sales.values(), key=lambda x: x["total_quantity"], reverse=True
    )[:5]
    
    return DashboardStats(
        total_sales_today=total_sales_today,
        total_orders_today=total_orders_today,
        total_customers=total_customers,
        total_products=total_products,
        low_stock_products=low_stock_count,
        recent_orders=recent_orders,
        top_selling_products=top_selling_products
    )


# =================== BASIC ENDPOINTS ===================

@api_router.get("/")
async def root():
    return {"message": "Commerce Management API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()