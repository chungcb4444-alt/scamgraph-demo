# Tiếp nhận, nhận việc và xem xét ý kiến

Bản nâng cấp ngày 30/10/2026, nền `b0a418791e7e0198a21360967d5cd5e4acc494ea`, cập nhật trên cùng nhánh `Hệ-Thống-Truy-Vết-Demo`. Không đổi repository, không đặt lại dữ liệu, không merge hoặc chạy triển khai Production.

## Ý nghĩa từng bước

| Việc | Người thực hiện | Kết quả được lưu | Không tự thực hiện |
| --- | --- | --- | --- |
| Gửi phản ánh | Người dân / tiếp nhận | Phiếu mới và thời điểm hệ thống nhận `receivedAt` | Cán bộ nhận phiếu, kiểm tra nội dung, liên kết |
| Xác nhận tiếp nhận | Tiếp nhận đúng phạm vi | Danh tính/vai trò/đơn vị/thời điểm tiếp nhận riêng; phiếu mới chuyển “Đang kiểm tra” | Xác minh đúng sai, kiểm tra trích xuất, gán cụm |
| Chuyển phân tích | Tiếp nhận | Bàn giao và cán bộ phân tích, giữ nguyên lời khai | Xác nhận kết quả phân tích |
| Phân công hồ sơ | Lãnh đạo | Người được giao và bản ghi lần phân công mới | Cán bộ tự động nhận việc |
| Nhận xử lý | Đúng cán bộ được giao | Xác nhận nhận gắn với lần phân công, người nhận và thời điểm | Hoàn tất xác minh, duyệt báo cáo |
| Tiếp nhận ý kiến / yêu cầu | Người nhận phù hợp | Xác nhận đã nhận nội dung cụ thể | Duyệt nội dung hoặc tự sửa nguồn |
| Xem xét kiến nghị | Lãnh đạo là người nhận | Quyết định và lý do cho đúng phiên bản | Đóng hồ sơ hoặc duyệt báo cáo thay |
| Phê duyệt báo cáo | Lãnh đạo trong đơn vị | Quyết định cho phiên bản báo cáo đã trình | Tự đóng hồ sơ hoặc kết luận vi phạm |

Không có nút “Duyệt hồ sơ” chung chung. Trang hồ sơ tổng hợp **trạng thái xem xét báo cáo mới nhất**, đồng thời hiển thị riêng việc nhận xử lý và các kiến nghị nội bộ.

## 1. Phản ánh mới

Luồng: **Hệ thống nhận phiếu → chờ cán bộ xác nhận → đang kiểm tra → chờ bổ sung / không hợp lệ / chuyển phân tích**, theo các điều kiện xử lý hiện có.

- Phiếu tạo sau nâng cấp có `receiptWorkflow: 2`. Trước xác nhận, cán bộ đọc thông tin và bấm **Xác nhận tiếp nhận** trong tab **Xử lý nghiệp vụ**; các thao tác tiếp nhận xử lý chưa được mở.
- Xác nhận lưu `intakeReceipt` gồm tài khoản, họ tên, vai trò, đơn vị, thời điểm thật của thao tác. Không ghi đè `receivedAt` hoặc thời điểm sự việc.
- Phiếu mới chuyển từ `Mới tiếp nhận` sang `Đang kiểm tra`. Cán bộ tiếp tục ghi chú, yêu cầu bổ sung, đánh dấu không hợp lệ có lý do, hoặc bàn giao phân tích.
- Khi người dân bổ sung, lời khai gốc và xác nhận tiếp nhận ban đầu giữ nguyên; nội dung bổ sung có tác giả/thời điểm riêng và phiếu trở lại kiểm tra. Phiếu cũ chưa có xác nhận vẫn dùng luồng bổ sung cũ.
- Người dân thấy tiến độ công khai và thời điểm bộ phận tiếp nhận; không thấy ghi chú nội bộ hoặc người được giao phân tích.
- Bộ lọc nâng cao có **Xác nhận tiếp nhận**; dòng trạng thái thêm nhắc chờ/đã xác nhận đối với phiếu dùng luồng mới. Hai vị trí Tiếp nhận/Phân tích tiếp tục dùng lưới căn cột trước đó.

## 2. Phân công và nhận hồ sơ

Luồng nhận việc tách khỏi trạng thái xử lý: **Chưa phân công → chờ nhận xử lý → đã nhận xử lý**.

