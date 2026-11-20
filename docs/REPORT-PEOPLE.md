# Phản ánh: người gửi, bên bị phản ánh và xem thông tin đã che

Bản sửa dựa trên commit `b65aa06`, tham khảo giao diện/chức năng trong `Phản Ánh.html` và bộ danh tính hư cấu trong `Nội dung phản ánh (Mẫu).docx`. Chỉ sửa phần danh sách, tiếp nhận và chi tiết phản ánh; CSS mới được giới hạn vào các thành phần này.

## Thay đổi

- Thêm cột **Người gửi phản ánh**: họ tên, năm sinh và nơi cư trú khi đã có dữ liệu. Bấm tên mở đúng chi tiết phản ánh; có thể dùng bàn phím. Tìm kiếm hỗ trợ tên người gửi và tên tự xưng, cả khi gõ không dấu.
- Chi tiết tách **Người gửi** và **Bên bị phản ánh**: thông tin liên hệ, email, tư cách, kênh tiếp nhận; tên/danh xưng, mạng xã hội, số liên hệ, tài khoản nhận tiền, ngân hàng và website theo lời khai. Thiếu dữ liệu hiển thị “Chưa cung cấp”; danh tính bên bị phản ánh luôn ghi chưa xác minh.
- Che liên hệ, email, mạng xã hội, tài khoản và số điện thoại mặc định. Bấm **Xem/Ẩn** tại từng trường; **Che thông tin** đóng toàn bộ. Tự che sau 45 giây kể từ thao tác mở/đóng gần nhất, khi rời cửa sổ, chuyển tab, nhấn Escape hoặc tải lại trang. Trạng thái mở không lưu vào localStorage.
- Che đồng bộ các thực thể có trong lời khai, căn cứ liên kết, tài liệu mẫu và ô trích xuất. Khi che chỉ đưa dấu chấm vào giao diện/giá trị ô nhập; không dùng CSS làm mờ nguyên văn dữ liệu. Bản nháp trích xuất vẫn giữ khi che lại.
- Có trường tên/danh xưng bên bị phản ánh không bắt buộc trong phiếu tiếp nhận, bước xem lại, localStorage và phần kiểm tra trích xuất. Có thể điều chỉnh tên/mạng xã hội; không thay đổi quy tắc xác nhận liên kết.
- Ghi nhật ký mở trường đã che và cập nhật bên bị phản ánh; nhật ký mở trường chỉ ghi nhãn trường, không ghi giá trị liên hệ.
- Bổ sung CSS sáng/tối, trạng thái hover/focus, chuyển tiếp nhẹ và hỗ trợ giảm chuyển động. Sửa tài liệu giao dịch mẫu để hiển thị số tiền/ngân hàng/tài khoản của phản ánh đang chọn thay cho giá trị PA-013 cố định.

## Dữ liệu và tương thích

DOCX có 20 tình huống, có số tiền/loại phản ánh khác bộ dữ liệu nghiệp vụ hiện tại. Không nạp đè 20 bản ghi hoặc thay số tiền, thời gian, nội dung gốc và thực thể đã dùng trong sơ đồ. Dùng tên người gửi theo mã PA-001…PA-013 từ mẫu, ghép tên tự xưng và thông tin bổ sung phù hợp loại tình huống đang có. Ví dụ PA-003 hiện vẫn là giả danh ngân hàng và thuộc CUM-001; không đổi thành tình huống giao thông trong DOCX. Không tự mở rộng chữ viết tắt tên chủ tài khoản hoặc bịa thêm danh tính đã xác minh.

Giữ 12 phản ánh ban đầu, CUM-001 có 3/45 triệu; tạo PA-013 thành 13 phản ánh, chỉ xác nhận liên kết mới thành 4/60 triệu. CUM-002, PA-008, hồ sơ và báo cáo giữ quan hệ dữ liệu cũ. PA-013 không được tạo sẵn từ tài liệu mẫu.

Phiên localStorage cũ được bổ sung thông tin khi hiển thị nếu nhận diện đúng bản ghi mẫu; không ghi đè dữ liệu cũ để ép cập nhật. Không gán danh tính mẫu cho phản ánh tự nhập chỉ vì trùng mã. Trường chưa nhập hiển thị thiếu thông tin. Luồng PA-013 mẫu cũ cũng được hỗ trợ.

## Chạy

Node.js 24 và pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm dev --host 0.0.0.0
```

Chạy kiểm tra và bản build:

```sh
pnpm exec tsc --noEmit
pnpm build
pnpm preview --host 0.0.0.0 --port 8444
```

## Kiểm tra thực hiện

| Kiểm tra | Kết quả |
| --- | --- |
| TypeScript, build Vite | Đạt |
| `tests/report-people.cjs` tại 1440×900, 1280×720 | Đạt: tìm tên không dấu, mở đúng phản ánh, xem/che bằng chuột/bàn phím, tự che 45 giây/rời cửa sổ/tải lại, giữ bản nháp, lưu tên, audit, tương thích dữ liệu cũ |
| `tests/browser.cjs` tại hai kích thước trên | Đạt: 12/45 → PA-013/13 → kiểm tra/sửa → loại bỏ/khôi phục/xác nhận → 4/60 → hồ sơ 4 phản ánh → phân công/nhận định/báo cáo, CUM-002 và HS-002 độc lập, vai trò và đặt lại |
| `tests/intake.cjs` tại hai kích thước trên | Đạt: nhập tay/tình huống mẫu, lưu tên tự xưng mới, bản nháp, bộ lọc, rollback khi localStorage lỗi, luồng người dân |
| `tests/edge.cjs` tại 1280×720 | Đạt: kiểm tra đầu vào, trùng phiếu, thực thể không khớp, liên kết cũ, vai trò chỉ đọc, tab, tìm kiếm, không gọi API bên ngoài |
| Kiểm tra ảnh | Đã xem giao diện sáng/tối, bảng danh sách và chi tiết; không tràn ngang toàn trang |
| Đối chiếu mã với b65aa06 | Login, sơ đồ, cảnh báo, hồ sơ, tài khoản, nhật ký và báo cáo không thay đổi mã nghiệp vụ; xem `report-people-review/preservation.json` |

Ảnh và JSON kết quả: [report-people-review](./report-people-review/).

Có thể chạy lại kiểm thử trình duyệt nếu cài Playwright và Chromium:

```sh
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE=/duong-dan/node_modules/playwright node tests/report-people.cjs
```

Các script dùng Chromium tại `/usr/bin/chromium`. Luồng cũ được cập nhật để bấm Xem trước khi sửa ô tài khoản/số điện thoại đã che.

## Giới hạn

Chỉ dữ liệu hư cấu và mô phỏng trên trình duyệt. Che thông tin là hành vi giao diện của bản demo; dữ liệu vẫn tồn tại trong localStorage, không phải mã hóa hoặc phân quyền máy chủ. Không có backend, xác minh danh tính hay OCR/AI thật. Chưa kiểm tra trực quan Safari/Firefox. Bản sửa không tự triển khai Production hoặc hợp nhất sang nhánh khác.
