import { useState } from "react"
import type { StaffAccount } from "./types"
import type { Operation } from "./operations"
import { R } from "./access"
import { PageHeader, Card, DataTable, Field, Button, Modal, Badge } from "./ui"
export default function AccountManager({
  accounts,
  onAction,
}: {
  accounts: StaffAccount[]
  onAction: (op: Operation) => boolean
}) {
  const [query, setQuery] = useState(""),
    [editing, setEditing] = useState<StaffAccount | null>(null)
  return (
    <div className="page-stack">
      <PageHeader
        title="Tài khoản và phân quyền"
        description="Quản lý vai trò, đơn vị và trạng thái tài khoản nội bộ."
      />
      <Card className="role-panel">
        <Field label="Tìm tài khoản">
          <input
            placeholder="Tìm tài khoản, tên hoặc đơn vị..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <div className="table-scroll">
          <DataTable>
            <thead>
              <tr>
                {[
                  "Tài khoản",
                  "Họ tên",
                  "Vai trò",
                  "Đơn vị",
                  "Trạng thái",
                  "Thao tác",
                ].map((s) => (
                  <th key={s} scope="col">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts
                .filter((a) =>
                  `${a.id} ${a.name} ${a.role} ${a.unitId}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.name}</td>
                    <td>{a.role}</td>
                    <td>{a.unitId}</td>
                    <td>
                      <Badge tone={a.active ? "green" : "gray"}>
                        {a.active ? "Hoạt động" : "Đã khóa"}
                      </Badge>
                    </td>
                    <td>
                      {a.kind === "staff" ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          aria-label={`Sửa quyền ${a.id}`}
                          onClick={() => setEditing({ ...a })}
                        >
                          Sửa quyền
                        </button>
                      ) : (
                        <span className="role-hint">Tài khoản người dân</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </DataTable>
        </div>
      </Card>
      {editing && (
        <Modal
          title={`Cập nhật tài khoản ${editing.id}`}
          onClose={() => setEditing(null)}
          footer={
            <Button
              onClick={() => {
                if (
                  onAction({
                    type: "account-update",
                    id: editing.id,
                    role: editing.role,
                    unitId: editing.unitId,
                    active: editing.active,
                  })
                )
                  setEditing(null)
              }}
            >
              Lưu quyền tài khoản
            </Button>
          }
        >
          <Field label="Vai trò tài khoản">
            <select
              value={editing.role}
              onChange={(e) => setEditing({ ...editing, role: e.target.value })}
            >
              {Object.values(R)
                .filter((r) => r !== R.citizen)
                .map((r) => (
                  <option key={r}>{r}</option>
                ))}
            </select>
          </Field>
          <Field label="Đơn vị phụ trách">
            <input
              value={editing.unitId}
              onChange={(e) =>
                setEditing({ ...editing, unitId: e.target.value })
              }
            />
          </Field>
          <Field label="Trạng thái tài khoản">
            <select
              value={String(editing.active)}
              onChange={(e) =>
                setEditing({ ...editing, active: e.target.value === "true" })
              }
            >
              <option value="true">Hoạt động</option>
              <option value="false">Đã khóa</option>
            </select>
          </Field>
        </Modal>
      )}
    </div>
  )
}
