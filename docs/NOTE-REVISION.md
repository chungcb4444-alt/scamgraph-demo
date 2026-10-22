# Sửa theo note: thời gian, sơ đồ, trạng thái và bố cục

Nhánh: `feat/demo-time-graph-status`, phát triển tiếp từ bản V1 commit `2ce6d8a`. GitHub hiện đặt tên nhánh V1 là `improve-demo_V1` (nhánh cục bộ trước đó là `feat/improve-demo`). PR dự kiến về `improve-demo_V1`; không merge và không triển khai Production.

## Nguyên nhân

- Mẫu và biểu mẫu chứa mốc tháng 6/2025. Một trường `time` dùng cho cả sự việc và tiếp nhận; có chỗ lưu chuỗi địa phương, chỗ khác hiển thị thẳng không chuẩn hóa. Biểu đồ lấy bảy ngày có bản ghi thay vì bảy ngày lịch.
- Nhãn “Đã kiểm tra” được suy ra từ nhiều trạng thái gốc, nhưng màu lấy trực tiếp từ trạng thái gốc nên cùng nhãn có hai màu. Mức rủi ro và trạng thái kiểm tra đang dùng chung hàm màu.
- Sơ đồ có các vị trí cố định cho bốn phản ánh và vẽ tất cả đường nối. Không có gom nhóm, phân trang nguồn hoặc giới hạn nút để xử lý nhiều phản ánh.
- Header dùng `position: sticky` trong luồng cuộn tài liệu và có chiều cao cố định; nội dung cuộn phía dưới bị header phủ, nhất là khi chữ xuống dòng.
- Số tiền đã là dữ liệu có thể sửa. Không ép PA-013 về 15 triệu: 19 triệu trong ảnh có thể là kết quả người dùng sửa, không đủ căn cứ coi là lỗi dữ liệu.

## Phần đã sửa

### Thời gian

`src/demoTime.ts` quản lý múi giờ `Asia/Ho_Chi_Minh`, định dạng `dd/MM/yyyy HH:mm`, chuyển giá trị `datetime-local` sang ISO UTC và cửa sổ bảy ngày lịch. Không phụ thuộc múi giờ hệ điều hành hoặc trình duyệt.

Phản ánh lưu `occurredAt` từ biểu mẫu, `receivedAt` tại lúc gửi, `updatedAt` khi sửa/xác nhận. Nhật ký lưu giờ thao tác bằng ISO; hồ sơ lưu ngày cập nhật và lịch sử bằng ISO, định dạng khi hiển thị. Bộ mẫu được tạo tương đối lúc khởi tạo/đặt lại, giữ thứ tự; tải lại không tạo lại ngày bản ghi. Trường hợp ngay sau 00:00 được xử lý để mẫu của hôm nay không bị lùi sang hôm qua.

Biểu đồ dùng thời gian tiếp nhận, gồm hôm nay và sáu ngày trước, ngày trống là 0; tự cập nhật cửa sổ khi chuyển ngày trong lúc dashboard đang mở. Bỏ thông báo cập nhật “vừa xong” và ngày cập nhật giả trong cảnh báo/tài khoản.

**Chuyển dữ liệu cũ:** bổ sung trường ISO nhưng giữ toàn bộ phản ánh, số tiền, hồ sơ, danh sách mã PA, nhận định và nhật ký đã có. Bản gốc trước khi chuyển được giữ một lần ở các khóa `scamgraph-demo-*:migration-backup-v1` trong localStorage. Giữ ngày lịch sử cũ, không giả vờ đó là dữ liệu mới hôm nay. Giao diện hiện thông báo giải thích; đặt lại có xác nhận sẽ tạo bộ mẫu theo ngày hiện tại. Do phiên cũ chỉ có một trường thời gian, hai mốc phát sinh/tiếp nhận được điền bằng mốc cũ và đánh dấu chuyển đổi; không thể khôi phục hai mốc thật không từng được lưu. Mốc cũ chỉ có ngày được đọc lúc 00:00 giờ Việt Nam; bản gốc vẫn còn trong backup.

### Sơ đồ

`src/LinkGraph.tsx` thay cách vẽ, giữ sơ đồ thay vì chuyển toàn bộ thành bảng:

- Mặc định các nhóm theo hành vi và thực thể chính; có thể đổi sang nhóm theo ngày tiếp nhận.
- Mở/thu nhóm; mỗi trang chỉ vẽ tối đa 5 phản ánh, 3 nhóm và 5 thực thể. Phân trang nhóm, thực thể và phản ánh độc lập. Số nút/cạnh và X/Y phản ánh đang vẽ được hiển thị.
- Chọn nút làm nổi quan hệ trực tiếp; phần khác mờ đi. Chọn cạnh để xem quan hệ và nguồn. Nhãn dài xuất hiện cho một cạnh được chọn/rê chuột; “Hiện nhãn” hiển thị loại quan hệ ngay tại các thực thể, tránh phủ nhiều nhãn dài lên nhau.
- Tìm kiếm, lọc thực thể, phóng to/thu nhỏ, vừa khung. Bảng chi tiết có tổng nguồn/tổng tiền toàn bộ phạm vi chọn, tìm kiếm và phân trang 5 nguồn; mở đúng phản ánh gốc.
- Nhóm/lọc chỉ để khám phá, không thay đổi liên kết đã xác nhận hoặc phạm vi tạo hồ sơ. Tạo hồ sơ vẫn dùng toàn bộ cụm được xác nhận.
- Thử tải riêng 1.000 phản ánh cùng một tài khoản, không ghi vào bộ 12 phản ánh, không được lập hồ sơ/cảnh báo từ dữ liệu thử tải. Có thể xem nội dung nguồn thử tải ngay trong hộp thoại riêng.

