import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Code2,
  Globe2,
  Layers,
  MonitorSmartphone,
  Plus,
  RefreshCw,
  Rocket,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { websiteBuilderApi } from '../../services/api';

type BuilderSite = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  industryType: 'RESTAURANT' | 'HOTEL';
  status: string;
  currentThemeVersionId?: string;
  activeDeploymentId?: string;
};

type BuilderThemeVersion = {
  id: string;
  themeId: string;
  version: string;
  engineRange: string;
  manifest: any;
  tokens: any;
  pageTemplates: any[];
};

type BuilderTheme = {
  id: string;
  code: string;
  name: string;
  industry: 'RESTAURANT' | 'HOTEL';
  tags: string[];
  versions: BuilderThemeVersion[];
};

type BuilderPage = {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  pageType: string;
  status: string;
  currentDraft?: { id: string; document: any; validation?: any };
  published?: { id: string; document: any };
};

type BuilderComponent = {
  key: string;
  version: string;
  category: string;
  displayName: string;
  variants: string[];
  bindingSchema?: any;
};

type BuilderDeployment = {
  id: string;
  siteId: string;
  snapshotId: string;
  status: string;
  publicUrl?: string;
  activatedAt?: string;
  createdAt: string;
  logs?: any[];
};

const newInstance = (component: BuilderComponent, variant?: string) => ({
  id: crypto.randomUUID(),
  componentKey: component.key,
  componentVersion: component.version,
  variant: variant || component.variants?.[0] || 'default',
  props: defaultProps(component.key),
  styles: {},
  responsiveOverrides: {},
  bindings: defaultBinding(component.key),
  children: [],
  slots: {},
  visibility: { base: true },
  locks: { content: false, style: false, move: false, remove: false },
});

const defaultProps = (key: string) => {
  if (key === 'common.hero') return { eyebrow: 'Cơm Thị Nở', title: 'Tiêu đề section mới', description: 'Mô tả ngắn cho section.' };
  if (key === 'restaurant.menu-grid') return { title: 'Thực đơn', limit: 12 };
  if (key === 'restaurant.featured-dishes') return { title: 'Món nổi bật', limit: 8 };
  if (key === 'common.gallery') return { title: 'Thư viện ảnh', limit: 12 };
  if (key === 'common.contact-section') return { title: 'Liên hệ', showMap: true };
  return {};
};

const defaultBinding = (key: string) => {
  if (key === 'restaurant.menu-grid') return [{ source: 'menuItems', filter: { isAvailable: true }, limit: 12 }];
  if (key === 'restaurant.featured-dishes') return [{ source: 'menuItems', filter: { isFeatured: true, isAvailable: true }, limit: 8 }];
  if (key === 'common.gallery') return [{ source: 'galleryImages', filter: { isActive: true }, limit: 12 }];
  if (key === 'common.contact-section') return [{ source: 'siteSettings' }];
  return [];
};

const formatDate = (value?: string) => value
  ? new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
  : '-';

