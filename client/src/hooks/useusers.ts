import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  usersRef, 
  db, 
  createUser,
  getUserById 
} from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { queryClient } from "@/lib/queryClient";
import { User, InsertUser } from "@shared/schema";
import { getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

export function useUsers() {
  const { user: currentUser } = useAuth();
  
  // Get all users
  const { 
    data: users, 
    isLoading: isLoadingUsers, 
    error: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const usersSnapshot = await getDocs(usersRef);
      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    },
    enabled: !!currentUser
  });
  
  // Get a single user by ID
  const getUser = (userId: string) => {
    return useQuery({
      queryKey: ['/api/users', userId],
      queryFn: async () => {
        if (!userId) return null;
        return getUserById(userId);
      },
      enabled: !!userId
    });
  };
  
  // Create a new user
  const createUserMutation = useMutation({
    mutationFn: async (newUser: InsertUser) => {
      return createUser(newUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });
  
  // Update an existing user
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, data);
      return { id: userId, ...data };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });
  
  // Delete a user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Safety check to prevent deleting yourself
      if (userId === currentUser?.id) {
        throw new Error("You cannot delete your own account");
      }
      
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
      return { id: userId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });
  
  return {
    users,
    isLoadingUsers,
    usersError,
    refetchUsers,
    getUser,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isCreatingUser: createUserMutation.isPending,
    isUpdatingUser: updateUserMutation.isPending,
    isDeletingUser: deleteUserMutation.isPending
  };
}
