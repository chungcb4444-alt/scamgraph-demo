## Thiết kế lại biểu mẫu gửi/tiếp nhận phản ánh

Base: `feat/demo-time-graph-statusV_2`. Head: `feat/report-intake-redesign`. Không merge hoặc triển khai Production.

Biểu mẫu trước đây cố định tình huống ngân hàng/PA-013, có nhiều khối phụ và chữ nhỏ. Thay đổi này tập trung vào tiếp nhận phản ánh và các phần dữ liệu/hiển thị cần thiết:

- Bốn bước rõ ràng, tên/nút theo vai trò, chữ 14–28px theo cấp, controls khoảng 46px, một nhãn demo; tài liệu chỉ ở bước Tài liệu, danh sách là liên kết phụ.
- Loại phản ánh dùng lại `behavior`, hỗ trợ Khác/Chưa xác định, gợi ý không ghi đè nội dung. Cho thời gian chưa nhớ, địa bàn chưa rõ, không/chưa rõ chuyển tiền, thông tin liên quan không bắt buộc. Kênh web tự ghi, cán bộ chọn nguồn khác có mô tả.
- Mã tự nhập duy nhất; PA-013 dành cho mẫu 15 triệu, có xác nhận ghi đè và mở mẫu đã tạo. Thành công chỉ sau khi localStorage được ghi; ngăn bấm trùng và hoàn lại khi bước lưu lỗi. Có thể gửi phiếu khác mà không reset.
- Người dân có danh sách/chi tiết chỉ đọc; cán bộ kiểm tra và chỉnh loại với nhật ký trước/sau. Danh sách, bộ lọc, chi tiết và báo cáo dùng loại/mô tả đúng; giữ phân loại ban đầu.

## Validation

- TypeScript và production build đạt.
- `tests/intake.cjs`: các trường hợp yêu cầu, lỗi lưu giả lập, loại/nguồn/nhật ký/báo cáo, mã mới sau mẫu, font/không che thao tác, ở 1440×900 và 1280×720 đạt; có ảnh trước/sau và JSON tại `docs/intake-review`.
- Các runner hồi quy main/edge/revision đạt; giữ luồng xác nhận liên kết 15→60 hoặc 19→64, dữ liệu hồ sơ/báo cáo, ngày Việt Nam/migration và thử tải 1.000. Test thời gian và cấp mã/nhãn dữ liệu cũ cũng đạt.

Chi tiết: `docs/INTAKE-REDESIGN.md`. Giới hạn: localStorage, quyền UI mô phỏng, tài liệu mẫu HTML, chưa backend/upload thật/đồng bộ đa client; chưa kiểm chứng mobile hoặc trình duyệt ngoài Chromium.
