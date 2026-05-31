import { auth } from "@/auth";
import { signOut } from "@/auth";
import Link from "next/link";
import { LayoutGrid, User } from "lucide-react";
import SearchBar from "./SearchBar";
import CategoryNav from "./CategoryNav";
import CartIcon from "./CartIcon";

export default async function Header() {
  const session = await auth();

  return (
    <header className="bg-background border-b border-border">
      {/* 1행: 로고 + 검색창 + 아이콘 메뉴 */}
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-6">

        {/* 로고 */}
        <Link href="/" className="text-xl font-bold text-primary shrink-0">
          ShopApp
        </Link>

        {/* 검색창 */}
        <SearchBar />

        {/* 우측 아이콘 메뉴 */}
        <nav className="flex items-center gap-5 shrink-0">
          <Link href="/products" className="flex flex-col items-center gap-0.5 text-foreground hover:text-primary transition-colors">
            <LayoutGrid size={22} />
            <span className="text-xs">카테고리</span>
          </Link>
          <Link
            href={session ? "/mypage" : "/login"}
            className="flex flex-col items-center gap-0.5 text-foreground hover:text-primary transition-colors"
          >
            <User size={22} />
            <span className="text-xs">{session ? "마이쇼핑" : "로그인"}</span>
          </Link>
          <CartIcon />
          {session?.user.role === "admin" && (
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              관리자
            </Link>
          )}
          {session && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                로그아웃
              </button>
            </form>
          )}
        </nav>
      </div>

      {/* 2행: 카테고리 탭 */}
      <CategoryNav />
    </header>
  );
}
