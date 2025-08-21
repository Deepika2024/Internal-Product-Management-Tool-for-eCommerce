import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import CategoryList from './Components/CategoryList';
import AttributeList from './Components/AttributeList';
import ProductList from './Components/ProductList';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <Link to="/categories">Categories</Link> |{' '}
          <Link to="/attributes">Attributes</Link> |{' '}
          <Link to="/products">Products</Link>
        </nav>
        <Routes>
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/attributes" element={<AttributeList />} />
          <Route path="/products" element={<ProductList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
