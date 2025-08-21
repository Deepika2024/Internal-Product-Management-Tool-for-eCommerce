from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DECIMAL
from sqlalchemy.orm import relationship
from database import Base  # Your declarative base


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)

    attributes = relationship("CategoryAttribute", back_populates="category")
    products = relationship("Product", back_populates="category")


class Attribute(Base):
    __tablename__ = "attributes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    data_type = Column(String, nullable=False)
    enum_values = Column(Text, nullable=True)  # comma-separated values for enum

    category_attributes = relationship("CategoryAttribute", back_populates="attribute")


class CategoryAttribute(Base):
    __tablename__ = "category_attributes"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    attribute_id = Column(Integer, ForeignKey("attributes.id"))
    is_required = Column(Boolean, default=False)

    category = relationship("Category", back_populates="attributes")
    attribute = relationship("Attribute", back_populates="category_attributes")
    product_attribute_values = relationship("ProductAttributeValue", back_populates="category_attribute")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    sku = Column(String, unique=True, index=True, nullable=False)

    category = relationship("Category", back_populates="products")
    attribute_values = relationship("ProductAttributeValue", back_populates="product")


class ProductAttributeValue(Base):
    __tablename__ = "product_attribute_values"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    category_attribute_id = Column(Integer, ForeignKey("category_attributes.id"))
    value = Column(String, nullable=False)

    product = relationship("Product", back_populates="attribute_values")
    category_attribute = relationship("CategoryAttribute", back_populates="product_attribute_values")
