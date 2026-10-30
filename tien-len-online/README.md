# Đấu Trường Bài — Tiến Lên Miền Nam Online

## Chạy thử trên máy
Cần cài Node.js 18 trở lên.

```bash
npm install
npm start
```

Mở http://localhost:3000. Để thử nhiều người trên cùng máy, mở nhiều cửa sổ/trình duyệt.

## Đưa game lên Internet để có link gửi bạn bè
Cách đơn giản: dùng Render (dịch vụ hosting Node.js).

1. Tạo tài khoản Render và một repository GitHub.
2. Tải toàn bộ thư mục dự án này lên GitHub.
3. Trong Render chọn **New → Web Service**, kết nối repository.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Deploy. Render sẽ cấp một địa chỉ dạng `https://ten-game.onrender.com`.
7. Gửi link đó cho bạn bè. Tạo phòng trong game rồi bấm **Sao chép link mời** để gửi link vào đúng phòng.

Lưu ý: người chơi ở xa cần truy cập cùng địa chỉ Render; không dùng link `localhost`.

## Luật và giới hạn bản beta
- Phòng có tối đa 8 người chơi, dùng một bộ bài 52 lá; bài được chia đều, phần dư không dùng.
- Đây là biến thể Tiến Lên đơn giản hóa cho 2–8 người. Bản luật phổ biến thường chơi 2–4 người; nếu muốn đúng luật truyền thống, hãy giới hạn phòng 2–4.
- Bản beta hỗ trợ đánh rác, đôi, bộ ba, tứ quý và sảnh; so bài theo cùng loại và cùng số lá. Chưa triển khai đầy đủ luật chặt heo, chặt hàng, tới trắng, đền bài và tính điểm chuẩn.
- Chat, link mời theo mã phòng, trạng thái phòng và lượt đánh được đồng bộ trực tiếp qua Socket.IO.
- Chỉ dùng để giải trí bằng điểm ảo; không có nạp tiền, cá cược hoặc đổi thưởng.

## Ghi chú kỹ thuật
Bản demo lưu phòng trong bộ nhớ máy chủ. Nếu dịch vụ khởi động lại, phòng hiện tại sẽ mất. Hãy nâng cấp lưu trữ và xác thực nếu phát triển thành sản phẩm lâu dài.