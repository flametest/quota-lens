import { useState } from "react";
import { AppConfig, ProviderConfig } from "../../hooks/useConfig";
import { useI18n } from "../../hooks/useI18n";

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
  const { t } = useI18n();
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
        {t("provider.title")}
      </h3>
      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
        {t("provider.desc")}
      </p>

      {config.providers.map((provider) => (
        <div key={provider.id} className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
              {t(`provider.name.${provider.type}` as any) || provider.name}
            </span>
            {provider.auth_token ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--success)", color: "white", opacity: 0.8 }}>
                {t("provider.configured")}
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--warning)", color: "white", opacity: 0.8 }}>
                {t("provider.notConfigured")}
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
                  placeholder={t("provider.tokenPlaceholder")}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveProvider} className="btn-primary text-xs flex-1" disabled={!editToken}>
                  {t("provider.save")}
                </button>
                <button onClick={() => setEditingId(null)} className="btn-secondary text-xs">
                  {t("provider.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[10px] mb-2" style={{ color: "var(--text-tertiary)" }}>
                {provider.base_url}
              </p>
              <button onClick={() => startEdit(provider)} className="btn-secondary text-xs w-full cursor-pointer">
                {provider.auth_token ? t("provider.editConfig") : t("provider.setupToken")}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Future providers */}
      <div className="border-t pt-3 mt-1" style={{ borderColor: "var(--border-color)" }}>
        <h4 className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          {t("provider.moreTitle")}
        </h4>
        {PROVIDER_TEMPLATES.filter(
          (pt) => !config.providers.some((p) => p.id === pt.id)
        ).map((template) => (
          <div key={template.id} className="flex items-center justify-between py-1.5 opacity-50">
            <span className="text-xs" style={{ color: "var(--text-primary)" }}>{template.name}</span>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{t("provider.comingSoon")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
