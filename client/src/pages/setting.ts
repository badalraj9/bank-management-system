import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertCircle,
  Bell, 
  CreditCard, 
  Eye, 
  EyeOff, 
  Lock, 
  Shield,
  Smartphone,
  User,
  Palette
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";
import { updateUser } from "@/lib/api";

// Form schemas
const profileFormSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  bio: z.string().max(160).optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Please enter your current password.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Please confirm your new password.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [themeColor, setThemeColor] = useState<string>("blue");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Simulate user preferences
  const [preferences, setPreferences] = useState({
    twoFactorAuth: false,
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    smsAlerts: true,
    darkMode: false,
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username || "",
      displayName: user?.displayName || "",
      email: user?.email || "",
      bio: "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      if (!user) return;
      
      await updateUser(user.id, {
        username: data.username,
        displayName: data.displayName,
        email: data.email,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle password update
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      // This is just a mock function since we don't have actual password change functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle preference toggle
  const handleTogglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    toast({
      title: "Preference updated",
      description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} has been ${preferences[key] ? 'disabled' : 'enabled'}.`,
    });
  };

  // Handle theme change
  const handleThemeChange = (color: string) => {
    setThemeColor(color);
    
    toast({
      title: "Theme updated",
      description: `Theme color changed to ${color}.`,
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500">Manage your account settings and preferences</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and public profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback className="text-lg">
                      {user?.displayName?.charAt(0) || user?.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                </div>
                
                <div className="flex-1">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Display Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Email" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Input placeholder="Tell us about yourself" {...field} />
                            </FormControl>
                            <FormDescription>
                              Brief description for your profile. Maximum 160 characters.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="py-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="Enter current password" 
                              type={showPassword ? "text" : "password"} 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input placeholder="New password" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input placeholder="Confirm new password" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500">
                      Protect your account with an additional verification step.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.twoFactorAuth}
                  onCheckedChange={() => handleTogglePreference('twoFactorAuth')}
                />
              </div>
              
              {!preferences.twoFactorAuth && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Two-factor authentication is disabled</AlertTitle>
                  <AlertDescription>
                    Enable two-factor authentication for enhanced security.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications and alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <Label className="font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive important updates via email</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={() => handleTogglePreference('emailNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <Label className="font-medium">Push Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications on your devices</p>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={() => handleTogglePreference('pushNotifications')}
                  />
                </div>
                
                <div className="flex items-center justify-between pb-3 border-b">
                  <div>
                    <Label className="font-medium">SMS Alerts</Label>
                    <p className="text-sm text-gray-500">Receive time-sensitive alerts via SMS</p>
                  </div>
                  <Switch
                    checked={preferences.smsAlerts}
                    onCheckedChange={() => handleTogglePreference('smsAlerts')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Marketing Emails</Label>
                    <p className="text-sm text-gray-500">Receive offers and updates about our services</p>
                  </div>
                  <Switch
                    checked={preferences.marketingEmails}
                    onCheckedChange={() => handleTogglePreference('marketingEmails')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of the banking portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-md font-medium mb-3">Theme Mode</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <Switch
                    id="dark-mode"
                    checked={preferences.darkMode}
                    onCheckedChange={() => handleTogglePreference('darkMode')}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-md font-medium mb-3">Theme Color</h3>
                <div className="grid grid-cols-5 gap-4">
                  {["blue", "teal", "green", "purple", "orange"].map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-full transition-all ${
                        themeColor === color ? "ring-2 ring-offset-2 ring-black" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleThemeChange(color)}
                      aria-label={`${color} theme`}
                    />
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-md font-medium mb-3">Language</h3>
                <Select defaultValue="en">
                  <SelectTrigger className="w-full md:w-[240px]">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English (US)</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="jp">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payment Tab */}
        <TabsContent value="payment" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Demo Mode</AlertTitle>
                  <AlertDescription>
                    This is a demo application. Payment methods functionality is limited.
                  </AlertDescription>
                </Alert>
                
                <div className="rounded-md border p-4 flex items-start space-x-4">
                  <CreditCard className="h-8 w-8 text-gray-600" />
                  <div className="flex-1">
                    <h3 className="font-medium">Visa ending in 4242</h3>
                    <p className="text-sm text-gray-500">Expires 12/2025</p>
                    <div className="mt-2 flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-600">Remove</Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="block font-medium text-black">Default</span>
                    Last used: Yesterday
                  </div>
                </div>
                
                <Button className="mt-4" variant="outline">
                  + Add New Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
              <CardDescription>
                Manage your billing information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border p-4">
                <h3 className="font-medium">Primary Address</h3>
                <p className="text-sm mt-1">
                  123 Main Street<br />
                  Apt 4B<br />
                  New York, NY 10001<br />
                  United States
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}