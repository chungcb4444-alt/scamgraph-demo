# Thiết kế lại tiếp nhận phản ánh

Repository: `chungcb4444-alt/scamgraph-demo`. Nhánh `feat/report-intake-redesign`, phát triển từ commit V2 `c801f85` (GitHub hiện là `feat/demo-time-graph-statusV_2`). Không merge hoặc triển khai Production.

## Phạm vi và thay đổi

Đã đọc AGENTS.md và kiểm tra biểu mẫu/dữ liệu/phân quyền trước khi sửa. Không có ảnh mới đính kèm cùng tệp yêu cầu lần này; dùng mô tả cụ thể của yêu cầu, ảnh hiện có trong hội thoại và ảnh chụp trực tiếp bản V2 để đối chiếu. Không tuyên bố đã xem một ảnh mới chưa được gửi.

Biểu mẫu cũ nằm chung App.tsx, cố định loại/thực thể ngân hàng và mã PA-013 cho mọi phiếu, có cột tài liệu/cẩm nang cùng thông báo mẫu gây nhầm với thành công. Thành phần mới `src/ReportIntake.tsx` dùng cùng ứng dụng và nguồn dữ liệu, thay riêng luồng tiếp nhận cùng phần hiển thị/phân loại cần thiết.

- Tên và nút theo vai trò; mô tả trang rõ ràng; một nhãn demo dễ thấy. Sidebar chỉ mục Phản ánh active với cán bộ. Cổng người dân giữ bố cục riêng không có sidebar nghiệp vụ.
- Chữ tiêu đề 28px, phần 20px, nhãn trường 15px, dữ liệu/nút 16px, hướng dẫn/lỗi 14px, nhãn bước 14px; input/button khoảng 46px. CSS nằm trong phạm vi `.report-intake`/`.intake-shell`; không dùng transform hoặc zoom.
- Bốn bước, chỉ đi tiếp sau khi thông tin sự việc hợp lệ; quay lại không mất dữ liệu. Không giữ min-height lớn, không còn cột cẩm nang/lưu ý/tài liệu hoặc bảng lịch sử. Liên kết phụ mở danh sách đúng vai trò.
- Loại bắt buộc, Khác có mô tả, Chưa xác định vẫn gửi được. Gợi ý theo loại không ghi đè nội dung. Dùng trường `behavior` cũ, không thêm trường trùng nghĩa; các nhãn lịch sử được giữ/hiển thị tương thích.
- Thời gian phát sinh từ biểu mẫu theo Việt Nam hoặc đánh dấu chưa nhớ; tiếp nhận lấy khi gửi. Địa bàn cho Chưa xác định; Có/Không/Chưa rõ chuyển tiền; chỉ khi Có mới hỏi số tiền VND. Không tự gán thực thể ngân hàng hoặc cụm cho phiếu tự nhập.
- Thông tin tài khoản, ngân hàng, điện thoại, website, mạng xã hội không bắt buộc. Tài liệu/ảnh mẫu chỉ ở bước Tài liệu; bước Xem lại hiển thị các thông tin đã nhập.
- Cổng web tự ghi Cổng trực tuyến; cán bộ chọn kênh, Nguồn khác cần mô tả.
- Mẫu PA-013 vẫn điền 15 triệu và thực thể mẫu, hỏi xác nhận trước khi ghi đè bản nháp. Khi mẫu đã tồn tại, có thông báo trung tính và nút mở PA-013, không cản tạo phiếu khác.
- Mã tự nhập cấp duy nhất dựa trên dữ liệu đã lưu và bỏ qua PA-013 để giữ cho mẫu. Ví dụ nếu nhập tay trước, có thể nhận PA-014 trong khi tổng phiếu mới là 13; đây không phải bộ đếm tăng sai.
- Ghi phản ánh/nhật ký vào localStorage trước khi báo thành công. Nếu bước lưu thất bại, cố gắng hoàn lại dữ liệu ban đầu, giữ nội dung nhập và báo lỗi; không điều hướng hoặc hiện thành công giả. Bấm liên tiếp không tạo bản ghi trùng trong một phiên.
- Thành công hiện mã vừa tạo, giờ tiếp nhận, mở chi tiết hoặc gửi phiếu khác. Người dân xem chi tiết chỉ đọc; không mở công cụ trích xuất/phân tích của cán bộ.
- Danh sách/bộ lọc/chi tiết/báo cáo hiển thị loại và mô tả Khác. Cán bộ chỉnh phân loại tại bước kiểm tra; giữ `initialBehavior` và nhật ký trước/sau. Không đổi cụm chỉ vì đổi phân loại.

