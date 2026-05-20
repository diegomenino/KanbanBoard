import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ResponsiveAppLayout } from "@/components/shell/responsive-app-layout";
import { getDictionary } from "@/lib/i18n";
import { getBoardsForUser, getSessionUser } from "@/lib/queries";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const boards = getBoardsForUser(user.id);
  const pathname = (await headers()).get("x-pathname") ?? "/app";
  const dictionary = getDictionary(user.preferenceLanguage);

  return (
    <div className="app-frame">
      <ResponsiveAppLayout
        sidebar={
          <AppSidebar
            boards={boards}
            pathname={pathname}
            user={user}
            labels={{
              appName: dictionary.appName,
              overview: dictionary.overview,
              adminSettings: dictionary.adminSettings,
              userSettings: dictionary.userSettings,
              boardSettings: dictionary.boardSettings,
              boards: dictionary.boards,
              newBoard: dictionary.newBoard,
              createBoard: dictionary.createBoard,
              boardName: dictionary.boardName,
              logOut: dictionary.logOut,
            }}
          />
        }
      >
        {children}
      </ResponsiveAppLayout>
    </div>
  );
}
