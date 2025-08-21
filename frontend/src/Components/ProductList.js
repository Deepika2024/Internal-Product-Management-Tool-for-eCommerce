import React, { useEffect, useState } from 'react';
import {
  getProducts,
  getProductById,
  createProductFull,
  getCategories,
  getCategoryAttributes,
  updateProduct,
} from '../api';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    sku: '',
    category_id: '',
    attribute_values: [],
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load products and categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Fetch products list
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      setProducts(res.data);
      setError(null);
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories list
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data);
      setError(null);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // When selected category changes (in create mode), fetch its attributes
  useEffect(() => {
    if (!editingProductId && newProduct.category_id) {
      fetchCategoryAttributes(newProduct.category_id, null);
    } else if (!newProduct.category_id) {
      setCategoryAttributes([]);
      setNewProduct((prev) => ({ ...prev, attribute_values: [] }));
    }
    // eslint-disable-next-line
  }, [newProduct.category_id]);

  // Fetch and prepare category attributes, optionally mapping values from existing product
  const fetchCategoryAttributes = async (categoryId, editingProduct) => {
    setLoading(true);
    try {
      const res = await getCategoryAttributes(categoryId);
      setCategoryAttributes(res.data);

      const attrVals = res.data.map((attr) => {
        let val = '';
        if (editingProduct && editingProduct.attribute_values) {
          const found = editingProduct.attribute_values.find(
            (av) => av.category_attribute_id === attr.id
          );
          if (found) val = found.value;
        }
        return { category_attribute_id: attr.id, value: val };
      });

      setNewProduct((prev) => ({
        ...prev,
        attribute_values: attrVals,
      }));
      setError(null);
    } catch {
      setError('Failed to load category attributes');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes for product base fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  // Handle input changes for dynamic category-specific attributes
  const handleAttributeChange = (idx, value) => {
    setNewProduct((prev) => {
      const updated = prev.attribute_values.map((attr, i) =>
        i === idx ? { ...attr, value } : attr
      );
      return { ...prev, attribute_values: updated };
    });
  };

  // Validate form before submit
  const validateProductForm = () => {
    if (
      !newProduct.name.trim() ||
      !newProduct.sku.trim() ||
      !newProduct.category_id ||
      !newProduct.price
    )
      return 'Please fill in all required fields';
    if (
      categoryAttributes.some(
        (attr, idx) =>
          attr.is_required && !newProduct.attribute_values[idx]?.value.trim()
      )
    )
      return 'Please fill in all required attribute values';
    return null;
  };

  // Create or update product submit handler
 const handleSubmit = async (e) => {
  e.preventDefault();
  const validationErr = validateProductForm();
  if (validationErr) {
    setError(validationErr);
    return;
  }

  // Build attribute_values with correct category_attribute_id and value
  const attribute_values = categoryAttributes.map((attr, idx) => ({
    category_attribute_id: attr.id,
    value: newProduct.attribute_values[idx]?.value || '',
  }));

  const payload = {
    ...newProduct,
    price: parseFloat(newProduct.price),
    category_id: parseInt(newProduct.category_id),
    attribute_values,
  };

  setLoading(true);
  setError(null);
  try {
    if (editingProductId !== null && editingProductId !== undefined) {
      await updateProduct(editingProductId, payload);
      setEditingProductId(null);
    } else {
      await createProductFull(payload);
    }

    // Reset form after success
    setNewProduct({
      name: '',
      description: '',
      price: '',
      sku: '',
      category_id: '',
      attribute_values: [],
    });
    setCategoryAttributes([]);
    fetchProducts();
  } catch (err) {
  if (err.response && err.response.data) {
    console.error("Backend validation error:", JSON.stringify(err.response.data, null, 2));
    setError(`Failed to save product: ${JSON.stringify(err.response.data, null, 2)}`);
  } else {
    setError('Failed to save product');
  }

  } finally {
    setLoading(false);
  }
};

  // Start editing product - fetch full product details including attributes
  const startEdit = async (product) => {
    setLoading(true);
    try {
      const res = await getProductById(product.id);
      const fullProduct = res.data;
      await fetchCategoryAttributes(fullProduct.category_id, fullProduct);
      setEditingProductId(fullProduct.id);
      setNewProduct({
        name: fullProduct.name,
        description: fullProduct.description || '',
        price: fullProduct.price.toString(),
        sku: fullProduct.sku,
        category_id: fullProduct.category_id.toString(),
        attribute_values: fullProduct.attribute_values || [],
      });
      setError(null);
    } catch {
      setError('Failed to load product attributes for edit');
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing and reset form
  const cancelEdit = () => {
    setEditingProductId(null);
    setNewProduct({
      name: '',
      description: '',
      price: '',
      sku: '',
      category_id: '',
      attribute_values: [],
    });
    setCategoryAttributes([]);
    setError(null);
  };

  return (
    <div>
      <h2>{editingProductId === null ? 'Add New Product' : 'Edit Product'}</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name"
          value={newProduct.name}
          onChange={handleChange}
          required
        />
        <input
          name="description"
          placeholder="Description"
          value={newProduct.description}
          onChange={handleChange}
        />
        <input
          name="price"
          placeholder="Price"
          type="number"
          step="0.01"
          value={newProduct.price}
          onChange={handleChange}
          required
        />
        <input
          name="sku"
          placeholder="SKU"
          value={newProduct.sku}
          onChange={handleChange}
          required
        />
        <select
          name="category_id"
          value={newProduct.category_id}
          onChange={handleChange}
          required
          disabled={editingProductId !== null}
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {categoryAttributes.length > 0 && (
          <>
            <h3>Category Attributes</h3>
            {categoryAttributes.map((catAttr, idx) => (
              <div key={catAttr.id} style={{ marginBottom: 8 }}>
                <label>
                  {catAttr.attribute.name} {catAttr.is_required ? '*' : ''}:
                </label>
                <input
                  type="text"
                  value={
                    newProduct.attribute_values[idx]
                      ? newProduct.attribute_values[idx].value
                      : ''
                  }
                  onChange={(e) => handleAttributeChange(idx, e.target.value)}
                  required={catAttr.is_required}
                />
              </div>
            ))}
          </>
        )}

        <button className="btn btn-success btn-sm" type="submit" disabled={loading}>
          {editingProductId === null ? 'Create Product' : 'Update Product'}
        </button>

        {editingProductId !== null && (
          <button className="btn btn-secondary btn-sm" type="button" onClick={cancelEdit} disabled={loading}>
            Cancel
          </button>
        )}
      </form>

      <h2>Product List</h2>
      <ul>
        {products.length === 0 && <li>No products available.</li>}
        {products.map((prod) => (
          <li key={prod.id} style={{ marginBottom: 10 }}>
            <strong>{prod.name}</strong> ({prod.sku}) - ${prod.price.toFixed(2)} - Category:{' '}
            {categories.find((cat) => cat.id === prod.category_id)?.name || 'Unknown'}
            <button
              className="btn btn-primary btn-sm"
              style={{ marginLeft: 10 }}
              onClick={() => startEdit(prod)}
              disabled={loading}
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductList;
