# MokuReader

MokuReader là ứng dụng NextJS tự host giúp đọc manga được xử lý bởi Mokuro trong mạng LAN, tích hợp sẵn hỗ trợ Anki và Yomichan cho việc học ngôn ngữ.

## Tính năng

- Đọc manga từ các file Mokuro trong mạng LAN
- Giao diện người dùng thân thiện, dễ sử dụng
- Tích hợp Anki để tạo flashcard trực tiếp từ nội dung đọc
- Hỗ trợ Yomichan để tra cứu từ vựng nhanh chóng
- Nhiều chế độ đọc (trang đơn, trang đôi, cuộn dọc)
- Hỗ trợ chế độ tối/sáng và hướng đọc tùy chỉnh

## Cài đặt

1. Clone repository này:
   ```bash
   git clone https://github.com/yourusername/mokureader.git
   cd mokureader
   ```

2. Cài đặt dependencies:
   ```bash
   npm install
   # hoặc
   yarn install
   ```

3. Cấu hình:
   - Chỉnh sửa file cấu hình theo nhu cầu (xem phần Cấu hình bên dưới)

4. Xây dựng ứng dụng:
   ```bash
   npm run build
   # hoặc
   yarn build
   ```

5. Chạy server:
   ```bash
   npm run start
   # hoặc
   yarn start
   ```

6. Truy cập ứng dụng tại địa chỉ IP của máy chủ với cổng mặc định 3000:
   ```
   http://[địa-chỉ-IP]:3000
   ```

## Cấu trúc thư mục

Đặt các file manga đã được xử lý bởi Mokuro vào thư mục `public/MANGA` với cấu trúc như sau:

```
public/MANGA/
  ├── [tên manga]/
  │   ├── [tên volume]/
  │   │   ├── [các file ảnh]
  │   ├── volume.mokuro (file metadata từ Mokuro)
  │   └── ...
  └── ...
```

## Cấu hình

Tạo file `.env.local` với các biến môi trường sau:

```
MANGA_DIR=./public/MANGA
ANKI_CONNECT_URL=http://localhost:8765
```

## Tích hợp Anki và Yomichan

### Anki
1. Cài đặt [Anki](https://apps.ankiweb.net/) trên máy tính
2. Cài đặt add-on [AnkiConnect](https://ankiweb.net/shared/info/2055492159)
3. Mở Anki trước khi sử dụng tính năng tạo flashcard từ MokuReader

### Yomichan
1. Cài đặt extension [Yomichan](https://foosoft.net/projects/yomichan/) cho trình duyệt
2. Cấu hình Yomichan để kết nối với server MokuReader

## Sử dụng trong mạng LAN

Để sử dụng MokuReader trong mạng LAN:

1. Chạy ứng dụng trên một máy tính sẽ làm máy chủ
2. Các thiết bị khác trong cùng mạng LAN có thể truy cập qua địa chỉ IP của máy chủ:
   ```
   http://[địa-chỉ-IP-máy-chủ]:3000
   ```

## Tùy chỉnh

Bạn có thể tùy chỉnh giao diện và chức năng bằng cách chỉnh sửa các file trong thư mục `src/`.

## Đóng góp

Đóng góp và báo lỗi luôn được chào đón. Vui lòng tạo issue hoặc pull request.

## Giấy phép

Chỉ sử dụng cho mục đích cá nhân. Không phân phối lại.
