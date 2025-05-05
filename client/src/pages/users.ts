import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User as UserType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getUsers, updateUser, deleteUser } from "@/lib/api";
import { Search, User, Edit, Trash2, MoreHorizontal, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

interface ExtendedUser extends UserType {
  editing?: boolean;
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [editUser, setEditUser] = useState<ExtendedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ExtendedUser | null>(null);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Fetch all users
  const { 
    data: users, 
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const usersList = await getUsers();
      return usersList as ExtendedUser[];
    },
    enabled: !!currentUser
  });
  
  // Filter users based on search term
  const filteredUsers = users?.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleEditUser = (user: ExtendedUser) => {
    setEditUser(user);
    setNewDisplayName(user.displayName || "");
    setNewUsername(user.username || "");
  };
  
  const handleUpdateUser = async () => {
    if (!editUser) return;
    
    setIsSubmitting(true);
    try {
      await updateUser(editUser.id, {
        displayName: newDisplayName,
        username: newUsername
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User updated",
        description: "User information has been updated successfully.",
      });
      
      setEditUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsSubmitting(true);
    try {
      // Don't allow deleting yourself
      if (userToDelete.id === currentUser?.id) {
        throw new Error("You cannot delete your own account.");
      }
      
      await deleteUser(userToDelete.id);
      
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
      
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-500">Manage bank users and permissions</p>
        </div>
        
        <div className="w-full md:w-auto relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            className="pl-9 w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card className="border border-gray-200">
        <CardHeader className="pb-1 border-b border-gray-200">
          <CardTitle>Bank Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full mr-3" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">Error loading users. Please try again later.</p>
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={user.photoURL || undefined} />
                          <AvatarFallback>
                            {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName || "N/A"}</p>
                          <p className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.username || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setUserToDelete(user)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-1">No users found</h3>
              <p className="text-gray-500">
                {searchTerm ? `No users match your search for "${searchTerm}"` : "No users available"}
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchTerm("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {editUser?.displayName || editUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Display Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={editUser?.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditUser(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <AlertDialog 
        open={!!userToDelete} 
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the user {userToDelete?.displayName || userToDelete?.username} and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
