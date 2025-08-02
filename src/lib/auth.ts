import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

export async function getUserId() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user || !user.id) {
    redirect("/login");
  }
  
  return user.id;
}

export async function getUser() {
  const { getUser, isAuthenticated } = getKindeServerSession();
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    return null;
  }
  
  return await getUser();
}