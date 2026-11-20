Bám thiết kế scamgraph.html do người dùng cung cấp, giữ nghiệp vụ React hiện có. Login chuyển sang bảng mạng kính nổi bên trái, nội dung gradient và nút pill bên phải, hộp xác thực mở theo CTA. Thêm sáng/tối lưu lựa chọn, scanner, chuyển động bảng minh họa, chuyển cảnh/hover và reduced motion. Không dùng phần JS nghiệp vụ của HTML mẫu.

App.tsx chỉ thêm nút giao diện; dữ liệu, handler và các module nghiệp vụ không bị thay. Giữ bảy vai trò, mật khẩu mẫu, VNeID/QR ghi rõ mô phỏng và luồng công dân riêng.

Kiểm tra: TypeScript/build, Chromium 1440×900 và 1280×720, login thêm 390×844; luồng PA-013 → 4 phản ánh/60 triệu → hồ sơ → báo cáo; CUM-002/HS-002 riêng, localStorage, quyền và sơ đồ: đạt. Ảnh/JSON/PDF: docs/html-sample-review/. Chi tiết: docs/HTML-SAMPLE-FIDELITY.md.

Giới hạn: font CDN mẫu không tải được trong môi trường; SVG/CSS thay canvas; không khẳng định giống pixel 100%. Chưa kiểm tra Safari/Firefox. Không merge/Production.

Base: feat/ravao-light-workspace. Head: feat/scamgraph-html-fidelity.
