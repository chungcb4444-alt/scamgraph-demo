# Giao diện sáng theo ảnh và HTML mẫu Ravao

Nhánh `feat/ravao-light-workspace`, xuất phát từ `feat/fluent-login-refresh` tại `06800280908c75e91ba1a814b9a8772ef178523a`.

## Căn cứ thiết kế

Website mẫu bị chặn truy cập từ môi trường (403). Bản sửa dựa trên HTML và hai ảnh người dùng cung cấp sau đó: phần quy trình nền xanh rất nhạt, các khối trắng bo góc; màn hình quản trị có sidebar trắng, tiêu đề xanh với gạch nhấn xanh–đỏ và đầu bảng xanh đậm. Không sao chép danh bạ, ảnh cá nhân, thông tin liên hệ, logo hoặc nội dung nghiệp vụ CheckInPRO vào ứng dụng.

Đã đọc AGENTS.md và kiểm tra mã nguồn hiện tại trước khi chỉnh. Thiết kế được áp dụng lên dự án React đang có.

## Những gì thay đổi

- Hệ màu dùng chung chuyển sang nền trắng/xám rất nhạt; nội dung xanh đen, chữ phụ xám; xanh #19489d cho nút chính và đầu bảng. Giữ trạng thái xanh lá/vàng/đỏ kèm nhãn, không chỉ dựa vào màu.
- Sidebar trắng, mục active xanh nhạt, chữ và đường nhấn xanh. Giữ đủ bảy mục điều hướng nghiệp vụ.
- Tiêu đề xanh, gạch nhấn xanh–đỏ theo ảnh. Card trắng viền nhẹ, bo góc; bảng có đầu xanh/chữ trắng, đường phân cách mảnh, cuộn trong khung.
- Đồng bộ tổng quan, danh sách/chi tiết phản ánh, luồng tiếp nhận, sơ đồ, cảnh báo, hồ sơ/báo cáo, tài khoản và nhật ký. Các modal/drawer và ô nhập cũng đổi sang nền sáng.
- Sơ đồ giữ cấu trúc và tương tác; nút trắng, nhóm xanh nhạt, đường nối xanh. Giữ toàn bộ nội dung nguồn và bộ lọc.
- Login có header riêng và bố cục hai cột: giới thiệu quy trình 01–03 theo phong cách ảnh mẫu, khung đăng nhập trắng bên phải. Vẫn đủ bảy vai trò, hiện/ẩn mật khẩu, hướng dẫn tài khoản mẫu và VNeID/QR mô phỏng. Màn hình hẹp xếp dọc.
- Biểu tượng khiên/vân tay hiện có giữ hình dạng, đổi màu xanh phù hợp nền trắng.
- Tailwind chỉ quét `src/`, tránh tạo CSS cho HTML tham chiếu trong tài liệu. Không thêm dependency, CDN, font từ xa hoặc API.

## Không bỏ chức năng

Các tệp sau được đối chiếu byte với bản trước và **không thay đổi**: `src/App.tsx`, `src/LinkGraph.tsx`, `src/ReportIntake.tsx`, `src/types.ts`, `src/demoTime.ts`, `src/intakeModel.ts`, `src/ui/Modal.tsx`, cùng package/lockfile. Bằng chứng hash ở `docs/ravao-review/preservation-check.json`.

Không bỏ menu, tab, nút nghiệp vụ, nguồn bằng chứng, trường dữ liệu, lịch sử, phân quyền hoặc localStorage. Nội dung thêm ở login chỉ giới thiệu quy trình, không thay đổi xử lý đăng nhập/chọn vai trò. Đây vẫn là bản giả lập, không có xác thực/VNeID thật.

## Kiểm tra đã thực hiện

- TypeScript: `pnpm exec tsc --noEmit` đạt.
- Production build: `pnpm build` đạt.
- Chromium 1440 × 900 và 1280 × 720: kiểm tra từng màn hình chính, bảy mục điều hướng, active tab, lọc ngày/người thao tác, trạng thái rỗng, modal/drawer, vai trò và không tràn ngang toàn trang.
- Đầu bảng gồm cả cột thao tác sticky đều xanh/chữ trắng. Tương phản chữ đầu bảng và dữ liệu ô nhập đạt ít nhất 4.5:1 trong tình huống kiểm tra.
- Login kiểm tra thêm 390 × 844: chọn vai trò, mật khẩu mẫu, hiện/ẩn mật khẩu, quên mật khẩu, VNeID mô phỏng, Escape, không lưu mật khẩu, không gọi tài nguyên ngoài.
- Luồng chính đạt: 12 phản ánh/CUM-001 45 triệu → tạo PA-013 15 triệu (tổng 13) → kiểm tra trích xuất → xác nhận liên kết 4 phản ánh/60 triệu → hồ sơ đầy đủ → phân công/nhận định → báo cáo đúng hồ sơ.
- CUM-002 riêng 25 triệu, HS-002/PA-008 độc lập 30 triệu; lưu/khôi phục nháp, lỗi localStorage rollback, reset có xác nhận, vai trò chỉ xem và nhật ký trước/sau: đạt.
- Sơ đồ: tìm/lọc, gom nhóm theo hành vi/ngày, mở rộng/thu gọn, nguồn và phân trang, zoom/fit, thử tải riêng 1.000 bản ghi: đạt. Migration và ngày Việt Nam cũng đạt.
- Đã chụp 44 ảnh và xuất PDF mẫu, xem ảnh đối chiếu và render PDF kiểm tra nền trắng. Kết quả JSON và ảnh ở `docs/ravao-review/`.

## Cách chạy

Node 24 và pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm dev --host 0.0.0.0
```

Xem bản build:

```sh
pnpm build
pnpm preview --host 0.0.0.0 --port 8444
```

Đăng nhập bằng tài khoản được điền sẵn theo vai trò; mật khẩu mẫu `demo1234`. Chọn **Cán bộ phân tích** để xem workspace đầy đủ; **Người dân / Tổ chức** có luồng riêng theo quyền mô phỏng.

Bộ kiểm thử mới `tests/light-workspace.cjs` kiểm tra thiết kế sáng, menu và tương phản. Các bộ hồi quy hiện có vẫn giữ: design, fluent, browser, edge, intake, revision. Trong môi trường này:

```sh
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE=/workspace/.test-tools/node_modules/playwright TEST_OUTPUT=docs/ravao-review node tests/light-workspace.cjs
```

Máy khác cần cài Playwright/Chromium hoặc chỉ đường dẫn tương ứng; không cần thêm dependency chạy ứng dụng.

## Giới hạn

Dựa theo ảnh và DOM được cung cấp, không phải bản sao pixel của toàn bộ website mẫu vì không truy cập được CSS/asset gốc. Chưa kiểm tra Safari/Firefox; nghiệp vụ tập trung hai kích thước desktop, chỉ login kiểm tra thêm điện thoại. Dữ liệu giả lập/localStorage và phân quyền giao diện không thay thế backend. Bảng rộng cuộn trong khung. Không merge hoặc triển khai Production.
