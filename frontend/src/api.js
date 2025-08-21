import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

// Category APIs
export const getCategories = () => axios.get(`${API_BASE}/categories/`);
export const createCategory = (data) => axios.post(`${API_BASE}/categories/`, data);
export const updateCategory = (id, data) => axios.put(`${API_BASE}/categories/${id}`, data);
export const deleteCategory = (id) => axios.delete(`${API_BASE}/categories/${id}`);

// Attribute APIs
export const getAttributes = () => axios.get(`${API_BASE}/attributes/`);
export const createAttribute = (data) => axios.post(`${API_BASE}/attributes/`, data);
export const updateAttribute = (id, data) => axios.put(`${API_BASE}/attributes/${id}`, data);

// Product APIs
export const getProducts = () => axios.get(`${API_BASE}/products/`);
export const getProductById = (id) => axios.get(`${API_BASE}/products/${id}`); // NEW: get product with attributes
export const createProduct = (data) => axios.post(`${API_BASE}/products/`, data);
export const createProductFull = (data) => axios.post(`${API_BASE}/products/full/`, data);
export const updateProduct = (id, data) => axios.put(`${API_BASE}/products/${id}`, data);

// Category attribute management
export const getCategoryAttributes = (categoryId, config = {}) =>
  axios.get(`${API_BASE}/categories/${categoryId}/attributes/`, config);

export const assignAttributeToCategory = (categoryId, attributeId) =>
  axios.post(`${API_BASE}/categories/${categoryId}/attributes/`, { attribute_id: attributeId });

export const removeAttributeFromCategory = (categoryAttributeId) =>
  axios.delete(`${API_BASE}/category-attributes/${categoryAttributeId}/`);


