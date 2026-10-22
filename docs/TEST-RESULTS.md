# Kết quả kiểm tra demo

Kiểm tra ngày **22/10/2026**, múi giờ chụp ảnh Asia/Ho_Chi_Minh. Nguồn mã: `chungcb4444-alt/scamgraph-demo`, nhánh `feat/improve-demo`. Không triển khai ra dịch vụ bên ngoài.

## Môi trường và phạm vi

Node 24.19.0, pnpm 11.25.0; Chromium headless qua Playwright 1.56.1 trên Linux. Chạy `pnpm install --frozen-lockfile`, `pnpm exec tsc --noEmit` và `pnpm build` thành công. Cấu hình site được lưu trong repository để checkout mới không thiếu import JSON.

Kiểm thử tương tác cuối cùng chạy trên **production preview** của bản build, cổng 8444. Development server cũng khởi động và biên dịch trong quá trình sửa. Không coi kiểm tra mã nguồn/build là thay thế cho thao tác trình duyệt.

## Kết quả

| Kiểm tra | Kết quả và bằng chứng |
| --- | --- |
| Cài dependency theo lockfile | Đạt; không sửa dependency/lockfile |
| TypeScript `tsc --noEmit` | Đạt |
| Production build | Đạt; có HTML, CSS, JavaScript và robots.txt |
| Luồng chính, 1440 × 900 | Đạt; 20 nhóm kiểm tra trong [results.json](review/results.json) |
| Luồng chính, 1280 × 720 | Đạt; cùng 20 nhóm kiểm tra, browser context riêng |
| Các tình huống biên | Đạt; 17 nhóm kiểm tra trong [edge-results.json](review/edge-results.json) |
| In/PDF | Chromium tạo được PDF; kiểm tra văn bản PDF thấy HS-003, PA-013, 60 triệu đồng và cán bộ đã lưu |
| Lỗi JavaScript trình duyệt | Không ghi nhận trong các luồng đã chạy |
| API bên ngoài | Không có HTTP(S) request ra ngoài origin ứng dụng trong suite tình huống biên |
| Tràn ngang toàn trang | Không phát hiện tại các màn hình được chụp; bảng có vùng cuộn khi cần |

Các nhóm trong JSON là nhóm hành vi có nhiều assertion, không phải số lượng test độc lập của một test framework.

## Dữ liệu và luồng đã đối chứng

- Ban đầu: 12 phản ánh; CUM-001 = PA-001/002/003, tổng 45 triệu.
- Tạo PA-013 bằng biểu mẫu mẫu: 13 phản ánh, PA-013 có 15 triệu; CUM-001 vẫn 3/45 trước xác nhận.
- Trích xuất mô phỏng, sửa điện thoại/ngân hàng, lưu; nhật ký chứa giá trị trước/sau và đúng tài khoản `phan.tich.demo`.
- Đề xuất chỉ hiển thị sau kiểm tra; loại bỏ, tải lại, xem xét lại rồi xác nhận được. Từ chối không làm thay đổi cụm.
- Sau xác nhận: CUM-001 = 4 phản ánh, 60 triệu; cảnh báo, sơ đồ và HS-003 lấy đúng dữ liệu này.
- Phân công, đổi trạng thái và nhận định được lưu qua tải lại. Báo cáo HS-003 có đủ 4 mã phản ánh và 60 triệu.
- HS-002 chỉ có PA-008, 30 triệu; không nhiễm thực thể CUM-001. CUM-002 riêng có 3 phản ánh/25 triệu; tạo hồ sơ và xem báo cáo từ cụm này đúng nguồn.
- Sửa thực thể đã liên kết khiến liên kết cũ được gỡ; thực thể không khớp không có đề xuất.
- Tìm kiếm/lọc phản ánh và hồ sơ; lọc mức cảnh báo; tìm tài khoản và nhật ký; tab hồ sơ; điều hướng từ nguồn sơ đồ về đúng PA.
- Vai trò người dân tách riêng cán bộ tiếp nhận; vai trò chỉ xem bị từ chối lưu hồ sơ. Quản trị sửa đúng tài khoản chọn và lưu qua tải lại.
- Biểu mẫu thiếu thông tin, số tiền âm và tạo trùng bị chặn. Hủy reset giữ dữ liệu; xác nhận reset về 12 phản ánh/2 hồ sơ/45 triệu và xóa tiến độ biểu mẫu/quyền mẫu.
- Tiến độ nhập biểu mẫu được giữ khi tải lại. QR chỉ minh họa; Escape đóng hộp thoại.

## Ảnh đối chiếu

Các ảnh PNG có kích thước **đúng bằng viewport** ghi trong tên, không phải ảnh toàn trang kéo dài. Chụp bằng script trên bản production; đã đọc kích thước nhị phân PNG để đối chứng. Đã xem trực tiếp ảnh các màn hình chính trong quá trình sửa.

| Màn hình | 1440 × 900 | 1280 × 720 |
| --- | --- | --- |
| Đăng nhập | [Ảnh](review/1440-01-login.png) | [Ảnh](review/1280-01-login.png) |
| Cổng người dân gửi phản ánh | [Ảnh](review/1440-02-citizen-portal.png) | [Ảnh](review/1280-02-citizen-portal.png) |
| Quản lý phản ánh | [Ảnh](review/1440-03-reports.png) | [Ảnh](review/1280-03-reports.png) |
| Danh sách hồ sơ | [Ảnh](review/1440-04-cases.png) | [Ảnh](review/1280-04-cases.png) |
| Tài khoản/phân quyền | [Ảnh](review/1440-05-accounts.png) | [Ảnh](review/1280-05-accounts.png) |
| Nhật ký | [Ảnh](review/1440-06-logs.png) | [Ảnh](review/1280-06-logs.png) |
| Căn cứ liên kết | [Ảnh](review/1440-07-evidence.png) | [Ảnh](review/1280-07-evidence.png) |
| Sơ đồ | [Ảnh](review/1440-08-graph.png) | [Ảnh](review/1280-08-graph.png) |
| Báo cáo | [Ảnh](review/1440-09-report.png) | [Ảnh](review/1280-09-report.png) |

[PDF HS-003](review/1280-HS-003.pdf). Thư mục còn có ảnh bước chi tiết nhập phản ánh và biểu mẫu cán bộ để tham khảo.

## Hạn chế và phần chưa kiểm tra

Không có backend/xác thực thật; localStorage và quyền UI chỉ phù hợp trình diễn. QR/VNeID, trích xuất và bằng chứng là mô phỏng theo kịch bản. Chưa kiểm thử nhiều người dùng, bảo mật vận hành, thiết bị mobile, trình duyệt ngoài Chromium hoặc máy in thật. Có thể dùng PDF đã xuất để review, nhưng chưa chứng nhận bố cục in trên mọi trình duyệt. Bố cục/màu bám các ảnh tham chiếu; chưa đo sai khác từng pixel.