- Hồ sơ mới có marker v2, chưa phân công và không tự nhận theo người đăng nhập.
- Mỗi lần đổi người được giao tạo một bản ghi `assignments` mới gồm mã lần giao, người giao, người nhận, đơn vị và thời điểm. Lần trước giữ nguyên.
- Người mới được giao đọc được hồ sơ và nguồn thuộc phạm vi, nhưng phải bấm **Nhận xử lý hồ sơ** trước khi cập nhật tiến độ, nhận định, yêu cầu nguồn hoặc lập/trình báo cáo.
- Xác nhận lưu vào đúng lần giao hiện tại; tài khoản khác không nhận thay được. Nhận một lần không áp dụng khi giao lại cho người khác, kể cả giao A → B → A.
- Chỉ sửa ưu tiên hoặc thêm chỉ đạo với cùng người phụ trách không tạo lần giao mới và không xóa xác nhận đã nhận.
- Điều kiện khóa phân công khi báo cáo đang trình hoặc đã duyệt giữ nguyên. Trạng thái xử lý không tự thay đổi khi nhận việc.
- Danh sách hồ sơ có thông tin và bộ lọc nhận việc, bộ lọc trạng thái xem xét báo cáo; chi tiết có người nhận, thời gian và lịch sử phân công.

## 3. Tab “Ý kiến / Yêu cầu”

Tab luôn giữ các biểu mẫu trong bộ nhớ khi chuyển qua Tổng quan/nguồn/tài liệu; nội dung chưa lưu tham gia cùng cơ chế cảnh báo tải lại, rời trang và chuyển tài khoản. Lưu một biểu mẫu không làm sạch các biểu mẫu khác còn thay đổi.

### Ghi chú nội bộ

- Phân tích, người xử lý được phép làm việc và lãnh đạo có thể gửi đến tài khoản phù hợp có quyền đọc cùng hồ sơ.
- Ghi rõ người gửi/vai trò/thời gian, người nhận và nội dung. Không mặc định yêu cầu phê duyệt.
- Có tùy chọn yêu cầu người nhận xác nhận tiếp nhận; chỉ đúng người nhận có vai trò thao tác phù hợp được xác nhận. Không ghi nhận đã đọc chỉ vì mở trang.
- Ghi chú luôn ghi rõ **Không yêu cầu phê duyệt**. Sau gửi không có thao tác sửa đè hoặc xóa.
- Ghi chú chưa được tiếp nhận không khóa xử lý hoặc báo cáo của hồ sơ.

### Yêu cầu xem xét lại dữ liệu nguồn

- Giữ nút gửi yêu cầu hiện có trong Tổng quan của cán bộ xử lý; nội dung và tiến độ được xem trong tab Ý kiến / Yêu cầu.
- Yêu cầu mới: **Chờ tiếp nhận → Đang xử lý → Đã hoàn thành**.
- Cán bộ phân tích trong phạm vi bấm **Tiếp nhận yêu cầu nguồn** để nhận xử lý; chỉ người đã nhận được hoàn thành bằng phản hồi không rỗng.
- Hoàn thành lưu người phản hồi/vai trò/đơn vị/thời điểm và nội dung, không tự sửa thực thể nguồn.
- Yêu cầu cũ không có thông tin nhận được ghi là dữ liệu cũ chưa ghi nhận; có thể tiếp nhận thực sự rồi phản hồi. Không thay đổi tác giả/thời gian/nội dung gốc.
- Thống kê chỉ tính yêu cầu chưa hoàn thành; hồ sơ có nhiều yêu cầu vẫn được tính là một hồ sơ có việc mở khi còn ít nhất một yêu cầu chưa đóng.

### Kiến nghị riêng cần lãnh đạo xem xét

Luồng: **Bản nháp → Đã gửi → Đã tiếp nhận → Đã duyệt / Yêu cầu chỉnh sửa / Không chấp thuận**.

