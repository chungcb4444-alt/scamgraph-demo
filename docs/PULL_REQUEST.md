## Hoàn thiện demo phân tích và truy vết

PA-013 trước đây được tự gán vào CUM-001 khi gửi và biểu mẫu trích xuất chỉ lưu được điện thoại. Nay phản ánh mới được giữ độc lập cho tới khi cán bộ lưu dữ liệu đã kiểm tra, xem căn cứ và xác nhận liên kết; có thể loại bỏ/xem xét lại đề xuất. CUM-001 giữ 3 phản ánh/45 triệu trước xác nhận và chuyển thành 4/60 triệu sau xác nhận; hồ sơ mới chứa đúng 4 phản ánh.

- Chỉnh 6 màn hình theo ảnh tham chiếu: navy/xanh đen, nút tím/xanh, chữ rõ hơn; tách cổng người dân và vai trò cán bộ tiếp nhận.
- Giữ sơ đồ, cảnh báo, báo cáo; sửa điều hướng/tab/nút, lọc và tìm kiếm. CUM-002 và HS-002 dùng đúng dữ liệu riêng, PA-008 độc lập.
- Lưu localStorage cho dữ liệu và tiến độ biểu mẫu; reset có xác nhận; nhật ký ghi tác nhân, đối tượng, giá trị trước/sau. Phân quyền/VNeID/QR/trích xuất chỉ mô phỏng, không gọi backend/API ngoài.
- Bổ sung cấu hình site để checkout mới build được, README với kịch bản review và kiểm thử Playwright độc lập với lockfile ứng dụng.

## Kiểm tra

- `pnpm install --frozen-lockfile`: đạt.
- `pnpm exec tsc --noEmit`: đạt.
- `pnpm build`: đạt.
- Chromium trên production preview: luồng chính đạt tại 1440×900 và 1280×720, thêm 17 nhóm tình huống biên đạt. Các nhóm có nhiều assertion; xem JSON để biết phạm vi.
- Screenshot đúng kích thước, PDF HS-003 và báo cáo chi tiết trong `docs/review` và `docs/TEST-RESULTS.md`.

Giới hạn: dữ liệu giả lập, localStorage trên một trình duyệt, không xác thực/phân quyền bảo mật thật, chưa kiểm chứng mobile/trình duyệt ngoài Chromium hoặc độ giống từng pixel. Chưa triển khai ra dịch vụ bên ngoài. Không tự merge PR này.
