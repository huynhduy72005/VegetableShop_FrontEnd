import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import './Admin.css';
import AdminOrders from './AdminOrders';


const money = value => Number(value || 0).toLocaleString('vi-VN') + ' ₫';
const emptyProduct = { name: '', price: '', quantity: '', unit: 'kg', image: '', description: '', categoryId: '', isVisible: true };
const emptyCategory = { name: '', description: '' }; // State rỗng cho form danh mục
const stockLabel = quantity => quantity <= 0 ? 'Hết hàng' : quantity < 10 ? 'Sắp hết' : 'Còn hàng';
const stockPriority = quantity => quantity <= 0 ? 0 : quantity < 10 ? 1 : 2;

const allTabs = [
    ['overview', '◫', 'Tổng quan'],
    ['products', '▦', 'Sản phẩm'],
    ['inventory', '▤', 'Kiểm tra tồn kho'],
    ['categories', '◈', 'Danh mục'],
    ['orders', '▣', 'Đơn hàng']
];

export default function Admin({ currentUser, onBackToAccount }) {
    const isAdmin = currentUser?.role === 'Admin';
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({});
    const [tab, setTab] = useState('overview');
    const [staffPermissions, setStaffPermissions] = useState(null);
    const [permissionError, setPermissionError] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState('newest');
    const [inventorySearch, setInventorySearch] = useState('');
    const [inventoryCategory, setInventoryCategory] = useState('');
    const [inventoryStock, setInventoryStock] = useState('');
    const [inventorySortBy, setInventorySortBy] = useState('quantity');
    const [inventorySortDirection, setInventorySortDirection] = useState('asc');
    const [page, setPage] = useState(1);
    const [form, setForm] = useState(null);
    const [catForm, setCatForm] = useState(null); // State quản lý Form Danh mục
    const [inventoryForm, setInventoryForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        if (isAdmin) {
            setStaffPermissions(null);
            setPermissionError('');
            return undefined;
        }

        let active = true;
        setStaffPermissions(null);
        setPermissionError('');
        api.getMyEmployeeProfile()
            .then(({ data }) => {
                if (!active) return;
                const employee = data.employee;
                setStaffPermissions({
                    canManageProducts: Boolean(employee?.canManageProducts),
                    canManageOrders: Boolean(employee?.canManageOrders),
                    canManageInventory: Boolean(employee?.canManageInventory)
                });
            })
            .catch(() => {
                if (active) setPermissionError('Không tải được quyền nhân viên. Hãy đăng nhập lại hoặc liên hệ Admin.');
            });
        return () => { active = false; };
    }, [isAdmin, currentUser?.id]);

    const permissionLoading = !isAdmin && staffPermissions === null && !permissionError;
    const canManageProducts = isAdmin || Boolean(staffPermissions?.canManageProducts);
    const canManageOrders = isAdmin || Boolean(staffPermissions?.canManageOrders);
    const canManageInventory = isAdmin || Boolean(staffPermissions?.canManageInventory);
    const canViewProducts = canManageProducts || canManageInventory;
    const availableTabs = useMemo(() => isAdmin
        ? allTabs
        : [
            ...(canManageProducts ? [allTabs[1], allTabs[3]] : []),
            ...(canManageInventory ? [allTabs[2]] : []),
            ...(canManageOrders ? [allTabs[4]] : [])
        ], [isAdmin, canManageProducts, canManageInventory, canManageOrders]);

    useEffect(() => {
        if (permissionLoading || permissionError || !availableTabs.length)
            return;
        if (!availableTabs.some(([id]) => id === tab))
            setTab(availableTabs[0][0]);
    }, [permissionLoading, permissionError, availableTabs, tab]);

    async function loadData() {
        const [p, c, s] = await Promise.all([
            canViewProducts ? api.getProducts() : Promise.resolve({ data: [] }),
            canViewProducts ? api.getCategories() : Promise.resolve({ data: [] }),
            canManageOrders ? api.getRevenue() : Promise.resolve({ data: {} })
        ]);
        setProducts(p.data);
        setCategories(c.data);
        setStats(s.data);
    }

    async function refresh() {
        if (permissionLoading || permissionError)
            return;
        setLoading(true);
        try {
            await loadData();
        } catch {
            setNotice({ error: true, text: 'Không tải được dữ liệu. Kiểm tra backend đang chạy tại cổng 7179 rồi bấm Tải lại.' });
        } finally { setLoading(false); }
    }
    useEffect(() => {
        if (permissionLoading)
            return undefined;
        if (permissionError) {
            setLoading(false);
            return undefined;
        }

        let active = true;
        Promise.all([
            canViewProducts ? api.getProducts() : Promise.resolve({ data: [] }),
            canViewProducts ? api.getCategories() : Promise.resolve({ data: [] }),
            canManageOrders ? api.getRevenue() : Promise.resolve({ data: {} })
        ])
            .then(([p, c, s]) => { if (active) { setProducts(p.data); setCategories(c.data); setStats(s.data); } })
            .catch(() => { if (active) setNotice({ error: true, text: 'Không tải được dữ liệu. Hãy chạy backend và bấm Tải lại.' }); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [permissionLoading, permissionError, canViewProducts, canManageOrders]);

    const backButton = (
        <button type="button" className="adm-back-button" onClick={onBackToAccount}>
            ← Quay lại tài khoản
        </button>
    );

    if (permissionLoading)
        return <div className="adm-shell"><main className="adm-main">{backButton}<p>Đang tải quyền nhân viên…</p></main></div>;
    if (permissionError)
        return <div className="adm-shell"><main className="adm-main">{backButton}<div role="alert" className="adm-notice error">{permissionError}</div></main></div>;
    if (!isAdmin && !availableTabs.length)
        return <div className="adm-shell"><main className="adm-main">{backButton}<div role="status" className="adm-notice">Tài khoản chưa được cấp quyền quản lý cửa hàng. Vui lòng liên hệ Admin.</div></main></div>;

    const lowStock = products.filter(p => p.quantity < 10).sort((a, b) =>
        stockPriority(a.quantity) - stockPriority(b.quantity) || a.quantity - b.quantity
    );
    const filtered = products.filter(p =>
        (p.name || '').toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')) &&
        (!category || String(p.categoryId) === category)
    ).sort((a, b) => sort === 'price' ? a.price - b.price : sort === 'stock' ? a.quantity - b.quantity : b.id - a.id);
    const inventoryProducts = products.filter(p =>
        (p.name || '').toLocaleLowerCase('vi').includes(inventorySearch.toLocaleLowerCase('vi')) &&
        (!inventoryCategory || String(p.categoryId) === inventoryCategory) &&
        (!inventoryStock || (
            inventoryStock === 'out' ? p.quantity <= 0 :
                inventoryStock === 'low' ? p.quantity > 0 && p.quantity < 10 :
                    p.quantity >= 10
        ))
    ).sort((a, b) => {
        const priority = stockPriority(a.quantity) - stockPriority(b.quantity);
        if (priority) return priority;

        const direction = inventorySortDirection === 'asc' ? 1 : -1;
        if (inventorySortBy === 'name') {
            return direction * (a.name || '').localeCompare(b.name || '', 'vi');
        }
        if (inventorySortBy === 'price') return direction * (Number(a.price) - Number(b.price));
        if (inventorySortBy === 'status') {
            return stockPriority(a.quantity) - stockPriority(b.quantity);
        }
        return direction * (Number(a.quantity) - Number(b.quantity));
    });
    const pageCount = Math.max(1, Math.ceil(filtered.length / 8));
    const currentPage = Math.min(page, pageCount);
    const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
    const categoryName = id => categories.find(c => c.id === id)?.name || 'Chưa phân loại';
    
    function updateFilter(setter, value) { setter(value); setPage(1); }
    
    function startForm(product) {
        setNotice(null);
        setForm(product ? { ...product } : { ...emptyProduct, categoryId: categories[0]?.id || '' });
    }

    function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    }

    // --- CÁC HÀM XỬ LÝ SẢN PHẨM ---
    async function saveProduct(event) {
        event.preventDefault();
        if (saving) return;
        const payload = { ...form, name: form.name.trim(), unit: form.unit.trim(), price: Number(form.price), quantity: Number(form.quantity), categoryId: Number(form.categoryId) };
        if (!payload.name || !payload.unit || !Number.isFinite(payload.price) || payload.price < 0 || !Number.isInteger(payload.quantity) || payload.quantity < 0 || !categories.some(c => c.id === payload.categoryId)) {
            setNotice({ error: true, text: 'Kiểm tra tên, đơn vị, giá, tồn kho và danh mục hợp lệ.' }); return;
        }
        setSaving(true);
        try {
            if (payload.id) await api.updateProduct(payload.id, payload);
            else await api.createProduct(payload);
            setForm(null); setNotice({ text: 'Đã lưu sản phẩm thành công.' }); await refresh();
        } catch { setNotice({ error: true, text: 'Lưu thất bại. Kiểm tra kết nối và dữ liệu rồi thử lại.' }); }
        finally { setSaving(false); }
    }

    async function saveInventory(event) {
        event.preventDefault();
        if (saving) return;

        const quantity = Number(inventoryForm.quantity);
        if (!Number.isInteger(quantity) || quantity < 0) {
            setNotice({ error: true, text: 'Số lượng tồn kho phải là số nguyên không âm.' });
            return;
        }

        setSaving(true);
        try {
            await api.updateProductInventory(inventoryForm.id, { quantity });
            setInventoryForm(null);
            setNotice({ text: 'Đã cập nhật số lượng tồn kho.' });
            await refresh();
        } catch {
            setNotice({ error: true, text: 'Không cập nhật được tồn kho. Hãy thử lại hoặc liên hệ Admin.' });
        } finally {
            setSaving(false);
        }
    }

    async function deleteProduct(product) {
        if (!window.confirm(`Xóa sản phẩm “${product.name}”?`)) return;
        setSaving(true);
        try { await api.deleteProduct(product.id); setNotice({ text: 'Đã xóa sản phẩm.' }); await refresh(); }
        catch { setNotice({ error: true, text: 'Không xóa được. Sản phẩm có thể đã được sử dụng trong đơn hàng.' }); }
        finally { setSaving(false); }
    }

    async function toggleProductVisibility(product) {
        if (saving) return;
        const isVisible = product.isVisible === false;
        setSaving(true);
        try {
            await api.updateProduct(product.id, { ...product, isVisible });
            const { data: updatedProduct } = await api.getProductById(product.id);
            if (updatedProduct.isVisible !== isVisible) {
                throw new Error('The backend did not save the visibility state.');
            }
            setProducts(current => current.map(item =>
                item.id === product.id ? updatedProduct : item
            ));
            setNotice({ text: isVisible ? 'Đã hiện sản phẩm trên cửa hàng.' : 'Đã ẩn sản phẩm khỏi cửa hàng.' });
        } catch {
            setNotice({ error: true, text: 'Không cập nhật được trạng thái hiển thị. Kiểm tra backend đã cập nhật và chạy migration chưa.' });
        } finally {
            setSaving(false);
        }
    }

    // --- CÁC HÀM XỬ LÝ DANH MỤC (MỚI THÊM) ---
    function startCatForm(cat) {
        setNotice(null);
        setCatForm(cat ? { ...cat } : { ...emptyCategory });
    }

    async function saveCategory(event) {
        event.preventDefault();
        if (saving) return;
        const payload = { ...catForm, name: catForm.name.trim() };
        if (!payload.name) {
            setNotice({ error: true, text: 'Vui lòng nhập tên danh mục.' }); return;
        }
        setSaving(true);
        try {
            if (payload.id) await api.updateCategory(payload.id, payload);
            else await api.createCategory(payload);
            setCatForm(null); setNotice({ text: 'Đã lưu danh mục thành công.' }); await refresh();
        } catch { setNotice({ error: true, text: 'Lưu thất bại. Kiểm tra kết nối và dữ liệu rồi thử lại.' }); }
        finally { setSaving(false); }
    }

    async function deleteCategory(cat) {
        if (!window.confirm(`Xóa danh mục “${cat.name}”?\nLưu ý: Bạn chỉ có thể xóa nếu danh mục này không có sản phẩm nào.`)) return;
        setSaving(true);
        try { 
            await api.deleteCategory(cat.id); 
            setNotice({ text: 'Đã xóa danh mục.' }); 
            await refresh(); 
        }
        catch { setNotice({ error: true, text: 'Không xóa được. Danh mục này có thể đang chứa sản phẩm.' }); }
        finally { setSaving(false); }
    }

    function exportCSV() {
        const cell = value => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"';
        const rows = [['ID', 'Tên sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Đơn vị'], ...filtered.map(p => [p.id, p.name, categoryName(p.categoryId), p.price, p.quantity, p.unit])];
        const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a'); a.href = url; a.download = 'san-pham.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    const productRows = (rows, showPrice) => rows.map(p => <tr key={p.id}>
        <td><div className="adm-product"><span className="adm-thumb">{p.image ? <img src={p.image} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} /> : '✿'}</span><div><strong>{p.name}</strong><small>SP-{p.id} · {categoryName(p.categoryId)}{p.isVisible === false ? ' · Đang ẩn' : ''}</small></div></div></td>
        {showPrice && <td>{money(p.price)}<small>/ {p.unit}</small></td>}<td><strong>{p.quantity}</strong> {p.unit}</td>
        <td><span className={`adm-badge ${p.quantity <= 0 ? 'red stock-out' : p.quantity < 10 ? 'amber stock-low' : ''}`}>{stockLabel(p.quantity)}</span></td>
        <td><div className="adm-actions">
            {canManageProducts ? <>
                <button type="button" className="adm-visibility-toggle" disabled={saving} onClick={() => toggleProductVisibility(p)} aria-label={`${p.isVisible === false ? 'Hiện' : 'Ẩn'} ${p.name}`} title={`${p.isVisible === false ? 'Hiện' : 'Ẩn'} sản phẩm trên cửa hàng`}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p.isVisible === false ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 7 9 7a15.8 15.8 0 0 1-2.2 3.1" /><path d="M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7a10.7 10.7 0 0 0 4-.8" /></> : <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>}</svg></button>
                <button disabled={saving} onClick={() => startForm(p)}>Sửa</button>
                <button disabled={saving} className="adm-danger" onClick={() => deleteProduct(p)}>Xóa</button>
            </> : canManageInventory && <button disabled={saving} onClick={() => setInventoryForm({
                id: p.id,
                name: p.name,
                quantity: String(p.quantity)
            })}>Cập nhật tồn kho</button>}
        </div></td>
    </tr>);
    const table = (rows, showPrice = true) => <div className="adm-table-scroll"><table><thead><tr><th>Sản phẩm</th>{showPrice && <th>Giá bán</th>}<th>Tồn kho</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{productRows(rows, showPrice)}</tbody></table>{!rows.length && <p className="adm-empty">{loading ? 'Đang tải dữ liệu…' : 'Không có sản phẩm phù hợp.'}</p>}</div>;

    return <div className="adm-shell">
        <aside className="adm-sidebar"><div className="adm-brand"><span>✿</span> Vegetable<span className="adm-brand-light">Shop</span></div><p className="adm-eyebrow">KHÔNG GIAN QUẢN TRỊ</p>
            <nav aria-label="Quản trị">{availableTabs.map(([id, icon, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setForm(null); setCatForm(null); setInventoryForm(null); }}><span>{icon}</span>{label}{id === 'inventory' && <b>{lowStock.length}</b>}</button>)}</nav>
            <div className="adm-sidebar-note"><strong>Mỗi ngày một chút xanh.</strong><p>Quản lý sản phẩm và theo dõi cửa hàng của bạn tại đây.</p></div>
        </aside>
        
        <section className="adm-main" aria-busy={loading}><header className="adm-heading"><div><p className="adm-eyebrow">VEGETABLESHOP / QUẢN TRỊ</p><h1>{form ? (form.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm') : inventoryForm ? 'Cập nhật tồn kho' : catForm ? (catForm.id ? 'Chỉnh sửa danh mục' : 'Thêm danh mục') : { overview: 'Tổng quan cửa hàng', products: 'Quản lý sản phẩm', inventory: 'Kiểm tra tồn kho', categories: 'Danh mục sản phẩm', orders: 'Quản lý đơn hàng', employees: 'Quản lý nhân viên' }[tab]}</h1><p>Theo dõi rõ ràng, quản lý dễ dàng.</p></div><div className="adm-heading-actions">{backButton}<button disabled={loading || saving} onClick={refresh}>{loading ? 'Đang tải…' : '↻ Tải lại'}</button></div></header>
        {notice && <div role={notice.error ? 'alert' : 'status'} className={`adm-notice ${notice.error ? 'error' : ''}`}>{notice.text}<button aria-label="Đóng thông báo" onClick={() => setNotice(null)}>×</button></div>}
        
        {/* Form Sản phẩm */}
        {form ? <section className="adm-panel"><div className="adm-panel-head"><h2>Thông tin sản phẩm</h2><button disabled={saving} onClick={() => setForm(null)}>← Quay lại</button></div><form onSubmit={saveProduct} className="adm-form">
            {[['name', 'Tên sản phẩm', 'text'], ['price', 'Giá bán (VNĐ)', 'number'], ['quantity', 'Số lượng tồn kho', 'number'], ['unit', 'Đơn vị', 'text']].map(([key, label, type]) => <label key={key}>{label}<input required type={type} min={type === 'number' ? 0 : undefined} step={key === 'price' ? '0.01' : key === 'quantity' ? '1' : undefined} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}
            <label>Danh mục<select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}><option value="">Chọn danh mục</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label>Hình ảnh sản phẩm
                <input value={form.image || ''} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://… hoặc /images/…" />
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginTop: '8px' }} />
            </label>
            <label className="adm-wide">Mô tả<textarea rows="4" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label><div className="adm-wide adm-actions"><button className="adm-primary" disabled={saving || loading || !categories.length}>{saving ? 'Đang lưu…' : 'Lưu sản phẩm'}</button><button type="button" disabled={saving} onClick={() => setForm(null)}>Hủy</button></div>
        </form></section>
        : inventoryForm ? <section className="adm-panel"><div className="adm-panel-head"><h2>{inventoryForm.name}</h2><button disabled={saving} onClick={() => setInventoryForm(null)}>← Quay lại</button></div><form onSubmit={saveInventory} className="adm-form">
            <label>Số lượng tồn kho<input aria-label="Số lượng tồn kho" required type="number" min="0" step="1" value={inventoryForm.quantity} onChange={event => setInventoryForm({ ...inventoryForm, quantity: event.target.value })} /></label>
            <div className="adm-wide adm-actions"><button className="adm-primary" disabled={saving || loading}>{saving ? 'Đang lưu…' : 'Lưu tồn kho'}</button><button type="button" disabled={saving} onClick={() => setInventoryForm(null)}>Hủy</button></div>
        </form></section>
        : <>
        {tab === 'overview' && <><div className="adm-stats">{[['Giá trị tất cả đơn hàng', money(stats.totalRevenue), 'Theo API hiện tại, gồm mọi trạng thái'], ['Tổng đơn hàng', stats.totalOrders ?? '—', 'Đơn hàng trong hệ thống'], ['Chờ xử lý', stats.pendingOrders ?? '—', 'Cần được xác nhận'], ['Sản phẩm', products.length, `${lowStock.length} sản phẩm tồn kho < 10`]].map(([title, value, detail]) => <article key={title}><span>{title}</span><strong>{loading ? '…' : value}</strong><small>{detail}</small></article>)}</div><div className="adm-welcome"><div><p className="adm-eyebrow">CHĂM CHÚT CỬA HÀNG CỦA BẠN</p><h2>Sản phẩm tươi mới.<br />Vận hành gọn gàng.</h2><p>Thêm sản phẩm, cập nhật giá và kiểm tra lượng hàng sẵn có.</p><button className="adm-primary" disabled={loading} onClick={() => startForm()}>+ Thêm sản phẩm</button></div><span aria-hidden="true">✿</span></div><section className="adm-panel"><div className="adm-panel-head"><div><h2>Cần bổ sung hàng</h2><p>Các sản phẩm có tồn kho dưới 10 đơn vị.</p></div><button onClick={() => setTab('inventory')}>Xem tất cả →</button></div>{table(lowStock.slice(0, 5))}</section></>}
        {tab === 'products' && <section className="adm-panel"><div className="adm-panel-head"><div><h2>Danh sách sản phẩm</h2><p>{filtered.length} kết quả</p></div><div className="adm-actions"><button disabled={loading || !filtered.length} onClick={exportCSV}>↓ Xuất CSV</button><button disabled={loading} className="adm-primary" onClick={() => startForm()}>+ Thêm mới</button></div></div><div className="adm-filters"><input aria-label="Tìm sản phẩm" placeholder="Tìm tên sản phẩm…" value={search} onChange={e => updateFilter(setSearch, e.target.value)} /><select aria-label="Danh mục" value={category} onChange={e => updateFilter(setCategory, e.target.value)}><option value="">Tất cả danh mục</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select aria-label="Sắp xếp" value={sort} onChange={e => updateFilter(setSort, e.target.value)}><option value="newest">Mới nhất</option><option value="price">Giá tăng dần</option><option value="stock">Tồn kho tăng dần</option></select></div>{table(visible)}<div className="adm-pagination"><span>Trang {currentPage} / {pageCount}</span><div className="adm-actions"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>← Trước</button><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Sau →</button></div></div></section>}
        {tab === 'inventory' && <section className="adm-panel"><div className="adm-panel-head"><div><h2>{inventoryProducts.length} sản phẩm trong kho</h2><p>Hiển thị tất cả sản phẩm; nhóm tồn kho thấp (&lt; 10) luôn được ưu tiên lên đầu.</p></div></div><div className="adm-filters adm-inventory-filters">
            <input aria-label="Tìm sản phẩm trong kho" placeholder="Tìm tên sản phẩm…" value={inventorySearch} onChange={e => updateFilter(setInventorySearch, e.target.value)} />
            <select aria-label="Lọc danh mục tồn kho" value={inventoryCategory} onChange={e => updateFilter(setInventoryCategory, e.target.value)}><option value="">Tất cả danh mục</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select aria-label="Lọc trạng thái tồn kho" value={inventoryStock} onChange={e => updateFilter(setInventoryStock, e.target.value)}><option value="">Mọi trạng thái</option><option value="available">Còn hàng (từ 10)</option><option value="low">Sắp hết (1–9)</option><option value="out">Hết hàng</option></select>
            <select aria-label="Sắp xếp tồn kho theo" value={inventorySortBy} onChange={e => updateFilter(setInventorySortBy, e.target.value)}><option value="quantity">Số lượng</option><option value="name">Tên sản phẩm</option><option value="price">Giá bán</option><option value="status">Trạng thái</option></select>
            <select aria-label="Thứ tự sắp xếp tồn kho" value={inventorySortBy === 'status' ? 'asc' : inventorySortDirection} disabled={inventorySortBy === 'status'} onChange={e => updateFilter(setInventorySortDirection, e.target.value)}><option value="asc">{inventorySortBy === 'name' ? 'A → Z' : inventorySortBy === 'status' ? 'Hết hàng → Sắp hết → Còn hàng' : 'Tăng dần'}</option><option value="desc">{inventorySortBy === 'name' ? 'Z → A' : 'Giảm dần'}</option></select>
        </div>{table(inventoryProducts, false)}</section>}
        {tab === 'orders' && <AdminOrders />}
    

        
        {/* Tab Danh Mục */}
        {tab === 'categories' && (
            catForm ? (
                /* Form Danh Mục */
                <section className="adm-panel">
                    <div className="adm-panel-head">
                        <h2>Thông tin danh mục</h2>
                        <button disabled={saving} onClick={() => setCatForm(null)}>← Quay lại</button>
                    </div>
                    <form onSubmit={saveCategory} className="adm-form">
                        <label>Tên danh mục <input required type="text" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} /></label>
                        <label className="adm-wide">Mô tả danh mục <textarea rows="4" value={catForm.description || ''} onChange={e => setCatForm({ ...catForm, description: e.target.value })} /></label>
                        <div className="adm-wide adm-actions">
                            <button className="adm-primary" disabled={saving || loading}>{saving ? 'Đang lưu…' : 'Lưu danh mục'}</button>
                            <button type="button" disabled={saving} onClick={() => setCatForm(null)}>Hủy</button>
                        </div>
                    </form>
                </section>
            ) : (
                /* Danh sách Danh Mục */
                <section>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                        <button disabled={loading} className="adm-primary" onClick={() => startCatForm()}>+ Thêm danh mục</button>
                    </div>
                    <div className="adm-category-grid">
                        {categories.map(c => (
                            <article className="adm-panel" key={c.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <span className="adm-category-icon">◈</span>
                                    <h2>{c.name}</h2>
                                    <p>{c.description || 'Chưa có mô tả.'}</p>
                                    <strong>{products.filter(p => p.categoryId === c.id).length} sản phẩm</strong>
                                </div>
                                <div className="adm-actions" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eaeaea' }}>
                                    <button onClick={() => { setCategory(String(c.id)); setSearch(''); setPage(1); setTab('products'); }}>Xem SP →</button>
                                    <button onClick={() => startCatForm(c)}>Sửa</button>
                                    <button className="adm-danger" onClick={() => deleteCategory(c)}>Xóa</button>
                                </div>
                            </article>
                        ))}
                        {!categories.length && <p>Chưa có dữ liệu danh mục.</p>}
                    </div>
                </section>
            )
        )}
        </>}
        <footer className="adm-footer">VegetableShop · Trang quản trị cửa hàng</footer></section>
    </div>;
}