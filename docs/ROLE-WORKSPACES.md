# Phân quyền theo tài khoản và công việc

Bản sửa dựa trên commit `81887aa`, nhánh GitHub `Hệ-Thống-Truy-Vết-Demo`. Mục tiêu là phân biệt trách nhiệm ngay trong trang nghiệp vụ và kiểm tra quyền ở cả giao diện lẫn hàm thực hiện thay đổi. Giao diện login giữ nguyên.

## Bảng quyền đã thực hiện

| Vai trò | Phạm vi dữ liệu | Thao tác được phép | Các thao tác bị chặn |
| --- | --- | --- | --- |
| Người dân / Tổ chức | Phản ánh có submittedBy bằng tài khoản hiện tại | Tạo, xem tiến độ công khai, trả lời yêu cầu bổ sung bằng bản ghi riêng | Xem người khác, ghi chú nội bộ, sơ đồ, hồ sơ nội bộ, trích xuất, xác nhận liên kết |
| Tiếp nhận | Phản ánh trong đơn vị | Tạo phiếu, ghi chú, yêu cầu bổ sung, đánh dấu không hợp lệ có lý do, chuyển cho cán bộ phân tích đang hoạt động trong đơn vị | Chỉnh trích xuất, xác nhận liên kết, tạo/phân công hồ sơ, sửa nhận định xử lý |
| Phân tích | Phản ánh và hồ sơ trong đơn vị; chỉ sửa phiếu đã bàn giao và được giao hoặc chưa có người nhận | Bắt đầu trích xuất mô phỏng, sửa thực thể/loại phản ánh/số tiền, ghi nhận định, kiểm tra căn cứ, xác nhận/loại bỏ/khôi phục đề xuất, tạo hồ sơ từ cụm | Tạo phản ánh tiếp nhận, sửa lời khai gốc, tự phân công xử lý, sửa nhận định hồ sơ, phê duyệt báo cáo |
| Xử lý hồ sơ | Hồ sơ được giao và các phản ánh nguồn | Tiến độ, nhận định, tài liệu mẫu bổ sung, yêu cầu xem xét lại dữ liệu nguồn, bản nháp/trình báo cáo, tạo phiên bản mới sau duyệt | Hồ sơ ngoài phạm vi, đổi người phụ trách/ưu tiên, sửa nguồn, phê duyệt báo cáo, sửa dữ liệu khi đang trình hoặc bản duyệt đang khóa |
| Lãnh đạo | Hồ sơ, phản ánh và nhật ký nghiệp vụ trong đơn vị | Phân công cho cán bộ xử lý hợp lệ, đổi ưu tiên, ghi chỉ đạo, xem xét báo cáo đang trình | Tiếp nhận thay cán bộ, sửa lời khai/trích xuất/nhận định thay người xử lý, duyệt báo cáo chưa trình |
| Kiểm tra, giám sát | Phản ánh, hồ sơ, nhật ký trong đơn vị | Đọc, lọc, đối chiếu trước/sau và lịch sử | Mọi thao tác sửa nghiệp vụ, phân công, trình/duyệt báo cáo, sửa/xóa nhật ký |
| Quản trị | Tài khoản nội bộ, nhật ký quản trị trong đơn vị | Đổi vai trò/đơn vị/trạng thái hoạt động của tài khoản nội bộ; đặt lại dữ liệu thử nghiệm có xác nhận và giữ nhật ký | Xem/sửa dữ liệu phản ánh và hồ sơ, liên kết, phân công nghiệp vụ, duyệt báo cáo, chuyển tài khoản người dân thành cán bộ, vô hiệu hóa quản trị cuối cùng |

Các trang, bộ lọc và hàm ghi dữ liệu dùng cùng các hàm phạm vi/quyền. Đường vào màn hình được lưu trong localStorage cũng bị kiểm tra lại. Đối tượng không có quyền không được tự thay bằng phản ánh/hồ sơ khác.

## Trải nghiệm ngay trên trang

