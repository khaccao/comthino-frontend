import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Blocks,
  CheckCircle2,
  ChevronRight,
  Code2,
  ExternalLink,
  FileJson,
  FileText,
  Globe2,
  LayoutDashboard,
  Laptop,
  MonitorSmartphone,
  Palette,
  PanelTop,
  Plus,
  RefreshCw,
  Rocket,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
} from 'lucide-react';
import type { ReactNode } from 'react';
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

type BuilderSection = 'overview' | 'pages' | 'themes' | 'components' | 'domains' | 'publish' | 'settings';

const builderSections: Array<{ key: BuilderSection; label: string; desc: string; icon: any }> = [
  { key: 'overview', label: 'Tổng quan', desc: 'Tình trạng site', icon: LayoutDashboard },
  { key: 'pages', label: 'Trang', desc: 'Canvas và page tree', icon: FileText },
  { key: 'themes', label: 'Giao diện', desc: 'Theme package', icon: Palette },
  { key: 'components', label: 'Component', desc: 'Registry versioned', icon: Blocks },
  { key: 'domains', label: 'Domain', desc: 'Tên miền và SSL', icon: Globe2 },
  { key: 'publish', label: 'Xuất bản', desc: 'Snapshot và rollback', icon: Rocket },
  { key: 'settings', label: 'Cài đặt', desc: 'Thông tin site', icon: Settings },
];

const sectionFromPath = (pathname: string): BuilderSection => {
  const last = pathname.split('/').filter(Boolean).pop();
  return builderSections.some((item) => item.key === last) ? (last as BuilderSection) : 'overview';
};

const builderPath = (section: BuilderSection) => `/admin/website-builder/${section}`;

const defaultProps = (key: string) => {
  if (key === 'common.header') return { logoText: 'Cơm Thị Nở', sticky: true };
  if (key === 'common.hero') return { eyebrow: 'Cơm Thị Nở', title: 'Bữa cơm Bắc Bộ giữa lòng Hà Đông', description: 'Không gian ấm cúng, món ăn chuẩn vị nhà làm và trải nghiệm đặt bàn gọn gàng.' };
  if (key === 'restaurant.menu-grid') return { title: 'Thực đơn hôm nay', limit: 12 };
  if (key === 'restaurant.featured-dishes') return { title: 'Món nổi bật', limit: 8 };
  if (key === 'hotel.room-grid') return { title: 'Hạng phòng', limit: 8 };
  if (key === 'common.gallery') return { title: 'Không gian quán', limit: 12 };
  if (key === 'common.contact-section') return { title: 'Đặt bàn và liên hệ', showMap: true };
  return {};
};

