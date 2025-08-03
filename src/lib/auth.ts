import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { syncUserWithDatabase } from './sync-user';

export async function getUserId() {
  const user = await getUser();
  
  if (!user || !user.dbUser || !user.dbId) {
    redirect("/login");
  }
  
  return user.dbId;
}

export async function getUser() {
  const { getUser: getKindeUser, isAuthenticated } = getKindeServerSession();
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    return null;
  }
  
  const kindeUser = await getKindeUser();
  
  if (kindeUser) {
    // Sync with database and get the database user
    const dbUser = await syncUserWithDatabase(kindeUser);
    return {
      ...kindeUser,
      dbId: dbUser.id, // Database ID for references
      dbUser: dbUser
    };
  }
  
  return null;
}