- Tác giả chọn lãnh đạo hợp lệ làm người nhận, lưu nháp và chủ động trình. Không tự duyệt cho chính mình.
- Nháp chỉ hiển thị cho tác giả; các phiên bản trước đã gửi vẫn được người có quyền đọc hồ sơ xem.
- Lãnh đạo đúng người nhận phải xác nhận tiếp nhận trước khi duyệt/trả sửa/không chấp thuận. Trả sửa và không chấp thuận phải có lý do.
- Không sửa nội dung đã gửi đang chờ xem xét. Sau trả sửa, duyệt hoặc không chấp thuận, tác giả soạn và lưu phiên bản tiếp theo; nội dung, quyết định và tác giả của các phiên bản cũ giữ nguyên.
- Ý kiến người khác không được sửa/trình thay. Các quyết định ghi rõ phiên bản, người thực hiện, vai trò và thời gian.
- Kiến nghị này dành cho nội dung riêng. Nhận định đã đưa vào báo cáo dùng luồng duyệt báo cáo hiện có; không có chuyển đổi ghi chú cũ hoặc tự tạo bản kiến nghị song song.
- Trang lãnh đạo có số kiến nghị đang chờ và nút mở đúng tab Ý kiến / Yêu cầu.

## 4. Báo cáo và dữ liệu sau lần lưu nháp

- So sánh nội dung hồ sơ và nguồn với bản chụp đã lưu, không chỉ so sánh thời gian cập nhật.
- Thay nhận định, trạng thái, ưu tiên, người phụ trách hoặc dữ liệu nguồn có liên quan làm bản nháp cần được kiểm tra lại. Ghi chú, nhận việc và hoạt động thảo luận không tự làm cũ bản chụp.
- Hiển thị nhắc và chặn trình bản nháp có dữ liệu cũ ở cả giao diện lẫn hàm thực hiện. Người lập kiểm tra rồi bấm **Lưu bản nháp báo cáo** để chủ động cập nhật; không tự ghi đè văn bản đang soạn.
- Báo cáo bị trả sửa giữ lại nội dung, tác giả, bản chụp, thời điểm trình và quyết định cũ trong `previousSubmissions` khi người lập lưu lại nháp. Có nút xem/in lần trình trước trong mục mở rộng của phiên bản.
- Bản đã phê duyệt giữ nguyên; soạn tiếp vẫn tạo phiên bản báo cáo mới như trước.

## Quyền và điều kiện

| Vai trò | Bổ sung | Giới hạn giữ nguyên |
| --- | --- | --- |
| Người dân | Xem tiến độ tiếp nhận và bổ sung phiếu của mình | Không có hồ sơ/ý kiến nội bộ, không xác nhận thay cán bộ |
| Tiếp nhận | Xác nhận nhận phiếu; xử lý tiếp sau xác nhận đối với phiếu mới | Không phân tích/liên kết, không nhận xử lý hoặc duyệt hồ sơ |
| Phân tích | Nhận/phản hồi/hoàn thành yêu cầu nguồn; ghi chú và kiến nghị trong phạm vi | Không sửa xử lý thay người được giao, không duyệt kiến nghị hoặc báo cáo |
| Xử lý | Nhận đúng lần phân công; xử lý, gửi yêu cầu, ghi chú/kiến nghị và báo cáo sau nhận | Không tự phân công, nhận thay hoặc duyệt |
| Lãnh đạo | Theo dõi nhận việc; tiếp nhận và quyết định kiến nghị gửi cho mình; duyệt báo cáo | Không nhận việc thay cán bộ, không sửa nguồn/nhận định thay tác giả |
| Giám sát | Đọc lịch sử, ý kiến đã gửi và các quyết định trong phạm vi | Không tiếp nhận, phản hồi, nhận việc, tạo/sửa hoặc duyệt |
| Quản trị | Quản lý tài khoản và nhật ký quản trị như trước | Không mở rộng sang nghiệp vụ |

Các quyền đọc `canReadCase`/`canReadReport` giữ nguyên. Quyền mới và điều kiện từng nội dung được kiểm tra trong `applyOperation`, không chỉ ở nút. Bấm lặp trong cùng lượt thao tác được chặn; hàm nghiệp vụ từ chối nhận lại hoặc quyết định sai trạng thái. Các lần lưu nối tiếp lấy dữ liệu vừa commit để tránh ghi đè thay đổi trước. Lỗi lưu vẫn dùng phục hồi localStorage hiện có.

## Tương thích dữ liệu cũ

