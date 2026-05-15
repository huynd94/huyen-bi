/// <reference types="vite/client" />

/**
 * Phiên bản ứng dụng được Vite inject lúc build qua `define` trong
 * `vite.config.ts`. Giá trị lấy từ `package.json#version` và được serialize
 * bằng {@link JSON.stringify}, nên ở runtime đây là string literal đã quote
 * sẵn (ví dụ `"4.1.0"`).
 *
 * Footer (`src/components/layout/footer.tsx`) đọc giá trị này để hiển thị
 * "v{version}" theo Requirement 12.6.
 */
declare const __APP_VERSION__: string;
