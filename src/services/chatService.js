
const API_URL = import.meta.env.VITE_API_URL;

export async function sendChatMessage(message) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Không thể kết nối Gemini AI"
    );
  }

  return {
    reply: data.reply,
    products: Array.isArray(data.products)
      ? data.products
      : []
  };
}
