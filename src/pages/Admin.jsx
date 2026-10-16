import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './Admin.css';
import AdminOrders from './AdminOrders';

const money = value => Number(value || 0).toLocaleString('vi-VN') + ' ₫';
const emptyProduct = { name: '', price: '', quantity: '', unit: 'kg', image: '', description: '', categoryId: '' };
const stockLabel = quantity => quantity <= 0 ? 'Hết hàng' : quantity <= 10 ? 'Sắp hết' : 'Còn hàng';

export default function Admin() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({});
    const [tab, setTab] = useState('overview');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [stock, setStock] = useState('');
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);

    async function refresh() {
        setLoading(true);
        try {
            const [p, c, s] = await Promise.all([api.getProducts(), api.getCategories(), api.getRevenue()]);
            setProducts(p.data); setCategories(c.data); setStats(s.data);
        } catch {
            setNotice({ error: true, text: 'Không tải được dữ liệu. Kiểm tra backend đang chạy tại cổng 7179 rồi bấm Tải lại.' });
        } finally { setLoading(false); }
    }
    useEffect(() => {
        let active = true;
        Promise.all([api.getProducts(), api.getCategories(), api.getRevenue()])
            .then(([p, c, s]) => { if (active) { setProducts(p.data); setCategories(c.data); setStats(s.data); } })
            .catch(() => { if (active) setNotice({ error: true, text: 'Không tải được dữ liệu. Hãy chạy backend và bấm Tải lại.' }); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const lowStock = products.filter(p => p.quantity <= 10);
    const filtered = products.filter(p =>
        (p.name || '').toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')) &&
        (!category || String(p.categoryId) === category) &&
        (!stock || (stock === 'out' ? p.quantity <= 0 : stock === 'low' ? p.quantity > 0 && p.quantity <= 10 : p.quantity > 10))
    ).sort((a, b) => sort === 'price' ? a.price - b.price : sort === 'stock' ? a.quantity - b.quantity : b.id - a.id);
    const pageCount = Math.max(1, Math.ceil(filtered.length / 8));
    const currentPage = Math.min(page, pageCount);
    const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
    const categoryName = id => categories.find(c => c.id === id)?.name || 'Chưa phân loại';
    function updateFilter(setter, value) { setter(value); setPage(1); }
    function startForm(product) {
        setNotice(null);
        setForm(product ? { ...product } : { ...emptyProduct, categoryId: categories[0]?.id || '' });
    }

    // Xử lý chọn file ảnh từ máy tính
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
    async function deleteProduct(product) {
        if (!window.confirm(`Xóa sản phẩm “${product.name}”?`)) return;
        setSaving(true);
        try { await api.deleteProduct(product.id); setNotice({ text: 'Đã xóa sản phẩm.' }); await refresh(); }
        catch { setNotice({ error: true, text: 'Không xóa được. Sản phẩm có thể đã được sử dụng trong đơn hàng.' }); }
        finally { setSaving(false); }
    }
    function exportCSV() {
        // Chặn công thức khi mở dữ liệu bằng Excel.
        const cell = value => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"';
        const rows = [['ID', 'Tên sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Đơn vị'], ...filtered.map(p => [p.id, p.name, categoryName(p.categoryId), p.price, p.quantity, p.unit])];
        const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a'); a.href = url; a.download = 'san-pham.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    const productRows = rows => rows.map(p => <tr key={p.id}>
        <td><div className="adm-product"><span className="adm-thumb">{p.image ? <img src={p.image} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} /> : '✿'}</span><div><strong>{p.name}</strong><small>SP-{p.id} · {categoryName(p.categoryId)}</small></div></div></td>
        <td>{money(p.price)}<small>/ {p.unit}</small></td><td><strong>{p.quantity}</strong> {p.unit}</td>
        <td><span className={`adm-badge ${p.quantity <= 0 ? 'red' : p.quantity <= 10 ? 'amber' : ''}`}>{stockLabel(p.quantity)}</span></td>
        <td><div className="adm-actions"><button disabled={saving} onClick={() => startForm(p)}>Sửa</button><button disabled={saving} className="adm-danger" onClick={() => deleteProduct(p)}>Xóa</button></div></td>
    </tr>);
    const table = rows => <div className="adm-table-scroll"><table><thead><tr><th>Sản phẩm</th><th>Giá bán</th><th>Tồn kho</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{productRows(rows)}</tbody></table>{!rows.length && <p className="adm-empty">{loading ? 'Đang tải dữ liệu…' : 'Không có sản phẩm phù hợp.'}</p>}</div>;

    return <div className="adm-shell">
        <aside className="adm-sidebar"><div className="adm-brand"><span>✿</span> Vegetable<span className="adm-brand-light">Shop</span></div><p className="adm-eyebrow">KHÔNG GIAN QUẢN TRỊ</p>
            <nav aria-label="Quản trị">{[['overview', '◫', 'Tổng quan'], ['products', '▦', 'Sản phẩm'], ['inventory', '▤', 'Kiểm tra tồn kho'], ['categories', '◈', 'Danh mục'],['orders', '▣', 'Đơn hàng'] ].map(([id, icon, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setForm(null); }}><span>{icon}</span>{label}{id === 'inventory' && <b>{lowStock.length}</b>}</button>)}</nav>
            <div className="adm-sidebar-note"><strong>Mỗi ngày một chút xanh.</strong><p>Quản lý sản phẩm và theo dõi cửa hàng của bạn tại đây.</p></div>
        </aside>
        <section className="adm-main" aria-busy={loading}><header className="adm-heading"><div><p className="adm-eyebrow">VEGETABLESHOP / QUẢN TRỊ</p><h1>{form ? form.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm' : { overview: 'Tổng quan cửa hàng', products: 'Quản lý sản phẩm', inventory: 'Kiểm tra tồn kho', categories: 'Danh mục sản phẩm',  orders: 'Quản lý đơn hàng' }[tab]}</h1><p>Theo dõi rõ ràng, quản lý dễ dàng.</p></div><button disabled={loading || saving} onClick={refresh}>{loading ? 'Đang tải…' : '↻ Tải lại'}</button></header>
        {notice && <div role={notice.error ? 'alert' : 'status'} className={`adm-notice ${notice.error ? 'error' : ''}`}>{notice.text}<button aria-label="Đóng thông báo" onClick={() => setNotice(null)}>×</button></div>}
        {form ? <section className="adm-panel"><div className="adm-panel-head"><h2>Thông tin sản phẩm</h2><button disabled={saving} onClick={() => setForm(null)}>← Quay lại</button></div><form onSubmit={saveProduct} className="adm-form">
            {[['name', 'Tên sản phẩm', 'text'], ['price', 'Giá bán (VNĐ)', 'number'], ['quantity', 'Số lượng tồn kho', 'number'], ['unit', 'Đơn vị', 'text']].map(([key, label, type]) => <label key={key}>{label}<input required type={type} min={type === 'number' ? 0 : undefined} step={key === 'price' ? '0.01' : key === 'quantity' ? '1' : undefined} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}
            <label>Danh mục<select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}><option value="">Chọn danh mục</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label>Hình ảnh sản phẩm
                <input value={form.image || ''} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://… hoặc /images/…" />
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginTop: '8px' }} />
            </label>
            <label className="adm-wide">Mô tả<textarea rows="4" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label><div className="adm-wide adm-actions"><button className="adm-primary" disabled={saving || loading || !categories.length}>{saving ? 'Đang lưu…' : 'Lưu sản phẩm'}</button><button type="button" disabled={saving} onClick={() => setForm(null)}>Hủy</button></div>
        </form></section> : <>
        {tab === 'overview' && <><div className="adm-stats">{[['Giá trị tất cả đơn hàng', money(stats.totalRevenue), 'Theo API hiện tại, gồm mọi trạng thái'], ['Tổng đơn hàng', stats.totalOrders ?? '—', 'Đơn hàng trong hệ thống'], ['Chờ xử lý', stats.pendingOrders ?? '—', 'Cần được xác nhận'], ['Sản phẩm', products.length, `${lowStock.length} sản phẩm tồn kho ≤ 10`]].map(([title, value, detail]) => <article key={title}><span>{title}</span><strong>{loading ? '…' : value}</strong><small>{detail}</small></article>)}</div><div className="adm-welcome"><div><p className="adm-eyebrow">CHĂM CHÚT CỬA HÀNG CỦA BẠN</p><h2>Sản phẩm tươi mới.<br />Vận hành gọn gàng.</h2><p>Thêm sản phẩm, cập nhật giá và kiểm tra lượng hàng sẵn có.</p><button className="adm-primary" disabled={loading} onClick={() => startForm()}>+ Thêm sản phẩm</button></div><span aria-hidden="true">✿</span></div><section className="adm-panel"><div className="adm-panel-head"><div><h2>Cần bổ sung hàng</h2><p>Các sản phẩm có tồn kho từ 10 trở xuống.</p></div><button onClick={() => setTab('inventory')}>Xem tất cả →</button></div>{table(lowStock.slice(0, 5))}</section></>}
        {tab === 'products' && <section className="adm-panel"><div className="adm-panel-head"><div><h2>Danh sách sản phẩm</h2><p>{filtered.length} kết quả</p></div><div className="adm-actions"><button disabled={loading || !filtered.length} onClick={exportCSV}>↓ Xuất CSV</button><button disabled={loading} className="adm-primary" onClick={() => startForm()}>+ Thêm mới</button></div></div><div className="adm-filters"><input aria-label="Tìm sản phẩm" placeholder="Tìm tên sản phẩm…" value={search} onChange={e => updateFilter(setSearch, e.target.value)} /><select aria-label="Danh mục" value={category} onChange={e => updateFilter(setCategory, e.target.value)}><option value="">Tất cả danh mục</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select aria-label="Tồn kho" value={stock} onChange={e => updateFilter(setStock, e.target.value)}><option value="">Mọi tồn kho</option><option value="out">Hết hàng</option><option value="low">Sắp hết (1–10)</option><option value="available">Còn nhiều (&gt;10)</option></select><select aria-label="Sắp xếp" value={sort} onChange={e => updateFilter(setSort, e.target.value)}><option value="newest">Mới nhất</option><option value="price">Giá tăng dần</option><option value="stock">Tồn kho tăng dần</option></select></div>{table(visible)}<div className="adm-pagination"><span>Trang {currentPage} / {pageCount}</span><div className="adm-actions"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>← Trước</button><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Sau →</button></div></div></section>}
        {tab === 'inventory' && <section className="adm-panel"><div className="adm-panel-head"><div><h2>{lowStock.length} sản phẩm cần chú ý</h2><p>Ngưỡng cảnh báo: tồn kho ≤ 10 đơn vị. Bấm Sửa để cập nhật số lượng.</p></div></div>{table([...lowStock].sort((a, b) => a.quantity - b.quantity))}</section>}
        {tab === 'orders' && <AdminOrders />}
        {tab === 'categories' && <div className="adm-category-grid">{categories.map(c => <article className="adm-panel" key={c.id}><span className="adm-category-icon">◈</span><h2>{c.name}</h2><p>{c.description || 'Danh mục sản phẩm của cửa hàng.'}</p><strong>{products.filter(p => p.categoryId === c.id).length} sản phẩm</strong><button onClick={() => { setCategory(String(c.id)); setSearch(''); setStock(''); setPage(1); setTab('products'); }}>Xem sản phẩm →</button></article>)}{!categories.length && <p>Chưa có dữ liệu danh mục.</p>}</div>}
        </>}
        <footer className="adm-footer">VegetableShop · Trang quản trị cửa hàng</footer></section>
    </div>;
}