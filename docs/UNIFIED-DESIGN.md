# Đồng bộ giao diện ứng dụng

Nhánh: `feat/unified-workspace-design`. Xuất phát từ `feat/report-intake-redesign` tại `457bf4060770757c7bfc8c218e63bdf2f324a92a`, là nhánh mới nhất chứa luồng tiếp nhận đã hoàn thiện khi bắt đầu công việc.

## Thay đổi

- Đọc AGENTS.md và kiểm tra mã nguồn/CSS trang tiếp nhận trước khi chỉnh. Chụp và xem các màn hình sau sửa. Giữ tên sản phẩm, biểu tượng, dữ liệu giả lập và cấu trúc localStorage.
- Gom các khai báo CSS trùng của các phiên bản sáng/tối vào hệ thống navy chung ở `src/index.css`. Cỡ chữ: tiêu đề trang 32px, tiêu đề khối 23px, nội dung và ô nhập 16px, bảng 15px, nhãn/nút/tab 15–16px, chú thích/badge 13–14px, sidebar 16px. Dùng system sans-serif hỗ trợ tiếng Việt, cũng là font thực tế dự phòng của trang tiếp nhận trước đây; không tải font từ dịch vụ ngoài.
- Token dùng chung cho màu nền, viền, chữ phụ, khoảng cách 24px, padding khối 24px và chiều cao điều khiển 46px. Không dùng CSS zoom hay transform để phóng toàn bộ ứng dụng.
- Tách các component dùng chung vào `src/ui/`: PageHeader, Card, CardHead, Button, Field, FilterField, Badge, Tabs, Modal/drawer, DataTable và EmptyState. Modal giữ đóng bằng Escape, vòng focus bàn phím và vùng nội dung cuộn riêng.
- Một nhãn “Demo — dữ liệu giả lập” ở header chung; bỏ nhãn trùng trong sidebar và đầu biểu mẫu. Header ở luồng cuộn thông thường, không che nội dung.
- Tổng quan: tiêu đề “Tổng quan công việc”, thẻ thống kê cùng chiều cao, công việc cần xử lý và hồ sơ gần đây có liên kết thật; phản ánh mới nhất được sắp theo thời gian tiếp nhận; chú giải biểu đồ rõ hơn.
- Phản ánh: tiêu đề “Quản lý phản ánh”, nút “Tiếp nhận phản ánh”/“Gửi phản ánh” theo vai trò; nhãn bộ lọc và hai mốc ngày tiếp nhận. Bảng giữ các cột nghiệp vụ chính, bỏ người gửi/nguồn khỏi bảng để xem trong chi tiết. Tiêu đề tối đa hai dòng có tooltip và mở chi tiết. Thể hiện “Không phát sinh chuyển tiền” hoặc “Chưa xác định” theo dữ liệu.
- Chi tiết phản ánh: tách thông tin chung, nội dung gốc, tài liệu, trích xuất và căn cứ liên kết thành khối. Giữ phân loại ban đầu; thông báo rõ khi cán bộ cập nhật phân loại khác.
- Sơ đồ: giữ nguyên quan hệ, gom nhóm, mở rộng, tìm/lọc, phân trang nguồn, zoom và thử tải. Khi viewport ≤1500px, chi tiết chuyển sang drawer bên phải để sơ đồ dùng toàn bộ chiều rộng nội dung. Nhãn dài được cắt theo chiều rộng đo bằng canvas; nội dung đầy đủ vẫn ở tooltip, tên truy cập và drawer. Hướng dẫn mở nhóm nằm ngoài đường nối.
- Cảnh báo: tiêu đề “Cảnh báo cần rà soát”, thời gian nguồn mới nhất, nhãn “Cần rà soát” tách khỏi mức ưu tiên. Không giả tạo thời gian phát sinh hoặc trạng thái xử lý mới. Giữ giải thích điểm minh họa và nguồn dữ liệu.
- Hồ sơ: đồng bộ danh sách/bộ lọc, thông tin đầu hồ sơ và các tab đang hoạt động. Không thêm tab giả. Báo cáo web theo giao diện chung; in/PDF nền trắng, chữ tối, bỏ bố cục ứng dụng khỏi luồng in để tránh khoảng trắng và nền navy cuối trang.
- Tài khoản: ưu tiên danh sách; phần vai trò và phạm vi mô phỏng gói trong mục mở rộng. Không mở rộng quyền quản trị viên.
- Nhật ký: lọc người thao tác, hành động và khoảng ngày; mở rộng chi tiết thay đổi trước/sau hoặc mở sự kiện. Có trạng thái rỗng cho nhật ký, hồ sơ và tài khoản khi lọc không có kết quả.
- Luồng tiếp nhận bốn bước giữ nguyên; chỉ dùng lại token chữ/khung và nhãn demo chung.

