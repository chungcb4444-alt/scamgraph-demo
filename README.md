# Phân Tích Và Truy Vết Tội Phạm Công Nghệ Cao

ScamGraph là ứng dụng React 19 + TypeScript + Vite 8 phục vụ review quy trình tiếp nhận phản ánh, phân tích liên kết và xử lý hồ sơ về tội phạm công nghệ cao.

Ứng dụng có bảy vai trò với công việc, menu và quyền thao tác riêng theo tài khoản, đơn vị, người được giao và trạng thái xử lý. Toàn bộ dữ liệu là hư cấu; đăng nhập, VNeID, tài liệu đính kèm và trích xuất đều là mô phỏng. Không kết nối backend, OCR/AI thật hoặc API bên ngoài.

## Chạy dự án

Yêu cầu **Node.js 24** và **pnpm 11.25.0**. Chạy lệnh tại thư mục chứa `package.json`:

```sh
pnpm install --frozen-lockfile
pnpm dev --host 0.0.0.0
```

Mở địa chỉ Vite in ra trong terminal. Để kiểm tra TypeScript và chạy bản build:

```sh
pnpm exec tsc --noEmit
pnpm build
pnpm preview --host 0.0.0.0 --port 8444
```

Bản preview cục bộ mở tại `http://localhost:8444/`.

## Chức năng hiện có

- **Phản ánh:** biểu mẫu bốn bước, lưu nháp, tìm kiếm/bộ lọc, thông tin các bên, xác nhận cán bộ tiếp nhận đối với phiếu mới, kiểm tra/bổ sung và bàn giao phân tích.
- **Thông tin nhạy cảm:** che liên hệ, email, tài khoản và số điện thoại; bấm Xem/Ẩn theo quyền. Thông tin tự che lại sau 45 giây kể từ thao tác mở/đóng gần nhất, khi rời cửa sổ, chuyển tab hoặc nhấn Escape.
- **Phân tích:** kiểm tra và sửa thông tin trích xuất mô phỏng, ghi nhận định, đối chiếu căn cứ, xác nhận/loại bỏ/khôi phục đề xuất liên kết.
- **Sơ đồ và cảnh báo:** tra cứu thực thể, xem nguồn phản ánh, nhóm liên kết và căn cứ ưu tiên xác minh. Kết quả hỗ trợ rà soát, không phải kết luận vi phạm.
- **Hồ sơ:** tạo từ cụm, phân công và chỉ đạo; phân công mới có bước cán bộ nhận xử lý, lịch sử nhận/giao và điều kiện cập nhật tiến độ, nhận định, tài liệu.
- **Ý kiến / Yêu cầu:** ghi chú không cần duyệt, yêu cầu nguồn có tiếp nhận/phản hồi/hoàn thành, kiến nghị riêng có bản nháp, người nhận, quyết định và phiên bản.
- **Báo cáo:** cảnh báo dữ liệu thay đổi sau lưu nháp, chủ động cập nhật trước khi trình, trả sửa/phê duyệt; giữ các lần trình bị trả sửa và bản đã phê duyệt.
- **Quản trị và nhật ký:** quản lý quyền/đơn vị/trạng thái tài khoản nội bộ, tra cứu thao tác và lịch sử thay đổi trong phạm vi được phép.

Giao diện hỗ trợ sáng/tối. Giao diện login được giữ theo mẫu hiện tại.

## Tài khoản hiện tại

Tại màn hình đăng nhập, chọn **Tài khoản Cán bộ**, chọn vai trò mẫu và dùng tài khoản được điền sẵn. Mật khẩu mô phỏng là `demo1234`. Người dân / Tổ chức cũng có trong danh sách lựa chọn. VNeID chỉ hiển thị luồng mô phỏng, không yêu cầu định danh thật.

Sau khi đăng nhập, mở **Tài khoản thử nghiệm → Chuyển tài khoản thử nghiệm** để chuyển người sử dụng. Công cụ này thay danh tính, vai trò và phạm vi dữ liệu; việc cấp quyền được quản lý riêng trong trang quản trị.

