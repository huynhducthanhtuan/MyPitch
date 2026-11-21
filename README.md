# MyPitch — Nhật ký sân cỏ

Ứng dụng frontend React + TypeScript + Vite để ghi lịch thi đấu, cập nhật kết quả và theo dõi bàn thắng, kiến tạo, số phút thi đấu theo năm/tháng.

## Chạy ứng dụng

```bash
npm install
npm run dev
```

Khi chưa cấu hình MockAPI, ứng dụng chạy ở chế độ xem trước và lưu dữ liệu trong `localStorage` của trình duyệt hiện tại. Banner trên trang sẽ cho biết chế độ này.

## Kết nối MockAPI

1. Tạo một project trên [MockAPI](https://mockapi.io/) và tạo resource tên `matches`.
2. Tạo file `.env.local` ở thư mục gốc:

   ```env
   VITE_MOCKAPI_URL=https://<project-id>.mockapi.io/api/v1/matches
   ```

3. Khởi động lại Vite sau khi thay đổi biến môi trường.

Ứng dụng gửi `GET` để đọc danh sách, `POST` để tạo, `PUT /matches/:id` để cập nhật và `DELETE /matches/:id` để xóa. Các trường của resource:

| Trường                        | Kiểu             | Ý nghĩa                     |
| ----------------------------- | ---------------- | --------------------------- |
| `opponent`                    | string           | Tên đối thủ                 |
| `competition`                 | string           | Giải đấu                    |
| `date`                        | string           | Ngày thi đấu (`YYYY-MM-DD`) |
| `time`                        | string           | Giờ thi đấu (`HH:mm`)       |
| `venue`                       | string           | Tên sân                     |
| `status`                      | string           | `scheduled` hoặc `played`   |
| `teamScore`, `opponentScore`  | number hoặc null | Tỷ số hai đội               |
| `goals`, `assists`, `minutes` | number           | Chỉ số cá nhân              |

Tỷ lệ thắng/hòa/thua được tính từ tỷ số, tránh lưu trạng thái kết quả không khớp với bàn thắng hai đội. Chỉ số tổng hợp được lọc theo năm đã chọn; biểu đồ cho phép chọn tháng để lọc danh sách trận.

## Lệnh kiểm tra

```bash
npm run lint
npm run build
```
