# Phân Tích Và Truy Vết Tội Phạm Công Nghệ Cao

Ứng dụng React 19 + TypeScript + Vite 8 dùng dữ liệu hư cấu để review nghiệp vụ. Có phân quyền theo tài khoản, vai trò, đơn vị, người được giao và trạng thái xử lý. Không kết nối backend, VNeID, OCR/AI hoặc API bên ngoài.

## Chạy dự án

Yêu cầu Node.js 24 và pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm dev --host 0.0.0.0
```

Mở địa chỉ Vite in ra ở terminal. Để chạy bản build:

```sh
pnpm exec tsc --noEmit
pnpm build
pnpm preview --host 0.0.0.0 --port 8444
```

## Tài khoản và công việc

Giữ giao diện đăng nhập hiện có. Các lựa chọn cán bộ tại login mở tài khoản mẫu tương ứng; quyền thực tế được lấy từ hồ sơ tài khoản đã lưu. Trong ứng dụng, **Tài khoản thử nghiệm** cho phép chuyển danh tính để kiểm tra quy trình, độc lập với việc quản trị phân quyền.

| Vai trò | Công việc chính |
| --- | --- |
| Người dân / Tổ chức | Gửi, xem phản ánh của mình, bổ sung thông tin khi được yêu cầu |
| Cán bộ tiếp nhận | Kiểm tra, ghi chú, yêu cầu bổ sung, đánh dấu không hợp lệ, chuyển phân tích |
| Cán bộ phân tích | Kiểm tra trích xuất, ghi nhận định, xác nhận/loại bỏ liên kết, tạo hồ sơ chờ phân công |
| Cán bộ xử lý hồ sơ | Xử lý hồ sơ được giao, ghi tiến độ/nhận định, lập và trình báo cáo |
| Lãnh đạo | Phân công, ưu tiên, chỉ đạo, yêu cầu chỉnh sửa hoặc phê duyệt báo cáo |
| Kiểm tra, giám sát | Tra cứu nhật ký và lịch sử thay đổi trong đơn vị; không sửa nghiệp vụ |
| Quản trị hệ thống | Quản lý quyền, đơn vị, trạng thái tài khoản nội bộ và xem nhật ký quản trị |

Có hai tài khoản xử lý để thể hiện phạm vi hồ sơ được giao: **Lê Minh Anh** (`xu.ly.demo`) và **Trần Quốc Huy** (`xu.ly.huy`). HS-001 ban đầu thuộc Lê Minh Anh, HS-002 thuộc Trần Quốc Huy. Hồ sơ mới chưa được tự phân công.

Chi tiết quyền, chuyển trạng thái, ảnh và kết quả kiểm tra: [docs/ROLE-WORKSPACES.md](docs/ROLE-WORKSPACES.md).

## Luồng kiểm tra nghiệp vụ

1. Người dân gửi tình huống mẫu PA-013; có thể tạo phản ánh nhập tay riêng. PA-013 không được tạo sẵn.
2. Cán bộ tiếp nhận mở phiếu, ghi chú và chọn cán bộ nhận phân tích. Có thể yêu cầu người gửi bổ sung trước khi bàn giao.
3. Cán bộ phân tích được giao kiểm tra trích xuất, lưu thông tin và xác nhận liên kết khi đủ căn cứ.
4. Cán bộ phân tích tạo hồ sơ từ cụm. Lãnh đạo phân công người xử lý.
5. Người được giao cập nhật nhận định, lưu bản nháp và trình báo cáo. Lãnh đạo yêu cầu chỉnh sửa hoặc phê duyệt.
6. Sau phê duyệt, sửa tiếp phải tạo phiên bản mới. Giám sát đối chiếu toàn bộ nhật ký.

Ban đầu có 12 phản ánh. CUM-001 có 3 phản ánh/45 triệu đồng; tạo PA-013 thêm 15 triệu thành 13 phản ánh, chỉ sau xác nhận liên kết cụm mới thành 4/60 triệu. CUM-002 giữ 3/25 triệu. PA-008 và HS-002 độc lập, báo cáo HS-002 lấy đúng 1 phản ánh/30 triệu.

## Dữ liệu trình duyệt

Phản ánh, hồ sơ, phiên bản báo cáo, tài khoản và nhật ký được lưu trong localStorage theo origin. Bản nháp tiếp nhận được lưu riêng theo tài khoản. Dữ liệu phiên cũ được bổ sung trường mới; tên người phụ trách chưa định danh được giữ lại và không tự gán cho người đăng nhập.

Đặt lại dữ liệu thử nghiệm chỉ nằm trong tiện ích của quản trị, có xác nhận, giữ nguyên tài khoản và nhật ký cũ. Các lần đăng nhập/chuyển tài khoản không tự đặt lại dữ liệu.

## Kiểm thử hiện tại

```sh
node tests/access.mjs
node tests/intake-model.mjs
TZ=America/New_York node tests/time.mjs
```

Kiểm thử trình duyệt dùng công cụ riêng, không thay lockfile ứng dụng:

```sh
npm install --prefix .test-tools playwright@1.56.1 --no-audit --no-fund
.test-tools/node_modules/.bin/playwright install chromium
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE="$PWD/.test-tools/node_modules/playwright" node tests/roles.cjs
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE="$PWD/.test-tools/node_modules/playwright" node tests/roles-negative.cjs
```

Các script dùng Chromium hệ thống nếu có `/usr/bin/chromium`; có thể chỉ định `CHROMIUM_PATH`, nếu không sẽ dùng Chromium của Playwright. `TEST_OUTPUT` đổi nơi lưu ảnh/JSON. Mỗi lần chạy dùng phiên trình duyệt riêng.

`roles.cjs` kiểm tra luồng xuyên suốt và giao diện 1440×900, 1280×720. `roles-negative.cjs` kiểm tra ngoài phạm vi, phiên cũ, bản nháp, tài khoản khóa, lỗi lưu và đặt lại có xác nhận. Các script giao diện trước đợt phân quyền được giữ để tham khảo lịch sử; chúng giả định bộ chọn vai trò và quyền sửa chung cũ, không phải bộ kiểm thử chấp nhận cho phiên bản này.

## Giới hạn

Quyền được kiểm tra trong ứng dụng phía trình duyệt, không phải cơ chế bảo mật máy chủ. Bộ chọn tài khoản phục vụ thử nghiệm, không phải xác thực thật. Dữ liệu không đồng bộ giữa người dùng/máy khác; chưa hỗ trợ sửa đồng thời trên nhiều tab. Tài liệu đính kèm và trích xuất vẫn là mô phỏng. Không dùng ứng dụng này để tiếp nhận thông tin thật.

Chưa tự merge hoặc chạy lệnh triển khai Production. Cấu hình Vercel hiện có được giữ nguyên.
