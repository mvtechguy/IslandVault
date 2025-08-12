import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { BrandingProvider } from "@/hooks/use-branding";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import AdminPage from "@/pages/admin-page";
import BuyCoinsPage from "@/pages/buy-coins-page";
import OnboardPage from "@/pages/onboard-page";
import PostDetailPage from "@/pages/post-detail-page";
import BrowsePostsPage from "@/pages/browse-posts-page";
import CreatePostPage from "@/pages/create-post-page";
import DebugCreate from "@/pages/debug-create";


function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboard">
        <ProtectedRoute>
          <OnboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>
      <Route path="/coins">
        <ProtectedRoute>
          <BuyCoinsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute requireAdmin>
          <AdminPage />
        </ProtectedRoute>
      </Route>
      <Route path="/browse">
        <ProtectedRoute>
          <BrowsePostsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/posts/:id">
        <ProtectedRoute>
          <PostDetailPage />
        </ProtectedRoute>
      </Route>
      <Route path="/create">
        <ProtectedRoute>
          <DebugCreate />
        </ProtectedRoute>
      </Route>
      <Route path="/create-full">
        <ProtectedRoute>
          <CreatePostPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrandingProvider>
    </QueryClientProvider>
  );
}

export default App;
