from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
import models, schemas


# --------- CATEGORY CRUD ---------

def get_category(db: Session, category_id: int):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).offset(skip).limit(limit).all()


def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(name=category.name, description=category.description)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(db: Session, category_id: int, category: schemas.CategoryCreate):
    db_category = get_category(db, category_id)
    db_category.name = category.name
    db_category.description = category.description
    db.commit()
    db.refresh(db_category)
    return db_category


def delete_category(db: Session, category_id: int):
    db_category = get_category(db, category_id)
    db.delete(db_category)
    db.commit()
    return {"detail": "Category deleted successfully"}


# --------- ATTRIBUTE CRUD ---------

def get_attributes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Attribute).offset(skip).limit(limit).all()


def create_attribute(db: Session, attribute: schemas.AttributeCreate):
    db_attribute = models.Attribute(
        name=attribute.name,
        data_type=attribute.data_type,
        enum_values=attribute.enum_values
    )
    db.add(db_attribute)
    db.commit()
    db.refresh(db_attribute)
    return db_attribute


def update_attribute(db: Session, attribute_id: int, attribute: schemas.AttributeCreate):
    db_attribute = db.query(models.Attribute).filter(models.Attribute.id == attribute_id).first()
    if not db_attribute:
        raise HTTPException(status_code=404, detail="Attribute not found")
    db_attribute.name = attribute.name
    db_attribute.data_type = attribute.data_type
    db_attribute.enum_values = attribute.enum_values
    db.commit()
    db.refresh(db_attribute)
    return db_attribute


def delete_attribute(db: Session, attribute_id: int):
    db_attribute = db.query(models.Attribute).filter(models.Attribute.id == attribute_id).first()
    if not db_attribute:
        raise HTTPException(status_code=404, detail="Attribute not found")
    db.delete(db_attribute)
    db.commit()
    return {"detail": "Attribute deleted successfully"}


# --------- CATEGORY ATTRIBUTE CRUD ---------

def get_category_attributes(db: Session, category_id: int):
    return db.query(models.CategoryAttribute).filter(
        models.CategoryAttribute.category_id == category_id
    ).options(joinedload(models.CategoryAttribute.attribute)).all()


def assign_attribute_to_category(db: Session, category_id: int, assignment: schemas.CategoryAttributeCreate):
    # Check existing association to prevent duplicates
    existing = db.query(models.CategoryAttribute).filter(
        models.CategoryAttribute.category_id == category_id,
        models.CategoryAttribute.attribute_id == assignment.attribute_id
    ).first()
    if existing:
        return existing
    cat_attr = models.CategoryAttribute(
        category_id=category_id,
        attribute_id=assignment.attribute_id,
        is_required=assignment.is_required
    )
    db.add(cat_attr)
    db.commit()
    db.refresh(cat_attr)
    return cat_attr


def remove_attribute_from_category(db: Session, category_attribute_id: int):
    cat_attr = db.query(models.CategoryAttribute).filter(
        models.CategoryAttribute.id == category_attribute_id
    ).first()
    if not cat_attr:
        return None
    db.delete(cat_attr)
    db.commit()
    return cat_attr


# --------- PRODUCT CRUD ---------

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()


def create_product(db: Session, product: schemas.ProductCreate, attribute_values: list = None):
    # Pre-check for unique SKU to provide a clean error message
    existing_sku = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if existing_sku:
        raise HTTPException(status_code=409, detail="SKU already exists")

    db_product = models.Product(
        name=product.name,
        category_id=product.category_id,
        description=product.description,
        price=product.price,
        sku=product.sku
    )
    db.add(db_product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        # Most likely a SKU uniqueness violation
        raise HTTPException(status_code=409, detail="SKU already exists") from exc
    db.refresh(db_product)

    if attribute_values:
        for attr_val in attribute_values:
            pav = models.ProductAttributeValue(
                product_id=db_product.id,
                category_attribute_id=attr_val.category_attribute_id,
                value=attr_val.value
            )
            db.add(pav)

        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=400, detail="Invalid attribute assignment") from exc

    return db_product


def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdateWithAttributes):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        return None

    # Enforce SKU uniqueness when changing the SKU
    if product_update.sku and product_update.sku != db_product.sku:
        existing = db.query(models.Product).filter(
            models.Product.sku == product_update.sku,
            models.Product.id != product_id
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="SKU already exists")

    db_product.name = product_update.name
    db_product.description = product_update.description
    db_product.price = product_update.price
    db_product.sku = product_update.sku
    db_product.category_id = product_update.category_id

    # Update or create attribute values
    existing_pavs = db.query(models.ProductAttributeValue).filter(
        models.ProductAttributeValue.product_id == product_id
    ).all()
    pav_dict = {pav.category_attribute_id: pav for pav in existing_pavs}

    for attr_val in product_update.attribute_values:
        if attr_val.category_attribute_id in pav_dict:
            pav_dict[attr_val.category_attribute_id].value = attr_val.value
        else:
            new_pav = models.ProductAttributeValue(
                product_id=product_id,
                category_attribute_id=attr_val.category_attribute_id,
                value=attr_val.value
            )
            db.add(new_pav)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="SKU already exists") from exc
    db.refresh(db_product)
    return db_product
