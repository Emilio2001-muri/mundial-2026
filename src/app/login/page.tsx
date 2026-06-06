'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from '@/types/forms'
import { createClient } from '@/lib/supabase/client'
import { registerUser } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, User, Lock, UserPlus, LogIn } from 'lucide-react'

const REMEMBER_KEY = 'mundial2026_remembered_user'

// Converts display name to internal email for Supabase Auth (login only)
function toInternalEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, 40) || 'user'
  return `${slug}@mundial2026.app`
}

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [remember, setRemember] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // ── Login form ──────────────────────────────────────────────────
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  // Pre-fill saved username on mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(REMEMBER_KEY) : null
    if (saved) {
      loginForm.setValue('username', saved)
      setRemember(true)
    }
  }, [loginForm])

  const onLogin = async (values: LoginValues) => {
    setError(null)
    startTransition(async () => {
      const email = values.username.includes('@')
        ? values.username
        : toInternalEmail(values.username)
      const { error } = await supabase.auth.signInWithPassword({ email, password: values.password })
      if (error) {
        setError('Nombre de usuario o contraseña incorrectos.')
      } else {
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, values.username)
        } else {
          localStorage.removeItem(REMEMBER_KEY)
        }
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  // ── Register form ───────────────────────────────────────────────
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  })

  const onRegister = async (values: RegisterValues) => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      // Server action creates user with email_confirm:true (no email needed)
      const result = await registerUser(values.display_name, values.password)
      if (result.error) {
        setError(result.error)
        return
      }
      // Auto sign-in after successful registration
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: result.email!,
        password: values.password,
      })
      if (loginError) {
        setSuccess('¡Cuenta creada! Ahora inicia sesión con tu nombre.')
        setTab('login')
        registerForm.reset()
        loginForm.setValue('username', values.display_name)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm space-y-8"
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-3xl font-black gradient-text">Mundial 2026</h1>
          <p className="text-muted-foreground text-sm">La quiniela más premium del torneo</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-muted p-1 gap-1">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); setSuccess(null) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === 'login' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Entrar
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); setSuccess(null) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === 'register' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Crear cuenta
          </button>
        </div>

        {/* Forms */}
        <AnimatePresence mode="wait">
          {tab === 'login' ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              onSubmit={loginForm.handleSubmit(onLogin)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5" htmlFor="username">
                  <User className="w-3.5 h-3.5" /> Nombre de usuario
                </label>
                <Input id="username" type="text" autoComplete="username" placeholder="tu nombre"
                  {...loginForm.register('username')} />
                {loginForm.formState.errors.username && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.username.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5" htmlFor="login_password">
                  <Lock className="w-3.5 h-3.5" /> Contraseña
                </label>
                <Input id="login_password" type="password" autoComplete="current-password" placeholder="••••••••"
                  {...loginForm.register('password')} />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-input accent-primary cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                  Recordarme
                </label>
              </div>
              {success && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3">
                  <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                </div>
              )}
              {error && <ErrorBanner message={error} />}
              <Button type="submit" variant="gradient" size="lg" className="w-full" loading={isPending}>
                Entrar
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              onSubmit={registerForm.handleSubmit(onRegister)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5" htmlFor="display_name">
                  <User className="w-3.5 h-3.5" /> Tu nombre (visible para todos)
                </label>
                <Input id="display_name" type="text" autoComplete="nickname"
                  placeholder="ej. Emilio, ElMáquina…"
                  {...registerForm.register('display_name')} />
                {registerForm.formState.errors.display_name && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.display_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5" htmlFor="reg_password">
                  <Lock className="w-3.5 h-3.5" /> Contraseña
                </label>
                <Input id="reg_password" type="password" autoComplete="new-password"
                  placeholder="mínimo 6 caracteres"
                  {...registerForm.register('password')} />
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5" htmlFor="confirm_password">
                  <Lock className="w-3.5 h-3.5" /> Confirmar contraseña
                </label>
                <Input id="confirm_password" type="password" autoComplete="new-password"
                  placeholder="repite tu contraseña"
                  {...registerForm.register('confirm_password')} />
                {registerForm.formState.errors.confirm_password && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.confirm_password.message}</p>
                )}
              </div>
              {error && <ErrorBanner message={error} />}
              <Button type="submit" variant="gradient" size="lg" className="w-full" loading={isPending}>
                Crear cuenta
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground">
          Crea tu cuenta con un nombre y contraseña · Sin email necesario
        </p>
      </motion.div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3">
      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}
