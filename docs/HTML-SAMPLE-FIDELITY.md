# Thiết kế theo scamgraph.html

Nhánh: `feat/scamgraph-html-fidelity`, kế thừa `feat/ravao-light-workspace` tại `381a6af50f8c85d57b276d7f4fa15ac33d54b0b1`.

Đã đọc AGENTS.md và HTML người dùng cung cấp. Bản mẫu nguyên gốc lưu ở `docs/design-reference/scamgraph.html` để đối chiếu; không thực thi JavaScript nghiệp vụ của file này trong ứng dụng.

## Login và hiệu ứng

- Bám bố cục mẫu: header 80px, thương hiệu bên trái, nút sáng/tối bên phải; bảng mạng kính nổi bên trái và thông điệp/nút truy cập bên phải.
- Giữ tiêu đề sản phẩm, gradient xanh–cyan, hai nút pill đỏ/trung tính, nền radial và khung kính mờ. Mặc định giao diện tối như `html.dark` của mẫu; có thể đổi sáng và lưu lựa chọn riêng ở `scamgraph-appearance`.
- Bảng minh họa có thanh tiêu đề, ba chấm màu, mạng nút, đường nét đứt chạy, tia quét và dao động phối cảnh 6 giây. Dùng SVG/CSS thay canvas/vòng lặp JS của mẫu để giới hạn tải; không dùng nó làm nguồn dữ liệu nghiệp vụ.
- Nút “Tài khoản Cán bộ” mở hộp xác thực theo mẫu: viền xanh trên cùng, nút VNeID, trường tài khoản/mật khẩu, nút đăng nhập. Giữ thêm select đủ bảy vai trò, hiện/ẩn mật khẩu và hướng dẫn tài khoản mẫu để không mất chức năng cũ.
- Người dân vẫn có vai trò và trang gửi phản ánh riêng. VNeID/QR luôn ghi rõ mô phỏng, không kết nối thật, không nhận định danh thật. Đổi các chữ “Live”, “trực tuyến 24/7”, “phát hiện” ở bảng minh họa thành nhãn giả lập; không thể hiện đây là hệ thống đang truy vết thật.
- Có `prefers-reduced-motion` để tắt chuyển động theo thiết lập hệ điều hành. Các hiệu ứng không chặn thao tác, không thay đổi vị trí nút trong biểu mẫu nghiệp vụ.

## Workspace và nghiệp vụ

Áp dụng card kính, nền và màu sáng/tối, hover nhẹ, chuyển cảnh 0.28 giây, đường nối động khi chọn quan hệ. Giữ cấu trúc sidebar và toàn bộ bảy phân hệ. Không nhập dữ liệu hoặc logic xử lý yếu hơn từ bản HTML.

`src/App.tsx` chỉ thêm import và nút AppearanceToggle vào header. Các handler nghiệp vụ hiện có giữ nguyên. `LinkGraph.tsx`, `ReportIntake.tsx`, `types.ts`, `demoTime.ts`, `intakeModel.ts`, `Modal.tsx`, package và lockfile được đối chiếu và không thay đổi. Bằng chứng ở `docs/html-sample-review/preservation.json`.

Các hiệu ứng quan hệ chỉ là cách vẽ, không làm đổi thực thể, nguồn chứng cứ, điểm ưu tiên, thành viên cụm hoặc phạm vi hồ sơ. Thông tin tài khoản, mật khẩu giả lập và xử lý đăng nhập vẫn dùng React gốc; không sử dụng hàm login bỏ kiểm tra của HTML mẫu.

## Kiểm tra đã chạy

- TypeScript và production build: đạt.
- Các màn hình nghiệp vụ/luồng chính ở Chromium 1440 × 900 và 1280 × 720: đạt, không cuộn ngang toàn trang, drawer/modal đóng được, không che các nút nghiệp vụ.
- Login sáng/tối ở cả hai kích thước trên và 390 × 844: đạt; lưu lựa chọn giao diện qua reload, mở/đóng modal, chọn vai trò, thông tin mẫu sai bị chặn, hiện/ẩn mật khẩu, quên mật khẩu, VNeID mô phỏng, Escape. Không lưu mật khẩu và không gọi tài nguyên ngoài trong test login/edge.
- Luồng 12 phản ánh/45 triệu → PA-013 15 triệu → 13 phản ánh → kiểm tra → xác nhận 4 phản ánh/60 triệu → hồ sơ đủ 4 phản ánh → phân công/nhận định → báo cáo: đạt.
- CUM-002 riêng 25 triệu; HS-002/PA-008 riêng 30 triệu; tìm/lọc, nháp và trạng thái qua reload, lỗi lưu rollback, reset có xác nhận, nhật ký và quyền chỉ xem: đạt.
- Sơ đồ gom nhóm, mở rộng, nguồn/phân trang, thử tải riêng 1.000 bản ghi, migration và ngày Việt Nam: đạt.
- Bộ kiểm thử: `sample-matching.cjs`, `design.cjs`, `browser.cjs`, `edge.cjs`, `intake.cjs`, `revision.cjs`, `fluent.cjs`; kiểm tra thời gian và model ID cũng đạt.
- 59 PNG, JSON và PDF ở `docs/html-sample-review/`. Đã xem trực quan landing, modal, workspace và trang đầu PDF. PDF giữ nền trắng kể cả khi giao diện đang tối.

## Chạy

Node 24 và pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm dev --host 0.0.0.0
```

Kiểm tra bản build:

```sh
pnpm exec tsc --noEmit
pnpm build
pnpm preview --host 0.0.0.0 --port 8444
```

Chọn “Tài khoản Cán bộ” để mở hộp xác thực; tài khoản tự điền theo vai trò, mật khẩu mẫu `demo1234`. Người dân có trong select vai trò. Nút mặt trời/mặt trăng đổi giao diện mà không thay đổi dữ liệu demo.

Kiểm thử trong môi trường hiện tại:

```sh
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE=/workspace/.test-tools/node_modules/playwright node tests/sample-matching.cjs
```

Máy khác cần module Playwright và Chromium phù hợp. `TEST_OUTPUT` chọn thư mục ảnh/kết quả.

## Giới hạn và khác biệt có chủ đích

Không cam kết giống pixel 100%: file mẫu dùng CDN/font Be Vietnam Pro từ xa; môi trường chặn truy cập Google Fonts (403), nên ứng dụng dùng font dự phòng hiện có, không thêm yêu cầu tải từ xa. Bảng minh họa SVG/CSS thay canvas và không hiển thị IP/cảnh báo như dữ liệu thật. Hộp xác thực cao hơn mẫu vì giữ các điều khiển vai trò và trợ giúp gốc. Đã kiểm tra workspace chủ yếu ở hai kích thước desktop, chỉ login kiểm tra thêm điện thoại; chưa kiểm tra Safari/Firefox. Đây vẫn là demo localStorage, phân quyền giao diện, không có backend/OCR/AI/VNeID thật. Không merge hoặc triển khai Production.
