## Thay đổi

Các màn hình ngoài luồng tiếp nhận vẫn dùng nhiều cỡ chữ nhỏ và bố cục khác nhau, khó đọc khi review ở zoom 100%. Thay đổi này dùng chung hệ thống navy và chữ 32/23/16px theo trang tiếp nhận, tách các component UI dùng chung, làm rõ bảng/bộ lọc/chi tiết, chuyển chi tiết sơ đồ sang drawer ở viewport nhỏ và sửa bản in báo cáo nền trắng.

Tổng quan ưu tiên công việc và hồ sơ gần đây; phản ánh thêm lọc ngày tiếp nhận; nhật ký thêm người thao tác và ngày, chi tiết trước/sau mở rộng; danh sách tài khoản được ưu tiên trước phần giới thiệu quyền. Giữ dữ liệu, lưu trữ, quan hệ và phạm vi quyền mô phỏng hiện có.

## Kiểm tra

- `pnpm exec tsc --noEmit`, `pnpm build`: đạt.
- Chromium 1440 × 900 và 1280 × 720: kiểm tra giao diện, overflow, drawer, vai trò và PDF trắng.
- Luồng PA-013 → kiểm tra → xác nhận 4 phản ánh/60 triệu → hồ sơ → báo cáo; CUM-002/HS-002 độc lập; nháp, localStorage, lỗi lưu, tìm/lọc và reset: đạt.
- Hồi quy sơ đồ 1.000 bản ghi riêng, thời gian Việt Nam và migration: đạt.
- Bằng chứng: `docs/design-review/`; hướng dẫn và giới hạn: `docs/UNIFIED-DESIGN.md`.

Chỉ mô phỏng phía trình duyệt. Chưa kiểm tra Safari/Firefox/điện thoại. Không merge hoặc triển khai Production.

Base đề nghị: `feat/report-intake-redesign` (bản intake mới nhất tại thời điểm bắt đầu). Head: `feat/unified-workspace-design`.
