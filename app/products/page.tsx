'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useApp } from '@/context/AppContext';
import { Product } from '@/types';
import { formatPrice } from '@/utils/format';
import { 
  Plus, 
  Search,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  ShoppingBag,
  Tag,
  Warehouse,
  ChevronDown
} from 'lucide-react';

type ProductCategory = 'supplement' | 'equipment' | 'apparel' | 'beverage' | 'other';

const categoryLabels: Record<ProductCategory, string> = {
  supplement: 'Suplemento',
  equipment: 'Equipamiento',
  apparel: 'Ropa',
  beverage: 'Bebida',
  other: 'Otro',
};

const categoryColors: Record<ProductCategory, string> = {
  supplement: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  equipment: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  apparel: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  beverage: 'bg-green-500/20 text-green-400 border-green-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, gym } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProductCategory | 'all'>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'other' as ProductCategory,
    sku: '',
    stock: '',
    lowStockAlert: '5',
    isActive: true,
  });

  // Productos filtrados
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Búsqueda por nombre o SKU
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Categoría
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;

      if (!matchesCategory) return false;

      // Stock
      let matchesStock = true;
      if (filterStock === 'low') {
        // Stock bajo: mayor a 0 pero menor o igual a la alerta
        matchesStock = product.stock > 0 && product.stock <= product.lowStockAlert;
      } else if (filterStock === 'out') {
        // Sin stock: igual a 0
        matchesStock = product.stock === 0;
      }

      return matchesStock;
    });
  }, [products, searchQuery, filterCategory, filterStock]);

  // Métricas
  const metrics = useMemo(() => {
    const totalStockUnits = products.filter(p => p.isActive).reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const lowStockProducts = products.filter(p => p.isActive && p.stock > 0 && p.stock < 2).length;
    const outOfStockProducts = products.filter(p => p.isActive && p.stock === 0).length;

    return { totalStockUnits, totalValue, lowStockProducts, outOfStockProducts };
  }, [products]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        category: product.category || 'other',
        sku: product.sku || '',
        stock: product.stock.toString(),
        lowStockAlert: product.lowStockAlert.toString(),
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'other',
        sku: '',
        stock: '0',
        lowStockAlert: '5',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gym?.id) {
      alert('No se encontró el gimnasio');
      return;
    }

    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);
    const lowStockAlert = parseInt(formData.lowStockAlert);

    if (isNaN(price) || price < 0) {
      alert('El precio debe ser un número válido');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      alert('El stock debe ser un número válido');
      return;
    }

    if (isNaN(lowStockAlert) || lowStockAlert < 0) {
      alert('La alerta de stock bajo debe ser un número válido');
      return;
    }

    const productData = {
      gymId: gym.id,
      name: formData.name,
      description: formData.description || undefined,
      price,
      category: formData.category,
      sku: formData.sku || undefined,
      stock,
      lowStockAlert,
      isActive: formData.isActive,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"?`)) return;

    try {
      await deleteProduct(product.id);
      alert('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await updateProduct(product.id, { isActive: !product.isActive });
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error al actualizar el producto');
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-white dark:bg-dark-900">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Productos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona el catálogo de productos</p>
          </div>
          <Button onClick={() => handleOpenModal()} disabled={!gym}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        {/* Métricas */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
            Resumen de Inventario
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700 rounded-lg p-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
                  Total Stock
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {formatPrice(metrics.totalStockUnits)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  unidades disponibles
                </p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700 rounded-lg p-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
                  Dinero Invertido
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  ${formatPrice(metrics.totalValue)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  en stock disponible
                </p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700 rounded-lg p-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
                  Stock Bajo
                </p>
                <p className="text-2xl font-bold text-warning-400">
                  {metrics.lowStockProducts}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  menos de 2 unidades
                </p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700 rounded-lg p-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
                  Sin Stock
                </p>
                <p className="text-2xl font-bold text-danger-400">
                  {metrics.outOfStockProducts}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  productos sin stock
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-gray-50 dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 z-10" />
              <Input
                type="text"
                placeholder="Buscar producto o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Categoría
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as ProductCategory | 'all')}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg appearance-none cursor-pointer"
                >
                  <option value="all">Todas las categorías</option>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Stock
              </label>
              <div className="relative">
                <Warehouse className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
                <select
                  value={filterStock}
                  onChange={(e) => setFilterStock(e.target.value as 'all' | 'low' | 'out')}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg appearance-none cursor-pointer"
                >
                  <option value="all">Todo el stock</option>
                  <option value="low">Stock bajo</option>
                  <option value="out">Sin stock</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de productos */}
        <Card className="bg-white dark:bg-dark-800/50 border-gray-200 dark:border-dark-700 p-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {products.length === 0 
                  ? 'No hay productos en el catálogo' 
                  : 'No se encontraron productos con los filtros aplicados'}
              </p>
              {products.length === 0 && (
                <Button onClick={() => handleOpenModal()} variant="secondary" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primer Producto
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= product.lowStockAlert && product.stock > 0;
                const isOutOfStock = product.stock === 0;

                return (
                  <div
                    key={product.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      product.isActive
                        ? 'bg-gray-50 dark:bg-dark-800/30 border-gray-200 dark:border-dark-700 hover:border-primary-500/50'
                        : 'bg-gray-100 dark:bg-dark-800/50 border-gray-300 dark:border-dark-600 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-1">
                          {product.name}
                        </h3>
                        {product.sku && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 font-mono mb-2">SKU: {product.sku}</p>
                        )}
                        {product.category && (
                          <Badge className={categoryColors[product.category]}>
                            {categoryLabels[product.category]}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleOpenModal(product)}
                          variant="secondary"
                          size="sm"
                          className="p-2"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(product)}
                          variant="secondary"
                          size="sm"
                          className="p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {product.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}


                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-dark-700">
                      <div>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          ${formatPrice(product.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          isOutOfStock ? 'text-red-600 dark:text-red-400' :
                          isLowStock ? 'text-orange-600 dark:text-orange-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          Stock: {product.stock}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-700">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`w-full text-xs font-medium py-1.5 rounded transition-colors ${
                          product.isActive
                            ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            : 'text-success-400 hover:text-success-300'
                        }`}
                      >
                        {product.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Modal de crear/editar producto */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Nombre *"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Toalla, Guantes, Proteína Whey"
                required
              />
            </div>

            <div>
              <Textarea
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del producto..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Precio *"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="SKU"
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ej: TOAL-001"
                />
              </div>

              <div>
                <Input
                  label="Stock Inicial"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Input
                label="Alerta de Stock Bajo"
                type="number"
                min="0"
                value={formData.lowStockAlert}
                onChange={(e) => setFormData({ ...formData, lowStockAlert: e.target.value })}
                placeholder="5"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Se mostrará una alerta cuando el stock esté por debajo de este número
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary-500 bg-gray-100 dark:bg-dark-700 border-gray-300 dark:border-dark-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Producto activo</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                {editingProduct ? 'Actualizar' : 'Crear'} Producto
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  );
}

