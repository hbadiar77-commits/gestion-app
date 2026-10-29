import React, { useState, useEffect } from "react";
import axios from "axios";
import CurrencyAmount from './CurrencyAmount';
import PrintableInvoice from './PrintableInvoice';
import PrintableReport from './PrintableReport';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    customer_id: "",
    date_from: "",
    date_to: ""
  });

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.customer_id) params.append('customer_id', filters.customer_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await axios.get(`${API}/orders?${params.toString()}`);
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des commandes:", error);
      setLoading(false);
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/orders/${orderId}`, { status: newStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const updatePaymentStatus = async (orderId, newPaymentStatus) => {
    try {
      await axios.put(`${API}/orders/${orderId}`, { payment_status: newPaymentStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: newPaymentStatus });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour du paiement");
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm("Supprimer cette commande ? Le stock sera restauré.")) return;
    try {
      await axios.delete(`${API}/orders/${orderId}`);
      fetchOrders();
      if (selectedOrder?.id === orderId) setShowOrderDetails(false);
    } catch (error) {
      const msg = error.response?.data?.detail || "Erreur lors de la suppression";
      alert(msg);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setSelectedOrder(response.data);
      setShowOrderDetails(true);
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      alert("Erreur lors du chargement des détails");
    }
  };

  const printInvoice = async (orderId) => {
    try {
      const orderResponse = await axios.get(`${API}/orders/${orderId}`);
      const order = orderResponse.data;
      
      let customer = null;
      if (order.customer_id) {
        try {
          const customerResponse = await axios.get(`${API}/customers/${order.customer_id}`);
          customer = customerResponse.data;
        } catch (err) {
          console.warn("Impossible de charger les détails du client:", err);
        }
      }
      
      setSelectedOrder(order);
      setSelectedCustomer(customer);
      setShowInvoice(true);
    } catch (error) {
      console.error("Erreur lors du chargement de la commande:", error);
      alert("Erreur lors du chargement de la commande");
    }
  };

  const printOrdersReport = () => {
    setShowReport(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Commandes</h1>
        <button
          onClick={printOrdersReport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          🖨️ Rapport Commandes
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="processing">En cours</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              value={filters.customer_id}
              onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les clients</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Du</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Au</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
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
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">En attente</option>
                      <option value="processing">En cours</option>
                      <option value="completed">Terminée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.payment_status}
                      onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getPaymentStatusColor(order.payment_status)}`}
                    >
                      <option value="pending">En attente</option>
                      <option value="completed">Payé</option>
                      <option value="failed">Échec</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewOrderDetails(order.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        👁️ Voir
                      </button>
                      <button
                        onClick={() => printInvoice(order.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        🖨️ Facture
                      </button>
                      {order.status !== 'completed' && (
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Détails de la Commande</h2>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Informations Générales</h3>
                <div className="space-y-2">
                  <p><strong>ID:</strong> {selectedOrder.id}</p>
                  <p><strong>Client:</strong> {selectedOrder.customer_name || "Client anonyme"}</p>
                  <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                  <p><strong>Statut:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </p>
                  <p><strong>Paiement:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                      {selectedOrder.payment_status}
                    </span>
                  </p>
                  <p><strong>Méthode de paiement:</strong> {selectedOrder.payment_method || "Non spécifiée"}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Résumé Financier</h3>
                <div className="space-y-2">
                  <p><strong>Sous-total:</strong> <CurrencyAmount amount={selectedOrder.subtotal || 0} /></p>
                  <p><strong>Remise:</strong> -<CurrencyAmount amount={selectedOrder.discount_amount || 0} /></p>
                  <p><strong>Taxes:</strong> <CurrencyAmount amount={selectedOrder.tax_amount || 0} /></p>
                  <p className="text-lg font-bold border-t pt-2">
                    <strong>Total:</strong> <CurrencyAmount amount={selectedOrder.total_amount || 0} />
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Articles Commandés</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix Unitaire</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <CurrencyAmount amount={item.unit_price || 0} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <CurrencyAmount amount={item.total_price || 0} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Notes</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700">{selectedOrder.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Printable Invoice */}
      {showInvoice && selectedOrder && (
        <PrintableInvoice
          order={selectedOrder}
          customer={selectedCustomer}
          onClose={() => {
            setShowInvoice(false);
            setSelectedOrder(null);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* Printable Report */}
      {showReport && (
        <PrintableReport
          type="orders"
          data={orders}
          title="Rapport des Commandes"
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

export default OrdersManagement;