export default function WebsiteBuilder() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [siteId, setSiteId] = useState('');
  const [pageId, setPageId] = useState('');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [jsonDraft, setJsonDraft] = useState('');
  const [domainForm, setDomainForm] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const boot = await websiteBuilderApi.getBootstrap();
      setData(boot);
      const firstSite = boot.sites?.[0];
      const nextSiteId = siteId || firstSite?.id || '';
      const firstPage = boot.pages?.find((page: BuilderPage) => page.siteId === nextSiteId) || boot.pages?.[0];
      setSiteId(nextSiteId);
      setPageId(pageId || firstPage?.id || '');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không tải được Website Builder.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sites: BuilderSite[] = data?.sites || [];
  const themes: BuilderTheme[] = data?.themes || [];
  const components: BuilderComponent[] = data?.components || [];
  const pages: BuilderPage[] = data?.pages || [];
  const deployments: BuilderDeployment[] = data?.deployments || [];
  const domains = data?.domains || [];

  const selectedSite = sites.find((site) => site.id === siteId) || sites[0];
  const sitePages = pages.filter((page) => page.siteId === selectedSite?.id);
  const selectedPage = sitePages.find((page) => page.id === pageId) || sitePages[0];
  const currentDocument = useMemo(() => selectedPage?.currentDraft?.document || null, [selectedPage?.id, selectedPage?.currentDraft?.id]);
  const compatibleThemes = themes.filter((theme) => !selectedSite || theme.industry === selectedSite.industryType);
  const currentTheme = themes.find((theme) => theme.versions?.some((version) => version.id === selectedSite?.currentThemeVersionId));
  const currentDeployment = deployments.find((deployment) => deployment.id === selectedSite?.activeDeploymentId);
  const validation = selectedPage?.currentDraft?.validation;

  useEffect(() => {
    if (currentDocument) setJsonDraft(JSON.stringify(currentDocument, null, 2));
    else setJsonDraft('');
  }, [currentDocument]);

  const saveDraft = async () => {
    if (!selectedPage) return;
    setSaving(true);
    setMessage('');
    try {
      const document = JSON.parse(jsonDraft);
      await websiteBuilderApi.savePageDraft(selectedPage.id, document);
      setMessage('Đã lưu draft page và chạy validation schema.');
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không lưu được draft. Kiểm tra JSON component tree.');
    } finally {
      setSaving(false);
    }
  };

  const addComponent = (component: BuilderComponent) => {
    if (!currentDocument) return;
    const next = structuredClone(currentDocument);
    next.root = next.root || { type: 'page-root', children: [] };
    next.root.children = [...(next.root.children || []), newInstance(component)];
    setJsonDraft(JSON.stringify(next, null, 2));
  };

  const applyTheme = async (themeVersionId: string) => {
    if (!selectedSite) return;
    setSaving(true);
    try {
      const result = await websiteBuilderApi.applyTheme(selectedSite.id, themeVersionId);
      setMessage(`Đã áp theme. Safety snapshot: ${result.migrationReport?.safetySnapshotId || '-'}`);
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không áp được theme.');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!selectedSite) return;
    setSaving(true);
    try {
      const result = await websiteBuilderApi.publishSite(selectedSite.id);
      setMessage(`Publish thành công. Deployment: ${result.deployment?.id || '-'}`);
      await load();
    } catch (error: any) {
      const payload = error?.response?.data?.data;
      setMessage(error?.response?.data?.message || payload?.errors?.join(', ') || error.message || 'Không publish được site.');
    } finally {
      setSaving(false);
    }
  };

  const addDomain = async () => {
    if (!selectedSite || !domainForm.trim()) return;
    setSaving(true);
    try {
      await websiteBuilderApi.addDomain(selectedSite.id, { hostname: domainForm.trim(), isPrimary: domains.filter((item: any) => item.siteId === selectedSite.id).length === 0 });
      setDomainForm('');
      setMessage('Đã thêm domain vào state machine PENDING_DNS.');
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không thêm được domain.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-b-2 border-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-700">Hospitality Website Builder</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-stone-950">Builder Core cho Restaurant & Hotel</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-600">
              Lõi schema-driven theo SRS: tenant/site, component registry, theme manifest, design tokens, page tree, binding, immutable snapshot, deployment và rollback.
            </p>
          </div>
          <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold hover:bg-stone-50">
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
          {message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-stone-400">Sites</p>
          <p className="mt-2 text-3xl font-black text-stone-950">{sites.length}</p>
          <p className="mt-1 text-sm font-semibold text-stone-500">Tenant-aware website instances</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-stone-400">Components</p>
          <p className="mt-2 text-3xl font-black text-stone-950">{components.length}</p>
          <p className="mt-1 text-sm font-semibold text-stone-500">Versioned registry definitions</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-stone-400">Theme packages</p>
          <p className="mt-2 text-3xl font-black text-stone-950">{themes.length}</p>
          <p className="mt-1 text-sm font-semibold text-stone-500">Manifest, tokens, page templates</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-emerald-700">Active release</p>
          <p className="mt-2 truncate text-lg font-black text-emerald-900">{currentDeployment?.status || 'Chưa publish'}</p>
          <p className="mt-1 truncate text-sm font-semibold text-emerald-700">{currentDeployment?.publicUrl || 'Draft chưa public'}</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-stone-400">Site context</p>
            <select
              value={selectedSite?.id || ''}
              onChange={(e) => {
                const nextSiteId = e.target.value;
                setSiteId(nextSiteId);
                const nextPage = pages.find((page) => page.siteId === nextSiteId);
                setPageId(nextPage?.id || '');
              }}
              className="mt-3 h-12 w-full rounded-2xl border border-stone-200 px-3 text-sm font-bold outline-none focus:border-amber-500"
            >
              {sites.map((site) => <option key={site.id} value={site.id}>{site.name} · {site.industryType}</option>)}
            </select>
            <div className="mt-4 rounded-2xl bg-stone-50 p-3 text-sm">
              <div className="flex justify-between gap-3"><span>Slug</span><b>{selectedSite?.slug}</b></div>
              <div className="mt-2 flex justify-between gap-3"><span>Status</span><b>{selectedSite?.status}</b></div>
              <div className="mt-2 flex justify-between gap-3"><span>Theme</span><b>{currentTheme?.name || '-'}</b></div>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-stone-400">Pages</p>
            <div className="mt-3 space-y-2">
              {sitePages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setPageId(page.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm font-bold transition ${page.id === selectedPage?.id ? 'border-amber-500 bg-amber-50 text-amber-950' : 'border-stone-200 hover:bg-stone-50'}`}
                >
                  <span>{page.name}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-stone-400">Viewport</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ['desktop', MonitorSmartphone],
                ['tablet', Tablet],
                ['mobile', Smartphone],
              ].map(([key, Icon]: any) => (
                <button
                  key={key}
                  onClick={() => setViewport(key)}
                  className={`flex items-center justify-center rounded-xl border py-3 ${viewport === key ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200 text-stone-600'}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <section className="rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-stone-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-stone-400">Builder canvas contract</p>
                <h2 className="font-serif text-2xl font-bold text-stone-950">{selectedPage?.name || 'Chưa có page'}</h2>
                <p className="text-sm text-stone-500">Editor và public renderer dùng cùng PageDefinition JSON.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={saveDraft} disabled={saving || !selectedPage} className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-4 py-3 text-sm font-bold text-white disabled:bg-stone-300">
                  <Save className="h-4 w-4" />
                  Lưu draft
                </button>
                <button onClick={publish} disabled={saving || !selectedSite} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:bg-stone-300">
                  <Rocket className="h-4 w-4" />
                  Publish snapshot
                </button>
              </div>
            </div>

            <div className="grid gap-0 xl:grid-cols-[1fr_360px]">
              <div className="p-4">
                <div className={`mx-auto rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-3 transition-all ${
                  viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[760px]' : 'max-w-full'
                }`}>
                  <div className="space-y-3">
                    {(currentDocument?.root?.children || []).map((node: any, index: number) => (
                      <div key={node.id || index} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase text-amber-700">{node.componentKey}</p>
                            <h3 className="mt-1 text-lg font-black text-stone-950">{node.props?.title || node.props?.logoText || node.props?.eyebrow || node.variant}</h3>
                            {node.props?.description && <p className="mt-1 text-sm text-stone-500">{node.props.description}</p>}
                          </div>
                          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-500">#{index + 1}</span>
                        </div>
                        {!!node.bindings?.length && (
                          <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                            Binding: {node.bindings.map((item: any) => item.source).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                    {!currentDocument?.root?.children?.length && (
                      <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm font-bold text-stone-400">
                        Page chưa có component.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <aside className="border-t border-stone-100 p-4 xl:border-l xl:border-t-0">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-stone-400">Add section</p>
                    <div className="mt-3 grid gap-2">
                      {components.filter((component) => ['common', 'restaurant', 'hotel'].includes(component.category)).map((component) => (
                        <button
                          key={`${component.key}-${component.version}`}
                          onClick={() => addComponent(component)}
                          className="flex items-center justify-between rounded-xl border border-stone-200 px-3 py-2.5 text-left text-sm font-bold hover:border-amber-200 hover:bg-amber-50"
                        >
                          <span>{component.displayName}</span>
                          <Plus className="h-4 w-4 text-stone-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 p-3">
                    <div className="flex items-center gap-2">
                      {validation?.valid ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                      <p className="font-black text-stone-950">Validation report</p>
                    </div>
                    <div className="mt-3 space-y-2 text-xs font-bold">
                      <p>Errors: {validation?.errors?.length || 0}</p>
                      <p>Warnings: {validation?.warnings?.length || 0}</p>
                      {!!validation?.errors?.length && <pre className="max-h-28 overflow-auto rounded-xl bg-rose-50 p-2 text-rose-700">{validation.errors.join('\n')}</pre>}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-amber-700" />
                <h2 className="font-serif text-2xl font-bold text-stone-950">Theme library</h2>
              </div>
              <div className="mt-4 space-y-3">
                {compatibleThemes.map((theme) => (
                  <div key={theme.id} className="rounded-2xl border border-stone-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-stone-400">{theme.industry}</p>
                        <p className="text-lg font-black text-stone-950">{theme.name}</p>
                        <p className="mt-1 text-xs font-semibold text-stone-500">{theme.tags?.join(', ')}</p>
                      </div>
                      {theme.versions?.[0] && (
                        <button onClick={() => applyTheme(theme.versions[0].id)} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900 hover:bg-amber-100">
                          Áp dụng
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Globe2 className="h-5 w-5 text-emerald-700" />
                <h2 className="font-serif text-2xl font-bold text-stone-950">Domain & Deploy</h2>
              </div>
              <div className="mt-4 flex gap-2">
                <input value={domainForm} onChange={(e) => setDomainForm(e.target.value)} placeholder="www.tenmien.vn" className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-3 outline-none focus:border-amber-500" />
                <button onClick={addDomain} className="rounded-xl bg-stone-950 px-4 py-3 text-sm font-bold text-white">Thêm</button>
              </div>
              <div className="mt-4 space-y-2">
                {domains.filter((domain: any) => domain.siteId === selectedSite?.id).map((domain: any) => (
                  <div key={domain.id} className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 p-3">
                    <div>
                      <p className="font-black">{domain.hostname}</p>
                      <p className="text-xs font-bold text-stone-500">{domain.status} · SSL {domain.sslStatus}</p>
                    </div>
                    <button onClick={async () => { await websiteBuilderApi.verifyDomain(domain.id); await load(); }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                      Verify
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                {deployments.filter((deployment) => deployment.siteId === selectedSite?.id).map((deployment) => (
                  <div key={deployment.id} className="rounded-2xl border border-stone-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{deployment.status}</p>
                        <p className="text-xs font-semibold text-stone-500">{formatDate(deployment.createdAt)} · {deployment.publicUrl}</p>
                      </div>
                      <button onClick={async () => { await websiteBuilderApi.rollbackDeployment(deployment.id); await load(); }} className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-black">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100 p-4">
              <div className="flex items-center gap-3">
                <Code2 className="h-5 w-5 text-stone-700" />
                <h2 className="font-serif text-2xl font-bold text-stone-950">PageDefinition JSON</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                Schema first
              </div>
            </div>
            <textarea
              value={jsonDraft}
              onChange={(e) => setJsonDraft(e.target.value)}
              spellCheck={false}
              className="h-[520px] w-full resize-y rounded-b-3xl bg-stone-950 p-4 font-mono text-xs leading-5 text-stone-100 outline-none"
            />
          </section>
        </div>
      </section>
    </div>
  );
}
