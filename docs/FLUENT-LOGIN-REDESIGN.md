# Đồng bộ theo mẫu Login.html

Nhánh `feat/fluent-login-refresh`, kế thừa `feat/unified-workspace-design` tại `fd6473245c4f40d14c358585076ec767504e16ca`. Đã đọc AGENTS.md và kiểm tra mã nguồn/CSS hiện có trước khi sửa. Mẫu người dùng cung cấp được lưu nguyên bản tại `docs/design-reference/Login.html` để đối chiếu; đây là tài liệu tham chiếu, không phải trang được ứng dụng tải hoặc thực thi.

## Thiết kế và tinh gọn

- Thay login hai cột bằng một khung giữa màn hình: nền #050b14, ánh sáng xanh/cyan, acrylic mờ, viền mảnh và bo góc 16px theo mẫu. Chuyển biểu tượng khiên/vân tay/vi mạch của mẫu thành SVG React dùng chung ở login, sidebar và báo cáo.
- Tái sử dụng hệ thống CSS chung để đổi màu trang, card, bảng, tab, sidebar, nút, ô nhập, sơ đồ, drawer và modal sang xanh dương/cyan. Segoe UI được ưu tiên, dự phòng font sans-serif hệ thống hỗ trợ tiếng Việt. Không cần tải font, icon hay Tailwind từ CDN.
- Nút VNeID đỏ theo mẫu, nút thao tác chính xanh dương, trạng thái thành công/cảnh báo/lỗi giữ xanh lá/vàng/đỏ kèm nhãn. Sidebar active đổi sang nền xanh tối và đường nhấn cyan.
- Bỏ cột giới thiệu và các khối tính năng ở login; thay nhiều tab vai trò bằng một select gọn. Giữ đủ bảy vai trò và tách người dân khỏi cán bộ.
- Login điền sẵn tài khoản giả lập theo vai trò, mật khẩu mẫu `demo1234`; có hiện/ẩn mật khẩu, kiểm tra thông tin mẫu và hướng dẫn khi bấm quên mật khẩu. Không có xác thực thật và không lưu mật khẩu vào localStorage.
- Nút VNeID mở QR minh họa, luôn ghi rõ mô phỏng, không quét bằng ứng dụng thật, không kết nối/thu thập định danh. Có nút tiếp tục bằng tài khoản demo, đóng bằng Escape và quản lý focus qua modal chung.
- Nền mạng liên kết ở login dùng SVG tĩnh, không chạy vòng lặp canvas/radar trên các màn hình nghiệp vụ. Không thêm hiệu ứng giả “đang kết nối VNeID”.
- Bỏ tiêu đề lặp trên topbar, dòng mô tả lặp dưới logo sidebar, tên sản phẩm lặp trong mọi modal và con số cảnh báo không nhãn ở header. Còn một nhãn demo chung trong workspace; báo cáo giữ nhãn giả lập riêng để in.
- Bảng phản ánh bỏ dòng “Tiếp nhận · giờ Việt Nam” lặp ở từng hàng, giữ thời gian thật của bản ghi và chú thích múi giờ ở phần tóm tắt. Bộ lọc được xếp hai hàng với search rộng, không thu nhỏ chữ.
- Bảng tài khoản bỏ cột “Lần truy cập cuối” vì phần lớn chỉ chứa thông báo “chưa ghi nhận phiên thật”, giữ tài khoản/vai trò/đơn vị/trạng thái và nút sửa.
- Giữ các màn hình tổng quan, tiếp nhận, danh sách/chi tiết phản ánh, sơ đồ/cảnh báo, hồ sơ/báo cáo, tài khoản và nhật ký. Không xóa dữ liệu phản ánh, nguồn bằng chứng, lịch sử hay thông tin phân loại trước/sau.

## Kiểm tra

- `pnpm exec tsc --noEmit`: đạt.
- `pnpm build`: đạt; không thêm dependency và không thay đổi package/lockfile.
- Chromium 1440 × 900 và 1280 × 720: ảnh từng màn hình chính, không cuộn ngang toàn trang, một mục sidebar active, bộ lọc, tab, drawer, bảy vai trò, trạng thái rỗng và in/PDF trắng.
- Login còn kiểm tra 390 × 844: không tràn ngang, hiện/ẩn mật khẩu, mật khẩu mẫu sai bị chặn, hướng dẫn quên mật khẩu, chọn người dân vào đúng luồng, VNeID mô phỏng, Escape, không lưu mật khẩu và không gọi tài nguyên ngoài.
- Luồng chính: 12 phản ánh/CUM-001 45 triệu → PA-013 15 triệu → tổng 13 phản ánh → kiểm tra/trích xuất → xác nhận liên kết 4 phản ánh/60 triệu → tạo hồ sơ 4 phản ánh → phân công/nhận định → báo cáo đúng hồ sơ: đạt ở hai viewport.
- CUM-002 25 triệu, HS-002/PA-008 độc lập 30 triệu; nháp, tìm/lọc, localStorage, lỗi lưu rollback, reset có xác nhận, nhật ký trước/sau và quyền chỉ xem: đạt.
- Thử tải sơ đồ độc lập 1.000 bản ghi, gom nhóm, lọc, nguồn và phân trang, giữ phạm vi hồ sơ, migration và mốc ngày Việt Nam: đạt.
- Ảnh và JSON kết quả ở `docs/fluent-review/`, PDF mẫu nền trắng. Các thư mục review cũ được giữ để so sánh lịch sử.

## Chạy

Dùng Node 24, pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm dev --host 0.0.0.0
```

Kiểm tra build:

```sh
pnpm exec tsc --noEmit
pnpm build
pnpm preview --host 0.0.0.0 --port 8444
```

Các test trình duyệt nằm trong `tests/`. Môi trường hiện dùng module Playwright tại `/workspace/.test-tools/node_modules/playwright` và Chromium `/usr/bin/chromium`; máy khác cần cài hoặc chỉ đường dẫn tương ứng.

```sh
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE=/workspace/.test-tools/node_modules/playwright node tests/fluent.cjs
```

Bộ hồi quy: `tests/design.cjs`, `tests/browser.cjs`, `tests/edge.cjs`, `tests/intake.cjs`, `tests/revision.cjs`. `TEST_OUTPUT` chọn thư mục lưu ảnh/JSON.

## Giới hạn

Đây vẫn là demo localStorage và phân quyền mô phỏng phía giao diện; không có backend, OCR/AI hay VNeID thật. Cổng login chỉ nhận tài khoản mẫu, không phải giải pháp xác thực. Kiểm thử nghiệp vụ tập trung desktop; chỉ riêng login được kiểm tra thêm trên màn hình hẹp. Chưa kiểm tra Safari/Firefox. Bảng rộng cuộn trong khung. Không merge và không triển khai Production.
