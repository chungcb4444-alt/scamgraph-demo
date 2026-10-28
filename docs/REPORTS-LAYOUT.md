# Danh sách và chi tiết phản ánh

Đợt sửa ngày 28/10/2026, so sánh với commit `332ca65`. Chỉ thay bố cục hai trang phản ánh và cách điều hướng đến tab của trang chi tiết. Không đổi nghiệp vụ hoặc cấu trúc dữ liệu.

## Thay đổi

- Thu gọn tiêu đề, thống kê và tab trạng thái của danh sách. Tìm kiếm, trạng thái và phạm vi công việc luôn hiện.
- Đưa loại phản ánh, nguồn, địa bàn và hai mốc ngày vào **Bộ lọc nâng cao**. Số trên nút là số điều kiện nâng cao đang áp dụng; mỗi mốc ngày tính một điều kiện. Đóng vùng này giữ nguyên giá trị và kết quả lọc.
- **Xóa bộ lọc** xóa tìm kiếm, trạng thái và điều kiện nâng cao; giữ phạm vi công việc đang chọn. Không ghi dữ liệu nghiệp vụ.
- Giữ bảy cột, nút tên người gửi và thao tác. Khi không đủ chiều rộng, bảng cuộn ngang; cột thao tác được giữ bên phải.
- Chi tiết có ba tab: **Thông tin phản ánh**, **Xử lý nghiệp vụ**, **Lịch sử**. Mặc định mở thông tin; nút **Kiểm tra phản ánh**, liên kết **Xử lý phản ánh** từ hàng đợi và nút nhắc công việc mở phần xử lý.
- Biểu mẫu tiếp nhận và trích xuất dùng lại các hàm xử lý cũ. Các panel chỉ ẩn/hiện, không tháo biểu mẫu khi chuyển tab. Trích xuất dùng hai cột trường nhập để giảm chiều dài.
- Giữ cảnh báo rời trang/chuyển tài khoản; thêm cảnh báo trình duyệt khi tải lại hoặc đóng trang chi tiết có nội dung chưa lưu. Nếu chấp nhận rời trang, nội dung chưa lưu sẽ bị bỏ theo cảnh báo; không tự lưu nháp phân tích.
- Chuyển tab che lại thông tin nhạy cảm; giữ cơ chế tự che sau 45 giây, khi mất tiêu điểm hoặc tải lại. Thao tác chủ động hiện thông tin vẫn ghi nhật ký như trước.
- Tab lịch sử dùng các lần bổ sung đã lưu. Nhật ký chỉ lấy từ `visibleLogs` hiện tại và lọc đúng `target` bằng mã phản ánh; không mở rộng quyền. Vì vậy người dân, tiếp nhận và phân tích không được cấp thêm quyền đọc nhật ký nội bộ. Không tái dựng sự kiện từ trạng thái hiện tại; không tạo sự kiện giả. Dòng nhật ký hiển thị thời gian, người thực hiện, vai trò, thao tác và kết quả; không đưa chi tiết có giá trị nhạy cảm ra ngoài cơ chế che.
- Người dân giữ phần thông tin công khai của chính mình và biểu mẫu bổ sung; không nhận biểu mẫu trích xuất hoặc ghi chú nội bộ.
- Tab hỗ trợ phím mũi tên trái/phải, Home/End, focus rõ và reduced motion. CSS chỉ áp dụng trong hai trang phản ánh.

## Kết quả kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| TypeScript và build Vite | Đạt |
| `tests/access.mjs` | Đạt — quyền và chuyển trạng thái |
| `tests/intake-model.mjs` | Đạt — ID, PA-013 và loại phản ánh |
| `TZ=America/New_York node tests/time.mjs` | Đạt — thời gian Việt Nam, dữ liệu cũ |
| `tests/roles.cjs` | Đạt ở 1440×900 và 1280×720 trên bản build |
| `tests/roles-negative.cjs` | Đạt trên bản build — ngoài phạm vi, tài khoản khóa, dữ liệu cũ, lỗi lưu và đặt lại có xác nhận |
| `tests/reports-layout.cjs` | Đạt cả sáng/tối ở hai kích thước trên bản build |
| Đối chiếu mã nghiệp vụ và cấu hình | 26 file giữ nguyên từng byte; 11 khối dữ liệu/hàm xử lý trong App giữ nguyên token; xem `reports-layout-review/preservation.json` |

