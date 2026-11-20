# Phân Tích Và Truy Vết Tội Phạm Công Nghệ Cao

Bản demo React 19 + TypeScript + Vite 8 phục vụ review nghiệp vụ. **Demo — dữ liệu giả lập.** Không tiếp nhận tố giác thật, không kết nối VNeID, backend, OCR/AI hay API bên ngoài. Vai trò và phân quyền chỉ mô phỏng trên giao diện; không dùng bản này để bảo vệ hoặc xử lý dữ liệu thật.

## Chạy dự án

Đã kiểm tra với Node.js **24.19.0**, pnpm **11.25.0**, Linux và Chromium. Vite 8 cần Node.js 20.19+ hoặc 22.12+; ưu tiên dùng Node 24 như môi trường kiểm thử.

```bash
# Trong thư mục gốc repository scamgraph-demo
pnpm install --frozen-lockfile
pnpm dev
```

Vite dùng cổng 8443 mặc định. Có thể đổi bằng `PORT=5173 pnpm dev`. Mở địa chỉ mà Vite thông báo trên máy của bạn. Không cần biến môi trường bí mật hoặc tài khoản thật. Tài khoản/mật khẩu hiển thị là mẫu chỉ đọc; chọn vai trò rồi bấm **Đăng nhập demo**.

Cấu hình `.figma/make/site.json` được đưa vào repository để một checkout mới có thể build, có tiêu đề tiếng Việt và `noindex`. Không cần chạy trong Figma Make. Không có file `.mise.toml` dù hướng dẫn scaffold cũ có nhắc tới.

```bash
pnpm exec tsc --noEmit
pnpm build
PORT=8444 pnpm preview
```

Không mở `dist/index.html` trực tiếp bằng `file://`; dùng `pnpm preview` để chạy bản build. In báo cáo bằng nút **In báo cáo**, sau đó chọn **Lưu dưới dạng PDF** trong hộp thoại của trình duyệt.

## Kịch bản review khoảng 5–7 phút

1. Đăng nhập vai trò **Người dân / Tổ chức**; cổng gửi phản ánh có bố cục riêng, không hiển thị menu hồ sơ nghiệp vụ. Bấm **Đặt lại demo** và xác nhận để bắt đầu từ 12 phản ánh. Đặt lại sẽ xóa tiến độ giả lập, hồ sơ mới, quyền đã sửa và đề xuất đã loại bỏ; giữ vai trò hiện tại và ghi một nhật ký đặt lại.
2. Bấm **Dùng tình huống mẫu**. Mẫu PA-013 có số tiền 15.000.000 đồng, định danh và ảnh chuyển khoản giả lập. Đi qua 4 bước, chọn ảnh mẫu rồi **Gửi phản ánh**. Hiển thị tiếp nhận thành công; hệ thống có 13 phản ánh. Không cho gửi PA-013 lần thứ hai.
3. Dùng bộ chọn **Chuyển vai trò demo** ở thanh đầu trang để chuyển sang **Cán bộ phân tích**. Vào **Phản ánh**, tìm `PA-013` rồi mở chi tiết. CUM-001 lúc này vẫn chỉ có PA-001/002/003, tổng **45 triệu**.
4. Bấm **Trích xuất thông tin**; so sánh nội dung gốc và **Xem trước** bằng chứng. Sửa một trường, ví dụ điện thoại thành `DEMO-SDT-013`, rồi **Lưu thông tin đã kiểm tra**. Căn cứ đề xuất chỉ xuất hiện sau bước này, với trường trùng khớp và từng mã phản ánh nguồn. Có thể **Loại bỏ đề xuất**, tải lại để thấy trạng thái còn giữ, rồi **Xem xét lại**.
5. Bấm **Xác nhận liên kết CUM-001**. Cụm mới trở thành **4 phản ánh / 60 triệu**. Mở sơ đồ; chọn nút để xem nguồn của quan hệ, mở phản ánh nguồn hoặc xem lý do cảnh báo. Quan hệ chỉ diễn tả thông tin được nhắc đến, không xác nhận danh tính hay quyền sở hữu tài khoản.
6. Bấm **Tạo hồ sơ từ cụm** → xác nhận. Hồ sơ mới là **HS-003**, chứa đủ PA-001, PA-002, PA-003, PA-013. Phân công cán bộ, đổi trạng thái, viết nhận định và **Lưu thay đổi**. **Xem báo cáo** dùng các giá trị đã lưu; lưu trước khi mở để đưa thay đổi vào báo cáo. Có thể xem trước/in/lưu PDF.
7. Kiểm tra đối chứng: **CUM-002** có PA-004/005/006, tổng **25 triệu**; **HS-002** chỉ chứa **PA-008**, tổng **30 triệu**, không có tài khoản ngân hàng hay thực thể của CUM-001. Trong hộp thoại tạo hồ sơ có thể chọn cụm nguồn khác.
8. Chuyển sang **Quản trị hệ thống**, tìm tài khoản và sửa vai trò mẫu; chỉ vai trò quản trị được lưu thay đổi này. Mở **Nhật ký hệ thống**, tìm `PA-013`, mở một dòng để đọc người thao tác, thời gian, đối tượng và giá trị trước/sau. Chuyển vai trò chỉ xem để kiểm tra thao tác lưu hồ sơ bị từ chối.

