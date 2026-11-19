import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import './NewOrderNotifier.css';

const money = value => Number(value || 0).toLocaleString('vi-VN') + ' ₫';

// Phát tiếng chuông "Ting - Ting" bằng Web Audio API (không cần file mp3)
function playOrderBellSound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const notes = [
            { freq: 880, start: 0, duration: 0.22 },
            { freq: 1174.66, start: 0.18, duration: 0.4 }
        ];

        notes.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, now + note.start);

            gain.gain.setValueAtTime(0.001, now + note.start);
            gain.gain.exponentialRampToValueAtTime(0.28, now + note.start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + note.start);
            osc.stop(now + note.start + note.duration);
        });
    } catch {
        // Bỏ qua nếu trình duyệt chưa mở khóa âm thanh
    }
}

export default function NewOrderNotifier({
    enabled = true,
    onPendingCountChange,
    onNewOrderArrived,
    onOpenOrdersTab
}) {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [incomingOrder, setIncomingOrder] = useState(null);
    const [imgError, setImgError] = useState(false);

    const isInitializedRef = useRef(false);
    const lastOrderIdRef = useRef(0);
    const lastPendingCountRef = useRef(0);
    const soundEnabledRef = useRef(soundEnabled);

    useEffect(() => {
        soundEnabledRef.current = soundEnabled;
    }, [soundEnabled]);

    useEffect(() => {
        if (!enabled) return undefined;

        let active = true;

        async function checkNewOrders() {
            if (document.hidden) return;
            try {
                const { data } = await api.getPendingOrdersSummary();
                if (!active || !data) return;

                const pendingCount = Number(data.pendingCount || 0);
                const latestOrderId = Number(data.latestOrderId || 0);

                if (onPendingCountChange) {
                    onPendingCountChange(pendingCount);
                }

                // Lần tải đầu tiên: chỉ lưu mốc đơn hiện có, không kêu chuông đơn cũ
                if (!isInitializedRef.current) {
                    isInitializedRef.current = true;
                    lastOrderIdRef.current = latestOrderId;
                    lastPendingCountRef.current = pendingCount;
                    return;
                }

                const hasNewerOrder = latestOrderId > lastOrderIdRef.current;
                const hasMorePending = pendingCount > lastPendingCountRef.current;

                if (hasNewerOrder || hasMorePending) {
                    if (soundEnabledRef.current) {
                        playOrderBellSound();
                    }

                    if (data.latestOrder) {
                        setImgError(false);
                        setIncomingOrder(data.latestOrder);
                    }

                    if (onNewOrderArrived) {
                        onNewOrderArrived(data.latestOrder);
                    }
                }

                lastOrderIdRef.current = Math.max(lastOrderIdRef.current, latestOrderId);
                lastPendingCountRef.current = pendingCount;
            } catch {
                // Giữ im lặng nếu mất kết nối tạm thời
            }
        }

        checkNewOrders();
        const intervalId = setInterval(checkNewOrders, 10000);

        return () => {
            active = false;
            clearInterval(intervalId);
        };
    }, [enabled]);

    if (!enabled) return null;

    function handleToggleSound() {
        const next = !soundEnabled;
        setSoundEnabled(next);
        if (next) {
            playOrderBellSound();
        }
    }

    const showProductImg = Boolean(incomingOrder?.productImage) && !imgError;

    return (
        <>
            <button
                type="button"
                className={`non-bell-btn ${soundEnabled ? 'is-on' : 'is-off'}`}
                onClick={handleToggleSound}
                title={soundEnabled ? 'Đang bật chuông báo đơn mới (Bấm để tắt)' : 'Đang tắt chuông (Bấm để bật)'}
            >
                <span className="non-bell-icon">{soundEnabled ? '🔔' : '🔕'}</span>
                <span>{soundEnabled ? 'Chuông đơn: Bật' : 'Chuông đơn: Tắt'}</span>
            </button>

            {incomingOrder && (
                <div className="non-toast" role="alert" aria-live="assertive">
                    <div className="non-toast-icon">
                        {showProductImg ? (
                            <img
                                src={incomingOrder.productImage}
                                alt={incomingOrder.productName || 'Sản phẩm mới đặt'}
                                className="non-toast-product-img"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            '🛒'
                        )}
                        {incomingOrder.itemCount > 1 && (
                            <span className="non-toast-more-badge">
                                +{incomingOrder.itemCount - 1}
                            </span>
                        )}
                    </div>
                    <div className="non-toast-body">
                        <span className="non-toast-badge">ĐƠN HÀNG MỚI #{incomingOrder.id}</span>
                        <strong>{incomingOrder.customerName || 'Khách vừa đặt đơn mới!'}</strong>
                        {incomingOrder.productName && (
                            <span className="non-toast-product-name">
                                {incomingOrder.productName}
                                {incomingOrder.variantName ? ` (${incomingOrder.variantName})` : ''}
                                {incomingOrder.itemCount > 1 ? ` và ${incomingOrder.itemCount - 1} món khác` : ''}
                            </span>
                        )}
                        <p>
                            Tổng thanh toán: <b>{money(incomingOrder.totalPrice)}</b> — Cần xác nhận & sơ chế ngay.
                        </p>
                        <div className="non-toast-actions">
                            <button
                                type="button"
                                className="non-btn-primary"
                                onClick={() => {
                                    setIncomingOrder(null);
                                    if (onOpenOrdersTab) onOpenOrdersTab();
                                }}
                            >
                                Xem & Xử lý đơn →
                            </button>
                            <button
                                type="button"
                                className="non-btn-close"
                                onClick={() => setIncomingOrder(null)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}