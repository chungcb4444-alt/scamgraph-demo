# Bốn sửa lỗi thao tác nghiệp vụ

Ngày 28/10/2026, so với commit `f9676a0`. Giữ nguyên giao diện và nghiệp vụ ngoài bốn điểm được yêu cầu. Không đổi cấu trúc bản ghi hoặc khóa localStorage; không đặt lại dữ liệu, merge hay chạy triển khai Production.

## 1. Nội dung hồ sơ chưa lưu

- Dùng trạng thái thay đổi tổng hợp của `CaseWorkPanel` cho phân công, ưu tiên, chỉ đạo, nhận định, trạng thái xử lý, tiến độ, tài liệu mẫu, báo cáo, ý kiến xem xét và yêu cầu xem xét nguồn.
- Bỏ việc đánh dấu thay đổi trùng ở khối capture chung. Hàm lưu không tự xóa cờ chung khi một biểu mẫu khác còn thay đổi chưa lưu.
- So sánh nội dung báo cáo với giá trị gốc của chính biểu mẫu, tránh báo chưa lưu chỉ vì nhận định hồ sơ vừa được cập nhật. Không tự chép đè nội dung báo cáo đang soạn.
- Đăng ký cảnh báo `beforeunload` trước khi trình duyệt vẽ lại giao diện sau thay đổi. Giữ cảnh báo rời trang, đăng xuất, chuyển tài khoản; đổi tab hồ sơ giữ biểu mẫu đang nhập.
- Lưu thành công từng phần chỉ làm sạch phần đã lưu. Hủy rời trang giữ nội dung; đồng ý rời trang bỏ phần chưa lưu theo thông báo. Không thêm cơ chế tự lưu hoặc khóa lưu trữ.

## 2. Trạng thái phản ánh

- `reportStages.ts` đọc `intakeStatus`, `analysisStatus` và `cluster`, dùng lại `migrateReport` làm dự phòng thuần đọc cho bản ghi cũ.
- Danh sách và đầu trang chi tiết dùng chung cách đọc trạng thái. Đầu trang phân biệt **Tiếp nhận**, **Phân tích**, **Liên kết**; số công việc kiểm tra ở thống kê cũng không đọc nhãn `status` cũ.
- PA-001 giữ nguyên trạng thái phân tích “Đang phân tích” và liên kết CUM-001. Việc hiển thị không thêm `reviewed`, xác nhận cụm, thay đổi trạng thái lưu hoặc ghi nhật ký.
- Các điều kiện tiếp nhận, kiểm tra và xác nhận liên kết trong hàm nghiệp vụ được giữ nguyên.

## 3. Bộ lọc cảnh báo

- Chỉ chọn trong kết quả lọc. Khi lựa chọn cũ không phù hợp, chọn kết quả đầu tiên và giữ lựa chọn mới khi mở rộng bộ lọc.
- Không có kết quả thì cả danh sách và khung chi tiết đều có thông báo trống; không còn điểm, số tiền hoặc thao tác của cảnh báo trước.
- Khi tài khoản không có cảnh báo nào trong phạm vi, bộ lọc và hai vùng trống vẫn hoạt động an toàn.
- Điểm, yếu tố cảnh báo, dữ liệu nguồn, quyền và thao tác mở sơ đồ/tạo hồ sơ không thay đổi.

## 4. Hồ sơ cùng nguồn đã tồn tại

