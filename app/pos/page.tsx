'use client';

import React, { useState, useMemo } from 'react';
import styles from './page.module.scss';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Icon from '../../components/ui/Icon';
import PageHeader from '../../components/ui/PageHeader';
import { products } from '../../data/products';
import { categories } from '../../data/categories';
import { Product } from '../../types';
import { formatCurrency } from '../../components/DocumentEngine';
import { toast } from 'sonner';

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

type PaymentMethod = 'cash' | 'card' | 'mobile_money';

const paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Cash', icon: 'Banknote' },
  { value: 'card', label: 'Card', icon: 'CreditCard' },
  { value: 'mobile_money', label: 'M-Pesa', icon: 'Smartphone' },
];

export default function POSPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [taxRate] = useState('16');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);

  const filteredProducts = useMemo(() => {
    let data = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'all') {
      const cat = categories.find((c) => c.id === activeCategory);
      if (cat) data = data.filter((p) => p.category === cat.name);
    }
    return data;
  }, [search, activeCategory]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Only ${product.stock} units available`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.product.price }
            : i
        );
      }
      return [...prev, { product, quantity: 1, total: product.price }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i;
          const newQty = i.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > i.product.stock) {
            toast.error(`Only ${i.product.stock} units available`);
            return i;
          }
          return { ...i, quantity: newQty, total: newQty * i.product.price };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount('0');
    setPaymentMethod('cash');
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, i) => sum + i.total, 0);
    const discValue = parseFloat(discount) || 0;
    const discountAmount = discountType === 'percentage' ? (subtotal * discValue) / 100 : discValue;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const tax = (afterDiscount * (parseFloat(taxRate) || 0)) / 100;
    const total = afterDiscount + tax;
    return { subtotal, discountAmount, tax, total };
  }, [cart, discount, discountType, taxRate]);

  const completeSale = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const sale: CompletedSale = {
      receiptNumber: `POS-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleString('en-KE'),
      items: cart.map((i) => ({ name: i.product.name, quantity: i.quantity, price: i.product.price, total: i.total })),
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      tax: totals.tax,
      total: totals.total,
      paymentMethod,
      itemCount: cart.reduce((sum, i) => sum + i.quantity, 0),
    };

    setCompletedSale(sale);
    setCart([]);
    setDiscount('0');
    setPaymentMethod('cash');
    toast.success(`Sale completed: ${sale.receiptNumber}`);
  };

  const getStockClass = (stock: number) => {
    if (stock <= 0) return styles.productStockOut;
    if (stock <= 10) return styles.productStockLow;
    return '';
  };

  const getCategoryIcon = (categoryName: string) => {
    const cat = categories.find((c) => c.name === categoryName);
    return cat?.icon || 'Package';
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Point of Sale"
        subtitle="Quick sales and checkout"
      />

      <div className={styles.body}>
        {/* Product panel */}
        <div className={styles.productPanel}>
          <div className={styles.toolbar}>
            <SearchBar
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={setSearch}
              className={styles.search}
            />
          </div>

          <div className={styles.categories}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`${styles.catChip} ${activeCategory === cat.id ? styles.catChipActive : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <Icon name={cat.icon} size={14} />
                {cat.name}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className={styles.noResults}>
              <Icon name="SearchX" size={32} />
              <p>No products found</p>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  className={`${styles.productCard} ${product.stock <= 0 ? styles.productCardOut : ''}`}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <div className={styles.productIcon}>
                    <Icon name={getCategoryIcon(product.category)} size={18} />
                  </div>
                  <div className={styles.productName}>{product.name}</div>
                  <div className={styles.productPrice}>{formatCurrency(product.price)}</div>
                  <div className={`${styles.productStock} ${getStockClass(product.stock)}`}>
                    {product.stock > 0 ? `${product.stock} ${product.unit} in stock` : 'Out of stock'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart panel */}
        <div className={styles.cartPanel}>
          <div className={styles.cartHeader}>
            <div className={styles.cartHeaderLeft}>
              <h3 className={styles.cartTitle}>Cart</h3>
              {cart.length > 0 && (
                <span className={styles.cartCount}>
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button className={styles.clearBtn} onClick={clearCart}>
                <Icon name="Trash2" size={14} />
                Clear Cart
              </button>
            )}
          </div>

          <div className={styles.cartItems}>
            {cart.length === 0 ? (
              <div className={styles.cartEmpty}>
                <Icon name="ShoppingCart" size={32} />
                <p>Cart is empty. Click products to add.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className={styles.cartItem}>
                  <div className={styles.cartItemInfo}>
                    <div className={styles.cartItemName}>{item.product.name}</div>
                    <div className={styles.cartItemPrice}>{formatCurrency(item.product.price)} each</div>
                  </div>
                  <div className={styles.qtyControls}>
                    <button className={styles.qtyBtn} onClick={() => updateQty(item.product.id, -1)}>
                      <Icon name="Minus" size={14} />
                    </button>
                    <span className={styles.qtyValue}>{item.quantity}</span>
                    <button className={styles.qtyBtn} onClick={() => updateQty(item.product.id, 1)}>
                      <Icon name="Plus" size={14} />
                    </button>
                  </div>
                  <div className={styles.cartItemTotal}>{formatCurrency(item.total)}</div>
                  <button className={styles.cartItemRemove} onClick={() => removeFromCart(item.product.id)}>
                    <Icon name="X" size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className={styles.cartFooter}>
              <div className={styles.discountRow}>
                <Select
                  options={[
                    { value: 'percentage', label: 'Discount %' },
                    { value: 'fixed', label: 'Discount KSh' },
                  ]}
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                />
                <input
                  type="number"
                  className={styles.discountInput}
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px',
                    width: '100%',
                    outline: 'none',
                  }}
                />
              </div>

              <div className={styles.cartTotals}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Discount</span>
                  <span>-{formatCurrency(totals.discountAmount)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Tax ({taxRate}%)</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                <div className={styles.totalRowGrand}>
                  <span>Total</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>

              <div className={styles.paymentSection}>
                <span className={styles.paymentLabel}>Payment Method</span>
                <div className={styles.paymentMethods}>
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.value}
                      className={`${styles.payMethod} ${paymentMethod === pm.value ? styles.payMethodActive : ''}`}
                      onClick={() => setPaymentMethod(pm.value)}
                    >
                      <Icon name={pm.icon} size={20} />
                      <span className={styles.payMethodLabel}>{pm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={styles.completeBtn}
                onClick={completeSale}
                disabled={cart.length === 0}
              >
                <Icon name="CheckCircle" size={20} />
                Complete Sale · {formatCurrency(totals.total)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal
        isOpen={!!completedSale}
        onClose={() => setCompletedSale(null)}
        title="Sale Receipt"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCompletedSale(null)}>Close</Button>
            <Button
              leftIcon={<Icon name="Printer" size={16} />}
              onClick={() => {
                if (completedSale) toast.success('Receipt sent to printer');
              }}
            >
              Print Receipt
            </Button>
          </>
        }
      >
        {completedSale && (
          <div className={styles.receipt}>
            <div className={styles.receiptHeader}>
              <div className={styles.receiptCompany}>INFIELD INNOVATIONS</div>
              <div className={styles.receiptAddr}>Meru Makutano, C91, Opp. Equity Bank</div>
              <div className={styles.receiptContact}>+254 702 393 677 | infieldinnovations@gmail.com</div>
            </div>

            <div className={styles.receiptMeta}>
              <span>Receipt: {completedSale.receiptNumber}</span>
              <span>{completedSale.date}</span>
            </div>
            <div className={styles.receiptMeta}>
              <span>Items: {completedSale.itemCount}</span>
              <span>Payment: {completedSale.paymentMethod === 'mobile_money' ? 'M-Pesa' : completedSale.paymentMethod === 'card' ? 'Card' : 'Cash'}</span>
            </div>

            <div className={styles.receiptItems}>
              {completedSale.items.map((item, i) => (
                <div key={i} className={styles.receiptItemRow}>
                  <span className={styles.receiptItemName}>{item.name}</span>
                  <span className={styles.receiptItemQty}>x{item.quantity}</span>
                  <span className={styles.receiptItemPrice}>{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>

            <div className={styles.receiptTotals}>
              <div className={styles.receiptTotalRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(completedSale.subtotal)}</span>
              </div>
              <div className={styles.receiptTotalRow}>
                <span>Discount</span>
                <span>-{formatCurrency(completedSale.discount)}</span>
              </div>
              <div className={styles.receiptTotalRow}>
                <span>Tax</span>
                <span>{formatCurrency(completedSale.tax)}</span>
              </div>
              <div className={styles.receiptGrand}>
                <span>TOTAL</span>
                <span>{formatCurrency(completedSale.total)}</span>
              </div>
            </div>

            <div className={styles.receiptFooter}>
              Thank you for choosing Infield Innovations!
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

interface CompletedSale {
  receiptNumber: string;
  date: string;
  items: { name: string; quantity: number; price: number; total: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  itemCount: number;
}
