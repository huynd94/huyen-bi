# Huyền Bí — Ứng dụng Huyền Học Việt Nam

> Nền tảng huyền học toàn diện: 15 mô-đun tra cứu bao gồm Thần Số Học, Bát Tự Tứ Trụ, Kinh Dịch, Cát Hung, Tử Vi Đẩu Số, Phong Thuỷ, Hợp Tuổi, Xem Ngày Tốt, Sao Hạn và Trợ lý AI — giao diện tiếng Việt, chủ đề tối huyền bí, tài khoản người dùng, lưu & chia sẻ lá số.

![Huyền Bí](https://img.shields.io/badge/Huy%E1%BB%87n%20B%C3%AD-v4.0-c9a227?style=for-the-badge&labelColor=0d0818)
![React](https://img.shields.io/badge/React-19.1-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker)

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [15 Mô-đun tra cứu](#15-mô-đun-tra-cứu)
- [Tính năng chung](#tính-năng-chung)
- [Tài khoản người dùng](#tài-khoản-người-dùng)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Cài bằng Docker (khuyên dùng)](#cài-bằng-docker-khuyên-dùng)
- [Cài thủ công trên VPS](#cài-thủ-công-trên-vps)
- [Cập nhật phiên bản](#cập-nhật-phiên-bản)
- [Cấu hình HTTPS](#cấu-hình-https)
- [Cấu hình Clerk Production](#cấu-hình-clerk-production)
- [Cấu hình AI (Admin Panel)](#cấu-hình-ai-admin-panel)
- [API Reference](#api-reference)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)

---

## Giới thiệu

**Huyền Bí** là ứng dụng web huyền học Việt Nam đầy đủ tính năng, gồm **15 mô-đun tra cứu**, **tài khoản người dùng** để lưu và chia sẻ lá số, trợ lý AI hỗ trợ streaming, xuất PNG/PDF, và hệ thống admin key AI dùng chung.

---

## 15 Mô-đun tra cứu

| Mô-đun | Đường dẫn | Mô tả |
|--------|-----------|-------|
| **Thần Số Học** | `/than-so-hoc` | Số Đường đời, Linh hồn, Sứ mệnh, Nhân cách, Trưởng thành; biểu đồ radar ngũ giác SVG; dự báo 4 năm cá nhân |
| **Bát Tự Tứ Trụ** | `/bat-tu` | 4 trụ Năm–Tháng–Ngày–Giờ, biểu đồ Ngũ Hành donut SVG, Đại Vận 8 trụ, so sánh ngũ hành 2 người |
| **Xem Quẻ I Ching** | `/xem-que` | 64 quẻ Kinh Dịch, gieo quẻ ngẫu nhiên, hiển thị hào âm/dương SVG, lịch sử 10 lần gieo |
| **Cát Hung** | `/cat-hung` | Phân tích số điện thoại & biển số xe, so sánh 2 số cạnh nhau, gợi ý số điện thoại tốt hơn tương tự |
| **Lịch Vạn Niên** | `/lich-van-nien` | Âm lịch, Can Chi, Hoàng Đạo/Hắc Đạo (1900–2100) |
| **Tử Vi Đẩu Số** | `/tu-vi` | 12 cung Tử Vi, 14 chính tinh, Mệnh Cục |
| **Phong Thuỷ Bát Trạch** | `/phong-thuy` | Mệnh Quái cá nhân, la bàn SVG 4 hướng tốt / 4 hướng xấu, luận giải AI |
| **Xem Tên** | `/xem-ten` | Ngũ Cách phân tích tên (Thiên/Nhân/Địa/Ngoại/Tổng Cách), Ngũ Hành tên, radar SVG |
| **Lịch Cá Nhân** | `/lich-ca-nhan` | Năm–Tháng–Ngày Cá Nhân theo Thần Số, lịch tháng màu sắc năng lượng |
| **Từ Điển Huyền Học** | `/tu-dien` | 5 tab tra cứu: Thiên Can, Địa Chi, Ngũ Hành, Bát Quái, Thần Số |
| **Hợp Tuổi & Duyên Số** | `/hop-tuoi` | Tương hợp qua Mệnh Quái, Can Chi, Ngũ Hành, Thần Số; điểm 0–100, biểu đồ chi tiết |
| **Xem Ngày Tốt** | `/xem-ngay-tot` | Tìm ngày Hoàng Đạo theo 9 mục đích (cưới, khai trương, động thổ...); lịch tháng tương tác |
| **Sao Hạn Hàng Năm** | `/sao-han` | Sao chiếu mệnh 7 năm (Thái Tuế, Thái Dương, La Hầu, Phúc Tinh...); card vận hạn |
| **Lịch Sử Tra Cứu** | `/lich-su` | Xem lại, tìm kiếm, lọc và xóa lịch sử tra cứu lưu cục bộ; bảng thống kê |
| **Trợ lý AI** | `/ai-chat` | Chat huyền học với AI, 14 câu gợi ý theo chủ đề, lưu lịch sử hội thoại |

---

## Tính năng chung

| Tính năng | Chi tiết |
|-----------|----------|
| **Chủ đề Sáng/Tối** | Light/Dark mode, lưu localStorage |
| **Xuất PNG / TXT / PDF** | html2canvas + jsPDF, ảnh 2× retina |
| **Phân tích AI** | Giải nghĩa kết quả bằng AI, streaming SSE real-time |
| **Key AI dùng chung** | Admin cấu hình key qua UI, giới hạn lượt gọi theo IP |
| **PWA** | Cài đặt như app gốc trên di động (beforeinstallprompt) |
| **Responsive** | Mobile, tablet, desktop |
| **Navbar dropdown** | 5 nhóm: Số Học, Mệnh Lý, Tiên Tri, Tra Cứu, Trợ lý AI |
| **Hiệu ứng huyền bí** | Ambient orbs, star field, mystic cursor, scroll reveal, 3D tilt card |

---

## Tài khoản người dùng

Được tích hợp qua **Clerk Authentication** — đăng ký miễn phí tại [clerk.com](https://clerk.com).

### Luồng sử dụng

1. Người dùng nhấn **Đăng ký** / **Đăng nhập** trên navbar
2. Chọn **Google OAuth** hoặc **Email + mật khẩu**
3. Sau khi đăng nhập: navbar hiển thị **avatar** + dropdown
4. Trên bất kỳ trang tra cứu nào → nhấn **Lưu lá số** để lưu kết quả
5. Vào **Hồ Sơ** để xem, quản lý, và so sánh các lá số đã lưu

### Tính năng hồ sơ (`/profile`)

| Tính năng | Mô tả |
|-----------|-------|
| **Danh sách lá số** | Xem tất cả lá số đã lưu, lọc theo module, tìm kiếm theo tên |
| **Ghi chú cá nhân** | Thêm/sửa ghi chú cho từng lá số |
| **So sánh 2 lá số** | Chọn 2 lá số bất kỳ để xem bảng so sánh cạnh nhau |
| **Chia sẻ link** | Tạo link chia sẻ (hết hạn sau 30 ngày), copy vào clipboard |
| **Xóa lá số** | Xóa từng lá số với xác nhận |
| **Đăng xuất** | Trong dropdown navbar hoặc trang hồ sơ |

### Bảng database liên quan

| Bảng | Mô tả |
|------|-------|
| `saved_readings` | Lá số của người dùng (user_id, module, title, input_data, result_data, notes) |
| `share_tokens` | Token chia sẻ có hạn (token, reading_id, expires_at) |

> **Lưu ý:** Nếu không cần tài khoản người dùng, có thể bỏ qua biến `CLERK_*` — app vẫn chạy đầy đủ 15 module, chỉ tắt tính năng lưu/chia sẻ lá số.

---

## Kiến trúc hệ thống

```
monorepo (pnpm workspaces)
├── artifacts/
│   ├── mysticism-web/     # React 19 + Vite 7 frontend
│   └── api-server/        # Express 5 backend
├── docker/
│   └── nginx.conf         # Nginx: static files + proxy /api/*
├── Dockerfile.api         # Backend: esbuild bundle
├── Dockerfile.web         # Frontend: Vite build → Nginx
├── docker-compose.yml     # Postgres + API + Web (3 service)
├── .env.example           # Mẫu biến môi trường
└── DEPLOY.md              # Hướng dẫn deploy chi tiết
```

**Stack:**

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 19.1 + Vite 7 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Backend | Express 5 + PostgreSQL + Zod validation |
| Auth | Clerk (Google OAuth + Email, JWT, proxy middleware) |
| AI | OpenAI GPT / Google Gemini — key chung hoặc key riêng |
| Proxy | Nginx 1.27 — static files + reverse proxy `/api/*` |
| Container | Docker + Docker Compose v2 |

---

## Cài bằng Docker (khuyên dùng)

Phù hợp để triển khai nhanh — một lệnh chạy cả stack (Postgres + API + Nginx).

### Yêu cầu

- Docker 24+
- Docker Compose v2+
- Domain (nếu cần HTTPS và Clerk production)

### Bước 1 — Cài Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Đăng xuất và đăng nhập lại
```

### Bước 2 — Clone repo

```bash
git clone https://github.com/huyavm/Numerology-Divination.git
cd Numerology-Divination
```

### Bước 3 — Tạo file .env

```bash
cp .env.example .env
nano .env
```

Nội dung `.env` tối thiểu:

```dotenv
# Database
POSTGRES_PASSWORD=mat_khau_manh_cua_ban

# Cổng web (mặc định 80)
WEB_PORT=80

# Clerk Authentication (lấy tại clerk.com → API Keys)
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

> Không cần điền API key AI ở đây — cấu hình qua Admin Panel sau khi deploy.
>
> Nếu chưa có Clerk keys, có thể bỏ trống — app vẫn chạy đủ 15 mô-đun.

### Bước 4 — Build và chạy

```bash
docker compose up --build -d
```

Mở trình duyệt: **`http://IP_SERVER_CUA_BAN`**

> Lần đầu build mất 3–5 phút. Các lần sau nhanh hơn nhờ Docker layer cache.

### Lệnh thường dùng

```bash
# Xem trạng thái các container
docker compose ps

# Xem log real-time
docker compose logs -f
docker compose logs -f api      # Chỉ backend
docker compose logs -f web      # Chỉ nginx

# Rebuild sau khi thay đổi code
docker compose up --build -d

# Dừng (giữ data)
docker compose down

# Dừng và xoá toàn bộ data (cẩn thận!)
docker compose down -v
```

### Chạy sau reverse proxy có sẵn (Nginx/Traefik)

Nếu server đã có Nginx/Traefik xử lý TLS bên ngoài, tạo file `docker-compose.override.yml`:

```yaml
services:
  web:
    ports: []
    expose:
      - "80"
```

---

## Cài thủ công trên VPS

Phù hợp khi server đã có Node.js, PostgreSQL, và Nginx sẵn.

### Yêu cầu

| Công cụ | Phiên bản |
|---------|-----------|
| Node.js | 22+ |
| pnpm | 10+ |
| PostgreSQL | 14+ |
| Nginx | 1.20+ |

### Bước 1 — Cài Node.js 22 và pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm@latest
```

### Bước 2 — Tạo database

```bash
sudo -u postgres psql -c "CREATE USER huyenbi WITH PASSWORD 'mat_khau_manh';"
sudo -u postgres psql -c "CREATE DATABASE huyenbi OWNER huyenbi;"
```

### Bước 3 — Clone và cài dependencies

```bash
git clone https://github.com/huyavm/Numerology-Divination.git /opt/huyen-bi
cd /opt/huyen-bi
pnpm install --no-frozen-lockfile
```

### Bước 4 — Build backend

```bash
pnpm --filter @workspace/api-server run build
```

### Bước 5 — Build frontend

```bash
PORT=3000 BASE_PATH=/ NODE_ENV=production \
  VITE_CLERK_PUBLISHABLE_KEY=pk_live_... \
  pnpm --filter @workspace/mysticism-web run build
# Static files xuất ra: artifacts/mysticism-web/dist/public/
```

### Bước 6 — Chạy backend với PM2

```bash
sudo npm install -g pm2

pm2 start /opt/huyen-bi/artifacts/api-server/dist/index.mjs \
  --name huyen-bi-api \
  --node-args="--enable-source-maps" \
  --env production

# Đặt biến môi trường cho process
pm2 set huyen-bi-api:NODE_ENV production
pm2 set huyen-bi-api:PORT 3001
pm2 set huyen-bi-api:DATABASE_URL "postgresql://huyenbi:mat_khau@localhost:5432/huyenbi"
pm2 set huyen-bi-api:CLERK_SECRET_KEY "sk_live_..."

# Lưu config và cài startup
pm2 save
pm2 startup
```

Hoặc dùng file `.env` riêng:

```bash
# Tạo file env cho backend
cat > /opt/huyen-bi/.env.api << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://huyenbi:mat_khau@localhost:5432/huyenbi
CLERK_SECRET_KEY=sk_live_...
EOF

pm2 start /opt/huyen-bi/artifacts/api-server/dist/index.mjs \
  --name huyen-bi-api \
  --node-args="--enable-source-maps" \
  --env-file /opt/huyen-bi/.env.api

pm2 save && pm2 startup
```

### Bước 7 — Cấu hình Nginx

```bash
sudo nano /etc/nginx/sites-available/huyen-bi
```

Nội dung:

```nginx
server {
    listen 80;
    server_name your-domain.com;   # Thay bằng domain của bạn

    root /opt/huyen-bi/artifacts/mysticism-web/dist/public;
    index index.html;

    # Cache static assets dài hạn (Vite tạo tên file có hash)
    location ~* \.(js|css|woff2?|ttf|svg|png|jpg|ico|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Proxy /api/* → Express backend (hỗ trợ SSE streaming + Clerk proxy)
    location /api/ {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Connection "";
        proxy_buffering    off;
        proxy_cache        off;
        chunked_transfer_encoding on;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # SPA fallback — tất cả route trả về index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/huyen-bi /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Cập nhật phiên bản

Mỗi khi có tính năng mới, bản vá lỗi hoặc nâng cấp phụ thuộc, thực hiện theo hướng dẫn tương ứng với cách bạn đang triển khai.

> **Trước khi update:** Luôn sao lưu database và file `.env` phòng trường hợp cần rollback.

---

### Backup nhanh trước khi update

```bash
# Sao lưu database (bắt buộc nếu có dữ liệu người dùng)
# Docker:
docker exec huyen-bi-db pg_dump -U postgres huyenbi > backup_$(date +%Y%m%d).sql

# VPS thủ công:
pg_dump -U huyenbi huyenbi > backup_$(date +%Y%m%d).sql

# Sao lưu file .env
cp .env .env.backup
```

---

### Cập nhật khi dùng Docker (khuyên dùng)

```bash
# 1. Vào thư mục project
cd /opt/huyen-bi        # Hoặc thư mục bạn đã clone

# 2. Kéo code mới nhất
git pull origin main

# 3. Rebuild và khởi động lại (downtime khoảng 30–60 giây)
docker compose up --build -d

# 4. Kiểm tra log xem có lỗi không
docker compose logs -f --tail=50
```

> Database schema tự động được migrate khi server khởi động — bạn không cần chạy lệnh migration thủ công.

**Kiểm tra sau update:**

```bash
# Xem trạng thái các container
docker compose ps

# Kiểm tra API server
curl http://localhost/api/healthz
```

---

### Cập nhật khi cài thủ công trên VPS

```bash
# 1. Vào thư mục project
cd /opt/huyen-bi

# 2. Kéo code mới nhất
git pull origin main

# 3. Cài dependencies mới (nếu có)
pnpm install --no-frozen-lockfile

# 4. Rebuild backend
pnpm --filter @workspace/api-server run build

# 5. Rebuild frontend
PORT=3000 BASE_PATH=/ NODE_ENV=production \
  VITE_CLERK_PUBLISHABLE_KEY=pk_live_... \
  pnpm --filter @workspace/mysticism-web run build

# 6. Khởi động lại backend (PM2 tự reload)
pm2 reload huyen-bi-api

# 7. Kiểm tra trạng thái
pm2 status
pm2 logs huyen-bi-api --lines 30
```

> Frontend là file tĩnh — Nginx phục vụ ngay từ thư mục `dist/public/` mà không cần restart.

---

### Cập nhật chỉ Frontend (không đổi backend)

Khi bản update chỉ thay đổi giao diện, không có API mới:

```bash
git pull origin main

# Docker:
docker compose up --build -d web

# VPS thủ công:
PORT=3000 BASE_PATH=/ NODE_ENV=production \
  VITE_CLERK_PUBLISHABLE_KEY=pk_live_... \
  pnpm --filter @workspace/mysticism-web run build
# Không cần restart Nginx hay PM2
```

---

### Cập nhật chỉ Backend (không đổi frontend)

```bash
git pull origin main

# Docker:
docker compose up --build -d api

# VPS thủ công:
pnpm --filter @workspace/api-server run build
pm2 reload huyen-bi-api
```

---

### Xem lịch sử cập nhật

```bash
# Xem 10 commit gần nhất để biết có gì mới
git log --oneline -10

# Xem chi tiết thay đổi của một commit
git show <commit_hash>

# Xem file nào thay đổi trong lần update vừa pull
git diff HEAD~1 --name-only
```

---

### Rollback về phiên bản trước

Nếu bản update có lỗi nghiêm trọng:

```bash
# Xem danh sách các commit (tìm hash của phiên bản cũ)
git log --oneline -20

# Quay về commit cụ thể
git checkout <commit_hash>

# Docker — rebuild lại từ code cũ
docker compose up --build -d

# VPS — rebuild frontend + backend rồi pm2 reload
```

**Khôi phục database** (nếu schema bị thay đổi):

```bash
# Docker:
docker exec -i huyen-bi-db psql -U postgres huyenbi < backup_YYYYMMDD.sql

# VPS:
psql -U huyenbi huyenbi < backup_YYYYMMDD.sql
```

---

### Kiểm tra phiên bản đang chạy

```bash
# Xem commit đang deploy
git rev-parse --short HEAD

# Docker — xem image đang dùng
docker compose images

# VPS — xem thời gian deploy gần nhất
pm2 info huyen-bi-api | grep "started"
```

---

## Cấu hình HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
sudo systemctl reload nginx
```

Certbot tự thêm block HTTPS và redirect HTTP → HTTPS vào nginx config.

---

## Cấu hình Clerk Production

Sau khi deploy xong và có domain + HTTPS:

1. Vào [clerk.com](https://clerk.com) → Dashboard → **Domains**
2. Nhấn **Add domain** → nhập domain của bạn (ví dụ `huyenbi.com`)
3. Làm theo hướng dẫn verify (thêm DNS TXT record)
4. Khi verify xong, Clerk cấp **production instance** — copy `pk_live_...` và `sk_live_...`
5. Cập nhật `.env` với keys mới → rebuild Docker hoặc rebuild frontend thủ công

> **Clerk proxy:** Trong production, mọi request xác thực Clerk đi qua `/api/__clerk` trên server của bạn (Express tự proxy đến `clerk.dev`). Nginx đã cấu hình sẵn, không cần thêm gì.

---

## Cấu hình AI (Admin Panel)

App hỗ trợ **3 chế độ AI**:

| Chế độ | Mô tả |
|--------|-------|
| **Key hệ thống** | Admin cài key dùng chung — người dùng không cần nhập gì |
| **OpenAI** | Người dùng tự nhập OpenAI API key |
| **Google Gemini** | Người dùng tự nhập Gemini API key |

### Cài key hệ thống (Admin)

1. Vào app → Navbar → nút **AI** → **Cài đặt AI**
2. Cuộn xuống **Cài đặt Admin** → nhập mật khẩu admin *(lần đầu tự đặt)*
3. Chọn Provider, nhập API Key, chọn Model
4. Đặt giới hạn lượt gọi theo IP (mặc định: 20/giờ, 100/ngày)
5. Nhấn **Lưu cấu hình Admin**

### Các model được hỗ trợ

| Provider | Mặc định | Các model khác |
|----------|----------|----------------|
| OpenAI | `gpt-5.4-nano` | `gpt-5.4`, `gpt-5.4-mini`, `gpt-4.1` |
| Google Gemini | `gemini-3.0-flash` | `gemini-3.0-pro`, `gemini-3.0-flash-lite` |

---

## API Reference

Base URL: `http://localhost:3001` (hoặc domain của bạn)

### Mô-đun chung

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/healthz` | Kiểm tra server |
| `GET` | `/api/config/public` | Thông tin cấu hình public |
| `POST` | `/api/mysticism/ai-interpret` | Phân tích huyền học bằng AI (SSE) |

### Tài khoản người dùng (yêu cầu đăng nhập)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/readings` | Danh sách lá số đã lưu |
| `POST` | `/api/readings` | Lưu lá số mới |
| `PATCH` | `/api/readings/:id` | Sửa tiêu đề / ghi chú |
| `DELETE` | `/api/readings/:id` | Xóa lá số |
| `POST` | `/api/readings/:id/share` | Tạo link chia sẻ (30 ngày) |
| `GET` | `/api/share/:token` | Xem lá số qua link chia sẻ (public) |

### AI Chat

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/openai/conversations` | Danh sách hội thoại |
| `POST` | `/api/openai/conversations` | Tạo hội thoại mới |
| `POST` | `/api/openai/conversations/:id/messages` | Gửi tin nhắn (SSE streaming) |

### Headers AI

```
x-ai-provider: server | openai | gemini
x-ai-key:      <API key>         (chỉ khi provider = openai / gemini)
x-ai-model:    gpt-5.4-nano | gemini-3.0-flash | ...
```

---

## Cấu trúc thư mục

```
artifacts/mysticism-web/src/
├── pages/
│   ├── home.tsx              # Trang chủ
│   ├── than-so-hoc.tsx       # Thần Số Học (radar SVG + 4-year outlook)
│   ├── bat-tu.tsx            # Bát Tự + Đại Vận + so sánh 2 người
│   ├── xem-que.tsx           # Kinh Dịch + session history
│   ├── cat-hung.tsx          # Cát Hung + so sánh 2 số + gợi ý
│   ├── lich-van-nien.tsx     # Lịch Vạn Niên
│   ├── tu-vi.tsx             # Tử Vi Đẩu Số
│   ├── phong-thuy.tsx        # Phong Thuỷ Bát Trạch
│   ├── xem-ten.tsx           # Xem Tên (Ngũ Cách)
│   ├── lich-ca-nhan.tsx      # Lịch Cá Nhân
│   ├── tu-dien.tsx           # Từ Điển Huyền Học
│   ├── hop-tuoi.tsx          # Hợp Tuổi & Duyên Số
│   ├── xem-ngay-tot.tsx      # Xem Ngày Tốt
│   ├── sao-han.tsx           # Sao Hạn Hàng Năm
│   ├── lich-su.tsx           # Lịch Sử Tra Cứu
│   ├── ai-chat.tsx           # Trợ lý AI
│   ├── sign-in.tsx           # Trang đăng nhập (Clerk)
│   ├── sign-up.tsx           # Trang đăng ký (Clerk)
│   └── profile.tsx           # Hồ sơ + lá số + so sánh + chia sẻ
├── components/
│   ├── layout/
│   │   ├── navbar.tsx        # Navbar 5 nhóm + UserButton (Clerk)
│   │   └── footer.tsx        # Footer đa cột
│   ├── save-reading-btn.tsx  # Nút lưu lá số (dùng lại ở mọi trang)
│   ├── mystic-cursor.tsx     # Con trỏ huyền bí (gold dot + trail)
│   ├── ambient-bg.tsx        # Orbs + star field
│   ├── tilt-card.tsx         # 3D perspective tilt
│   ├── pwa-install-prompt.tsx
│   └── export-card-*.tsx     # Card xuất ảnh/PDF
├── lib/
│   ├── readings-api.ts       # API client cho /api/readings
│   ├── numerology.ts         # Thần Số Học
│   ├── batu.ts               # Bát Tự + Ngũ Hành
│   ├── dai-van.ts            # Đại Vận 8 trụ
│   ├── iching.ts             # 64 quẻ Kinh Dịch
│   ├── cat-hung.ts           # Phân tích Cát Hung
│   ├── phong-thuy.ts         # Bát Trạch Ming Gua
│   ├── xem-ten.ts            # Ngũ Cách phân tích tên
│   ├── lich-ca-nhan.ts       # Lịch Cá Nhân
│   ├── lunar-calendar.ts     # Dương↔Âm (Ho Ngoc Duc)
│   ├── tu-vi.ts              # 12 cung Tử Vi + 14 chính tinh
│   ├── hop-tuoi.ts           # Tương hợp Mệnh Quái + Ngũ Hành
│   ├── xem-ngay-tot.ts       # Tìm ngày Hoàng Đạo theo mục đích
│   ├── sao-han.ts            # Sao hạn chiếu mệnh hàng năm
│   ├── history.ts            # Lịch sử localStorage
│   ├── share-utils.ts        # Chia sẻ kết quả qua URL
│   └── form-utils.ts         # Tiện ích form (ngày, giờ, tên)
└── contexts/
    ├── theme.tsx             # Light/Dark mode
    └── ai-settings.tsx       # AI provider context

artifacts/api-server/src/
├── app.ts                    # Express app + Clerk middleware
├── middlewares/
│   └── clerkProxyMiddleware.ts  # Proxy Clerk FAPI trong production
├── lib/
│   ├── migrate.ts            # Auto-migration khi server khởi động
│   ├── server-config.ts      # Cấu hình admin
│   └── rate-limit.ts         # Rate limit theo IP
└── routes/
    ├── readings.ts           # CRUD lá số + share token
    ├── mysticism/            # SSE AI interpret
    ├── openai/               # CRUD hội thoại AI
    ├── config/               # /api/config/public
    └── admin/                # /api/admin/*

docker/
└── nginx.conf                # Static files + proxy /api/* (SSE ready)
```

---

## Giấy phép

MIT License

---

*Được xây dựng với tâm huyết cho cộng đồng huyền học Việt Nam.*
