# Đưa bản sửa lên Vercel để review

Repository: `chungcb4444-alt/scamgraph-demo`. Bản sửa nằm trên **`feat/improve-demo`**; nhánh `main` vẫn là bản gốc. Chưa cần merge PR để xem bản sửa.

## Kết nối một lần

1. Mở https://vercel.com/new, đăng nhập bằng GitHub.
2. Chọn **Import Git Repository** → tìm `scamgraph-demo`. Nếu chưa thấy repository, chọn cấu hình/cài Vercel GitHub App và cấp quyền cho đúng repository này; không cần cấp toàn bộ repository.
3. Trước khi deploy, kiểm tra **branch là `feat/improve-demo`**, không phải `main`.
   - Có thể mở liên kết import đã chọn nhánh: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fchungcb4444-alt%2Fscamgraph-demo%2Ftree%2Ffeat%2Fimprove-demo
   - Nếu import thông thường không cho chọn nhánh, sau khi tạo project vào **Deployments → Create Deployment** và nhập `feat/improve-demo`. Tên nút có thể khác theo phiên bản giao diện Vercel; mục tiêu là deploy đúng Git branch/commit.
4. Đặt **Framework Preset: Vite**, **Root Directory: `./`**, **Node.js: 24.x**.
5. Cấu hình đã lưu trong `vercel.json`: install `npx --yes pnpm@11.25.0 install --frozen-lockfile`, build `npm run build`, output `dist`. Không cần biến môi trường hoặc secret nào.
6. Bấm **Deploy**. Khi trạng thái **Ready**, mở deployment và chọn **Visit**. Kiểm tra Git branch/commit trên deployment khớp `feat/improve-demo`, rồi copy URL HTTPS để chia sẻ.

Lần import đầu có thể tạo một deployment theo nhánh mặc định `main`. Địa chỉ production của project lúc đó có thể là bản gốc. **Hãy dùng URL của deployment `feat/improve-demo` để review bản sửa**, không suy ra bản sửa chỉ từ tên project.

## Tự cập nhật preview

Giữ kết nối GitHub trong **Project Settings → Git**. Khi nhánh production vẫn là `main`, các lần push vào `feat/improve-demo` sẽ tạo **Preview Deployment** theo cấu hình/quyền tài khoản Vercel. Dùng link của branch/deployment để xem; chưa cần merge. Chỉ đổi production branch nếu bạn chủ động muốn dùng nhánh sửa làm bản chính.

Nếu Vercel hỏi quyền truy cập repository, xác nhận bằng tài khoản GitHub sở hữu repo. Nếu deployment bị chặn do quyền team/tác giả commit, xem lý do trong Vercel và cho phép theo chính sách tài khoản của bạn; không cần gửi token cho Codex.

## Kiểm tra sau khi có link

- Mở **Người dân / Tổ chức → Đăng nhập demo**, dùng tình huống mẫu và gửi PA-013.
- Chuyển sang **Cán bộ phân tích**, mở PA-013, trích xuất → sửa/lưu → xác nhận liên kết.
- CUM-001 phải chuyển từ **3 phản ánh/45 triệu** sang **4 phản ánh/60 triệu** sau xác nhận; tạo hồ sơ và xem báo cáo.
- URL mới có localStorage riêng, bắt đầu từ dữ liệu ban đầu. Chỉ dùng thông tin giả lập.
- Nếu chia sẻ cho sếp và gặp màn hình đăng nhập Vercel, kiểm tra **Deployment Protection**: cấp quyền người xem hoặc chọn cấu hình chia sẻ phù hợp tài khoản. Không tắt bảo vệ nếu bạn chưa muốn link được truy cập công khai.

## Nếu deploy lỗi

Xem **Build Logs**: kiểm tra đúng nhánh, Node 24.x, thư mục gốc và cấu hình `vercel.json`. File `.figma/make/site.json` đã được commit; không cần Figma hoặc backend để chạy. Không điền `FIGMA_PUBLIC_URL` nếu bạn không chủ động host ứng dụng dưới một đường dẫn riêng.

Cấu hình được chuẩn bị và build kiểm tra trong Codex; việc kết nối tài khoản, tạo deployment và cấp URL thực tế cần hoàn tất trên Vercel. Chỉ khi Vercel báo Ready và URL đã được kiểm tra mới coi preview đã triển khai thành công.
