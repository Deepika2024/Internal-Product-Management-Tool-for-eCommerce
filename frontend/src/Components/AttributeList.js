import React, { useEffect, useRef, useState } from 'react';
import {
  getAttributes,
  createAttribute,
  getCategories,
  getCategoryAttributes,
  assignAttributeToCategory,
  removeAttributeFromCategory,
} from '../api'; // you need to implement these APIs in your api.js and backend

function AttributeList() {
  const [attributes, setAttributes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState('');
  const [enumValues, setEnumValues] = useState('');
  const [error, setError] = useState(null);
  const [isFetchingCatAttrs, setIsFetchingCatAttrs] = useState(false);

  // Cache attributes per category to avoid refetch on repeat selections
  const catAttrsCacheRef = useRef(new Map());
  // Track in-flight request to cancel when switching categories quickly
  const fetchControllerRef = useRef(null);

  useEffect(() => {
    fetchAttributes();
    fetchCategories();
  }, []);

  useEffect(() => {
    let debounceTimer;
    if (selectedCategoryId) {
      debounceTimer = setTimeout(() => {
        fetchCategoryAttributes(selectedCategoryId);
      }, 250);
    } else {
      setCategoryAttributes([]);
    }
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [selectedCategoryId]);

  const fetchAttributes = async () => {
    try {
      const res = await getAttributes();
      setAttributes(res.data);
    } catch {
      setError('Failed to fetch attributes');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data);
      if (res.data.length > 0) setSelectedCategoryId(String(res.data[0].id)); // Select first category by default
    } catch {
      setError('Failed to fetch categories');
    }
  };

  const fetchCategoryAttributes = async (categoryId) => {
    // Serve from cache if available
    if (catAttrsCacheRef.current.has(categoryId)) {
      setCategoryAttributes(catAttrsCacheRef.current.get(categoryId));
      return;
    }

    // Cancel any in-flight request
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    const controller = new AbortController();
    fetchControllerRef.current = controller;
    setIsFetchingCatAttrs(true);
    try {
      const res = await getCategoryAttributes(categoryId, { signal: controller.signal });
      setCategoryAttributes(res.data);
      catAttrsCacheRef.current.set(categoryId, res.data);
    } catch (err) {
      // Ignore cancellations; surface other errors
      if (err && err.code !== 'ERR_CANCELED') {
        setError('Failed to fetch category attributes');
      }
    } finally {
      setIsFetchingCatAttrs(false);
      fetchControllerRef.current = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAttribute({ name, data_type: dataType, enum_values: enumValues || null });
      setName('');
      setDataType('');
      setEnumValues('');
      fetchAttributes();
      setError(null);
    } catch {
      setError('Failed to add attribute');
    }
  };

  const assignAttribute = async (attributeId) => {
    try {
      await assignAttributeToCategory(selectedCategoryId, attributeId);
      fetchCategoryAttributes(selectedCategoryId);
    } catch {
      setError('Failed to assign attribute to category');
    }
  };

  const removeAttribute = async (categoryAttributeId) => {
    if (!window.confirm('Remove this attribute from category?')) return;
    try {
      await removeAttributeFromCategory(categoryAttributeId);
      fetchCategoryAttributes(selectedCategoryId);
    } catch {
      setError('Failed to remove attribute from category');
    }
  };

  return (
    <div>
      <h2>Attributes</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <label>
        Select Category:
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          disabled={categories.length === 0}
        >
          <option value="" disabled>
            {categories.length === 0 ? 'Loading categories…' : 'Select a category'}
          </option>
          {categories.map(cat => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>

      <h3>Attributes Assigned to Category</h3>
      {isFetchingCatAttrs && <p>Loading category attributes…</p>}
      <ul className="list-compact scrollable">
        {categoryAttributes.map((catAttr) => (
          <li key={catAttr.id}>
            {catAttr.attribute.name} ({catAttr.attribute.data_type}){' '}
            {catAttr.attribute.enum_values ? `[${catAttr.attribute.enum_values}]` : ''}
            <button className="btn btn-danger btn-sm" onClick={() => removeAttribute(catAttr.id)}>Remove</button>
          </li>
        ))}
        {categoryAttributes.length === 0 && <li>No attributes assigned.</li>}
      </ul>

      <h3>All Attributes</h3>
      <ul className="list-compact scrollable">
        {attributes.map(attr => (
          <li key={attr.id}>
            {attr.name} ({attr.data_type}) {attr.enum_values ? `[${attr.enum_values}]` : ''}
            {!categoryAttributes.some(ca => ca.attribute.id === attr.id) && (
              <button className="btn btn-primary btn-sm" onClick={() => assignAttribute(attr.id)}>Assign to Category</button>
            )}
          </li>
        ))}
      </ul>

      <h3>Add New Attribute</h3>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Attribute Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          placeholder="Data Type (e.g. text, int, enum)"
          value={dataType}
          onChange={e => setDataType(e.target.value)}
          required
        />
        <input
          placeholder="Enum values (comma separated, optional)"
          value={enumValues}
          onChange={e => setEnumValues(e.target.value)}
        />
        <button className="btn btn-success btn-sm" type="submit">Add Attribute</button>
      </form>
    </div>
  );
}

export default AttributeList;
