'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useApp } from '@/context/AppContext';
import { Product } from '@/types';
import { 
  Plus, 
  Search,
  Edit,
  Trash2,
  ShoppingBag,
  AlertCircle,
  Package
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

export default function StorePage() {
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
    imageUrl: '',
    isActive: true,
  });

  // Productos filtrados
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Búsqueda
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase());

      // Categoría
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;

      // Stock
      let matchesStock = true;
      if (filterStock === 'low') {
        matchesStock = product.stock <= product.lowStockAlert && product.stock > 0;
      } else if (filterStock === 'out') {
        matchesStock = product.stock === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, filterCategory, filterStock]);

  // Métricas
  const metrics = useMemo(() => {
    const totalProducts = products.filter(p => p.isActive).length;
    const lowStockProducts = products.filter(p => p.isActive && p.stock <= p.lowStockAlert && p.stock > 0).length;
    const outOfStockProducts = products.filter(p => p.isActive && p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    return { totalProducts, lowStockProducts, outOfStockProducts, totalValue };
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
        imageUrl: product.imageUrl || '',
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
        imageUrl: '',
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
      imageUrl: formData.imageUrl || undefined,
      isActive: formData.isActive,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        alert('Producto actualizado exitosamente');
      } else {
        await addProduct(productData);
        alert('Producto creado exitosamente');
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
      <div className="min-h-screen bg-dark-900">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark-50">Tienda</h1>
            <p className="text-sm sm:text-base text-dark-400 mt-1">Gestiona el catálogo de productos</p>
          </div>
          <Button onClick={() => handleOpenModal()} disabled={!gym} className="w-full sm:w-auto text-xs sm:text-sm">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="bg-dark-800 border-dark-700 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-xs sm:text-sm">Total Productos</p>
                <p className="text-xl sm:text-2xl font-bold text-dark-50 mt-1">
                  {metrics.totalProducts}
                </p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary-400" />
            </div>
          </Card>

          <Card className="bg-dark-800 border-dark-700 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-xs sm:text-sm">Stock Bajo</p>
                <p className="text-xl sm:text-2xl font-bold text-warning-400 mt-1">
                  {metrics.lowStockProducts}
                </p>
              </div>
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-warning-400" />
            </div>
          </Card>

          <Card className="bg-dark-800 border-dark-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Sin Stock</p>
                <p className="text-2xl font-bold text-error-400 mt-1">
                  {metrics.outOfStockProducts}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-error-400" />
            </div>
          </Card>

          <Card className="bg-dark-800 border-dark-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-400 text-sm">Valor Inventario</p>
                <p className="text-2xl font-bold text-success-400 mt-1">
                  ${metrics.totalValue.toLocaleString()}
                </p>
              </div>
              <ShoppingBag className="w-8 h-8 text-success-400" />
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-dark-800 border-dark-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
              <Input
                type="text"
                placeholder="Buscar producto o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value as ProductCategory | 'all')}
              className="w-full px-4 py-2.5 bg-dark-800/50 border border-dark-700/50 text-gray-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg"
            >
              <option value="all">Todas las categorías</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select 
              value={filterStock} 
              onChange={(e) => setFilterStock(e.target.value as 'all' | 'low' | 'out')}
              className="w-full px-4 py-2.5 bg-dark-800/50 border border-dark-700/50 text-gray-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg"
            >
              <option value="all">Todo el stock</option>
              <option value="low">Stock bajo</option>
              <option value="out">Sin stock</option>
            </select>
          </div>
        </Card>

        {/* Lista de productos */}
        <Card className="bg-dark-800 border-dark-700 p-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 mb-2">
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
                        ? 'bg-dark-750 border-dark-600 hover:border-dark-500'
                        : 'bg-dark-800 border-dark-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-dark-50 mb-1">
                          {product.name}
                        </h3>
                        {product.sku && (
                          <p className="text-xs text-dark-400 font-mono mb-2">SKU: {product.sku}</p>
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
                          className="text-primary-400 hover:text-primary-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(product)}
                          variant="secondary"
                          size="sm"
                          className="text-error-400 hover:text-error-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {product.description && (
                      <p className="text-sm text-dark-300 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-dark-600">
                      <div>
                        <p className="text-2xl font-bold text-primary-400">
                          ${product.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          isOutOfStock ? 'text-error-400' :
                          isLowStock ? 'text-warning-400' :
                          'text-success-400'
                        }`}>
                          Stock: {product.stock}
                        </p>
                        {isLowStock && (
                          <p className="text-xs text-dark-500">
                            Alerta: {product.lowStockAlert}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-dark-600">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`w-full text-xs font-medium py-1.5 rounded transition-colors ${
                          product.isActive
                            ? 'text-dark-400 hover:text-dark-200'
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
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Nombre *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Proteína Whey"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Descripción
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del producto..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Precio *
                </label>
                <Input
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
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                  className="w-full px-4 py-2.5 bg-dark-800/50 border border-dark-700/50 text-gray-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  SKU
                </label>
                <Input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ej: PROT-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Stock Inicial
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Alerta de Stock Bajo
              </label>
              <Input
                type="number"
                min="0"
                value={formData.lowStockAlert}
                onChange={(e) => setFormData({ ...formData, lowStockAlert: e.target.value })}
                placeholder="5"
              />
              <p className="text-xs text-dark-400 mt-1">
                Se mostrará una alerta cuando el stock esté por debajo de este número
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                URL de Imagen
              </label>
              <Input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-dark-200">Producto activo</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-dark-600">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingProduct ? 'Actualizar' : 'Crear'} Producto
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  );
}


