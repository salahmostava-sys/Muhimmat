import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';

const LOGIN_REMEMBER_KEY = 'muhimmat_login_remember';
const LOGIN_EMAIL_KEY = 'muhimmat_login_email';

interface SystemSettings {
  project_name_ar: string;
  project_name_en: string;
  project_subtitle_ar: string;
  project_subtitle_en: string;
  logo_url: string | null;
}

const Login = () => {
  const { signIn } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    dashboardService.getSystemSettings().then(({ data }) => {
      if (data) setSettings(data as SystemSettings);
    });
  }, []);

  useEffect(() => {
    try {
      const storedRemember = localStorage.getItem(LOGIN_REMEMBER_KEY);
      const wantRemember = storedRemember !== '0';
      setRememberMe(wantRemember);
      const savedEmail = localStorage.getItem(LOGIN_EMAIL_KEY);
      if (wantRemember && savedEmail) setEmail(savedEmail);
    } catch (e) {
      console.warn('[Login] could not read remembered email from storage', e);
    }
  }, []);

  const projectName = settings ? settings.project_name_ar : 'مهمة التوصيل';
  const projectSubtitle = settings ? settings.project_subtitle_ar : 'إدارة المناديب';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!email || !password) return;
    setLoading(true);
    let error: { message: string } | null = null;
    try {
      const res = await signIn(email, password);
      error = res.error;
    } finally {
      setLoading(false);
    }
    if (error) {
      const deactivatedMsg = 'هذا الحساب معطّل. تواصل مع المسؤول.';
      if (error.message === deactivatedMsg) {
        setLoginError(deactivatedMsg);
      } else {
        setLoginError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } else {
      try {
        if (rememberMe) {
          localStorage.setItem(LOGIN_REMEMBER_KEY, '1');
          localStorage.setItem(LOGIN_EMAIL_KEY, email.trim());
        } else {
          localStorage.setItem(LOGIN_REMEMBER_KEY, '0');
          localStorage.removeItem(LOGIN_EMAIL_KEY);
        }
      } catch (e) {
        console.warn('[Login] could not persist remember-me preference', e);
      }
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10" dir="rtl">
      {/* Theme toggle — fixed corner, does not overlap form */}
      <div className="fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={toggleTheme}
          className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground border border-border shadow-sm bg-card/80 backdrop-blur-sm"
          title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
        >
          {isDark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
        </button>
      </div>

      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-400">
        {/* Logo + brand — horizontal (side by side) */}
        <header className="flex flex-row items-center justify-center gap-4 sm:gap-5 mb-6 sm:mb-8 px-4 sm:px-6">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt=""
              className="shrink-0 w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-2xl object-contain shadow-md border border-border bg-card p-1"
            />
          ) : (
            <div
              className="shrink-0 w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shadow-md"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.75))' }}
              aria-hidden
            >
              🚀
            </div>
          )}
          <div className="min-w-0 flex-1 text-start">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight tracking-tight">
              {projectName}
            </h1>
            <p className="text-sm sm:text-[15px] text-muted-foreground mt-1.5 leading-relaxed">
              {projectSubtitle}
            </p>
          </div>
        </header>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-foreground mb-6 text-center">
            تسجيل الدخول
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="login-email" className="block text-[16px] font-semibold text-foreground">
                البريد الإلكتروني
              </label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com"
                required
                dir="ltr"
                autoComplete="email"
                className="h-[52px] px-4 text-[16px] leading-normal rounded-xl border-border bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="block text-[16px] font-semibold text-foreground">
                كلمة المرور
              </label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  autoComplete="current-password"
                  className="h-[52px] px-4 pe-12 text-[16px] leading-normal rounded-xl border-border bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  aria-label={showPw ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember me: في RTL العنصر الأول يظهر يميناً — مربع الاختيار يمين النص */}
            <div className="flex items-center gap-3 pt-1">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
                className="h-5 w-5 shrink-0 rounded-md border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="remember-me"
                className="text-[16px] text-foreground cursor-pointer select-none leading-snug flex-1 min-w-0 text-start"
              >
                تذكرني على هذا الجهاز
              </label>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2.5 animate-in slide-in-from-top-1 fade-in duration-200">
                <span className="text-sm" aria-hidden>
                  ⚠️
                </span>
                <p className="text-destructive text-sm">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] rounded-xl font-bold text-[16px] text-primary-foreground shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-[1.03] active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none disabled:hover:shadow-md flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.82) 100%)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin shrink-0" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-8 pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center">
            <Link
              to="/forgot-password"
              className="text-[15px] font-medium text-primary hover:underline underline-offset-4 transition-colors"
            >
              نسيت كلمة المرور؟
            </Link>
            <a
              href="mailto:?subject=%D8%B7%D9%84%D8%A8%20%D8%AD%D8%B3%D8%A7%D8%A8%20%D8%AC%D8%AF%D9%8A%D8%AF%20%D9%81%D9%8A%20%D9%85%D9%87%D9%85%D8%A9%20%D8%A7%D9%84%D8%AA%D9%88%D8%B5%D9%8A%D9%84"
              className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              طلب إنشاء حساب
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {`جميع الحقوق محفوظة © ${new Date().getFullYear()}`}
        </p>
      </div>
    </div>
  );
};

export default Login;