- Không đổi khóa localStorage hoặc ID phản ánh/hồ sơ; không reset hoặc tạo lại bộ dữ liệu khi nâng cấp.
- `migrateReport`, `migrateCase` và các bộ mẫu cũ giữ nguyên mã. Không thêm marker, người nhận, thời gian hoặc sự kiện lịch sử cho bản ghi cũ khi chỉ mở xem.
- Phiếu cũ tiếp tục xử lý theo quyền cũ nếu chưa có marker v2. Với phiếu chưa bàn giao, cán bộ có thể xác nhận tiếp nhận thực sự; lưu thời điểm thao tác hiện tại, không suy diễn ngày quá khứ.
- Phân công cũ không có bản ghi nhận việc vẫn xử lý được và được ghi rõ **Dữ liệu cũ chưa ghi nhận nhận việc**. Không có người nhận hoặc thời gian được dựng lên. Một lần đổi người phụ trách thực sự sau nâng cấp sẽ áp dụng bước nhận việc mới.
- Hồ sơ cũ đã hoàn thành/báo cáo cũ đã duyệt không bị lùi trạng thái. Ghi chú/nhận định/lịch sử cũ không bị chuyển thành ý kiến mới hoặc gán trạng thái duyệt giả.
- Khối lời khai, tài liệu, cụm, các mã nguồn và bản đã duyệt được giữ. Những trường mới chỉ xuất hiện khi tạo hoặc thực hiện thao tác mới tương ứng.

## Cách review

1. Chọn Nguyễn Hoàng Minh, gửi mẫu PA-013 (không tạo sẵn).
2. Trần Minh Tuấn mở phiếu → tab Xử lý nghiệp vụ → Xác nhận tiếp nhận. Có thể yêu cầu người dân bổ sung, sau đó bàn giao Nguyễn Xuân Sơn.
3. Nguyễn Xuân Sơn kiểm tra/sửa trích xuất, lưu, xem căn cứ và xác nhận liên kết. CUM-001 chỉ tăng từ 3/45 lên 4/60 tại bước xác nhận.
4. Tạo hồ sơ mới từ cụm; Nguyễn Duy Hoàng phân công Lê Minh Anh hoặc Trần Quốc Huy.
5. Đúng người được giao mở hồ sơ và bấm Nhận xử lý, rồi cập nhật tiến độ/nhận định và báo cáo.
6. Cán bộ có thể gửi yêu cầu nguồn tại Tổng quan; phân tích tiếp nhận/phản hồi trong tab Ý kiến / Yêu cầu.
7. Gửi ghi chú thông thường hoặc lưu/trình kiến nghị riêng. Lãnh đạo mở từ hàng đợi, xác nhận tiếp nhận, trả sửa hoặc quyết định đúng phiên bản.
8. Kiểm tra cảnh báo báo cáo cũ, lưu lại nháp có chủ đích, trình/duyệt báo cáo; xem lại các lần trình và phiên bản cũ. Giám sát đối chiếu nhật ký.

## Kiểm thử và ảnh

| Bài kiểm tra | Kết quả |
| --- | --- |
| TypeScript và Vite build | Đạt |
| `tests/receipt-workflow.mjs` | Đạt — quyền, nhận việc, phân công lại, đóng yêu cầu, ghi chú/kiến nghị, phiên bản và dữ liệu cũ |
| `tests/receipt-workflow.cjs` | Đạt — luồng mới, nháp qua nhiều biểu mẫu, sáng/tối, 1280×720 và 1440×900 |
| `tests/access.mjs` | Đạt, thêm nhận xử lý vào luồng mới, giữ các kiểm tra cũ |
| `tests/roles.cjs` | Đạt — luồng PA-013 đến phê duyệt và phiên bản mới ở hai kích thước; thêm bước nhận phiếu/nhận việc, không bỏ các kiểm tra trước |
| `tests/roles-negative.cjs` | Đạt — ngoài phạm vi, dữ liệu cũ, tài khoản khóa, lỗi lưu, đặt lại có xác nhận |
| `tests/reports-layout.cjs` | Đạt — bộ lọc, tab, nháp, dữ liệu chỉ xem; sáng/tối ở hai kích thước |
| `tests/four-fixes.mjs` / `tests/four-fixes.cjs` | Đạt — dữ liệu trạng thái, cảnh báo, xác nhận hồ sơ trùng và bảo vệ nội dung chưa lưu |
| `tests/intake-model.mjs` / `tests/time.mjs` | Đạt — mã mẫu và thời gian Việt Nam |

