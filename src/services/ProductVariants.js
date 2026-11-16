// Hàm dùng chung cho sản phẩm có biến thể (ví dụ: Cà chua → 500g / 1kg / Khay 3kg)
// Mỗi biến thể: { id, name, unit, price, quantity, image, isDefault, isVisible }

export const getAllVariants = product =>
    Array.isArray(product?.variants) ? product.variants : [];

// Khách chỉ thấy các biến thể đang bán (isVisible !== false)
export const getVariants = product =>
    getAllVariants(product).filter(variant => variant.isVisible !== false);

export const hasVariants = product => getVariants(product).length > 0;

// Giá thấp nhất (hiện "Từ ... đ")
export const getMinPrice = product => {
    const variants = getVariants(product);
    if (variants.length === 0) return Number(product?.price) || 0;
    return Math.min(...variants.map(v => Number(v.price) || 0));
};

// Tổng tồn kho của sản phẩm (chỉ tính biến thể đang bán)
export const getTotalStock = product => {
    const variants = getVariants(product);
    if (variants.length === 0) {
        // Có biến thể nhưng tất cả đang ẩn → không bán được
        if (getAllVariants(product).length > 0) return 0;
        return Math.max(0, Number(product?.stockQuantity ?? product?.quantity) || 0);
    }
    return variants.reduce((sum, v) => sum + Math.max(0, Number(v.quantity) || 0), 0);
};

// Biến thể chọn sẵn: loại mặc định còn hàng → loại còn hàng đầu tiên → loại mặc định → loại đầu tiên
export const getDefaultVariant = product => {
    const variants = getVariants(product);
    return (
        variants.find(v => v.isDefault && Number(v.quantity) > 0) ||
        variants.find(v => Number(v.quantity) > 0) ||
        variants.find(v => v.isDefault) ||
        variants[0] ||
        null
    );
};

// Khóa duy nhất của một dòng giỏ hàng: sản phẩm + biến thể
export const cartKeyOf = (productId, variantId) => `${productId}:${variantId ?? 0}`;

export const cartKeyOfItem = item => item.cartKey ?? cartKeyOf(item.id, item.variantId);

// Tạo dòng giỏ hàng từ sản phẩm + biến thể đã chọn
export const buildCartLine = (product, variant, quantity = 1) => {
    if (!variant) {
        return {
            ...product,
            variantId: null,
            variantName: null,
            cartKey: cartKeyOf(product.id, null),
            stockQuantity: getTotalStock(product),
            quantity
        };
    }
    return {
        ...product,
        variantId: variant.id,
        variantName: variant.name,
        cartKey: cartKeyOf(product.id, variant.id),
        price: Number(variant.price) || 0,
        unit: variant.unit || product.unit,
        image: variant.image || product.image,
        stockQuantity: Math.max(0, Number(variant.quantity) || 0),
        quantity
    };
};

// Dùng trong form admin: giá thấp nhất / tổng tồn kho (chỉ tính biến thể đang bán), giống cách server tính
export const summarizeVariants = variants => {
    const rows = (variants || []).map(v => ({
        price: Number(v.price),
        quantity: Number(v.quantity),
        visible: v.isVisible !== false
    }));
    const visible = rows.filter(r => r.visible);
    const priced = visible.length ? visible : rows;
    const safePrice = r => (Number.isFinite(r.price) ? r.price : 0);
    return {
        minPrice: priced.length ? Math.min(...priced.map(safePrice)) : 0,
        totalStock: visible.reduce((sum, r) => sum + (Number.isInteger(r.quantity) ? r.quantity : 0), 0)
    };
};

// Trả về câu báo lỗi hoặc '' nếu hợp lệ
export const validateVariants = variants => {
    const names = new Set();
    for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const name = String(v.name ?? '').trim();
        if (!name) return `Biến thể số ${i + 1} chưa có tên.`;
        if (name.length > 100) return `Tên biến thể “${name.slice(0, 20)}…” quá dài (tối đa 100 ký tự).`;
        if (String(v.unit ?? '').trim().length > 30) return `Đơn vị của biến thể “${name}” quá dài (tối đa 30 ký tự).`;
        if (String(v.price ?? '').trim() === '' || !Number.isFinite(Number(v.price)) || Number(v.price) < 0) return `Giá của biến thể “${name}” không hợp lệ.`;
        if (String(v.quantity ?? '').trim() === '' || !Number.isInteger(Number(v.quantity)) || Number(v.quantity) < 0) return `Tồn kho của biến thể “${name}” phải là số nguyên không âm.`;
        const key = name.toLocaleLowerCase('vi');
        if (names.has(key)) return `Tên biến thể “${name}” bị trùng.`;
        names.add(key);
    }
    return '';
};

// Đọc ảnh, thu nhỏ (tối đa maxSize px) rồi trả về data URL JPEG để gửi lên server nhẹ hơn
export const readImageAsDataUrl = (file, maxSize = 640) => new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) {
        reject(new Error('Vui lòng chọn một tệp ảnh.'));
        return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Không đọc được ảnh. Vui lòng chọn ảnh khác.'));
    };
    image.src = objectUrl;
});