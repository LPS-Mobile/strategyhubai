import { db } from '@/lib/firebase';
import { collection, getDocs, CollectionReference, DocumentData } from 'firebase/firestore';
import { Strategy } from '@/app/strategies/page';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'; // <-- NEW

// Define a User type (you can expand this)
export interface AdminUser {
  id: string;
  email: string | null;
  displayName: string | null;
  subscriptionStatus: 'active' | 'inactive' | null;
  role: 'admin' | null;
}

// --- ☁️ SERVER-SIDE DATA FETCHING ---

async function getStrategiesForAdmin(): Promise<Strategy[]> {
  // ... (your existing function, no changes)
  const strategiesCol = collection(db, 'strategies') as CollectionReference<DocumentData>;
  const querySnapshot = await getDocs(strategiesCol);
  const strategies: Strategy[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    strategies.push({
      id: doc.id,
      ...(data as Omit<Strategy, 'id'>),
    } as Strategy);
  });
  return strategies;
}

// --- NEW FUNCTION TO FETCH USERS ---
async function getUsersForAdmin(): Promise<AdminUser[]> {
  try {
    const usersCol = collection(db, 'users') as CollectionReference<DocumentData>;
    const querySnapshot = await getDocs(usersCol);

    const users: AdminUser[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email || null,
        displayName: data.displayName || null,
        subscriptionStatus: data.subscriptionStatus || null,
        role: data.role || null,
      });
    });
    
    return users;
  } catch (error) {
    console.error("🔥 Error fetching users for admin dashboard:", error);
    return [];
  }
}

// --- 🌐 ADMIN PAGE COMPONENT (Updated) ---

export default async function AdminPage() {
  // Fetch BOTH data sets on the server
  const strategies = await getStrategiesForAdmin();
  const users = await getUsersForAdmin();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-10 border-b pb-4">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Strategy Hub Admin
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Manage platform content and users.
        </p>
      </header>
      
      {/* Pass both sets of data to a new Client Component
          that will handle the tab switching and logic.
      */}
      <AdminDashboardClient 
        initialStrategies={strategies} 
        initialUsers={users} 
      />
    </div>
  );
}