- Sidebar có thứ tự/mục theo tài khoản. Tiếp nhận và phân tích mở hàng đợi riêng; người xử lý mở hồ sơ được giao; lãnh đạo mở điều hành; giám sát mở nhật ký; quản trị mở tài khoản.
- Dòng ngữ cảnh nhỏ thể hiện vai trò và nhiệm vụ; số đếm được tính từ dữ liệu trong phạm vi thực tế.
- Bộ lọc “Trong đơn vị”, “Được giao / Chờ phân tích”, “Chờ tiếp nhận / Bổ sung” thay đổi dữ liệu đang xem.
- Tiếp nhận có khối kiểm tra/bàn giao ngay trong chi tiết phiếu. Các vai trò khác đọc trạng thái, không có nút nhận phiếu thay cán bộ tiếp nhận.
- Người dân có điều hướng cổng phản ánh riêng, chỉ nhận tiến độ công khai và yêu cầu bổ sung; ghi chú tiếp nhận nội bộ và người được giao phân tích không hiển thị.
- Hồ sơ của lãnh đạo có phân công/chỉ đạo; người được giao có tiến độ/nhận định/báo cáo; các vai trò đọc có thông tin dạng chỉ đọc và lý do khóa.
- Thống kê phản ánh theo ngày/nhóm hành vi/cụm từ bản cũ được giữ trong mục mở rộng của trang điều hành.
- Tài khoản thử nghiệm đổi danh tính thật trong mô hình dữ liệu, không chỉ đổi nhãn vai trò. Hai tài khoản xử lý khác nhau có danh sách hồ sơ khác nhau.
- Chuyển tài khoản đóng hộp thoại, che lại thông tin, đổi trang phù hợp và cảnh báo nội dung chưa lưu. Bản nháp tiếp nhận được giữ riêng, bản nháp nhận định không mất khi chuyển tab trong hồ sơ.

## Trạng thái và phiên bản

Bốn việc được lưu riêng:

1. Phản ánh: `intakeStatus`, ghi chú tiếp nhận và yêu cầu bổ sung. Mới tiếp nhận → Chờ bổ sung/Không hợp lệ/Chuyển phân tích. Người gửi bổ sung thì trở lại hàng đợi tiếp nhận; lời khai ban đầu không đổi.
2. Phân tích: `analysisStatus`, `analysisAssignee`, `analysisNote`, `reviewed`, `cluster`, đề xuất bị loại bỏ. Chỉ cán bộ đúng phạm vi được sửa; phải lưu kiểm tra trước khi xác nhận liên kết. Đổi thực thể nguồn sẽ bỏ liên kết cũ để xác nhận lại.
3. Hồ sơ: `assignedTo`, `status`, `directives`, `workItems`, `note`. Hồ sơ mới chưa có người xử lý. Các trạng thái xử lý sẵn có được giữ.
4. Báo cáo: `reportVersions[].state` với Bản nháp → Chờ xem xét → Yêu cầu chỉnh sửa/Đã phê duyệt. Sau yêu cầu chỉnh sửa phải lưu lại bản nháp trước khi trình. Đang trình thì khóa cập nhật xử lý; sau phê duyệt phải lưu phiên bản mới trước khi sửa tiếp.

Báo cáo lưu bản chụp trường hồ sơ và đúng các phản ánh nguồn tại lần lưu bản nháp. Xem/in phiên bản cũ dùng bản chụp đó; phiên bản đã phê duyệt không bị sửa đè khi lập phiên bản mới. Duyệt báo cáo không được coi là kết luận vi phạm hoặc tự đóng hồ sơ.

## Tương thích và dữ liệu

- Giữ 12 phản ánh ban đầu; CUM-001 là PA-001/002/003, 45 triệu.
- PA-013 chỉ có khi gửi mẫu, 15 triệu, tổng 13. Không tự liên kết lúc tạo.
- Sau kiểm tra và xác nhận, CUM-001 có 4/60 triệu. Hồ sơ mới lưu đủ bốn mã phản ánh.
- CUM-002 giữ 3/25 triệu; PA-008 và HS-002 giữ độc lập, 1/30 triệu.
- Không tái tạo/reset dữ liệu khi chuyển tài khoản. Chuyển đổi phiên cũ chỉ thêm trường cần thiết, giữ số tiền, nội dung, lịch sử và quan hệ.
- Đối chiếu người phụ trách cũ theo tên cán bộ xử lý mẫu đã biết. Tên chưa rõ hoặc tên thuộc vai trò khác được giữ ở trường hiển thị cũ, không tự gán tài khoản đang đăng nhập.
- Hai tài khoản xử lý là `xu.ly.demo` (Lê Minh Anh) và `xu.ly.huy` (Trần Quốc Huy). Tài khoản thứ hai giữ việc phân biệt HS-001 và HS-002 có người phụ trách khác nhau.
- Đơn vị mặc định cho bản ghi cũ là Đơn vị nghiệp vụ A; địa bàn phát sinh không được coi là đơn vị xử lý.
- Ánh xạ quyền tài khoản cũ được đọc khi khởi tạo cấu trúc tài khoản mới. Sau đó trang quản trị cập nhật cấu trúc tài khoản này và quyền thực sự thay đổi.
- Bản nháp wizard cũ chuyển sang khóa riêng của tài khoản phiên cũ và giữ bản sao dự phòng. Tài khoản không sở hữu phiếu cũ không được nhận quyền chỉ vì phiếu có mã PA-013.
- Lưu thay đổi nghiệp vụ và audit có phục hồi dữ liệu trước đó nếu ghi localStorage lỗi. Giao diện không báo tạo thành công khi chưa lưu được.

