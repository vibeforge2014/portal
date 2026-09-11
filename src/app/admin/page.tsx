import { AdminApp } from "@/components/admin/AdminApp";
import "./admin.css";

export const metadata = { title: "ZenSoft 管理后台", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminPage() { return <AdminApp />; }
