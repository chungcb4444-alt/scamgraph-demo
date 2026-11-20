## Sửa thời gian, sơ đồ liên kết và trạng thái theo note review

Base: `improve-demo_V1`. Head: `feat/demo-time-graph-status`. Không merge hoặc triển khai Production.

Ngày mẫu trước đây ghi cứng năm 2025, màu badge lấy từ trạng thái gốc trong khi nhãn lại được quy đổi, sơ đồ dùng vị trí cố định và vẽ mọi phản ánh, header sticky phủ nội dung khi cuộn. Thay đổi này sửa tận các nguyên nhân đó và giữ các chức năng demo hiện có.

- Chuẩn hóa ISO + hiển thị giờ Việt Nam dd/MM/yyyy HH:mm; tách phát sinh/tiếp nhận/cập nhật, mẫu tương đối ngày hiện tại và biểu đồ 7 ngày lịch có ngày 0.
- Migration giữ bản ghi, số tiền, nhận định, phạm vi hồ sơ, nhật ký và ngày lịch sử cũ; lưu backup trước chuyển đổi. Chỉ reset có xác nhận mới tạo lại mẫu theo ngày hiện tại.
- Sơ đồ SVG theo cột, nhóm hành vi/ngày, mở rộng/thu gọn, giới hạn nút/cạnh, tìm/lọc/zoom/fit, chọn nút/cạnh để xem nguồn và tổng đầy đủ. Nguồn có tìm kiếm/phân trang. Thử tải riêng 1.000 bản ghi không làm thay đổi dữ liệu demo.
- Một bảng quy định/component màu trạng thái; kiểm tra xong màu xanh, chờ màu xám; rủi ro tách riêng.
- Header theo luồng trang, không phủ nội dung hoặc dùng khoảng bù cố định.
- PA-013 15 triệu vẫn được sửa 19 triệu với nhật ký trước/sau: CUM-001 sau xác nhận tương ứng 60 hoặc 64 triệu. Hồ sơ tạo trước đó không tự nhận thêm PA từ cụm.

## Validation

TypeScript và production build đạt. `tests/time.mjs` đạt ở UTC và America/New_York. `tests/browser.cjs`, `tests/edge.cjs`, `tests/revision.cjs` chạy Chromium trên production preview: luồng chính, trường biên, mốc nửa đêm Việt Nam, migration, snapshot danh sách PA, màu/header, nhóm/lọc/nguồn và thử tải đều đạt ở 1440×900 và 1280×720.

Đã quan sát 13 nút/29 cạnh khi mở rộng một trang trong bộ thử tải 1.000 bản ghi; không tuyên bố hiệu năng cho quy mô khác hoặc backend. Ảnh và JSON: `docs/review-v2`; giải thích đầy đủ/giới hạn: `docs/NOTE-REVISION.md`.