| Tên hiển thị | Tài khoản | Vai trò mặc định |
| --- | --- | --- |
| Nguyễn Hoàng Minh | `cong.dan.demo` | Người dân / Tổ chức |
| Trần Minh Tuấn | `tiep.nhan.demo` | Cán bộ tiếp nhận |
| Nguyễn Xuân Sơn | `phan.tich.demo` | Cán bộ phân tích |
| Lê Minh Anh | `xu.ly.demo` | Cán bộ xử lý hồ sơ |
| Trần Quốc Huy | `xu.ly.huy` | Cán bộ xử lý hồ sơ |
| Nguyễn Duy Hoàng | `lanh.dao.demo` | Lãnh đạo theo dõi |
| Lê Quốc Bảo | `giam.sat.demo` | Kiểm tra, giám sát |
| Quản trị hệ thống | `quan.tri.demo` | Quản trị hệ thống |

Tên cán bộ cũ được tự cập nhật sang tên mới trong dữ liệu tài khoản đã lưu. Không cần đặt lại dữ liệu để thấy tên mới; quyền, đơn vị, trạng thái hoạt động và mã tài khoản được giữ nguyên.

Bảng trên là cấu hình mặc định. Nếu quản trị đã đổi vai trò, đơn vị hoặc khóa tài khoản, ứng dụng áp dụng cấu hình đã lưu.

## Phân quyền và công việc

| Vai trò | Phạm vi và nhiệm vụ chính |
| --- | --- |
| Người dân / Tổ chức | Chỉ xem phản ánh của mình; gửi phiếu, xem tiến độ công khai và bổ sung khi được yêu cầu. Không xem ghi chú nội bộ, sơ đồ hay hồ sơ nghiệp vụ. |
| Cán bộ tiếp nhận | Xử lý phản ánh trong đơn vị; kiểm tra, ghi chú, yêu cầu bổ sung, đánh dấu không hợp lệ có lý do và chuyển cho cán bộ phân tích. |
| Cán bộ phân tích | Xem dữ liệu trong đơn vị; sửa phiếu đã bàn giao thuộc phạm vi phân tích được giao, kiểm tra trích xuất, ghi nhận định, xác nhận liên kết và tạo hồ sơ chờ phân công. |
| Cán bộ xử lý hồ sơ | Chỉ xử lý hồ sơ được giao và xem các phản ánh nguồn; cập nhật tiến độ/nhận định, yêu cầu xem xét lại nguồn, lập và trình báo cáo. Không tự phân công hoặc phê duyệt. |
| Lãnh đạo theo dõi | Theo dõi dữ liệu trong đơn vị; phân công, điều chỉnh ưu tiên, ghi chỉ đạo, yêu cầu chỉnh sửa hoặc phê duyệt báo cáo đã trình. Không sửa lời khai hay nhận định thay cán bộ. |
| Kiểm tra, giám sát | Đọc dữ liệu và nhật ký trong đơn vị, đối chiếu lịch sử và giá trị trước/sau. Không sửa nghiệp vụ hoặc xóa nhật ký. |
| Quản trị hệ thống | Quản lý quyền, đơn vị và trạng thái tài khoản nội bộ; xem nhật ký quản trị. Không mặc nhiên có quyền sửa phản ánh, xử lý hồ sơ hoặc duyệt báo cáo. |

Quyền được kiểm tra ở menu, màn hình, trường nhập và hàm thực hiện thay đổi. Đối tượng ngoài phạm vi bị chặn cả khi khôi phục màn hình cũ từ localStorage. Đổi quyền trong trang quản trị có hiệu lực đối với tài khoản tương ứng.

Có hai tài khoản xử lý để kiểm tra phạm vi được giao: **HS-001** ban đầu thuộc **Lê Minh Anh**, **HS-002** thuộc **Trần Quốc Huy**. Hồ sơ mới chưa được tự phân công cho người tạo hoặc người đăng nhập.

