from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, crud, database
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from typing import List
import models, schemas, crud, database
from database import Base, engine
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Ensure DB tables exist at startup
Base.metadata.create_all(bind=engine)

# Health check
@app.get("/")
def healthcheck():
    return {"status": "ok"}

# Serve static frontend (frontend/ directory) if present
if os.path.isdir("frontend"):
    app.mount("/frontend", StaticFiles(directory="frontend", html=True), name="frontend")

# CATEGORY ROUTES

@app.post("/categories/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db, category)

@app.get("/categories/", response_model=List[schemas.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_categories(db, skip, limit)

@app.put("/categories/{category_id}", response_model=schemas.Category)
def update_category(category_id: int, category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    updated = crud.update_category(db, category_id, category)
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated

@app.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    return crud.delete_category(db, category_id)

# ATTRIBUTE ROUTES

@app.post("/attributes/", response_model=schemas.Attribute)
def create_attribute(attribute: schemas.AttributeCreate, db: Session = Depends(get_db)):
    return crud.create_attribute(db, attribute)

@app.get("/attributes/", response_model=List[schemas.Attribute])
def read_attributes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_attributes(db, skip, limit)

@app.put("/attributes/{attribute_id}", response_model=schemas.Attribute)
def update_attribute(attribute_id: int, attribute: schemas.AttributeCreate, db: Session = Depends(get_db)):
    updated = crud.update_attribute(db, attribute_id, attribute)
    if not updated:
        raise HTTPException(status_code=404, detail="Attribute not found")
    return updated

@app.delete("/attributes/{attribute_id}")
def delete_attribute(attribute_id: int, db: Session = Depends(get_db)):
    return crud.delete_attribute(db, attribute_id)

# CATEGORY ATTRIBUTE ROUTES

@app.get("/categories/{category_id}/attributes/", response_model=List[schemas.CategoryAttribute])
def get_category_attributes(category_id: int, db: Session = Depends(get_db)):
    return crud.get_category_attributes(db, category_id)

@app.post("/categories/{category_id}/attributes/", response_model=schemas.CategoryAttribute)
def assign_attribute_to_category(category_id: int, assignment: schemas.CategoryAttributeCreate, db: Session = Depends(get_db)):
    return crud.assign_attribute_to_category(db, category_id, assignment)

@app.delete("/category-attributes/{category_attribute_id}/")
def remove_attribute_from_category(category_attribute_id: int, db: Session = Depends(get_db)):
    removed = crud.remove_attribute_from_category(db, category_attribute_id)
    if not removed:
        raise HTTPException(status_code=404, detail="CategoryAttribute not found")
    return {"detail": "Category attribute removed"}

# PRODUCT ROUTES

# Create new product (without attributes)
@app.post("/products/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, product)


# Create new product with its attribute values nested
@app.post("/products/full/", response_model=schemas.Product)
def create_product_full(product: schemas.ProductUpdateWithAttributes, db: Session = Depends(get_db)):
    return crud.create_product(db, product, product.attribute_values)


# Get list of products (basic info only)
@app.get("/products/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db, skip, limit)


# GET single product by ID with attribute values (New endpoint to fix 405 error)
@app.get("/products/{product_id}", response_model=schemas.ProductUpdateWithAttributes)
def read_product(product_id: int = Path(..., description="Product ID"), db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get all attribute values for this product
    attr_values = db.query(models.ProductAttributeValue).filter(models.ProductAttributeValue.product_id == product_id).all()

    # Map attribute values to schema list
    attribute_values = [
        schemas.ProductAttributeValue(
            id=av.id,
            product_id=av.product_id,
            category_attribute_id=av.category_attribute_id,
            value=av.value
        )
        for av in attr_values
    ]

    # Convert product to schema and attach attribute values
    product_data = schemas.ProductUpdateWithAttributes.from_orm(product)
    product_data.attribute_values = attribute_values
    return product_data


# Update existing product with its attribute values
@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductUpdateWithAttributes, db: Session = Depends(get_db)):
    updated = crud.update_product(db, product_id, product)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated
