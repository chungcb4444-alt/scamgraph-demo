# Căn cột Tiếp nhận / Phân tích

Sửa ngày 29/10/2026, so với commit `4bc74d1`.

Nguyên nhân: hai trạng thái dùng flex theo độ dài nội dung. Nhãn tiếp nhận ngắn khiến vị trí phân tích dịch sang trái khoảng 23 px ở những hàng như PA-007/009/012.

Thay đổi chỉ ở `src/App.tsx` và `src/reportsLayout.css`:

- Giữ bảy cột dữ liệu; tiêu đề Tiếp nhận và Phân tích nằm trên hai phần có độ rộng bằng nhau trong cùng một cột.
- Cả tiêu đề và trạng thái dùng cùng lưới; chữ, chấm trạng thái và khoảng đệm giữ vị trí cố định trên mọi hàng.
- Căn giữa theo chiều cao hàng để mã, nội dung, trạng thái và thao tác không bị dồn lệch theo hàng có nhiều dòng.
- Giữ màu, nội dung trạng thái, nút thao tác và cuộn ngang của bảng. Sửa màu chữ tiêu đề thao tác ghim để đọc được ở giao diện sáng.

Kiểm tra đã đạt:

- TypeScript và Vite build.
- Chromium ở 1920×1080, 1440×900, 1280×720, cả sáng/tối: kiểm tra toàn bộ 12 hàng. Hai nhãn thẳng với tiêu đề và cùng vị trí giữa các hàng, không bị cắt chữ; không tràn ngang toàn trang.
- Giữ bảy cột và mở đúng phản ánh/tab xử lý từ nút thao tác. Chuỗi dữ liệu localStorage của phản ánh, hồ sơ, tài khoản và nhật ký không đổi khi chỉ xem và điều hướng.
- Bộ kiểm thử `tests/reports-layout.cjs` đạt ở hai kích thước 1440×900 và 1280×720, cả sáng/tối; giữ bộ lọc, tab, bản nháp và quyền chỉ đọc.

Kết quả đo: [results.json](results.json). Kết quả bộ kiểm thử hiện có: [layout-results.json](layout-results.json).

Ảnh:

- [1920 tối, trước sửa](1920-dark-before.png) → [sau sửa](1920-dark-after.png).
- [1440 sáng](1440-light-after.png), [1440 tối](1440-dark-after.png).
- [1280 sáng](1280-light-after.png), [1280 tối](1280-dark-after.png). Ảnh màn hình nhỏ cuộn bảng sang phải để thấy đầy đủ hai trạng thái và nút thao tác.

Không sửa dữ liệu, phân quyền, chuyển trạng thái, login hoặc sơ đồ. Không merge hoặc triển khai Production.