Chi tiết: [Bảng quyền, trạng thái và kết quả kiểm tra](docs/ROLE-WORKSPACES.md). Bố cục phản ánh mới, ảnh trước/sau và cách kiểm tra: [Danh sách và chi tiết phản ánh](docs/REPORTS-LAYOUT.md). Quy trình mới nhất, quyền và tương thích dữ liệu cũ: [Tiếp nhận, nhận việc và xem xét ý kiến](docs/RECEIPT-OPINION-WORKFLOW.md). Các sửa lỗi thao tác trước: [Bốn sửa lỗi nghiệp vụ](docs/FOUR-WORKFLOW-FIXES.md).

## Luồng review nghiệp vụ

1. **Nguyễn Hoàng Minh** gửi tình huống mẫu PA-013. Có thể tạo phản ánh nhập tay riêng; PA-013 không được tạo sẵn.
2. **Trần Minh Tuấn** mở tab Xử lý nghiệp vụ, bấm **Xác nhận tiếp nhận** rồi kiểm tra. Nếu cần, yêu cầu người gửi bổ sung; nội dung bổ sung được lưu riêng, không ghi đè lời khai ban đầu.
3. Cán bộ tiếp nhận ghi chú, chọn **Nguyễn Xuân Sơn** và chuyển phân tích.
4. **Nguyễn Xuân Sơn** kiểm tra trích xuất, sửa thông tin nếu cần, lưu nhận định và xem căn cứ trước khi xác nhận liên kết CUM-001.
5. Cán bộ phân tích tạo hồ sơ từ cụm. **Nguyễn Duy Hoàng** phân công cán bộ xử lý, điều chỉnh ưu tiên và ghi chỉ đạo.
6. Người được giao bấm **Nhận xử lý hồ sơ** cho lần phân công mới, cập nhật tiến độ/nhận định, lưu bản nháp báo cáo và trình xem xét. **Nguyễn Duy Hoàng** yêu cầu chỉnh sửa hoặc phê duyệt.
7. Sau yêu cầu chỉnh sửa, cán bộ lưu lại bản nháp trước khi trình. Sau phê duyệt, sửa tiếp phải tạo phiên bản mới; bản đã duyệt được giữ nguyên.
8. **Lê Quốc Bảo** tra cứu nhật ký để đối chiếu người thao tác, vai trò tại thời điểm thực hiện, thời gian và các thay đổi.

Tab **Ý kiến / Yêu cầu** có trao đổi nội bộ, yêu cầu nguồn và kiến nghị riêng. Đã tiếp nhận ý kiến không đồng nghĩa đã duyệt. Lãnh đạo có hàng đợi kiến nghị cần xem xét. Nếu hồ sơ/nguồn đổi sau lưu nháp báo cáo, cần kiểm tra và chủ động lưu lại trước khi trình.

Bản ghi cũ giữ dữ liệu và quyền xử lý cũ, hiển thị rõ nếu chưa có thông tin xác nhận. Chỉ phiếu mới và lần đổi người được giao thực sự sau nâng cấp áp dụng bước nhận mới; không tự dựng lịch sử hoặc buộc làm lại hồ sơ cũ.

Báo cáo đang trình sẽ khóa cập nhật xử lý hồ sơ. Mỗi bản báo cáo lưu dữ liệu nguồn tại lần lưu bản nháp; xem/in phiên bản đã lưu dùng dữ liệu của phiên bản đó.

## Dữ liệu nghiệp vụ mẫu

| Mốc dữ liệu | Kết quả |
| --- | --- |
| Ban đầu | 12 phản ánh |
| CUM-001 ban đầu | PA-001, PA-002, PA-003; tổng 45 triệu đồng |
| Sau khi gửi PA-013 | 13 phản ánh; PA-013 có 15 triệu đồng, chưa tự vào cụm |
| Sau xác nhận liên kết PA-013 | CUM-001 có 4 phản ánh, tổng 60 triệu đồng |
| Hồ sơ tạo từ CUM-001 sau xác nhận | Chứa đủ 4 phản ánh |
| CUM-002 | 3 phản ánh, tổng 25 triệu đồng; giữ dữ liệu riêng |
| PA-008 / HS-002 | Độc lập với cụm ngân hàng; báo cáo HS-002 lấy 1 phản ánh, tổng 30 triệu đồng |

