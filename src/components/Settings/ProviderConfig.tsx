import { useState } from "react";
import { AppConfig, ProviderConfig } from "../../hooks/useConfig";

const PROVIDER_TEMPLATES: Omit<ProviderConfig, "auth_token">[] = [
  { id: "glm-intl", name: "GLM (International)", type: "glm", base_url: "https://api.z.ai", enabled: true },
  { id: "claude", name: "Claude", type: "claude", base_url: "https://api.anthropic.com", enabled: false },
  { id: "openai", name: "OpenAI (GPT)", type: "openai", base_url: "https://api.openai.com", enabled: false },
  { id: "grok", name: "Grok (xAI)", type: "grok", base_url: "https://api.x.ai", enabled: false },
];

interface Props {
  config: AppConfig;
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
}

export default function ProviderConfigPanel({ config, updateProvider }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editToken, setEditToken] = useState("");
  const [editBaseUrl, setEditBaseUrl] = useState("");

  const startEdit = (provider: ProviderConfig) => {
    setEditingId(provider.id);
    setEditToken(provider.auth_token);
    setEditBaseUrl(provider.base_url);
  };

  const saveProvider = () => {
    if (!editingId) return;
    updateProvider(editingId, {
      auth_token: editToken,
      base_url: editBaseUrl,
    });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
        Provider 配置
      </h3>
      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
        配置大模型 API 连接信息。当前激活的 Provider 用于拉取用量数据。
      </p>

      {config.providers.map((provider) => (
        <div key={provider.id} className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
              {provider.name}
            </span>
            {provider.auth_token ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--success)", color: "white", opacity: 0.8 }}>
                已配置
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--warning)", color: "white", opacity: 0.8 }}>
                未配置
              </span>
            )}
          </div>

          {editingId === provider.id ? (
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-[10px] block mb-1" style={{ color: "var(--text-secondary)" }}>Base URL</label>
                <input
                  type="text"
                  value={editBaseUrl}
                  onChange={(e) => setEditBaseUrl(e.target.value)}
                  className="input text-xs"
                  placeholder="https://open.bigmodel.cn"
                />
              </div>
              <div>
                <label className="text-[10px] block mb-1" style={{ color: "var(--text-secondary)" }}>API Token</label>
                <input
                  type="password"
                  value={editToken}
                  onChange={(e) => setEditToken(e.target.value)}
                  className="input text-xs"
                  placeholder="输入 API Token"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveProvider} className="btn-primary text-xs flex-1" disabled={!editToken}>
                  保存
                </button>
                <button onClick={() => setEditingId(null)} className="btn-secondary text-xs">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[10px] mb-2" style={{ color: "var(--text-tertiary)" }}>
                {provider.base_url}
              </p>
              <button onClick={() => startEdit(provider)} className="btn-secondary text-xs w-full cursor-pointer">
                {provider.auth_token ? "修改配置" : "配置 Token"}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Future providers */}
      <div className="border-t pt-3 mt-1" style={{ borderColor: "var(--border-color)" }}>
        <h4 className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          更多 Provider（后续支持）
        </h4>
        {PROVIDER_TEMPLATES.filter(
          (t) => !config.providers.some((p) => p.id === t.id)
        ).map((template) => (
          <div key={template.id} className="flex items-center justify-between py-1.5 opacity-50">
            <span className="text-xs" style={{ color: "var(--text-primary)" }}>{template.name}</span>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>即将支持</span>
          </div>
        ))}
      </div>
    </div>
  );
}