const defaultBinding = (key: string) => {
  if (key === 'restaurant.menu-grid') return [{ source: 'menuItems', filter: { isAvailable: true }, limit: 12 }];
  if (key === 'restaurant.featured-dishes') return [{ source: 'menuItems', filter: { isFeatured: true, isAvailable: true }, limit: 8 }];
  if (key === 'hotel.room-grid') return [{ source: 'rooms', filter: { isActive: true }, limit: 8 }];
  if (key === 'common.gallery') return [{ source: 'galleryImages', filter: { isActive: true }, limit: 12 }];
  if (key === 'common.contact-section') return [{ source: 'siteSettings' }];
  return [];
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

const formatDate = (value?: string) => value
  ? new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
  : '-';

const statusClass = (status?: string) => {
  if (status === 'SUCCESS' || status === 'ACTIVE' || status === 'VERIFIED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'FAILED' || status === 'ERROR') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-amber-200 bg-amber-50 text-amber-900';
};

const safeStringify = (value: any) => {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return '{}';
  }
};

export default function WebsiteBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeSection = sectionFromPath(location.pathname);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [siteId, setSiteId] = useState('');
  const [pageId, setPageId] = useState('');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [jsonDraft, setJsonDraft] = useState('');
  const [domainForm, setDomainForm] = useState('');
  const [componentSearch, setComponentSearch] = useState('');
  const [siteForm, setSiteForm] = useState({ name: '', slug: '', status: 'DRAFT' });

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
    if (location.pathname === '/admin/website-builder') {
      navigate(builderPath('overview'), { replace: true });
    }
  }, [location.pathname, navigate]);

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
  const pageSections = currentDocument?.root?.children || [];
  const selectedSiteDomains = domains.filter((domain: any) => domain.siteId === selectedSite?.id);
  const selectedSiteDeployments = deployments.filter((deployment) => deployment.siteId === selectedSite?.id);

  const filteredComponents = components.filter((component) => {
    const keyword = componentSearch.trim().toLowerCase();
    if (!keyword) return true;
    return [component.key, component.displayName, component.category].some((value) => String(value || '').toLowerCase().includes(keyword));
  });

  useEffect(() => {
    if (currentDocument) setJsonDraft(safeStringify(currentDocument));
    else setJsonDraft('');
  }, [currentDocument]);

  useEffect(() => {
    if (selectedSite) {
      setSiteForm({ name: selectedSite.name || '', slug: selectedSite.slug || '', status: selectedSite.status || 'DRAFT' });
    }
  }, [selectedSite?.id]);

  const saveDraft = async () => {
    if (!selectedPage) return;
    setSaving(true);
    setMessage('');
    try {
      const document = JSON.parse(jsonDraft);
      await websiteBuilderApi.savePageDraft(selectedPage.id, document);
      setMessage('Đã lưu bản nháp và chạy validation PageDefinition.');
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không lưu được draft. Kiểm tra JSON component tree.');
    } finally {
      setSaving(false);
    }
  };

  const addComponent = (component: BuilderComponent) => {
    try {
      const baseDocument = jsonDraft ? JSON.parse(jsonDraft) : currentDocument;
      if (!baseDocument) return;
      const next = structuredClone(baseDocument);
      next.root = next.root || { type: 'page-root', children: [] };
      next.root.children = [...(next.root.children || []), newInstance(component)];
      setJsonDraft(safeStringify(next));
      navigate(builderPath('pages'));
    } catch (error: any) {
      setMessage(error.message || 'JSON hiện tại chưa hợp lệ, chưa thêm được component.');
    }
  };

  const applyTheme = async (themeVersionId: string) => {
    if (!selectedSite) return;
    setSaving(true);
    try {
      const result = await websiteBuilderApi.applyTheme(selectedSite.id, themeVersionId);
      setMessage(`Đã áp dụng theme. Safety snapshot: ${result.migrationReport?.safetySnapshotId || '-'}`);
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không áp dụng được theme.');
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
      navigate(builderPath('publish'));
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
      await websiteBuilderApi.addDomain(selectedSite.id, {
        hostname: domainForm.trim(),
        isPrimary: selectedSiteDomains.length === 0,
      });
      setDomainForm('');
      setMessage('Đã thêm domain vào trạng thái PENDING_DNS.');
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không thêm được domain.');
    } finally {
      setSaving(false);
    }
  };

  const saveSiteSettings = async () => {
    if (!selectedSite) return;
    setSaving(true);
    try {
      await websiteBuilderApi.updateSite(selectedSite.id, siteForm);
      setMessage('Đã lưu thông tin site.');
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không lưu được thông tin site.');
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

  const renderCanvasPreview = () => (
    <div className={`mx-auto rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-3 transition-all ${
      viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[780px]' : 'max-w-full'
    }`}>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-950 px-4 py-3 text-white">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">Live canvas</p>
            <p className="text-sm font-bold">{selectedPage?.name || 'Chưa chọn page'}</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
            <MonitorSmartphone className="h-3.5 w-3.5" />
            {viewport}
          </div>
        </div>
        <div className="space-y-3 bg-[#f8f5ef] p-4">
          {pageSections.map((node: any, index: number) => (
            <div key={node.id || index} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-amber-700">{node.componentKey}</p>
                  <h3 className="mt-1 font-serif text-xl font-bold text-stone-950">{node.props?.title || node.props?.logoText || node.props?.eyebrow || node.variant}</h3>
                  {node.props?.description && <p className="mt-1 text-sm leading-6 text-stone-500">{node.props.description}</p>}
                </div>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-500">#{index + 1}</span>
              </div>
              {!!node.bindings?.length && (
                <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                  Binding: {node.bindings.map((item: any) => item.source).join(', ')}
                </div>
              )}
            </div>
          ))}
          {!pageSections.length && (
            <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-sm font-bold text-stone-400">
              Page chưa có component.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Sites" value={sites.length} helper="Website instances" />
        <MetricCard label="Pages" value={sitePages.length} helper="Versioned page tree" />
        <MetricCard label="Components" value={components.length} helper="Registry schema" />
        <MetricCard label="Deploy" value={currentDeployment?.status || 'Draft'} helper={currentDeployment?.publicUrl || 'Chưa public'} success={currentDeployment?.status === 'SUCCESS'} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Website command center</p>
              <h2 className="mt-1 font-serif text-3xl font-bold text-stone-950">{selectedSite?.name}</h2>
              <p className="mt-1 text-sm text-stone-500">Quản trị kiểu CMS: nội dung, giao diện, domain, publish và rollback tách riêng.</p>
            </div>
            <button onClick={() => navigate(builderPath('pages'))} className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-4 py-3 text-sm font-bold text-white">
              Mở editor
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5">
            {renderCanvasPreview()}
          </div>
        </div>

        <aside className="space-y-4">
          <InfoPanel title="Checklist xuất bản" icon={ShieldCheck}>
            <ChecklistRow done={!!currentTheme} label="Đã chọn theme package" />
            <ChecklistRow done={!!selectedPage?.currentDraft} label="Có bản nháp page" />
            <ChecklistRow done={validation?.valid !== false} label="Validation không lỗi nghiêm trọng" />
            <ChecklistRow done={!!selectedSiteDomains.length} label="Có domain hoặc public URL" />
          </InfoPanel>

          <InfoPanel title="Thông tin site" icon={PanelTop}>
            <InfoLine label="Slug" value={selectedSite?.slug || '-'} />
            <InfoLine label="Loại hình" value={selectedSite?.industryType || '-'} />
            <InfoLine label="Theme" value={currentTheme?.name || '-'} />
            <InfoLine label="Trạng thái" value={selectedSite?.status || '-'} />
          </InfoPanel>
        </aside>
      </section>
    </div>
  );

  const renderPages = () => (
    <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-stone-400">Danh sách trang</p>
          <div className="mt-3 space-y-2">
            {sitePages.map((page) => (
              <button
                key={page.id}
                onClick={() => setPageId(page.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm font-bold transition ${
                  page.id === selectedPage?.id ? 'border-amber-500 bg-amber-50 text-amber-950' : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>
                  {page.name}
                  <small className="mt-1 block font-semibold text-stone-500">/{page.slug}</small>
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-stone-400">Thêm section</p>
          <div className="mt-3 space-y-2">
            {components.slice(0, 8).map((component) => (
              <button
                key={`${component.key}-${component.version}`}
                onClick={() => addComponent(component)}
                className="flex w-full items-center justify-between rounded-xl border border-stone-200 px-3 py-2.5 text-left text-sm font-bold hover:border-amber-200 hover:bg-amber-50"
              >
                <span>{component.displayName}</span>
                <Plus className="h-4 w-4 text-stone-400" />
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="space-y-5">
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-stone-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-stone-400">Page Builder</p>
              <h2 className="font-serif text-2xl font-bold text-stone-950">{selectedPage?.name || 'Chưa có page'}</h2>
              <p className="text-sm text-stone-500">Editor và public renderer dùng cùng PageDefinition JSON.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ViewportButton value="desktop" viewport={viewport} onClick={setViewport} icon={Laptop} />
              <ViewportButton value="tablet" viewport={viewport} onClick={setViewport} icon={Tablet} />
              <ViewportButton value="mobile" viewport={viewport} onClick={setViewport} icon={Smartphone} />
              <button onClick={saveDraft} disabled={saving || !selectedPage} className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-4 py-3 text-sm font-bold text-white disabled:bg-stone-300">
                <Save className="h-4 w-4" />
                Lưu draft
              </button>
            </div>
          </div>
          <div className="p-4">{renderCanvasPreview()}</div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-stone-100 p-4">
              <Code2 className="h-5 w-5 text-stone-700" />
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-950">PageDefinition JSON</h2>
                <p className="text-sm text-stone-500">Component tree versioned, không lưu HTML blob.</p>
              </div>
            </div>
            <textarea
              value={jsonDraft}
              onChange={(event) => setJsonDraft(event.target.value)}
              spellCheck={false}
              className="h-[520px] w-full resize-y rounded-b-2xl bg-stone-950 p-4 font-mono text-xs leading-5 text-stone-100 outline-none"
            />
          </section>

          <aside className="space-y-4">
            <InfoPanel title="Validation report" icon={validation?.valid ? CheckCircle2 : AlertTriangle}>
              <InfoLine label="Errors" value={validation?.errors?.length || 0} />
              <InfoLine label="Warnings" value={validation?.warnings?.length || 0} />
              {!!validation?.errors?.length && <pre className="mt-3 max-h-36 overflow-auto rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{validation.errors.join('\n')}</pre>}
            </InfoPanel>
            <InfoPanel title="Binding data" icon={FileJson}>
              <p className="text-sm leading-6 text-stone-600">Page có thể bind tới menu, gallery, hotel room, site settings mà không phụ thuộc theme.</p>
              <div className="mt-3 space-y-2">
                {pageSections.flatMap((node: any) => node.bindings || []).map((binding: any, index: number) => (
                  <div key={`${binding.source}-${index}`} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                    {binding.source}
                  </div>
                ))}
              </div>
            </InfoPanel>
          </aside>
        </div>
      </section>
    </div>
  );

  const renderThemes = () => (
    <div className="grid gap-5 xl:grid-cols-2">
      {compatibleThemes.map((theme) => {
        const version = theme.versions?.[0];
        const isActive = version?.id === selectedSite?.currentThemeVersionId;
        return (
          <article key={theme.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${isActive ? 'border-amber-400 ring-2 ring-amber-100' : 'border-stone-200'}`}>
            <div className="h-44 bg-[linear-gradient(135deg,#1c1917_0%,#854d0e_48%,#faf7ef_48%,#faf7ef_100%)] p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">{theme.industry}</p>
              <h2 className="mt-2 font-serif text-3xl font-bold">{theme.name}</h2>
              <p className="mt-2 max-w-md text-sm font-semibold text-white/80">Theme manifest, design tokens, presets và page templates. Business data giữ độc lập.</p>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {theme.tags?.map((tag) => <span key={tag} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">{tag}</span>)}
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <InfoLine label="Version" value={version?.version || '-'} boxed />
                <InfoLine label="Engine" value={version?.engineRange || '-'} boxed />
                <InfoLine label="Templates" value={version?.pageTemplates?.length || 0} boxed />
              </div>
              <button onClick={() => version && applyTheme(version.id)} disabled={!version || saving || isActive} className="mt-5 w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-white hover:bg-amber-700 disabled:bg-stone-300">
                {isActive ? 'Đang sử dụng' : 'Áp dụng theme'}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );

  const renderComponents = () => (
    <div className="space-y-5">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input
            value={componentSearch}
            onChange={(event) => setComponentSearch(event.target.value)}
            placeholder="Tìm component, key, category..."
            className="h-14 w-full rounded-xl border border-stone-200 pl-12 pr-4 text-sm font-semibold outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filteredComponents.map((component) => (
          <article key={`${component.key}-${component.version}`} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-amber-700">{component.category}</p>
                <h2 className="mt-1 text-lg font-black text-stone-950">{component.displayName}</h2>
                <p className="mt-1 font-mono text-xs font-bold text-stone-500">{component.key}@{component.version}</p>
              </div>
              <button onClick={() => addComponent(component)} className="rounded-xl border border-stone-200 p-2 hover:bg-stone-50">
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {component.variants?.map((variant) => <span key={variant} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">{variant}</span>)}
            </div>
            <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-stone-950 p-3 text-xs leading-5 text-stone-100">{safeStringify(component.bindingSchema)}</pre>
          </article>
        ))}
      </div>
    </div>
  );

  const renderDomains = () => (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Domain manager</p>
          <h2 className="mt-1 font-serif text-3xl font-bold text-stone-950">Tên miền, DNS và SSL</h2>
        </div>
        <div className="p-5">
          <div className="flex gap-2">
            <input value={domainForm} onChange={(event) => setDomainForm(event.target.value)} placeholder="www.tenmien.vn" className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
            <button onClick={addDomain} disabled={saving} className="rounded-xl bg-stone-950 px-5 py-3 text-sm font-bold text-white disabled:bg-stone-300">Thêm domain</button>
          </div>
          <div className="mt-5 space-y-3">
            {selectedSiteDomains.map((domain: any) => (
              <div key={domain.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-black text-stone-950">{domain.hostname}</p>
                    <p className="mt-1 text-xs font-bold text-stone-500">SSL {domain.sslStatus} · Primary {domain.isPrimary ? 'YES' : 'NO'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(domain.status)}`}>{domain.status}</span>
                    <button onClick={async () => { await websiteBuilderApi.verifyDomain(domain.id); await load(); }} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!selectedSiteDomains.length && <EmptyState title="Chưa có domain" desc="Thêm domain để chuẩn bị publish production." />}
          </div>
        </div>
      </section>

      <InfoPanel title="DNS checklist" icon={Globe2}>
        <ChecklistRow done={!!selectedSiteDomains.length} label="Thêm hostname vào hệ thống" />
        <ChecklistRow done={selectedSiteDomains.some((item: any) => item.status === 'VERIFIED')} label="Domain đã verify" />
        <ChecklistRow done={selectedSiteDomains.some((item: any) => item.sslStatus === 'READY')} label="SSL đã sẵn sàng" />
        <p className="mt-4 text-sm leading-6 text-stone-600">Builder lưu domain theo state machine để sau này cắm DNS provider, SSL automation và publish bằng snapshot bất biến.</p>
      </InfoPanel>
    </div>
  );

  const renderPublish = () => (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">Immutable release</p>
        <h2 className="mt-2 font-serif text-3xl font-bold text-stone-950">Publish snapshot</h2>
        <p className="mt-2 text-sm leading-6 text-stone-700">Khi publish, hệ thống validate toàn bộ page tree, đóng gói theme/tokens/page thành snapshot bất biến rồi mới active deployment.</p>
        <button onClick={publish} disabled={saving || !selectedSite} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-4 text-sm font-black text-white hover:bg-amber-700 disabled:bg-stone-300">
          <Rocket className="h-5 w-5" />
          Publish bản hiện tại
        </button>
        {currentDeployment?.publicUrl && (
          <a href={currentDeployment.publicUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold text-stone-900">
            Mở public URL
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 p-5">
          <h2 className="font-serif text-3xl font-bold text-stone-950">Lịch sử deployment</h2>
          <p className="mt-1 text-sm text-stone-500">Rollback luôn trỏ về snapshot đã publish, không dùng dữ liệu đang draft.</p>
        </div>
        <div className="divide-y divide-stone-100">
          {selectedSiteDeployments.map((deployment) => (
            <div key={deployment.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(deployment.status)}`}>{deployment.status}</span>
                <p className="mt-2 font-mono text-xs font-bold text-stone-500">{deployment.id}</p>
                <p className="mt-1 text-sm font-semibold text-stone-600">{formatDate(deployment.createdAt)} · {deployment.publicUrl || '-'}</p>
              </div>
              <button onClick={async () => { await websiteBuilderApi.rollbackDeployment(deployment.id); await load(); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold hover:bg-stone-50">
                <RotateCcw className="h-4 w-4" />
                Rollback
              </button>
            </div>
          ))}
          {!selectedSiteDeployments.length && <EmptyState title="Chưa có deployment" desc="Publish lần đầu để tạo release history." />}
        </div>
      </section>
    </div>
  );

  const renderSettings = () => (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Site settings</p>
        <h2 className="mt-1 font-serif text-3xl font-bold text-stone-950">Thông tin website</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase text-stone-500">Tên site</span>
            <input value={siteForm.name} onChange={(event) => setSiteForm((prev) => ({ ...prev, name: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-stone-200 px-4 font-semibold outline-none focus:border-amber-500" />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase text-stone-500">Slug</span>
            <input value={siteForm.slug} onChange={(event) => setSiteForm((prev) => ({ ...prev, slug: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-stone-200 px-4 font-semibold outline-none focus:border-amber-500" />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase text-stone-500">Trạng thái</span>
            <select value={siteForm.status} onChange={(event) => setSiteForm((prev) => ({ ...prev, status: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-stone-200 px-4 font-semibold outline-none focus:border-amber-500">
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
        </div>
        <button onClick={saveSiteSettings} disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-3 text-sm font-bold text-white disabled:bg-stone-300">
          <Save className="h-4 w-4" />
          Lưu cài đặt
        </button>
      </section>

      <InfoPanel title="Nguyên tắc platform" icon={Sparkles}>
        <ChecklistRow done label="Theme không chứa business data" />
        <ChecklistRow done label="Page là component tree versioned" />
        <ChecklistRow done label="Component có schema/version" />
        <ChecklistRow done label="Production dùng published snapshot" />
        <ChecklistRow done label="Có rollback theo deployment" />
      </InfoPanel>
    </div>
  );

  const renderContent = () => {
    if (activeSection === 'pages') return renderPages();
    if (activeSection === 'themes') return renderThemes();
    if (activeSection === 'components') return renderComponents();
    if (activeSection === 'domains') return renderDomains();
    if (activeSection === 'publish') return renderPublish();
    if (activeSection === 'settings') return renderSettings();
    return renderOverview();
  };

  return (
    <div className="-m-4 min-h-[calc(100vh-64px)] bg-[#f4f1eb] p-4 lg:-m-6 lg:p-6">
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="flex min-h-[calc(100vh-120px)] flex-col xl:flex-row">
          <aside className="w-full border-b border-stone-200 bg-stone-950 text-white xl:w-80 xl:border-b-0 xl:border-r">
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-stone-950">
                  <PanelTop className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-amber-300">Com Thi No CMS</p>
                  <h1 className="font-serif text-2xl font-bold">Website Builder</h1>
                </div>
              </div>
              <select
                value={selectedSite?.id || ''}
                onChange={(event) => {
                  const nextSiteId = event.target.value;
                  setSiteId(nextSiteId);
                  const nextPage = pages.find((page) => page.siteId === nextSiteId);
                  setPageId(nextPage?.id || '');
                }}
                className="mt-5 h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm font-bold text-white outline-none focus:border-amber-400"
              >
                {sites.map((site) => <option key={site.id} value={site.id} className="text-stone-950">{site.name} · {site.industryType}</option>)}
              </select>
            </div>

            <nav className="grid gap-1 p-3 md:grid-cols-2 xl:block">
              {builderSections.map((section) => {
                const Icon = section.icon;
                const active = section.key === activeSection;
                return (
                  <button
                    key={section.key}
                    onClick={() => navigate(builderPath(section.key))}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      active ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-950/20' : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-black">{section.label}</span>
                      <span className={`block truncate text-xs font-semibold ${active ? 'text-stone-800' : 'text-white/50'}`}>{section.desc}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 bg-[#f7f3ed]">
            <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-700">Hospitality Website Builder</p>
                  <h2 className="mt-1 font-serif text-3xl font-bold text-stone-950">{builderSections.find((item) => item.key === activeSection)?.label}</h2>
                  <p className="mt-1 text-sm text-stone-500">Tách route và workflow kiểu WordPress, nhưng lõi vẫn schema-driven theo SRS.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold hover:bg-stone-50">
                    <RefreshCw className="h-4 w-4" />
                    Tải lại
                  </button>
                  <button onClick={saveDraft} disabled={saving || !selectedPage} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold hover:bg-stone-50 disabled:text-stone-300">
                    <Save className="h-4 w-4" />
                    Lưu draft
                  </button>
                  <button onClick={publish} disabled={saving || !selectedSite} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-white hover:bg-amber-700 disabled:bg-stone-300">
                    <Rocket className="h-4 w-4" />
                    Publish
                  </button>
                </div>
              </div>
            </header>

            <div className="p-5">
              {message && (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
                  {message}
                </div>
              )}
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper, success }: { label: string; value: any; helper: string; success?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${success ? 'border-emerald-200 bg-emerald-50' : 'border-stone-200 bg-white'}`}>
      <p className="text-xs font-black uppercase text-stone-400">{label}</p>
      <p className="mt-2 truncate text-3xl font-black text-stone-950">{value}</p>
      <p className="mt-1 truncate text-sm font-semibold text-stone-500">{helper}</p>
    </div>
  );
}

function InfoPanel({ title, icon: Icon, children }: { title: string; icon: any; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-amber-700" />
        <h2 className="font-serif text-2xl font-bold text-stone-950">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ChecklistRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 py-2 text-sm font-bold text-stone-700">
      {done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
      <span>{label}</span>
    </div>
  );
}

function InfoLine({ label, value, boxed }: { label: string; value: any; boxed?: boolean }) {
  return (
    <div className={boxed ? 'rounded-xl bg-stone-50 p-3' : 'flex justify-between gap-4 border-b border-stone-100 py-2 last:border-b-0'}>
      <span className="text-xs font-black uppercase text-stone-400">{label}</span>
      <b className="text-right text-sm text-stone-950">{value}</b>
    </div>
  );
}

function ViewportButton({ value, viewport, onClick, icon: Icon }: { value: 'desktop' | 'tablet' | 'mobile'; viewport: string; onClick: (value: 'desktop' | 'tablet' | 'mobile') => void; icon: any }) {
  const active = value === viewport;
  return (
    <button onClick={() => onClick(value)} className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${active ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'}`}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center">
      <p className="font-serif text-2xl font-bold text-stone-950">{title}</p>
      <p className="mt-2 text-sm font-semibold text-stone-500">{desc}</p>
    </div>
  );
}