Phân biệt bốn nhóm trạng thái: **tiếp nhận phản ánh**, **phân tích/liên kết**, **xử lý hồ sơ** và **xem xét báo cáo**. Phê duyệt báo cáo không tự đóng hồ sơ hoặc kết luận vi phạm.

## Lưu trạng thái và dữ liệu phiên cũ

Phản ánh, hồ sơ, phiên bản báo cáo, tài khoản và nhật ký được lưu trong **localStorage theo origin**. Đổi tên miền hoặc cổng chạy ứng dụng tạo kho dữ liệu trình duyệt riêng.

- Bản nháp tiếp nhận được lưu riêng theo tài khoản. Chuyển người sử dụng không ghi bản nháp sang tài khoản khác.
- Chuyển tài khoản đóng hộp thoại, che lại thông tin và kiểm tra quyền trang đang mở; có cảnh báo khi có nội dung chưa lưu.
- Dữ liệu phiên cũ được bổ sung trường cần thiết. Người phụ trách chưa định danh được giữ lại, không tự gán cho người đăng nhập.
- Nhật ký giữ vai trò tại thời điểm thao tác; đổi quyền hiện tại không thay nhãn vai trò trong sự kiện cũ.
- Lỗi ghi localStorage được xử lý phục hồi; chưa lưu thành công thì không báo tạo phiếu thành công.
- **Đặt lại dữ liệu thử nghiệm** chỉ nằm trong tiện ích quản trị, có xác nhận và giữ nguyên tài khoản cùng nhật ký cũ. Đăng nhập hoặc chuyển tài khoản không tự đặt lại dữ liệu.

## Kiểm thử

Kiểm tra mã nguồn và các quy tắc nghiệp vụ:

```sh
pnpm exec tsc --noEmit
pnpm build
node tests/receipt-workflow.mjs
node tests/access.mjs
node tests/intake-model.mjs
TZ=America/New_York node tests/time.mjs
```

Để chạy kiểm thử trình duyệt, cài Playwright riêng trong thư mục `.test-tools` được Git bỏ qua; không thay lockfile ứng dụng:

```sh
npm install --prefix .test-tools playwright@1.56.1 --no-audit --no-fund
.test-tools/node_modules/.bin/playwright install chromium
```

Chạy `pnpm preview --host 0.0.0.0 --port 8444` ở một terminal. Tại terminal khác, chạy:

```sh
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE="$PWD/.test-tools/node_modules/playwright" node tests/receipt-workflow.cjs
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE="$PWD/.test-tools/node_modules/playwright" node tests/roles.cjs
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE="$PWD/.test-tools/node_modules/playwright" node tests/roles-negative.cjs
```

Các lệnh gán biến môi trường trên dùng cú pháp shell Unix như bash/zsh. Script ưu tiên Chromium hệ thống tại `/usr/bin/chromium`; có thể chỉ định `CHROMIUM_PATH`, nếu không sẽ dùng Chromium của Playwright. `TEST_OUTPUT` đổi nơi lưu ảnh và JSON. Các bài chạy bằng phiên trình duyệt riêng.