## Nhật ký và thông tin đã che

Ghi tài khoản, vai trò tại thời điểm thao tác, đơn vị, nhóm sự kiện, đối tượng, thời gian, kết quả và thay đổi. Vai trò trong sự kiện cũ không được tra ngược từ vai trò hiện tại để thay nhãn.

Ghi các bước tiếp nhận/bổ sung/bàn giao, trích xuất/kiểm tra/liên kết, tạo/phân công/xử lý hồ sơ, trình/xem xét/phiên bản báo cáo và thay quyền. Nhật ký mở trường đã che chỉ ghi nhãn trường. Quản trị không nhận nhật ký chứa thay đổi nghiệp vụ của phản ánh/hồ sơ. Không có chức năng sửa hoặc xóa audit; đặt lại dữ liệu cũng giữ audit cũ.

## Kiểm tra

Kết quả JSON và ảnh: [role-review](./role-review/).

| Kiểm tra | Phạm vi | Kết quả |
| --- | --- | --- |
| TypeScript và Vite build | Mã nguồn hiện tại | Đạt |
| `tests/access.mjs` | Quyền từng thao tác, từ chối ghi ngoài quyền/phạm vi, giữ lời khai, chuyển bước, phân công, khóa khi trình, phiên bản duyệt bất biến, đổi quyền có hiệu lực, lịch sử vai trò | Đạt |
| `tests/roles.cjs` | Luồng xuyên suốt bảy vai trò, 1440×900 và 1280×720, tối/sáng, 13 phản ánh và cụm 4/60, HS-002/30, CUM-002/25, sửa sau loại bỏ đề xuất, báo cáo và tài khoản | Đạt |
| `tests/roles-negative.cjs` | 1280×720; khác đơn vị, phục hồi trang trái quyền, khóa tài khoản, bản nháp, chuyển đổi dữ liệu cũ, lỗi lưu/rollback, đầu vào, phiếu nhập tay và đặt lại có xác nhận | Đạt |
| `tests/intake-model.mjs` | Dành PA-013 cho mẫu, mã nhập tay duy nhất, nhãn loại phản ánh cũ | Đạt |
| `tests/time.mjs` | Múi giờ Việt Nam, mốc nửa đêm, bảy ngày, chuyển đổi dữ liệu và lịch sử | Đạt, host America/New_York |
| Đối chiếu mã | Login, CSS gốc, cấu hình/dependencies không đổi | Đạt; xem `preservation.json` |

Kiểm thử trình duyệt không phát hiện lỗi JavaScript, tràn ngang toàn trang hoặc yêu cầu API ngoài. Các kiểm thử dùng các browser context riêng, không sửa phiên trình duyệt đang review của người dùng.

Các script UI từ các đợt thiết kế trước dựa trên quyền sửa chung/bộ chọn vai trò cũ được giữ như tài liệu lịch sử. Bộ kiểm thử chấp nhận hiện tại là `access.mjs`, `roles.cjs`, `roles-negative.cjs`, `intake-model.mjs`, `time.mjs`.

## Chạy và xem

Xem [README](../README.md) để chạy dự án và bộ kiểm thử. Trong tiện ích Tài khoản thử nghiệm, chọn tài khoản cần xem; công việc và menu thay đổi theo quyền đã lưu trong trang quản trị.

Để kiểm tra HS-002 bằng vai trò xử lý, chọn Trần Quốc Huy. Muốn thao tác trên hồ sơ mới, lãnh đạo phải phân công trước. Không cần đặt lại dữ liệu để có các trường phân quyền mới.

## Giới hạn còn lại

- Đây là thực thi quyền phía trình duyệt, không phải bảo mật máy chủ hoặc xác thực thật; bộ chọn tài khoản là công cụ thử nghiệm.
- localStorage thuộc từng origin/trình duyệt. Không đồng bộ giữa người dùng và chưa xử lý sửa đồng thời nhiều tab. Dùng một tab để review quy trình.
- Đính kèm/bổ sung tài liệu dùng đối tượng mẫu, không lưu file thật. Trích xuất và điểm cảnh báo vẫn là mô phỏng.
- Chưa có quản lý danh mục đơn vị/cấp tài khoản mới, hạn xử lý, chữ ký số, gửi thông báo hoặc giao việc nhiều cấp.
- Yêu cầu xem xét lại nguồn được ghi vào hồ sơ và hiện cho bộ phận phân tích; chưa có quy trình đóng yêu cầu riêng. Giám sát hiện chỉ đọc, chưa có biểu mẫu nhận xét kiểm tra riêng.
- Chưa kiểm tra trực quan Safari/Firefox. Không đổi giao diện login, không tự merge hoặc chạy lệnh triển khai Production.
