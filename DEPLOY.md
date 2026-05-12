# Hướng dẫn triển khai Huyền Bí lên VPS

## Yêu cầu hệ thống

| Thành phần | Tối thiểu |
|---|---|
| RAM | 1 GB |
| CPU | 1 vCPU |
| Ổ cứng | 10 GB |
| HĐH | Ubuntu 22.04 / Debian 12 / CentOS 9 |
| Node.js | 22+ (bắt buộc — pnpm 10 cần Node ≥22.13) |
| Docker | 24+ (nếu dùng Docker) |

> **Quan trọng:** Repo pin `pnpm@10.32.0` qua field `packageManager` trong `package.json`. Dùng `corepack enable` để Node tự quản lý phiên bản pnpm — không cần `npm install -g pnpm`.

---

## Bước 1 — Lấy Clerk keys (bắt buộc cho tài khoản người dùng)

1. Đăng ký miễn phí tại [clerk.com](https://clerk.com)
2. Tạo application mới → chọn loại **Web application**
3. Vào **Dashboard → API Keys**
4. Copy hai giá trị:
   - `Publishable key` → bắt đầu bằng `pk_live_...`
   - `Secret key` → bắt đầu bằng `sk_live_...`
5. Trong phần **Domains**, thêm domain của VPS của bạn (ví dụ `huyenbi.com`)

> **Lưu ý:** Nếu không cần tài khoản người dùng, có thể để trống hai biến Clerk — app vẫn chạy bình thường nhưng không có tính năng lưu lá số và AI chat.

---

## Bước 2 — Cấp quyền Admin (sau khi deploy)

Quyền admin dựa trên **Clerk public metadata** — không có mật khẩu admin trong database.

1. Đăng ký / đăng nhập tại app đã deploy (`/sign-up`).
2. Vào [dashboard.clerk.com](https://dashboard.clerk.com) → application → **Users** → tìm email → click vào.
3. Tab **Metadata** → **Public metadata** → **Edit** → đặt:
   ```json
   {
     "role": "admin"
   }
   ```
4. **Save**. Không cần logout/login lại.

Hoặc dùng API:

```bash
curl -X PATCH "https://api.clerk.com/v1/users/<USER_ID>/metadata" \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"public_metadata": {"role": "admin"}}'
```

> Fresh deploy KHÔNG có admin mặc định — phải cấp thủ công. Điều này ngăn người lạ chiếm quyền admin trên deploy mới.

---

## Phương án A — Docker Compose (khuyên dùng)

### Cài đặt Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Đăng xuất và đăng nhập lại để áp dụng
```

### Clone và cấu hình

```bash
git clone https://github.com/huynd94/huyen-bi.git
cd huyen-bi

# Tạo file môi trường
cp .env.example .env
nano .env
```

Điền đầy đủ vào `.env`:

```dotenv
# Bắt buộc
POSTGRES_PASSWORD=mat_khau_manh_cua_ban

# Clerk (bỏ trống = tắt tính năng tài khoản)
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

# Tuỳ chọn
WEB_PORT=80
# CORS_ALLOWED_ORIGINS=https://huyenbi.io.vn,https://preview.huyenbi.io.vn
```

### Build và chạy

```bash
docker compose up --build -d
```

> Lần đầu build mất 3–5 phút do tải dependencies và compile TypeScript.
> Dockerfile dùng `node:22-slim` và corepack tự kéo pnpm theo `packageManager` pin.

### Kiểm tra

```bash
docker compose ps          # Xem trạng thái 3 container
docker compose logs api    # Log của backend
docker compose logs web    # Log của nginx

# Health check
curl http://localhost/api/healthz
# Kỳ vọng: {"status":"ok"}
```

Mở trình duyệt → `http://IP_VPS_CUA_BAN`

### Cập nhật khi có code mới

```bash
git pull origin main
docker compose up --build -d
```

> Database schema tự động migrate khi API server khởi động — không cần chạy migration thủ công.

---

## Phương án B — Cài thủ công trên VPS (không dùng Docker)

### 1. Cài Node.js 22 và corepack

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Bật corepack — nó sẽ tự dùng pnpm@10.32.0 theo packageManager trong package.json
sudo corepack enable
```

### 2. Cài PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE USER huyenbi WITH PASSWORD 'mat_khau_manh';"
sudo -u postgres psql -c "CREATE DATABASE huyenbi OWNER huyenbi;"
```

### 3. Clone và cài dependencies

```bash
git clone https://github.com/huynd94/huyen-bi.git /opt/huyen-bi
cd /opt/huyen-bi

# --frozen-lockfile đảm bảo build deterministic
corepack pnpm install --frozen-lockfile
```

### 4. Biến môi trường cho backend

```bash
cat > /opt/huyen-bi/.env.api << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://huyenbi:mat_khau_manh@localhost:5432/huyenbi
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
TRUST_PROXY=loopback
EOF
```

> `TRUST_PROXY=loopback` cần thiết khi Nginx chạy cùng máy — nếu không, rate limiter sẽ thấy mọi request đến từ `127.0.0.1`.

### 5. Build backend

```bash
cd /opt/huyen-bi
corepack pnpm --filter @workspace/api-server run build
```

### 6. Build frontend

```bash
PORT=3000 BASE_PATH=/ VITE_CLERK_PUBLISHABLE_KEY=pk_live_... NODE_ENV=production \
  corepack pnpm --filter @workspace/mysticism-web run build
# Static files xuất ra: artifacts/mysticism-web/dist/public/
```

### 7. Chạy backend với PM2

```bash
sudo npm install -g pm2

pm2 start /opt/huyen-bi/artifacts/api-server/dist/index.mjs \
  --name huyen-bi-api \
  --node-args="--enable-source-maps" \
  --env-file /opt/huyen-bi/.env.api

pm2 startup   # Tự khởi động cùng hệ thống
pm2 save
```

### 8. Cài Nginx

```bash
sudo apt install -y nginx

sudo cp /opt/huyen-bi/docker/nginx.conf /etc/nginx/conf.d/huyen-bi.conf

# Sửa đường dẫn static files trong nginx config
sudo sed -i 's|/usr/share/nginx/html|/opt/huyen-bi/artifacts/mysticism-web/dist/public|g' \
  /etc/nginx/conf.d/huyen-bi.conf

sudo nginx -t && sudo systemctl reload nginx
```

---

## Cấu hình HTTPS với Let's Encrypt (tuỳ chọn nhưng nên làm)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d huyenbi.com -d www.huyenbi.com
sudo systemctl reload nginx
```

Sau khi có HTTPS, nginx tự redirect HTTP → HTTPS.

---

## Cấu hình Clerk Production Domain

Sau khi có domain thật và HTTPS, vào Clerk Dashboard:

1. **Dashboard → Domains** → Add domain `huyenbi.com`
2. Làm theo hướng dẫn verify domain (thêm DNS TXT record)
3. Clerk sẽ tự động cấp production instance

> **Clerk proxy:** Trong production, request xác thực Clerk đi qua `/api/__clerk` trên server của bạn (Express tự proxy đến `clerk.dev`). Nginx đã cấu hình sẵn, không cần thêm gì.

---

## Cập nhật AI Keys sau khi deploy

Keys AI (OpenAI / Gemini) **không** cần điền trong `.env`. Thay vào đó:

1. Đăng nhập bằng tài khoản đã được cấp `role: "admin"` (xem Bước 2 ở trên).
2. Navbar → nút **AI** → **Cài đặt AI** → cuộn xuống **Cài đặt Admin (Key hệ thống)**.
3. Chọn Provider, nhập API Key, chọn Model, đặt rate limit.
4. Nhấn **Lưu cấu hình Admin**.

Nếu bị `403 Forbidden`: kiểm tra Clerk Dashboard → user → Public metadata phải có `{"role": "admin"}`.

---

## Kiểm tra sức khoẻ hệ thống

```bash
# Public health (luôn trả {"status":"ok"})
curl http://localhost:3001/api/healthz

# Admin health (cần auth — dùng trình duyệt khi đã đăng nhập admin)
# GET /api/admin/healthz → trả DB status, env info, Clerk key presence

# Qua nginx
curl http://localhost/api/healthz
```

---

## Biến môi trường tham khảo

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `PORT` | Yes | Cổng API server (thường `3001`) |
| `CLERK_SECRET_KEY` | No* | Backend auth |
| `CLERK_PUBLISHABLE_KEY` | No* | Backend Clerk middleware |
| `VITE_CLERK_PUBLISHABLE_KEY` | No* | Frontend build (bake vào bundle) |
| `CORS_ALLOWED_ORIGINS` | No | Thêm origin ngoài default `https://huyenbi.io.vn` |
| `TRUST_PROXY` | No | `loopback` / số hop / CIDR khi có reverse proxy |
| `LOG_LEVEL` | No | Mặc định `info` |

\* Thiếu Clerk keys = tắt tính năng tài khoản, 15 module tra cứu vẫn chạy.

---

## Cấu trúc file sau khi build

```
/opt/huyen-bi/
├── artifacts/
│   ├── api-server/dist/index.mjs     # Backend đã build (esbuild bundle)
│   └── mysticism-web/dist/public/    # Frontend đã build (static)
├── docker-compose.yml
├── Dockerfile.api                    # node:22-slim, corepack pnpm
├── Dockerfile.web                    # node:22-slim → nginx:1.27-alpine
├── docker/nginx.conf
├── .env                              # Biến môi trường (KHÔNG commit)
├── .env.api                          # Env riêng cho PM2 (VPS thủ công)
└── AUDIT_PLAN_PROGRESS.md            # Nhật ký audit & hardening
```
