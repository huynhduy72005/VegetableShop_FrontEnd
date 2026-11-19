import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import './AnalyticsDashboard.css';

const money = value => Number(value || 0).toLocaleString('vi-VN') + ' ₫';

const compactMoney = value => {
    const num = Number(value || 0);
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' tr';
    if (num >= 1_000) return Math.round(num / 1_000) + 'k';
    return String(num);
};

const toDateInput = dateObj => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getOffsetDateInput = daysAgo => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return toDateInput(d);
};

export default function AnalyticsDashboard() {
    const currentYear = new Date().getFullYear();
    const [mode, setMode] = useState('day'); // 'day' | 'month'
    const [presetDays, setPresetDays] = useState(14); // 7 | 14 | 30 | 0 (custom)
    const [fromDate, setFromDate] = useState(() => getOffsetDateInput(13));
    const [toDate, setToDate] = useState(() => toDateInput(new Date()));
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const [revenueData, setRevenueData] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [categoryShare, setCategoryShare] = useState([]);
    const [ratesData, setRatesData] = useState(null);

    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Cập nhật khoảng ngày khi bấm nút preset (7 / 14 / 30 ngày)
    function applyDayPreset(days) {
        setMode('day');
        setPresetDays(days);
        setToDate(toDateInput(new Date()));
        setFromDate(getOffsetDateInput(days - 1));
    }

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');

        const revenueParams = mode === 'month'
            ? { mode: 'month', year: selectedYear }
            : { mode: 'day', fromDate, toDate };

        const subRangeParams = mode === 'month'
            ? { fromDate: `${selectedYear}-01-01`, toDate: `${selectedYear}-12-31` }
            : { fromDate, toDate };

        Promise.all([
            api.getAnalyticsRevenue(revenueParams),
            api.getAnalyticsTopProducts({ top: 5, ...subRangeParams }),
            api.getAnalyticsCategoryShare(subRangeParams),
            api.getAnalyticsRates(subRangeParams)
        ])
            .then(([revRes, topRes, catRes, rateRes]) => {
                if (!active) return;
                setRevenueData(revRes.data || null);
                setTopProducts(Array.isArray(topRes.data) ? topRes.data : []);
                setCategoryShare(Array.isArray(catRes.data) ? catRes.data : []);
                setRatesData(rateRes.data || null);
            })
            .catch(err => {
                if (!active) return;
                setError(
                    err.response?.data?.message ||
                    'Không tải được dữ liệu báo cáo thống kê. Hãy kiểm tra Backend đã chạy chưa.'
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [mode, fromDate, toDate, selectedYear]);

    const points = revenueData?.points || [];
    const maxRevenue = useMemo(() => {
        const peak = Math.max(...points.map(p => Number(p.revenue || 0)), 0);
        return peak > 0 ? peak : 1;
    }, [points]);

    function handleExportReportCsv() {
        if (!points.length) return;
        const cell = v => '"' + String(v ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"';

        const header = [
            mode === 'month' ? 'Tháng' : 'Ngày',
            'Doanh thu thực tế (VNĐ)',
            'Doanh thu đã hoàn thành (VNĐ)',
            'Tổng số đơn',
            'Đơn hoàn thành',
            'Đơn đã hủy'
        ];

        const rows = [
            header,
            ...points.map(p => [
                p.fullDate,
                p.revenue,
                p.completedRevenue,
                p.totalOrders,
                p.completedOrders,
                p.cancelledOrders
            ]),
            [],
            ['TỔNG KẾT KỲ BÁO CÁO', revenueData?.totalNetRevenue ?? 0, revenueData?.completedRevenue ?? 0, revenueData?.totalOrders ?? 0, revenueData?.completedOrders ?? 0, revenueData?.cancelledOrders ?? 0],
            ['Tỷ lệ hủy đơn (%)', ratesData?.cancellationRate ?? 0],
            ['Tỷ lệ hao hụt rau củ (%)', ratesData?.spoilageRate ?? 0],
            ['Thiệt hại hao hụt ước tính (VNĐ)', ratesData?.estimatedLossValue ?? 0]
        ];

        const csvContent = '\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = mode === 'month'
            ? `bao-cao-doanh-thu-nam-${selectedYear}.csv`
            : `bao-cao-doanh-thu-${fromDate}-den-${toDate}.csv`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

    return (
        <section className="anl-wrap" aria-label="Báo cáo và thống kê nâng cao">
            {/* Thanh điều khiển thời gian & chế độ xem */}
            <div className="anl-toolbar">
                <div className="anl-toolbar-left">
                    <div className="anl-mode-switch" role="group" aria-label="Chế độ thống kê">
                        <button
                            type="button"
                            className={mode === 'day' ? 'active' : ''}
                            onClick={() => setMode('day')}
                        >
                            Theo ngày
                        </button>
                        <button
                            type="button"
                            className={mode === 'month' ? 'active' : ''}
                            onClick={() => setMode('month')}
                        >
                            Theo tháng
                        </button>
                    </div>

                    {mode === 'day' ? (
                        <div className="anl-date-controls">
                            <div className="anl-presets">
                                {[7, 14, 30].map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        className={presetDays === d ? 'active' : ''}
                                        onClick={() => applyDayPreset(d)}
                                    >
                                        {d} ngày
                                    </button>
                                ))}
                            </div>
                            <div className="anl-date-range">
                                <input
                                    type="date"
                                    aria-label="Từ ngày"
                                    value={fromDate}
                                    max={toDate}
                                    onChange={e => {
                                        setPresetDays(0);
                                        setFromDate(e.target.value);
                                    }}
                                />
                                <span>→</span>
                                <input
                                    type="date"
                                    aria-label="Đến ngày"
                                    value={toDate}
                                    min={fromDate}
                                    onChange={e => {
                                        setPresetDays(0);
                                        setToDate(e.target.value);
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="anl-date-controls">
                            <label className="anl-year-select">
                                <span>Năm báo cáo:</span>
                                <select
                                    value={selectedYear}
                                    onChange={e => setSelectedYear(Number(e.target.value))}
                                >
                                    {yearOptions.map(y => (
                                        <option key={y} value={y}>Năm {y}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className="anl-export-btn"
                    disabled={loading || !points.length}
                    onClick={handleExportReportCsv}
                >
                    ↓ Xuất báo cáo CSV
                </button>
            </div>

            {error && <div className="anl-error" role="alert">{error}</div>}

            {/* 4 Chỉ số KPI của kỳ đang lọc */}
            <div className="anl-kpi-grid">
                <article className="anl-kpi-card">
                    <span>Doanh thu thực tế trong kỳ</span>
                    <strong>{loading ? '…' : money(revenueData?.totalNetRevenue)}</strong>
                    <small>Đã giao thành công: {money(revenueData?.completedRevenue)}</small>
                </article>
                <article className="anl-kpi-card">
                    <span>Giá trị trung bình / đơn</span>
                    <strong>{loading ? '…' : money(revenueData?.averageOrderValue)}</strong>
                    <small>{(revenueData?.totalOrders ?? 0) - (revenueData?.cancelledOrders ?? 0)} đơn hợp lệ</small>
                </article>
                <article className="anl-kpi-card">
                    <span>Tỷ lệ hủy đơn</span>
                    <strong className={(ratesData?.cancellationRate ?? 0) > 15 ? 'text-danger' : 'text-green'}>
                        {loading ? '…' : `${ratesData?.cancellationRate ?? 0}%`}
                    </strong>
                    <small>{ratesData?.cancelledOrders ?? 0} hủy / {ratesData?.totalOrders ?? 0} tổng đơn</small>
                </article>
                <article className="anl-kpi-card">
                    <span>Tỷ lệ hao hụt rau củ</span>
                    <strong className={(ratesData?.spoilageRate ?? 0) > 10 ? 'text-amber' : 'text-green'}>
                        {loading ? '…' : `${ratesData?.spoilageRate ?? 0}%`}
                    </strong>
                    <small>
                        Hủy {ratesData?.totalDisposedUnits ?? 0} đv · Thiệt hại ~{compactMoney(ratesData?.estimatedLossValue)} ₫
                    </small>
                </article>
            </div>

            {/* Biểu đồ cột Doanh thu theo ngày / tháng */}
            <div className="anl-panel anl-chart-panel">
                <div className="anl-panel-head">
                    <div>
                        <h2>
                            {mode === 'month'
                                ? `Biểu đồ doanh thu 12 tháng — Năm ${selectedYear}`
                                : `Biểu đồ doanh thu theo ngày (${points.length} ngày)`}
                        </h2>
                        <p>Di chuột vào từng cột để xem chi tiết doanh thu thực, doanh thu hoàn thành và số lượng đơn.</p>
                    </div>
                    <div className="anl-legend">
                        <span><i className="dot-net" /> Doanh thu thực (chưa gồm đơn hủy)</span>
                        <span><i className="dot-completed" /> Đã giao thành công</span>
                    </div>
                </div>

                {loading ? (
                    <div className="anl-loading">Đang tổng hợp biểu đồ doanh thu…</div>
                ) : points.length === 0 ? (
                    <div className="anl-loading">Không có dữ liệu trong khoảng thời gian đã chọn.</div>
                ) : (
                    <div className="anl-chart-scroll">
                        <div
                            className="anl-chart-canvas"
                            style={{ minWidth: points.length > 16 ? `${points.length * 46}px` : '100%' }}
                        >
                            {points.map((point, idx) => {
                                const netPct = Math.round((Number(point.revenue || 0) / maxRevenue) * 100);
                                const compPct = Math.round((Number(point.completedRevenue || 0) / maxRevenue) * 100);
                                const isHovered = hoveredIndex === idx;

                                return (
                                    <div
                                        key={point.key}
                                        className={`anl-bar-col ${isHovered ? 'hovered' : ''}`}
                                        onMouseEnter={() => setHoveredIndex(idx)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    >
                                        {isHovered && (
                                            <div className="anl-tooltip" role="tooltip">
                                                <strong>{point.fullDate}</strong>
                                                <div>Doanh thu thực: <b>{money(point.revenue)}</b></div>
                                                <div>Đã hoàn thành: <b>{money(point.completedRevenue)}</b></div>
                                                <div>
                                                    Đơn hàng: <b>{point.totalOrders}</b> ({point.completedOrders} xong, {point.cancelledOrders} hủy)
                                                </div>
                                            </div>
                                        )}

                                        <span className="anl-bar-top-val">
                                            {point.revenue > 0 ? compactMoney(point.revenue) : ''}
                                        </span>

                                        <div className="anl-bar-track">
                                            <div
                                                className="anl-bar-fill net"
                                                style={{ height: `${point.revenue > 0 ? Math.max(netPct, 4) : 0}%` }}
                                            >
                                                <div
                                                    className="anl-bar-fill completed"
                                                    style={{
                                                        height: point.revenue > 0
                                                            ? `${Math.min(100, Math.round((compPct / Math.max(netPct, 1)) * 100))}%`
                                                            : '0%'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <span className="anl-bar-label">{point.label}</span>
                                        <small className="anl-bar-orders">{point.totalOrders} đơn</small>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Lưới 2 cột: Top sản phẩm bán chạy & Phân tích tỷ lệ đơn / hao hụt rau củ */}
            <div className="anl-bottom-grid">
                {/* Cột trái: Top sản phẩm bán chạy + Tỷ trọng danh mục */}
                <div className="anl-panel">
                    <div className="anl-panel-head">
                        <div>
                            <h2>Top sản phẩm bán chạy</h2>
                            <p>Xếp hạng theo sản lượng bán ra (không tính đơn đã hủy).</p>
                        </div>
                    </div>

                    {loading ? (
                        <p className="anl-empty">Đang tải dữ liệu…</p>
                    ) : topProducts.length === 0 ? (
                        <p className="anl-empty">Chưa có đơn hàng phát sinh trong kỳ này.</p>
                    ) : (
                        <div className="anl-top-list">
                            {topProducts.map((item, idx) => (
                                <div key={item.productId} className="anl-top-item">
                                    <span className={`anl-rank rank-${idx + 1}`}>#{idx + 1}</span>
                                    <span className="anl-prod-thumb">
                                        {item.image ? <img src={item.image} alt="" /> : '🥬'}
                                    </span>
                                    <div className="anl-prod-meta">
                                        <strong>{item.productName}</strong>
                                        <small>{item.categoryName} · {item.orderCount} đơn · Tồn: {item.currentStock} {item.unit}</small>
                                    </div>
                                    <div className="anl-prod-sales">
                                        <strong>{item.totalQuantitySold} {item.unit}</strong>
                                        <small>{money(item.totalRevenue)}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tỷ trọng danh mục */}
                    {categoryShare.length > 0 && (
                        <div className="anl-cat-share">
                            <h3>Tỷ trọng doanh thu theo danh mục</h3>
                            <div className="anl-cat-bars">
                                {categoryShare.map(cat => (
                                    <div key={cat.categoryId} className="anl-cat-row">
                                        <div className="anl-cat-info">
                                            <span>{cat.categoryName}</span>
                                            <span>
                                                <b>{cat.percentage}%</b> ({money(cat.totalRevenue)})
                                            </span>
                                        </div>
                                        <div className="anl-progress-bg">
                                            <div
                                                className="anl-progress-fill"
                                                style={{ width: `${Math.min(100, cat.percentage)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cột phải: Tỷ lệ hủy đơn & Hao hụt / hư hỏng đặc thù rau củ */}
                <div className="anl-panel">
                    <div className="anl-panel-head">
                        <div>
                            <h2>Tỷ lệ đơn hàng & Hao hụt rau củ</h2>
                            <p>Theo dõi chất lượng giao đơn và thất thoát nông sản quá hạn/dập nát.</p>
                        </div>
                    </div>

                    {loading || !ratesData ? (
                        <p className="anl-empty">Đang phân tích tỷ lệ vận hành…</p>
                    ) : (
                        <div className="anl-rates-body">
                            {/* 1. Thanh tỷ lệ trạng thái đơn hàng */}
                            <div className="anl-rate-box">
                                <div className="anl-rate-title">
                                    <strong>Cơ cấu xử lý đơn hàng ({ratesData.totalOrders} đơn)</strong>
                                    <span className="anl-rate-pill green">Hoàn thành: {ratesData.completionRate}%</span>
                                </div>

                                <div className="anl-stacked-bar" aria-label="Tỷ lệ trạng thái đơn hàng">
                                    {ratesData.totalOrders > 0 ? (
                                        <>
                                            <div
                                                className="seg-completed"
                                                style={{ width: `${(ratesData.completedOrders / ratesData.totalOrders) * 100}%` }}
                                                title={`Hoàn thành: ${ratesData.completedOrders}`}
                                            />
                                            <div
                                                className="seg-active"
                                                style={{
                                                    width: `${((ratesData.pendingOrders + ratesData.processingOrders + ratesData.shippingOrders) / ratesData.totalOrders) * 100}%`
                                                }}
                                                title={`Đang xử lý/giao: ${ratesData.pendingOrders + ratesData.processingOrders + ratesData.shippingOrders}`}
                                            />
                                            <div
                                                className="seg-cancelled"
                                                style={{ width: `${(ratesData.cancelledOrders / ratesData.totalOrders) * 100}%` }}
                                                title={`Đã hủy: ${ratesData.cancelledOrders}`}
                                            />
                                        </>
                                    ) : (
                                        <div className="seg-empty" style={{ width: '100%' }} />
                                    )}
                                </div>

                                <div className="anl-rate-stats-row">
                                    <span><i className="dot-completed" /> Hoàn thành: <b>{ratesData.completedOrders}</b></span>
                                    <span>
                                        <i className="dot-processing" /> Đang xử lý/giao:{' '}
                                        <b>{ratesData.pendingOrders + ratesData.processingOrders + ratesData.shippingOrders}</b>
                                    </span>
                                    <span>
                                        <i className="dot-cancelled" /> Hủy đơn:{' '}
                                        <b className="text-danger">{ratesData.cancelledOrders} ({ratesData.cancellationRate}%)</b>
                                    </span>
                                </div>
                            </div>

                            {/* 2. Thống kê hao hụt rau củ */}
                            <div className="anl-rate-box spoilage">
                                <div className="anl-rate-title">
                                    <strong>Hao hụt & Xuất hủy nông sản</strong>
                                    <span className={`anl-rate-pill ${ratesData.spoilageRate > 10 ? 'red' : 'amber'}`}>
                                        Tỷ lệ hao hụt: {ratesData.spoilageRate}%
                                    </span>
                                </div>

                                <div className="anl-spoilage-metrics">
                                    <div>
                                        <small>Đã bán ra</small>
                                        <strong>{ratesData.totalSoldUnits} đv</strong>
                                    </div>
                                    <div>
                                        <small>Đã xuất hủy</small>
                                        <strong className="text-danger">{ratesData.totalDisposedUnits} đv</strong>
                                    </div>
                                    <div>
                                        <small>Thiệt hại ước tính</small>
                                        <strong className="text-danger">{money(ratesData.estimatedLossValue)}</strong>
                                    </div>
                                </div>

                                {ratesData.reasonBreakdown?.length > 0 && (
                                    <div className="anl-reason-tags">
                                        {ratesData.reasonBreakdown.map(r => (
                                            <span key={r.reason} className="anl-reason-chip">
                                                {r.reason}: <b>{r.totalQuantity} đv</b> ({r.count} lần)
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {ratesData.topSpoiledProducts?.length > 0 ? (
                                    <div className="anl-spoiled-list">
                                        <small className="anl-subhead">Sản phẩm xuất hủy nhiều nhất trong kỳ:</small>
                                        {ratesData.topSpoiledProducts.map(sp => (
                                            <div key={sp.productId} className="anl-spoiled-row">
                                                <div>
                                                    <strong>{sp.productName}</strong>
                                                    <small>Lý do gần nhất: {sp.lastReason}</small>
                                                </div>
                                                <div className="anl-spoiled-val">
                                                    <strong className="text-danger">-{sp.disposedQuantity} {sp.unit}</strong>
                                                    <small>{money(sp.estimatedLoss)}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="anl-good-note">
                                        ✓ Không ghi nhận rau củ hư hỏng phải xuất hủy trong khoảng thời gian này.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}