Dữ liệu phản ánh, hồ sơ, nhật ký, quyền mẫu, vai trò, màn hình đang mở và tiến độ biểu mẫu được lưu trong `localStorage` theo origin. Chạy cùng ứng dụng ở cổng khác tạo kho dữ liệu riêng. Đổi tên tài khoản/quyền trong danh sách là minh họa quản trị; bộ chọn vai trò vẫn là công cụ độc lập phục vụ trình diễn, không phải xác thực thật.

## Kiểm thử tự động bằng trình duyệt

Các script dùng Playwright nhưng không thay đổi lockfile của ứng dụng. Cài công cụ kiểm thử riêng trong thư mục được Git bỏ qua:

```bash
npm install --prefix .test-tools playwright@1.56.1 --no-audit --no-fund
# Nếu máy chưa có Chromium, cài bằng công cụ hệ điều hành hoặc:
.test-tools/node_modules/.bin/playwright install chromium
```

Các script mặc định dùng `/usr/bin/chromium`. Nếu dùng Chromium do Playwright cài, lấy đường dẫn bằng:

```bash
node -e "console.log(require('./.test-tools/node_modules/playwright').chromium.executablePath())"
```

Chạy ứng dụng ở một terminal, rồi trong terminal khác:

```bash
PLAYWRIGHT_MODULE="$PWD/.test-tools/node_modules/playwright" node tests/browser.cjs
PLAYWRIGHT_MODULE="$PWD/.test-tools/node_modules/playwright" node tests/edge.cjs
```

Dùng `CHROMIUM_PATH=/duong/dan/chromium` khi khác mặc định. Các kiểm thử là demo cục bộ, Chromium chạy headless với `--no-sandbox` để tương thích container; không dùng runner này để mở nội dung không tin cậy. Có thể dùng `DEMO_URL=http://127.0.0.1:8444/` để kiểm thử production preview. Đặt `TEST_OUTPUT` để chọn thư mục ảnh, PDF và JSON (mặc định `/tmp/scamgraph-results`). Mỗi bài dùng browser context riêng, không sửa dữ liệu trong phiên review của bạn.

- `tests/browser.cjs`: luồng chính ở **1440 × 900** và **1280 × 720**, kiểm tra dữ liệu trước/sau liên kết, hồ sơ, quyền mẫu, localStorage, nhật ký và reset; lưu screenshot/PDF.
- `tests/edge.cjs`: trường bắt buộc, số âm, gửi trùng, loại dữ liệu không khớp, gỡ liên kết cũ sau khi sửa, quyền chỉ xem, bộ lọc, điều hướng đúng nguồn và không gọi API bên ngoài.
- [Kết quả kiểm tra](docs/TEST-RESULTS.md); [ảnh và kết quả JSON](docs/review).

## Thay đổi và giới hạn

- Sáu màn hình dùng nền xanh đen, khối navy, nút tím/xanh, chữ rõ hơn; cổng người dân tách bố cục nghiệp vụ. Giữ sơ đồ, cảnh báo, hồ sơ và báo cáo.
- Thông tin trích xuất có thể chỉnh đủ các trường; căn cứ phải được kiểm tra, xác nhận hoặc loại bỏ. Sửa thực thể trong phản ánh đã liên kết sẽ gỡ liên kết cũ để yêu cầu kiểm tra lại.
- Thành viên cụm được lưu trong phản ánh; hồ sơ giữ danh sách mã phản ánh lúc tạo. Các tổng tiền, biểu đồ và báo cáo đọc từ bộ dữ liệu này, không tăng bộ đếm riêng.
- Điểm cảnh báo là quy tắc minh họa của kịch bản, không phải điểm AI hay kết luận điều tra. Trích xuất cũng chạy theo mẫu, không suy ra thực thể từ mọi văn bản tùy ý.
- PA-013 là tình huống tạo mới duy nhất để review; đặt lại trước khi trình diễn lại. Ảnh bằng chứng là minh họa HTML, không phải quy trình tải/chấm chứng từ thật.
- Dữ liệu chỉ lưu trên một trình duyệt, không đồng bộ nhiều người; xóa dữ liệu trình duyệt hoặc chặn localStorage sẽ ảnh hưởng lưu tiến độ. Không có cơ chế bảo mật, chữ ký số hay nhật ký chống sửa phục vụ vận hành thật.
- Tối ưu desktop theo hai kích thước yêu cầu; chưa chứng nhận giao diện mobile, kiểm thử bảo mật hoặc độ giống từng pixel. Không triển khai website ra dịch vụ bên ngoài.

## Preview trên Vercel

Xem [hướng dẫn kết nối GitHub và deploy đúng nhánh sửa](docs/VERCEL-PREVIEW.md). `vercel.json` đã cấu hình Vite, pnpm 11.25.0 và thư mục output `dist`; Node được cố định 24.x. Không cần backend hoặc biến môi trường bí mật. Nhánh review là **`feat/improve-demo`**; không dùng nhầm deployment của `main` (bản gốc).
