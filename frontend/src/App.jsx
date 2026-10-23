import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, Utensils, Search, Plus, Minus, Trash2, ArrowRight, Sparkles, ChefHat, Clock3, CheckCircle2 } from 'lucide-react';
import { api } from './services/api';
import { money, calcTotals } from './utils.js';
import Assistant from './Assistant.jsx';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80';
// Swap in the fallback once; clearing onerror stops an endless retry loop if the fallback also fails.
const swapToFallback = (e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; };

const CartContext = createContext(null);
function useCart() { return useContext(CartContext); }

function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('noirbite-cart') || '{}'); } catch { return {}; }
  });
  useEffect(() => { try { localStorage.setItem('noirbite-cart', JSON.stringify(cart)); } catch { /* storage unavailable */ } }, [cart]);
  const [config, setConfig] = useState({ taxRate: 0.05, assistantEnabled: false });
  useEffect(() => {
    api.config().then(c => setConfig({ taxRate: Number(c.taxRate), assistantEnabled: !!c.assistantEnabled })).catch(() => {});
  }, []);
  const add = (food) => setCart(old => ({ ...old, [food.id]: { food, quantity: (old[food.id]?.quantity || 0) + 1 } }));
  const change = (id, delta) => setCart(old => {
    const next = { ...old }; const q = (next[id]?.quantity || 0) + delta;
    if (q <= 0) delete next[id]; else next[id] = { ...next[id], quantity: Math.min(q, 50) };
    return next;
  });
  const remove = id => setCart(old => { const next = { ...old }; delete next[id]; return next; });
  const clear = () => setCart({});
  const items = Object.values(cart);
  const count = items.reduce((s, x) => s + x.quantity, 0);
  const { subtotal } = calcTotals(items, config.taxRate);
  return <CartContext.Provider value={{ cart, items, count, subtotal, config, add, change, remove, clear }}>{children}</CartContext.Provider>;
}

function Header() {
  const { count } = useCart();
  return <header className="header"><Link className="brand" to="/"><span className="brand-mark"><Utensils size={20}/></span><span>NOIR<span className="gold">BITE</span><small>Luxury Dining. Smarter Ordering.</small></span></Link>
    <nav><NavLink to="/">Home</NavLink><NavLink to="/menu">Menu</NavLink><NavLink to="/orders">My Orders</NavLink></nav>
    <Link className="cart-link" to="/cart"><ShoppingBag size={18}/> <span>Cart</span><b>{count}</b></Link>
  </header>;
}

function Hero() {
  return <section className="hero"><div className="hero-copy"><div className="eyebrow"><Sparkles size={15}/> A TASTE OF SOMETHING EXTRAORDINARY</div><h1>Good food.<br/><em>Great moments.</em></h1><p>Thoughtfully prepared favourites, beautifully delivered. Your next memorable meal starts here.</p><div className="hero-actions"><Link className="btn primary" to="/menu">Explore the menu <ArrowRight size={17}/></Link><a className="text-link" href="#signature">Discover our signature</a></div><div className="hero-stats"><div><strong>Daily</strong><span>Chef's specials</span></div><div><strong>Fresh</strong><span>Made to order</span></div><div><strong>Fast</strong><span>Easy checkout</span></div></div></div>
    <div className="hero-image"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85" alt="Elegant restaurant food spread"/><div className="image-note"><span className="note-dot"/> Crafted with care <small>Every plate, every time</small></div></div>
  </section>;
}

