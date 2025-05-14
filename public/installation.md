# Hướng dẫn cài đặt MokuReader

## Yêu cầu hệ thống

- Node.js 18.0 trở lên
- NPM hoặc Yarn
- Dung lượng ổ cứng đủ để lưu trữ manga (tùy thuộc vào số lượng manga)

## Cài đặt

### 1. Cài đặt Node.js và NPM

Truy cập [nodejs.org](https://nodejs.org) và tải bản LTS mới nhất.

### 2. Cài đặt MokuReader

Clone repository hoặc giải nén tệp zip vào thư mục bạn muốn:

```bash
git clone https://github.com/yourusername/mokureader.git
cd mokureader
```

Hoặc tải xuống và giải nén tệp zip.

### 3. Cài đặt các thư viện phụ thuộc

```bash
npm install
# hoặc
yarn install
```

### 4. Cấu hình

Tạo file `.env.local` trong thư mục gốc của dự án với nội dung sau:

```
MANGA_DIR=./public/MANGA
PORT=3000
ANKI_CONNECT_URL=http://localhost:8765
```

### 5. Thêm manga vào thư mục

Tạo thư mục `public/MANGA` (nếu chưa có) và sao chép các file Mokuro vào đó.

Cấu trúc thư mục nên như sau:

```
```
public/MANGA/
  ├── [tên manga]/
  │   ├── [tên volume]/
  │   │   ├── [các file ảnh]
  │   ├── volume.mokuro (file metadata từ Mokuro)
  │   └── ...
  ├── [tên manga 2]/
  │   └── ...
  └── ...
```

### 6. Xây dựng ứng dụng

```bash
npm run build
# hoặc
yarn build
```

### 7. Chạy ứng dụng

```bash
npm run start
# hoặc
yarn start
```

### 8. Truy cập ứng dụng

Mở trình duyệt và truy cập:

```
http://localhost:3000
```

## Sử dụng trong mạng LAN

Để cho phép các thiết bị khác trong mạng LAN truy cập ứng dụng:

1. Tìm địa chỉ IP của máy tính chạy MokuReader:
   - Windows: Mở Command Prompt và gõ `ipconfig`
   - macOS/Linux: Mở Terminal và gõ `ifconfig` hoặc `ip addr`

2. Trên các thiết bị khác, truy cập:
   ```
   http://[địa-chỉ-IP-máy-chủ]:3000
   ```

## Cấu hình Anki

1. Cài đặt [Anki](https://apps.ankiweb.net/)
2. Cài đặt add-on [AnkiConnect](https://ankiweb.net/shared/info/2055492159):
   - Mở Anki
   - Vào Tools > Add-ons > Get Add-ons
   - Nhập mã: 2055492159
   - Khởi động lại Anki

3. Chỉnh sửa cấu hình AnkiConnect (nếu cần):
   - Trong Anki, vào Tools > Add-ons > AnkiConnect > Config
   - Đảm bảo `webBindAddress` được đặt thành `0.0.0.0` (để truy cập từ mạng)
   - Đảm bảo `webBindPort` được đặt thành `8765`

## Cấu hình Yomichan

1. Cài đặt extension [Yomichan](https://foosoft.net/projects/yomichan/) cho trình duyệt
2. Trong cài đặt Yomichan, vào phần "Advanced"
3. Cấu hình để hoạt động với MokuReader

## Xử lý sự cố

### Không thể kết nối đến Anki

- Đảm bảo Anki đang chạy
- Kiểm tra xem AnkiConnect đã được cài đặt đúng cách
- Kiểm tra file `.env.local` xem URL của AnkiConnect có đúng không

### Không thể nhìn thấy manga đã thêm

- Kiểm tra cấu trúc thư mục đã đúng chưa
- Kiểm tra quyền truy cập của thư mục manga
- Khởi động lại ứng dụng

### Không thể truy cập từ thiết bị khác trong mạng LAN

- Kiểm tra tường lửa, đảm bảo cổng 3000 được mở
- Kiểm tra xem địa chỉ IP có đúng không 