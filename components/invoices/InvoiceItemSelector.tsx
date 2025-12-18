'use client';

import React, { useState } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Product, MembershipType, InvoiceItem } from '@/types';

interface InvoiceItemSelectorProps {
  products: Product[];
  membershipTypes: MembershipType[];
  selectedItems: Omit<InvoiceItem, 'id' | 'invoiceId' | 'createdAt'>[];
  onItemsChange: (items: Omit<InvoiceItem, 'id' | 'invoiceId' | 'createdAt'>[]) => void;
  membershipForClient?: MembershipType; // Si se seleccionó un cliente, su membresía actual
}

export function InvoiceItemSelector({
  products,
  membershipTypes,
  selectedItems,
  onItemsChange,
  membershipForClient,
}: InvoiceItemSelectorProps) {
  const [itemType, setItemType] = useState<'membership' | 'product' | 'other'>('membership');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar productos activos
  const activeProducts = products.filter(p => p.isActive);
  const filteredProducts = activeProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    let newItem: Omit<InvoiceItem, 'id' | 'invoiceId' | 'createdAt'> | null = null;

    if (itemType === 'membership') {
      const membership = membershipTypes.find(m => m.id === selectedMembershipId);
      if (!membership) return;

      const itemSubtotal = membership.price * quantity;
      newItem = {
        itemType: 'membership',
        itemId: membership.id,
        description: `${membership.name} (${membership.durationDays} días)`,
        quantity,
        unitPrice: membership.price,
        subtotal: itemSubtotal,
        discount: 0,
        total: itemSubtotal,
      };
    } else if (itemType === 'product') {
      const product = activeProducts.find(p => p.id === selectedProductId);
      if (!product) return;

      const itemSubtotal = product.price * quantity;
      newItem = {
        itemType: 'product',
        itemId: product.id,
        description: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
        discount: 0,
        total: itemSubtotal,
      };
    } else if (itemType === 'other') {
      if (!customDescription || !customPrice) return;
      const price = parseFloat(customPrice);
      if (isNaN(price) || price <= 0) return;

      const itemSubtotal = price * quantity;
      newItem = {
        itemType: 'other',
        description: customDescription,
        quantity,
        unitPrice: price,
        subtotal: itemSubtotal,
        discount: 0,
        total: itemSubtotal,
      };
    }

    if (newItem) {
      onItemsChange([...selectedItems, newItem]);
      // Reset form
      setSelectedProductId('');
      setSelectedMembershipId('');
      setCustomDescription('');
      setCustomPrice('');
      setQuantity(1);
      setSearchTerm('');
    }
  };

  const handleRemoveItem = (index: number) => {
    onItemsChange(selectedItems.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedItems = selectedItems.map((item, i) => {
      if (i !== index) return item;
      const newSubtotal = item.unitPrice * newQuantity;
      return {
        ...item,
        quantity: newQuantity,
        subtotal: newSubtotal,
        total: newSubtotal - item.discount,
      };
    });
    onItemsChange(updatedItems);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  return (
    <div className="space-y-4">
      {/* Selector de tipo de item */}
      <div>
        <label className="block text-sm font-medium text-dark-100 mb-2">
          Tipo de Item
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setItemType('membership')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              itemType === 'membership'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            Membresía
          </button>
          <button
            type="button"
            onClick={() => setItemType('product')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              itemType === 'product'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            Producto
          </button>
          <button
            type="button"
            onClick={() => setItemType('other')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              itemType === 'other'
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            Otro
          </button>
        </div>
      </div>

      {/* Formulario según tipo */}
      {itemType === 'membership' && (
        <div className="space-y-3">
          {membershipForClient && (
            <div className="bg-dark-700 p-3 rounded-lg border border-primary-500/30">
              <p className="text-sm text-dark-300">
                Cliente tiene: <span className="text-primary-400 font-medium">{membershipForClient.name}</span>
              </p>
            </div>
          )}
          <select
            value={selectedMembershipId}
            onChange={(e) => setSelectedMembershipId(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-dark-800/50 border border-dark-700/50 text-gray-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg"
          >
            <option value="">Seleccionar membresía...</option>
            {membershipTypes.filter(m => m.isActive).map((membership) => (
              <option key={membership.id} value={membership.id}>
                {membership.name} - ${membership.price.toLocaleString()} ({membership.durationDays} días)
              </option>
            ))}
          </select>
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-2">Cantidad</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
      )}

      {itemType === 'product' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <Input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-dark-800/50 border border-dark-700/50 text-gray-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm rounded-lg"
          >
            <option value="">Seleccionar producto...</option>
            {filteredProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - ${product.price.toLocaleString()} 
                {product.stock !== undefined && ` (Stock: ${product.stock})`}
              </option>
            ))}
          </select>
          {filteredProducts.length === 0 && searchTerm && (
            <p className="text-sm text-warning-400">No se encontraron productos</p>
          )}
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-2">Cantidad</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
      )}

      {itemType === 'other' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-2">Descripción</label>
            <Input
              type="text"
              placeholder="Ej: Clase personalizada"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-2">Precio Unitario</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-100 mb-2">Cantidad</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={handleAddItem}
        variant="secondary"
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar Item
      </Button>

      {/* Lista de items seleccionados */}
      {selectedItems.length > 0 && (
        <div className="border border-dark-600 rounded-lg p-4 bg-dark-750">
          <h4 className="text-sm font-medium text-dark-100 mb-3">Items de la Factura</h4>
          <div className="space-y-2">
            {selectedItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-dark-700 p-3 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark-100">{item.description}</p>
                  <p className="text-xs text-dark-400">
                    ${item.unitPrice.toLocaleString()} x {item.quantity} = ${item.total.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                    className="w-16 text-center"
                  />
                  <Button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    variant="secondary"
                    size="sm"
                    className="text-error-400 hover:text-error-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-dark-600">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-dark-100">Total:</span>
              <span className="text-2xl font-bold text-primary-400">
                ${calculateTotal().toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

