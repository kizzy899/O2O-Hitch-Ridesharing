import type { RoleView } from "../types";

interface RoleDrawerProps {
  roleView: RoleView;
  onChange: (role: RoleView) => void;
}

const ROLE_OPTIONS: Array<{ key: RoleView; label: string }> = [
  { key: "passenger", label: "乘客视图" },
  { key: "driver", label: "司机视图" },
  { key: "admin", label: "管理员视图" },
  { key: "mixed", label: "全流程视图" }
];

export function RoleDrawer({ roleView, onChange }: RoleDrawerProps) {
  return (
    <div className="role-drawer">
      <span>角色抽屉</span>
      <div className="role-buttons">
        {ROLE_OPTIONS.map((item) => (
          <button
            type="button"
            key={item.key}
            className={item.key === roleView ? "active" : ""}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