Các mốc 12 → 13 phản ánh, 3/45 → 4/60 sau xác nhận, hồ sơ mới chứa bốn mã nguồn và chưa phân công, CUM-002 3/25 và HS-002 PA-008/30 đều được kiểm tra. Bài kiểm thử chuyên biệt còn đối chiếu nguyên 12 phản ánh cũ và HS-002 sau luồng mới: không thay đổi. Các trường hợp sai quyền/sai đơn vị bị từ chối không làm biến đổi dữ liệu. Mỗi bài dùng phiên trình duyệt riêng.

Đối chiếu nền `b0a4187`: **28 file giữ nguyên từng byte**, gồm login, biểu mẫu gửi, sơ đồ, cơ chế che/hiện, CSS cũ (có cả căn cột), cấu hình và lockfile; **15 khối dữ liệu/hàm** giữ nguyên token, gồm bộ mẫu, chuyển đổi dữ liệu cũ, quyền đọc và phạm vi nhật ký. [Chi tiết đối chiếu](receipt-workflow-review/preservation.json).

| Minh họa | 1280 tối | 1440 sáng |
| --- | --- | --- |
| Tiếp nhận phiếu | [Ảnh](receipt-workflow-review/1280-dark-intake-accepted.png) | [Ảnh](receipt-workflow-review/1440-light-intake-accepted.png) |
| Nhận hồ sơ | [Ảnh](receipt-workflow-review/1280-dark-case-received.png) | [Ảnh](receipt-workflow-review/1440-light-case-received.png) |
| Phản hồi/hoàn thành nguồn | [Ảnh](receipt-workflow-review/1280-dark-source-completed.png) | [Ảnh](receipt-workflow-review/1440-light-source-completed.png) |
| Kiến nghị phiên bản 2 đã duyệt | [Ảnh](receipt-workflow-review/1280-dark-opinion-approved.png) | [Ảnh](receipt-workflow-review/1440-light-opinion-approved.png) |
| Cảnh báo bản nháp báo cáo cũ | [Ảnh](receipt-workflow-review/1280-dark-report-stale.png) | [Ảnh](receipt-workflow-review/1440-light-report-stale.png) |

JSON, ảnh ở [receipt-workflow-review](receipt-workflow-review). Để chạy lại, cài Playwright theo README rồi dùng:

```sh
node tests/receipt-workflow.mjs
DEMO_URL=http://127.0.0.1:8444/ PLAYWRIGHT_MODULE="$PWD/.test-tools/node_modules/playwright" node tests/receipt-workflow.cjs
```

Có thể chọn `CHROMIUM_PATH` và `TEST_OUTPUT` như các script hiện có. Kiểm thử trình duyệt dùng bản build cục bộ, không chứng minh deployment Vercel đã cập nhật.

## File chính và giới hạn

- `types.ts`, `receiptWorkflow.ts`: trường bổ sung, phân biệt bản ghi mới/cũ, nhận việc và các chỉ số công việc mở.
- `access.ts`, `operations.ts`: quyền/điều kiện và lưu mọi sự kiện thật, phiên bản và quyết định.
- `ReceptionPanel.tsx`, `ReportStatusBadges.tsx`: tiếp nhận, tiến độ và trạng thái rõ nghĩa.
- `CaseWorkPanel.tsx`, `SourceRequests.tsx`, `CaseMessages.tsx`: nhận việc, báo cáo, phản hồi nguồn, ý kiến và phiên bản.
- `reportSnapshot.ts`: đối chiếu dữ liệu có ý nghĩa trước khi trình.
- `App.tsx`, `WorkSummary.tsx`, `RoleWork.tsx`, `receiptWorkflow.css`, `main.tsx`: tích hợp trang, bộ lọc, hàng đợi, tổng hợp nháp và giao diện.

Giới hạn giữ nguyên: phân quyền/xác thực chỉ ở trình duyệt; dữ liệu giả lập, localStorage theo origin, không đồng bộ người dùng hoặc hỗ trợ sửa đồng thời nhiều tab. Không có gửi thông báo thật. Chưa có chức năng giao lại riêng một yêu cầu nguồn/kiến nghị đang chờ khi người nhận bị khóa hoặc đổi vai trò; tài khoản không còn đủ quyền sẽ bị chặn, không được nhận/duyệt thay. Nháp ý kiến nằm trong bộ nhớ cho đến khi bấm lưu; cảnh báo rời trang không thay thế tự lưu. Chưa kiểm tra Safari/Firefox. Không merge hoặc triển khai Production.
