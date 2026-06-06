import React, { useState, useEffect } from "react";
import "./App.css";
import "./styles/print.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { CurrencyProvider } from './components/CurrencyContext';
import CurrencySelector from './components/CurrencySelector';
import CurrencyAmount from './components/CurrencyAmount';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// =================== COMPONENTS ===================

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/pos", label: "Point de Vente", icon: "🛒" },
    { path: "/products", label: "Produits", icon: "📦" },
    { path: "/orders", label: "Commandes", icon: "📋" },
    { path: "/customers", label: "Clients", icon: "👥" },
    { path: "/suppliers", label: "Fournisseurs", icon: "🏭" },
    { path: "/stock", label: "Stock", icon: "📈" },
  ];

  return (
    <nav className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-400">Commerce Pro</h1>
        <p className="text-gray-400 text-sm">Gestion de Magasin</p>
        
        {/* Currency Selector */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <CurrencySelector className="text-white" />
        </div>
      </div>
      
      <ul className="space-y-2">
        {navItems.map(item => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                location.pathname === item.path
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tableau de Bord</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ventes Aujourd'hui</p>
              <p className="text-2xl font-semibold text-gray-900">
                <CurrencyAmount amount={stats?.total_sales_today || 0} />
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Commandes Aujourd'hui</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.total_orders_today || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.total_customers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock Faible</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.low_stock_products || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column section: Recent Orders + Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Produits les Plus Vendus</h2>
          {stats?.top_selling_products?.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qté vendue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenus</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.top_selling_products.map((product, index) => (
                  <tr key={product.product_id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-gray-400 font-mono text-xs w-4">{index + 1}</span>
                        {product.product_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                      {product.total_quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      <CurrencyAmount amount={product.total_revenue} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm">Aucune vente complétée pour le moment.</p>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Commandes Récentes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.recent_orders?.slice(0, 5).map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer_name || "Client anonyme"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <CurrencyAmount amount={order.total_amount || 0} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
};

// Products Management Component
const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    cost_price: "",
    category_id: "",
    supplier_id: "",
    sku: "",
    barcode: "",
    stock_quantity: "",
    min_stock_level: "5",
    image_url: "",
    is_active: true
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API}/suppliers?is_active=true`);
      setSuppliers(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des fournisseurs:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        cost_price: newProduct.cost_price ? parseFloat(newProduct.cost_price) : null,
        stock_quantity: parseInt(newProduct.stock_quantity),
        min_stock_level: parseInt(newProduct.min_stock_level)
      };

      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, productData);
      } else {
        await axios.post(`${API}/products`, productData);
      }

      setNewProduct({
        name: "",
        description: "",
        price: "",
        cost_price: "",
        category_id: "",
        sku: "",
        barcode: "",
        stock_quantity: "",
        min_stock_level: "5",
        image_url: "",
        is_active: true
      });
      setShowAddForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du produit:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleEdit = (product) => {
    setNewProduct({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      cost_price: product.cost_price?.toString() || "",
      category_id: product.category_id || "",
      supplier_id: product.supplier_id || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      stock_quantity: product.stock_quantity.toString(),
      min_stock_level: product.min_stock_level.toString(),
      image_url: product.image_url || "",
      is_active: product.is_active
    });
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await axios.delete(`${API}/products/${productId}`);
        fetchProducts();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression");
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Produits</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          ➕ Ajouter Produit
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher par nom, SKU ou code-barres..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingProduct ? "Modifier Produit" : "Ajouter Produit"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix de Vente *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix d'Achat</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.cost_price}
                    onChange={(e) => setNewProduct({...newProduct, cost_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                  <select
                    value={newProduct.supplier_id}
                    onChange={(e) => setNewProduct({...newProduct, supplier_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} {supplier.company && `(${supplier.company})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Minimum</label>
                  <input
                    type="number"
                    value={newProduct.min_stock_level}
                    onChange={(e) => setNewProduct({...newProduct, min_stock_level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                    setNewProduct({
                      name: "",
                      description: "",
                      price: "",
                      cost_price: "",
                      category_id: "",
                      supplier_id: "",
                      sku: "",
                      barcode: "",
                      stock_quantity: "",
                      min_stock_level: "5",
                      image_url: "",
                      is_active: true
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingProduct ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <CurrencyAmount amount={product.price} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${
                      product.stock_quantity <= product.min_stock_level 
                        ? 'text-red-600 font-semibold' 
                        : 'text-gray-900'
                    }`}>
                      {product.stock_quantity}
                    </span>
                    {product.stock_quantity <= product.min_stock_level && (
                      <span className="ml-1 text-red-500">⚠️</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// POS (Point of Sale) Component
const POSSystem = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcode, setBarcode] = useState("");
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products?is_active=true`);
      setProducts(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price
      }]);
    }
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const handleBarcodeSearch = async () => {
    if (!barcode.trim()) return;
    
    try {
      const response = await axios.get(`${API}/products/barcode/${barcode}`);
      addToCart(response.data);
      setBarcode("");
    } catch (error) {
      alert("Produit non trouvé avec ce code-barres");
      setBarcode("");
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxAmount = (subtotal - discountAmount) * 0.1; // 10% tax
    return {
      subtotal,
      discountAmount,
      taxAmount,
      total: subtotal - discountAmount + taxAmount
    };
  };

  const processOrder = async () => {
    if (cart.length === 0) {
      alert("Le panier est vide");
      return;
    }

    try {
      const orderData = {
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name,
        items: cart,
        discount_amount: calculateTotal().discountAmount,
        payment_method: "cash" // Default to cash for POS
      };

      await axios.post(`${API}/orders`, orderData);
      
      // Reset cart and form
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      
      alert("Commande créée avec succès!");
      
      // Refresh products to update stock
      fetchProducts();
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error);
      alert("Erreur lors de la création de la commande");
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = calculateTotal();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Point de Vente</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Produits</h2>
            
            {/* Search and Barcode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex">
                <input
                  type="text"
                  placeholder="Scanner code-barres..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleBarcodeSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                >
                  📷
                </button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                  <p className="text-green-600 font-semibold">
                    <CurrencyAmount amount={product.price} />
                  </p>
                  <p className="text-gray-500 text-xs">Stock: {product.stock_quantity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Panier</h2>
          
          {/* Customer Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <select
              value={selectedCustomer?.id || ""}
              onChange={(e) => {
                const customer = customers.find(c => c.id === e.target.value);
                setSelectedCustomer(customer || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Client anonyme</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items */}
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.product_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product_name}</p>
                  <p className="text-gray-600 text-xs">{item.unit_price.toFixed(2)}€ x {item.quantity}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                    className="w-6 h-6 bg-red-500 text-white rounded text-xs"
                  >
                    -
                  </button>
                  <span className="text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                    className="w-6 h-6 bg-green-500 text-white rounded text-xs"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-red-500 text-sm ml-2"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Discount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Remise (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sous-total:</span>
              <span><CurrencyAmount amount={totals.subtotal} /></span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Remise:</span>
              <span>-<CurrencyAmount amount={totals.discountAmount} /></span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Taxes (10%):</span>
              <span><CurrencyAmount amount={totals.taxAmount} /></span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span><CurrencyAmount amount={totals.total} /></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2">
            <button
              onClick={processOrder}
              disabled={cart.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium"
            >
              💳 Encaisser
            </button>
            <button
              onClick={() => setCart([])}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium"
            >
              🗑️ Vider Panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Import the complete components
import OrdersManagement from './components/OrdersManagement';
import CustomersManagement from './components/CustomersManagement';
import SuppliersManagement from './components/SuppliersManagement';
import StockManagement from './components/StockManagement';
import PrintableInvoice from './components/PrintableInvoice';
import PrintableReport from './components/PrintableReport';

// Main App Component
function App() {
  return (
    <CurrencyProvider>
      <div className="App bg-gray-100 min-h-screen">
        <BrowserRouter>
          <div className="flex">
            <Navigation />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pos" element={<POSSystem />} />
                <Route path="/products" element={<ProductsManagement />} />
                <Route path="/orders" element={<OrdersManagement />} />
                <Route path="/customers" element={<CustomersManagement />} />
                <Route path="/suppliers" element={<SuppliersManagement />} />
                <Route path="/stock" element={<StockManagement />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </div>
    </CurrencyProvider>
  );
}

export default App;