- Hộp tạo hồ sơ liệt kê các hồ sơ cùng cụm trong quyền xem hiện tại: mã, tên, trạng thái, bộ mã nguồn và nút mở hồ sơ.
- So sánh tập mã không phụ thuộc thứ tự. Hồ sơ cùng cụm nhưng khác tập nguồn được ghi rõ, ví dụ 3 phản ánh cũ và 4 phản ánh hiện tại.
- Có hồ sơ cùng cụm và cùng tập phản ánh thì phải tích xác nhận chủ động trước khi tạo thêm. Không áp đặt một cụm chỉ có một hồ sơ.
- Xác nhận chỉ có hiệu lực với cụm, tập mã nguồn và các hồ sơ trùng đã xem. Đổi cụm/nguồn hoặc tạo thêm một hồ sơ trùng làm xác nhận cũ mất hiệu lực. Hàm `applyOperation` tính lại điều kiện trước khi tạo.
- Khóa thao tác ngay lần bấm đầu trong bộ nhớ và vô hiệu hóa nút khi đang tạo, tránh hai lần bấm đồng bộ tạo hai hồ sơ. Lỗi lưu cho phép thử lại và yêu cầu xác nhận lại nếu có trùng.
- Hồ sơ mới vẫn chưa phân công. Không sửa, gộp, xóa hồ sơ cũ, tự thêm nguồn vào hồ sơ cũ hoặc sửa bản báo cáo đã lưu.

## Các file mã nguồn thay đổi

| File | Mục đích |
| --- | --- |
| `src/App.tsx` | Cảnh báo rời trang hồ sơ, trạng thái hiển thị, chọn cảnh báo theo lọc, hộp tạo hồ sơ và xác nhận |
| `src/CaseWorkPanel.tsx` | Theo dõi các biểu mẫu chưa lưu và giá trị gốc báo cáo |
| `src/reportStages.ts` | Đọc ba giai đoạn trạng thái, dự phòng bản ghi cũ |
| `src/ReportStatusBadges.tsx` | Hiển thị trạng thái nhất quán |
| `src/caseSources.ts` | Đối chiếu nguồn, phạm vi hồ sơ liên quan và xác nhận trùng |
| `src/operations.ts` | Kiểm tra xác nhận tạo trùng trong hàm ghi nghiệp vụ |
| `src/workflowFixes.css` | Định dạng vùng hồ sơ liên quan, xác nhận và trạng thái trống |
| `src/main.tsx` | Nạp CSS bổ sung |

## Kết quả kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| TypeScript / Vite build | Đạt |
| `tests/four-fixes.mjs` | Đạt — trạng thái cũ chỉ đọc, nguồn không phụ thuộc thứ tự, xác nhận trùng, từ chối xác nhận cũ/ngoài quyền, nguồn 3 → 4 và giữ bản cũ |
| `tests/four-fixes.cjs` | Đạt — 1440×900 và 1280×720, cả sáng/tối |
| `tests/access.mjs` | Đạt — quyền, phạm vi và chuyển trạng thái |
| `tests/intake-model.mjs` | Đạt — ID PA-013 và loại phản ánh |
| `tests/time.mjs` với host America/New_York | Đạt — thời gian Việt Nam và dữ liệu cũ |
| `tests/roles.cjs` | Đạt — luồng đầy đủ bảy vai trò, hai kích thước |
| `tests/roles-negative.cjs` | Đạt — ngoài phạm vi, tài khoản khóa, dữ liệu cũ, lỗi lưu và đặt lại có xác nhận |
| `tests/reports-layout.cjs` | Đạt — bộ lọc, tab, nháp và dữ liệu chỉ xem của hai trang phản ánh, cả sáng/tối ở hai kích thước |

Kiểm thử mới kiểm tra từng biểu mẫu hồ sơ, hủy/đồng ý tải lại, rời trang, đăng xuất, chuyển tài khoản, giữ nháp qua tab, sửa nhiều phần và chỉ lưu một phần, chỉ xem hoặc đã lưu không cảnh báo. Kiểm tra thêm bấm tạo hai lần đồng bộ, mở hồ sơ liên quan, thay cụm xóa xác nhận, nguồn 3/45 → 4/60 và trạng thái trống khi không có cảnh báo trong phạm vi.

