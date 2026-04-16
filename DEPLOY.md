# Hướng dẫn triển khai Huyền Bí lên VPS

## Yêu cầu hệ thống

| Thành phần | Tối thiểu |
|---|---|
| RAM | 1 GB |
| CPU | 1 vCPU |
| Ổ cứng | 10 GB |
| HĐH | Ubuntu 22.04 / Debian 12 / CentOS 9 |
| Node.js | 20+ (nếu cài thủ công) |
| Docker | 24+ (nếu dùng Docker) |

---

## Bước 1 — Lấy Clerk keys (bắt buộc cho tài khoản người dùng)

1. Đăng ký miễn phí tại [clerk.com](https://clerk.com)
2. Tạo application mới → chọn loại **Web application**
3. Vào **Dashboard → API Keys**
4. Copy hai giá trị:
   - `Publishable key` → bắt đầu bằng `pk_live_...`
   - `Secret key` → bắt đầu bằng `sk_live_...`
5. Trong phần **Domains**, thêm domain của VPS của bạn (ví dụ `huyenbi.com`)

> **Lưu ý:** Nếu không cần tài khoản người dùng, có thể để trống hai biến Clerk — app vẫn chạy bình thường nhưng không có tính năng lưu lá số.

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
git clone <url-repo> huyen-bi
cd huyen-bi

# Tạo file môi trường
cp .env.example .env
nano .env
```

Điền đầy đủ vào `.env`:

```dotenv
POSTGRES_PASSWORD=mat_khau_manh_cua_ban
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
WEB_PORT=80
```

### Build và chạy

```bash
docker compose up --build -d
```

> Lần đầu build mất 3–5 phút do tải dependencies và compile TypeScript.

### Kiểm tra

```bash
docker compose ps          # Xem trạng thái 3 container
docker compose logs api    # Log của backend
docker compose logs web    # Log của nginx
```

Mở trình duyệt → `http://IP_VPS_CUA_BAN`

### Cập nhật khi có code mới

```bash
git pull
docker compose up --build -d
```

---

## Phương án B — Cài thủ công trên VPS (không dùng Docker)

### 1. Cài Node.js 22 và pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm@latest
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
git clone <url-repo> /opt/huyen-bi
cd /opt/huyen-bi
pnpm install --no-frozen-lockfile
```

### 4. Biến môi trường cho backend

```bash
cat > /opt/huyen-bi/artifacts/api-server/.env.production << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://huyenbi:mat_khau_manh@localhost:5432/huyenbi
CLERK_SECRET_KEY=sk_live_...
EOF
```

### 5. Build backend

```bash
cd /opt/huyen-bi
pnpm --filter @workspace/api-server run build
```

### 6. Build frontend

```bash
PORT=3000 BASE_PATH=/ VITE_CLERK_PUBLISHABLE_KEY=pk_live_... NODE_ENV=production \
  pnpm --filter @workspace/mysticism-web run build
# Static files xuất ra: artifacts/mysticism-web/dist/public/
```

### 7. Chạy backend với PM2

```bash
sudo npm install -g pm2

pm2 start /opt/huyen-bi/artifacts/api-server/dist/index.mjs \
  --name huyen-bi-api \
  --env-file /opt/huyen-bi/artifacts/api-server/.env.production \
  --node-args="--enable-source-maps"

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

---

## Cập nhật AI Keys sau khi deploy

Keys AI (OpenAI / Gemini) **không** cần điền trong `.env`. Thay vào đó:

1. Mở app trên trình duyệt
2. Navbar → nút **AI (0)** → **Cài đặt Admin**
3. Điền API key → Lưu

---

## Kiểm tra sức khoẻ hệ thống

```bash
# API server
curl http://localhost:3001/api/healthz

# Readings API (cần đăng nhập để test đầy đủ)
curl http://localhost:3001/api/readings

# Qua nginx
curl http://localhost/api/healthz
```

---

## Cấu trúc file sau khi build

```
/opt/huyen-bi/
├── artifacts/
│   ├── api-server/dist/index.mjs     # Backend đã build
│   └── mysticism-web/dist/public/    # Frontend đã build (static)
├── docker-compose.yml
├── Dockerfile.api
├── Dockerfile.web
├── docker/nginx.conf
└── .env
```
