import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../services/chatService";

export default function ChatWidget({ onAddToCart, onAddMultipleToCart }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "🥬 Xin chào! Mình là VegetableShop AI.\n\nMình có thể giúp bạn tư vấn món ăn, lựa chọn rau củ và hướng dẫn bảo quản thực phẩm. Bạn cần mình hỗ trợ gì?",
    },
  ]);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && chatScrollRef.current) {
      const el = chatScrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  async function handleSend(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const result = await sendChatMessage(question);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: result.reply ?? "Mình chưa có câu trả lời.",
          products: Array.isArray(result.products) ? result.products : [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ " + (error.message || "Không thể kết nối AI.") },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 9999,
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {isOpen && (
        <section
          aria-label="VegetableShop AI"
          style={{
            width: "min(380px, calc(100vw - 40px))",
            height: "min(520px, calc(100vh - 60px))",
            background: "white",
            borderRadius: 18,
            boxShadow: "0 8px 35px rgba(0,0,0,0.22)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            color: "#222",
          }}
        >
          {/* Thanh tiêu đề */}
          <div
            style={{
              background: "linear-gradient(135deg, #15803d, #22c55e)",
              color: "white",
              padding: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: "bold" }}>
                🥬 VegetableShop AI
              </div>
              <div style={{ fontSize: 12, marginTop: 5 }}>
                ● Trợ lý mua sắm thông minh
              </div>
            </div>
            <button
              type="button"
              aria-label="Đóng chatbot"
              onClick={() => setIsOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "white",
                fontSize: 23,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          {/* Nội dung hội thoại */}
          <div
            ref={chatScrollRef}
            aria-live="polite"
            style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 15, background: "#f7faf7" }}
          >
            {messages.map((msg, index) => {
              const availableProducts = (msg.products ?? []).filter((p) =>
                Number(p.stockQuantity) > 0 &&
                Number.isFinite(Number(p.price)) &&
                Number(p.price) >= 0
              );
              const estimatedTotal = availableProducts.reduce(
                (sum, p) => sum + Number(p.price), 0
              );

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      maxWidth: msg.products?.length ? "100%" : "85%",
                      padding: 12,
                      borderRadius: 14,
                      fontSize: 14,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      background: msg.role === "user" ? "#16a34a" : "#fff",
                      color: msg.role === "user" ? "#fff" : "#222",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.06)",
                    }}
                  >
                    {msg.text}

                    {msg.products?.length > 0 && (
                      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                        {/* Danh sách thẻ sản phẩm */}
                        {msg.products.map((product) => {
                          const inStock = Number(product.stockQuantity) > 0;
                          return (
                            <div
                              key={product.id}
                              style={{
                                background: "#fff",
                                border: "1px solid #d1fae5",
                                borderRadius: 12,
                                padding: 10,
                                color: "#222",
                              }}
                            >
                              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                {product.image && (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    style={{
                                      width: 65,
                                      height: 65,
                                      objectFit: "cover",
                                      borderRadius: 8,
                                    }}
                                  />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: "bold", overflowWrap: "anywhere" }}>
                                    {product.name}
                                  </div>
                                  <div style={{ color: "#15803d", fontWeight: "bold", marginTop: 4 }}>
                                    {Number(product.price).toLocaleString("vi-VN")}đ / {product.unit}
                                  </div>
                                  <small style={{ color: "#666" }}>
                                    {inStock
                                      ? `Còn ${product.stockQuantity} ${product.unit}`
                                      : "Hết hàng"}
                                  </small>
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={!inStock || !onAddToCart}
                                onClick={() => onAddToCart?.({ ...product, quantity: 1 })}
                                style={{
                                  width: "100%",
                                  marginTop: 10,
                                  padding: 10,
                                  background: inStock ? "#16a34a" : "#9ca3af",
                                  color: "white",
                                  border: "none",
                                  borderRadius: 8,
                                  fontWeight: "bold",
                                  cursor: inStock ? "pointer" : "not-allowed",
                                }}
                              >
                                {inStock ? "🛒 Thêm vào giỏ hàng" : "Hết hàng"}
                              </button>
                            </div>
                          );
                        })}

                        {/* Thêm nhiều sản phẩm - mỗi loại 1 đơn vị */}
                        {msg.products.length > 1 && (
                          <div
                            style={{
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              borderRadius: 12,
                              padding: 12,
                              color: "#222",
                            }}
                          >
                            <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                              🥬 Giỏ hàng AI đề xuất
                            </div>
                            <div style={{ fontSize: 13, marginBottom: 8 }}>
                              Sản phẩm còn hàng: {availableProducts.length}/{msg.products.length}
                            </div>
                            <div style={{ fontSize: 15, color: "#15803d", fontWeight: "bold", marginBottom: 10 }}>
                              Tổng tạm tính (mỗi loại 1 đơn vị): {estimatedTotal.toLocaleString("vi-VN")}đ
                            </div>
                            <button
                              type="button"
                              disabled={!onAddMultipleToCart || availableProducts.length === 0}
                              onClick={() => onAddMultipleToCart?.(availableProducts)}
                              style={{
                                width: "100%",
                                background: availableProducts.length ? "#15803d" : "#9ca3af",
                                color: "#fff",
                                border: "none",
                                borderRadius: 10,
                                padding: 12,
                                fontSize: 13,
                                fontWeight: "bold",
                                cursor: availableProducts.length ? "pointer" : "not-allowed",
                              }}
                            >
                              🛒 Thêm các sản phẩm còn hàng vào giỏ
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div style={{ color: "#16a34a", fontSize: 13, padding: 10 }}>
                🤖 Gemini đang trả lời...
              </div>
            )}
          </div>

          {/* Ô nhập tin nhắn */}
          <form
            onSubmit={handleSend}
            style={{ display: "flex", padding: 12, gap: 8, borderTop: "1px solid #eee", background: "#fff" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về rau củ, món ăn..."
              maxLength={1500}
              style={{
                flex: 1,
                minWidth: 0,
                padding: 11,
                borderRadius: 10,
                border: "1px solid #ddd",
                outlineColor: "#16a34a",
                color: "#222",
                background: "#fff",
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 15px",
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Gửi
            </button>
          </form>
        </section>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Mở chatbot VegetableShop AI"
          style={{
            background: "linear-gradient(135deg, #15803d, #22c55e)",
            color: "white",
            border: "none",
            borderRadius: 30,
            padding: "15px 22px",
            fontSize: 15,
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 5px 20px rgba(22,163,74,0.35)",
          }}
        >
          💬 Chat với AI
        </button>
      )}
    </div>
  );
}