function FoodCard({ food }) {
  const { add, cart, change } = useCart();
  const qty = cart[food.id]?.quantity || 0;
  return <article className="food-card"><div className="food-photo"><img src={food.imageUrl || FALLBACK_IMG} alt={food.name} onError={swapToFallback}/>{food.dailySpecial && <span className="special"><Sparkles size={12}/> Chef's pick</span>}<span className={`veg-dot ${food.vegetarian ? '' : 'nonveg'}`}/></div><div className="food-info"><div className="food-category">{food.category?.name || 'NOIRBITE SPECIAL'}</div><h3>{food.name}</h3><p>{food.description || 'Made fresh with carefully selected ingredients.'}</p><div className="food-bottom"><strong>{money(food.price)}</strong>{qty ? <div className="qty"><button aria-label="Decrease quantity" onClick={() => change(food.id, -1)}><Minus size={14}/></button><b>{qty}</b><button aria-label="Increase quantity" onClick={() => change(food.id, 1)}><Plus size={14}/></button></div> : <button className="add-btn" disabled={!food.available} onClick={() => add(food)}>{food.available ? <><Plus size={15}/> Add</> : 'Unavailable'}</button>}</div></div></article>;
}

function MenuPage() {
  const [foods, setFoods] = useState([]), [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(''), [category, setCategory] = useState('All'), [vegOnly, setVegOnly] = useState(false), [sort, setSort] = useState('featured');
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => { Promise.all([api.foods(), api.categories()]).then(([f,c]) => { setFoods(f); setCategories(c); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => foods.filter(f => f.available && f.name.toLowerCase().includes(search.toLowerCase()) && (category === 'All' || f.category?.name === category) && (!vegOnly || f.vegetarian)).sort((a,b) => sort === 'low' ? a.price-b.price : sort === 'high' ? b.price-a.price : Number(b.dailySpecial)-Number(a.dailySpecial)), [foods, search, category, vegOnly, sort]);
  return <main className="page-wrap"><div className="section-heading"><div><div className="eyebrow">OUR KITCHEN, YOUR TABLE</div><h1>Explore the <em>menu.</em></h1><p>From comforting classics to little indulgences, find your next favourite.</p></div><div className="menu-count">{filtered.length} dishes</div></div>
    <div className="filters"><label className="searchbox"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dishes..."/></label><select value={category} onChange={e => setCategory(e.target.value)}><option>All</option>{categories.map(c => <option key={c.id}>{c.name}</option>)}</select><select value={sort} onChange={e => setSort(e.target.value)}><option value="featured">Featured first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select><label className="veg-filter"><input type="checkbox" checked={vegOnly} onChange={e => setVegOnly(e.target.checked)}/> Vegetarian</label></div>
    {loading && <div className="message">Preparing the menu…</div>}{error && <div className="message error">{error}<br/><small>Check that the Spring Boot API is running and sample data is loaded.</small></div>}
    {!loading && !error && <div className="food-grid">{filtered.map(f => <FoodCard key={f.id} food={f}/>)}{filtered.length === 0 && <div className="empty"><Utensils size={30}/><h3>No dishes found</h3><p>Try another search or category.</p></div>}</div>}
  </main>;
}

function CartPage() {
  const { items, subtotal, config, change, remove } = useCart(); const navigate = useNavigate();
  const { tax, total } = calcTotals(items, config.taxRate);
  return <main className="page-wrap"><div className="section-heading"><div><div className="eyebrow">ALMOST THERE</div><h1>Your <em>basket.</em></h1><p>Review your choices before checking out.</p></div></div>
    {!items.length ? <div className="empty cart-empty"><ShoppingBag size={38}/><h2>Your cart is taking a breather.</h2><p>Add a dish you love and it will appear here.</p><Link className="btn primary" to="/menu">Browse menu <ArrowRight size={17}/></Link></div> :
    <div className="cart-layout"><div className="cart-items">{items.map(({food,quantity}) => <div className="cart-row" key={food.id}><img src={food.imageUrl || FALLBACK_IMG} alt={food.name} onError={swapToFallback}/><div className="cart-desc"><h3>{food.name}</h3><p>{money(food.price)} each</p><div className="qty"><button aria-label="Decrease quantity" onClick={() => change(food.id,-1)}><Minus size={14}/></button><b>{quantity}</b><button aria-label="Increase quantity" onClick={() => change(food.id,1)}><Plus size={14}/></button></div></div><strong>{money(food.price*quantity)}</strong><button className="icon-button" aria-label={`Remove ${food.name}`} onClick={() => remove(food.id)}><Trash2 size={17}/></button></div>)}</div>
      <aside className="summary"><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-line"><span>Estimated tax ({+(config.taxRate * 100).toFixed(2)}%)</span><span>{money(tax)}</span></div><div className="summary-line total"><span>Total estimate</span><strong>{money(total)}</strong></div><small>Final tax and prices are calculated by the server at order placement.</small><button className="btn primary full" onClick={() => navigate('/checkout')}>Continue to checkout <ArrowRight size={17}/></button></aside></div>}
  </main>;
}

function CheckoutPage() {
  const { items, clear } = useCart(); const navigate = useNavigate();
  const [form, setForm] = useState({customerName:'', phone:'', orderType:'TAKEAWAY', tableNumber:'', instructions:''});
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const update = e => setForm({...form, [e.target.name]: e.target.value});
  async function submit(e) {
    e.preventDefault(); setError('');
    if (!items.length) return setError('Your cart is empty.');
    setBusy(true);
    try {
      const order = await api.createOrder({...form, tableNumber: form.orderType === 'DINE_IN' ? Number(form.tableNumber) : null, items: items.map(x => ({foodId:x.food.id, quantity:x.quantity}))});
      clear(); navigate(`/confirmation/${order.id}`, {state:{order}});
    } catch(err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="page-wrap narrow"><div className="section-heading"><div><div className="eyebrow">SECURE YOUR ORDER</div><h1>Checkout <em>details.</em></h1></div></div>
    <form className="checkout-form" onSubmit={submit}><label>Customer name<input name="customerName" value={form.customerName} onChange={update} required maxLength="100" placeholder="Your full name"/></label><label>Phone number<input name="phone" value={form.phone} onChange={update} required pattern="[0-9+ \-]{8,20}" title="8-20 digits; + and spaces allowed" placeholder="Contact number"/></label><label>Order type<select name="orderType" value={form.orderType} onChange={update}><option value="TAKEAWAY">Takeaway</option><option value="DINE_IN">Dine-in</option></select></label>{form.orderType === 'DINE_IN' && <label>Table number<input name="tableNumber" type="number" min="1" value={form.tableNumber} onChange={update} required/></label>}<label className="wide">Special instructions <textarea name="instructions" value={form.instructions} onChange={update} maxLength="500" placeholder="Allergies, spice preference, etc. (optional)"/></label>
    {error && <p className="form-error wide">{error}</p>}<button className="btn primary full wide" disabled={busy || !items.length}>{busy ? 'Placing order…' : 'Confirm order'} <ArrowRight size={17}/></button><p className="fine-print wide">Your final total is calculated using current database prices and the server tax setting.</p></form>
  </main>;
}

function ConfirmationPage({id}) {
  const [order, setOrder] = useState(null), [error, setError] = useState('');
  useEffect(() => { let alive = true; api.getOrder(id).then(o => alive && setOrder(o)).catch(e => alive && setError(e.message)); const timer = setInterval(() => api.getOrder(id).then(o => alive && setOrder(o)).catch(()=>{}), 15000); return () => { alive = false; clearInterval(timer); }; }, [id]);
  if (error) return <main className="page-wrap message error">{error}</main>;
  if (!order) return <main className="page-wrap message">Loading your order…</main>;
  return <main className="page-wrap narrow"><div className="confirmation"><CheckCircle2 size={48}/><div className="eyebrow">ORDER RECEIVED</div><h1>Thank you. <em>It's on us.</em></h1><p>Your order has been saved. Keep your order number handy.</p><div className="order-number">{order.orderNumber}</div><div className="status-pill"><span className="status-dot"/>{order.status}</div><div className="invoice"><div className="summary-line"><span>Subtotal</span><span>{money(order.subtotal)}</span></div><div className="summary-line"><span>Tax</span><span>{money(order.tax)}</span></div><div className="summary-line total"><span>Total due</span><strong>{money(order.grandTotal)}</strong></div>{order.items.map((i,idx)=><div className="summary-line" key={idx}><span>{i.foodName} × {i.quantity}</span><span>{money(i.lineTotal)}</span></div>)}</div><button className="btn secondary" onClick={() => window.print()}>Print invoice</button><Link className="btn primary" to="/menu">Order more</Link></div></main>;
}

function OrdersPage() {
  const [phone,setPhone] = useState(''), [orders,setOrders] = useState(null), [error,setError] = useState('');
  async function find(e) { e.preventDefault(); setError(''); try { setOrders(await api.myOrders(phone)); } catch(err) { setError(err.message); } }
  return <main className="page-wrap narrow"><div className="section-heading"><div><div className="eyebrow">YOUR NOIRBITE JOURNEY</div><h1>Order <em>history.</em></h1><p>Enter the phone number used at checkout. Production deployments should use authenticated accounts.</p></div></div><form className="order-lookup" onSubmit={find}><input value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="Phone number used for your order"/><button className="btn primary">Find orders</button></form>{error && <p className="form-error">{error}</p>}{orders && (orders.length ? orders.map(o=><div className="history-card" key={o.id}><div><b>{o.orderNumber}</b><span>{new Date(o.createdAt).toLocaleString()}</span></div><span className="status-pill">{o.status}</span><strong>{money(o.grandTotal)}</strong><Link to={`/confirmation/${o.id}`}>View invoice</Link></div>) : <div className="message">No orders found for that phone number.</div>)}</main>;
}

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

function AdminPage() {
  const [key, setKey] = useState(() => { try { return sessionStorage.getItem('nb_admin_key') || ''; } catch { return ''; } });
  const [input, setInput] = useState('');
  const [orders, setOrders] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(false);

  async function load(k = key) {
    if (!k) return;
    setLoading(true);
    try { setOrders(await api.adminOrders(k)); setError(''); }
    catch (e) {
      if (e.status === 403) { try { sessionStorage.removeItem('nb_admin_key'); } catch {} setKey(''); setOrders([]); setError('Invalid admin key'); }
      else setError(e.message);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [key]);

  function login(e) {
    e.preventDefault();
    const k = input.trim(); if (!k) return;
    try { sessionStorage.setItem('nb_admin_key', k); } catch {}
    setError(''); setInput(''); setKey(k);
  }
  function logout() { try { sessionStorage.removeItem('nb_admin_key'); } catch {} setKey(''); setOrders([]); }
  async function changeStatus(id, value) {
    try { await api.updateStatus(id, value, key); await load(); } catch (e) { setError(e.message); }
  }

  return <main className="page-wrap"><div className="section-heading"><div><div className="eyebrow">STAFF WORKSPACE</div><h1>Order <em>desk.</em></h1><p>Restricted to staff. Enter the admin key to view and update orders.</p></div>{key && <div><button className="btn secondary" onClick={() => load()} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button> <button className="btn secondary" onClick={logout}>Lock</button></div>}</div>
    {!key && <form className="admin-login" onSubmit={login}><input type="password" value={input} onChange={e => setInput(e.target.value)} placeholder="Admin key" autoComplete="off" required/><button className="btn primary">Unlock</button></form>}
    {error && <p className="form-error">{error}</p>}
    {key && <div className="admin-table"><div className="admin-head"><span>Order</span><span>Customer</span><span>Total</span><span>Status</span><span>Update</span></div>{orders.map(o => <div className="admin-row" key={o.id}><b>{o.orderNumber}</b><span>{o.customerName}<br/><small>{o.orderType === 'DINE_IN' ? `Table ${o.tableNumber}` : 'Takeaway'} · {o.phone}</small></span><strong>{money(o.grandTotal)}</strong><span>{o.status}</span><select value={o.status} onChange={e => changeStatus(o.id, e.target.value)}>{ORDER_STATUSES.map(st => <option key={st}>{st}</option>)}</select></div>)}{!orders.length && !loading && <div className="message">No orders yet.</div>}</div>}
  </main>;
}

function HomePage() {
  const [foods,setFoods] = useState([]);
  useEffect(()=>{api.foods().then(setFoods).catch(()=>{})},[]);
  return <><Hero/><section id="signature" className="signature page-wrap"><div className="section-heading"><div><div className="eyebrow">A FEW HOUSE FAVOURITES</div><h2>Made to <em>be remembered.</em></h2><p>Explore customer favourites from our kitchen.</p></div><Link className="text-link" to="/menu">View full menu <ArrowRight size={16}/></Link></div><div className="food-grid">{foods.filter(f=>f.dailySpecial || f.category?.name==='Breakfast').slice(0,4).map(f=><FoodCard key={f.id} food={f}/>)}</div></section><section className="experience"><div><ChefHat size={25}/><h2>Thoughtful food.<br/><em>Effortless ordering.</em></h2><p>Browse, customise, and check out in moments. Your bill is calculated from live menu prices for clarity at every step.</p><Link className="btn primary" to="/menu">Find your next favourite <ArrowRight size={16}/></Link></div><div className="experience-note"><Clock3 size={22}/><span><b>Simple from start to finish</b><small>Choose · Confirm · Enjoy</small></span></div></section></>;
}

function Footer() { return <footer className="footer"><div className="brand"><span className="brand-mark"><Utensils size={18}/></span><span>NOIR<span className="gold">BITE</span><small>Luxury Dining. Smarter Ordering.</small></span></div><p>Thoughtfully prepared. Beautifully served.</p><span>© {new Date().getFullYear()} NoirBite</span></footer>; }

export default function App() {
  return <CartProvider><div className="app-shell"><Header/><Routes><Route path="/" element={<HomePage/>}/><Route path="/menu" element={<MenuPage/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="/confirmation/:id" element={<ConfirmationRoute/>}/><Route path="/orders" element={<OrdersPage/>}/><Route path="/admin" element={<AdminPage/>}/><Route path="*" element={<HomePage/>}/></Routes><Footer/><AssistantGate/></div></CartProvider>;
}
function ConfirmationRoute() { const { id } = useParams(); return <ConfirmationPage id={id}/>; }
function AssistantGate() { const { config } = useCart(); return <Assistant enabled={config.assistantEnabled}/>; }