## Kiểm tra

Node 24, pnpm 11.25, Chromium headless trên production preview cục bộ. Không triển khai Production.

- TypeScript, production build: đạt.
- `tests/intake.cjs`: đạt tại 1440×900 và 1280×720, zoom trình duyệt 100%; xác minh cỡ chữ bằng computed styles, không có tràn ngang, thao tác cuối bước có thể bấm sau khi cuộn.
- Đã tạo loại có sẵn, Khác (có/thiếu mô tả), Chưa xác định, không chuyển tiền/chưa rõ, thời gian chưa nhớ. Chuyển bước/quay lại/tải lại giữ nội dung; đổi loại không ghi đè nội dung.
- Mẫu trước/sau khi PA-013 tồn tại, từ chối và chấp nhận ghi đè (suite tình huống biên), chống bấm hai lần; tạo tiếp PA-014..PA-018; loại lọc đúng sau tải lại.
- Đã tiêm lỗi localStorage ở bước ghi nhật ký sau khi ghi phản ánh: không còn phiếu mới sau hoàn lại, không hiện thành công; thử lại khi phục hồi storage tạo đúng một phiếu.
- Cán bộ chọn Nguồn khác/mô tả; đổi loại khi kiểm tra và ghi đúng nhật ký trước/sau; người dân thấy danh sách của vai trò mình và chi tiết chỉ đọc.
- Hồi quy các runner `browser.cjs`, `edge.cjs`, `revision.cjs`: các luồng xác nhận liên kết, số tiền 15→60 và 19→64, hồ sơ/báo cáo, thời gian Việt Nam, migration và sơ đồ thử tải 1.000 vẫn đạt. Các runner được cập nhật thao tác theo biểu mẫu mới, giữ assertion dữ liệu/nghiệp vụ.
- `time.mjs` vẫn đạt ở UTC và America/New_York.

Kết quả JSON: [biểu mẫu](intake-review/results.json), [cấp mã/nhãn dữ liệu cũ](intake-review/model-results.json), [hồi quy luồng chính](intake-review/regression-main.json), [tình huống biên](intake-review/regression-edge.json), [thời gian/sơ đồ/hồ sơ](intake-review/regression-revision.json). Các nhóm trong JSON chứa nhiều assertion, không phải số lượng test case của một framework.

## Ảnh trước/sau

| Màn hình | 1440 × 900 | 1280 × 720 |
| --- | --- | --- |
| Trước khi sửa | [Ảnh](intake-review/1440-before.png) | [Ảnh](intake-review/1280-before.png) |
| Người gửi | [Ảnh](intake-review/1440-citizen-sender.png) | [Ảnh](intake-review/1280-citizen-sender.png) |
| Sự việc người dân | [Ảnh](intake-review/1440-citizen-incident.png) | [Ảnh](intake-review/1280-citizen-incident.png) |
| Thanh hành động khi cuộn | [Ảnh](intake-review/1440-citizen-actions.png) | [Ảnh](intake-review/1280-citizen-actions.png) |
| Tài liệu | [Ảnh](intake-review/1440-documents.png) | [Ảnh](intake-review/1280-documents.png) |
| Xem lại | [Ảnh](intake-review/1440-review-sample.png) | [Ảnh](intake-review/1280-review-sample.png) |
| Thành công đúng mã | [Ảnh](intake-review/1440-success-manual.png) | [Ảnh](intake-review/1280-success-manual.png) |
| Cán bộ tiếp nhận | [Ảnh](intake-review/1440-officer-incident.png) | [Ảnh](intake-review/1280-officer-incident.png) |
| Lỗi lưu, không thành công giả | [Ảnh](intake-review/1440-storage-failure.png) | [Ảnh](intake-review/1280-storage-failure.png) |
| Lọc loại sau tải lại | [Ảnh](intake-review/1440-type-filter-after-reload.png) | [Ảnh](intake-review/1280-type-filter-after-reload.png) |

## Giới hạn

Chỉ tài liệu mẫu HTML, chưa upload/OCR tệp thật. localStorage giới hạn dung lượng và chỉ trên một trình duyệt/origin; chưa bảo đảm cấp mã khi nhiều client ghi đồng thời như hệ thống backend. Phân quyền chỉ là mô phỏng UI, không dùng cho dữ liệu thật. Một số địa bàn là lựa chọn mẫu; chưa tích hợp danh mục hành chính đầy đủ. Chưa kiểm chứng mobile/trình duyệt ngoài Chromium. Trang sự việc dài do thông tin cần nhập, dùng cuộn bình thường và thanh hành động không cố định nên không phủ nội dung.
