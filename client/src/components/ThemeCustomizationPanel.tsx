import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Save, RotateCcw, Eye, Download, Upload } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ThemeConfig {
  fonts?: {
    primary?: string;
    heading?: string;
  };
  colors?: {
    background?: {
      main?: string;
      card?: string;
      sidebar?: string;
    };
    navigation?: {
      header?: string;
      mobileNav?: string;
      footer?: string;
    };
    primary?: {
      main?: string;
      secondary?: string;
      accent?: string;
    };
    buttons?: {
      primary?: string;
      secondary?: string;
      danger?: string;
    };
    pages?: {
      login?: string;
      profile?: string;
      chat?: string;
    };
  };
}

export function ThemeCustomizationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load current settings including theme config
  const { data: settings } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>((settings?.themeConfig as ThemeConfig) || {});

  // Update theme configuration locally
  const updateThemeConfig = (path: string[], value: string) => {
    setThemeConfig(prev => {
      const newConfig = { ...prev } as any;
      let current = newConfig;
      
      // Navigate to the parent of the target property
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      // Set the final value
      current[path[path.length - 1]] = value;
      return newConfig;
    });
  };

  // Save theme configuration to server
  const saveThemeMutation = useMutation({
    mutationFn: async (config: ThemeConfig) => {
      const res = await apiRequest("PUT", "/api/admin/settings", {
        themeConfig: config
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Theme configuration saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset to default theme
  const resetTheme = () => {
    const defaultTheme: ThemeConfig = {
      fonts: {
        primary: 'Inter',
        heading: 'Inter'
      },
      colors: {
        background: {
          main: '#ffffff',
          card: '#f8fafc',
          sidebar: '#1f2937'
        },
        navigation: {
          header: '#ffffff',
          mobileNav: '#ffffff',
          footer: '#f8fafc'
        },
        primary: {
          main: '#06b6d4',
          secondary: '#8b5cf6',
          accent: '#f59e0b'
        },
        buttons: {
          primary: '#06b6d4',
          secondary: '#6b7280',
          danger: '#dc2626'
        },
        pages: {
          login: '#f0f9ff',
          profile: '#fefce8',
          chat: '#f3f4f6'
        }
      }
    };
    setThemeConfig(defaultTheme);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center">
        <Palette className="w-5 h-5 mr-2" />
        Theme Customization
      </h3>
      
      {/* Theme Configuration Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Typography Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">Typography</h4>
          
          <div>
            <Label htmlFor="primary-font">Primary Font</Label>
            <Select 
              value={themeConfig?.fonts?.primary || 'Inter'}
              onValueChange={(value) => updateThemeConfig(['fonts', 'primary'], value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Poppins">Poppins</SelectItem>
                <SelectItem value="Nunito">Nunito</SelectItem>
                <SelectItem value="Lato">Lato</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="heading-font">Heading Font</Label>
            <Select 
              value={themeConfig?.fonts?.heading || 'Inter'}
              onValueChange={(value) => updateThemeConfig(['fonts', 'heading'], value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Poppins">Poppins</SelectItem>
                <SelectItem value="Nunito">Nunito</SelectItem>
                <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                <SelectItem value="Merriweather">Merriweather</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Background Colors */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">Background Colors</h4>
          
          <div>
            <Label htmlFor="main-bg">Main Background</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.background?.main || '#ffffff'}
                onChange={(e) => updateThemeConfig(['colors', 'background', 'main'], e.target.value)}
              />
              <Input 
                placeholder="#ffffff"
                className="flex-1"
                value={themeConfig?.colors?.background?.main || '#ffffff'}
                onChange={(e) => updateThemeConfig(['colors', 'background', 'main'], e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="card-bg">Card Background</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.background?.card || '#f8fafc'}
                onChange={(e) => updateThemeConfig(['colors', 'background', 'card'], e.target.value)}
              />
              <Input 
                placeholder="#f8fafc"
                className="flex-1"
                value={themeConfig?.colors?.background?.card || '#f8fafc'}
                onChange={(e) => updateThemeConfig(['colors', 'background', 'card'], e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sidebar-bg">Sidebar Background</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.background?.sidebar || '#1f2937'}
                onChange={(e) => updateThemeConfig(['colors', 'background', 'sidebar'], e.target.value)}
              />
              <Input 
                placeholder="#1f2937"
                className="flex-1"
                value={themeConfig?.colors?.background?.sidebar || '#1f2937'}
                onChange={(e) => updateThemeConfig(['colors', 'background', 'sidebar'], e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Navigation Colors */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">Navigation</h4>
          
          <div>
            <Label htmlFor="header-bg">Header Background</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.navigation?.header || '#ffffff'}
                onChange={(e) => updateThemeConfig(['colors', 'navigation', 'header'], e.target.value)}
              />
              <Input 
                placeholder="#ffffff"
                className="flex-1"
                value={themeConfig?.colors?.navigation?.header || '#ffffff'}
                onChange={(e) => updateThemeConfig(['colors', 'navigation', 'header'], e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="mobile-nav-bg">Mobile Navbar</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.navigation?.mobileNav || '#ffffff'}
                onChange={(e) => updateThemeConfig(['colors', 'navigation', 'mobileNav'], e.target.value)}
              />
              <Input 
                placeholder="#ffffff"
                className="flex-1"
                value={themeConfig?.colors?.navigation?.mobileNav || '#ffffff'}
                onChange={(e) => updateThemeConfig(['colors', 'navigation', 'mobileNav'], e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="footer-bg">Footer Background</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.navigation?.footer || '#f8fafc'}
                onChange={(e) => updateThemeConfig(['colors', 'navigation', 'footer'], e.target.value)}
              />
              <Input 
                placeholder="#f8fafc"
                className="flex-1"
                value={themeConfig?.colors?.navigation?.footer || '#f8fafc'}
                onChange={(e) => updateThemeConfig(['colors', 'navigation', 'footer'], e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Primary Colors */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">Primary Colors</h4>
          
          <div>
            <Label htmlFor="primary">Primary Color</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.primary?.main || '#06b6d4'}
                onChange={(e) => updateThemeConfig(['colors', 'primary', 'main'], e.target.value)}
              />
              <Input 
                placeholder="#06b6d4"
                className="flex-1"
                value={themeConfig?.colors?.primary?.main || '#06b6d4'}
                onChange={(e) => updateThemeConfig(['colors', 'primary', 'main'], e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="secondary">Secondary Color</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.primary?.secondary || '#8b5cf6'}
                onChange={(e) => updateThemeConfig(['colors', 'primary', 'secondary'], e.target.value)}
              />
              <Input 
                placeholder="#8b5cf6"
                className="flex-1"
                value={themeConfig?.colors?.primary?.secondary || '#8b5cf6'}
                onChange={(e) => updateThemeConfig(['colors', 'primary', 'secondary'], e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="accent">Accent Color</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.primary?.accent || '#f59e0b'}
                onChange={(e) => updateThemeConfig(['colors', 'primary', 'accent'], e.target.value)}
              />
              <Input 
                placeholder="#f59e0b"
                className="flex-1"
                value={themeConfig?.colors?.primary?.accent || '#f59e0b'}
                onChange={(e) => updateThemeConfig(['colors', 'primary', 'accent'], e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Button Colors */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">Buttons</h4>
          
          <div>
            <Label htmlFor="btn-primary">Primary Button</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.buttons?.primary || '#06b6d4'}
                onChange={(e) => updateThemeConfig(['colors', 'buttons', 'primary'], e.target.value)}
              />
              <Input 
                placeholder="#06b6d4"
                className="flex-1"
                value={themeConfig?.colors?.buttons?.primary || '#06b6d4'}
                onChange={(e) => updateThemeConfig(['colors', 'buttons', 'primary'], e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="btn-secondary">Secondary Button</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.buttons?.secondary || '#6b7280'}
                onChange={(e) => updateThemeConfig(['colors', 'buttons', 'secondary'], e.target.value)}
              />
              <Input 
                placeholder="#6b7280"
                className="flex-1"
                value={themeConfig?.colors?.buttons?.secondary || '#6b7280'}
                onChange={(e) => updateThemeConfig(['colors', 'buttons', 'secondary'], e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="btn-danger">Danger Button</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.buttons?.danger || '#dc2626'}
                onChange={(e) => updateThemeConfig(['colors', 'buttons', 'danger'], e.target.value)}
              />
              <Input 
                placeholder="#dc2626"
                className="flex-1"
                value={themeConfig?.colors?.buttons?.danger || '#dc2626'}
                onChange={(e) => updateThemeConfig(['colors', 'buttons', 'danger'], e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Special Pages */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">Special Pages</h4>
          
          <div>
            <Label htmlFor="login-bg">Login Page Background</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.pages?.login || '#f0f9ff'}
                onChange={(e) => updateThemeConfig(['colors', 'pages', 'login'], e.target.value)}
              />
              <Input 
                placeholder="#f0f9ff"
                className="flex-1"
                value={themeConfig?.colors?.pages?.login || '#f0f9ff'}
                onChange={(e) => updateThemeConfig(['colors', 'pages', 'login'], e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="profile-bg">Profile Page Background</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.pages?.profile || '#fefce8'}
                onChange={(e) => updateThemeConfig(['colors', 'pages', 'profile'], e.target.value)}
              />
              <Input 
                placeholder="#fefce8"
                className="flex-1"
                value={themeConfig?.colors?.pages?.profile || '#fefce8'}
                onChange={(e) => updateThemeConfig(['colors', 'pages', 'profile'], e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="chat-bg">Chat Page Background</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                value={themeConfig?.colors?.pages?.chat || '#f3f4f6'}
                onChange={(e) => updateThemeConfig(['colors', 'pages', 'chat'], e.target.value)}
              />
              <Input 
                placeholder="#f3f4f6"
                className="flex-1"
                value={themeConfig?.colors?.pages?.chat || '#f3f4f6'}
                onChange={(e) => updateThemeConfig(['colors', 'pages', 'chat'], e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Theme Actions */}
      <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t">
        <Button 
          className="flex items-center"
          onClick={() => saveThemeMutation.mutate(themeConfig)}
          disabled={saveThemeMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Theme
        </Button>
        <Button variant="outline" className="flex items-center" onClick={resetTheme}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </Button>
        <Button variant="outline" className="flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          Preview Changes
        </Button>
        <Button variant="secondary" className="flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Export Theme
        </Button>
        <Button variant="secondary" className="flex items-center">
          <Upload className="w-4 h-4 mr-2" />
          Import Theme
        </Button>
      </div>

      {/* Theme Preview */}
      <div className="mt-8 p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
        <h4 className="font-medium mb-4">Live Preview</h4>
        <div className="space-y-4">
          {/* Sample components with applied theme */}
          <div className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: themeConfig?.colors?.background?.card || '#f8fafc' }}>
            <h5 className="font-semibold" style={{ 
              fontFamily: themeConfig?.fonts?.heading || 'Inter', 
              color: themeConfig?.colors?.primary?.main || '#06b6d4' 
            }}>
              Sample Card Component
            </h5>
            <p className="text-sm mt-2" style={{ fontFamily: themeConfig?.fonts?.primary || 'Inter' }}>
              This shows how your theme changes will look across the application.
            </p>
            <div className="flex space-x-2 mt-3">
              <Button 
                size="sm" 
                style={{ backgroundColor: themeConfig?.colors?.buttons?.primary || '#06b6d4' }}
              >
                Primary
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                style={{ borderColor: themeConfig?.colors?.buttons?.secondary || '#6b7280' }}
              >
                Secondary
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}