Bài kiểm thử bố cục so sánh nguyên chuỗi localStorage của phản ánh, hồ sơ, tài khoản và nhật ký trước/sau thao tác chỉ xem, tìm kiếm, lọc và chuyển tab: không thay đổi. Kiểm tra riêng ghi chú tiếp nhận và nhận định phân tích qua các tab; hủy rời trang, tải lại và chuyển tài khoản vẫn giữ nội dung. Chỉ chủ động hiện thông tin nhạy cảm mới thêm nhật ký tương ứng.

Luồng kiểm thử xuyên suốt vẫn tạo PA-013 từ tài khoản người dân, yêu cầu/bổ sung, bàn giao phân tích, kiểm tra/sửa trích xuất, loại bỏ/khôi phục/xác nhận liên kết, tạo hồ sơ chưa phân công, lãnh đạo giao việc, cán bộ trình báo cáo, lãnh đạo trả sửa và phê duyệt, tạo phiên bản mới. Các mốc 12 → 13 phản ánh, CUM-001 3/45 → 4/60 sau xác nhận, CUM-002 3/25 và HS-002 chỉ PA-008/30 đều đạt.

### Vị trí bảng

Đo trên cùng bộ dữ liệu và tài khoản phân tích, phạm vi “Trong đơn vị”, bộ lọc nâng cao đóng, trang chưa cuộn:

| Màn hình | Dòng đầu trước sửa | Dòng đầu sau sửa |
| --- | --- | --- |
| 1280×720 | y ≈ 747 px, dưới vùng nhìn | y ≈ 499 px |
| 1440×900 | y ≈ 788 px | y ≈ 540 px |

Ảnh trước lấy từ bản nguồn `332ca65` chạy riêng trong thư mục tạm; ảnh sau và JSON kiểm thử nằm tại [reports-layout-review](reports-layout-review). Mỗi bài kiểm thử dùng phiên trình duyệt riêng; không truy cập hoặc đặt lại dữ liệu người dùng.

### Ảnh đối chiếu

| Màn hình | Trước | Sau |
| --- | --- | --- |
| Danh sách, 1280 tối | [Ảnh](reports-layout-review/1280-dark-list-before.png) | [Ảnh](reports-layout-review/1280-dark-list-after.png) |
| Danh sách, 1440 sáng | [Ảnh](reports-layout-review/1440-light-list-before.png) | [Ảnh](reports-layout-review/1440-light-list-after.png) |
| Chi tiết, 1280 tối | [Ảnh](reports-layout-review/1280-dark-detail-before.png) | [Thông tin](reports-layout-review/1280-dark-detail-after.png) · [Xử lý](reports-layout-review/1280-dark-processing-detail-after.png) · [Lịch sử](reports-layout-review/1280-dark-history-detail-after.png) |
| Chi tiết, 1440 sáng | [Ảnh](reports-layout-review/1440-light-detail-before.png) | [Thông tin](reports-layout-review/1440-light-detail-after.png) · [Xử lý](reports-layout-review/1440-light-processing-detail-after.png) · [Lịch sử](reports-layout-review/1440-light-history-detail-after.png) |

## Chạy lại

Dùng lệnh cài đặt/chạy dự án và Playwright trong README. Với bản preview đang chạy ở cổng 8444:

```sh
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE="$PWD/.test-tools/node_modules/playwright" node tests/reports-layout.cjs
```

Nếu Playwright nằm ngoài dự án, đặt `PLAYWRIGHT_MODULE` thành đường dẫn tương ứng. `CHROMIUM_PATH` chọn trình duyệt và `TEST_OUTPUT` đổi thư mục ảnh/JSON. Kết quả bố cục ở `reports-layout-review/layout-results.json`; kết quả luồng và kiểm tra ngoài phạm vi ở `reports-layout-review/workflows/`.

## Giới hạn giữ nguyên

Dữ liệu và phân quyền vẫn ở phía trình duyệt, không phải xác thực máy chủ. Không dùng dữ liệu thật. Điều kiện lọc/tab chi tiết là trạng thái giao diện tạm thời, không thêm khóa localStorage; tải lại mở tab thông tin mặc định. Tab lịch sử không cấp thêm quyền và không bổ sung lịch sử cho thao tác cũ chưa từng được ghi. Chưa kiểm tra Firefox/Safari. Không merge hoặc chạy triển khai Production.
