Ứng dụng còn dùng giao diện login hai cột và các nhấn tím/đỏ khác với mẫu Login.html mới. Chuyển sang login một khung acrylic giữa màn hình, logo khiên/vân tay và hệ màu cyan–xanh dương dùng chung cho toàn bộ workspace. Tinh gọn header, modal, nhãn thời gian và cột truy cập tài khoản không có dữ liệu thực; giữ dữ liệu, nguồn bằng chứng, luồng xử lý và phân quyền mô phỏng.

Login có chọn vai trò/tài khoản mẫu, hiện/ẩn mật khẩu và VNeID/QR ghi rõ mô phỏng. Không lưu mật khẩu hoặc tải CDN/API ngoài. Nền mạng SVG tĩnh thay vòng lặp canvas của mẫu.

Kiểm tra: TypeScript và build đạt; Chromium 1440×900, 1280×720 cho các trang/luồng chính; login kiểm tra thêm 390×844. Hồi quy PA-013 → 4 phản ánh/60 triệu → hồ sơ/báo cáo, HS-002/CUM-002 riêng, localStorage, vai trò, nhật ký và thử tải sơ đồ đạt. Chi tiết và ảnh: docs/FLUENT-LOGIN-REDESIGN.md, docs/fluent-review/.

Base: feat/unified-workspace-design. Head: feat/fluent-login-refresh. Chưa kiểm tra Safari/Firefox và nghiệp vụ trên điện thoại. Không merge hoặc triển khai Production.