Các thao tác chỉ xem, lọc và đổi tab được đối chiếu nguyên chuỗi lưu trữ phản ánh, hồ sơ, tài khoản và nhật ký: không thay đổi. Bài kiểm thử nguồn mở rộng dùng dữ liệu riêng trong browser context; luồng tạo, bổ sung, kiểm tra và liên kết PA-013 thật qua giao diện vẫn được kiểm tra riêng trong `roles.cjs`.

Luồng hiện có giữ các mốc: 12 → 13 phản ánh, CUM-001 3/45 → 4/60 chỉ sau xác nhận, hồ sơ mới đủ bốn phản ánh và chờ phân công, CUM-002 3/25, HS-002 chỉ PA-008/30. Báo cáo nháp/trình/trả sửa/duyệt và phiên bản duyệt cũ đều được kiểm tra lại.

Đối chiếu mã với `f9676a0`: **27 file giữ nguyên từng byte**, gồm phân quyền, dữ liệu kiểu, biểu mẫu gửi phản ánh, login, sơ đồ, CSS cũ, cấu hình và lockfile; **10 khối dữ liệu/hàm chính trong App** và **13 nhánh nghiệp vụ ngoài tạo hồ sơ** giữ nguyên token. Chi tiết: [preservation.json](four-fixes-review/preservation.json).

## Ảnh minh họa và dữ liệu kiểm tra

| Nội dung | 1280 tối | 1440 sáng |
| --- | --- | --- |
| Ba thông tin trạng thái PA-001 | [Ảnh](four-fixes-review/1280-dark-report-stages.png) | [Ảnh](four-fixes-review/1440-light-report-stages.png) |
| Bộ lọc cảnh báo không có kết quả | [Ảnh](four-fixes-review/1280-dark-alerts-empty.png) | [Ảnh](four-fixes-review/1440-light-alerts-empty.png) |
| Hồ sơ trùng và xác nhận chủ động | [Ảnh](four-fixes-review/1280-dark-duplicate-case.png) | [Ảnh](four-fixes-review/1440-light-duplicate-case.png) |
| Cụm có thêm nguồn, khác hồ sơ cũ | [Ảnh](four-fixes-review/1280-dark-expanded-source.png) | [Ảnh](four-fixes-review/1440-light-expanded-source.png) |
| Hồ sơ sau khi lưu các phần | [Ảnh](four-fixes-review/1280-dark-case-saved.png) | [Ảnh](four-fixes-review/1440-light-case-saved.png) |

Ảnh còn lại, JSON kết quả và đối chiếu mã: [four-fixes-review](four-fixes-review). Thông báo beforeunload là hộp thoại trình duyệt; các bài kiểm thử xác nhận loại hộp thoại và kiểm tra dữ liệu khi chấp nhận/hủy, không chụp hộp thoại hệ thống vào ảnh trang.

## Chạy lại

Cài đặt và chạy build/preview theo README, sau đó:

```sh
node tests/four-fixes.mjs
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE="$PWD/.test-tools/node_modules/playwright" node tests/four-fixes.cjs
```

Có thể dùng `CHROMIUM_PATH` chọn Chromium và `TEST_OUTPUT` đổi thư mục kết quả. Nếu Playwright được cài ngoài dự án thì chỉ định đường dẫn tương ứng. Các bài kiểm thử dùng phiên trình duyệt riêng, không tác động phiên review của người dùng.

## Giới hạn

- Cảnh báo tải lại/đóng tab dùng cơ chế trình duyệt, không phải tự lưu nháp. Nội dung thông báo do trình duyệt quyết định; chưa kiểm tra Safari/Firefox hoặc hành vi đóng ứng dụng di động.
- localStorage vẫn theo origin và chưa hỗ trợ sửa đồng thời nhiều tab. Xác nhận trùng phục vụ thao tác phía trình duyệt, không phải bảo mật hoặc khóa giao dịch máy chủ.
- Không thêm backend, OCR/AI, API, dữ liệu thật hoặc chức năng ngoài bốn điểm được yêu cầu.