| Script | Nội dung kiểm tra |
| --- | --- |
| `tests/receipt-workflow.mjs` | Tiếp nhận, nhận việc, phân công lại, yêu cầu nguồn, ý kiến/phiên bản, bản nháp cũ và dữ liệu cũ |
| `tests/receipt-workflow.cjs` | Luồng bổ sung, dữ liệu cũ, nháp nhiều biểu mẫu, sáng/tối ở hai kích thước |
| `tests/access.mjs` | Quyền từng thao tác, phạm vi dữ liệu, bàn giao, phân công, khóa khi trình, phiên bản duyệt và hiệu lực đổi quyền |
| `tests/intake-model.mjs` | Dành PA-013 cho tình huống mẫu, sinh mã nhập tay duy nhất và tương thích nhãn loại phản ánh cũ |
| `tests/time.mjs` | Múi giờ Việt Nam, mốc nửa đêm, thống kê bảy ngày và chuyển đổi dữ liệu thời gian |
| `tests/four-fixes.mjs` | Trạng thái hiển thị, đối chiếu nguồn và xác nhận tạo hồ sơ trùng trong hàm nghiệp vụ |
| `tests/four-fixes.cjs` | Cảnh báo chưa lưu, trạng thái, lọc cảnh báo và hồ sơ trùng; hai kích thước, cả sáng/tối |
| `tests/reports-layout.cjs` | Bố cục hai trang phản ánh, bộ lọc nâng cao, tab, giữ biểu mẫu chưa lưu và dữ liệu trình duyệt; cả sáng/tối ở hai kích thước |
| `tests/roles.cjs` | Luồng xuyên suốt bảy vai trò, báo cáo theo hồ sơ và giao diện 1440 × 900, 1280 × 720 |
| `tests/roles-negative.cjs` | Ngoài phạm vi, phiên cũ, bản nháp, tài khoản khóa, đầu vào, lỗi lưu/rollback và đặt lại có xác nhận |

Ảnh và kết quả được lưu tại [docs/role-review](docs/role-review/). Đây là kết quả của đợt hoàn thiện phân quyền; một số ảnh vẫn có tên cán bộ trước lần đổi tên. Bảng tài khoản trong README này thể hiện tên hiện tại. Lần đổi tên đã được kiểm tra riêng với dữ liệu đã lưu, giữ nguyên quyền và dữ liệu nghiệp vụ.

Các script UI từ những đợt thiết kế trước được giữ để tham khảo lịch sử. Chúng giả định bộ chọn vai trò và quyền sửa chung cũ, không thuộc bộ kiểm thử chấp nhận hiện tại.

## Preview trên Vercel

Repository dùng cấu hình trong `vercel.json`:

| Thiết lập | Giá trị |
| --- | --- |
| Framework | Vite |
| Root Directory | Thư mục gốc chứa `package.json` |
| Install Command | `npx --yes pnpm@11.25.0 install --frozen-lockfile` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Nhánh đang chứa các bản sửa là **`Hệ-Thống-Truy-Vết-Demo`**. Khi kiểm tra preview, đối chiếu nhánh và commit của deployment với bản GitHub cần xem; bản triển khai từ nhánh khác có thể chưa có thay đổi mới.

## Giới hạn hiện tại

- Phân quyền được thực thi trong ứng dụng phía trình duyệt, chưa phải cơ chế bảo mật máy chủ. Bộ chọn tài khoản và mật khẩu mẫu không phải xác thực thật.
- Dữ liệu không đồng bộ giữa người dùng/máy khác; chưa hỗ trợ sửa đồng thời nhiều tab. Nên dùng một tab khi review quy trình.
- Che thông tin là hành vi giao diện; dữ liệu vẫn nằm trong localStorage. Không dùng ứng dụng để tiếp nhận thông tin hoặc chứng cứ thật.
- Tài liệu đính kèm, trích xuất, VNeID và điểm cảnh báo là mô phỏng.
- Chưa có quản lý danh mục đơn vị, cấp tài khoản mới, chữ ký số, gửi thông báo hoặc giao việc nhiều cấp.
- Yêu cầu nguồn và kiến nghị đã có tiếp nhận/xử lý; chưa có thao tác giao lại riêng nội dung đang chờ khi tài khoản nhận bị khóa/đổi vai trò. Giám sát vẫn chỉ đọc.
- Nháp ý kiến chưa bấm lưu chỉ được giữ trong bộ nhớ; cảnh báo rời trang không thay thế tự lưu.
- Chưa kiểm tra trực quan Safari/Firefox.
