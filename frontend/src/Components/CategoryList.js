import React, { useState, useEffect } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory, // make sure you add this API call to api.js
} from '../api'; // adjust this import path as necessary

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories();
      setCategories(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Start editing a category
  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
    setError(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDesc('');
    setError(null);
  };

  // Save updated category
  const saveEdit = async () => {
    try {
      setLoading(true);
      await updateCategory(editingId, { name: editName, description: editDesc });
      cancelEdit();
      fetchCategories();
    } catch (err) {
      setError('Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  // Create new category
  const createNewCategory = async () => {
    if (!newName.trim()) {
      setError('Category name cannot be empty');
      return;
    }
    try {
      setLoading(true);
      await createCategory({ name: newName, description: newDesc });
      setNewName('');
      setNewDesc('');
      fetchCategories();
      setError(null);
    } catch (err) {
      setError('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const removeCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }
    try {
      setLoading(true);
      await deleteCategory(id);
      fetchCategories();
    } catch (err) {
      setError('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Categories</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Create New Category Form */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Create New Category</h3>
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Name"
        />
        <input
          type="text"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          placeholder="Description"
        />
        <button className="btn btn-success" onClick={createNewCategory}>Create</button>
      </div>

      {/* Category List */}
      <ul>
        {categories.map(cat => (
          <li key={cat.id} style={{ marginBottom: '10px' }}>
            {editingId === cat.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Category Name"
                />
                <input
                  type="text"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Description"
                />
                <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
              </>
            ) : (
              <>
                <strong>{cat.name}</strong>: {cat.description}{' '}
                <button className="btn btn-primary" onClick={() => startEdit(cat)}>Edit</button>{' '}
                <button className="btn btn-danger" onClick={() => removeCategory(cat.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryList;
