"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Shield, Zap } from "lucide-react"
import { account } from "@/lib/appwrite"

function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("All fields are required.")
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      setIsLoading(false)
      return
    }

    try {
      try {
        await account.deleteSession('current')
      } catch (err) {
        console.log("No existing session to delete")
      }

      const session = await account.createEmailPasswordSession(email, password)
      
      if (session) {
        console.log("Login successful:", session)

        setTimeout(() => {
          router.push("/dashboard")
        }, 100)
      }
    } catch (err: any) {
      console.error("Login error:", err)
      
      let errorMessage = "Login failed. Please try again."
      
      if (err.code === 401) {
        errorMessage = "Invalid email or password."
      } else if (err.code === 429) {
        errorMessage = "Too many login attempts. Please try again later."
      } else if (err.code === 400) {
        errorMessage = "Invalid email format."
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      
      try {
        await account.deleteSession('current')
      } catch (err) {
        
        console.log("No existing session to delete")
      }

      
      await account.createOAuth2Session(
        "google",
        `${window.location.origin}/dashboard`,
        `${window.location.origin}/login`
      )
    } catch (err: any) {
      console.error("Google login error:", err)
      setError("Google login failed. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">Log in to your FreelanceFlow account</p>
        </div>

        {/* Login Card */}
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-2xl font-semibold">Log In</CardTitle>
            <CardDescription className="text-muted-foreground">
              Log in with Google or email
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

             <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 text-base font-medium"
              type="button"
            >
              {isLoading ? (
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign In with Google
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging In...
                  </>
                ) : (
                  "Sign In with Email"
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <a href="/register" className="text-primary hover:underline font-medium">
                  Register here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trust Icons */}
        <div className="flex items-center justify-center space-x-8 text-muted-foreground">
          <div className="flex items-center space-x-2 text-xs">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Bank-level security</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <Zap className="h-4 w-4 text-blue-600" />
            <span>Instant setup</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage;