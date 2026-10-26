Chuyển demo từ giao diện tối sang giao diện quản trị trắng–xanh theo ảnh và HTML Ravao được cung cấp: sidebar trắng, tiêu đề xanh/gạch xanh–đỏ, card bo góc, đầu bảng xanh đậm và ô nhập nền sáng. Login có phần quy trình 01–03 bên trái và khung truy cập bên phải, xếp dọc trên màn hình hẹp.

Giữ toàn bộ menu và chức năng hiện có. App.tsx, LinkGraph.tsx, ReportIntake.tsx và các tệp dữ liệu/lưu trữ không đổi so với base; bằng chứng hash trong docs/ravao-review/preservation-check.json. Không nhập dữ liệu nhân viên, ảnh, danh bạ hoặc nội dung CheckInPRO.

Kiểm tra: TypeScript/build đạt; giao diện Chromium 1440×900 và 1280×720, login thêm 390×844; luồng PA-013 → 4 phản ánh/60 triệu → hồ sơ/báo cáo, dữ liệu CUM-002/HS-002 riêng, localStorage, quyền và sơ đồ 1.000 bản ghi đạt. Đầu bảng và ô nhập kiểm tra tương phản ≥4.5:1. 44 ảnh/PDF và JSON ở docs/ravao-review/.

Hướng dẫn/giới hạn: docs/RAVAO-LIGHT-DESIGN.md. Bám ảnh/DOM, không khẳng định sao chép pixel CSS website gốc. Chưa kiểm tra Safari/Firefox hoặc toàn bộ nghiệp vụ trên điện thoại. Không merge hoặc triển khai Production.

Base: feat/fluent-login-refresh. Head: feat/ravao-light-workspace.