## Chạy và kiểm tra

Node 24, pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm build
pnpm dev --host 0.0.0.0
```

Vite in địa chỉ truy cập trong terminal. Có thể kiểm tra bản build bằng `pnpm preview --host 0.0.0.0 --port 8444`.

Kiểm thử trình duyệt sử dụng Playwright cài trong thư mục công cụ tạm và Chromium của môi trường, không thêm dependency ứng dụng:

```sh
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE=/workspace/.test-tools/node_modules/playwright node tests/design.cjs
```

Thay `tests/design.cjs` bằng `tests/browser.cjs`, `tests/edge.cjs`, `tests/intake.cjs` hoặc `tests/revision.cjs` để chạy các bộ hồi quy. Biến `TEST_OUTPUT` chọn thư mục lưu kết quả. Máy khác cần chỉ đường dẫn module Playwright/Chromium phù hợp.

## Kết quả

- TypeScript và production build: đạt.
- 1440 × 900 và 1280 × 720, device scale mặc định, không browser zoom: kiểm tra từng trang chính, bảng không làm tràn ngang toàn trang, một mục sidebar active, một nhãn demo chung, drawer đóng được và nút đóng trong viewport.
- Kiểm tra giao diện ở bảy vai trò; người dân giữ luồng riêng, vai trò chỉ xem vẫn bị chặn thao tác thay đổi.
- Luồng 12 phản ánh/45 triệu → PA-013 tạo thành 13 phản ánh → kiểm tra → xác nhận liên kết 4 phản ánh/60 triệu → tạo hồ sơ đầy đủ → phân công/nhận định → báo cáo đúng hồ sơ: đạt ở hai viewport.
- CUM-002 riêng 25 triệu, PA-008 độc lập và HS-002 riêng 30 triệu; hồ sơ tạo trước liên kết vẫn giữ phạm vi cũ: đạt.
- Tiếp nhận nhiều loại, ID duy nhất, xác nhận ghi đè mẫu, nháp qua reload, không chuyển tiền, thiếu thời gian, localStorage lỗi thì rollback và không báo thành công giả: đạt.
- Gom nhóm theo ngày/hành vi, tìm thực thể, nhãn quan hệ, zoom/fit, nguồn có tìm/phân trang, thử tải riêng 1.000 phản ánh: đạt. Quan sát tối đa 13 nút/29 cạnh trong tình huống thử; không khẳng định năng lực backend.
- Kiểm tra ngày Việt Nam trên host UTC và America/New_York, migration giữ bản ghi cũ và bản sao lưu: đạt.
- Ảnh PNG, PDF mẫu và JSON kết quả ở `docs/design-review/`. Đã mở ảnh kiểm tra trực quan và render trang đầu PDF để kiểm tra nền trắng, vị trí đầu trang.

## Giới hạn

Chỉ dữ liệu giả lập; phân quyền trên giao diện và localStorage không thay thế backend/xác thực. Tài liệu, OCR/AI, VNeID vẫn mô phỏng. Kiểm thử tự động và ảnh chụp dùng Chromium; chưa kiểm tra Safari/Firefox hoặc giao diện điện thoại. Bảng rộng cuộn trong khung, trang vẫn cuộn dọc ở mức chữ dễ đọc. Khi drawer mở trên màn hình nhỏ, đóng drawer để tiếp tục thao tác sơ đồ. In hồ sơ dài có thể nhiều trang; chỉ hai hồ sơ mẫu được xuất PDF trong các bộ kiểm thử. Không merge, không triển khai Production.