**Giới hạn:** chỉ đối chứng đến 1.000 bản ghi giả lập trên Chromium trong môi trường này; không khẳng định tốc độ/khả năng cho dữ liệu lớn hơn, máy khác hoặc backend. Bố cục vẫn có thể cần lọc khi nhiều loại quan hệ. Phóng to nằm trong khung SVG, chưa có thao tác kéo/pan tự do.

### Trạng thái và bố cục

`src/workflow.tsx` có một bảng quy định và `WorkflowBadge` dùng chung cho danh sách, chi tiết và dashboard (qua bảng phản ánh). “Chờ kiểm tra” luôn xám; “Đã kiểm tra” luôn xanh lá. Giữ trạng thái “Không hợp lệ” vốn có; không thêm trạng thái chỉ để đủ màu. Rủi ro/ưu tiên giữ nhãn riêng. Lưu thông tin đã kiểm tra chuyển trạng thái kiểm tra ngay, không cần đồng nhất nó với việc xác nhận liên kết.

Header trở về luồng tài liệu bình thường, tự tăng chiều cao khi xuống dòng; không có khoảng bù cố định. Sidebar cuộn độc lập khi cần. Modal giữ vùng nội dung cuộn và nút đóng/thao tác trong khung.

### Đồng bộ số tiền và hồ sơ

Mẫu PA-013 mặc định 15 triệu. Sửa 19 triệu được giữ và ghi nhật ký trước/sau. Trước xác nhận, CUM-001 vẫn 45 triệu; sau xác nhận là 60 hoặc 64 triệu theo giá trị đã lưu. Tổng các màn hình đọc từ cùng dữ liệu.

Hồ sơ giữ snapshot **danh sách mã phản ánh khi tạo**, không phải snapshot cứng số tiền. Phản ánh mới liên kết vào cụm không tự lọt vào hồ sơ đã có; báo cáo lấy dữ liệu hiện tại của đúng các mã PA thuộc hồ sơ đó.

## Kiểm tra đã chạy

- Cài dependency theo lockfile hiện có; TypeScript và production build đạt.
- `tests/time.mjs` chạy với host timezone UTC và America/New_York: mốc 23:59/00:00 Việt Nam, bảy ngày lịch, ngày 0, tổng cửa sổ, chuyển dữ liệu cũ và tính lặp lại, đặt lại ngay sau nửa đêm đều đạt.
- `tests/browser.cjs`: toàn bộ luồng 15 triệu → 60 triệu, hồ sơ/báo cáo, tài khoản, nhật ký, lưu trạng thái/reset ở 1440 × 900 và 1280 × 720.
- `tests/edge.cjs`: trường bắt buộc, số âm, gửi trùng, quyền chỉ xem, nguồn CUM-002/HS-002, lọc/tìm kiếm/tab/điều hướng; không có request API bên ngoài.
- `tests/revision.cjs`: giả lập đồng hồ ngay trước/sau nửa đêm Việt Nam khi browser ở America/Los_Angeles; kiểm tra phát sinh khác tiếp nhận; sửa PA-013 19 triệu, CUM-001 64 triệu, hồ sơ cũ 3 PA/45 triệu và hồ sơ mới 4 PA/64 triệu; migration thực trong browser; màu chuẩn; header khi cuộn; nhãn/zoom/lọc/nguồn; thử tải ở cả hai viewport.

Bộ thử tải đã quan sát **13 nút, 29 cạnh** khi mở rộng trang 5 phản ánh trong nhóm 250 nguồn của bộ 1.000 bản ghi. Tổng toàn bộ vẫn 1.000 phản ánh/1.000 triệu, tổng nhóm vẫn 250/250 triệu, không tính nhầm theo 5 nút đang vẽ. Các con số thời gian trong JSON là thời lượng chuỗi thao tác kiểm thử, không phải benchmark FPS hay thời gian render thuần.

Kết quả hiện tại: [revision-results.json](review-v2/revision-results.json), [luồng chính](review-v2/results.json), [tình huống biên](review-v2/edge-results.json), [UTC](review-v2/time-utc.json), [New York](review-v2/time-new-york.json).

## Ảnh đối chiếu

Ảnh PNG được chụp ở đúng viewport trong tên file, zoom trình duyệt 100%. Thư mục [review-v2](review-v2) là kết quả lần sửa này; `review` giữ bằng chứng của lần sửa trước.

| Phần | 1440 × 900 | 1280 × 720 |
| --- | --- | --- |
| Biểu đồ trước nửa đêm | [Ảnh](review-v2/1440-calendar-before-midnight.png) | [Ảnh](review-v2/1280-calendar-before-midnight.png) |
| Biểu đồ sau nửa đêm, ngày trống | [Ảnh](review-v2/1440-calendar-after-midnight.png) | [Ảnh](review-v2/1280-calendar-after-midnight.png) |
| Sơ đồ nhỏ và căn cứ | [Ảnh](review-v2/1440-structured-graph-small.png) | [Ảnh](review-v2/1280-structured-graph-small.png) |
| Thử tải 1.000 bản ghi | [Ảnh](review-v2/1440-stress-1000-bounded.png) | [Ảnh](review-v2/1280-stress-1000-bounded.png) |
| Màu trạng thái | [Ảnh](review-v2/1440-consistent-status-colors.png) | [Ảnh](review-v2/1280-consistent-status-colors.png) |
| Nhật ký | [Ảnh](review-v2/1440-journal-layout.png) | [Ảnh](review-v2/1280-journal-layout.png) |

Chưa kiểm thử trình duyệt ngoài Chromium, thiết bị mobile, dữ liệu lớn hơn 1.000 hoặc bảo mật vận hành. Không thêm backend/OCR/AI/API thật.
