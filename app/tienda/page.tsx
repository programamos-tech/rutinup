'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useApp } from '@/context/AppContext';
import { Product, Client, InvoiceItem, Payment } from '@/types';
import { format } from 'date-fns';
import { formatPrice } from '@/utils/format';
import { 
  ShoppingBag,
  Plus,
  Minus,
  X,
  Search,
  ShoppingCart,
  User,
  CreditCard,
  Trash2,
  Package,
  DollarSign,
  AlertCircle
} from 'lucide-react';

type CartItem = {
  product: Product;
  quantity: number;
};

export default function TiendaPage() {
  const appContext = useApp();
  const { 
    products, 
    clients,
    payments,
    invoices,
    invoiceItems,
    addInvoice,
    addPayment,
    updatePayment,
    updateInvoice,
    updateProduct,
    addAuditLog,
    gym 
  } = appContext;
  
  // Obtener getOpenCashClosing si está disponible (opcional)
  const getOpenCashClosing = (appContext as any).getOpenCashClosing;

  const [searchQuery, setSearchQuery] = useState('');
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mixed'>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancelPaymentId, setCancelPaymentId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Calcular métricas de ingresos de la tienda (solo productos)
  const storeMetrics = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Obtener IDs de facturas que tienen productos desde invoiceItems
    const productInvoiceIds = new Set<string>();
    if (invoiceItems && invoiceItems.length > 0) {
      invoiceItems.forEach(item => {
        if (item.itemType === 'product') {
          productInvoiceIds.add(item.invoiceId);
        }
      });
    }

    // Filtrar pagos de hoy que son de productos
    // Un pago es de productos si:
    // 1. Tiene invoiceId (las ventas de productos siempre tienen invoiceId)
    // 2. NO tiene membershipId (los pagos de membresías tienen membershipId)
    // 3. O si tiene invoiceId y ese invoiceId está en la lista de facturas con productos
    // 4. Solo incluir pagos completados (excluir cancelados)
    const todayStorePayments = payments.filter(p => {
      const paymentDateStr = format(p.paymentDate, 'yyyy-MM-dd');
      const isToday = paymentDateStr === todayStr;
      const isCompleted = p.status === 'completed';
      
      if (!isToday || !isCompleted) return false;
      
      // Si tiene invoiceId y NO tiene membershipId, es de productos
      if (p.invoiceId && !p.membershipId) {
        // Verificar que el invoiceId esté en la lista de facturas con productos
        // Si productInvoiceIds está vacío (invoiceItems no cargados), confiamos en que es de productos
        if (productInvoiceIds.size === 0 || productInvoiceIds.has(p.invoiceId)) {
          return true;
        }
      }
      
      return false;
    });

    // Debug
    console.log('🛒 Store Metrics:', {
      todayStr,
      totalPayments: payments.length,
      paymentsWithInvoiceId: payments.filter(p => p.invoiceId).length,
      productInvoiceIdsCount: productInvoiceIds.size,
      todayStorePaymentsCount: todayStorePayments.length,
      todayStorePayments: todayStorePayments.map(p => ({
        id: p.id,
        invoiceId: p.invoiceId,
        membershipId: p.membershipId,
        amount: p.amount,
        method: p.method
      }))
    });

    const totalToday = todayStorePayments.reduce((sum, p) => {
      if (p.splitPayment) {
        return sum + p.splitPayment.cash + p.splitPayment.transfer;
      }
      return sum + p.amount;
    }, 0);

    const cashToday = todayStorePayments.reduce((sum, p) => {
      if (p.splitPayment) return sum + p.splitPayment.cash;
      if (p.method === 'cash') return sum + p.amount;
      return sum;
    }, 0);

    const transferToday = todayStorePayments.reduce((sum, p) => {
      if (p.splitPayment) return sum + p.splitPayment.transfer;
      if (p.method === 'transfer') return sum + p.amount;
      return sum;
    }, 0);

    const cashPaymentsCount = todayStorePayments.filter(p => {
      if (p.splitPayment) return p.splitPayment.cash > 0;
      return p.method === 'cash';
    }).length;

    const transferPaymentsCount = todayStorePayments.filter(p => {
      if (p.splitPayment) return p.splitPayment.transfer > 0;
      return p.method === 'transfer';
    }).length;

    // Obtener TODOS los pagos de hoy (incluyendo cancelados) para mostrar en la tabla
    const allTodayStorePayments = payments.filter(p => {
      const paymentDateStr = format(p.paymentDate, 'yyyy-MM-dd');
      const isToday = paymentDateStr === todayStr;
      
      if (!isToday) return false;
      
      // Si tiene invoiceId y NO tiene membershipId, es de productos
      if (p.invoiceId && !p.membershipId) {
        if (productInvoiceIds.size === 0 || productInvoiceIds.has(p.invoiceId)) {
          return true;
        }
      }
      
      return false;
    });

    // Ordenar por fecha/hora descendente (más recientes primero)
    const sortedPayments = [...allTodayStorePayments].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { 
      totalToday, 
      cashToday, 
      transferToday, 
      count: todayStorePayments.length, // Solo contar completadas en métricas
      cashPaymentsCount,
      transferPaymentsCount,
      todayStorePayments: sortedPayments // Todos los pagos (incluyendo cancelados) para la tabla
    };
  }, [payments, invoices, invoiceItems]);

  // Filtrar productos activos con stock
  const availableProducts = useMemo(() => {
    return products.filter(p => 
      p.isActive && 
      p.stock > 0 &&
      (searchQuery === '' || 
       p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       p.sku?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [products, searchQuery]);

  // Calcular total del carrito
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [cart]);

  // Agregar producto al carrito
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      // Si ya está en el carrito, aumentar cantidad
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        alert(`No hay suficiente stock. Stock disponible: ${product.stock}`);
      }
    } else {
      // Agregar nuevo producto al carrito
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  // Actualizar cantidad en carrito
  const updateCartQuantity = (productId: string, quantity: number) => {
    const cartItem = cart.find(item => item.product.id === productId);
    if (!cartItem) return;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (quantity > cartItem.product.stock) {
      alert(`No hay suficiente stock. Stock disponible: ${cartItem.product.stock}`);
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  // Remover del carrito
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  // Procesar venta
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    // Validar pago mixto
    if (paymentMethod === 'mixed') {
      const cash = parseInt(cashAmount.replace(/\D/g, '')) || 0;
      const transfer = parseInt(transferAmount.replace(/\D/g, '')) || 0;
      const total = cash + transfer;
      
      if (total !== cartTotal) {
        alert(`La suma de efectivo y transferencia debe ser exactamente $${formatPrice(cartTotal)}, que es el total de la venta.`);
        return;
      }
      
      if (cash <= 0 || transfer <= 0) {
        alert('Ambos montos (efectivo y transferencia) deben ser mayores a 0 en un pago mixto.');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Obtener cierre de caja abierto (opcional - no crítico para la venta)
      let openClosing = null;
      try {
        // Intentar obtener el cierre de caja si la función está disponible
        if (getOpenCashClosing && typeof getOpenCashClosing === 'function') {
          openClosing = await getOpenCashClosing();
        }
      } catch (error) {
        console.warn('No se pudo obtener el cierre de caja abierto (continuando sin él):', error);
        // Continuar sin el cierre de caja - no es crítico para procesar la venta
      }

      // Crear items de factura
      const invoiceItems: Omit<InvoiceItem, 'id' | 'invoiceId' | 'createdAt'>[] = cart.map(item => ({
        itemType: 'product',
        itemId: item.product.id,
        description: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        subtotal: item.product.price * item.quantity,
        discount: 0,
        total: item.product.price * item.quantity,
      }));

      // Crear factura
      const invoice = await addInvoice({
        gymId: gym?.id || '',
        clientId: selectedClientId || undefined,
        invoiceDate: new Date(),
        subtotal: cartTotal,
        tax: 0,
        discount: 0,
        total: cartTotal,
        status: 'paid',
      }, invoiceItems);

      if (!invoice) {
        throw new Error('Error al crear la factura');
      }

      // Crear pago - Usar la fecha de hoy sin hora para evitar problemas de zona horaria
      const today = new Date();
      const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0));
      
      // Preparar datos del pago
      let paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>;
      
      // Si no hay cliente seleccionado, usar string vacío (se convertirá a null en el backend)
      const finalClientId: string = selectedClientId && selectedClientId.trim() !== '' ? selectedClientId : '';
      
      if (paymentMethod === 'mixed') {
        const cash = parseInt(cashAmount.replace(/\D/g, '')) || 0;
        const transfer = parseInt(transferAmount.replace(/\D/g, '')) || 0;
        
        paymentData = {
          clientId: finalClientId,
          amount: cartTotal,
          method: 'transfer', // Usar 'transfer' como método base, pero el splitPayment tiene los detalles
          paymentDate: todayDate,
          status: 'completed',
          invoiceId: invoice.id,
          splitPayment: {
            cash,
            transfer,
          },
        } as Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>;
      } else {
        paymentData = {
          clientId: finalClientId,
          amount: cartTotal,
          method: paymentMethod,
          paymentDate: todayDate,
          status: 'completed',
          invoiceId: invoice.id,
        } as Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>;
      }
      
      // Agregar cashClosingId si existe
      if (openClosing) {
        paymentData.cashClosingId = openClosing.id;
      }
      
      // Crear pago
      await addPayment(paymentData);

      // Actualizar stock de productos
      for (const item of cart) {
        const newStock = item.product.stock - item.quantity;
        await updateProduct(item.product.id, { stock: newStock });
      }

      // Registrar log de venta
      const client = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;
      const productsList = cart.map(item => `${item.product.name} (${item.quantity})`).join(', ');
      let paymentMethodText = '';
      if (paymentMethod === 'mixed') {
        const cash = parseInt(cashAmount.replace(/\D/g, '')) || 0;
        const transfer = parseInt(transferAmount.replace(/\D/g, '')) || 0;
        paymentMethodText = `Mixto (Efectivo: $${formatPrice(cash)}, Transferencia: $${formatPrice(transfer)})`;
      } else {
        paymentMethodText = paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia';
      }
      
      const saleDescription = client 
        ? `Venta realizada: ${client.name} - Productos: ${productsList} - Total: $${formatPrice(cartTotal)} (${paymentMethodText})`
        : `Venta realizada: Productos: ${productsList} - Total: $${formatPrice(cartTotal)} (${paymentMethodText})`;

      await addAuditLog({
        actionType: 'sale',
        entityType: 'invoice',
        entityId: invoice.id,
        description: saleDescription,
        metadata: {
          clientId: selectedClientId || null,
          clientName: client?.name || null,
          products: cart.map(item => ({
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
          total: cartTotal,
          paymentMethod: paymentMethod,
          cashAmount: paymentMethod === 'mixed' ? parseInt(cashAmount.replace(/\D/g, '')) || 0 : (paymentMethod === 'cash' ? cartTotal : 0),
          transferAmount: paymentMethod === 'mixed' ? parseInt(transferAmount.replace(/\D/g, '')) || 0 : (paymentMethod === 'transfer' ? cartTotal : 0),
          invoiceId: invoice.id,
        },
      });

      // Limpiar carrito y cerrar modal
      setCart([]);
      setSelectedClientId('');
      setPaymentMethod('cash');
      setCashAmount('');
      setTransferAmount('');
      setShowCheckoutModal(false);
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error al procesar la venta. Por favor intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtrar transacciones según el buscador
  const filteredTransactions = useMemo(() => {
    if (!transactionSearchQuery.trim()) {
      return storeMetrics.todayStorePayments;
    }

    const query = transactionSearchQuery.toLowerCase();
    return storeMetrics.todayStorePayments.filter(payment => {
      // Buscar por cliente
      const client = payment.clientId ? clients.find(c => c.id === payment.clientId) : null;
      const clientName = client ? client.name.toLowerCase() : 'cliente no registrado';
      if (clientName.includes(query)) return true;

      // Buscar por productos
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      if (invoice) {
        const items = invoiceItems.filter(item => item.invoiceId === payment.invoiceId);
        const productNames = items.map(item => item.description.toLowerCase()).join(' ');
        if (productNames.includes(query)) return true;
      }

      // Buscar por método de pago
      const methodText = payment.splitPayment 
        ? 'mixto' 
        : payment.method === 'cash' 
          ? 'efectivo' 
          : payment.method === 'transfer' 
            ? 'transferencia' 
            : payment.method;
      if (methodText.includes(query)) return true;

      // Buscar por monto
      if (payment.amount.toString().includes(query)) return true;

      return false;
    });
  }, [storeMetrics.todayStorePayments, transactionSearchQuery, clients, invoices, invoiceItems]);

  // Cancelar venta
  const handleCancelSale = async (paymentId: string) => {
    setIsCancelling(true);
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment || !payment.invoiceId) {
        alert('No se pudo encontrar la información de la venta');
        return;
      }

      // Obtener la factura y sus items
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      if (!invoice) {
        alert('No se pudo encontrar la factura asociada');
        return;
      }

      const items = invoiceItems.filter(item => item.invoiceId === payment.invoiceId);

      // Restaurar stock de productos
      for (const item of items) {
        if (item.itemType === 'product') {
          const product = products.find(p => p.id === item.itemId);
          if (product) {
            const newStock = product.stock + item.quantity;
            await updateProduct(product.id, { stock: newStock });
          }
        }
      }

      // Cambiar estado del pago a 'cancelled'
      await updatePayment(paymentId, { status: 'cancelled' });

      // Cambiar estado de la factura a 'cancelled'
      await updateInvoice(payment.invoiceId, { status: 'cancelled' });

      // Registrar log de cancelación de venta
      const client = payment.clientId ? clients.find(c => c.id === payment.clientId) : null;
      const productsList = items.map(item => `${item.description} (${item.quantity})`).join(', ');
      let paymentMethodText = '';
      if (payment.splitPayment) {
        paymentMethodText = `Mixto (Efectivo: $${formatPrice(payment.splitPayment.cash)}, Transferencia: $${formatPrice(payment.splitPayment.transfer)})`;
      } else {
        paymentMethodText = payment.method === 'cash' ? 'Efectivo' : 'Transferencia';
      }

      const cancelDescription = client
        ? `Venta cancelada: ${client.name} - Productos: ${productsList} - Total: $${formatPrice(payment.amount)} (${paymentMethodText})`
        : `Venta cancelada: Productos: ${productsList} - Total: $${formatPrice(payment.amount)} (${paymentMethodText})`;

      await addAuditLog({
        actionType: 'cancel',
        entityType: 'invoice',
        entityId: payment.invoiceId,
        description: cancelDescription,
        metadata: {
          clientId: payment.clientId || null,
          clientName: client?.name || null,
          products: items.map(item => ({
            id: item.itemId,
            name: item.description,
            quantity: item.quantity,
            price: item.unitPrice,
          })),
          total: payment.amount,
          paymentMethod: payment.method,
          cashAmount: payment.splitPayment?.cash || (payment.method === 'cash' ? payment.amount : 0),
          transferAmount: payment.splitPayment?.transfer || (payment.method === 'transfer' ? payment.amount : 0),
          invoiceId: payment.invoiceId,
          paymentId: paymentId,
        },
      });

      setCancelPaymentId(null);
    } catch (error) {
      console.error('Error canceling sale:', error);
      alert('Error al cancelar la venta. Por favor intenta de nuevo.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-white dark:bg-dark-900">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Tienda</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Vende productos a tus clientes, gestiona el inventario y registra todas las transacciones de forma rápida y sencilla</p>
          </div>
          {cart.length > 0 && (
            <Button
              variant="primary"
              onClick={() => setShowCheckoutModal(true)}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Finalizar Venta (${formatPrice(cartTotal)})
            </Button>
          )}
        </div>

        {/* Métricas de ingresos de la tienda */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700 rounded-lg p-4">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Total del Día</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${formatPrice(storeMetrics.totalToday)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{storeMetrics.count} ventas</p>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700 rounded-lg p-4">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Efectivo</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${formatPrice(storeMetrics.cashToday)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {storeMetrics.cashPaymentsCount} {storeMetrics.cashPaymentsCount === 1 ? 'venta' : 'ventas'}
              </p>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700 rounded-lg p-4">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Transferencia</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${formatPrice(storeMetrics.transferToday)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {storeMetrics.transferPaymentsCount} {storeMetrics.transferPaymentsCount === 1 ? 'venta' : 'ventas'}
              </p>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-dark-800/50 border border-gray-300 dark:border-dark-700 rounded-lg p-4">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatPrice(products.filter(p => p.isActive).reduce((sum, p) => sum + p.stock, 0))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">unidades disponibles en total</p>
            </div>
          </div>
        </div>

        {/* Sección de Transacciones */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Transacciones del Día
            </h2>
            <Button onClick={() => setShowCheckoutModal(true)} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Venta
            </Button>
          </div>

          {/* Buscador de transacciones */}
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por cliente, producto, método de pago..."
                value={transactionSearchQuery}
                onChange={(e) => setTransactionSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabla de transacciones */}
          <Card className="bg-white dark:bg-dark-800/50 border-gray-200 dark:border-dark-700">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No hay transacciones registradas hoy
                </p>
                <Button onClick={() => setShowCheckoutModal(true)} variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Primera Venta
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-800/30 border-b border-gray-200 dark:border-dark-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Productos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Método de Pago
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800/50 divide-y divide-gray-200 dark:divide-dark-700">
                    {filteredTransactions.map((payment) => {
                      // Obtener la factura asociada
                      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
                      // Obtener los items de la factura
                      const items = invoiceItems.filter(item => item.invoiceId === payment.invoiceId);
                      // Obtener el cliente si existe
                      const client = payment.clientId ? clients.find(c => c.id === payment.clientId) : null;
                      
                      return (
                        <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/30">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                            {format(payment.createdAt, 'HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                            {client ? client.name : 'Cliente no registrado'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="space-y-1">
                              {items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-gray-900 dark:text-gray-50">
                                    {item.description}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    x{item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {payment.splitPayment ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="warning" className="text-xs whitespace-nowrap">
                                  Mixto
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  ${formatPrice(payment.splitPayment.cash)} / ${formatPrice(payment.splitPayment.transfer)}
                                </span>
                              </div>
                            ) : (
                              <Badge 
                                variant={payment.method === 'cash' ? 'success' : payment.method === 'transfer' ? 'primary' : 'secondary'}
                              >
                                {payment.method === 'cash' ? 'Efectivo' : payment.method === 'transfer' ? 'Transferencia' : payment.method}
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-gray-50">
                            ${formatPrice(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center items-center">
                              {payment.status === 'completed' ? (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setCancelPaymentId(payment.id)}
                                  className="flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Cancelar
                                </Button>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Cancelada
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-dark-800/30 border-t border-gray-200 dark:border-dark-700">
                    <tr>
                      <td colSpan={5} className="px-6 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total del Día:
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-gray-900 dark:text-gray-50">
                        ${formatPrice(storeMetrics.totalToday)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Modal de checkout con carrito */}
        <Modal
          isOpen={showCheckoutModal}
          onClose={() => !isProcessing && setShowCheckoutModal(false)}
          title="Registrar Venta"
          maxWidth="full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[85vh] overflow-hidden">
            {/* Panel izquierdo: Productos */}
            <div className="lg:col-span-2 flex flex-col overflow-hidden">
              {/* Búsqueda */}
              <div className="mb-4 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Grid de productos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-y-auto flex-1 pr-2 auto-rows-min">
                {availableProducts.length === 0 ? (
                  <div className="col-span-full">
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {products.length === 0 
                          ? 'No hay productos disponibles' 
                          : 'No se encontraron productos con los filtros aplicados'}
                      </p>
                    </div>
                  </div>
                ) : (
                  availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-dark-800/50 border border-gray-200 dark:border-dark-700 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm mb-1">
                            {product.name}
                          </h3>
                          {product.sku && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">SKU: {product.sku}</p>
                          )}
                        </div>
                        <Badge variant={product.stock <= product.lowStockAlert ? 'warning' : 'success'} className="text-xs ml-2 flex-shrink-0">
                          Stock: {product.stock}
                        </Badge>
                      </div>
                      <p className="text-base font-bold text-primary-600 dark:text-primary-400 mb-3">
                        ${formatPrice(product.price)}
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Panel derecho: Carrito */}
            <div className="lg:col-span-1 flex flex-col overflow-hidden">
              <div className="bg-gray-50 dark:bg-dark-800/30 rounded-lg p-4 border border-gray-200 dark:border-dark-700 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    Carrito ({cart.length})
                  </h3>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8 flex-shrink-0">
                    <ShoppingCart className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      El carrito está vacío
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="space-y-2 overflow-y-auto flex-1 mb-4">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-2 p-2 bg-white dark:bg-dark-800/50 rounded-lg border border-gray-200 dark:border-dark-700"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-50 truncate">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              ${formatPrice(item.product.price)} c/u
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-50 w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-right min-w-[60px]">
                            <p className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                              ${formatPrice(item.product.price * item.quantity)}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 dark:border-dark-700 pt-4 flex-shrink-0">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                          Total:
                        </span>
                          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                            ${formatPrice(cartTotal)}
                          </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selección de cliente y método de pago */}
              <div className="mt-4 space-y-4 flex-shrink-0">
                {/* Selección de cliente (opcional) */}
                <div>
                  <Select
                    label="Cliente (opcional)"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    options={[
                      { value: '', label: 'Venta sin cliente' },
                      ...clients.map(client => ({
                        value: client.id,
                        label: `${client.name}${client.email ? ` (${client.email})` : ''}`
                      }))
                    ]}
                  />
                </div>

                {/* Método de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Método de pago
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={paymentMethod === 'cash' ? 'primary' : 'secondary'}
                      onClick={() => {
                        setPaymentMethod('cash');
                        setCashAmount('');
                        setTransferAmount('');
                      }}
                      className="flex items-center justify-center gap-2 text-xs"
                    >
                      <CreditCard className="w-4 h-4" />
                      Efectivo
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'transfer' ? 'primary' : 'secondary'}
                      onClick={() => {
                        setPaymentMethod('transfer');
                        setCashAmount('');
                        setTransferAmount('');
                      }}
                      className="flex items-center justify-center gap-2 text-xs"
                    >
                      <CreditCard className="w-4 h-4" />
                      Transferencia
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'mixed' ? 'primary' : 'secondary'}
                      onClick={() => {
                        setPaymentMethod('mixed');
                        setCashAmount('');
                        setTransferAmount('');
                      }}
                      className="flex items-center justify-center gap-2 text-xs"
                    >
                      <CreditCard className="w-4 h-4" />
                      Mixto
                    </Button>
                  </div>
                  
                  {/* Campos para pago mixto */}
                  {paymentMethod === 'mixed' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Monto en Efectivo
                        </label>
                        <Input
                          type="text"
                          placeholder="0"
                          value={cashAmount}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setCashAmount(value);
                          }}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Monto en Transferencia
                        </label>
                        <Input
                          type="text"
                          placeholder="0"
                          value={transferAmount}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setTransferAmount(value);
                          }}
                          className="text-sm"
                        />
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-800/30 rounded-lg p-2 border border-gray-200 dark:border-dark-700">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Total ingresado:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-50">
                            ${formatPrice((parseInt(cashAmount) || 0) + (parseInt(transferAmount) || 0))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-gray-600 dark:text-gray-400">Total de la venta:</span>
                          <span className="font-semibold text-primary-600 dark:text-primary-400">
                            ${formatPrice(cartTotal)}
                          </span>
                        </div>
                        {((parseInt(cashAmount) || 0) + (parseInt(transferAmount) || 0)) !== cartTotal && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            La suma debe ser igual al total de la venta
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowCheckoutModal(false);
                      setCart([]);
                      setSelectedClientId('');
                      setPaymentMethod('cash');
                      setCashAmount('');
                      setTransferAmount('');
                    }}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleCheckout}
                    className="flex-1"
                    disabled={isProcessing || cart.length === 0}
                  >
                    {isProcessing ? 'Procesando...' : 'Confirmar Venta'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Diálogo de confirmación para cancelar venta */}
        <ConfirmDialog
          isOpen={cancelPaymentId !== null}
          onClose={() => setCancelPaymentId(null)}
          onConfirm={() => {
            if (cancelPaymentId) {
              handleCancelSale(cancelPaymentId);
            }
          }}
          title="Cancelar Venta"
          message="¿Estás seguro de que deseas cancelar esta venta? El stock de los productos será restaurado automáticamente."
          confirmText="Sí, Cancelar Venta"
          cancelText="No, Mantener"
          variant="warning"
          isLoading={isCancelling}
        />
      </div>
    </MainLayout>
  );
}
