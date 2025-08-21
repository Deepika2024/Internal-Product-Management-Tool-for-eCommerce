from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, constr, Field


# ---------------- ATTRIBUTES ----------------
class AttributeBase(BaseModel):
    name: constr(min_length=1)
    data_type: constr(min_length=1)
    enum_values: Optional[str] = None


class AttributeCreate(AttributeBase):
    pass


class Attribute(AttributeBase):
    id: int

    model_config = {"from_attributes": True}


# ---------------- CATEGORIES ----------------
class CategoryBase(BaseModel):
    name: constr(min_length=1)
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int
    attributes: List[CategoryAttribute] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# ---------------- CATEGORY ATTRIBUTES ----------------
class CategoryAttributeBase(BaseModel):
    attribute_id: int
    is_required: bool = False


class CategoryAttributeCreate(CategoryAttributeBase):
    pass


class CategoryAttribute(CategoryAttributeBase):
    id: int
    category_id: int
    attribute: Attribute

    model_config = {"from_attributes": True}


# ---------------- PRODUCTS ----------------
class ProductBase(BaseModel):
    category_id: int
    name: constr(min_length=1)
    description: Optional[str] = None
    price: float
    sku: constr(min_length=1)

    model_config = {"from_attributes": True}


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: int

    model_config = {"from_attributes": True}


# ---------------- PRODUCT ATTRIBUTE VALUES ----------------
class ProductAttributeValueBase(BaseModel):
    category_attribute_id: int
    value: constr(min_length=1)

    model_config = {"from_attributes": True}


class ProductAttributeValueCreate(ProductAttributeValueBase):
    pass


class ProductAttributeValue(ProductAttributeValueBase):
    id: int
    product_id: int

    model_config = {"from_attributes": True}


class ProductAttributeValueUpdate(ProductAttributeValueBase):
    id: Optional[int] = None


# ---------------- PRODUCT WITH ATTRIBUTES ----------------
class ProductUpdateWithAttributes(ProductBase):
    attribute_values: List[ProductAttributeValueUpdate]

    model_config = {"from_attributes": True}


# Resolve forward references for Pydantic v2
Category.model_rebuild()
CategoryAttribute.model_rebuild()
